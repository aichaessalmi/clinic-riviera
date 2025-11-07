// src/components/DirectionAdminPage.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  getCurrentUser, 
  updateCurrentUser, 
  updateCurrentUserPhoto,
  mediaUrl,
  http 
} from "../../api/users";
import { useTranslation } from "react-i18next";

// ==================== TYPES ET INTERFACES ====================
interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  telephone?: string;
  role: "DIRECTION" | "MEDECIN" | "SECRETAIRE";
  departement?: string;
  specialite?: string;
  poste?: string;
  code_personnel?: string;
  is_active: boolean;
  date_adhesion?: string;
  photo?: string | null;
  langue: "fr" | "en";
  theme: "light" | "dark" | "auto";
  notifications: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    rappels: boolean;
    nouvelles: boolean;
  };
}

interface UserProfile {
  username: string;
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: User["role"];
  departement: string;
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
}

type ActiveTab = "profil" | "parametres" | "securite" | "gestion-utilisateurs" | "creer-utilisateur";

// ==================== DONNÉES STATIQUES ====================
const DEPARTEMENTS = [
  "Médecine Interne", "Chirurgie", "Pédiatrie", "Urgences", 
  "Radiologie", "Laboratoire", "Administration", "Cardiologie",
  "Maternité", "Soins Intensifs", "Pharmacie", "Bloc Opératoire"
];

// ==================== COMPOSANTS ICÔNES ====================
const IconUser: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
  </svg>
);

const IconSettings: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

const IconShield: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.95 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
  </svg>
);

const IconMedecin: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
  </svg>
);

const IconTrash: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>
);

const IconSearch: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
);

const IconCamera: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

const IconUserAdd: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
  </svg>
);

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

