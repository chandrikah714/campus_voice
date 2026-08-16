import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

// Previously every dashboard (Student/Staff/Admin), Navbar, PrivateRoute, and
// Profile each independently read `auth.currentUser` and ran their own
// Firestore fetch for the user's profile/role. That caused two real bugs:
//
// 1. Race condition: `auth.currentUser` is null for an instant while Firebase
//    restores the session on page load/refresh, so components reading it
//    synchronously (or in a useEffect with no listener) would see "logged
//    out" and redirect to /login even for a valid session.
// 2. Navbar never actually received the user at all in some routes (it
//    expected a `user` prop that App.jsx never passed), so notifications
//    and the profile photo never worked.
//
// A THIRD bug, found while investigating "staff/student login hangs
// forever": if a signed-in Firebase Auth account has no matching
// `users/{uid}` Firestore document (e.g. it was created directly in the
// Auth console, or through the old broken admin-create flow before that was
// fixed), `profile` stays null forever but `loading` still resolves to
// false. Nothing downstream ever saw an error, so PrivateRoute/RoleRedirect
// just sat on "Setting up your account..." forever with no way out. This
// context now tracks that state explicitly (profileMissing / profileError)
// and retries with backoff before giving up, so the UI can show an actual
// error with a way to recover instead of an infinite spinner.

const AuthContext = createContext(undefined);
const MAX_PROFILE_RETRIES = 3;
const AUTH_TIMEOUT_MS = 12000; // if Firebase itself never responds

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null); // Firebase Auth user
  const [profile, setProfile] = useState(null); // Firestore users/{uid} doc
  const [authLoading, setAuthLoading] = useState(true); // waiting on Firebase session restore
  const [profileLoading, setProfileLoading] = useState(false); // waiting on Firestore doc
  const [profileError, setProfileError] = useState(null); // { code, message } | null
  const [profileSettled, setProfileSettled] = useState(false); // fetch attempted & resolved (found, missing, or gave up)
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => setAuthTimedOut(true), AUTH_TIMEOUT_MS);
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      clearTimeout(timeoutId);
      setAuthTimedOut(false);
      setAuthUser(fbUser);
      setAuthLoading(false);
    });
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const subscribeToProfile = useCallback((uid) => {
    setProfileLoading(true);
    setProfileSettled(false);
    setProfileError(null);
    return onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        retryCountRef.current = 0;
        setProfile(snap.exists() ? { id: uid, ...snap.data() } : null);
        setProfileLoading(false);
        setProfileSettled(true);
      },
      (err) => {
        console.error("Failed to load user profile:", err);
        if (retryCountRef.current < MAX_PROFILE_RETRIES) {
          const delay = 2 ** retryCountRef.current * 1000; // 1s, 2s, 4s
          retryCountRef.current += 1;
          retryTimerRef.current = setTimeout(() => subscribeToProfile(uid), delay);
        } else {
          setProfileError({ code: err.code, message: err.message });
          setProfileLoading(false);
          setProfileSettled(true);
        }
      }
    );
  }, []);

  useEffect(() => {
    if (!authUser) {
      setProfile(null);
      setProfileSettled(false);
      return;
    }
    const unsubscribe = subscribeToProfile(authUser.uid);
    return () => {
      unsubscribe();
      clearTimeout(retryTimerRef.current);
    };
  }, [authUser, subscribeToProfile]);

  const retryProfile = useCallback(() => {
    if (!authUser) return;
    retryCountRef.current = 0;
    subscribeToProfile(authUser.uid);
  }, [authUser, subscribeToProfile]);

  const value = {
    authUser,
    user: profile, // {id, name, email, role, department, ...}
    role: profile?.role || null,
    loading: authLoading || (!!authUser && profileLoading && !profileSettled),
    isAuthenticated: !!authUser,
    authTimedOut,
    // True once we're sure there's no profile doc / no usable role for a
    // signed-in account — the case that used to hang forever.
    profileMissing: !!authUser && profileSettled && !profile?.role && !profileError,
    profileError,
    retryProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCurrentUser() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useCurrentUser must be used within an AuthProvider");
  }
  return ctx;
}
