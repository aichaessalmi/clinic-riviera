import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import http from "../api/http";

type Role = "DIRECTION" | "SECRETAIRE" | "MEDECIN" | null;

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string;
};

type AuthState = {
  access: string | null;
  role: Role;
  username: string | null;
  user: User | null;   // 👈 ajouté
};

type AuthCtx = AuthState & {
  ready: boolean;
  login: (payload: any) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx>({
  access: null,
  role: null,
  username: null,
  user: null,     // 👈 ajouté
  ready: false,
  login: async () => {},
  logout: () => {},
});

const MOCKS = {
  DIRECTION: { username: "direction@example.com", password: "passwordDirection" },
  SECRETAIRE: { username: "secretaire@example.com", password: "passwordSecretaire" },
  MEDECIN: { username: "medecin@example.com", code_personnel: "codeMedecin" },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [access, setAccess] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null); // 👈 ajouté

  // ✅ Hydratation initiale
  useEffect(() => {
    const a = localStorage.getItem("access");
    const r = localStorage.getItem("role") as Role | null;
    const u = localStorage.getItem("username");
    const uData = localStorage.getItem("user");

    if (a) setAccess(a);
    if (r) setRole(r);
    if (u) setUsername(u);
    if (uData) setUser(JSON.parse(uData));

    setReady(true);
  }, []);

  // Persistance
  useEffect(() => {
    if (access) localStorage.setItem("access", access);
    else localStorage.removeItem("access");

    if (role) localStorage.setItem("role", role);
    else localStorage.removeItem("role");

    if (username) localStorage.setItem("username", username);
    else localStorage.removeItem("username");

    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [access, role, username, user]);

  const login = async (payload: any) => {
    try {
      const { data } = await http.post("/auth/login/", payload);
      setAccess(data.access || "api-token");
      setRole((data.role as Role) ?? null);
      setUsername(data.username ?? payload.username ?? null);

      // si API renvoie un user
      if (data.user) {
        setUser(data.user);
      } else {
        // fallback
        setUser({
          id: 1,
          first_name: "Dr.",
          last_name: "Utilisateur",
          email: data.username ?? "inconnu@test.com",
          avatar: "https://randomuser.me/api/portraits/men/45.jpg",
        });
      }
      return;
    } catch (apiErr: any) {
      // Mock fallback
      const r: Role = payload.role;
      if (r === "MEDECIN") {
        const ok =
          payload.username === MOCKS.MEDECIN.username &&
          payload.code_personnel === MOCKS.MEDECIN.code_personnel;
        if (!ok) throw new Error("Identifiants médecin invalides (mock)");
        setAccess("mock-token");
        setRole("MEDECIN");
        setUsername(payload.username);
        setUser({
          id: 2,
          first_name: "Ali",
          last_name: "Ben Omar",
          email: payload.username,
          avatar: "https://randomuser.me/api/portraits/men/75.jpg",
        });
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
        setUser({
          id: 3,
          first_name: r === "DIRECTION" ? "Mme" : "Secrétaire",
          last_name: r,
          email: payload.username,
          avatar: "https://randomuser.me/api/portraits/women/65.jpg",
        });
        return;
      }
      throw apiErr;
    }
  };

  const logout = () => {
    setAccess(null);
    setRole(null);
    setUsername(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ access, role, username, user, login, logout, ready }),
    [access, role, username, user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
