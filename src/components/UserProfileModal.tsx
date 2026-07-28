import React, { useState, useEffect } from 'react';
import { User, Client, Supplier, StockItem } from '../types';
import { 
  X, User as UserIcon, Lock, Shield, CheckCircle, AlertCircle, 
  Download, RefreshCw, Key, Mail, Building, Bell, LogOut, ChevronRight, Sparkles, Check, Users, UserCheck, Eye, EyeOff
} from 'lucide-react';

interface UserProfileModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  clients: Client[];
  suppliers: Supplier[];
  stockItems: StockItem[];
}

export default function UserProfileModal({
  currentUser,
  onClose,
  onUpdateUser,
  onLogout,
  clients,
  suppliers,
  stockItems
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'accounts' | 'actions'>('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState(currentUser.email);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Admin Account Management State
  const [selectedManagedRole, setSelectedManagedRole] = useState<'admin' | 'commercial' | 'gestionnaire_stock'>('commercial');
  const [managedFullName, setManagedFullName] = useState('');
  const [managedUsername, setManagedUsername] = useState('');
  const [managedEmail, setManagedEmail] = useState('');
  const [managedPassword, setManagedPassword] = useState('');
  const [showManagedPassword, setShowManagedPassword] = useState(false);

  // Status & Feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick Preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Default accounts reference
  const DEFAULT_ACCOUNTS = {
    admin: { username: 'admin', fullName: 'Farid Bouchaib', email: 'admin@carpole.dz', password: 'admin', label: 'Direction Générale (Admin)' },
    commercial: { username: 'commercial', fullName: 'Yacine Djebbar', email: 'commercial@carpole.dz', password: 'commercial', label: 'Commercial (Service Ventes)' },
    gestionnaire_stock: { username: 'stock', fullName: 'Karim Mansouri', email: 'stock@carpole.dz', password: 'stock', label: 'Gestionnaire de Stock' }
  };

  // Helper to load managed account state
  const loadManagedAccount = (role: 'admin' | 'commercial' | 'gestionnaire_stock') => {
    try {
      const storedCreds = JSON.parse(localStorage.getItem('carpole_custom_creds') || '{}');
      const accountCreds = storedCreds[role] || {};
      const defaultAcc = DEFAULT_ACCOUNTS[role];

      setManagedFullName(accountCreds.fullName || defaultAcc.fullName);
      setManagedUsername(accountCreds.username || defaultAcc.username);
      setManagedEmail(accountCreds.email || defaultAcc.email);
      setManagedPassword(accountCreds.password || defaultAcc.password);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadManagedAccount(selectedManagedRole);
  }, [selectedManagedRole]);

  // Save General Profile Info
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      setStatusMessage({ type: 'error', text: 'Le nom complet et l\'identifiant sont obligatoires.' });
      return;
    }

    const updated: User = {
      ...currentUser,
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim()
    };

    onUpdateUser(updated);
    
    // Save to custom credentials list in localStorage so login persists
    try {
      const storedCreds = JSON.parse(localStorage.getItem('carpole_custom_creds') || '{}');
      storedCreds[updated.role] = {
        ...(storedCreds[updated.role] || {}),
        username: updated.username,
        fullName: updated.fullName,
        email: updated.email
      };
      localStorage.setItem('carpole_custom_creds', JSON.stringify(storedCreds));
    } catch (err) {
      console.error(err);
    }

    setStatusMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Change Password
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!currentPassword) {
      setStatusMessage({ type: 'error', text: 'Veuillez saisir votre mot de passe actuel.' });
      return;
    }

    if (newPassword.length < 4) {
      setStatusMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 4 caractères.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'La confirmation du mot de passe ne correspond pas.' });
      return;
    }

    // Save new password to localStorage for login authentication
    try {
      const storedCreds = JSON.parse(localStorage.getItem('carpole_custom_creds') || '{}');
      storedCreds[currentUser.role] = {
        ...(storedCreds[currentUser.role] || {}),
        password: newPassword
      };
      localStorage.setItem('carpole_custom_creds', JSON.stringify(storedCreds));
    } catch (err) {
      console.error(err);
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setStatusMessage({ type: 'success', text: 'Votre mot de passe a été modifié avec succès ! Utilise ce nouveau mot de passe lors de vos prochaines connexions.' });
    setTimeout(() => setStatusMessage(null), 4500);
  };

  // Admin Save Managed Account
  const handleSaveManagedAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!managedFullName.trim() || !managedUsername.trim()) {
      setStatusMessage({ type: 'error', text: 'Le nom complet et l\'identifiant sont obligatoires.' });
      return;
    }

    try {
      const storedCreds = JSON.parse(localStorage.getItem('carpole_custom_creds') || '{}');
      storedCreds[selectedManagedRole] = {
        fullName: managedFullName.trim(),
        username: managedUsername.trim().toLowerCase(),
        email: managedEmail.trim(),
        password: managedPassword || DEFAULT_ACCOUNTS[selectedManagedRole].password
      };
      localStorage.setItem('carpole_custom_creds', JSON.stringify(storedCreds));

      // If updating current logged in user, update current user state too
      if (selectedManagedRole === currentUser.role) {
        onUpdateUser({
          ...currentUser,
          fullName: managedFullName.trim(),
          username: managedUsername.trim().toLowerCase(),
          email: managedEmail.trim()
        });
      }

      setStatusMessage({
        type: 'success',
        text: `Le compte ${DEFAULT_ACCOUNTS[selectedManagedRole].label} a été mis à jour avec succès ! Le nouveau mot de passe est maintenant actif.`
      });
      setTimeout(() => setStatusMessage(null), 4500);
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement des identifiants.' });
    }
  };

  // Role Toggle Simulation
  const handleToggleRole = () => {
    const roles: ('admin' | 'commercial' | 'gestionnaire_stock')[] = ['admin', 'commercial', 'gestionnaire_stock'];
    const nextIndex = (roles.indexOf(currentUser.role) + 1) % roles.length;
    const newRole = roles[nextIndex];
    const roleNames = {
      admin: 'Farid Bouchaib',
      commercial: 'Yacine Djebbar',
      gestionnaire_stock: 'Karim Mansouri'
    };
    const updated: User = {
      ...currentUser,
      role: newRole,
      fullName: roleNames[newRole],
      email: `${newRole}@carpole.dz`
    };
    onUpdateUser(updated);
    setStatusMessage({ 
      type: 'success', 
      text: `Rôle basculé avec succès en Mode ${
        newRole === 'admin' ? 'Direction (Admin)' : newRole === 'gestionnaire_stock' ? 'Gestionnaire de Stock' : 'Commercial'
      }.` 
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Export Database JSON Backup
  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      currentUser,
      clientsCount: clients.length,
      suppliersCount: suppliers.length,
      stockItemsCount: stockItems.length,
      clients,
      suppliers,
      stockItems
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `CARPOLE_INDUSTRIEL_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setStatusMessage({ type: 'success', text: 'Sauvegarde complète de la base de données téléchargée !' });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] text-left">
        
        {/* Header Banner */}
        <div className="bg-slate-900 p-6 text-white relative flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shadow-inner border border-white/20 ${
              currentUser.role === 'admin' 
                ? 'bg-amber-500 text-slate-950' 
                : currentUser.role === 'gestionnaire_stock'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-cyan-500 text-slate-950'
            }`}>
              {currentUser.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{currentUser.fullName}</h2>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${
                  currentUser.role === 'admin'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : currentUser.role === 'gestionnaire_stock'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}>
                  {currentUser.role === 'admin' ? 'Direction (Admin)' : currentUser.role === 'gestionnaire_stock' ? 'Gestionnaire de Stock' : 'Commercial'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">{currentUser.email}</p>
              <p className="text-[10px] text-amber-400/90 font-bold mt-0.5 flex items-center gap-1">
                <Building className="w-3 h-3 text-amber-400" /> CARPÔLE INDUSTRIEL • ISOTHERME & FROID ALGERIA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('profile'); setStatusMessage(null); }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-t border-x whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 border-slate-200 border-b-transparent -mb-px font-black shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <UserIcon className="w-4 h-4 text-amber-500" />
            Mon Profil
          </button>

          <button
            onClick={() => { setActiveTab('password'); setStatusMessage(null); }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-t border-x whitespace-nowrap ${
              activeTab === 'password'
                ? 'bg-white text-slate-900 border-slate-200 border-b-transparent -mb-px font-black shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <Key className="w-4 h-4 text-amber-500" />
            Mon Mot de passe
          </button>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => { 
                setActiveTab('accounts'); 
                setStatusMessage(null); 
                loadManagedAccount(selectedManagedRole); 
              }}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-t border-x whitespace-nowrap ${
                activeTab === 'accounts'
                  ? 'bg-white text-slate-900 border-slate-200 border-b-transparent -mb-px font-black shadow-2xs'
                  : 'text-amber-700 font-extrabold hover:text-slate-900 border-transparent hover:bg-slate-200/50'
              }`}
            >
              <Users className="w-4 h-4 text-amber-500" />
              Gestion des Comptes & Mots de Passe (Admin)
            </button>
          )}

          <button
            onClick={() => { setActiveTab('actions'); setStatusMessage(null); }}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-t border-x whitespace-nowrap ${
              activeTab === 'actions'
                ? 'bg-white text-slate-900 border-slate-200 border-b-transparent -mb-px font-black shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-200/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Actions & Outils
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Status Alert Banner */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-start gap-2.5 animate-in fade-in duration-150 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: Profile Information */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="bg-amber-50/60 border border-amber-200/60 p-3.5 rounded-xl text-xs text-slate-700">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-600" />
                  Identifiants de Session Utilisateur
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Vous pouvez mettre à jour le Nom Complet affiché dans le portail ainsi que votre Identifiant de connexion.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Nom & Prénom Completes *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Farid Bouchaib"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Identifiant de Connexion *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ex: admin"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Adresse Email Professionnelle
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: admin@carpole.dz"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Enregistrer les modifications du Profil
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Password Change */}
          {activeTab === 'password' && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-700">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-500" />
                  Modification du Mot de Passe
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Changez votre mot de passe d'accès au portail. La mise à jour est immédiate pour vos prochaines sessions.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Mot de passe actuel *
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Saisissez votre mot de passe actuel"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Nouveau mot de passe *
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 4 caractères"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Confirmer le nouveau mot de passe *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Répétez le nouveau mot de passe"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Mettre à jour le Mot de Passe
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ADMIN ACCOUNTS MANAGEMENT */}
          {activeTab === 'accounts' && currentUser.role === 'admin' && (
            <div className="space-y-5">
              <div className="bg-amber-500/10 border border-amber-300 p-4 rounded-xl text-xs text-slate-800">
                <p className="font-extrabold text-amber-950 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  Gestion de la Sécurité & Mots de Passe Utilisateurs
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  En tant qu'administrateur, vous pouvez consulter, modifier les informations et réinitialiser directement le mot de passe de tous les autres comptes d'accès au système.
                </p>
              </div>

              {/* Role selector sub-tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setSelectedManagedRole('commercial'); loadManagedAccount('commercial'); setStatusMessage(null); }}
                  className={`px-3 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedManagedRole === 'commercial'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-250'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Commercial</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedManagedRole('gestionnaire_stock'); loadManagedAccount('gestionnaire_stock'); setStatusMessage(null); }}
                  className={`px-3 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedManagedRole === 'gestionnaire_stock'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-250'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Gestionnaire Stock</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedManagedRole('admin'); loadManagedAccount('admin'); setStatusMessage(null); }}
                  className={`px-3 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedManagedRole === 'admin'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-250'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin / Direction</span>
                </button>
              </div>

              {/* Form to update selected account */}
              <form onSubmit={handleSaveManagedAccount} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-500" />
                    Modification : {DEFAULT_ACCOUNTS[selectedManagedRole].label}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-250">
                    ID Rôle: {selectedManagedRole}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Nom & Prénom de l'utilisateur *
                    </label>
                    <input
                      type="text"
                      required
                      value={managedFullName}
                      onChange={(e) => setManagedFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-900 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Identifiant de connexion (Username) *
                    </label>
                    <input
                      type="text"
                      required
                      value={managedUsername}
                      onChange={(e) => setManagedUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Adresse Email
                    </label>
                    <input
                      type="email"
                      value={managedEmail}
                      onChange={(e) => setManagedEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-900 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block text-amber-900">
                      Mot de passe d'accès (Définir ou modifier) *
                    </label>
                    <div className="relative">
                      <input
                        type={showManagedPassword ? 'text' : 'password'}
                        required
                        value={managedPassword}
                        onChange={(e) => setManagedPassword(e.target.value)}
                        placeholder="Nouveau mot de passe"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-slate-900 text-xs font-mono font-black focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowManagedPassword(!showManagedPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                      >
                        {showManagedPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Ce mot de passe permettra à l'utilisateur de se connecter immédiatement avec ces nouveaux identifiants.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Enregistrer les identifiants du compte
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Useful Buttons & Actions */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Outils d'Administration & Actions Rapides
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Action 1: Switch Demo Role */}
                <button
                  type="button"
                  onClick={handleToggleRole}
                  className="p-4 bg-slate-50 border border-slate-200 hover:border-amber-500/50 hover:bg-amber-50/30 rounded-xl text-left transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      Simulation
                    </span>
                  </div>
                  <div className="mt-3">
                    <h4 className="text-xs font-black text-slate-800 group-hover:text-amber-600 transition-colors">
                      Bascule de Rôle Utilisateur
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Passez du mode {currentUser.role === 'admin' ? 'Direction (Admin)' : 'Commercial'} vers {currentUser.role === 'admin' ? 'Commercial' : 'Direction (Admin)'} pour tester les autorisations.
                    </p>
                  </div>
                </button>

                {/* Action 2: Backup Data */}
                <button
                  type="button"
                  onClick={handleExportData}
                  className="p-4 bg-slate-50 border border-slate-200 hover:border-amber-500/50 hover:bg-amber-50/30 rounded-xl text-left transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <Download className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Backup JSON
                    </span>
                  </div>
                  <div className="mt-3">
                    <h4 className="text-xs font-black text-slate-800 group-hover:text-emerald-700 transition-colors">
                      Sauvegarder la Base de Données
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Téléchargez un fichier JSON sécurisé contenant tous vos clients, achats fournisseurs et articles de stock.
                    </p>
                  </div>
                </button>

                {/* Action 3: Preferences / Notifications Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsEnabled(!notificationsEnabled);
                    setStatusMessage({
                      type: 'success',
                      text: notificationsEnabled ? 'Alertes visuelles de stock désactivées.' : 'Alertes visuelles de stock activées.'
                    });
                    setTimeout(() => setStatusMessage(null), 3000);
                  }}
                  className="p-4 bg-slate-50 border border-slate-200 hover:border-amber-500/50 hover:bg-amber-50/30 rounded-xl text-left transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <Bell className="w-4 h-4" />
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      notificationsEnabled ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {notificationsEnabled ? 'Activé' : 'Désactivé'}
                    </span>
                  </div>
                  <div className="mt-3">
                    <h4 className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                      Alertes & Notifications de Stock
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Affiche des bannière d'alerte rouge immédiates lorsque le stock passe en-dessous du seuil minimal.
                    </p>
                  </div>
                </button>

                {/* Action 4: Logout / Lock session */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-4 bg-red-50/60 border border-red-200/60 hover:border-red-400 hover:bg-red-100/40 rounded-xl text-left transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-600 group-hover:bg-red-500 group-hover:text-white transition-colors">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-200/80 text-red-900">
                      Déconnexion
                    </span>
                  </div>
                  <div className="mt-3">
                    <h4 className="text-xs font-black text-red-900 transition-colors">
                      Verrouiller & Se Déconnecter
                    </h4>
                    <p className="text-[10px] text-red-700/80 mt-0.5">
                      Ferme votre session courante en toute sécurité et retourne à l'écran de connexion.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex justify-between items-center text-[10px] text-slate-400">
          <span>Connecté en tant que <strong className="text-slate-700">{currentUser.fullName}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
