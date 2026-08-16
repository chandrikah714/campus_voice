import React, { useEffect, useState } from "react";
import { db, createUserAccount } from "../../firebase";
import { collection, getDocs, updateDoc, deleteDoc, setDoc, doc } from "firebase/firestore";
import { DEPARTMENTS } from "../../config/departments";

// Two critical bugs fixed here:
//  1. Creating a user called createUserWithEmailAndPassword on the shared
//     auth instance, which signs the *caller* in as the new user — an admin
//     adding someone got logged out of their own account. Now goes through
//     createUserAccount(), which uses a throwaway secondary app instance.
//  2. The new profile was saved with addDoc() (random document id) instead
//     of setDoc(doc(db, "users", uid)). Since every role check looks the
//     profile up *by uid*, any user created here could never be found —
//     they'd pass Firebase Auth login and then get stuck on "no role found".
export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    department: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const snapshot = await getDocs(collection(db, "users"));
    setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (userId, role) => {
    await updateDoc(doc(db, "users", userId), { role });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  };

  const removeUser = async (userId) => {
    if (!window.confirm("Delete this user's profile? This does not remove their login.")) return;
    await deleteDoc(doc(db, "users", userId));
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError("");
    if (newUser.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const uid = await createUserAccount(newUser.email, newUser.password);
      await setDoc(doc(db, "users", uid), {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
      });
      setUsers((prev) => [...prev, { id: uid, name: newUser.name, email: newUser.email, role: newUser.role, department: newUser.department }]);
      setShowModal(false);
      setNewUser({ name: "", email: "", password: "", role: "student", department: "" });
    } catch (err) {
      setError(err.code === "auth/email-already-in-use"
        ? "That email is already registered."
        : "Couldn't create the account. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900">Manage users</h2>
          <p className="text-sm text-ink-500">{users.length} accounts on file</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-marigold-500 px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-marigold-400"
        >
          + Add user
        </button>
      </div>

      {loadingUsers ? (
        <p className="font-mono text-sm text-ink-300">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-ink-500">No users found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-paper-300 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-ink-900">{u.name || u.email}</p>
                <p className="text-sm text-ink-500">{u.email}</p>
                {u.department && <p className="text-xs text-ink-300">{u.department}</p>}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  className="input py-1.5 text-sm"
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={() => removeUser(u.id)}
                  className="rounded-lg bg-coral-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-coral-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="mb-4 font-display text-xl font-bold text-ink-900">Add a user</h3>

            {error && (
              <p className="mb-3 rounded-lg bg-coral-50 px-3 py-2 text-sm text-coral-700">{error}</p>
            )}

            <form className="flex flex-col gap-3" onSubmit={handleAddUser}>
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="input"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="input"
                required
              />
              <input
                type="password"
                placeholder="Temporary password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="input"
                minLength={6}
                required
              />
              <select
                value={newUser.department}
                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                className="input"
                required
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="input"
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-ink-700 hover:bg-paper-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-paper-50 hover:bg-ink-700 disabled:opacity-60"
                >
                  {submitting ? "Adding..." : "Add user"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
