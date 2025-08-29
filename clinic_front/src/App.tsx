import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import Login from "./features/auth/Login";
import AppointmentsPage from "./features/appointments/AppointmentsPage";
import CalendarPage from "./features/appointments/CalendarPage";
import NewReferral from "./features/referrals/NewReferral";
import MyReferrals from "./features/referrals/MyReferrals";
import StatsPage from "./features/direction/StatsPage";
import DashboardPage from "./features/dashboard/DashboardPage"; // ✅ placé ici

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Page d’accueil → redirection selon rôle */}
          <Route path="/" element={
            <ProtectedRoute allow={["DIRECTION","SECRETAIRE","MEDECIN"]}>
              <AppLayout><Navigate to="/appointments" /></AppLayout>
            </ProtectedRoute>
          }/>

          {/* Dashboard accessible à Direction & Secrétaire */}
          <Route path="/dashboard" element={
            <ProtectedRoute allow={["DIRECTION","SECRETAIRE"]}>
              <AppLayout><DashboardPage /></AppLayout>
            </ProtectedRoute>
          }/>

          {/* Rendez-vous */}
          <Route path="/appointments" element={
            <ProtectedRoute allow={["DIRECTION","SECRETAIRE"]}>
              <AppLayout><AppointmentsPage /></AppLayout>
            </ProtectedRoute>
          }/>

          {/* Calendrier */}
          <Route path="/calendar" element={
            <ProtectedRoute allow={["DIRECTION","SECRETAIRE"]}>
              <AppLayout><CalendarPage /></AppLayout>
            </ProtectedRoute>
          }/>

          {/* Références médecin */}
          <Route path="/referrals/new" element={
            <ProtectedRoute allow={["MEDECIN"]}>
              <AppLayout><NewReferral /></AppLayout>
            </ProtectedRoute>
          }/>
          <Route path="/referrals/mine" element={
            <ProtectedRoute allow={["MEDECIN"]}>
              <AppLayout><MyReferrals /></AppLayout>
            </ProtectedRoute>
          }/>

          {/* Statistiques uniquement pour la Direction */}
          <Route path="/stats" element={
            <ProtectedRoute allow={["DIRECTION"]}>
              <AppLayout><StatsPage /></AppLayout>
            </ProtectedRoute>
          }/>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
