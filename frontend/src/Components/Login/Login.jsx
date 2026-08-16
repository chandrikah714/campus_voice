import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "../../firebase";
import { Link, useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../context/AuthContext";
import { FaEye, FaEyeSlash, FaShieldAlt, FaEnvelope, FaLock } from "react-icons/fa";
import logo from "../../assets/logoNew.jpg";

// Bug fixed: this page called signInWithEmailAndPassword but never
// navigated anywhere afterward, so a *successful* login looked identical
// to nothing happening at all. It now watches AuthContext and redirects to
// "/" the moment a session exists.
//
// Note on "Admin sign-in": UI framing only — it doesn't grant admin access
// by itself. Role is decided by Firestore (see PrivateRoute), same as any
// other login.
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [adminMode, setAdminMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const submitForm = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await withTimeout(
        signInWithEmailAndPassword(auth, email, password),
        15000,
        "The server is taking too long to respond. Please check your connection and try again."
      );
    } catch (err) {
      setError(err.isTimeout ? err.message : friendlyAuthError(err.code));
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email above first, then tap Forgot password.");
      return;
    }
    try {
      setError("");
      await sendPasswordResetEmail(auth, email);
      // Deliberately generic wording — Firebase resolves this the same way
      // whether or not the email matches a real account (to prevent
      // account enumeration), so a specific "email sent!" message would be
      // misleading half the time.
      setMessage("If an account exists for that email, a reset link is on its way — check your inbox and spam folder.");
    } catch (err) {
      setError(friendlyAuthError(err.code));
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-ink-900 p-4 sm:p-6">
      {/* Colorful ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-ink-700/50 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-marigold-500/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-gold-400/25 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-3xl bg-paper-50 shadow-2xl lg:grid-cols-2">
        {/* Left: brand panel */}
        <section className="relative hidden flex-col justify-between bg-ink-900 p-10 text-paper-50 lg:flex">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-marigold-500/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-gold-400/15 blur-3xl" />
          <div className="relative z-10 flex items-center gap-3">
            <img src={logo} alt="" className="h-10 w-10 rounded-md object-cover" />
            <span className="font-display text-lg font-bold">Campus Voice</span>
          </div>
          <div className="relative z-10">
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-marigold-400">
              {adminMode ? "Admin desk" : "Welcome back"}
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight">
              {adminMode ? (
                <>Oversee the whole board —<br />sign in to the admin desk.</>
              ) : (
                <>Your voice matters —<br />log in and keep it moving.</>
              )}
            </h1>
          </div>
          <p className="relative z-10 max-w-sm text-sm text-paper-200">
            {adminMode
              ? "Manage users, review every department's tickets, and see campus-wide analytics."
              : "Every report you file gets tracked, routed to the right department, and stamped when it's resolved."}
          </p>
        </section>

        {/* Right: form */}
        <section className="flex flex-col justify-center px-6 py-10 sm:px-10">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <img src={logo} alt="" className="h-9 w-9 rounded-md object-cover" />
            <span className="font-display text-lg font-bold text-ink-900">Campus Voice</span>
          </div>

          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink-900">
                {adminMode ? "Admin sign-in" : "Log in"}
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Don't have an account?{" "}
                <Link to="/register" className="font-medium text-marigold-700 hover:underline">
                  Register here
                </Link>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAdminMode((v) => !v)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                adminMode ? "bg-ink-900 text-paper-50" : "bg-paper-200 text-ink-700 hover:bg-paper-300"
              }`}
            >
              <FaShieldAlt size={11} />
              Admin
            </button>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-coral-50 px-3 py-2 text-sm text-coral-700">{error}</p>
          )}
          {message && (
            <p className="mb-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700">{message}</p>
          )}

          <form onSubmit={submitForm} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Email</span>
              <div className="relative">
                <FaEnvelope className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" size={14} />
                <input
                  type="email"
                  autoComplete="email"
                  className="input w-full pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Password</span>
              <div className="relative">
                <FaLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" size={14} />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="input w-full pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-700"
                >
                  {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-paper-300 accent-marigold-500"
                />
                Remember me
              </label>
              <button
                onClick={handleForgotPassword}
                type="button"
                className="text-sm font-medium text-marigold-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-ink-900 py-2.5 font-semibold text-paper-50 transition hover:bg-ink-700 disabled:opacity-60"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper-300 border-t-marigold-400" />
              )}
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => {
        const err = new Error(message);
        err.isTimeout = true;
        reject(err);
      }, ms)
    ),
  ]);
}

function friendlyAuthError(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password don't match our records.";
    case "auth/too-many-requests":
      return "Too many attempts — please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error — check your connection and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact an admin for help.";
    default:
      return "Something went wrong logging in. Please try again.";
  }
}
