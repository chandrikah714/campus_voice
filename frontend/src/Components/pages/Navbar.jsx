import React, { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { auth, db, requestForToken, onMessageListener } from "../../firebase";
import { useCurrentUser } from "../../context/AuthContext";
import { BsBell } from "react-icons/bs";
import { FaCog, FaSignOutAlt, FaChevronDown } from "react-icons/fa";

// Previously this component took a `user` prop that App.jsx never actually
// passed down on most routes, so notifications and the profile photo never
// worked. It now reads the current user straight from AuthContext.
const Navbar = () => {
  const { user, role } = useCurrentUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.id)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setNotifications(items);
      },
      (err) => console.error("Failed to load notifications:", err)
    );

    return () => unsub();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    requestForToken(user.id);

    let cancelled = false;
    onMessageListener().then((payload) => {
      if (cancelled || !payload?.notification) return;
      // A lightweight in-app toast would be better than a blocking alert,
      // but keeping behavior close to the original for now.
      alert(`${payload.notification.title}: ${payload.notification.body}`);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter((n) => !n.read)
          .map((n) => updateDoc(doc(db, "notifications", n.id), { read: true }))
      );
    } catch (err) {
      console.error("Error marking notifications read:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-paper-300 bg-paper-50 px-6 py-3">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-ink-300">
          Welcome back
        </p>
        <p className="font-display text-lg font-semibold text-ink-900">
          {user?.name || "there"}
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative">
          <button
            onClick={() => setNotifOpen((prev) => !prev)}
            aria-label="Notifications"
            className="relative rounded-full p-2 text-ink-700 hover:bg-paper-200"
          >
            <BsBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 rounded-full bg-coral-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-paper-300 bg-white p-3 shadow-lg">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-display font-semibold text-ink-900">Notifications</h2>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-marigold-700 hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-ink-300">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`mb-2 rounded p-2 ${n.read ? "bg-paper-100" : "bg-marigold-50"}`}
                  >
                    <p className="text-sm font-medium text-ink-900">{n.title}</p>
                    <p className="text-xs text-ink-500">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-paper-200"
          >
            <img
              src={
                user?.photo ||
                "https://res.cloudinary.com/demo/image/upload/w_40,h_40,c_fill,g_face,r_max/sample.jpg"
              }
              alt=""
              className="h-9 w-9 rounded-full border-2 border-paper-300 object-cover"
            />
            <FaChevronDown className={`h-3 w-3 text-ink-500 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-paper-300 bg-white py-1 shadow-lg">
                <div className="border-b border-paper-200 px-4 py-2.5">
                  <p className="truncate text-sm font-medium text-ink-900">{user?.name}</p>
                  <p className="truncate text-xs text-ink-500">{user?.email}</p>
                </div>
                <Link
                  to={`/${role}/settings`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-paper-100"
                >
                  <FaCog className="h-4 w-4 text-ink-300" /> Account settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-coral-700 hover:bg-coral-50"
                >
                  <FaSignOutAlt className="h-4 w-4" /> Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
