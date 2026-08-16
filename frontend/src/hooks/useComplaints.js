import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, deleteField, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useCurrentUser } from "../context/AuthContext";

/**
 * Live subscription to the complaints collection, plus the mutation helpers
 * every dashboard needs. Previously StudentDashboard, StaffDashboard, and
 * Home.jsx each opened their own onSnapshot listener on the same
 * collection — same data, three duplicate live connections. This is the
 * one shared source.
 */
export function useComplaints() {
  const { user } = useCurrentUser();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "complaints"),
      (snapshot) => {
        setComplaints(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load complaints:", err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const updateStatus = async (id, newStatus, extra = {}) => {
    if (!id || !newStatus) return;
    try {
      const completionFields =
        newStatus === "Completed"
          ? { completedAt: extra.completedAt || serverTimestamp() }
          : newStatus === "Pending"
          ? { completedAt: deleteField() }
          : {};
      await updateDoc(doc(db, "complaints", id), {
        status: newStatus,
        ...completionFields,
        ...extra,
      });
    } catch (err) {
      console.error("Error updating complaint status:", err);
    }
  };

  const updateVotes = async (id, votes) => {
    if (!id || !votes) return;
    try {
      await updateDoc(doc(db, "complaints", id), { votes });
    } catch (err) {
      console.error("Error updating votes:", err);
    }
  };

  const addDiscussion = async (id, message) => {
    if (!id || !message?.trim()) return;
    const complaint = complaints.find((c) => c.id === id);
    if (!complaint) return;
    const discussions = [
      ...(complaint.discussions || []),
      {
        userId: user?.id || "unknown",
        userName: user?.name || "Anonymous",
        role: user?.role || "student",
        message: message.trim(),
        timestamp: new Date(),
      },
    ];
    try {
      await updateDoc(doc(db, "complaints", id), { discussions });
    } catch (err) {
      console.error("Error adding discussion:", err);
    }
  };

  return { complaints, loading, updateStatus, updateVotes, addDiscussion };
}
