// src/components/DirectionAdminPage.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";

// ==================== TYPES ET INTERFACES ====================
interface User {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  role: "DIRECTION" | "MEDECIN" | "SECRETAIRE";
  departement?: string;
  specialite?: string;
  poste?: string;
  is_active: boolean;
  archived: boolean;
  date_adhesion?: string;
  photo?: string | null; // Modifié pour accepter null
}

interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: User["role"];
  specialite: string;
  departement: string;
  licenceMedicale: string;
  dateAdhesion: string;
  photo: string | null;
  langue: "fr" | "en";
  notifications: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    rappels: boolean;
    nouvelles: boolean;
  };
}

type ActiveTab = "profil" | "parametres" | "securite" | "role" | "medecins";

// ==================== DONNÉES STATIQUES ====================
const SPECIALITES = [
  "Cardiologie", "Dermatologie", "Gastro-entérologie", "Neurologie", 
  "Pédiatrie", "Radiologie", "Chirurgie", "Médecine Interne", 
  "Urgences", "Gynécologie", "Ophtalmologie", "Orthopédie",
  "Psychiatrie", "Radiothérapie", "Urologie", "Endocrinologie"
];

const DEPARTEMENTS = [
  "Médecine Interne", "Chirurgie", "Pédiatrie", "Urgences", 
  "Radiologie", "Laboratoire", "Administration", "Cardiologie",
  "Maternité", "Soins Intensifs", "Pharmacie", "Bloc Opératoire"
];

const INITIAL_USERS: User[] = [
  { 
    id: 1, 
    prenom: "Ahmed", 
    nom: "Benali", 
    email: "ahmed.benali@clinique.local", 
    telephone: "+212612345678", 
    role: "MEDECIN", 
    departement: "Médecine Interne", 
    specialite: "Cardiologie", 
    is_active: true, 
    archived: false, 
    date_adhesion: "2019-03-15",
    photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face"
  },
  { 
    id: 2, 
    prenom: "Sara", 
    nom: "El Amrani", 
    email: "sara.elamrani@clinique.local", 
    telephone: "+212611223344", 
    role: "SECRETAIRE", 
    departement: "Accueil & RDV", 
    specialite: "", 
    poste: "Standard: 102", 
    is_active: true, 
    archived: false, 
    date_adhesion: "2020-06-10",
    photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
  },
  { 
    id: 3, 
    prenom: "Youssef", 
    nom: "Rachidi", 
    email: "youssef.rachidi@clinique.local", 
    telephone: "+212698765432", 
    role: "DIRECTION", 
    departement: "Direction Générale", 
    is_active: true, 
    archived: false, 
    date_adhesion: "2017-09-01",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  },
  { 
    id: 4, 
    prenom: "Leila", 
    nom: "Mansouri", 
    email: "leila.mansouri@clinique.local", 
    telephone: "+212600112233", 
    role: "MEDECIN", 
    departement: "Pédiatrie", 
    specialite: "Pédiatrie", 
    is_active: true, 
    archived: false, 
    date_adhesion: "2021-08-20",
    photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face"
  },
  { 
    id: 5, 
    prenom: "Karim", 
    nom: "Zouhair", 
    email: "karim.zouhair@clinique.local", 
    telephone: "+212655443322", 
    role: "MEDECIN", 
    departement: "Chirurgie", 
    specialite: "Chirurgie Générale", 
    is_active: false, 
    archived: false, 
    date_adhesion: "2018-11-05" 
  },
];

const CURRENT_USER: UserProfile = {
  id: 1, 
  nom: "Benali", 
  prenom: "Ahmed", 
  email: "ahmed.benali@cliniqueriviera.ma", 
  telephone: "+212 6 12 34 56 78", 
  role: "MEDECIN",
  specialite: "Cardiologie", 
  departement: "Médecine Interne", 
  licenceMedicale: "MD-2019-0456", 
  dateAdhesion: "2019-03-15", 
  photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face", 
  langue: "fr",
  notifications: { email: true, sms: false, whatsapp: true, rappels: true, nouvelles: true }
};

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

const IconBadge: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

const IconMedecin: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
  </svg>
);

const IconPlus: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/>
  </svg>
);

const IconEdit: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
);

const IconTrash: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>
);

const IconSearch: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
);

