import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import http from "../api/http";

type Role = "DIRECTION" | "SECRETAIRE" | "MEDECIN" | null;

type AuthState = {
  access: string | null;
  role: Role;
  username: string | null;
};

type AuthCtx = AuthState & {
  ready: boolean;                   // ✅ important: attendre l’hydratation
  login: (payload: any) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx>({
  access: null,
  role: null,
  username: null,
  ready: false,
  login: async () => {},
  logout: () => {},
});

const MOCKS = {
  DIRECTION: { username: "direction@example.com", password: "passwordDirection" },
  SECRETAIRE:{ username: "secretaire@example.com", password: "passwordSecretaire" },
  MEDECIN:   { username: "medecin@example.com",    code_personnel: "codeMedecin" },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [access, setAccess] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [username, setUsername] = useState<string | null>(null);

  // ✅ Hydratation initiale (évite flicker/logout)
  useEffect(() => {
    const a = localStorage.getItem("access");
    const r = localStorage.getItem("role") as Role | null;
    const u = localStorage.getItem("username");
    if (a) setAccess(a);
    if (r) setRole(r);
    if (u) setUsername(u);
    setReady(true);
  }, []);

  // Persistance
  useEffect(() => {
    if (access) localStorage.setItem("access", access); else localStorage.removeItem("access");
    if (role) localStorage.setItem("role", role); else localStorage.removeItem("role");
    if (username) localStorage.setItem("username", username); else localStorage.removeItem("username");
  }, [access, role, username]);

  const login = async (payload: any) => {
    // 1) Essayer l’API (si dispo)
    try {
      const { data } = await http.post("/auth/login/", payload);
      setAccess(data.access || "api-token");
      setRole((data.role as Role) ?? null);
      setUsername(data.username ?? payload.username ?? null);
      return;
    } catch (apiErr: any) {
      // 2) Fallback “mock” côté front (démo sans backend)
      const r: Role = payload.role;
      if (r === "MEDECIN") {
        const ok =
          payload.username === MOCKS.MEDECIN.username &&
          payload.code_personnel === MOCKS.MEDECIN.code_personnel;
        if (!ok) throw new Error("Identifiants médecin invalides (mock)");
        setAccess("mock-token");
        setRole("MEDECIN");
        setUsername(payload.username);
        return;
      }
      if (r === "DIRECTION" || r === "SECRETAIRE") {
        const M = MOCKS[r];
        const ok =
          payload.username === M.username &&
          payload.password === M.password;
        if (!ok) throw new Error("Identifiants invalides (mock)");
        setAccess("mock-token");
        setRole(r);
        setUsername(payload.username);
        return;
      }
      // Si rien ne correspond
      throw apiErr;
    }
  };

  const logout = () => {
    setAccess(null);
    setRole(null);
    setUsername(null);
  };

  const value = useMemo(
    () => ({ access, role, username, login, logout, ready }),
    [access, role, username, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
