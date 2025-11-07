import React, { useState, useEffect } from "react";
import {
  getCurrentUser,
  updateCurrentUser,
  updateCurrentUserPhoto,
  mediaUrl,
} from "../../api/users";
import { useTranslation } from "react-i18next";
import http from "../../api/http";


/** Types */
type UserProfile = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: "SECRETAIRE" | "DIRECTION" | "MEDECIN";
  specialite: string | { id: number; name_fr: string; name_en: string; name?: string };

  departement: string;
  licenceMedicale: string;
  dateAdhesion: string;
  photo: string | null;
  langue: "fr" | "en";
  theme: "light" | "dark" | "auto";
  code_personnel: string;
  notifications: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    rappels: boolean;
    nouvelles: boolean;
  };
};

const DEPARTEMENTS = [
  "Médecine Interne",
  "Chirurgie",
  "Pédiatrie",
  "Urgences",
  "Radiologie",
  "Laboratoire",
  "Administration",
];

// 🔹 Icônes manquantes
const UserIcon = () => <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SettingsIcon = () => <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ShieldIcon = () => <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const DownloadIcon = () => <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

// ==================== COMPOSANT TOAST ====================
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500'
  }[type];

  const icon = {
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type];

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm animate-fade-in`}>
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="flex-1">{message}</span>
        <button onClick={onClose} className="text-white hover:text-gray-200 text-lg">
          ×
        </button>
      </div>
    </div>
  );
};

/** Composant principal Settings */
const ProfessionalSettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<"profil" | "preferences" | "securite">("profil");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
    // ==================== 🔹 Spécialités bilingues ====================
 const [specialties, setSpecialties] = useState<
  { id: number; name_fr: string; name_en: string; name: string }[]
>([]);

useEffect(() => {
  (async () => {
    try {
      const { data } = await http.get("/accounts/specialties/", {
        headers: { "Accept-Language": i18n.language },
      });

      console.log("📦 Réponse API specialties :", data);
      // ✅ récupère data.results car c’est un objet paginé
      setSpecialties(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      console.error("❌ Erreur lors du chargement des spécialités :", err);
    }
  })();
}, [i18n.language]);


// 🟢 Fonction pour retrouver le nom de la spécialité selon la langue
const getSpecialtyName = (specialite?: any) => {
  if (!specialite) return "—";
  // Si c’est déjà un objet {id, name, name_fr, name_en}
  if (typeof specialite === "object") {
    return i18n.language.startsWith("en")
      ? specialite.name_en
      : specialite.name_fr;
  }
  // Si c’est un ID (fallback)
  const found = specialties.find((s) => s.id === Number(specialite));
  return found
    ? i18n.language.startsWith("en")
      ? found.name_en
      : found.name_fr
    : "—";
};

  // 🔹 États pour la sécurité
  const [_currentCode, setCurrentCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // 🔹 Fonction pour afficher les toasts
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  // 🎨 Gestion du thème : applique selon le choix utilisateur uniquement
  useEffect(() => {
    const html = document.documentElement;
    const theme = profile?.theme || localStorage.getItem("theme") || "light";

    // Sauvegarde la préférence utilisateur
    localStorage.setItem("theme", theme);

    // Supprime toujours la classe avant d'ajouter
    html.classList.remove("dark");

    if (theme === "dark") {
      html.classList.add("dark"); // active le mode sombre
    } else if (theme === "auto") {
      // mode "auto" → suit les préférences système
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        html.classList.add("dark");
      }
    }

    console.log("🎨 Thème appliqué :", theme);
  }, [profile?.theme]);

  // 🔹 Charger le profil depuis le backend
  useEffect(() => {
    (async () => {
      try {
        const me = await getCurrentUser();
        const userProfile = {
          id: me.id,
          prenom: me.first_name || "",
          nom: me.last_name || "",
          email: me.email,
          telephone: me.telephone || "",
          role: me.role,
          specialite: me.specialite || "",
          departement: me.departement || "",
          licenceMedicale: me.licence_medicale || "",
          dateAdhesion: me.date_adhesion || "",
          photo: me.photo || null,
          langue: me.langue || "fr",
          theme: me.theme || "light",
          code_personnel: me.code_personnel || "",
          notifications: me.notifications || {
            email: true,
            sms: false,
            whatsapp: true,
            rappels: true,
            nouvelles: true,
          },
        };
        
        setProfile(userProfile);
        
        // 🔹 Appliquer la langue et le thème
        if (me.langue && me.langue !== i18n.language) {
          i18n.changeLanguage(me.langue);
        }
        
        // Appliquer le thème
        if (me.theme) {
          applyTheme(me.theme);
        }
        
      } catch (err) {
        console.error("❌ Erreur de chargement du profil :", err);
        showToast("Erreur de chargement du profil", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [i18n]);

  // 🔹 Fonction pour appliquer le thème
  const applyTheme = (theme: string) => {
    const html = document.documentElement;
    html.classList.remove("light", "dark");
    
    if (theme === "auto") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      html.classList.add(prefersDark ? "dark" : "light");
    } else {
      html.classList.add(theme);
    }
  };

  // 🔹 Gérer la mise à jour locale d'un champ du profil
  const handleProfileUpdate = (field: keyof UserProfile, value: any) => {
    setProfile((prev) => {
      if (!prev) return prev;
      
      const updatedProfile = { ...prev, [field]: value };
      
      // 🔹 Appliquer immédiatement les changements de langue et thème
      if (field === "langue" && value !== i18n.language) {
        i18n.changeLanguage(value);
      }
      
      if (field === "theme") {
        applyTheme(value);
      }
      
      return updatedProfile;
    });
  };

  // 🔹 Fonction pour basculer les notifications
  const handleNotificationToggle = (key: keyof UserProfile["notifications"]) => {
    if (!profile) return;
    
    setProfile(prev => prev ? {
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    } : prev);
  };

  // 🔹 Fonction pour sauvegarder le profil
 const handleSaveProfile = async () => {
  if (!profile) return;
  setIsSaving(true);
  try {
    const payload = {
      first_name: profile.prenom,
      last_name: profile.nom,
      email: profile.email,
      telephone: profile.telephone,
      specialite: profile.specialite ? Number(profile.specialite) : null,
      departement: profile.departement,
      licence_medicale: profile.licenceMedicale,
      langue: profile.langue,
      theme: profile.theme,
      notifications: profile.notifications,
    };

    await updateCurrentUser(payload);
    showToast("Profil mis à jour avec succès !", "success");
    setIsEditing(false);
  } catch (err) {
    console.error("❌ Erreur lors de la mise à jour :", err);
    showToast("Erreur lors de la mise à jour du profil", "error");
  } finally {
    setIsSaving(false);
  }
}; // ✅ cette accolade et ce point-virgule sont indispensables



  // 🔹 Fonction pour gérer l'upload de photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille du fichier (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast("La taille du fichier ne doit pas dépasser 5MB", "warning");
      return;
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      showToast("Veuillez sélectionner un fichier image valide", "warning");
      return;
    }

    // Prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setIsSaving(true);
      await updateCurrentUserPhoto(file);
      
      // Mettre à jour le profil avec la nouvelle photo
      const updatedUser = await getCurrentUser();
      setProfile(prev => prev ? {
        ...prev,
        photo: updatedUser.photo
      } : prev);
      
      showToast("Photo de profil mise à jour !", "success");
    } catch (err) {
      console.error("❌ Erreur upload photo :", err);
      showToast("Erreur lors du téléchargement de la photo", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // 🔹 Fonction pour supprimer la photo
  const handleRemovePhoto = async () => {
    try {
      setIsSaving(true);
      
      // Créer un FormData vide pour supprimer la photo
      const formData = new FormData();
      formData.append("photo", "");
      
      await updateCurrentUser(formData);
      
      // Mettre à jour l'état local
      setPhotoPreview(null);
      if (profile) {
        setProfile({ ...profile, photo: null });
      }
      
      showToast("Photo supprimée !", "success");
    } catch (err) {
      console.error("❌ Erreur suppression photo :", err);
      showToast("Erreur lors de la suppression de la photo", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // 🔹 Fonction pour formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  // 🔹 Fonction pour mettre à jour le code personnel
  const handleUpdateCodePersonnel = async () => {
    if (!profile) return;

    if (newCode !== confirmCode) {
      showToast("Les codes ne correspondent pas", "warning");
      return;
    }

    if (newCode.length < 4) {
      showToast("Le code doit contenir au moins 4 caractères", "warning");
      return;
    }

    try {
      setIsSaving(true);
      
      // Pour les médecins, on met à jour le code personnel
      const payload = {
        code_personnel: newCode,
      };

      await updateCurrentUser(payload);
      showToast("Code personnel modifié avec succès !", "success");
      
      // Réinitialiser les champs
      setCurrentCode("");
      setNewCode("");
      setConfirmCode("");
      
      // Mettre à jour le profil local
      setProfile(prev => prev ? { ...prev, code_personnel: newCode } : prev);
      
    } catch (err) {
      console.error("❌ Erreur de modification :", err);
      showToast("Erreur lors du changement du code personnel", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // 🔹 Rendu de la partie Préférences - MODIFIÉ (supprimé le thème)
  const renderPreferencesTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          {t('settings.languageDisplay')}
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('settings.interfaceLanguage')}
            </label>
            <select
              value={profile?.langue || "fr"}
              onChange={(e) => handleProfileUpdate("langue", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* SUPPRIMÉ: Section du thème d'affichage */}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          {t('settings.notificationPreferences')}
        </h3>
        
        <div className="space-y-4">
          {profile &&
            Object.entries(profile.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-700 capitalize">
                    {key === "email" && t('settings.emailNotifications')}
                    {key === "sms" && t('settings.smsNotifications')}
                    {key === "whatsapp" && t('settings.whatsappNotifications')}
                    {key === "rappels" && t('settings.automaticReminders')}
                    {key === "nouvelles" && t('settings.clinicNews')}
                  </span>
                  <p className="text-sm text-gray-500">
                    {key === "email" && t('settings.emailDesc')}
                    {key === "sms" && t('settings.smsDesc')}
                    {key === "whatsapp" && t('settings.whatsappDesc')}
                    {key === "rappels" && t('settings.remindersDesc')}
                    {key === "nouvelles" && t('settings.newsDesc')}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleNotificationToggle(
                      key as keyof UserProfile["notifications"]
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
        </div>
      </div>

      <div className="flex justify-end space-x-4 border-t border-gray-200 pt-6">
        <button
          onClick={async () => {
            try {
              const me = await getCurrentUser();
              setProfile({
                id: me.id,
                prenom: me.first_name || "",
                nom: me.last_name || "",
                email: me.email,
                telephone: me.telephone || "",
                role: me.role,
                specialite: me.specialite || "",
                departement: me.departement || "",
                licenceMedicale: me.licence_medicale || "",
                dateAdhesion: me.date_adhesion || "",
                photo: me.photo || null,
                langue: me.langue || "fr",
                theme: me.theme || "light",
                code_personnel: me.code_personnel || "",
                notifications: me.notifications || {
                  email: true,
                  sms: false,
                  whatsapp: true,
                  rappels: true,
                  nouvelles: true,
                },
              });
              showToast("Profil réinitialisé depuis le serveur !", "success");
            } catch (err) {
              console.error("❌ Erreur lors du rafraîchissement :", err);
              showToast("Erreur lors de la réinitialisation du profil", "error");
            }
          }}
          className="rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          {t('common.reset')}
        </button>
        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? t('common.saving') : t('settings.savePreferences')}
        </button>
      </div>
    </div>
  );

  // 🔹 Rendu de l'onglet Sécurité
  const renderSecurityTab = () => (
    <div className="space-y-8">
      {/* 🔹 CHANGEMENT DE CODE PERSONNEL (Pour médecins) */}
      {profile?.role === "MEDECIN" && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
            {t('settings.personalCode')}
          </h3>

          <div className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('settings.newCode')}
              </label>
              <input
                type="password"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('settings.enterNewCode')}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('settings.confirmCode')}
              </label>
              <input
                type="password"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('settings.repeatNewCode')}
              />
            </div>

            <button
              onClick={handleUpdateCodePersonnel}
              disabled={isSaving || !newCode || !confirmCode}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? t('common.updating') : t('settings.updateCode')}
            </button>
          </div>
        </div>
      )}

      {/* 🔹 AUTHENTIFICATION À DEUX FACTEURS */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          {t('settings.twoFactorAuth')}
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-700">
              {t('settings.twoStepVerification')}
            </span>
            <p className="text-sm text-gray-500">
              {t('settings.twoStepDesc')}
            </p>
          </div>
          <button
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              twoFactorEnabled ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                twoFactorEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {twoFactorEnabled && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              {t('settings.twoFactorEnabled')}
            </p>
          </div>
        )}
      </div>

      {/* 🔹 SESSIONS ACTIVES */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          {t('settings.activeSessions')}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="font-medium text-gray-700">
                {t('settings.currentSession')}
              </span>
              <p className="text-sm text-gray-500">
                {Intl.DateTimeFormat("fr-FR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date())}
              </p>
              <p className="text-sm text-gray-500">{t('settings.currentBrowser')}</p>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="text-red-600 text-sm font-medium hover:text-red-700"
            >
              {t('common.logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{t('common.loadingError')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 md:p-8">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
          <p className="mt-2 text-lg text-gray-600">
            {t('settings.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Carte profil */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 overflow-hidden">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profil"
                        className="h-full w-full object-cover"
                      />
                    ) : profile.photo ? (
                      <img
                        src={mediaUrl(profile.photo) || ""}
                        alt="Profil"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          // Fallback aux initiales si l'image ne charge pas
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      `${profile.prenom?.[0] || ""}${profile.nom?.[0] || ""}`
                    )}
                  </div>

                  {isEditing && activeTab === "profil" && (
                    <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  )}
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mt-2">
                  {profile.prenom} {profile.nom}
                </h2>
                <p className="text-blue-600 font-medium capitalize">
                  {profile.role === "MEDECIN"
                    ? t('roles.doctor')
                    : profile.role === "SECRETAIRE"
                    ? t('roles.secretary')
                    : t('roles.direction')}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {t('settings.memberSince')} {formatDate(profile.dateAdhesion)}
                </p>
              </div>

              {isEditing && photoPreview && activeTab === "profil" && (
                <button
                  onClick={handleRemovePhoto}
                  className="w-full mt-3 rounded-lg bg-red-50 text-red-600 py-2 text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  {t('settings.removePhoto')}
                </button>
              )}
            </div>

            {/* Navigation */}
            <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profil")}
                  className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    activeTab === "profil"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <UserIcon />
                  <span className="font-medium">{t('settings.profile')}</span>
                </button>

                <button
                  onClick={() => setActiveTab("preferences")}
                  className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    activeTab === "preferences"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <SettingsIcon />
                  <span className="font-medium">{t('settings.preferences')}</span>
                </button>

                <button
                  onClick={() => setActiveTab("securite")}
                  className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    activeTab === "securite"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <ShieldIcon />
                  <span className="font-medium">{t('settings.security')}</span>
                </button>
              </nav>

              {/* Actions Rapides */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  {t('settings.quickActions')}
                </h3>

                <button
                  onClick={() => {
                    try {
                      if (!profile) {
                        showToast("Aucune donnée de profil à exporter", "warning");
                        return;
                      }

                      const exportData = {
                        id: profile.id,
                        nom: profile.nom,
                        prenom: profile.prenom,
                        email: profile.email,
                        telephone: profile.telephone,
                        role: profile.role,
                        specialite: profile.specialite,
                        departement: profile.departement,
                        licenceMedicale: profile.licenceMedicale,
                        dateAdhesion: profile.dateAdhesion,
                        langue: profile.langue,
                        theme: profile.theme,
                        notifications: profile.notifications,
                        exportDate: new Date().toISOString(),
                      };

                      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `profil_${profile.prenom}_${profile.nom}_${new Date()
                        .toISOString()
                        .split("T")[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      showToast("Données exportées avec succès", "success");
                    } catch (error) {
                      console.error("❌ Erreur export :", error);
                      showToast("Erreur lors de l'exportation des données", "error");
                    }
                  }}
                  className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <DownloadIcon />
                  <span className="font-medium">{t('settings.exportData')}</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(t('common.confirmLogout'))) {
                      localStorage.clear();
                      window.location.href = "/login";
                    }
                  }}
                  className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-red-600 hover:bg-red-50 transition-colors mt-2"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
                    />
                  </svg>
                  <span className="font-medium">{t('common.logout')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            {activeTab === "profil" && (
              <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {t('settings.personalInfo')}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {t('settings.personalInfoDesc')}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    {isEditing ? t('common.cancel') : t('settings.editProfile')}
                  </button>
                </div>

                {/* Photo de profil */}
                {isEditing && (
                  <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {t('settings.profilePhoto')}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {t('settings.photoRequirements')}
                    </p>
                    <div className="flex items-center space-x-4">
                      <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <span>{t('settings.uploadPhoto')}</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/png,image/gif"
                          onChange={handlePhotoUpload}
                        />
                      </label>
                      {photoPreview && (
                        <button
                          onClick={handleRemovePhoto}
                          className="text-red-600 text-sm font-medium hover:text-red-700"
                        >
                          {t('common.delete')}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Formulaire profil */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {/* Informations Personnelles */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                      {t('settings.personalInfo')}
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('common.firstName')} *
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profile.prenom}
                            onChange={(e) => handleProfileUpdate("prenom", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.prenom || "—"}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('common.lastName')} *
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profile.nom}
                            onChange={(e) => handleProfileUpdate("nom", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.nom || "—"}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('common.email')} *
                        </label>
                        {isEditing ? (
                          <>
                            <input
                              type="email"
                              value={profile.email}
                              onChange={(e) => handleProfileUpdate("email", e.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              {t('settings.emailUsage')}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.email || "—"}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('common.phone')} *
                        </label>
                        {isEditing ? (
                          <>
                            <input
                              type="tel"
                              value={profile.telephone}
                              onChange={(e) =>
                                handleProfileUpdate("telephone", e.target.value)
                              }
                              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="+212 6 12 34 56 78"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              {t('settings.phoneFormat')}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-900 text-lg">
                            {profile.telephone || "—"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informations Professionnelles */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                      {t('settings.professionalInfo')}
                    </h3>

                    <div className="space-y-6">
                      {/* Licence médicale */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('settings.medicalLicense')} *
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profile.licenceMedicale || ""}
                            onChange={(e) =>
                              handleProfileUpdate("licenceMedicale", e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="MD-2019-0456"
                          />
                        ) : (
                          <p className="text-gray-900 text-lg">
                            {profile.licenceMedicale || "—"}
                          </p>
                        )}
                      </div>

                      {/* Spécialité */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('settings.specialty')} *
                        </label>
                        {isEditing ? (
             <select
  value={typeof profile?.specialite === "object"
  ? profile?.specialite?.id
  : profile?.specialite || ""}

  onChange={(e) => handleProfileUpdate("specialite", e.target.value)}
  className="w-full rounded-lg border border-gray-300 px-4 py-3"
>
  <option value="">{t("settings.selectSpecialty")}</option>
  {specialties.map((spec) => (
    <option key={spec.id} value={spec.id.toString()}>
      {i18n.language.startsWith("en") ? spec.name_en : spec.name_fr}
    </option>
  ))}
</select>



                        ) : (
                       <p className="text-gray-900 text-lg">
  {getSpecialtyName(profile.specialite)}
</p>


                        )}
                      </div>

                      {/* Département */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('settings.department')} *
                        </label>
                        {isEditing ? (
                          <select
                            value={profile.departement || ""}
                            onChange={(e) =>
                              handleProfileUpdate("departement", e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {DEPARTEMENTS.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-gray-900 text-lg">
                            {profile.departement || "—"}
                          </p>
                        )}
                      </div>

                      {/* Date d'adhésion */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('settings.joinDate')}
                        </label>
                        <p className="text-gray-900 text-lg">
                          {formatDate(profile.dateAdhesion)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Boutons sauvegarde */}
                {isEditing && (
                  <div className="mt-8 flex justify-end space-x-4 border-t border-gray-200 pt-6">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? (
                        <span className="flex items-center space-x-2">
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>{t('common.saving')}</span>
                        </span>
                      ) : (
                        t('settings.saveChanges')
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
                {renderPreferencesTab()}
              </div>
            )}

            {activeTab === "securite" && (
              <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
                {renderSecurityTab()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
  
export default ProfessionalSettingsPage;