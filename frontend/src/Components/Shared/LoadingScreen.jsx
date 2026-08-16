import React from "react";

export default function LoadingScreen({ label = "Loading..." }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-paper-100">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-paper-300 border-t-marigold-500" />
        <p className="font-mono text-sm text-ink-500">{label}</p>
      </div>
    </div>
  );
}
