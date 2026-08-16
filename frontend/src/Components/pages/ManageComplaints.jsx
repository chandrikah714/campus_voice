import React, { useState } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { useComplaints } from "../../hooks/useComplaints";
import StatusStamp from "../Shared/StatusStamp";
import PriorityBadge from "../Shared/PriorityBadge";
import { docketNumber } from "../../utils/docket";

const FILTERS = ["All", "Pending", "Completed"];

const ManageComplaints = () => {
  const { complaints, updateStatus } = useComplaints();
  const [filter, setFilter] = useState("All");

  const removeComplaint = async (id) => {
    if (!window.confirm("Delete this complaint? This can't be undone.")) return;
    await deleteDoc(doc(db, "complaints", id));
  };

  const filtered = filter === "All" ? complaints : complaints.filter((c) => c.status === filter);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-900">Manage complaints</h2>
        <p className="text-sm text-ink-500">{complaints.length} tickets across all departments</p>
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
        <p className="text-sm text-ink-500">No complaints found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className={`rounded-xl bg-white p-4 ring-1 ring-paper-300 ${
                c.status === "Completed" ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs text-ink-300">{docketNumber(c.id)}</span>
                <StatusStamp status={c.status} />
              </div>
              <h3 className="mt-1 font-display text-lg font-semibold text-ink-900">{c.title}</h3>
              <p className="text-sm text-ink-700">{c.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                <span>
                  {c.userName} ({c.role})
                </span>
                <span>· {c.department}</span>
                <span>· {c.location}</span>
                <PriorityBadge priority={c.priority} />
              </div>

              <div className="mt-3 flex gap-2">
                {c.status !== "Completed" && (
                  <button
                    onClick={() => updateStatus(c.id, "Completed")}
                    className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                  >
                    Mark resolved
                  </button>
                )}
                {c.status !== "Pending" && (
                  <button
                    onClick={() => updateStatus(c.id, "Pending")}
                    className="rounded-lg bg-marigold-400 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-marigold-500"
                  >
                    Mark pending
                  </button>
                )}
                <button
                  onClick={() => removeComplaint(c.id)}
                  className="rounded-lg bg-coral-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-coral-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageComplaints;
