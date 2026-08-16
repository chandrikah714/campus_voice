import React, { useState } from "react";
import { useComplaints } from "../../hooks/useComplaints";
import { useCurrentUser } from "../../context/AuthContext";
import PriorityBadge from "../Shared/PriorityBadge";

const PendingIssues = () => {
  const { user } = useCurrentUser();
  const { complaints, updateStatus } = useComplaints();
  const [completionText, setCompletionText] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const pending = complaints.filter(
    (c) => c.status === "Pending" && c.department === user?.department
  );
  const completed = complaints.filter(
    (c) => c.status === "Completed" && c.department === user?.department
  );

  const handleComplete = async (id) => {
    if (!completionText.trim()) {
      alert("Add a short note on how it was resolved first.");
      return;
    }
    await updateStatus(id, "Completed", {
      completionDescription: completionText.trim(),
      completedAt: new Date(),
    });
    setCompletionText("");
    setSelectedId(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-900">
          Pending — {user?.department || "your department"}
        </h2>
        <p className="text-sm text-ink-500">Tickets waiting on your team.</p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-xl border border-dashed border-paper-300 bg-paper-50 p-8 text-center">
          <p className="text-ink-500">No pending tickets right now — the queue is clear.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-paper-300">
          <table className="min-w-full text-sm">
            <thead className="bg-ink-900 text-left text-paper-200">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Reported by</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((c) => (
                <tr key={c.id} className="border-b border-paper-200 last:border-0 hover:bg-paper-50">
                  <td className="px-4 py-3 font-medium text-ink-900">{c.title}</td>
                  <td className="px-4 py-3 text-ink-500">
                    {c.userName} ({c.role})
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {selectedId === c.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="text"
                          placeholder="Resolution notes"
                          className="w-48 rounded-lg border border-paper-300 px-2 py-1.5 text-sm outline-none focus:border-marigold-500"
                          value={completionText}
                          onChange={(e) => setCompletionText(e.target.value)}
                        />
                        <button
                          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                          onClick={() => handleComplete(c.id)}
                        >
                          Confirm
                        </button>
                        <button
                          className="rounded-lg bg-paper-200 px-3 py-1.5 text-xs font-medium text-ink-700"
                          onClick={() => {
                            setSelectedId(null);
                            setCompletionText("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="rounded-lg bg-marigold-500 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-marigold-400"
                        onClick={() => setSelectedId(c.id)}
                      >
                        Mark resolved
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h3 className="mb-2 font-display text-lg font-semibold text-ink-900">Recently resolved</h3>
        {completed.length === 0 ? (
          <p className="text-sm text-ink-500">Nothing resolved yet.</p>
        ) : (
          <div className="overflow-auto rounded-xl bg-white ring-1 ring-paper-300">
            <table className="min-w-full text-sm">
              <thead className="bg-paper-100 text-left text-ink-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Reported by</th>
                  <th className="px-4 py-2 font-medium">Resolution notes</th>
                  <th className="px-4 py-2 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((c) => (
                  <tr key={c.id} className="border-t border-paper-200">
                    <td className="px-4 py-2">{c.title}</td>
                    <td className="px-4 py-2 text-ink-500">
                      {c.userName} ({c.role})
                    </td>
                    <td className="px-4 py-2 text-ink-500">{c.completionDescription || "—"}</td>
                    <td className="px-4 py-2 font-mono text-xs text-ink-300">
                      {c.completedAt?.seconds
                        ? new Date(c.completedAt.seconds * 1000).toLocaleString()
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingIssues;