const IconCamera: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
    <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

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
        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 flex-1 min-w-0 ${
          active
            ? "bg-blue-600 text-white shadow-lg"
            : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        <div className="text-lg mb-1">{icon}</div>
        <span className="text-xs font-medium truncate max-w-full">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
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
  // États principaux
  const [activeTab, setActiveTab] = useState<ActiveTab>("profil");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;
  
  // États pour le profil
  const [profile, setProfile] = useState<UserProfile>(CURRENT_USER);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États modales
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");

  // Chargement initial
  useEffect(() => {
    setLoading(true);
    setTimeout(() => { 
      setUsers(INITIAL_USERS); 
      setLoading(false); 
    }, 800);
  }, []);

  // Mémoisation des données filtrées et paginées
  const { filteredUsers, totalPages, pageUsers } = useMemo(() => {
    const filtered = users.filter(u => !u.archived && (
      `${u.prenom} ${u.nom}`.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      u.specialite?.toLowerCase().includes(query.toLowerCase()) ||
      u.departement?.toLowerCase().includes(query.toLowerCase())
    ));
    
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    
    return { filteredUsers: filtered, totalPages, pageUsers };
  }, [users, query, page]);

  // Fonctions CRUD
  const addUser = (payload: Partial<User>) => {
    const newUser: User = { 
      id: Date.now(), 
      prenom: payload.prenom || "Nouveau", 
      nom: payload.nom || "Utilisateur", 
      email: payload.email || `user${Date.now()}@clinique.local`, 
      telephone: payload.telephone || "", 
      role: payload.role || "MEDECIN", 
      departement: payload.departement || "", 
      specialite: payload.specialite || "", 
      poste: payload.poste || "", 
      is_active: true, 
      archived: false, 
      date_adhesion: new Date().toISOString().split("T")[0],
      photo: payload.photo || undefined // Changé de null à undefined
    };
    setUsers(prev => [newUser, ...prev]);
    setShowUserModal(false); 
    setPage(1); 
  };

  const updateUser = (id: number, patch: Partial<User>) => { 
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u)); 
    setShowUserModal(false); 
    setSelectedUser(null); 
  };

  const softDeleteUser = (id: number) => { 
    setUsers(prev => prev.map(u => u.id === id ? { ...u, archived: true } : u)); 
  };

  const toggleActive = (user: User) => {
    updateUser(user.id, { is_active: !user.is_active });
  };

  const openAddModal = () => {
    setModalMode("add");
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const openEditModal = (user: User) => {
    setModalMode("edit");
    setSelectedUser(user);
    setShowUserModal(true);
  };

  // Fonctions gestion photo de profil
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("La taille maximale est de 5MB");
      return;
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner une image valide");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhotoPreview(result);
      setProfile(prev => ({ ...prev, photo: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setProfile(prev => ({ ...prev, photo: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Fonctions profil
  const handleSaveProfile = async () => { 
    setIsSaving(true); 
    try {
      await new Promise(resolve => setTimeout(resolve, 1200)); 
      setIsEditing(false); 
      // Ici, normalement on enverrait les données au serveur
      console.log("Profil sauvegardé:", profile);
    } catch (error) {
      console.error("Erreur sauvegarde profil:", error);
    } finally {
      setIsSaving(false); 
    }
  };

  // Définition des onglets
  const tabs = [
    { id: "profil" as ActiveTab, icon: <IconUser />, label: "Profil" },
    { id: "parametres" as ActiveTab, icon: <IconSettings />, label: "Paramètres" },
    { id: "securite" as ActiveTab, icon: <IconShield />, label: "Sécurité" },
    { id: "role" as ActiveTab, icon: <IconBadge />, label: "Rôle" },
    { id: "medecins" as ActiveTab, icon: <IconMedecin />, label: "Médecins" },
  ];

  // Rendu du contenu selon l'onglet actif
  const renderTabContent = () => {
    switch (activeTab) {
      case "profil":
        return <ProfilTabContent 
          profile={profile} 
          setProfile={setProfile}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          isSaving={isSaving}
          onSave={handleSaveProfile}
          photoPreview={photoPreview}
          onPhotoUpload={handlePhotoUpload}
          onRemovePhoto={handleRemovePhoto}
          onTriggerFileInput={triggerFileInput}
          fileInputRef={fileInputRef}
        />;
      
      case "parametres":
        return <ParametresTabContent profile={profile} setProfile={setProfile} />;
      
      case "securite":
        return <SecuriteTabContent />;
      
      case "role":
        return <RoleTabContent profile={profile} />;
      
      case "medecins":
        return <MedecinsTabContent 
          loading={loading}
          query={query}
          setQuery={setQuery}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          filteredUsers={filteredUsers}
          pageUsers={pageUsers}
          onAddUser={openAddModal}
          onEditUser={openEditModal}
          onToggleActive={toggleActive}
          onDeleteUser={softDeleteUser}
        />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200/80 shadow-sm py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-xl font-bold shadow-lg overflow-hidden">
                  {profile.photo ? (
                    <img 
                      src={profile.photo} 
                      alt="Profile" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    `${profile.prenom[0]}${profile.nom[0]}`
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                  Espace Direction
                </h1>
                <p className="text-sm text-gray-600">
                  Clinique Riviera - Gestion administrative
                </p>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center gap-3">
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
          </div>
        </div>
      </header>

      {/* Navigation Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 p-2 shadow-2xl">
        <div className="flex justify-around">
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              icon={tab.icon}
              label={tab.label}
              onClick={() => setActiveTab(tab.id)}
              mobile={true}
            />
          ))}
        </div>
      </nav>

      {/* Contenu Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {renderTabContent()}
        </div>

        {/* Footer avec statistiques globales */}
        <footer className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.is_active).length}</div>
              <div className="text-sm text-blue-800 font-medium">Utilisateurs Actifs</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="text-2xl font-bold text-green-600">{users.filter(u => u.role === "MEDECIN" && u.is_active).length}</div>
              <div className="text-sm text-green-800 font-medium">Médecins</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === "SECRETAIRE" && u.is_active).length}</div>
              <div className="text-sm text-purple-800 font-medium">Secrétaires</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{users.filter(u => !u.is_active).length}</div>
              <div className="text-sm text-orange-800 font-medium">Comptes Inactifs</div>
            </div>
          </div>
          
          {/* Section recherche avancée */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">🔍 Recherche Avancée</h3>
                <p className="text-sm text-gray-600">Trouvez rapidement des utilisateurs spécifiques</p>
              </div>
              <div className="relative w-80">
               
                <input 
                  placeholder="Rechercher par nom, email, spécialité..." 
                  value={query} 
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }} 
                  className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 w-full"
                />
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Modal Utilisateur */}
      {showUserModal && (
        <UserModal 
          mode={modalMode}
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSubmit={modalMode === "add" ? addUser : (payload) => selectedUser && updateUser(selectedUser.id, payload)}
        />
      )}
    </div>
  );
};

// ==================== COMPOSANTS DE CONTENU DES ONGLETS ====================

// Onglet Profil
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
  const currentPhoto = photoPreview || profile.photo;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">👤 Profil Utilisateur</h2>
          <p className="text-gray-600">Gérez vos informations personnelles et professionnelles</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
        >
          {isEditing ? "Annuler" : "Modifier"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo de profil */}
        <div className="lg:col-span-1">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 text-center">
            <h3 className="font-semibold text-blue-900 mb-4">Photo de Profil</h3>
            
            <div className="relative inline-block mb-4">
              <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-4xl font-bold shadow-lg mx-auto overflow-hidden">
                {currentPhoto ? (
                  <img 
                    src={currentPhoto} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  `${profile.prenom[0]}${profile.nom[0]}`
                )}
              </div>
              
              {isEditing && (
                <div className="absolute -bottom-2 -right-2 flex gap-2">
                  <button
                    onClick={onTriggerFileInput}
                    className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200"
                    title="Changer la photo"
                  >
                    <IconCamera className="w-4 h-4" />
                  </button>
                  
                  {currentPhoto && (
                    <button
                      onClick={onRemovePhoto}
                      className="p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors duration-200"
                      title="Supprimer la photo"
                    >
                      <IconTrash className="w-4 h-4" />
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
                PNG, JPG, JPEG max 5MB
              </p>
            )}
          </div>

          {/* Informations de connexion */}
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Dernière connexion</h4>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString("fr-FR", { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Informations personnelles et professionnelles */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
            <h3 className="font-semibold text-green-900 mb-4">Informations Personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Prénom", field: "prenom", value: profile.prenom, type: "text" },
                { label: "Nom", field: "nom", value: profile.nom, type: "text" },
                { label: "Email", field: "email", value: profile.email, type: "email" },
                { label: "Téléphone", field: "telephone", value: profile.telephone, type: "text" },
              ].map(({ label, field, value, type }) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  {isEditing ? (
                    <input
                      type={type}
                      value={value}
                      onChange={(e) => setProfile(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    />
                  ) : (
                    <div className="text-gray-900 text-lg font-medium">{value}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-4">Informations Professionnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Spécialité", field: "specialite", value: profile.specialite, type: "select", options: SPECIALITES },
                { label: "Département", field: "departement", value: profile.departement, type: "select", options: DEPARTEMENTS },
                { label: "Licence Médicale", field: "licenceMedicale", value: profile.licenceMedicale, type: "text" },
                { label: "Date d'Adhésion", field: "dateAdhesion", value: profile.dateAdhesion, type: "date" },
              ].map(({ label, field, value, type, options }) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  {isEditing && type === "select" ? (
                    <select
                      value={value}
                      onChange={(e) => setProfile(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    >
                      {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : isEditing ? (
                    <input
                      type={type}
                      value={value}
                      onChange={(e) => setProfile(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    />
                  ) : (
                    <div className="text-gray-900 text-lg font-medium">
                      {type === "date" ? 
                        new Date(value).toLocaleDateString("fr-FR", { 
                          year: 'numeric', month: 'long', day: 'numeric' 
                        }) : 
                        value
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sauvegarde...
                  </>
                ) : (
                  "Sauvegarder"
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

const ParametresTabContent: React.FC<ParametresTabContentProps> = ({ profile, setProfile }) => (
  <div className="p-6">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">⚙️ Paramètres et Préférences</h2>
      <p className="text-gray-600">Personnalisez votre expérience utilisateur</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-4">Préférences Générales</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Langue</label>
            <select
              value={profile.langue}
              onChange={(e) => setProfile(prev => ({ ...prev, langue: e.target.value as "fr" | "en" }))}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Thème d'interface</label>
            <select className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
              <option value="auto">Automatique</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
        <h3 className="font-semibold text-orange-900 mb-4">Notifications</h3>
        <div className="space-y-3">
          {Object.entries(profile.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div>
                <div className="font-medium capitalize">
                  {key === 'email' && 'Email'}
                  {key === 'sms' && 'SMS'}
                  {key === 'whatsapp' && 'WhatsApp'}
                  {key === 'rappels' && 'Rappels automatiques'}
                  {key === 'nouvelles' && 'Nouvelles de la clinique'}
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

// ==================== ONGLET SÉCURITÉ ====================
const SecuriteTabContent: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 8) {
      alert("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsSaving(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🔒 Sécurité du Compte</h2>
        <p className="text-gray-600">Protégez votre compte avec des paramètres de sécurité avancés</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200">
          <h3 className="font-semibold text-red-900 mb-4">Changer le Mot de Passe</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe actuel</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                placeholder="Entrez votre mot de passe actuel"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                placeholder="Au moins 8 caractères"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                placeholder="Répétez le nouveau mot de passe"
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
              className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
            >
              {isSaving ? "Modification..." : "Modifier le mot de passe"}
            </button>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-4">Sécurité Avancée</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div>
                <div className="font-semibold text-gray-900">Authentification à deux facteurs</div>
                <div className="text-sm text-gray-600">Ajoutez une sécurité supplémentaire à votre compte</div>
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

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-3">
                <div className="text-yellow-600 text-lg">⚠️</div>
                <div>
                  <div className="font-semibold text-yellow-800">Sécurité recommandée</div>
                  <div className="text-sm text-yellow-700">
                    Activez l'authentification à deux facteurs pour une protection optimale de votre compte.
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

// ==================== ONGLET RÔLE ====================
interface RoleTabContentProps {
  profile: UserProfile;
}

const RoleTabContent: React.FC<RoleTabContentProps> = ({ profile }) => (
  <div className="p-6">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">🛡 Rôle et Permissions</h2>
      <p className="text-gray-600">Gestion des droits d'accès et des privilèges</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl border border-indigo-200">
          <h3 className="font-semibold text-indigo-900 mb-4">Informations du Rôle</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
              <span className="font-medium">Rôle actuel</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                {profile.role.toLowerCase()}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
              <span className="font-medium">Département</span>
              <span className="text-gray-900 font-medium">{profile.departement}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
              <span className="font-medium">Spécialité</span>
              <span className="text-gray-900 font-medium">{profile.specialite}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
              <span className="font-medium">Date d'adhésion</span>
              <span className="text-gray-900 font-medium">
                {new Date(profile.dateAdhesion).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
        <h3 className="font-semibold text-green-900 mb-4">Permissions Accordées</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div>
              <div className="font-medium">Gestion des rendez-vous</div>
              <div className="text-sm text-gray-500">Visualiser et modifier les rendez-vous patients</div>
            </div>
            <div className="text-green-600 font-medium">✅ Autorisé</div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div>
              <div className="font-medium">Accès aux statistiques</div>
              <div className="text-sm text-gray-500">Consulter les données de performance</div>
            </div>
            <div className={profile.role === "DIRECTION" ? "text-green-600 font-medium" : "text-gray-400 font-medium"}>
              {profile.role === "DIRECTION" ? "✅ Autorisé" : "❌ Restreint"}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div>
              <div className="font-medium">Gestion des utilisateurs</div>
              <div className="text-sm text-gray-500">Ajouter/modifier/supprimer des utilisateurs</div>
            </div>
            <div className={profile.role === "DIRECTION" ? "text-green-600 font-medium" : "text-gray-400 font-medium"}>
              {profile.role === "DIRECTION" ? "✅ Autorisé" : "❌ Restreint"}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <div>
              <div className="font-medium">Export de données</div>
              <div className="text-sm text-gray-500">Télécharger les rapports et données</div>
            </div>
            <div className="text-green-600 font-medium">✅ Autorisé</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ==================== ONGLET MÉDECINS ====================
interface MedecinsTabContentProps {
  loading: boolean;
  query: string;
  setQuery: (query: string) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  filteredUsers: User[];
  pageUsers: User[];
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onToggleActive: (user: User) => void;
  onDeleteUser: (id: number) => void;
}

const MedecinsTabContent: React.FC<MedecinsTabContentProps> = ({
  loading,
  query,
  setQuery,
  page,
  setPage,
  totalPages,
  filteredUsers,
  pageUsers,
  onAddUser,
  onEditUser,
  onToggleActive,
  onDeleteUser,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; user?: User }>({ open: false });

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🏥 Gestion des Médecins</h2>
          <p className="text-gray-600">Administration du personnel médical et paramédical</p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              placeholder="Rechercher..." 
              value={query} 
              onChange={(e) => { setQuery(e.target.value); setPage(1); }} 
              className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 w-64"
            />
          </div>
          
          <button 
            onClick={onAddUser}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all duration-200"
          >
            <IconPlus />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Médecins actifs</div>
          <div className="text-2xl font-bold text-blue-900">
            {filteredUsers.filter(u => u.role === "MEDECIN" && u.is_active).length}
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
          <div className="text-sm text-green-600 font-medium">Secrétaires</div>
          <div className="text-2xl font-bold text-green-900">
            {filteredUsers.filter(u => u.role === "SECRETAIRE" && u.is_active).length}
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
          <div className="text-sm text-purple-600 font-medium">Total utilisateurs</div>
          <div className="text-2xl font-bold text-purple-900">{filteredUsers.filter(u => u.is_active).length}</div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : pageUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👨‍⚕️</div>
            <h3 className="text-lg font-semibold text-gray-900">Aucun utilisateur trouvé</h3>
            <p className="text-gray-600 mt-1">Aucun résultat ne correspond à votre recherche</p>
            <button 
              onClick={() => { setQuery(""); setPage(1); }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Réinitialiser la recherche
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Utilisateur</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rôle/Spécialité</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pageUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold text-sm overflow-hidden">
                            {user.photo ? (
                              <img src={user.photo} alt={`${user.prenom} ${user.nom}`} className="h-full w-full object-cover" />
                            ) : (
                              `${user.prenom[0]}${user.nom[0]}`
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.prenom} {user.nom}</div>
                            <div className="text-xs text-gray-400 capitalize">{user.role.toLowerCase()}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>{user.email}</div>
                        <div className="text-xs text-gray-500">{user.telephone || "-"}</div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>{user.specialite || user.poste || "-"}</div>
                        <div className="text-xs text-gray-500">{user.departement || "-"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {user.is_active ? "🟢 Actif" : "🔴 Inactif"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onEditUser(user)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors duration-200 text-sm"
                          >
                            <IconEdit />
                            Modifier
                          </button>
                          <button 
                            onClick={() => onToggleActive(user)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors duration-200 ${
                              user.is_active
                                ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            {user.is_active ? "Désactiver" : "Activer"}
                          </button>
                          <button 
                            onClick={() => setConfirmDelete({ open: true, user })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors duration-200 text-sm"
                          >
                            <IconTrash />
                            Archiver
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {page} sur {totalPages} • {filteredUsers.length} résultat(s)
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(Math.max(1, page - 1))}

                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                >
                  Précédent
                </button>
                <button 
                 onClick={() => setPage(Math.min(totalPages, page + 1))}

                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                >
                  Suivant
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {confirmDelete.open && confirmDelete.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Archiver utilisateur</h3>
              <p className="text-gray-600">
                Êtes-vous sûr de vouloir archiver {confirmDelete.user.prenom} {confirmDelete.user.nom} ?
              </p>
            </div>
            
            <div className="mt-6 flex justify-center gap-3">
              <button 
                onClick={() => setConfirmDelete({ open: false })} 
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  onDeleteUser(confirmDelete.user!.id);
                  setConfirmDelete({ open: false });
                }} 
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
              >
                Archiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MODAL UTILISATEUR ====================
interface UserModalProps {
  mode: "add" | "edit";
  user: User | null;
  onClose: () => void;
  onSubmit: (payload: Partial<User>) => void;
}

const UserModal: React.FC<UserModalProps> = ({ mode, user, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    prenom: user?.prenom ?? "",
    nom: user?.nom ?? "",
    email: user?.email ?? "",
    telephone: user?.telephone ?? "",
    role: (user?.role ?? "MEDECIN") as User["role"],
    specialite: user?.specialite ?? "",
    departement: user?.departement ?? "",
    poste: user?.poste ?? "",
    photo: user?.photo ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La taille maximale est de 5MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner une image valide");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhotoPreview(result);
      setFormData(prev => ({ ...prev, photo: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, photo: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!formData.prenom || !formData.nom || !formData.email) { 
      alert("Prénom, nom et email sont obligatoires."); 
      return; 
    }
    
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              {mode === "add" ? "Ajouter un Utilisateur" : "Modifier l'Utilisateur"}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Photo de profil */}
            <div className="lg:col-span-1">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 text-center">
                <h4 className="font-semibold text-blue-900 mb-4">Photo de Profil</h4>
                
                <div className="relative inline-block mb-4">
                  <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-2xl font-bold shadow-lg mx-auto overflow-hidden">
                    {photoPreview ? (
                      <img 
                        src={photoPreview} 
                        alt="Profile" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      `${formData.prenom[0] || "U"}${formData.nom[0] || "S"}`
                    )}
                  </div>
                  
                  <div className="absolute -bottom-2 -right-2 flex gap-2">
                    <button
                      onClick={triggerFileInput}
                      className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200"
                      title="Changer la photo"
                    >
                      <IconCamera className="w-3 h-3" />
                    </button>
                    
                    {photoPreview && (
                      <button
                        onClick={handleRemovePhoto}
                        className="p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors duration-200"
                        title="Supprimer la photo"
                      >
                        <IconTrash className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />

                <p className="text-xs text-gray-600">
                  PNG, JPG, JPEG max 5MB
                </p>
              </div>
            </div>

            {/* Informations */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Prénom *", field: "prenom", type: "text", placeholder: "Prénom" },
                  { label: "Nom *", field: "nom", type: "text", placeholder: "Nom" },
                  { label: "Email *", field: "email", type: "email", placeholder: "email@clinique.local" },
                  { label: "Téléphone", field: "telephone", type: "text", placeholder: "+212 6 12 34 56 78" },
                ].map(({ label, field, type, placeholder }) => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                    <input 
                      type={type}
                      value={formData[field as keyof typeof formData]}
                      onChange={(e) => handleChange(field as keyof typeof formData, e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      placeholder={placeholder}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rôle</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => handleChange("role", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    <option value="MEDECIN">Médecin</option>
                    <option value="SECRETAIRE">Secrétaire</option>
                    <option value="DIRECTION">Direction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Spécialité</label>
                  <input 
                    value={formData.specialite} 
                    onChange={(e) => handleChange("specialite", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="Spécialité médicale"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Département</label>
                  <input 
                    value={formData.departement} 
                    onChange={(e) => handleChange("departement", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="Département"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Poste</label>
                  <input 
                    value={formData.poste} 
                    onChange={(e) => handleChange("poste", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="Poste occupé"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
          >
            Annuler
          </button>
          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enregistrement...
              </>
            ) : (
              mode === "add" ? "Ajouter" : "Modifier"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectionAdminPage;