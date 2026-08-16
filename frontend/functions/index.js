/**
 * Campus Voice — Cloud Functions
 *
 * IMPORTANT CONTEXT FOR THE EMAIL DELIVERY INVESTIGATION:
 * Password reset emails ("Forgot password?" on the login page) are sent
 * entirely by Firebase Authentication's own hosted email service — they do
 * NOT go through this file, this Gmail account, or any SMTP config below.
 * There is no SMTP host/port/encryption to configure for password reset;
 * Firebase Auth owns that delivery pipeline end to end. If those emails
 * aren't arriving, the fix lives in the Firebase Console (Authentication →
 * Templates, Authentication → Settings → Authorized domains) or in Google
 * Workspace/Gmail spam filtering — not in this codebase. See EMAIL_DELIVERY.md at the project root
 * for a step-by-step investigation checklist.
 *
 * What DOES live in this file: the "your complaint was resolved" email,
 * sent via Gmail SMTP through nodemailer whenever a complaint's status
 * flips to Completed. This was previously broken for a structural reason:
 * it read credentials with `functions.config()`, the Firebase Functions v1
 * config API, which Google deprecated and has been shutting off through
 * 2025–2026 — so this call could throw before ever reaching Gmail,
 * independent of whether the Gmail credentials themselves were correct.
 * It's rewritten below on the current v2 API using Secret Manager, which
 * is what functions:config() was replaced with.
 *
 * Setup required after this change (see EMAIL_DELIVERY.md for full detail):
 *   firebase functions:secrets:set GMAIL_USER
 *   firebase functions:secrets:set GMAIL_APP_PASSWORD
 *   firebase deploy --only functions
 * GMAIL_APP_PASSWORD must be a 16-character Google "App Password" (requires
 * 2-Step Verification on that Gmail account) — a normal Gmail password will
 * be rejected by Gmail's SMTP server (535 authentication error).
 */

const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret, defineInt } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

const GMAIL_USER = defineSecret("GMAIL_USER");
const GMAIL_APP_PASSWORD = defineSecret("GMAIL_APP_PASSWORD");

// Configurable without a redeploy of the alerting *logic* — change these
// via `firebase functions:config` equivalents or just edit + redeploy.
const FAILURE_ALERT_THRESHOLD = defineInt("EMAIL_FAILURE_ALERT_THRESHOLD", { default: 5 });
const ALERT_WINDOW_MINUTES = defineInt("EMAIL_ALERT_WINDOW_MINUTES", { default: 60 });

// How long a resolved ticket sticks around before the daily cleanup job
// deletes it. Change without a code edit via:
//   firebase functions:secrets:set COMPLETED_RETENTION_DAYS
// (or just edit the default below and redeploy).
const COMPLETED_RETENTION_DAYS = defineInt("COMPLETED_RETENTION_DAYS", { default: 90 });

const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000; // 1s, then 2s, then 4s

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends one email with retry + exponential backoff. Every attempt — success
 * or failure — writes a record to `emailLogs` with the specific error code,
 * message, SMTP response, timestamp, recipient, and attempt number, so
 * delivery problems are diagnosable from Firestore instead of only from
 * ephemeral function logs.
 */
