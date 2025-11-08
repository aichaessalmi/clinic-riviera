import axios from "axios";

// ✅ Base URL — ne contient PAS "/accounts"
const API_URL =
  import.meta.env.VITE_API_URL?.trim()?.replace(/\/+$/, "") ||
  "https://clinic-riviera-1.onrender.com/api";

export const http = axios.create({
  baseURL: `${API_URL}/accounts`, // ✅ on ajoute ici UNE seule fois
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

  if (path.startsWith("http")) return path; // URL complète
  if (path.startsWith("data:image")) return path; // image locale

  const cleanPath = path.replace(/^\/?media\//, "");
  const backend =
    import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ||
    "https://clinic-riviera-1.onrender.com";

  const fullUrl = `${backend}/media/${cleanPath}`;
  console.log("🧩 [mediaUrl] Entrée :", path, "➡️ URL finale :", fullUrl);
  return fullUrl;
};
