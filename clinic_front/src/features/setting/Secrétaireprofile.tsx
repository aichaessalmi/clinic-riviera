import React, { useState } from "react";

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
  poste: string; // poste / extension
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

/** Données mock (secrétaire) */
const CURRENT_USER: UserProfile = {
  id: 2,
  nom: "El Amrani",
  prenom: "Sara",
  email: "sara.elamrani@cliniqueriviera.ma",
  telephone: "+212 6 11 22 33 44",
  role: "SECRETAIRE",
  specialite: null,
  departement: "Accueil & RDV",
  poste: "Standard: 102",
  dateAdhesion: "2020-06-10",
  photo: null,
  langue: "fr",
  notifications: {
    email: true,
    sms: true,
    whatsapp: true,
    rappels: true,
    nouvelles: false,
  },
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

/** Composant principal Secretary */
const SecretarySettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profil" | "preferences" | "securite" | "actions">("profil");
  const [profile, setProfile] = useState<UserProfile>(CURRENT_USER);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Préférences spécifiques
  const [shift, setShift] = useState<string>(WORK_SHIFTS[0]);
  const [autoConfirmRdv, setAutoConfirmRdv] = useState<boolean>(false);
  const [whatsApiEnabled, setWhatsApiEnabled] = useState<boolean>(true);

  // États pour sécurité (simplifié)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleProfileUpdate = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (type: keyof UserProfile['notifications']) => {
    setProfile(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("La taille du fichier ne doit pas dépasser 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // mock save
    await new Promise(resolve => setTimeout(resolve, 900));
    setIsSaving(false);
    setIsEditing(false);
    alert("Profil mis à jour (mock).");
  };

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
    await new Promise(resolve => setTimeout(resolve, 900));
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsSaving(false);
    alert("Mot de passe modifié avec succès (mock).");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Actions rapides spécifiques secrétariat (mock)
  const handleViewPendingAppointments = () => {
    // mock: afficher un message ou ouvrir modal (ici simple alert)
    alert("Il y a 7 rendez-vous en attente aujourd'hui (mock).");
  };

  const handleSendWhatsAppReminders = async () => {
    if (!whatsApiEnabled) {
      alert("La fonctionnalité WhatsApp est désactivée.");
      return;
    }
    setIsSaving(true);
    // mock send
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsSaving(false);
    alert("Rappels WhatsApp envoyés (mock).");
  };

  const exportData = () => {
    const data = { profile, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secretaire_${profile.prenom}_${profile.nom}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render Preferences (secrétaire)
  const renderPreferencesTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          Horaires & Poste
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Plage de travail</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {WORK_SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <p className="text-sm text-gray-500 mt-1">Heures affichées dans l'agenda partagé</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Poste / Extension</label>
            <input
              type="text"
              value={profile.poste}
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
            <span className="text-sm font-medium text-gray-700">Confirmer automatiquement les RDV simples</span>
          </label>
          <p className="text-sm text-gray-500 mt-1">Si activé, les RDV sans conflit seront confirmés automatiquement.</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          Intégration WhatsApp & Notifications
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-700">API WhatsApp activée</span>
              <p className="text-sm text-gray-500">Envoyer des rappels et confirmations via WhatsApp</p>
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
              <span className="font-medium text-gray-700">Rappels automatiques</span>
              <p className="text-sm text-gray-500">Envoyer un rappel 24h avant le RDV</p>
            </div>
            <button
              onClick={() => handleNotificationToggle("rappels")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profile.notifications.rappels ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.notifications.rappels ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 border-t border-gray-200 pt-6">
        <button
          onClick={() => setProfile(CURRENT_USER)}
          className="rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Réinitialiser
        </button>
        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? "Sauvegarde..." : "Sauvegarder les préférences"}
        </button>
      </div>
    </div>
  );

  // Render Security (simplifié)
  const renderSecurityTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Modifier le mot de passe</h3>
        <div className="space-y-4 max-w-md">
          <input type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} placeholder="Mot de passe actuel" className="w-full rounded-lg border border-gray-300 px-4 py-3"/>
          <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} placeholder="Nouveau mot de passe" className="w-full rounded-lg border border-gray-300 px-4 py-3"/>
          <input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} placeholder="Confirmer" className="w-full rounded-lg border border-gray-300 px-4 py-3"/>
          <button onClick={handleChangePassword} disabled={isSaving || !currentPassword || !newPassword || !confirmPassword} className="rounded-lg bg-blue-600 px-6 py-2.5 text-white">
            {isSaving ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Sessions actives</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <span className="font-medium text-gray-700">Session actuelle</span>
            <p className="text-sm text-gray-500">Casablanca, Maroc • Chrome sur Windows</p>
            <p className="text-sm text-gray-500">Connecté depuis aujourd'hui à 09:23</p>
          </div>
          <button className="text-red-600 text-sm font-medium">Déconnecter</button>
        </div>
      </div>
    </div>
  );

  // Render Actions (secrétaire)
  const renderActionsTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Actions Rapides</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm text-center">
            <div className="text-2xl font-bold">7</div>
            <div className="text-sm text-gray-500">RDV en attente</div>
            <button onClick={handleViewPendingAppointments} className="mt-3 text-sm text-blue-600">Voir</button>
          </div>

          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm text-center">
            <div className="text-2xl font-bold">—</div>
            <div className="text-sm text-gray-500">Rappels WhatsApp</div>
            <button onClick={handleSendWhatsAppReminders} disabled={isSaving} className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-white text-sm disabled:opacity-50">
              {isSaving ? "Envoi..." : "Envoyer les rappels"}
            </button>
          </div>

          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm text-center">
            <div className="text-2xl font-bold">Export</div>
            <div className="text-sm text-gray-500">Données secrétariat</div>
            <button onClick={exportData} className="mt-3 text-sm text-blue-600">Exporter</button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Outils</h3>
        <div className="space-y-3">
          <button onClick={()=>alert("Accès calendrier (mock)") } className="w-full text-left p-4 bg-gray-50 rounded-lg border">
            Ouvrir le calendrier partagé
          </button>
          <button onClick={()=>alert("Créer un rappel / note (mock)") } className="w-full text-left p-4 bg-gray-50 rounded-lg border">
            Créer une note interne
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Espace Secrétaire</h1>
          <p className="mt-2 text-lg text-gray-600">Gérez les rendez-vous, rappels et paramètres du secrétariat.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="h-24 w-24 rounded-full object-cover" />
                    ) : (
                      `${profile.prenom[0]}${profile.nom[0]}`
                    )}
                  </div>
                  {isEditing && activeTab === "profil" && (
                    <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input type="file" className="hidden" accept="image/jpeg,image/png,image/gif" onChange={handlePhotoUpload} />
                    </label>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{profile.prenom} {profile.nom}</h2>
                <p className="text-blue-600 font-medium">Secrétaire</p>
                <p className="text-sm text-gray-500 mt-1">Membre depuis {formatDate(profile.dateAdhesion)}</p>
              </div>

              {isEditing && photoPreview && (
                <button onClick={handleRemovePhoto} className="w-full mt-3 rounded-lg bg-red-50 text-red-600 py-2 text-sm font-medium">
                  Supprimer la photo
                </button>
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <nav className="space-y-2">
                <button onClick={()=>setActiveTab("profil")} className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left ${activeTab==="profil" ? "bg-blue-50 text-blue-700 border border-blue-200": "text-gray-600 hover:bg-gray-50"}`}>
                  <UserIcon /><span className="font-medium">Profil</span>
                </button>
                <button onClick={()=>setActiveTab("preferences")} className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left ${activeTab==="preferences" ? "bg-blue-50 text-blue-700 border border-blue-200": "text-gray-600 hover:bg-gray-50"}`}>
                  <SettingsIcon/><span className="font-medium">Préférences</span>
                </button>
                <button onClick={()=>setActiveTab("securite")} className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left ${activeTab==="securite" ? "bg-blue-50 text-blue-700 border border-blue-200": "text-gray-600 hover:bg-gray-50"}`}>
                  <ShieldIcon/><span className="font-medium">Sécurité</span>
                </button>
                <button onClick={()=>setActiveTab("actions")} className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left ${activeTab==="actions" ? "bg-blue-50 text-blue-700 border border-blue-200": "text-gray-600 hover:bg-gray-50"}`}>
                  <BadgeIcon/><span className="font-medium">Actions Rapides</span>
                </button>
              </nav>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Raccourcis</h3>
                <button onClick={handleViewPendingAppointments} className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50">
                  <DownloadIcon/>
                  <span className="font-medium">Voir RDV en attente</span>
                </button>
                <button onClick={handleSendWhatsAppReminders} disabled={!whatsApiEnabled || isSaving} className="mt-3 flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50">
                  <WhatsAppIcon/>
                  <span className="font-medium">Envoyer rappels WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {/* Profil */}
            {activeTab === "profil" && (
              <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Informations Personnelles</h2>
                    <p className="text-gray-600 mt-1">Détails de contact et paramétrage du secrétariat</p>
                  </div>
                  <button onClick={()=>setIsEditing(!isEditing)} className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white">
                    {isEditing ? "Annuler" : "Modifier le profil"}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b">Infos personnelles</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom *</label>
                        {isEditing ? <input type="text" value={profile.prenom} onChange={(e)=>handleProfileUpdate("prenom", e.target.value)} className="w-full rounded-lg border px-4 py-3" /> : <p className="text-lg text-gray-900">{profile.prenom}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nom *</label>
                        {isEditing ? <input type="text" value={profile.nom} onChange={(e)=>handleProfileUpdate("nom", e.target.value)} className="w-full rounded-lg border px-4 py-3" /> : <p className="text-lg text-gray-900">{profile.nom}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                        {isEditing ? <input type="email" value={profile.email} onChange={(e)=>handleProfileUpdate("email", e.target.value)} className="w-full rounded-lg border px-4 py-3" /> : <p className="text-lg text-gray-900">{profile.email}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone *</label>
                        {isEditing ? <input type="tel" value={profile.telephone} onChange={(e)=>handleProfileUpdate("telephone", e.target.value)} className="w-full rounded-lg border px-4 py-3" /> : <p className="text-lg text-gray-900">{profile.telephone}</p>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b">Paramètres du secrétariat</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Département</label>
                        {isEditing ? (
                          <select value={profile.departement} onChange={(e)=>handleProfileUpdate("departement", e.target.value)} className="w-full rounded-lg border px-4 py-3">
                            {DEPARTEMENTS.map(d=> <option key={d} value={d}>{d}</option>)}
                          </select>
                        ) : <p className="text-lg text-gray-900">{profile.departement}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Poste / Extension</label>
                        {isEditing ? <input type="text" value={profile.poste} onChange={(e)=>handleProfileUpdate("poste", e.target.value)} className="w-full rounded-lg border px-4 py-3" /> : <p className="text-lg text-gray-900">{profile.poste}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Langue</label>
                        <select value={profile.langue} onChange={(e)=>handleProfileUpdate("langue", e.target.value)} className="w-full rounded-lg border px-4 py-3">
                          <option value="fr">Français</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date d'adhésion</label>
                        <p className="text-lg text-gray-900">{formatDate(profile.dateAdhesion)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-8 flex justify-end space-x-4 border-t border-gray-200 pt-6">
                    <button onClick={()=>setIsEditing(false)} className="rounded-lg bg-gray-100 px-6 py-2.5">Annuler</button>
                    <button onClick={handleSaveProfile} disabled={isSaving} className="rounded-lg bg-blue-600 px-6 py-2.5 text-white">
                      {isSaving ? "Sauvegarde..." : "Sauvegarder les modifications"}
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
                    <h2 className="text-2xl font-bold text-gray-900">Préférences Secrétariat</h2>
                    <p className="text-gray-600 mt-1">Gérer horaires, notifications et intégrations</p>
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
                    <h2 className="text-2xl font-bold text-gray-900">Sécurité du Compte</h2>
                    <p className="text-gray-600 mt-1">Modifier mot de passe et gérer sessions</p>
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
                    <h2 className="text-2xl font-bold text-gray-900">Actions Rapides</h2>
                    <p className="text-gray-600 mt-1">Accès aux outils du secrétariat</p>
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

/** Icônes (simples) */
const UserIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const SettingsIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