async function sendMailWithRetry(transporter, mailOptions, meta) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      await db.collection("emailLogs").add({
        recipient: mailOptions.to,
        subject: mailOptions.subject,
        status: "sent",
        attemptNumber: attempt,
        complaintId: meta.complaintId || null,
        templateName: meta.templateName || null,
        smtpResponse: info?.response || null,
        messageId: info?.messageId || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info(`Email sent to ${mailOptions.to} (attempt ${attempt})`);
      return { success: true };
    } catch (err) {
      lastError = err;
      logger.warn(`Email attempt ${attempt} failed for ${mailOptions.to}: ${err.message}`);
      await db.collection("emailLogs").add({
        recipient: mailOptions.to,
        subject: mailOptions.subject,
        status: "failed",
        attemptNumber: attempt,
        complaintId: meta.complaintId || null,
        templateName: meta.templateName || null,
        errorCode: err.code || err.responseCode || null,
        errorMessage: err.message || String(err),
        smtpResponse: err.response || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (attempt < MAX_ATTEMPTS) {
        await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }
  }

  await maybeAlertAdmins(lastError, mailOptions.to);
  return { success: false, error: lastError };
}

/**
 * Counts failed deliveries within the configured rolling window; if the
 * configurable threshold is exceeded, raises one alert (a `systemAlerts`
 * doc plus an in-app notification to every admin) rather than spamming an
 * alert per failure.
 */
async function maybeAlertAdmins(lastError, recipient) {
  try {
    const windowStart = new Date(Date.now() - ALERT_WINDOW_MINUTES.value() * 60 * 1000);
    const recentFailures = await db
      .collection("emailLogs")
      .where("status", "==", "failed")
      .where("timestamp", ">=", windowStart)
      .get();

    const threshold = FAILURE_ALERT_THRESHOLD.value();
    if (recentFailures.size < threshold) return;

    // Avoid re-alerting every single failure once past the threshold —
    // only fire once per unacknowledged window.
    const existingAlert = await db
      .collection("systemAlerts")
      .where("type", "==", "email_delivery_failures")
      .where("acknowledged", "==", false)
      .limit(1)
      .get();
    if (!existingAlert.empty) return;

    const alertMessage = `${recentFailures.size} email deliveries failed in the last ${ALERT_WINDOW_MINUTES.value()} minutes (threshold: ${threshold}). Most recent error: ${lastError?.message || "unknown"}.`;

    await db.collection("systemAlerts").add({
      type: "email_delivery_failures",
      message: alertMessage,
      count: recentFailures.size,
      threshold,
      acknowledged: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    const admins = await db.collection("users").where("role", "==", "admin").get();
    const batch = db.batch();
    admins.forEach((adminDoc) => {
      const ref = db.collection("notifications").doc();
      batch.set(ref, {
        userId: adminDoc.id,
        title: "Email delivery failures",
        message: alertMessage,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    logger.error(`ALERT: ${alertMessage}`);
  } catch (alertErr) {
    // Alerting itself failing shouldn't crash the calling function.
    logger.error("Failed to raise email-failure alert:", alertErr);
  }
}

exports.notifyComplaintCompletion = onDocumentUpdated(
  { document: "complaints/{complaintId}", secrets: [GMAIL_USER, GMAIL_APP_PASSWORD] },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const complaintId = event.params.complaintId;

    if (before.status === "Completed" || after.status !== "Completed") {
      return null;
    }

    try {
      const userDoc = await db.collection("users").doc(after.userId).get();
      if (!userDoc.exists) {
        logger.warn(`Complaint ${complaintId} completed but user ${after.userId} not found — skipping notification.`);
        return null;
      }
      const user = userDoc.data();

      // 1) In-app notification — independent of email, always attempted.
      await db.collection("notifications").add({
        userId: after.userId,
        title: "Complaint Completed 🎉",
        message: `Your complaint "${after.title}" has been resolved.`,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2) Email — with retry + logging.
      if (user.email) {
        const gmailUser = GMAIL_USER.value();
        const gmailPass = GMAIL_APP_PASSWORD.value();

        if (!gmailUser || !gmailPass) {
          logger.error("GMAIL_USER / GMAIL_APP_PASSWORD secrets are not configured — skipping email send.");
          await db.collection("emailLogs").add({
            recipient: user.email,
            subject: "Your Complaint is Completed",
            status: "failed",
            attemptNumber: 0,
            complaintId,
            templateName: "complaint_completed",
            errorCode: "config/missing-secrets",
            errorMessage: "GMAIL_USER or GMAIL_APP_PASSWORD secret is not set.",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // SSL — port 587 + secure:false with STARTTLS also works
            auth: { user: gmailUser, pass: gmailPass },
          });

          await sendMailWithRetry(
            transporter,
            {
              from: `"Campus Voice" <${gmailUser}>`,
              to: user.email,
              subject: "Your Complaint is Completed",
              text: `Hello ${user.name || "there"},\n\nYour complaint "${after.title}" has been marked as completed.\n\nRegards,\nCampus Voice Team`,
            },
            { complaintId, templateName: "complaint_completed" }
          );
        }
      }

      // 3) Push notification via FCM — best-effort, doesn't block on email.
      if (user.fcmToken) {
        try {
          await admin.messaging().send({
            token: user.fcmToken,
            notification: {
              title: "Complaint Completed 🎉",
              body: `Your complaint "${after.title}" has been resolved.`,
            },
          });
        } catch (pushErr) {
          logger.warn(`Push notification failed for ${after.userId}:`, pushErr.message);
        }
      }
    } catch (err) {
      logger.error("Error in notifyComplaintCompletion:", err);
    }

    return null;
  }
);

/**
 * Runs daily. Deletes complaints that have been Completed for longer than
 * COMPLETED_RETENTION_DAYS. Only ever touches documents with
 * status == "Completed" and a completedAt timestamp older than the cutoff
 * — Pending tickets are never touched regardless of age, and a resolved
 * ticket is never deleted before it's actually been resolved for the full
 * retention window.
 *
 * Deletes in batches of 400 (Firestore's batch write limit is 500; staying
 * under it with margin) and logs a summary — check `firebase functions:log`
 * or the Cloud Console to see how many were removed on a given run.
 */
exports.cleanupOldCompletedComplaints = onSchedule("every 24 hours", async () => {
  const cutoff = new Date(Date.now() - COMPLETED_RETENTION_DAYS.value() * 24 * 60 * 60 * 1000);

  const snapshot = await admin
    .firestore()
    .collection("complaints")
    .where("status", "==", "Completed")
    .where("completedAt", "<=", cutoff)
    .get();

  if (snapshot.empty) {
    logger.info("Cleanup: no completed complaints past the retention window.");
    return null;
  }

  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = admin.firestore().batch();
    docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  logger.info(`Cleanup: deleted ${docs.length} completed complaints older than ${COMPLETED_RETENTION_DAYS.value()} days.`);
  return null;
});
