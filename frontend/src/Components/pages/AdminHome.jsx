import React, { useMemo, useState } from "react";
import { useComplaints } from "../../hooks/useComplaints";
import StatTile from "../Shared/StatTile";
import StatusStamp from "../Shared/StatusStamp";
import PriorityBadge from "../Shared/PriorityBadge";
import { formatTimestamp } from "../../utils/docket";
import { Link } from "react-router-dom";
import { FaDownload } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

// This is Campus Voice's analytics dashboard — it lives at /admin (the
// "Overview" / "Analytics" link in the sidebar), and previously read from
// a Firestore collection called "issues" that nothing else in the app ever
// wrote to, so it never showed real data. It now reads the same
// "complaints" collection as everywhere else.
export default function AdminHome() {
  const { complaints, loading } = useComplaints();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    if (!from && !to) return complaints;
    return complaints.filter((c) => {
      if (!c.timestamp?.seconds) return false;
      const date = new Date(c.timestamp.seconds * 1000);
      if (from && date < new Date(from)) return false;
      if (to && date > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  }, [complaints, from, to]);

  const pending = filtered.filter((c) => c.status === "Pending");
  const completed = filtered.filter((c) => c.status === "Completed");
  const byDept = groupBy(filtered, "department");

  const deptChartData = Object.entries(byDept)
    .map(([dept, items]) => ({
      department: dept,
      Pending: items.filter((c) => c.status === "Pending").length,
      Resolved: items.filter((c) => c.status === "Completed").length,
    }))
    .sort((a, b) => b.Pending + b.Resolved - (a.Pending + a.Resolved));

  const trendData = useMemo(() => buildDailyTrend(filtered), [filtered]);

  const exportCsv = () => {
    const rows = [
      ["Docket", "Title", "Department", "Priority", "Status", "Filed by", "Filed at"],
      ...filtered.map((c) => [
        c.id,
        c.title,
        c.department,
        c.priority,
        c.status,
        c.userName,
        c.timestamp?.seconds ? new Date(c.timestamp.seconds * 1000).toISOString() : "",
      ]),
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campus-voice-complaints-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p className="font-mono text-sm text-ink-300">Loading...</p>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900">Analytics</h2>
          <p className="text-sm text-ink-500">Campus-wide ticket volume, resolution, and trends.</p>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-ink-700">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-ink-700">
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input py-1.5 text-sm" />
          </label>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-paper-50 hover:bg-ink-700"
          >
            <FaDownload size={11} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile label="Total tickets" value={filtered.length} />
        <StatTile label="Pending" value={pending.length} tone="marigold" />
        <StatTile label="Resolved" value={completed.length} tone="teal" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 ring-1 ring-paper-300">
          <h3 className="mb-3 font-display text-sm font-semibold text-ink-900">Tickets by department</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={deptChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E4" />
              <XAxis dataKey="department" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Pending" fill="#C29A2E" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Resolved" fill="#2E9E63" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-white p-4 ring-1 ring-paper-300">
          <h3 className="mb-3 font-display text-sm font-semibold text-ink-900">Tickets filed per day</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D2" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1B2536" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink-900">Latest tickets</h3>
          <Link to="/admin/complaints" className="text-sm font-medium text-marigold-700 hover:underline">
            Manage all →
          </Link>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-ink-500">No complaints in this range.</p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white ring-1 ring-paper-300">
            <table className="min-w-full text-sm">
              <thead className="bg-paper-100 text-left text-ink-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Department</th>
                  <th className="px-4 py-2 font-medium">Priority</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Filed</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .slice()
                  .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                  .slice(0, 8)
                  .map((c) => (
                    <tr key={c.id} className="border-t border-paper-200">
                      <td className="px-4 py-2 font-medium text-ink-900">{c.title}</td>
                      <td className="px-4 py-2 text-ink-500">{c.department}</td>
                      <td className="px-4 py-2"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-4 py-2"><StatusStamp status={c.status} /></td>
                      <td className="px-4 py-2 font-mono text-xs text-ink-300">
                        {formatTimestamp(c.timestamp)}
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
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const k = item[key] || "Unassigned";
    acc[k] = acc[k] || [];
    acc[k].push(item);
    return acc;
  }, {});
}

function buildDailyTrend(items) {
  const counts = {};
  items.forEach((c) => {
    if (!c.timestamp?.seconds) return;
    const d = new Date(c.timestamp.seconds * 1000);
    const key = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts).map(([date, count]) => ({ date, count }));
}

function csvEscape(value) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}
