import React, { useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import {
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { db } from "../../firebase";
import { useCurrentUser } from "../../context/AuthContext";
import { DEPARTMENTS } from "../../config/departments";
import { uploadToCloudinary, validateImageFile, cropToCenterSquare } from "../../utils/imageUpload";
import { FaCamera, FaTrash, FaEye, FaEyeSlash } from "react-icons/fa";

export default function AccountSettings() {
  const { user, authUser } = useCurrentUser();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-900">Account settings</h2>
        <p className="text-sm text-ink-500">Manage your profile, photo, and security.</p>
      </div>

      <ProfilePictureCard user={user} authUser={authUser} />
      <PersonalInfoCard user={user} authUser={authUser} />
      <SecurityCard authUser={authUser} />
      <NotificationsCard user={user} authUser={authUser} />
    </div>
  );
}

function SectionCard({ title, action, children }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-paper-300">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Banner({ error, success }) {
  if (!error && !success) return null;
  return (
    <p
      className={`mb-3 rounded-lg px-3 py-2 text-sm ${
        error ? "bg-coral-50 text-coral-700" : "bg-teal-50 text-teal-700"
      }`}
    >
      {error || success}
    </p>
  );
}

function ProfilePictureCard({ user, authUser }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentPhoto = preview || user?.photo;

  const handlePick = async (file) => {
    setError("");
    setSuccess("");
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const squared = await cropToCenterSquare(file);
      setPendingFile(squared);
      setPreview(URL.createObjectURL(squared));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    if (!pendingFile) return;
    setSaving(true);
    setError("");
    try {
      const url = await uploadToCloudinary(pendingFile);
      await updateDoc(doc(db, "users", authUser.uid), { photo: url });
      setSuccess("Profile picture updated.");
      setPendingFile(null);
    } catch (err) {
      setError(err.message || "Couldn't upload that image. Please try again.");
    }
    setSaving(false);
  };

  const handleRemove = async () => {
    setSaving(true);
    setError("");
    try {
      await updateDoc(doc(db, "users", authUser.uid), { photo: "" });
      setPreview(null);
      setPendingFile(null);
      setSuccess("Profile picture removed.");
    } catch {
      setError("Couldn't remove the picture. Please try again.");
    }
    setSaving(false);
  };

  return (
    <SectionCard title="Profile picture">
      <Banner error={error} success={success} />
      <div className="flex items-center gap-5">
        <div className="relative h-20 w-20 shrink-0">
          {currentPhoto ? (
            <img src={currentPhoto} alt="" className="h-20 w-20 rounded-full border-2 border-paper-300 object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-paper-200 font-display text-2xl font-bold text-ink-300">
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-marigold-500 text-ink-900 shadow ring-2 ring-white hover:bg-marigold-400"
            aria-label="Change photo"
          >
            <FaCamera size={12} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handlePick(e.target.files[0])}
          />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs text-ink-500">JPG, PNG, or WebP · up to 5MB</p>
          <p className="text-xs text-ink-300">Automatically centered and cropped to a circle.</p>
          <div className="mt-1 flex gap-3">
            {pendingFile && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm font-medium text-marigold-700 hover:underline disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save new photo"}
              </button>
            )}
            {currentPhoto && !pendingFile && (
              <button
                onClick={handleRemove}
                disabled={saving}
                className="flex items-center gap-1 text-sm font-medium text-coral-700 hover:underline disabled:opacity-60"
              >
                <FaTrash size={11} /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function PersonalInfoCard({ user, authUser }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [department, setDepartment] = useState(user?.department || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Phone is optional, but if anything is entered it must be exactly 10
  // digits — no letters, no symbols, no partial numbers slipping through.
  const phoneError =
    phone && phone.length !== 10 ? `Enter all 10 digits (${phone.length}/10 so far)` : "";

  const handlePhoneChange = (raw) => {
    // Strip anything that isn't a digit as you type, rather than letting
    // invalid characters appear and then complaining after the fact —
    // reject at the source instead of just flagging it.
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 10);
    setPhone(digitsOnly);
    setPhoneTouched(true);
  };

  const startEditing = () => {
    // Reset fields to current saved values in case a previous edit was
    // cancelled without saving.
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setPhoneTouched(false);
    setDepartment(user?.department || "");
    setError("");
    setSuccess("");
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (phoneError) {
      setError("Please fix the phone number before saving.");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", authUser.uid), { name, phone, department });
      setSuccess("Profile updated.");
      setEditing(false);
    } catch {
      setError("Couldn't save your changes. Please try again.");
    }
    setSaving(false);
  };

  return (
    <SectionCard
      title="Personal details"
      action={
        !editing && (
          <button
            onClick={startEditing}
            className="text-sm font-medium text-marigold-700 hover:underline"
          >
            Edit
          </button>
        )
      }
    >
      <Banner error={error} success={success} />

      {!editing ? (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <ReadField label="Full name" value={user?.name} />
          <ReadField label="Phone number" value={user?.phone} />
          <ReadField label="Department" value={user?.department} />
          <ReadField label="Email" value={authUser?.email} />
        </dl>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <Field label="Full name">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Phone number">
            <input
              className={`input ${phoneTouched && phoneError ? "input-error" : ""}`}
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => setPhoneTouched(true)}
              placeholder="10-digit number, optional"
              maxLength={10}
            />
            {phoneTouched && phoneError && (
              <span className="text-xs text-marigold-700">{phoneError}</span>
            )}
          </Field>
          <Field label="Department">
            <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>
          <div className="mt-1 flex gap-2">
            <button
              type="submit"
              disabled={saving || !!phoneError}
              className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-paper-50 hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="rounded-lg bg-paper-100 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-paper-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </SectionCard>
  );
}

function ReadField({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-300">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink-900">{value || <span className="text-ink-300">Not set</span>}</dd>
    </div>
  );
}

function SecurityCard({ authUser }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState(authUser?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reauth = async () => {
    if (!currentPassword) throw new Error("Enter your current password to confirm this change.");
    const credential = EmailAuthProvider.credential(authUser.email, currentPassword);
    await reauthenticateWithCredential(authUser, credential);
  };

  const handleEmailSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newEmail === authUser.email) return;
    setSaving(true);
    try {
      await reauth();
      await updateEmail(authUser, newEmail);
      await updateDoc(doc(db, "users", authUser.uid), { email: newEmail });
      setSuccess("Email updated.");
      setCurrentPassword("");
    } catch (err) {
      setError(friendlySecurityError(err.code) || "Couldn't update your email. Please try again.");
    }
    setSaving(false);
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      await reauth();
      await updatePassword(authUser, newPassword);
      setSuccess("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(friendlySecurityError(err.code) || "Couldn't update your password. Please try again.");
    }
    setSaving(false);
  };

  return (
    <SectionCard title="Security">
      <Banner error={error} success={success} />

      <label className="mb-4 flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-700">Current password</span>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            className="input w-full pr-10"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Required to change email or password"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-700"
          >
            {showPw ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
          </button>
        </div>
      </label>

      <form onSubmit={handleEmailSave} className="mb-5 flex flex-col gap-2 border-t border-paper-200 pt-4">
        <Field label="Email address">
          <input type="email" className="input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        </Field>
        <button
          type="submit"
          disabled={saving || newEmail === authUser?.email}
          className="mt-1 self-start rounded-lg bg-paper-100 px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-paper-200 disabled:opacity-50"
        >
          Update email
        </button>
      </form>

      <form onSubmit={handlePasswordSave} className="flex flex-col gap-2 border-t border-paper-200 pt-4">
        <Field label="New password">
          <input
            type="password"
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
          />
        </Field>
        <Field label="Confirm new password">
          <input
            type="password"
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
          />
        </Field>
        <button
          type="submit"
          disabled={saving || !newPassword}
          className="mt-1 self-start rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-paper-50 hover:bg-ink-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Update password"}
        </button>
      </form>
    </SectionCard>
  );
}

function NotificationsCard({ user, authUser }) {
  const [emailNotif, setEmailNotif] = useState(user?.notifyByEmail ?? true);
  const [pushNotif, setPushNotif] = useState(user?.notifyByPush ?? true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const toggle = async (key, value, setter) => {
    setter(value);
    setSaving(true);
    setSuccess("");
    try {
      await updateDoc(doc(db, "users", authUser.uid), { [key]: value });
      setSuccess("Preferences saved.");
    } catch {
      setter(!value); // revert on failure
    }
    setSaving(false);
  };

  return (
    <SectionCard title="Notification preferences">
      <Banner success={success} />
      <div className="flex flex-col gap-3">
        <Toggle
          label="Push notifications"
          description="Get notified in-app the moment your ticket's status changes."
          checked={pushNotif}
          onChange={(v) => toggle("notifyByPush", v, setPushNotif)}
          disabled={saving}
        />
        <Toggle
          label="Email notifications"
          description="Receive an email summary for updates on your tickets."
          checked={emailNotif}
          onChange={(v) => toggle("notifyByEmail", v, setEmailNotif)}
          disabled={saving}
        />
      </div>
    </SectionCard>
  );
}

function Toggle({ label, description, checked, onChange, disabled }) {
  return (
    <label className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-ink-900">{label}</p>
        <p className="text-xs text-ink-500">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-9 shrink-0 accent-marigold-500"
      />
    </label>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      {children}
    </label>
  );
}

function friendlySecurityError(code) {
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "That current password isn't correct.";
    case "auth/email-already-in-use":
      return "That email is already in use by another account.";
    case "auth/requires-recent-login":
      return "Please log out and back in, then try again.";
    default:
      return null;
  }
}
