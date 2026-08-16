import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { DEPARTMENTS } from "../../config/departments";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import logo from "../../assets/logoNew.jpg";

// Two real bugs fixed here previously:
//  1. The <form> had no onSubmit handler, and the password input's
//     value/onChange were commented out — registration silently did
//     nothing.
//  2. Anyone could pick "Admin" from a dropdown and grant themselves admin
//     access. Self-registration is limited to Student/Staff.
export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("student");
  const [department, setDepartment] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        email: user.email,
        role,
        department,
        regNumber,
      });

      navigate("/login");
    } catch (err) {
      setError(friendlyAuthError(err.code));
    }
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-ink-900 p-4 sm:p-6">
      {/* Ambient background — matches Login for a cohesive feel */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-teal-700/35 blur-3xl" />
        <div className="absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-ink-700/50 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-gold-400/25 blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-3xl bg-paper-50 shadow-2xl lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between bg-ink-900 p-10 text-paper-50 lg:flex">
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-teal-700/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-gold-400/15 blur-3xl" />
          <div className="relative z-10 flex items-center gap-3">
            <img src={logo} alt="" className="h-10 w-10 rounded-md object-cover" />
            <span className="font-display text-lg font-bold">Campus Voice</span>
          </div>
          <div className="relative z-10">
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-marigold-400">
              Join the desk
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight">
              Tired of issues going unheard?
            </h1>
          </div>
          <p className="relative z-10 max-w-sm text-sm text-paper-200">
            Register to file reports, follow their status, and get notified
            the moment your department picks them up.
          </p>
        </section>

        <section className="flex flex-col justify-center px-6 py-8 sm:px-10">
          <div className="mb-5 flex items-center gap-3 lg:hidden">
            <img src={logo} alt="" className="h-9 w-9 rounded-md object-cover" />
            <span className="font-display text-lg font-bold text-ink-900">Campus Voice</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-ink-900">Create your account</h2>
          <p className="mt-1 mb-5 text-sm text-ink-500">
            Already registered?{" "}
            <Link to="/login" className="font-medium text-marigold-700 hover:underline">
              Log in
            </Link>
          </p>

          {error && (
            <p className="mb-4 rounded-lg bg-coral-50 px-3 py-2 text-sm text-coral-700">{error}</p>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
            <Field label="Full name" icon={<FaUser size={13} />}>
              <input
                type="text"
                className="input w-full pl-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>

            <Field label="Email" icon={<FaEnvelope size={13} />}>
              <input
                type="email"
                autoComplete="email"
                className="input w-full pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field label="Password" icon={<FaLock size={13} />}>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="input w-full pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-700"
              >
                {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">Department</span>
                <select
                  className="input"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {DEPARTMENTS.map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink-700">I am a</span>
                <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Registration number</span>
              <input
                type="text"
                className="input"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="e.g. 21CS001"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-ink-900 py-2.5 font-semibold text-paper-50 transition hover:bg-ink-700 disabled:opacity-60"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper-300 border-t-marigold-400" />
              )}
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <label className="relative flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <span className="pointer-events-none absolute left-3.5 top-[calc(50%+0.5rem)] -translate-y-1/2 text-ink-300">
        {icon}
      </span>
      {children}
    </label>
  );
}

function friendlyAuthError(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with that email already exists.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/weak-password":
      return "Please choose a stronger password (6+ characters).";
    default:
      return "Something went wrong creating your account. Please try again.";
  }
}
