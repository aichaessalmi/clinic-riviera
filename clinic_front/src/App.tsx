import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

// ======== AUTH ========
import Login from "./features/auth/Login";

// ======== APPOINTMENTS ========
import CalendarPage from "./features/appointments/CalendarPage";
import PatientHistoryExport from "./features/appointments/PatientHistoryExport";

// ======== REFERRALS ========
import NewReferral from "./features/referrals/NewReferral";
import MyReferrals from "./features/referrals/MyReferrals";

// ======== SECRETARY ========
import SecretaryDashboard from "./features/secretary/SecretaryDashboard";
import WhatsAppReminders from "./features/secretary/WhatsApp Reminders";
import SecretaryAllReferrals from "./features/secretary/SecretaryAllreferals";

// ======== DIRECTION ========
import Analytics from "./features/direction/statistique";

import ProfileDir from "./features/setting/DirectionAdminPage";

// ======== SETTINGS ========
import Profile from "./features/setting/medecin";
import ProfileSEC from "./features/setting/Secrétaireprofile";


// ======== NOTIFICATIONS ========
import NotificationsPage from "./features/notifications/NotificationsPage";

function HomeRedirect() {
  const { role } = useAuth();
  if (role === "MEDECIN") return <Navigate to="/referrals/mine" replace />;
  if (role === "DIRECTION" || role === "SECRETAIRE") return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

function NotFound() {
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* === LOGIN === */}
          <Route path="/login" element={<Login />} />

          {/* === HOME REDIRECT === */}
          <Route
            path="/"
            element={
              <ProtectedRoute allow={["DIRECTION", "SECRETAIRE", "MEDECIN"]}>
                <AppLayout>
                  <HomeRedirect />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* === DASHBOARD === */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allow={["DIRECTION", "SECRETAIRE"]}>
                <AppLayout>
                  <SecretaryDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* === CALENDAR === */}
          <Route
            path="/calendar"
            element={
              <ProtectedRoute allow={["DIRECTION", "SECRETAIRE"]}>
                <AppLayout>
                  <CalendarPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* === PATIENTS === */}
          <Route
            path="/patients"
            element={
              <ProtectedRoute allow={["DIRECTION", "SECRETAIRE"]}>
                <AppLayout>
                  <WhatsAppReminders />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* === APPOINTMENTS HISTORY EXPORT === */}
          <Route
            path="/appointments"
            element={
              <ProtectedRoute allow={["DIRECTION", "SECRETAIRE"]}>
                <AppLayout>
                  <PatientHistoryExport />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* === ALL REFERRALS === */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allow={["DIRECTION", "SECRETAIRE"]}>
                <AppLayout>
                  <SecretaryAllReferrals />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* === REFERRALS MEDECIN === */}
          <Route
            path="/referrals/new"
            element={
              <ProtectedRoute allow={["MEDECIN"]}>
                <AppLayout>
                  <NewReferral />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/referrals/mine"
            element={
              <ProtectedRoute allow={["MEDECIN"]}>
                <AppLayout>
                  <MyReferrals />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* === ANALYTICS & REFERRALS (DIRECTION) === */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allow={["DIRECTION"]}>
                <AppLayout>
                  <Analytics />
                </AppLayout>
              </ProtectedRoute>
            }
          />
         

          {/* === PROFILES === */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allow={["MEDECIN"]}>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile-sec"
            element={
              <ProtectedRoute allow={["SECRETAIRE"]}>
                <AppLayout>
                  <ProfileSEC />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile-dir"
            element={
              <ProtectedRoute allow={["DIRECTION"]}>
                <AppLayout>
                  <ProfileDir />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* === NOTIFICATIONS === */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allow={["MEDECIN"]}>
                <AppLayout>
                  <NotificationsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* === FALLBACK === */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
