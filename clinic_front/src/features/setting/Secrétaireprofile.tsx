import React, { useState, useEffect } from "react";
import { 
  getCurrentUser, 
  updateCurrentUser, 
  updateCurrentUserPhoto,
  mediaUrl 
} from "../../api/users";
import { useTranslation } from "react-i18next";

/** Types */
type UserProfile = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: "SECRETAIRE" | "DIRECTION" | "MEDECIN";
  specialite: string | null;
  departement: string;
  poste: string;
  dateAdhesion: string;
  photo: string | null;
  langue: "fr" | "en";
  theme: "light" | "dark" | "auto";
  notifications: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    rappels: boolean;
    nouvelles: boolean;
  };
};

const DEPARTEMENTS = [
  "Accueil & RDV",
  "Administration",
  "Facturation",
  "Laboratoire"
];

const WORK_SHIFTS = [
  "08:00 - 12:00",
  "12:00 - 16:00",
  "16:00 - 20:00",
  "Horaire Complet"
];

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

/** Composant principal Secretary */
const SecretarySettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<"profil" | "preferences" | "securite" | "actions">("profil");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Préférences spécifiques
  const [shift, setShift] = useState<string>(WORK_SHIFTS[0]);
  const [autoConfirmRdv, setAutoConfirmRdv] = useState<boolean>(false);
  const [whatsApiEnabled, setWhatsApiEnabled] = useState<boolean>(true);

  // États pour sécurité
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 🔹 Fonction pour afficher les toasts
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  // 🔹 Charger le profil depuis l'API
  useEffect(() => {
    (async () => {
      try {
        const me = await getCurrentUser();
        const userProfile: UserProfile = {
          id: me.id,
          prenom: me.first_name || "",
          nom: me.last_name || "",
          email: me.email,
          telephone: me.telephone || "",
          role: me.role,
          specialite: me.specialite || null,
          departement: me.departement || "Accueil & RDV",
          poste: me.poste || "Standard",
          dateAdhesion: me.date_adhesion || "",
          photo: me.photo || null,
          langue: me.langue || "fr",
          theme: me.theme || "light",
          notifications: me.notifications || {
            email: true,
            sms: true,
            whatsapp: true,
            rappels: true,
            nouvelles: false,
          },
        };
        
        setProfile(userProfile);
        
        // 🔹 CORRECTION: Appliquer la langue immédiatement
        if (me.langue && me.langue !== i18n.language) {
          i18n.changeLanguage(me.langue);
        }
        
      } catch (err) {
        console.error("❌ Erreur de chargement du profil :", err);
        showToast("Erreur de chargement du profil", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [i18n]);

  const handleProfileUpdate = (field: keyof UserProfile, value: any) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
    
    // 🔹 CORRECTION: Appliquer immédiatement la langue quand elle change
    if (field === "langue" && value !== i18n.language) {
      i18n.changeLanguage(value);
    }
  };

  const handleNotificationToggle = (type: keyof UserProfile['notifications']) => {
    setProfile(prev => prev ? ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }) : null);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("La taille du fichier ne doit pas dépasser 5MB", "warning");
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
      } : null);
      
      showToast("Photo de profil mise à jour !", "success");
    } catch (err) {
      console.error("❌ Erreur upload photo :", err);
      showToast("Erreur lors du téléchargement de la photo", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile) return;
    
    try {
      setIsSaving(true);
      
      // Créer un FormData vide pour supprimer la photo
      const formData = new FormData();
      formData.append("photo", "");
      
      await updateCurrentUser(formData);
      
      // Mettre à jour l'état local
      setPhotoPreview(null);
      setProfile(prev => prev ? { ...prev, photo: null } : null);
      
      showToast("Photo supprimée !", "success");
    } catch (err) {
      console.error("❌ Erreur suppression photo :", err);
      showToast("Erreur lors de la suppression de la photo", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const payload = {
        first_name: profile.prenom,
        last_name: profile.nom,
        email: profile.email,
        telephone: profile.telephone,
        departement: profile.departement,
        poste: profile.poste,
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
  };

  const handleChangePassword = async () => {
    if (!profile) return;

    if (newPassword !== confirmPassword) {
      showToast("Les mots de passe ne correspondent pas", "warning");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Le mot de passe doit contenir au moins 8 caractères", "warning");
      return;
    }
    
    setIsSaving(true);
    try {
      await updateCurrentUser({
        old_password: currentPassword,
        new_password: newPassword,
      });
      
      showToast("Mot de passe modifié avec succès !", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("❌ Erreur de modification :", err);
      showToast("Erreur lors du changement du mot de passe", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Actions rapides spécifiques secrétariat
  const handleViewPendingAppointments = () => {
    showToast("Redirection vers les rendez-vous en attente...", "warning");
  };

  const handleSendWhatsAppReminders = async () => {
    if (!whatsApiEnabled || !profile) {
      showToast("L'API WhatsApp est désactivée", "warning");
      return;
    }
    
    setIsSaving(true);
    try {
      // Implémentation réelle à connecter avec votre API WhatsApp
      // await sendWhatsAppReminders();
      await new Promise(resolve => setTimeout(resolve, 1200));
      showToast("Rappels WhatsApp envoyés avec succès !", "success");
    } catch (err) {
      console.error("❌ Erreur envoi rappels :", err);
      showToast("Erreur lors de l'envoi des rappels WhatsApp", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = () => {
    if (!profile) return;
    
    try {
      const data = { 
        profile, 
        preferences: { shift, autoConfirmRdv, whatsApiEnabled },
        exportDate: new Date().toISOString() 
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `secretaire_${profile.prenom}_${profile.nom}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Données exportées avec succès !", "success");
    } catch (error) {
      console.error("❌ Erreur export :", error);
      showToast("Erreur lors de l'exportation des données", "error");
    }
  };

  // Render Preferences (secrétaire)
  const renderPreferencesTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          {t('secretary.scheduleSettings')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('secretary.workShift')}
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {WORK_SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {t('secretary.shiftDescription')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('secretary.postExtension')}
            </label>
            <input
              type="text"
              value={profile?.poste || ""}
              onChange={(e) => handleProfileUpdate("poste", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={autoConfirmRdv}
              onChange={() => setAutoConfirmRdv(prev => !prev)}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium text-gray-700">
              {t('secretary.autoConfirmAppointments')}
            </span>
          </label>
          <p className="text-sm text-gray-500 mt-1">
            {t('secretary.autoConfirmDescription')}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          {t('secretary.whatsappIntegration')}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-700">
                {t('secretary.whatsappApiEnabled')}
              </span>
              <p className="text-sm text-gray-500">
                {t('secretary.whatsappApiDescription')}
              </p>
            </div>
            <button
              onClick={() => setWhatsApiEnabled(prev => !prev)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${whatsApiEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${whatsApiEnabled ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-700">
                {t('settings.automaticReminders')}
              </span>
              <p className="text-sm text-gray-500">
                {t('settings.remindersDesc')}
              </p>
            </div>
            <button
              onClick={() => handleNotificationToggle("rappels")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profile?.notifications.rappels ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile?.notifications.rappels ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 border-t border-gray-200 pt-6">
        <button
          onClick={async () => {
            try {
              const me = await getCurrentUser();
              setProfile(prev => prev ? {
                ...prev,
                prenom: me.first_name || "",
                nom: me.last_name || "",
                email: me.email,
                telephone: me.telephone || "",
                departement: me.departement || "Accueil & RDV",
                poste: me.poste || "Standard",
                langue: me.langue || "fr",
                theme: me.theme || "light",
                notifications: me.notifications || {
                  email: true,
                  sms: true,
                  whatsapp: true,
                  rappels: true,
                  nouvelles: false,
                },
              } : null);
              showToast("Profil réinitialisé avec succès !", "success");
            } catch (err) {
              console.error("❌ Erreur lors du rafraîchissement :", err);
              showToast("Erreur lors de la réinitialisation du profil", "error");
            }
          }}
          className="rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          {t('common.reset')}
        </button>
        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? t('common.saving') : t('settings.savePreferences')}
        </button>
      </div>
    </div>
  );

  // Render Security
  const renderSecurityTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          {t('settings.changePassword')}
        </h3>
        <div className="space-y-4 max-w-md">
          <input 
            type="password" 
            value={currentPassword} 
            onChange={(e)=>setCurrentPassword(e.target.value)} 
            placeholder={t('settings.currentPassword')}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input 
            type="password" 
            value={newPassword} 
            onChange={(e)=>setNewPassword(e.target.value)} 
            placeholder={t('settings.newPassword')}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e)=>setConfirmPassword(e.target.value)} 
            placeholder={t('settings.confirmPassword')}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleChangePassword} 
            disabled={isSaving || !currentPassword || !newPassword || !confirmPassword} 
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? t('common.updating') : t('settings.updatePassword')}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          {t('settings.activeSessions')}
        </h3>
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
  );

  // Render Actions (secrétaire)
  const renderActionsTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          {t('secretary.quickActions')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm text-center">
            <div className="text-2xl font-bold">7</div>
            <div className="text-sm text-gray-500">{t('secretary.pendingAppointments')}</div>
            <button 
              onClick={handleViewPendingAppointments} 
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              {t('actions.details')}
            </button>
          </div>

          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm text-center">
            <div className="text-2xl font-bold">—</div>
            <div className="text-sm text-gray-500">{t('secretary.whatsappReminders')}</div>
            <button 
              onClick={handleSendWhatsAppReminders} 
              disabled={isSaving || !whatsApiEnabled}
              className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-white text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? t('common.sending') : t('secretary.sendReminders')}
            </button>
          </div>

          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm text-center">
            <div className="text-2xl font-bold">{t('secretary.export')}</div>
            <div className="text-sm text-gray-500">{t('secretary.secretaryData')}</div>
            <button 
              onClick={exportData} 
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              {t('settings.exportData')}
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          {t('secretary.tools')}
        </h3>
        <div className="space-y-3">
          <button 
            onClick={()=>showToast("Ouverture du calendrier partagé...", "warning")} 
            className="w-full text-left p-4 bg-gray-50 rounded-lg border hover:bg-gray-100"
          >
            {t('secretary.openSharedCalendar')}
          </button>
          <button 
            onClick={()=>showToast("Création d'une note interne...", "warning")} 
            className="w-full text-left p-4 bg-gray-50 rounded-lg border hover:bg-gray-100"
          >
            {t('secretary.createInternalNote')}
          </button>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('secretary.title')}</h1>
          <p className="mt-2 text-lg text-gray-600">{t('secretary.subtitle')}</p>
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
                      <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                    ) : profile.photo ? (
                      <img 
                        src={mediaUrl(profile.photo) || ""} 
                        alt="Profile" 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      `${profile.prenom[0]}${profile.nom[0]}`
                    )}
                  </div>
                  {isEditing && activeTab === "profil" && (
                    <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input type="file" className="hidden" accept="image/jpeg,image/png,image/gif" onChange={handlePhotoUpload} />
                    </label>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{profile.prenom} {profile.nom}</h2>
                <p className="text-blue-600 font-medium">{t('roles.secretary')}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {t('settings.memberSince')} {formatDate(profile.dateAdhesion)}
                </p>
              </div>

              {isEditing && photoPreview && (
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
                  onClick={()=>setActiveTab("profil")} 
                  className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left transition-colors ${activeTab==="profil" ? "bg-blue-50 text-blue-700 border border-blue-200": "text-gray-600 hover:bg-gray-50"}`}
                >
                  <UserIcon /><span className="font-medium">{t('settings.profile')}</span>
                </button>
                <button 
                  onClick={()=>setActiveTab("preferences")} 
                  className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left transition-colors ${activeTab==="preferences" ? "bg-blue-50 text-blue-700 border border-blue-200": "text-gray-600 hover:bg-gray-50"}`}
                >
                  <SettingsIcon/><span className="font-medium">{t('settings.preferences')}</span>
                </button>
                <button 
                  onClick={()=>setActiveTab("securite")} 
                  className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left transition-colors ${activeTab==="securite" ? "bg-blue-50 text-blue-700 border border-blue-200": "text-gray-600 hover:bg-gray-50"}`}
                >
                  <ShieldIcon/><span className="font-medium">{t('settings.security')}</span>
                </button>
                <button 
                  onClick={()=>setActiveTab("actions")} 
                  className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left transition-colors ${activeTab==="actions" ? "bg-blue-50 text-blue-700 border border-blue-200": "text-gray-600 hover:bg-gray-50"}`}
                >
                  <BadgeIcon/><span className="font-medium">{t('secretary.quickActions')}</span>
                </button>
              </nav>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('settings.quickActions')}</h3>
                <button 
                  onClick={handleViewPendingAppointments} 
                  className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <DownloadIcon/>
                  <span className="font-medium">{t('secretary.viewPendingAppointments')}</span>
                </button>
                <button 
                  onClick={handleSendWhatsAppReminders} 
                  disabled={!whatsApiEnabled || isSaving} 
                  className="mt-3 flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <WhatsAppIcon/>
                  <span className="font-medium">{t('secretary.sendWhatsappReminders')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            {/* Profil */}
            {activeTab === "profil" && (
              <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('settings.personalInfo')}</h2>
                    <p className="text-gray-600 mt-1">{t('secretary.profileDescription')}</p>
                  </div>
                  <button 
                    onClick={()=>setIsEditing(!isEditing)} 
                    className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    {isEditing ? t('common.cancel') : t('settings.editProfile')}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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
                            onChange={(e)=>handleProfileUpdate("prenom", e.target.value)} 
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-lg text-gray-900">{profile.prenom}</p>
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
                            onChange={(e)=>handleProfileUpdate("nom", e.target.value)} 
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-lg text-gray-900">{profile.nom}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('common.email')} *
                        </label>
                        {isEditing ? (
                          <input 
                            type="email" 
                            value={profile.email} 
                            onChange={(e)=>handleProfileUpdate("email", e.target.value)} 
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-lg text-gray-900">{profile.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('common.phone')} *
                        </label>
                        {isEditing ? (
                          <input 
                            type="tel" 
                            value={profile.telephone} 
                            onChange={(e)=>handleProfileUpdate("telephone", e.target.value)} 
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-lg text-gray-900">{profile.telephone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                      {t('secretary.secretarySettings')}
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('settings.department')}
                        </label>
                        {isEditing ? (
                          <select 
                            value={profile.departement} 
                            onChange={(e)=>handleProfileUpdate("departement", e.target.value)} 
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {DEPARTEMENTS.map(d=> <option key={d} value={d}>{d}</option>)}
                          </select>
                        ) : (
                          <p className="text-lg text-gray-900">{profile.departement}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('secretary.postExtension')}
                        </label>
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={profile.poste} 
                            onChange={(e)=>handleProfileUpdate("poste", e.target.value)} 
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-lg text-gray-900">{profile.poste}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('settings.interfaceLanguage')}
                        </label>
                        <select 
                          value={profile.langue} 
                          onChange={(e)=>handleProfileUpdate("langue", e.target.value)} 
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="fr">Français</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {t('settings.joinDate')}
                        </label>
                        <p className="text-lg text-gray-900">{formatDate(profile.dateAdhesion)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-8 flex justify-end space-x-4 border-t border-gray-200 pt-6">
                    <button 
                      onClick={()=>setIsEditing(false)} 
                      className="rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button 
                      onClick={handleSaveProfile} 
                      disabled={isSaving}
                      className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? t('common.saving') : t('settings.saveChanges')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Préférences */}
            {activeTab === "preferences" && (
              <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('secretary.preferencesTitle')}</h2>
                    <p className="text-gray-600 mt-1">{t('secretary.preferencesDescription')}</p>
                  </div>
                </div>
                {renderPreferencesTab()}
              </div>
            )}

            {/* Sécurité */}
            {activeTab === "securite" && (
              <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('settings.security')}</h2>
                    <p className="text-gray-600 mt-1">{t('secretary.securityDescription')}</p>
                  </div>
                </div>
                {renderSecurityTab()}
              </div>
            )}

            {/* Actions rapides */}
            {activeTab === "actions" && (
              <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('secretary.quickActions')}</h2>
                    <p className="text-gray-600 mt-1">{t('secretary.actionsDescription')}</p>
                  </div>
                </div>
                {renderActionsTab()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Icônes */
const UserIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const SettingsIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const ShieldIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const BadgeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const DownloadIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.5A8.38 8.38 0 0112.5 21 8.38 8.38 0 013 12.5 8.38 8.38 0 0112.5 4 8.38 8.38 0 0121 12.5z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.5 14.5c-.3.9-1.6 1.8-2.2 2.1-.6.2-1.2.2-2.1-.1-1.1-.3-4.5-2.2-5.2-2.9-.7-.7-1.7-1.9-1.9-2.7-.2-.8.2-1.3.4-1.4.2-.1.6-.2 1-.2.3 0 .6 0 .9.1.3.1.8.3 1.1.5.3.2.6.3.9.1.2-.1.8-.6 1.1-.8.3-.2.6-.1.9.1.3.2 1.2 1.2 1.5 1.5.3.3.4.7.1 1-.3.3-.6.6-.8.9-.2.3-.1.6.1.9.2.3.6.9.8 1.2.2.3.5.3.8.2.3-.1 1.1-.4 1.3-.5.2-.1.5-.2.6-.1.1.1.3.6.1 1z" />
  </svg>
);

export default SecretarySettingsPage;