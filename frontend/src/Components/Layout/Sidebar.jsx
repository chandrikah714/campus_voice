import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaClipboardList,
  FaUser,
  FaPlus,
  FaUsers,
  FaExclamationCircle,
  FaBell,
  FaCog,
  FaMapMarkedAlt,
  FaEnvelope,
} from "react-icons/fa";
import logo from "../../assets/logoNew.jpg";

const ICONS = {
  home: FaHome,
  issues: FaClipboardList,
  add: FaPlus,
  user: FaUser,
  users: FaUsers,
  complaints: FaExclamationCircle,
  bell: FaBell,
  settings: FaCog,
  map: FaMapMarkedAlt,
  mail: FaEnvelope,
};

// Nav items per role. Every path is a *real* route (see App.jsx) so the URL
// bar, browser back button, and page refresh all behave correctly — the
// previous version tracked the active page in component state instead of
// the URL, which broke deep-linking and the back button entirely.
const NAV_BY_ROLE = {
  admin: [
    { to: "/admin", label: "Analytics", icon: "home", end: true },
    { to: "/admin/complaints", label: "Complaints", icon: "complaints" },
    { to: "/admin/map", label: "Map", icon: "map" },
    { to: "/admin/email-logs", label: "Email delivery", icon: "mail" },
    { to: "/admin/users", label: "Manage Users", icon: "users" },
  ],
  staff: [
    { to: "/staff", label: "Overview", icon: "home", end: true },
    { to: "/staff/pending-issues", label: "Pending Issues", icon: "issues" },
    { to: "/staff/map", label: "Map", icon: "map" },
  ],
  student: [
    { to: "/student", label: "Overview", icon: "home", end: true },
    { to: "/student/my-issues", label: "My Issues", icon: "issues" },
    { to: "/student/report", label: "Report an Issue", icon: "add" },
    { to: "/student/map", label: "Map", icon: "map" },
    { to: "/student/notifications", label: "Notifications", icon: "bell" },
  ],
};

const ROLE_LABEL = {
  admin: "Admin",
  staff: "Staff",
  student: "Student",
};

export default function Sidebar({ role, pendingCount = 0 }) {
  const items = NAV_BY_ROLE[role] || [];

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col self-start overflow-y-auto bg-ink-900 text-paper-100">
      <div className="flex items-center gap-3 border-b border-ink-700 px-5 py-5">
        <img src={logo} alt="" className="h-9 w-9 rounded-md object-cover" />
        <div>
          <p className="font-display text-sm font-bold leading-tight">Campus Voice</p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-300">
            {ROLE_LABEL[role] || ""} desk
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const showBadge = item.to.endsWith("pending-issues") && pendingCount > 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-marigold-500 text-ink-900"
                    : "text-paper-200 hover:bg-ink-700"
                }`
              }
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              {showBadge && (
                <span className="rounded-full bg-coral-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
