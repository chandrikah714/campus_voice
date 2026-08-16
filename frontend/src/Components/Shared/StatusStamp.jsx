import React from "react";
import { getStatusInfo } from "../../config/status";

/**
 * Renders a complaint's status as a rubber-stamp mark — the app's signature
 * visual: campus work orders get physically stamped PENDING / RESOLVED,
 * so the digital version echoes that.
 */
export default function StatusStamp({ status, className = "" }) {
  const info = getStatusInfo(status);
  return (
    <span
      className={`inline-block -rotate-3 rounded-sm border-2 px-2.5 py-0.5 font-display text-[11px] font-bold uppercase tracking-wider
        ${info.text} ${info.bg} ${className}`}
      style={{ borderColor: "currentColor" }}
    >
      {info.label}
    </span>
  );
}
