import React, { createContext, useContext, useEffect, useState } from "react";
import http from "../api/http";

type Role = "DIRECTION" | "SECRETAIRE" | "MEDECIN" | null;

type AuthState = {
  access: string | null;
  role: Role;
  username: string | null;
};

type AuthCtx = AuthState & {
  login: (payload: any) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx>({
  access: null,
  role: null,
  username: null,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [access, setAccess] = useState<string | null>(localStorage.getItem("access"));
  const [role, setRole] = useState<Role>((localStorage.getItem("role") as Role) || null);
  const [username, setUsername] = useState<string | null>(localStorage.getItem("username"));

  useEffect(() => {
    if (access) localStorage.setItem("access", access); else localStorage.removeItem("access");
    if (role) localStorage.setItem("role", role); else localStorage.removeItem("role");
    if (username) localStorage.setItem("username", username); else localStorage.removeItem("username");
  }, [access, role, username]);

  const login = async (payload: any) => {
    try {
      const { data } = await http.post("/auth/login/", payload);

      setAccess(data.access);
      setRole(data.role as Role);
      setUsername(data.username);
    } catch (err: any) {
      if (err.response) {
        // on relance avec un objet simple
        throw {
          status: err.response.status,
          message: err.response.data?.detail || "Authentication failed",
        };
      }
      throw { status: 500, message: err.message || "Unexpected error" };
    }
  };

  const logout = () => {
    setAccess(null);
    setRole(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ access, role, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
