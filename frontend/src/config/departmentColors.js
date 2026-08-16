import { DEPARTMENTS } from "./departments";

// Cycles departments through the palette's accent hues so tickets are
// visually scannable by department at a glance, without a dedicated color
// per department needing manual upkeep as departments change.
const HUES = ["marigold", "teal", "sky", "plum", "coral"];

const HUE_CLASSES = {
  marigold: { bg: "bg-marigold-50", text: "text-marigold-700", dot: "bg-marigold-500", gradient: "bg-gradient-to-br from-marigold-500 to-marigold-600" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500", gradient: "bg-gradient-to-br from-teal-500 to-teal-700" },
  sky: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500", gradient: "bg-gradient-to-br from-sky-500 to-sky-700" },
  plum: { bg: "bg-plum-50", text: "text-plum-700", dot: "bg-plum-500", gradient: "bg-gradient-to-br from-plum-500 to-plum-700" },
  coral: { bg: "bg-coral-50", text: "text-coral-700", dot: "bg-coral-500", gradient: "bg-gradient-to-br from-coral-500 to-coral-700" },
};

export function departmentColor(department) {
  const idx = Math.max(0, DEPARTMENTS.indexOf(department));
  const hue = HUES[idx % HUES.length];
  return HUE_CLASSES[hue];
}
