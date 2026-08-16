import React from "react";

export default function MapLegend({ mode }) {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-xs text-ink-700 shadow-md ring-1 ring-paper-300 backdrop-blur">
      <p className="mb-1.5 font-semibold text-ink-900">
        {mode === "heatmap" ? "Density & severity" : "Priority"}
      </p>
      <div className="flex items-center gap-3">
        <LegendDot color="bg-teal-500" label="Low" />
        <LegendDot color="bg-marigold-500" label="Medium" />
        <LegendDot color="bg-coral-500" label="High" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
