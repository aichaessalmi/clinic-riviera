// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import Login from "./features/auth/Login";
import AppointmentsPage from "./features/appointments/AppointmentsPage";
import CalendarPage from "./features/appointments/CalendarPage";
import NewReferral from "./features/referrals/NewReferral";
import MyReferrals from "./features/referrals/MyReferrals";
import StatsPage from "./features/direction/StatsPage";
import DashboardPage from "./features/dashboard/DashboardPage";



import NotificationsPage from "./features/notifications/NotificationsPage";
function HomeRedirect() {
  const { user } = useAuth() as { user?: { role?: string } };
  if (user?.role === "MEDECIN") return <Navigate to="/referrals/mine" replace />;
  if (user?.role === "DIRECTION" || user?.role === "SECRETAIRE")
    return <Navigate to="/appointments" replace />;
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
          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Accueil -> redirect selon rôle */}
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

          {/* Dashboard (Direction + Secrétaire) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allow={["DIRECTION", "SECRETAIRE"]}>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

               <Route
  path="/notifications"
  element={
    <ProtectedRoute allow={["MEDECIN","DIRECTION","SECRETAIRE"]}>
      <AppLayout>
        <NotificationsPage />
      </AppLayout>
    </ProtectedRoute>
  }
/>



          {/* Rendez-vous (Direction + Secrétaire) */}
          <Route
            path="/appointments"
            element={
              <ProtectedRoute allow={["DIRECTION", "SECRETAIRE"]}>
                <AppLayout>
                  <AppointmentsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Calendrier (Direction + Secrétaire) */}
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

          {/* Références Médecin */}
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

          {/* Statistiques (Direction uniquement) */}
          <Route
            path="/stats"
            element={
              <ProtectedRoute allow={["DIRECTION"]}>
                <AppLayout>
                  <StatsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}