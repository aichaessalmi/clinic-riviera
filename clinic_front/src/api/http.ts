import axios, { AxiosError } from "axios";

/** Joins base origin with /api exactly once */
function buildBaseURL() {
  const raw = import.meta.env.VITE_API_URL?.toString().trim();
  // 1) Si VITE_API_URL est défini → on s’y fie
  if (raw) {
    // si l’URL contient déjà /api à la fin, on ne le rajoute pas.
    if (/\b\/api\/?$/.test(raw)) return raw.replace(/\/+$/, "");
    return raw.replace(/\/+$/, "") + "/api";
  }
  // 2) Sinon: dev local
  return "http://127.0.0.1:8000/api";
}

const http = axios.create({
  baseURL: buildBaseURL(),
  // JWT → pas besoin de cookies
  withCredentials: false,
  // évite que des requêtes pendantes bloquent l’UI
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

// 🔹 Intercepteur requête – ajoute le token si présent
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔹 Intercepteur réponse – normalise les erreurs
http.interceptors.response.use(
  (res) => res,
  (error: AxiosError<any>) => {
    // format d’erreur homogène pour tes catch()
    const status = error.response?.status ?? 0;
    const data = error.response?.data;
    const message =
      (typeof data === "string" && data) ||
      data?.detail ||
      data?.message ||
      error.message ||
      "Request failed";
    return Promise.reject({ status, message, raw: error });
  }
);

export default http;
