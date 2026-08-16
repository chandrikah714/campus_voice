# Campus Voice — Email Delivery: Investigation & Setup

There are **two completely separate email systems** in this app. Mixing
them up is the single most likely reason "password reset emails aren't
arriving" investigations go nowhere — they're diagnosed in different
places, by different people, with different tools.

| | Password reset | "Complaint resolved" notification |
|---|---|---|
| Triggered by | Clicking "Forgot password?" on `/login` | The `notifyComplaintCompletion` Cloud Function, when a complaint's status flips to `Completed` |
| Sent by | Firebase Authentication's own hosted mail service | Your Gmail account, via SMTP, via `nodemailer`, in `functions/index.js` |
| Code involved | `sendPasswordResetEmail()` in `Login.jsx` — that's it | `functions/index.js` |
| Where to debug it | Firebase Console only | Cloud Function logs + the new `/admin/email-logs` page in-app |
| Can I add custom SMTP/DNS records for it? | **No.** Firebase owns this pipeline end-to-end. | Yes, in principle — but you're using Gmail's SMTP relay, which has its own rules (below) |

## Part 1: Password reset emails

Since this doesn't run through your own SMTP, the "systematic SMTP/DNS
investigation" (host, port, SPF, DKIM, DMARC) doesn't apply here — there's
no server of yours in that path to inspect. What you can actually check:

1. **Is the account real?** As of recent Firebase Auth versions, `sendPasswordResetEmail()` succeeds silently even if the email doesn't match any account — this is Google's built-in email-enumeration protection, not a bug. Typing the wrong email produces *no error and no email*, which looks exactly like "it's not sending." Confirm the account exists first (Firebase Console → Authentication → Users → search the email).
2. **Spam folder.** Firebase's sending domain doesn't carry your domain's reputation — check spam/junk before anything else.
3. **Email template.** Firebase Console → Authentication → Templates → Password reset. Confirm it hasn't been edited into a broken state, and that the "Action URL" / authorized domain settings match your actual deployed domain (Authentication → Settings → Authorized domains). A mismatched authorized domain can cause the reset link to fail even when the email itself sends.
4. **Quota.** Firebase Auth's free-tier email sending has a daily quota; it's rarely hit in a student project, but worth a glance at Console → Usage if you've been testing heavily.
5. **Custom sending domain.** If you ever configured a custom domain for Auth emails (rather than the default `*.firebaseapp.com` sender), that domain needs real SPF/DKIM records — this is the one case where DNS *does* matter, and it's set up entirely in the Firebase Console (Authentication → Templates → "Customize domain"), not in this codebase.

If all five check out and it's still not arriving, the next step is
Firebase Support/Console diagnostics — there's no client-side or
Cloud-Function-side code to change, since this app never touches that
pipeline.

## Part 2: "Complaint resolved" notification emails

This is the part that was actually broken in the code, and is now fixed
(see `functions/index.js`). Two root causes, both real:

### Root cause 1: deprecated config API
The old code read credentials with `functions.config()` — the Firebase
Functions **v1** config API. Google deprecated this and has been turning
it off through 2025–2026 for anything on a current CLI/runtime. If your
project was ever redeployed after that cutoff, `functions.config().gmail`
would throw (or return `undefined`, causing a crash reading `.email` off
it) before the code ever reached Gmail — meaning **no amount of correct
SMTP/Gmail configuration would have helped**, because the credential
lookup itself was failing first.

**Fixed:** rewritten to use `firebase-functions/params`'
`defineSecret()`, the current supported approach (Secret Manager-backed).

### Root cause 2: Gmail requires an App Password, not your login password
Gmail's SMTP relay rejects your normal account password for
programmatic/SMTP login. It requires:
1. 2-Step Verification enabled on that Gmail account.
2. A 16-character **App Password** generated at
   `myaccount.google.com/apppasswords` — this is what goes in
   `GMAIL_APP_PASSWORD`, not your regular password.

If the old code had a plain password in `gmail.pass`, Gmail would reject
every send with a `535` authentication error — which is now captured
explicitly per-attempt in the `emailLogs` collection instead of silently
failing.

### Setup steps

```bash
cd functions
firebase functions:secrets:set GMAIL_USER
# paste the sending Gmail address when prompted

firebase functions:secrets:set GMAIL_APP_PASSWORD
# paste the 16-character App Password when prompted

firebase deploy --only functions,firestore:rules
```

Optional — tune the alert threshold without touching code:
```bash
firebase functions:secrets:set EMAIL_FAILURE_ALERT_THRESHOLD  # default: 5
firebase functions:secrets:set EMAIL_ALERT_WINDOW_MINUTES      # default: 60
```

### What's now instrumented

Every send attempt (success or failure) writes a document to Firestore's
`emailLogs` collection with: recipient, subject, status, **error code**,
**error message**, **raw SMTP response text**, timestamp, and which retry
attempt it was. Failures retry automatically up to 3 times with
exponential backoff (1s → 2s → 4s) before being logged as a final
failure.

If failures exceed the configurable threshold within the configurable
time window, one alert is raised (not one per failure) as both a
`systemAlerts` document and an in-app notification to every admin —
visible immediately in the Navbar bell icon, and in full at
**`/admin/email-logs`**, which also shows the full attempt-by-attempt
log and lets an admin acknowledge the alert.

### Things I could not verify from here

I don't have access to your actual Firebase project, Gmail account, or
deployment pipeline, so I can't confirm: whether the function is
currently deployed at all, whether it's on the Blaze (pay-as-you-go)
plan (outbound network calls from Cloud Functions — which SMTP requires —
need Blaze; the free Spark plan blocks them), or whether a Gmail App
Password has ever been generated for this account. All three are
plausible independent causes on top of the two root causes above, and
none of them are things I can fix without your credentials — but once
deployed, the new logging will tell you immediately and specifically
which one it is, instead of silent failure.
