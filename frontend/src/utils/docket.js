// Turns a Firestore complaint id into a short, stable, human-friendly
// "docket number" (e.g. "CV-4F2A") for display on the ticket-stub card —
// purely cosmetic, doesn't change or replace the real document id.
export function docketNumber(id) {
  if (!id) return "CV-0000";
  const hash = id
    .split("")
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 65536, 7);
  return `CV-${hash.toString(16).toUpperCase().padStart(4, "0")}`;
}

export function formatTimestamp(ts) {
  if (!ts) return "—";
  const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "just now" / "5m ago" / "3h ago" / falls back to a short date once old. */
export function timeAgo(ts) {
  if (!ts) return "—";
  const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  if (Number.isNaN(date.getTime())) return "—";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 30) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
