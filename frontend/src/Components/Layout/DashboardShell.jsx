import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "../pages/Navbar";
import { useCurrentUser } from "../../context/AuthContext";
import { useComplaints } from "../../hooks/useComplaints";

export default function DashboardShell({ role }) {
  const { user } = useCurrentUser();
  const { complaints } = useComplaints();

  const pendingCount = complaints.filter(
    (c) => c.status === "Pending" && c.department === user?.department
  ).length;

  return (
    <div className="flex min-h-screen bg-paper-100">
      <Sidebar role={role} pendingCount={pendingCount} />
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
