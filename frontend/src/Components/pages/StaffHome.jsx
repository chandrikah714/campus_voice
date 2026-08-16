import React from "react";
import Home from "./Home";
import { useComplaints } from "../../hooks/useComplaints";
import { useCurrentUser } from "../../context/AuthContext";
import StatTile from "../Shared/StatTile";

export default function StaffHome() {
  const { user } = useCurrentUser();
  const { complaints } = useComplaints();
  const forDept = complaints.filter((c) => c.department === user?.department);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile label={`${user?.department || "Your"} queue`} value={forDept.length} />
        <StatTile
          label="Pending"
          value={forDept.filter((c) => c.status === "Pending").length}
          tone="marigold"
        />
        <StatTile
          label="Resolved"
          value={forDept.filter((c) => c.status === "Completed").length}
          tone="teal"
        />
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl font-bold text-ink-900">Campus board</h2>
        <Home />
      </div>
    </div>
  );
}
