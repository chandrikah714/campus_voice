import React from "react";
import Card from "./Card";
import { useComplaints } from "../../hooks/useComplaints";
import { useCurrentUser } from "../../context/AuthContext";

// Previously this fetched complaints via its own onSnapshot listener and
// expected complaints/user/callbacks all passed in as props (which not
// every caller supplied correctly). It's now self-sufficient: one shared
// live-data hook, one shared auth hook.
const Home = () => {
  const { user, role } = useCurrentUser();
  const { complaints, loading, updateStatus, updateVotes, addDiscussion } = useComplaints();

  const sorted = [...complaints].sort((a, b) => {
    if (a.status === "Completed" && b.status !== "Completed") return 1;
    if (b.status === "Completed" && a.status !== "Completed") return -1;
    const order = { High: 0, Medium: 1, Low: 2 };
    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
  });

  if (loading) {
    return <p className="font-mono text-sm text-ink-300">Loading the board...</p>;
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-paper-300 bg-paper-50 p-10 text-center">
        <p className="font-display text-lg font-semibold text-ink-900">Nothing on the board yet</p>
        <p className="mt-1 text-sm text-ink-500">Reported issues will show up here as tickets.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {sorted.map((c) => (
        <Card
          key={c.id}
          complaint={c}
          currentUser={user}
          isStaff={role === "staff"}
          addDiscussion={addDiscussion}
          updateStatus={updateStatus}
          updateVotes={updateVotes}
        />
      ))}
    </div>
  );
};

export default Home;
