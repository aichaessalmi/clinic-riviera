import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";


/* =====================================
   🔹 Types
===================================== */
type Role = "DIRECTION" | "SECRETAIRE" | "MEDECIN" | null;

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string;
  photo?: string | null;
};

type AuthState = {
  access: string | null;
  role: Role;
  username: string | null;
  user: User | null;
};

type AuthCtx = AuthState & {
  ready: boolean;
  login: (payload: any) => Promise<void>;
  logout: () => void;
};

/* =====================================
   🔹 Contexte
===================================== */
const AuthContext = createContext<AuthCtx>({
  access: null,
  role: null,
  username: null,
  user: null,
  ready: false,
  login: async () => {},
  logout: () => {},
});

/* =====================================
   🔹 Provider
===================================== */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [ready, setReady] = useState(false);
  const [access, setAccess] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  /* ---------------- Hydratation initiale ---------------- */
  useEffect(() => {
    const a = localStorage.getItem("access");
    const r = localStorage.getItem("role") as Role | null;
    const u = localStorage.getItem("username");
    const uData = localStorage.getItem("user");

    if (a) setAccess(a);
    if (r) setRole(r);
    if (u) setUsername(u);
    if (uData) {
      try {
        setUser(JSON.parse(uData));
      } catch {
        localStorage.removeItem("user");
      }
    }

    setReady(true);
  }, []);

  /* ---------------- Persistance ---------------- */
  useEffect(() => {
    access
      ? localStorage.setItem("access", access)
      : localStorage.removeItem("access");
    role
      ? localStorage.setItem("role", role)
      : localStorage.removeItem("role");
    username
      ? localStorage.setItem("username", username)
      : localStorage.removeItem("username");
    user
      ? localStorage.setItem("user", JSON.stringify(user))
      : localStorage.removeItem("user");
  }, [access, role, username, user]);

  /* =====================================
     🔐 LOGIN principal
  ===================================== */
  const login = async (payload: any) => {
    try {
      // ✅ Construire un objet conforme au backend
      const dataToSend: any = {
        username: payload.username,
        role: payload.role?.toUpperCase(),
      };

      if (payload.role?.toUpperCase() === "MEDECIN") {
        dataToSend.code_personnel = payload.code_personnel;
      } else {
        dataToSend.password = payload.password;
      }

      // ✅ Envoi au backend (url correcte selon ton API)
      const { data } = await axios.post(
        "http://127.0.0.1:8000/api/accounts/auth/login/",
        dataToSend
      );

      // ✅ Stocker le token JWT
      if (data.access) {
        localStorage.setItem("access", data.access);
        setAccess(data.access);
      }

      if (data.refresh) {
        localStorage.setItem("refresh", data.refresh);
      }

      // ✅ Stocker infos utilisateur
      setRole((data.role as Role) ?? payload.role ?? null);
      setUsername(data.username ?? payload.username ?? null);

      if (data.user) {
        setUser(data.user);
      } else {
        setUser({
          id: 1,
          first_name: data.username ?? "",
          last_name: "",
          email: data.username ?? "",
        });
      }
    } catch (error: any) {
      console.error("❌ Erreur d’authentification :", error);
      throw new Error(
        error?.response?.data?.detail || "Identifiants invalides."
      );
    }
  };

  /* =====================================
     🚪 LOGOUT
  ===================================== */
  const logout = () => {
    setAccess(null);
    setRole(null);
    setUsername(null);
    setUser(null);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  /* =====================================
     ♻️ Rafraîchissement automatique du token
  ===================================== */
  useEffect(() => {
    const refreshToken = async () => {
      const refresh = localStorage.getItem("refresh");
      if (!refresh) return;
      try {
        const { data } = await axios.post(
          "http://127.0.0.1:8000/api/accounts/auth/refresh/",
          { refresh }
        );
        if (data.access) {
          localStorage.setItem("access", data.access);
          setAccess(data.access);
        }
      } catch (e) {
        console.warn("⚠️ Échec du rafraîchissement du token :", e);
        logout();
      }
    };

    // rafraîchir toutes les 9 minutes
    const interval = setInterval(refreshToken, 9 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /* =====================================
     💾 Valeur du contexte
  ===================================== */
  const value = useMemo(
    () => ({ access, role, username, user, login, logout, ready }),
    [access, role, username, user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* =====================================
   🪄 Hook personnalisé
===================================== */
export const useAuth = () => useContext(AuthContext);
