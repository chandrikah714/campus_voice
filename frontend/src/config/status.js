// Single source of truth for complaint status + priority display info,
// so every page (Card, MyIssues, PendingIssues, ManageComplaints...) renders
// the same colors and labels instead of each re-implementing its own map.

export const STATUS = {
  Pending: {
    label: "Pending",
    dot: "bg-marigold-500",
    text: "text-marigold-700",
    bg: "bg-marigold-50",
    ring: "ring-marigold-200",
  },
  Completed: {
    label: "Resolved",
    dot: "bg-teal-500",
    text: "text-teal-700",
    bg: "bg-teal-50",
    ring: "ring-teal-200",
  },
};

export const PRIORITY = {
  High: { label: "High", bg: "bg-coral-500", text: "text-white" },
  Medium: { label: "Medium", bg: "bg-marigold-400", text: "text-ink-900" },
  Low: { label: "Low", bg: "bg-teal-400", text: "text-ink-900" },
};

export const getStatusInfo = (status) => STATUS[status] || STATUS.Pending;
export const getPriorityInfo = (priority) => PRIORITY[priority] || PRIORITY.Low;
