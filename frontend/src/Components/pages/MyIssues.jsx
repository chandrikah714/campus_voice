import React, { useState } from "react";
import { useComplaints } from "../../hooks/useComplaints";
import { useCurrentUser } from "../../context/AuthContext";
import Card from "./Card";

const FILTERS = ["All", "Pending", "Completed"];

const MyIssues = () => {
  const { user } = useCurrentUser();
  const { complaints, updateStatus, updateVotes, addDiscussion } = useComplaints();
  const [filter, setFilter] = useState("All");

  const mine = complaints.filter((c) => c.userId === user?.id);
  const filtered = filter === "All" ? mine : mine.filter((c) => c.status === filter);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-900">My issues</h2>
        <p className="text-sm text-ink-500">Everything you've reported, in one place.</p>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f
                ? "bg-ink-900 text-paper-50"
                : "bg-white text-ink-700 ring-1 ring-paper-300 hover:bg-paper-100"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-paper-300 bg-paper-50 p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink-900">Nothing here yet</p>
          <p className="mt-1 text-sm text-ink-500">
            {filter === "All"
              ? "Report an issue and it'll show up here."
              : `No ${filter.toLowerCase()} issues right now.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Card
              key={c.id}
              complaint={c}
              currentUser={user}
              isStaff={false}
              addDiscussion={addDiscussion}
              updateStatus={updateStatus}
              updateVotes={updateVotes}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyIssues;
