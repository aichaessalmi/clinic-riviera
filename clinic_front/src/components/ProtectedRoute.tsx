import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { ReactNode } from "react";

type Props = {
  allow: ("DIRECTION" | "SECRETAIRE" | "MEDECIN")[];
  children: ReactNode;
};

export default function ProtectedRoute({ allow, children }: Props) {
  const { access, role } = useAuth();

  if (!access || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
