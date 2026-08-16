import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "../../context/AuthContext";
import LoadingScreen from "../Shared/LoadingScreen";
import StuckAccountScreen from "../Shared/StuckAccountScreen";

// Previously this read `auth.currentUser` synchronously and ran its own
// getDoc() on every navigation, which caused two bugs:
//  1. On refresh, `auth.currentUser` is briefly null while Firebase restores
//     the session, so logged-in users got bounced to /login.
//  2. Every route change re-fetched the user's role from Firestore.
// It now reads from AuthContext, which resolves once and stays live.
//
// It also no longer has a dead-end: if the account is signed in but has no
// usable role (missing profile doc, denied Firestore read, or Firebase
// itself timing out), it shows StuckAccountScreen with a retry/logout path
// instead of leaving the person on an infinite spinner.
const PrivateRoute = ({ allowedRoles }) => {
  const { isAuthenticated, role, loading, authTimedOut, profileMissing, profileError, retryProfile } =
    useCurrentUser();

  if (authTimedOut) return <StuckAccountScreen reason="timeout" onRetry={() => window.location.reload()} />;

  if (loading) return <LoadingScreen label="Checking your session..." />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (profileError) return <StuckAccountScreen reason="permission" onRetry={retryProfile} />;
  if (profileMissing) return <StuckAccountScreen reason="missing" onRetry={retryProfile} />;

  if (!allowedRoles.includes(role)) {
    // Signed in, but wrong role for this area — send them to their own
    // dashboard instead of back to /login (which would just bounce them
    // right back once they're recognized as authenticated).
    const home = role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/student";
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
