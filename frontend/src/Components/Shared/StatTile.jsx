import React from "react";

const TONE = {
  ink: "text-ink-900",
  marigold: "text-marigold-700",
  teal: "text-teal-700",
};

export default function StatTile({ label, value, tone = "ink" }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-paper-300">
      <p className={`font-display text-3xl font-bold ${TONE[tone]}`}>{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-300">{label}</p>
    </div>
  );
}
