import axios, { AxiosError } from "axios";
import i18n from "../i18n"; 


function buildBaseURL() {
  let base = import.meta.env.VITE_API_URL?.trim() || "https://clinic-riviera-1.onrender.com";

  // Supprime les "/" finaux
  base = base.replace(/\/+$/, "");

  // Supprime un éventuel "/api" déjà présent à la fin
  base = base.replace(/\/api$/, "");

  // Ajoute une seule fois /api
 const finalBase = base + "/api/accounts";

  console.log("🌐 Base API finale utilisée :", finalBase);
  return finalBase;
}

const http = axios.create({
  baseURL: buildBaseURL(),
  withCredentials: false,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});


http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");

  config.headers = config.headers ?? {};

  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }


  (config.headers as any)["Accept-Language"] = i18n.language || "fr";
  console.log("🧩 import.meta.env.VITE_API_URL =", import.meta.env.VITE_API_URL);

  console.log("🌐 Header Accept-Language envoyé :", (config.headers as any)["Accept-Language"]);

  return config;
});


http.interceptors.response.use(
  (res) => res,
  (error: AxiosError<any>) => {
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
