import React from "react";
import { getPriorityInfo } from "../../config/status";

export default function PriorityBadge({ priority, className = "" }) {
  const info = getPriorityInfo(priority);
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${info.bg} ${info.text} ${className}`}
    >
      {info.label}
    </span>
  );
}
