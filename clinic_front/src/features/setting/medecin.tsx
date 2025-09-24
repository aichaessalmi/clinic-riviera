import React, { useState } from "react";

/** Types */
type UserProfile = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: "SECRETAIRE" | "DIRECTION" | "MEDECIN";
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

/** Données mock */
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
  photo: null,
  langue: "fr",
  notifications: {
    email: true,
    sms: false,
    whatsapp: true,
    rappels: true,
    nouvelles: true,
  },
};

const SPECIALITES = [
  "Cardiologie",
  "Dermatologie",
  "Gastro-entérologie",
  "Neurologie",
  "Pédiatrie",
  "Radiologie",
  "Chirurgie",
  "Médecine Interne",
  "Urgences",
  "Gynécologie",
  "Ophtalmologie"
];

const DEPARTEMENTS = [
  "Médecine Interne",
  "Chirurgie",
  "Pédiatrie",
  "Urgences",
  "Radiologie",
  "Laboratoire",
  "Administration"
];

/** Composant principal Settings */
const ProfessionalSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profil" | "preferences" | "securite" | "role">("profil");
  const [profile, setProfile] = useState<UserProfile>(CURRENT_USER);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // États pour la sécurité
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // États pour les préférences
  const [autoLogout, setAutoLogout] = useState(30);
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("light");

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
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    setIsEditing(false);
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
    await new Promise(resolve => setTimeout(resolve, 1500));
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsSaving(false);
    alert("Mot de passe modifié avec succès");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const exportData = () => {
    const data = {
      profile: profile,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile_${profile.prenom}_${profile.nom}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Rendu de l'onglet Préférences
  const renderPreferencesTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          Paramètres de Langue et Affichage
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Langue de l'interface
            </label>
            <select
              value={profile.langue}
              onChange={(e) => handleProfileUpdate("langue", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Thème d'affichage
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
              <option value="auto">Automatique</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Déconnexion automatique (minutes)
            </label>
            <select
              value={autoLogout}
              onChange={(e) => setAutoLogout(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 heure</option>
              <option value={120}>2 heures</option>
              <option value={0}>Jamais</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          Préférences de Notification
        </h3>
        
        <div className="space-y-4">
          {Object.entries(profile.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-700 capitalize">
                  {key === 'email' && 'Notifications par email'}
                  {key === 'sms' && 'Notifications par SMS'}
                  {key === 'whatsapp' && 'Notifications WhatsApp'}
                  {key === 'rappels' && 'Rappels automatiques'}
                  {key === 'nouvelles' && 'Nouvelles de la clinique'}
                </span>
                <p className="text-sm text-gray-500">
                  {key === 'email' && 'Recevoir les notifications importantes par email'}
                  {key === 'sms' && 'Recevoir les alertes urgentes par SMS'}
                  {key === 'whatsapp' && 'Recevoir les confirmations sur WhatsApp'}
                  {key === 'rappels' && 'Rappels automatiques des rendez-vous'}
                  {key === 'nouvelles' && 'Actualités et nouvelles de la clinique'}
                </p>
              </div>
              <button
                onClick={() => handleNotificationToggle(key as keyof UserProfile['notifications'])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-4 border-t border-gray-200 pt-6">
        <button
          onClick={() => setProfile(CURRENT_USER)}
          className="rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Réinitialiser
        </button>
        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? "Sauvegarde..." : "Sauvegarder les préférences"}
        </button>
      </div>
    </div>
  );

  // Rendu de l'onglet Sécurité
  const renderSecurityTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          Modification du Mot de Passe
        </h3>
        
        <div className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Entrez votre mot de passe actuel"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Au moins 8 caractères"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Répétez le nouveau mot de passe"
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          Authentification à Deux Facteurs
        </h3>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-700">Vérification en deux étapes</span>
            <p className="text-sm text-gray-500">
              Ajoutez une couche de sécurité supplémentaire à votre compte
            </p>
          </div>
          <button
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {twoFactorEnabled && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              L'authentification à deux facteurs est maintenant activée. Vous recevrez un code de vérification sur votre téléphone.
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          Sessions Actives
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="font-medium text-gray-700">Session actuelle</span>
              <p className="text-sm text-gray-500">Casablanca, Maroc • Chrome sur Windows</p>
              <p className="text-sm text-gray-500">Connecté depuis aujourd'hui à 09:23</p>
            </div>
            <button className="text-red-600 text-sm font-medium hover:text-red-700">
              Déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Rendu de l'onglet Rôle
  const renderRoleTab = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          Informations du Rôle
        </h3>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Rôle Actuel</h4>
            <p className="text-blue-700 capitalize">
              {profile.role === "MEDECIN" ? "Médecin Référent" : 
               profile.role === "SECRETAIRE" ? "Secrétaire Médicale" : "Direction"}
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">Département</h4>
            <p className="text-green-700">{profile.departement}</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-2">Spécialité</h4>
            <p className="text-purple-700">{profile.specialite}</p>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-2">Date d'Adhésion</h4>
            <p className="text-orange-700">{formatDate(profile.dateAdhesion)}</p>
          </div>
        </div>
      </div>

      {profile.role === "MEDECIN" && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
            Statistiques de Référencement
          </h3>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-blue-600">24</div>
              <div className="text-sm text-gray-600">Patients Référés ce Mois</div>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-green-600">18</div>
              <div className="text-sm text-gray-600">Rendez-vous Confirmés</div>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-purple-600">92%</div>
              <div className="text-sm text-gray-600">Taux de Satisfaction</div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
          Permissions d'Accès
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="font-medium text-gray-700">Gestion des Rendez-vous</span>
              <p className="text-sm text-gray-500">Visualiser et modifier les rendez-vous patients</p>
            </div>
            <div className="text-green-600 font-medium">Autorisé</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="font-medium text-gray-700">Référencement Patients</span>
              <p className="text-sm text-gray-500">Saisir de nouveaux patients référés</p>
            </div>
            <div className="text-green-600 font-medium">Autorisé</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="font-medium text-gray-700">Accès aux Statistiques</span>
              <p className="text-sm text-gray-500">Consulter les données de performance</p>
            </div>
            <div className={profile.role === "DIRECTION" ? "text-green-600 font-medium" : "text-gray-400 font-medium"}>
              {profile.role === "DIRECTION" ? "Autorisé" : "Restreint"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profil & Paramètres</h1>
          <p className="mt-2 text-lg text-gray-600">
            Gérez vos informations personnelles et préférences système
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Carte profil */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    {photoPreview ? (
                      <img 
                        src={photoPreview} 
                        alt="Profile" 
                        className="h-24 w-24 rounded-full object-cover"
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
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  )}
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900">{profile.prenom} {profile.nom}</h2>
                <p className="text-blue-600 font-medium capitalize">
                  {profile.role === "MEDECIN" ? "Médecin" : profile.role === "SECRETAIRE" ? "Secrétaire" : "Direction"}
                </p>
                <p className="text-sm text-gray-500 mt-1">Membre depuis {formatDate(profile.dateAdhesion)}</p>
              </div>

              {isEditing && photoPreview && activeTab === "profil" && (
                <button
                  onClick={handleRemovePhoto}
                  className="w-full mt-3 rounded-lg bg-red-50 text-red-600 py-2 text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  Supprimer la photo
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
                  <span className="font-medium">Profil</span>
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
                  <span className="font-medium">Préférences</span>
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
                  <span className="font-medium">Sécurité</span>
                </button>

                <button
                  onClick={() => setActiveTab("role")}
                  className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    activeTab === "role" 
                    ? "bg-blue-50 text-blue-700 border border-blue-200" 
                    : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <BadgeIcon />
                  <span className="font-medium">Paramètres de Rôle</span>
                </button>
              </nav>

              {/* Actions Rapides */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions Rapides</h3>
                <button
                  onClick={exportData}
                  className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <DownloadIcon />
                  <span className="font-medium">Exporter Données</span>
                </button>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            {/* Onglet Profil */}
            {activeTab === "profil" && (
              <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Informations Personnelles</h2>
                    <p className="text-gray-600 mt-1">Gérez vos informations de contact et votre profil professionnel</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    {isEditing ? "Annuler" : "Modifier le profil"}
                  </button>
                </div>

                {/* Photo de profil */}
                {isEditing && (
                  <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Photo de Profil</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Téléchargez une photo professionnelle. JPG, PNG ou GIF. Taille max. 5MB.
                    </p>
                    <div className="flex items-center space-x-4">
                      <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <span>Télécharger une photo</span>
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
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {/* Informations Personnelles */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                      Informations Personnelles
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Prénom *
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profile.prenom}
                            onChange={(e) => handleProfileUpdate("prenom", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.prenom}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nom *
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profile.nom}
                            onChange={(e) => handleProfileUpdate("nom", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.nom}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Adresse Email *
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
                              Cet email sera utilisé pour les notifications et la connexion
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Numéro de Téléphone *
                        </label>
                        {isEditing ? (
                          <>
                            <input
                              type="tel"
                              value={profile.telephone}
                              onChange={(e) => handleProfileUpdate("telephone", e.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="+212 6 12 34 56 78"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Format de numéro marocain
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.telephone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informations Professionnelles */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                      Informations Professionnelles
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Numéro de Licence Médicale *
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profile.licenceMedicale}
                            onChange={(e) => handleProfileUpdate("licenceMedicale", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="MD-2019-0456"
                          />
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.licenceMedicale}</p>
                        )}
                        {isEditing && (
                          <p className="text-sm text-gray-500 mt-1">
                            Votre numéro de licence médicale officiel
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Spécialité *
                        </label>
                        {isEditing ? (
                          <select
                            value={profile.specialite}
                            onChange={(e) => handleProfileUpdate("specialite", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {SPECIALITES.map(spec => (
                              <option key={spec} value={spec}>{spec}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.specialite}</p>
                        )}
                        {isEditing && (
                          <p className="text-sm text-gray-500 mt-1">
                            Votre spécialité médicale ou département
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Département *
                        </label>
                        {isEditing ? (
                          <select
                            value={profile.departement}
                            onChange={(e) => handleProfileUpdate("departement", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {DEPARTEMENTS.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.departement}</p>
                        )}
                        {isEditing && (
                          <p className="text-sm text-gray-500 mt-1">
                            Votre département actuel
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Date d'Adhésion
                        </label>
                        <p className="text-gray-900 text-lg">{formatDate(profile.dateAdhesion)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-8 flex justify-end space-x-4 border-t border-gray-200 pt-6">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? (
                        <span className="flex items-center space-x-2">
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Sauvegarde en cours...</span>
                        </span>
                      ) : (
                        "Sauvegarder les modifications"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Onglet Préférences */}
            {activeTab === "preferences" && (
              <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Préférences Utilisateur</h2>
                    <p className="text-gray-600 mt-1">Personnalisez votre expérience et vos notifications</p>
                  </div>
                </div>
                {renderPreferencesTab()}
              </div>
            )}

            {/* Onglet Sécurité */}
            {activeTab === "securite" && (
              <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Sécurité du Compte</h2>
                    <p className="text-gray-600 mt-1">Protégez votre compte et gérez vos sessions</p>
                  </div>
                </div>
                {renderSecurityTab()}
              </div>
            )}

            {/* Onglet Rôle */}
            {activeTab === "role" && (
              <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Paramètres de Rôle</h2>
                    <p className="text-gray-600 mt-1">Informations et permissions liées à votre rôle</p>
                  </div>
                </div>
                {renderRoleTab()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Icônes (inchangées) */
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

export default ProfessionalSettingsPage;