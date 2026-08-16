import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

const COPY = {
  timeout: {
    title: "This is taking longer than expected",
    body: "We couldn't reach the server in time. Check your connection and try again.",
  },
  permission: {
    title: "We couldn't load your account",
    body: "Your account doesn't have permission to read its own profile. This usually means a Firestore security rule needs updating — an admin will need to check the rules for the users collection.",
  },
  missing: {
    title: "Your account isn't fully set up yet",
    body: "You're signed in, but we can't find a profile for this account, so we don't know whether you're a student, staff, or admin. If you were added by an admin, ask them to confirm your account — otherwise try registering again.",
  },
};

export default function StuckAccountScreen({ reason = "missing", onRetry }) {
  const copy = COPY[reason] || COPY.missing;

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-paper-100 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-paper-300">
        <h2 className="font-display text-lg font-bold text-ink-900">{copy.title}</h2>
        <p className="mt-2 text-sm text-ink-500">{copy.body}</p>
        <div className="mt-5 flex justify-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-lg bg-marigold-500 px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-marigold-400"
            >
              Try again
            </button>
          )}
          <button
            onClick={handleLogout}
            className="rounded-lg bg-paper-100 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-paper-200"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
