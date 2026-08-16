import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

import Register from "./Components/Login/Register";
import Login from "./Components/Login/Login";
import PrivateRoute from "./Components/Routes/PrivateRoute";
import DashboardShell from "./Components/Layout/DashboardShell";
import { useCurrentUser } from "./context/AuthContext";
import LoadingScreen from "./Components/Shared/LoadingScreen";
import StuckAccountScreen from "./Components/Shared/StuckAccountScreen";

// Admin
const AdminHome = lazy(() => import("./Components/pages/AdminHome"));
import ManageUsers from "./Components/pages/ManageUsers";
import ManageComplaints from "./Components/pages/ManageComplaints";
import EmailDeliveryLog from "./Components/pages/EmailDeliveryLog";

// Staff
import StaffHome from "./Components/pages/StaffHome";
import PendingIssues from "./Components/pages/PendingIssues";

// Student
import StudentHome from "./Components/pages/StudentHome";
import MyIssues from "./Components/pages/MyIssues";
const ReportIssue = lazy(() => import("./Components/pages/ReportIssue"));
import Notifications from "./Components/pages/Notifications";

// Shared
import AccountSettings from "./Components/pages/AccountSettings";
const MapView = lazy(() => import("./Components/Map/MapView"));

// Sends a signed-in user to their role's dashboard, or to /login if signed out.
// This is the one place that decides "where does this person belong" —
// previously that logic was half-duplicated inside Login.jsx's own
// post-submit navigate() calls.
function RoleRedirect() {
  const { isAuthenticated, role, loading, authTimedOut, profileMissing, profileError, retryProfile } =
    useCurrentUser();
  if (authTimedOut) return <StuckAccountScreen reason="timeout" onRetry={() => window.location.reload()} />;
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "staff") return <Navigate to="/staff" replace />;
  if (role === "student") return <Navigate to="/student" replace />;
  if (profileError) return <StuckAccountScreen reason="permission" onRetry={retryProfile} />;
  if (profileMissing) return <StuckAccountScreen reason="missing" onRetry={retryProfile} />;
  return <LoadingScreen label="Setting up your account..." />;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen label="Loading map..." />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin */}
        <Route path="/admin" element={<PrivateRoute allowedRoles={["admin"]} />}>
          <Route element={<DashboardShell role="admin" />}>
            <Route index element={<AdminHome />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="complaints" element={<ManageComplaints />} />
            <Route path="map" element={<MapView scope="all" />} />
            <Route path="email-logs" element={<EmailDeliveryLog />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>
        </Route>

        {/* Staff */}
        <Route path="/staff" element={<PrivateRoute allowedRoles={["staff"]} />}>
          <Route element={<DashboardShell role="staff" />}>
            <Route index element={<StaffHome />} />
            <Route path="pending-issues" element={<PendingIssues />} />
            <Route path="map" element={<MapView scope="department" />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>
        </Route>

        {/* Student */}
        <Route path="/student" element={<PrivateRoute allowedRoles={["student"]} />}>
          <Route element={<DashboardShell role="student" />}>
            <Route index element={<StudentHome />} />
            <Route path="my-issues" element={<MyIssues />} />
            <Route path="report" element={<ReportIssue />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="map" element={<MapView scope="all" />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>
        </Route>

        <Route path="/" element={<RoleRedirect />} />
        <Route path="*" element={<RoleRedirect />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
