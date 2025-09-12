import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import Login from "./features/auth/Login";

import CalendarPage from "./features/appointments/CalendarPage";
import NewReferral from "./features/referrals/NewReferral";
import MyReferrals from "./features/referrals/MyReferrals";

import NotificationsPage from "./features/notifications/NotificationsPage";
import SecretaryDashboard from "./features/secretary/SecretaryDashboard";
import Patients from "./features/secretary/Secretarypatients"; 
import Patient from "./features/secretary/SecretaryAllreferals"; 
import Appointments from "./features/appointments/AppointmentsPages"; 

import Analytics from "./features/direction/statistique";
import Referrals from "./features/direction/SupervisionReferences";

function HomeRedirect() {
  const { role } = useAuth();
  if (role === "MEDECIN") return <Navigate to="/referrals/mine" replace />;
  if (role === "DIRECTION" || role === "SECRETAIRE") return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

function NotFound() { return <Navigate to="/" replace />; }

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

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

          {/* ✅ NOUVELLE route Dashboard cohérente */}
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
<Route
            path="/patients"
            element={
              <ProtectedRoute allow={["DIRECTION", "SECRETAIRE"]}>
                <AppLayout>
                  <Patients />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/Appointments"
            element={
              <ProtectedRoute allow={["DIRECTION", "SECRETAIRE"]}>
                <AppLayout>
                  <Appointments />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient"
            element={
              <ProtectedRoute allow={["DIRECTION", "SECRETAIRE"]}>
                <AppLayout>
                  <Patient />
                </AppLayout>
              </ProtectedRoute>
            }
          />
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

          
 <Route
            path="/analtycs"
            element={
              <ProtectedRoute allow={["DIRECTION"]}>
                <AppLayout>
                  <Analytics />
                </AppLayout>
              </ProtectedRoute>
            }
          /> <Route
            path="/Analytics"
            element={
              <ProtectedRoute allow={["DIRECTION"]}>
                <AppLayout>
                  <Analytics />
                </AppLayout>
              </ProtectedRoute>
            }
          /> <Route
            path="/Referrals"
            element={
              <ProtectedRoute allow={["DIRECTION"]}>
                <AppLayout>
                  <Referrals />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
