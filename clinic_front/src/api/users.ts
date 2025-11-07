// src/api/users.ts
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/accounts"; // adapte si nécessaire

export const http = axios.create({
  baseURL: API_URL,
});

// Middleware token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ----------- 🔹 API UTILISATEUR --------------

// ✅ Récupérer les infos du user connecté
export const getCurrentUser = async () => {
  const res = await http.get("/auth/me/");
  return res.data;
};

// ✅ Mettre à jour les infos textuelles du profil
export const updateCurrentUser = async (data: FormData | Record<string, any>) => {
  const res = await http.patch("/me/update/", data, {
    headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
  });
  return res.data;
};

// ✅ Nouvelle fonction : upload de la photo uniquement
export const updateCurrentUserPhoto = async (file: File) => {
  const formData = new FormData();
  formData.append("photo", file);
  const res = await http.patch("/me/update/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const mediaUrl = (path?: string | null) => {
  if (!path) return "";

  // ✅ Cas 1 : déjà une URL absolue (http, https)
  if (path.startsWith("http")) return path;

  // ✅ Cas 2 : c’est une image locale encodée en base64 (prévisualisation)
  if (path.startsWith("data:image")) return path;

  // ✅ Cas 3 : chemin relatif provenant du backend (ex: "media/users/photo.jpg" ou "/media/users/photo.jpg")
  const cleanPath = path.replace(/^\/?media\//, "");

  const backend =
    import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";

  const fullUrl = `${backend}/media/${cleanPath}`;
  console.log("🧩 [mediaUrl] Entrée :", path, "➡️ URL finale :", fullUrl);

  return fullUrl;
};