// ==================== COMPOSANTS MODULAIRES ====================
interface TabButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  mobile?: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({ active, icon, label, onClick, mobile = false }) => {
  if (mobile) {
    return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 flex-1 min-w-0 ${
          active
            ? "bg-blue-600 text-white shadow-lg"
            : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        <div className="text-sm mb-1">{icon}</div>
        <span className="text-xs font-medium truncate max-w-full">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm lg:text-base ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
          : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

// ==================== COMPOSANT PRINCIPAL ====================
const DirectionAdminPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  // États principaux
  const [activeTab, setActiveTab] = useState<ActiveTab>("profil");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  
  const PAGE_SIZE = 6;
  
  // États pour le profil
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États pour la création d'utilisateur
  const [newUserData, setNewUserData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    telephone: "",
    role: "MEDECIN" as User["role"],
    specialite: "",
    departement: "",
    poste: "",
    code_personnel: "",
    password: "",
    is_active: true
  });

  // 🔹 Fonction pour afficher les toasts
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  // 🔹 Charger le profil et les utilisateurs
  useEffect(() => {
    loadProfile();
    loadUsers();
  }, []);

  const loadProfile = async () => {
    console.log("🔵 [loadProfile] Début du chargement du profil...");
    try {
      const me = await getCurrentUser();
      console.log("🟢 [loadProfile] Données reçues du backend :", me);
      const userProfile: UserProfile = {
        username: me.username || "",  
        id: me.id,
        prenom: me.first_name || "",
        nom: me.last_name || "",
        email: me.email,
        telephone: me.telephone || "",
        role: me.role,
        departement: me.departement || "",
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
      console.log("🟣 [setProfile] Profil stocké dans le state React :", userProfile);

      if (me.langue && me.langue !== i18n.language) {
        i18n.changeLanguage(me.langue);
      }
      
    } catch (err) {
      console.error("❌ Erreur de chargement du profil :", err);
      showToast("Erreur lors du chargement du profil", "error");
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await http.get("/users/");
      setUsers(response.data);
    } catch (err) {
      console.error("❌ Erreur de chargement des utilisateurs :", err);
      showToast("Erreur lors du chargement des utilisateurs", "error");
    } finally {
      setLoading(false);
    }
  };

  // Mémoisation des données filtrées et paginées
  const { filteredUsers, totalPages, pageUsers } = useMemo(() => {
    const filtered = users.filter(u => (
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      u.departement?.toLowerCase().includes(query.toLowerCase())
    ));
    
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    
    return { filteredUsers: filtered, totalPages, pageUsers };
  }, [users, query, page]);

  // 🔹 Fonctions CRUD avec API
  const addUser = async (payload: any) => {
    try {
      setIsSaving(true);
      
      const cleanPayload = { ...payload };
      if (!cleanPayload.password) {
        delete cleanPayload.password;
      }
      
      const response = await http.post("/users/", cleanPayload);
      setUsers(prev => [response.data, ...prev]);
      setPage(1);
      
      if (activeTab === "creer-utilisateur") {
        setNewUserData({
          username: "",
          first_name: "",
          last_name: "",
          email: "",
          telephone: "",
          role: "MEDECIN",
          specialite: "",
          departement: "",
          poste: "",
          code_personnel: "",
          password: "",
          is_active: true
        });
      }
      
      showToast("Utilisateur créé avec succès !", "success");
      setActiveTab("gestion-utilisateurs");
    } catch (err: any) {
      console.error("❌ Erreur création utilisateur :", err);
      const errorMsg = err.response?.data 
        ? Object.values(err.response.data).flat().join(', ')
        : err.message;
      showToast(`Erreur: ${errorMsg}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteUser = async (id: number) => { 
    try {
      await http.delete(`/users/${id}/`);
      setUsers(prev => prev.filter(u => u.id !== id)); 
      showToast("Utilisateur supprimé avec succès !", "success");
    } catch (err: any) {
      console.error("❌ Erreur suppression utilisateur :", err);
      showToast(`Erreur: ${err.response?.data?.detail || err.message}`, "error");
    }
  };

  const handleCreateUser = async () => {
    if (!newUserData.first_name || !newUserData.last_name || !newUserData.email || !newUserData.username) { 
      showToast("Prénom, nom, username et email sont obligatoires.", "warning");
      return; 
    }

    if (newUserData.role === "MEDECIN" && !newUserData.code_personnel) {
      showToast("Le code personnel est obligatoire pour les médecins.", "warning");
      return;
    }

    if (newUserData.role !== "MEDECIN" && !newUserData.password) {
      showToast("Le mot de passe est obligatoire pour les secrétaires et la direction.", "warning");
      return;
    }

    const payload = { ...newUserData };
    
    if (payload.role !== "MEDECIN") {
      payload.code_personnel = "";
    }
    if (payload.role !== "SECRETAIRE") {
      payload.poste = "";
    }
    
    await addUser(payload);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("La taille maximale est de 5MB", "warning");
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast("Veuillez sélectionner une image valide", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);

    try {
      setIsSaving(true);
      await updateCurrentUserPhoto(file);

      const updatedUser = await getCurrentUser();
      setProfile((prev) => (prev ? { ...prev, photo: updatedUser.photo } : null));

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
      const formData = new FormData();
      formData.append("photo", "");

      await updateCurrentUser(formData);

      setPhotoPreview(null);
      setProfile((prev) => (prev ? { ...prev, photo: null } : null));

      showToast("Photo supprimée !", "success");
    } catch (err) {
      console.error("❌ Erreur suppression photo :", err);
      showToast("Erreur lors de la suppression de la photo", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 🔹 Fonctions profil
  const handleSaveProfile = async () => { 
    if (!profile) return;
    
    setIsSaving(true); 
    try {
      const payload = {
        username: profile.username,
        first_name: profile.prenom,
        last_name: profile.nom,
        email: profile.email,
        telephone: profile.telephone,
        departement: profile.departement,
        notifications: profile.notifications,
      };

      await updateCurrentUser(payload);
      setIsEditing(false); 
      showToast("Profil mis à jour avec succès !", "success");
    } catch (err) {
      console.error("❌ Erreur sauvegarde profil:", err);
      showToast("Erreur lors de la sauvegarde du profil", "error");
    } finally {
      setIsSaving(false); 
    }
  };

  // Définition des onglets
  const tabs = [
    { id: "profil" as ActiveTab, icon: <IconUser />, label: t('settings.profile') },
    { id: "parametres" as ActiveTab, icon: <IconSettings />, label: t('settings.preferences') },
    { id: "securite" as ActiveTab, icon: <IconShield />, label: t('settings.security') },
    { id: "gestion-utilisateurs" as ActiveTab, icon: <IconMedecin />, label: t('direction.users') },
    { id: "creer-utilisateur" as ActiveTab, icon: <IconUserAdd />, label: t('direction.createUser') },
  ];

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Rendu du contenu selon l'onglet actif
  const renderTabContent = () => {
    switch (activeTab) {
      case "profil":
        return (
          <ProfilTabContent
            profile={profile!}
            setProfile={setProfile as React.Dispatch<React.SetStateAction<UserProfile>>}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            isSaving={isSaving}
            onSave={handleSaveProfile}
            photoPreview={photoPreview}
            onPhotoUpload={handlePhotoUpload}
            onRemovePhoto={handleRemovePhoto}
            onTriggerFileInput={triggerFileInput}
            fileInputRef={fileInputRef}
          />
        );

      case "parametres":
        return (
          <ParametresTabContent
            profile={profile}
            setProfile={setProfile as React.Dispatch<React.SetStateAction<UserProfile>>}
          />
        );

      case "securite":
        return <SecuriteTabContent showToast={showToast} />;

      case "gestion-utilisateurs":
        return (
          <GestionUtilisateursTabContent
            loading={loading}
            query={query}
            setQuery={setQuery}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
            filteredUsers={filteredUsers}
            pageUsers={pageUsers}
            onDeleteUser={deleteUser}
          />
        );

      case "creer-utilisateur":
        return (
          <CreerUtilisateurTabContent
            newUserData={newUserData}
            setNewUserData={setNewUserData}
            isSaving={isSaving}
            onCreateUser={handleCreateUser}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200/80 shadow-sm py-3 lg:py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="relative">
                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl lg:rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 flex items-center justify-center text-lg lg:text-xl font-bold shadow-lg overflow-hidden">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : profile && profile.photo ? (
                    <img
                      src={mediaUrl(profile.photo) || ""}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  ) : (
                    <span>
                      {profile
                        ? `${profile.prenom?.[0] ?? ""}${profile.nom?.[0] ?? ""}`.toUpperCase()
                        : "?"}
                    </span>
                  )}
                </div>

                <div className="absolute -bottom-1 -right-1 h-3 w-3 lg:h-4 lg:w-4 rounded-full bg-green-400 border-2 border-white"></div>
              </div>
              <div className="max-w-[140px] lg:max-w-none">
                <h1 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent truncate">
                  {t('direction.title')}
                </h1>
                <p className="text-xs lg:text-sm text-gray-600 hidden sm:block">
                  {t('direction.subtitle')}
                </p>
              </div>
            </div>
            
            {/* Navigation desktop */}
            <div className="hidden lg:flex items-center gap-2">
              {tabs.map(tab => (
                <TabButton
                  key={tab.id}
                  active={activeTab === tab.id}
                  icon={tab.icon}
                  label={tab.label}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </div>

            {/* Bouton menu mobile */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu mobile déroulant */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="px-3 py-2 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {tab.icon}
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contenu Principal */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 lg:py-6 pb-20 lg:pb-6">
        <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {renderTabContent()}
        </div>

       
      </main>

      {/* Navigation mobile fixe */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 p-2 shadow-2xl">
        <div className="flex justify-around">
          {tabs.slice(0, 3).map(tab => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              icon={tab.icon}
              label={tab.label}
              onClick={() => setActiveTab(tab.id)}
              mobile={true}
            />
          ))}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 flex-1 min-w-0 ${
              tabs.slice(3).some(tab => activeTab === tab.id)
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="text-sm mb-1">⋯</div>
            <span className="text-xs font-medium">Plus</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

// ==================== COMPOSANTS DE CONTENU DES ONGLETS ====================

// Onglet Profil (inchangé)
interface ProfilTabContentProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  isSaving: boolean;
  onSave: () => void;
  photoPreview: string | null;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
  onTriggerFileInput: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const ProfilTabContent: React.FC<ProfilTabContentProps> = ({
  profile, setProfile, isEditing, setIsEditing, isSaving, onSave,
  photoPreview, onPhotoUpload, onRemovePhoto, onTriggerFileInput, fileInputRef
}) => {
  const { t } = useTranslation();
  const currentPhoto = photoPreview || profile.photo;

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">👤 {t('settings.personalInfo')}</h2>
          <p className="text-gray-600 text-sm lg:text-base">{t('settings.personalInfoDesc')}</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 w-full lg:w-auto"
        >
          {isEditing ? t('common.cancel') : t('settings.editProfile')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Photo de profil */}
        <div className="lg:col-span-1">
          <div className="p-4 lg:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl lg:rounded-2xl border border-blue-200 text-center">
            <h3 className="font-semibold text-blue-900 mb-4">{t('settings.profilePhoto')}</h3>
            
            <div className="relative inline-block mb-4">
              <div className="h-24 w-24 lg:h-32 lg:w-32 rounded-xl lg:rounded-2xl 
                  bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 
                  flex items-center justify-center text-2xl lg:text-4xl font-bold 
                  shadow-lg mx-auto overflow-hidden">
                {currentPhoto ? (
                  <img
                    src={mediaUrl(currentPhoto) || currentPhoto}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-gray-600 select-none">
                    {profile?.prenom && profile?.nom
                      ? `${profile.prenom[0].toUpperCase()}${profile.nom[0].toUpperCase()}`
                      : "?"}
                  </span>
                )}
              </div>
              
              {isEditing && (
                <div className="absolute -bottom-2 -right-2 flex gap-2">
                  <button
                    onClick={onTriggerFileInput}
                    className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200"
                    title={t('settings.uploadPhoto')}
                  >
                    <IconCamera className="w-3 h-3 lg:w-4 lg:h-4" />
                  </button>
                  
                  {currentPhoto && (
                    <button
                      onClick={onRemovePhoto}
                      className="p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors duration-200"
                      title={t('settings.removePhoto')}
                    >
                      <IconTrash className="w-3 h-3 lg:w-4 lg:h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={onPhotoUpload}
              accept="image/*"
              className="hidden"
            />

            {isEditing && (
              <p className="text-xs text-gray-600 mt-2">
                {t('settings.photoRequirements')}
              </p>
            )}
          </div>

          {/* Informations de connexion */}
          <div className="mt-4 p-3 lg:p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm lg:text-base">{t('direction.lastLogin')}</h4>
            <p className="text-xs lg:text-sm text-gray-600">
              {new Date().toLocaleDateString("fr-FR", { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <div className="p-4 lg:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl lg:rounded-2xl border border-green-200">
            <h3 className="font-semibold text-green-900 mb-4">{t('settings.personalInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
              {[
                { label: t('common.firstName'), field: "prenom", value: profile.prenom, type: "text" },
                { label: t('common.lastName'), field: "nom", value: profile.nom, type: "text" },
                { label: t('common.email'), field: "email", value: profile.email, type: "email" },
                { label: t('common.phone'), field: "telephone", value: profile.telephone, type: "text" },
              ].map(({ label, field, value, type }) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  {isEditing ? (
                    <input
                      type={type}
                      value={value}
                      onChange={(e) => setProfile(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 lg:px-4 py-2 lg:py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm lg:text-base"
                    />
                  ) : (
                    <div className="text-gray-900 text-base lg:text-lg font-medium">{value || "-"}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isEditing && (
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 order-2 sm:order-1"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('common.saving')}
                  </>
                ) : (
                  t('settings.saveChanges')
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== ONGLET PARAMÈTRES ====================
interface ParametresTabContentProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const ParametresTabContent: React.FC<ParametresTabContentProps> = ({ profile, setProfile }) => {
  const { t } = useTranslation();

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">⚙️ {t('settings.preferences')}</h2>
        <p className="text-gray-600 text-sm lg:text-base">{t('direction.preferencesDescription')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="p-4 lg:p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl lg:rounded-2xl border border-orange-200">
          <h3 className="font-semibold text-orange-900 mb-4">{t('settings.notificationPreferences')}</h3>
          <div className="space-y-3">
            {Object.entries(profile.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <div className="font-medium text-sm lg:text-base capitalize">
                    {key === 'email' && t('settings.emailNotifications')}
                    {key === 'sms' && t('settings.smsNotifications')}
                    {key === 'whatsapp' && t('settings.whatsappNotifications')}
                    {key === 'rappels' && t('settings.automaticReminders')}
                    {key === 'nouvelles' && t('settings.clinicNews')}
                  </div>
                </div>
                <button
                  onClick={() => setProfile(prev => ({ 
                    ...prev, 
                    notifications: { ...prev.notifications, [key]: !value } 
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    value ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== ONGLET SÉCURITÉ ====================
interface SecuriteTabContentProps {
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

const SecuriteTabContent: React.FC<SecuriteTabContentProps> = ({ showToast }) => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast(t('settings.passwordMismatch'), "warning");
      return;
    }
    if (newPassword.length < 8) {
      showToast(t('settings.passwordLengthError'), "warning");
      return;
    }
    
    setIsSaving(true);
    try {
      await updateCurrentUser({
        old_password: currentPassword,
        new_password: newPassword,
      });
      
      showToast(t('settings.passwordUpdateSuccess'), "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("❌ Erreur de modification :", err);
      showToast(t('settings.passwordUpdateError'), "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">🔒 {t('settings.security')}</h2>
        <p className="text-gray-600 text-sm lg:text-base">{t('direction.securityDescription')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="p-4 lg:p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl lg:rounded-2xl border border-red-200">
          <h3 className="font-semibold text-red-900 mb-4">{t('settings.changePassword')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('settings.currentPassword')}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 lg:px-4 py-2 lg:py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm lg:text-base"
                placeholder={t('settings.currentPassword')}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('settings.newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 lg:px-4 py-2 lg:py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm lg:text-base"
                placeholder={t('settings.newPassword')}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('settings.confirmPassword')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 lg:px-4 py-2 lg:py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm lg:text-base"
                placeholder={t('settings.confirmPassword')}
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
              className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 text-sm lg:text-base"
            >
              {isSaving ? t('common.updating') : t('settings.updatePassword')}
            </button>
          </div>
        </div>

        <div className="p-4 lg:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl lg:rounded-2xl border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-4">{t('settings.twoFactorAuth')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 lg:p-4 bg-white rounded-lg border border-gray-200">
              <div>
                <div className="font-semibold text-gray-900 text-sm lg:text-base">{t('settings.twoStepVerification')}</div>
                <div className="text-xs lg:text-sm text-gray-600">{t('settings.twoStepDesc')}</div>
              </div>
              <button
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="p-3 lg:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-3">
                <div className="text-yellow-600 text-lg">⚠️</div>
                <div>
                  <div className="font-semibold text-yellow-800 text-sm lg:text-base">{t('direction.securityRecommended')}</div>
                  <div className="text-xs lg:text-sm text-yellow-700">
                    {t('direction.twoFactorRecommendation')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== ONGLET GESTION UTILISATEURS ====================
interface GestionUtilisateursTabContentProps {
  loading: boolean;
  query: string;
  setQuery: (query: string) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  filteredUsers: User[];
  pageUsers: User[];
  onDeleteUser: (id: number) => void;
}

const GestionUtilisateursTabContent: React.FC<GestionUtilisateursTabContentProps> = ({
  loading,
  query,
  setQuery,
  page,
  setPage,
  totalPages,
  filteredUsers,
  pageUsers,
  onDeleteUser,
}) => {
  const { t } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; user?: User }>({ open: false });

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">🏥 {t('direction.userManagement')}</h2>
          <p className="text-gray-600 text-sm lg:text-base">{t('direction.userManagementDescription')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              placeholder={t('direction.searchUsers')} 
              value={query} 
              onChange={(e) => { setQuery(e.target.value); setPage(1); }} 
              className="pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 w-full text-sm lg:text-base"
            />
          </div>
        </div>
      </div>

    

      {/* Tableau - MODIFIÉ (colonne statut supprimée) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : pageUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👨‍⚕️</div>
            <h3 className="text-lg font-semibold text-gray-900">{t('direction.noUsersFound')}</h3>
            <p className="text-gray-600 mt-1">{t('direction.noResults')}</p>
            <button 
              onClick={() => { setQuery(""); setPage(1); }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('actions.reset')}
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50/30">
                  <tr>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-semibold text-gray-700">{t('direction.user')}</th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-semibold text-gray-700">{t('common.email')}</th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-semibold text-gray-700">{t('direction.roleDepartment')}</th>
                    <th className="px-3 lg:px-4 py-3 text-right text-xs lg:text-sm font-semibold text-gray-700">{t('actions.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pageUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-3 lg:px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg lg:rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 flex items-center justify-center font-semibold text-xs lg:text-sm overflow-hidden">
                            {user.photo ? (
                              <img src={mediaUrl(user.photo) || ""} alt={`${user.first_name} ${user.last_name}`} className="h-full w-full object-cover" />
                            ) : (
                              `${user.first_name[0]}${user.last_name[0]}`
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 text-sm lg:text-base truncate max-w-[120px] lg:max-w-none">{user.first_name} {user.last_name}</div>
                            <div className="text-xs text-gray-400 capitalize">{user.role.toLowerCase()}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 lg:px-4 py-3 text-xs lg:text-sm text-gray-600">
                        <div className="truncate max-w-[150px] lg:max-w-none">{user.email}</div>
                        <div className="text-xs text-gray-500">{user.telephone || "-"}</div>
                      </td>

                      <td className="px-3 lg:px-4 py-3 text-xs lg:text-sm text-gray-600">
                        <div className="capitalize">{user.role.toLowerCase()}</div>
                        <div className="text-xs text-gray-500">{user.departement || "-"}</div>
                      </td>

                      <td className="px-3 lg:px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 lg:gap-2">
                          <button 
                            onClick={() => setConfirmDelete({ open: true, user })}
                            className="inline-flex items-center gap-1 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors duration-200 text-xs lg:text-sm"
                          >
                            <IconTrash className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span className="hidden sm:inline">{t('common.delete')}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-3 lg:px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs lg:text-sm text-gray-600">
                {t('direction.page')} {page} {t('direction.of')} {totalPages} • {filteredUsers.length} {t('direction.results')}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 lg:px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200 text-xs lg:text-sm"
                >
                  {t('common.back')}
                </button>
                <button 
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 lg:px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200 text-xs lg:text-sm"
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {confirmDelete.open && confirmDelete.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl lg:rounded-2xl max-w-md w-full p-4 lg:p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <IconTrash className="w-6 h-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('direction.deleteUser')}</h3>
              <p className="text-gray-600 text-sm lg:text-base">
                {t('direction.deleteConfirmation', { name: `${confirmDelete.user.first_name} ${confirmDelete.user.last_name}` })}
              </p>
            </div>
            
            <div className="mt-6 flex justify-center gap-3">
              <button 
                onClick={() => setConfirmDelete({ open: false })} 
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 text-sm lg:text-base"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={() => {
                  onDeleteUser(confirmDelete.user!.id);
                  setConfirmDelete({ open: false });
                }} 
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 text-sm lg:text-base"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== ONGLET CRÉER UTILISATEUR ====================
interface CreerUtilisateurTabContentProps {
  newUserData: any;
  setNewUserData: (data: any) => void;
  isSaving: boolean;
  onCreateUser: () => void;
}

const CreerUtilisateurTabContent: React.FC<CreerUtilisateurTabContentProps> = ({
  newUserData,
  setNewUserData,
  isSaving,
  onCreateUser,
}) => {
  const { t } = useTranslation();

  const handleChange = (field: string, value: string | boolean) => {
    setNewUserData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">👥 {t('direction.createUser')}</h2>
        <p className="text-gray-600 text-sm lg:text-base">{t('direction.createUserDescription')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="lg:col-span-2 p-4 lg:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl lg:rounded-2xl border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-4">{t('direction.userInformation')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {[
              { label: `${t('common.firstName')} *`, field: "first_name", type: "text", placeholder: t('common.firstName') },
              { label: `${t('common.lastName')} *`, field: "last_name", type: "text", placeholder: t('common.lastName') },
              { label: `${t('common.username')} *`, field: "username", type: "text", placeholder: "ex: aicha.essalmi" },
              { label: `${t('common.email')} *`, field: "email", type: "email", placeholder: "email@clinique.local" },
              { label: t('common.phone'), field: "telephone", type: "text", placeholder: "+212 6 12 34 56 78" },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                <input 
                  type={type}
                  value={newUserData[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 lg:px-4 py-2 lg:py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm lg:text-base"
                  placeholder={placeholder}
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('role')}</label>
              <select 
                value={newUserData.role} 
                onChange={(e) => handleChange("role", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 lg:px-4 py-2 lg:py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm lg:text-base"
              >
                <option value="MEDECIN">{t('roles.doctor')}</option>
                <option value="SECRETAIRE">{t('roles.secretary')}</option>
                <option value="DIRECTION">{t('roles.direction')}</option>
              </select>
            </div>

            {/* SUPPRIMÉ: Champ statut */}

            {newUserData.role === "MEDECIN" ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('settings.personalCode')} *</label>
                <input 
                  value={newUserData.code_personnel} 
                  onChange={(e) => handleChange("code_personnel", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 lg:px-4 py-2 lg:py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm lg:text-base"
                  placeholder={t('settings.enterNewCode')}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('password')} *
                </label>
                <input 
                  type="password"
                  value={newUserData.password} 
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 lg:px-4 py-2 lg:py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm lg:text-base"
                  placeholder={t('settings.newPassword')}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('settings.department')}</label>
              <select 
                value={newUserData.departement} 
                onChange={(e) => handleChange("departement", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 lg:px-4 py-2 lg:py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm lg:text-base"
              >
                <option value="">{t('settings.selectDepartment')}</option>
                {DEPARTEMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {newUserData.role === "SECRETAIRE" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('secretary.postExtension')}</label>
                <input 
                  value={newUserData.poste} 
                  onChange={(e) => handleChange("poste", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 lg:px-4 py-2 lg:py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm lg:text-base"
                  placeholder={t('secretary.postExtension')}
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
            <button 
              onClick={() => {
                setNewUserData({
                  username: "",
                  first_name: "",
                  last_name: "",
                  email: "",
                  telephone: "",
                  role: "MEDECIN",
                  specialite: "",
                  departement: "",
                  poste: "",
                  code_personnel: "",
                  password: "",
                  is_active: true
                });
              }}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 text-sm lg:text-base order-2 sm:order-1"
            >
              {t('actions.reset')}
            </button>
            <button 
              onClick={onCreateUser}
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center gap-2 text-sm lg:text-base order-1 sm:order-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('common.creating')}
                </>
              ) : (
                t('actions.create')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectionAdminPage;