// src/components/DirectionAdminPage.tsx
import React, { useEffect, useState } from "react";

/**
 * DirectionAdminPage (responsive + sticky UI)
 * - Single-file, mock data
 * - Responsive: desktop / tablet / mobile
 * - Sticky header, mobile bottom action bar (FAB), compact row menu on mobile
 */

/* ---------------------- Types ---------------------- */
type Role = "DIRECTION" | "MEDECIN" | "SECRETAIRE";


type User = {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  role: Role;
  departement?: string | null;
  specialite?: string | null;
  poste?: string | null;
  is_active: boolean;
  archived?: boolean;
  date_adhesion?: string;
};

type UserProfile = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: Role;
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
};

/* ---------------------- Mock data ---------------------- */
const INITIAL_USERS: User[] = [
  { id: 1, prenom: "Ahmed", nom: "Benali", email: "ahmed.benali@clinique.local", telephone: "+212612345678", role: "MEDECIN", departement: "Médecine Interne", specialite: "Cardiologie", poste: null, is_active: true, archived: false, date_adhesion: "2019-03-15" },
  { id: 2, prenom: "Sara", nom: "El Amrani", email: "sara.elamrani@clinique.local", telephone: "+212611223344", role: "SECRETAIRE", departement: "Accueil & RDV", specialite: null, poste: "Standard: 102", is_active: true, archived: false, date_adhesion: "2020-06-10" },
  { id: 3, prenom: "Youssef", nom: "Rachidi", email: "youssef.rachidi@clinique.local", telephone: "+212698765432", role: "DIRECTION", departement: "Direction Générale", specialite: null, poste: "DG", is_active: true, archived: false, date_adhesion: "2017-09-01" },
];

const CURRENT_USER: UserProfile = {
  id: 1, nom: "Benali", prenom: "Ahmed", email: "ahmed.benali@cliniqueriviera.ma", telephone: "+212 6 12 34 56 78", role: "MEDECIN",
  specialite: "Cardiologie", departement: "Médecine Interne", licenceMedicale: "MD-2019-0456", dateAdhesion: "2019-03-15", photo: null, langue: "fr",
  notifications: { email: true, sms: false, whatsapp: true, rappels: true, nouvelles: true }
};

const SPECIALITES = ["Cardiologie","Dermatologie","Gastro-entérologie","Neurologie","Pédiatrie","Radiologie","Chirurgie","Médecine Interne","Urgences","Gynécologie","Ophtalmologie"];
const DEPARTEMENTS = ["Médecine Interne","Chirurgie","Pédiatrie","Urgences","Radiologie","Laboratoire","Administration"];

/* ---------------------- Icons ---------------------- */
const IconPlus = () => (<svg className="w-4 h-4 inline-block mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/></svg>);
const IconEdit = () => (<svg className="w-4 h-4 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6 6L18 14l-6-6-3 3z"/></svg>);
const IconTrash = () => (<svg className="w-4 h-4 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6M10 6V4a2 2 0 012-2"/></svg>);
const IconMore = () => (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 6v.01M12 12v.01M12 18v.01"/></svg>);

/* ---------------------- Component ---------------------- */
const DirectionAdminPage: React.FC = () => {
  // main sections
  const [section, setSection] = useState<"admin" | "settings">("admin");

  // admin states
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<{ open: boolean; user?: User }>({ open: false });
  const [openRowMenuId, setOpenRowMenuId] = useState<number | null>(null); // mobile row menu


  // profile/settings
  const [activeTab, setActiveTab] = useState<"profil" | "preferences" | "securite" | "role">("profil");
  const [profile, setProfile] = useState<UserProfile>(CURRENT_USER);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [autoLogout, setAutoLogout] = useState(30);
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("light");

  useEffect(() => {
    setLoading(true);
    setTimeout(() => { setUsers(INITIAL_USERS); setLoading(false); }, 300);
  }, []);

  // filtered / pagination
  const filtered = users.filter(u => !u.archived && (
    `${u.prenom} ${u.nom}`.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  ));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // CRUD (mock)
  const addUser = (payload: Partial<User>) => {
    const newUser: User = { id: Date.now(), prenom: payload.prenom || "Nom", nom: payload.nom || "Prenom", email: payload.email || `user${Date.now()}@local`, telephone: payload.telephone || "", role: (payload.role as Role) || "MEDECIN", departement: payload.departement || null, specialite: payload.specialite || null, poste: payload.poste || null, is_active: true, archived: false, date_adhesion: new Date().toISOString().split("T")[0] };
    setUsers(prev => [newUser, ...prev]);
    setShowAddModal(false); setPage(1); alert("Médecin ajouté (mock).");
  };
  const updateUser = (id: number, patch: Partial<User>) => { setUsers(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u)); setShowEditModal(false); setSelected(null); alert("Médecin mis à jour (mock)."); };
  const softDeleteUser = (id: number) => { setUsers(prev => prev.map(u => u.id === id ? { ...u, archived: true } : u)); setShowConfirmDelete({ open: false }); alert("Médecin archivé (mock)."); };
  const toggleActive = (u: User) => updateUser(u.id, { is_active: !u.is_active });

  // profile helpers
  const handleProfileUpdate = (field: keyof UserProfile, value: any) => setProfile(prev => ({ ...prev, [field]: value }));
  const handleNotificationToggle = (type: keyof UserProfile['notifications']) => setProfile(prev => ({ ...prev, notifications: { ...prev.notifications, [type]: !prev.notifications[type] } }));
  
  const handleSaveProfile = async () => { setIsSaving(true); await new Promise(r => setTimeout(r, 900)); setIsSaving(false); setIsEditing(false); alert("Profil sauvegardé (mock)."); };
  const handleChangePassword = async () => { if (newPassword !== confirmPassword) { alert("Les mots de passe ne correspondent pas"); return; } if (newPassword.length < 8) { alert("Min 8 caractères"); return; } setIsSaving(true); await new Promise(r => setTimeout(r, 900)); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setIsSaving(false); alert("Mot de passe modifié (mock)."); };
  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }) : "-";
  const exportData = () => { const data = { profile, exportDate: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `profile_${profile.prenom}_${profile.nom}_${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url); };

  /* ---------------------- Render UI ---------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 p-4 md:p-8">
      {/* Sticky main header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200 py-3 mb-6">
        <div className="mx-auto max-w-7xl px-2 md:px-0 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Espace Direction — Admin & Paramètres</h1>
            <p className="text-xs md:text-sm text-gray-500">Gestion médecins, permissions, profil — responsive</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => setSection("admin")} className={`px-3 py-1 rounded ${section === "admin" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Administration</button>
            <button onClick={() => setSection("settings")} className={`px-3 py-1 rounded ${section === "settings" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Paramètres</button>
            <button onClick={() => exportData()} className="px-3 py-1 rounded bg-gray-50 border text-sm">Exporter profil</button>
          </div>
          {/* mobile small controls */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={() => setShowAddModal(true)} className="rounded-full bg-blue-600 text-white p-2 shadow-md" aria-label="Ajouter">
              <IconPlus />
            </button>
            <button onClick={() => setSection(section === "admin" ? "settings" : "admin")} className="rounded-full bg-white p-2 border">
              {section === "admin" ? "Param" : "Admin"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: compact profile & nav (collapsible on mobile) */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="rounded-xl bg-white p-4 shadow border">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-lg font-semibold">{profile.prenom?.[0]}{profile.nom?.[0]}</div>
              <div>
                <div className="font-semibold">{profile.prenom} {profile.nom}</div>
                <div className="text-xs text-gray-500">{profile.email}</div>
                <div className="text-xs text-gray-400 mt-1">Membre depuis {formatDate(profile.dateAdhesion)}</div>
              </div>
            </div>
          </div>

          <nav className="rounded-xl bg-white p-3 shadow border hidden lg:block">
            <button onClick={() => setSection("admin")} className={`w-full text-left px-3 py-2 rounded ${section === "admin" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}>Administration</button>
            <button onClick={() => setSection("settings")} className={`w-full text-left px-3 py-2 rounded ${section === "settings" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}>Profil & Paramètres</button>
          </nav>

          <div className="rounded-xl bg-white p-3 shadow border">
            <h4 className="text-sm font-semibold mb-2">Raccourcis</h4>
            <button onClick={() => { setUsers(INITIAL_USERS); setPage(1); alert("Liste réinitialisée (mock)"); }} className="w-full text-left px-3 py-2 rounded hover:bg-gray-50">Réinitialiser liste</button>
            <button onClick={() => exportData()} className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 mt-2">Exporter Profil</button>
          </div>
        </aside>

        {/* Main */}
        <main className="lg:col-span-3 space-y-6">
          {/* ADMIN SECTION */}
          {section === "admin" && (
            <section className="rounded-xl bg-white p-4 md:p-6 shadow border">
              {/* header row inside card (sticky on top of card for long lists) */}
              <div className="sticky top-20 md:top-[88px] z-20 bg-white/80 backdrop-blur-sm -mx-4 md:mx-0 px-4 md:px-0 py-3 md:py-0 border-b md:border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Gestion des Médecins</h2>
                    <div className="text-xs text-gray-500">Ajouter / Modifier / Archiver — layout responsive</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden md:block">
                      <input placeholder="Rechercher (nom/email)..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} className="rounded-lg border px-3 py-2 text-sm w-64" />
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm flex items-center">
                      <IconPlus /> Ajouter
                    </button>
                  </div>
                </div>

                {/* mobile search */}
                <div className="md:hidden mt-3">
                  <input placeholder="Rechercher..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} className="rounded-lg border px-3 py-2 text-sm w-full" />
                </div>
              </div>

              {/* table / list */}
              <div className="mt-4 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nom</th>
                      <th className="hidden sm:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                      <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500">Spécialité</th>
                      <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500">Dépt</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Statut</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-500">Chargement...</td></tr>
                    ) : pageItems.length === 0 ? (
                      <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-500">Aucun médecin trouvé.</td></tr>
                    ) : pageItems.map(u => (
                      <tr key={u.id} className="group">
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">{u.prenom[0]}{u.nom[0]}</div>
                            <div>
                              <div className="font-medium">{u.prenom} {u.nom}</div>
                              <div className="text-xs text-gray-500 sm:hidden">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="hidden sm:table-cell px-3 py-3 whitespace-nowrap text-sm text-gray-600">{u.email}</td>
                        <td className="hidden md:table-cell px-3 py-3 whitespace-nowrap text-sm">{u.specialite ?? "-"}</td>
                        <td className="hidden lg:table-cell px-3 py-3 whitespace-nowrap text-sm">{u.departement ?? "-"}</td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded ${u.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{u.is_active ? "Actif" : "Désactivé"}</span>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap text-right text-sm">
                          {/* Desktop actions */}
                          <div className="hidden sm:flex items-center justify-end gap-2">
                            <button onClick={() => { setSelected(u); setShowEditModal(true); }} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"><IconEdit /> Modifier</button>
                            <button onClick={() => setShowConfirmDelete({ open: true, user: u })} className="px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 text-sm"><IconTrash /> Archiver</button>
                            <button onClick={() => toggleActive(u)} className="px-2 py-1 rounded bg-gray-50 text-sm">{u.is_active ? "Désact." : "Activer"}</button>
                          </div>

                          {/* Mobile compact menu */}
                          <div className="sm:hidden relative inline-block">
                            <button onClick={() => setOpenRowMenuId(openRowMenuId === u.id ? null : u.id)} className="p-2 rounded bg-gray-100">
                              <IconMore />
                            </button>

                            {openRowMenuId === u.id && (
                              <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow-md z-40">
                                <button onClick={() => { setSelected(u); setShowEditModal(true); setOpenRowMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Modifier</button>
                                <button onClick={() => { setShowConfirmDelete({ open: true, user: u }); setOpenRowMenuId(null); }} className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-50">Archiver</button>
                                <button onClick={() => { toggleActive(u); setOpenRowMenuId(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">{u.is_active ? "Désactiver" : "Activer"}</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">Page {page} / {totalPages}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-gray-100">Préc</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded bg-gray-100">Suiv</button>
                </div>
              </div>
            </section>
          )}

          {/* SETTINGS SECTION */}
          {section === "settings" && (
            <section className="rounded-xl bg-white p-4 md:p-6 shadow border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Profil & Paramètres</h2>
                <div className="hidden md:flex gap-2">
                  <button onClick={() => setActiveTab("profil")} className={`px-3 py-1 rounded ${activeTab === "profil" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Profil</button>
                  <button onClick={() => setActiveTab("preferences")} className={`px-3 py-1 rounded ${activeTab === "preferences" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Préférences</button>
                  <button onClick={() => setActiveTab("securite")} className={`px-3 py-1 rounded ${activeTab === "securite" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Sécurité</button>
                  <button onClick={() => setActiveTab("role")} className={`px-3 py-1 rounded ${activeTab === "role" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Rôle</button>
                </div>
              </div>

              {/* mobile tab selector */}
              <div className="md:hidden mb-3 flex gap-2 overflow-x-auto">
                <button onClick={() => setActiveTab("profil")} className={`px-3 py-2 rounded ${activeTab === "profil" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Profil</button>
                <button onClick={() => setActiveTab("preferences")} className={`px-3 py-2 rounded ${activeTab === "preferences" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Préférences</button>
                <button onClick={() => setActiveTab("securite")} className={`px-3 py-2 rounded ${activeTab === "securite" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Sécurité</button>
                <button onClick={() => setActiveTab("role")} className={`px-3 py-2 rounded ${activeTab === "role" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Rôle</button>
              </div>

              {/* profile tab */}
              {activeTab === "profil" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Prénom</label>
                      {isEditing ? <input value={profile.prenom} onChange={(e) => handleProfileUpdate("prenom", e.target.value)} className="border rounded px-3 py-2 w-full" /> : <div className="text-gray-900">{profile.prenom}</div>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Nom</label>
                      {isEditing ? <input value={profile.nom} onChange={(e) => handleProfileUpdate("nom", e.target.value)} className="border rounded px-3 py-2 w-full" /> : <div className="text-gray-900">{profile.nom}</div>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                      {isEditing ? <input value={profile.email} onChange={(e) => handleProfileUpdate("email", e.target.value)} className="border rounded px-3 py-2 w-full" /> : <div className="text-gray-900">{profile.email}</div>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone</label>
                      {isEditing ? <input value={profile.telephone} onChange={(e) => handleProfileUpdate("telephone", e.target.value)} className="border rounded px-3 py-2 w-full" /> : <div className="text-gray-900">{profile.telephone}</div>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Licence Médicale</label>
                      {isEditing ? <input value={profile.licenceMedicale} onChange={(e) => handleProfileUpdate("licenceMedicale", e.target.value)} className="border rounded px-3 py-2 w-full" /> : <div className="text-gray-900">{profile.licenceMedicale}</div>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Spécialité</label>
                      {isEditing ? <select value={profile.specialite} onChange={(e) => handleProfileUpdate("specialite", e.target.value)} className="border rounded px-3 py-2 w-full">{SPECIALITES.map(s => <option key={s} value={s}>{s}</option>)}</select> : <div className="text-gray-900">{profile.specialite}</div>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Département</label>
                      {isEditing ? <select value={profile.departement} onChange={(e) => handleProfileUpdate("departement", e.target.value)} className="border rounded px-3 py-2 w-full">{DEPARTEMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select> : <div className="text-gray-900">{profile.departement}</div>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Date d'adhésion</label>
                      <div className="text-gray-900">{formatDate(profile.dateAdhesion)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={() => setIsEditing(e => !e)} className="px-4 py-2 rounded bg-blue-600 text-white">{isEditing ? "Annuler" : "Modifier le profil"}</button>
                    {isEditing && <button onClick={handleSaveProfile} className="px-4 py-2 rounded bg-green-600 text-white">{isSaving ? "Sauvegarde..." : "Sauvegarder"}</button>}
                  </div>
                </div>
              )}

              {/* preferences tab */}
              {activeTab === "preferences" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm mb-1">Langue</label>
                      <select value={profile.langue} onChange={(e) => handleProfileUpdate("langue", e.target.value)} className="border rounded px-3 py-2 w-full"><option value="fr">Français</option><option value="en">English</option></select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Thème</label>
                      <select value={theme} onChange={(e) => setTheme(e.target.value as any)} className="border rounded px-3 py-2 w-full"><option value="light">Clair</option><option value="dark">Sombre</option><option value="auto">Auto</option></select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Déconnexion auto (min)</label>
                      <select value={autoLogout} onChange={(e) => setAutoLogout(Number(e.target.value))} className="border rounded px-3 py-2 w-full"><option value={15}>15</option><option value={30}>30</option><option value={60}>60</option><option value={0}>Jamais</option></select>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold">Notifications</h4>
                    <div className="mt-2 space-y-2">
                      {Object.entries(profile.notifications).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="capitalize font-medium">{k}</div>
                            <div className="text-xs text-gray-500">Préférence</div>
                          </div>
                          <button onClick={() => handleNotificationToggle(k as any)} className={`relative inline-flex h-6 w-11 items-center rounded-full ${v ? 'bg-blue-600' : 'bg-gray-200'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white ${v ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* securite tab */}
              {activeTab === "securite" && (
                <div className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-sm mb-1">Mot de passe actuel</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="border rounded px-3 py-2 w-full" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Nouveau mot de passe</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="border rounded px-3 py-2 w-full" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Confirmer</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="border rounded px-3 py-2 w-full" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleChangePassword} className="px-4 py-2 rounded bg-blue-600 text-white">Modifier le mot de passe</button>
                  </div>

                  <div className="mt-3 p-3 bg-blue-50 rounded border flex items-center justify-between">
                    <div>
                      <div className="font-medium">Authentification à deux facteurs</div>
                      <div className="text-xs text-gray-500">Activer pour plus de sécurité</div>
                    </div>
                    <button onClick={() => setTwoFactorEnabled(t => !t)} className={`relative inline-flex h-6 w-11 items-center rounded-full ${twoFactorEnabled ? "bg-blue-600" : "bg-gray-200"}`}>
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transform ${twoFactorEnabled ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* role tab */}
              {activeTab === "role" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informations du Rôle</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 rounded border">
                      <div className="font-semibold">Rôle actuel</div>
                      <div className="text-sm">{profile.role}</div>
                    </div>
                    <div className="p-3 rounded border">
                      <div className="font-semibold">Département</div>
                      <div className="text-sm">{profile.departement}</div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <h4 className="font-semibold">Permissions (aperçu)</h4>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">Gestion des Rendez-vous</div>
                          <div className="text-xs text-gray-500">Visualiser / modifier RDV</div>
                        </div>
                        <div className="text-green-600 font-medium">Autorisé</div>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">Accès aux statistiques</div>
                          <div className="text-xs text-gray-500">Consulter rapports</div>
                        </div>
                        <div className={profile.role === "DIRECTION" ? "text-green-600 font-medium" : "text-gray-400 font-medium"}>{profile.role === "DIRECTION" ? "Autorisé" : "Restreint"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* ---------- Modals ---------- */}
      {showAddModal && <UserModal title="Ajouter Médecin" initial={null} onClose={() => setShowAddModal(false)} onSubmit={(p) => addUser(p)} />}
      {showEditModal && selected && <UserModal title="Modifier Médecin" initial={selected} onClose={() => { setShowEditModal(false); setSelected(null); }} onSubmit={(p) => updateUser(selected.id, p)} />}
      {showConfirmDelete.open && showConfirmDelete.user && <ConfirmDialog title="Archiver médecin" message={`Archiver ${showConfirmDelete.user.prenom} ${showConfirmDelete.user.nom} ?`} onCancel={() => setShowConfirmDelete({ open: false })} onConfirm={() => softDeleteUser(showConfirmDelete.user!.id)} />}

      {/* ---------- Mobile bottom action bar (sticky) ---------- */}
      <div className="fixed bottom-4 left-0 right-0 z-40 md:hidden flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto w-[90%] max-w-xl bg-white/95 backdrop-blur-sm border rounded-full px-3 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowAddModal(true)} className="rounded-full bg-blue-600 text-white p-3 shadow"><IconPlus /></button>
            <div className="text-sm">
              <div className="font-medium">Espace Direction</div>
              <div className="text-xs text-gray-500">Tap + pour ajouter médecin</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSection("admin")} className={`px-3 py-1 rounded ${section === "admin" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Admin</button>
            <button onClick={() => setSection("settings")} className={`px-3 py-1 rounded ${section === "settings" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>Param</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------- Subcomponents ---------------------- */


const UserModal: React.FC<{ title: string; initial: Partial<User> | null; onClose: () => void; onSubmit: (payload: Partial<User>) => void; }> = ({ title, initial, onClose, onSubmit }) => {
  const [prenom, setPrenom] = useState(initial?.prenom ?? "");
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [telephone, setTelephone] = useState(initial?.telephone ?? "");
  const [role, setRole] = useState<Role>((initial?.role ?? "MEDECIN") as Role);
  const [specialite, setSpecialite] = useState(initial?.specialite ?? "");
  const [departement, setDepartement] = useState(initial?.departement ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!prenom || !nom || !email) { alert("Prénom, nom et email sont obligatoires."); return; }
    setSaving(true);
    setTimeout(() => { onSubmit({ prenom, nom, email, telephone, role, specialite, departement }); setSaving(false); onClose(); }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 md:p-0">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 md:mx-4 md:my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500">Fermer</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} className="border rounded px-3 py-2" placeholder="Prénom" />
          <input value={nom} onChange={(e) => setNom(e.target.value)} className="border rounded px-3 py-2" placeholder="Nom" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded px-3 py-2" placeholder="Email" />
          <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="border rounded px-3 py-2" placeholder="Téléphone" />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="border rounded px-3 py-2">
            <option value="MEDECIN">Médecin</option>
            <option value="SECRETAIRE">Secrétaire</option>
            <option value="DIRECTION">Direction</option>
          </select>
          <input value={specialite} onChange={(e) => setSpecialite(e.target.value)} className="border rounded px-3 py-2" placeholder="Spécialité" />
          <input value={departement} onChange={(e) => setDepartement(e.target.value)} className="border rounded px-3 py-2" placeholder="Département" />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded border">Annuler</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white">{saving ? "Enregistrement..." : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
};

const ConfirmDialog: React.FC<{ title: string; message: string; onCancel: () => void; onConfirm: () => void; }> = ({ title, message, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-gray-600 mt-2">{message}</p>
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 rounded border">Annuler</button>
        <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white">Archiver</button>
      </div>
    </div>
  </div>
);

/* ---------------------- Export ---------------------- */
export default DirectionAdminPage;
