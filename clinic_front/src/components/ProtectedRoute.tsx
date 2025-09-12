import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({
  allow,
  children,
}: {
  allow?: Array<"DIRECTION" | "SECRETAIRE" | "MEDECIN">;
  children: React.ReactNode;
}) {
  const { ready, access, role } = useAuth();

  // ⏳ tant que l’hydratation n’est pas finie, on ne bouge pas
  if (!ready) {
    return (
      <div className="grid min-h-[30vh] place-items-center text-slate-600">
        Chargement…
      </div>
    );
  }

  if (!access || !role) {
    return <Navigate to="/login" replace />;
  }

  if (allow && !allow.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
