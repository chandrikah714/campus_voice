import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { useCurrentUser } from "../../context/AuthContext";

// This page was previously an empty file — a dead route in the sidebar
// that rendered nothing. Rebuilt here, reusing the working query logic
// that already existed in the Navbar dropdown.
const Notifications = () => {
  const { user } = useCurrentUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load notifications:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user?.id]);

  const markAsRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h2 className="font-display text-2xl font-bold text-ink-900">Notifications</h2>

      {loading ? (
        <p className="font-mono text-sm text-ink-300">Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-paper-300 bg-paper-50 p-8 text-center">
          <p className="text-sm text-ink-500">You're all caught up — nothing here yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              onClick={() => !n.read && markAsRead(n.id)}
              className={`cursor-pointer rounded-xl p-4 ring-1 transition ${
                n.read
                  ? "bg-white ring-paper-300"
                  : "bg-marigold-50 ring-marigold-200 hover:bg-marigold-100"
              }`}
            >
              <p className="font-medium text-ink-900">{n.title}</p>
              <p className="text-sm text-ink-700">{n.message}</p>
              {n.timestamp?.seconds && (
                <span className="mt-1 block font-mono text-xs text-ink-300">
                  {new Date(n.timestamp.seconds * 1000).toLocaleString()}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
