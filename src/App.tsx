/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, Supplier, AttachedFile, User, StockItem } from './types';
import { 
  getClients, saveClient, deleteClient, 
  getSuppliers, saveSupplier, deleteSupplier,
  getStockItems, saveStockItem, deleteStockItem
} from './lib/db';
import { SEED_CLIENTS, SEED_SUPPLIERS, SEED_STOCK } from './lib/seedData';
import DashboardStats from './components/DashboardStats';
import ClientSection from './components/ClientSection';
import SupplierSection from './components/SupplierSection';
import StockSection from './components/StockSection';
import FilePreviewModal from './components/FilePreviewModal';
import UserProfileModal from './components/UserProfileModal';
import LoginScreen from './components/LoginScreen';
import { CarpoleLogo } from './components/CarpoleLogo';
import { Snowflake, Truck, ShieldAlert, CheckCircle2, ShoppingBag, Users, Calendar, LogOut, Shield, Lock, TrendingUp, Boxes, User as UserIcon } from 'lucide-react';
import AnalyticsSection from './components/AnalyticsSection';

export default function App() {
  const [activeTab, setActiveTab] = useState<'clients' | 'suppliers' | 'stock' | 'analytics'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // User Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // User Session State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('carpole_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('carpole_user', JSON.stringify(updatedUser));
  };

  // Redirect users according to role permissions
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'gestionnaire_stock' && activeTab !== 'stock') {
        setActiveTab('stock');
      } else if (currentUser.role !== 'admin' && activeTab === 'analytics') {
        setActiveTab('clients');
      }
    }
  }, [currentUser, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('carpole_user');
    setCurrentUser(null);
  };

  // File Preview State
  const [previewFile, setPreviewFile] = useState<AttachedFile | null>(null);

  // Load data from IndexedDB on startup
  useEffect(() => {
    async function loadData() {
      try {
        let loadedClients = await getClients();
        let loadedSuppliers = await getSuppliers();
        let loadedStock = await getStockItems();

        // Populate database with our premium Algerian seed data
        let databaseUpdated = false;
        
        for (const client of SEED_CLIENTS) {
          if (!loadedClients.some(c => c.id === client.id)) {
            await saveClient(client);
            databaseUpdated = true;
          }
        }
        for (const supplier of SEED_SUPPLIERS) {
          if (!loadedSuppliers.some(s => s.id === supplier.id)) {
            await saveSupplier(supplier);
            databaseUpdated = true;
          }
        }
        for (const stockItem of SEED_STOCK) {
          if (!loadedStock.some(s => s.id === stockItem.id)) {
            await saveStockItem(stockItem);
            databaseUpdated = true;
          }
        }

        if (databaseUpdated) {
          loadedClients = await getClients();
          loadedSuppliers = await getSuppliers();
          loadedStock = await getStockItems();
        }

        setClients(loadedClients);
        setSuppliers(loadedSuppliers);
        setStockItems(loadedStock);
      } catch (err) {
        console.error("IndexedDB error during startup:", err);
        setDbError("Impossible de charger la base de données locale. Vérifiez les autorisations de votre navigateur.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Customer Actions
  const handleAddClient = async (newClient: Client) => {
    try {
      await saveClient(newClient);
      setClients(prev => [newClient, ...prev]);
    } catch (err) {
      console.error("Failed to add client:", err);
      alert("Erreur lors de l'enregistrement du client.");
    }
  };

  const handleEditClient = async (updatedClient: Client) => {
    try {
      await saveClient(updatedClient);
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    } catch (err) {
      console.error("Failed to edit client:", err);
      alert("Erreur lors de la modification du client.");
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (currentUser?.role !== 'admin') {
      alert("⚠️ Action Refusée : En tant que Responsable Commercial, vous n'êtes pas autorisé à supprimer les dossiers de vente. Veuillez contacter l'administrateur principal (Farid Bouchaib) pour toute suppression.");
      return;
    }
    try {
      await deleteClient(id);
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Failed to delete client:", err);
      alert("Erreur lors de la suppression du client.");
    }
  };

  // Helper to sync newly purchased products to Stock table automatically
  const syncSupplierProductsToStock = async (supplier: Supplier) => {
    const productsToSync = supplier.produits && supplier.produits.length > 0
      ? supplier.produits
      : [{
          id: crypto.randomUUID(),
          produit: supplier.articleAchete,
          prixUnitaire: supplier.prixUnitaire,
          quantite: supplier.quantite,
          type: 'matiere_premiere' as const,
          unite: 'Unités'
        }];

    for (const prod of productsToSync) {
      if (!prod.produit || !prod.produit.trim()) continue;
      const targetName = prod.produit.trim();
      const existing = stockItems.find(st => st.nom.toLowerCase().trim() === targetName.toLowerCase());
      if (!existing) {
        const newStockItem: StockItem = {
          id: crypto.randomUUID(),
          nom: targetName,
          type: prod.type || 'matiere_premiere',
          unite: prod.unite || 'Unités',
          quantiteInitiale: 0,
          seuilAlerte: 2,
          prixUnitaireMoyen: prod.prixUnitaire || 0,
          fournisseurNom: supplier.nomPrenom,
          fournisseurTelephone: supplier.telephone,
          createdAt: new Date().toISOString()
        };
        await saveStockItem(newStockItem);
        setStockItems(prev => [newStockItem, ...prev]);
      }
    }
  };

  // Supplier Actions
  const handleAddSupplier = async (newSupplier: Supplier) => {
    try {
      await saveSupplier(newSupplier);
      setSuppliers(prev => [newSupplier, ...prev]);
      await syncSupplierProductsToStock(newSupplier);
    } catch (err) {
      console.error("Failed to add supplier:", err);
      alert("Erreur lors de l'enregistrement de l'achat.");
    }
  };

  const handleEditSupplier = async (updatedSupplier: Supplier) => {
    try {
      await saveSupplier(updatedSupplier);
      setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
      await syncSupplierProductsToStock(updatedSupplier);
    } catch (err) {
      console.error("Failed to edit supplier:", err);
      alert("Erreur lors de la modification de l'achat.");
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (currentUser?.role !== 'admin') {
      alert("⚠️ Action Refusée : En tant que Responsable Commercial, vous n'êtes pas autorisé à supprimer les dossiers d'achat. Veuillez contacter l'administrateur principal (Farid Bouchaib) pour toute suppression.");
      return;
    }
    try {
      await deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to delete supplier:", err);
      alert("Erreur lors de la suppression de l'achat.");
    }
  };

  const handleToggleDeliveryStatus = async (id: string) => {
    try {
      const supplier = suppliers.find(s => s.id === id);
      if (supplier) {
        const updated = { ...supplier, livre: !supplier.livre };
        await saveSupplier(updated);
        setSuppliers(prev => prev.map(s => s.id === id ? updated : s));
      }
    } catch (err) {
      console.error("Failed to toggle delivery status:", err);
      alert("Erreur lors de la mise à jour de la livraison.");
    }
  };

  // Stock Actions
  const handleAddStockItem = async (newStockItem: StockItem) => {
    try {
      await saveStockItem(newStockItem);
      setStockItems(prev => [newStockItem, ...prev]);
    } catch (err) {
      console.error("Failed to add stock item:", err);
      alert("Erreur lors de l'enregistrement de l'article de stock.");
    }
  };

  const handleEditStockItem = async (updatedStockItem: StockItem) => {
    try {
      await saveStockItem(updatedStockItem);
      setStockItems(prev => prev.map(s => s.id === updatedStockItem.id ? updatedStockItem : s));
    } catch (err) {
      console.error("Failed to edit stock item:", err);
      alert("Erreur lors de la modification de l'article de stock.");
    }
  };

  const handleDeleteStockItem = async (id: string) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'gestionnaire_stock') {
      alert("⚠️ Action Refusée : Vous n'êtes pas autorisé à supprimer les articles de stock.");
      return;
    }
    try {
      await deleteStockItem(id);
      setStockItems(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to delete stock item:", err);
      alert("Erreur lors de la suppression de l'article de stock.");
    }
  };

  // Shared file preview
  const handleViewFile = (file: AttachedFile) => {
    setPreviewFile(file);
  };

  if (!currentUser) {
    return <LoginScreen onLogin={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-amber-500 selection:text-white">
      
      {/* High Density Sticky Header */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 shadow-sm">
        <div className="w-full px-6 sm:px-8 lg:px-12 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Custom CARPÔLE INDUSTRIEL Vector Logo */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 select-none">
            <div className="h-14 py-1 flex items-center justify-start">
              <CarpoleLogo className="h-full w-auto" />
            </div>

            {/* Vertical Separator Line */}
            <div className="hidden sm:block h-10 w-px bg-slate-800" />

            {/* Branded Segment Info */}
            <div className="flex flex-col justify-center gap-1.5">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center text-[10px] font-black uppercase text-[#f5be1a] border border-[#f5be1a]/30 px-3 py-1 rounded-full tracking-wider bg-[#f5be1a]/5">
                  ISOTHERME & FROID
                </span>
                <span className="text-xs text-slate-500 font-bold hidden md:inline">ALGERIA</span>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-none hidden lg:block">
                Fabrication & Installation de Carrosseries Isothermes et Groupes Frigorifiques
              </p>
            </div>
          </div>

          {/* Large Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-850 p-1 rounded-xl border border-slate-700/45 self-start md:self-center">
            {currentUser?.role !== 'gestionnaire_stock' && (
              <>
                <button
                  onClick={() => setActiveTab('clients')}
                  className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                    activeTab === 'clients'
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Clients & Ventes
                </button>
                <button
                  onClick={() => setActiveTab('suppliers')}
                  className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                    activeTab === 'suppliers'
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Fournisseurs
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('stock')}
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === 'stock'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Boxes className="w-4 h-4" />
              Gestion de stock
            </button>
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('analytics')}
                className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Analyses & BI
              </button>
            )}
          </div>

          {/* User Session Profile & Logout */}
          <div className="flex items-center gap-3 self-start md:self-center bg-slate-850 py-1.5 px-3 rounded-xl border border-slate-700/45 hover:border-amber-500/50 transition-colors">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 hover:bg-slate-800/80 p-1 rounded-lg transition-all cursor-pointer group text-left"
              title="Cliquer pour gérer le profil utilisateur (Nom, Mot de passe, Options)"
            >
              <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center text-xs font-black transition-transform group-hover:scale-105 shadow-sm ${
                currentUser.role === 'admin' 
                  ? 'bg-amber-500 text-slate-950' 
                  : currentUser.role === 'gestionnaire_stock'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-cyan-500 text-slate-950'
              }`}>
                {currentUser.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="leading-none text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white leading-none group-hover:text-amber-400 transition-colors">{currentUser.fullName}</p>
                  <UserIcon className="w-3 h-3 text-slate-400 group-hover:text-amber-400 transition-colors" />
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-xs ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                      : currentUser.role === 'gestionnaire_stock'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                  }`}>
                    {currentUser.role === 'admin' ? 'Direction (Admin)' : currentUser.role === 'gestionnaire_stock' ? 'Gestionnaire de Stock' : 'Commercial'}
                  </span>
                </div>
              </div>
            </button>
            <div className="h-6 w-px bg-slate-700/60" />
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-md transition-colors cursor-pointer"
              title="Se déconnecter"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Role Notice for Commercial Account */}
      {currentUser.role === 'commercial' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 sm:px-8 lg:px-12 py-2 animate-in fade-in duration-150">
          <div className="w-full flex items-center justify-between text-xs font-bold text-amber-400">
            <span className="flex items-center gap-2 uppercase tracking-wide">
              <Shield className="w-4 h-4 text-amber-500 animate-pulse" />
              Mode de Consultation Commerciale Actif • Saisie & Modification Autorisées • Suppression Réservée à la Direction
            </span>
            <span className="opacity-80 font-mono text-[10px]">Sétif Cloud Secure Connection</span>
          </div>
        </div>
      )}

      {/* Role Notice for Stock Manager Account */}
      {currentUser.role === 'gestionnaire_stock' && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 sm:px-8 lg:px-12 py-2 animate-in fade-in duration-150">
          <div className="w-full flex items-center justify-between text-xs font-bold text-emerald-400">
            <span className="flex items-center gap-2 uppercase tracking-wide">
              <Shield className="w-4 h-4 text-emerald-500 animate-pulse" />
              Mode Gestionnaire de Stock Actif • Accès Exclusif au Module Gestion de Produits & Stock
            </span>
            <span className="opacity-80 font-mono text-[10px]">Carpôle Stock Management</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full px-6 sm:px-8 lg:px-12 py-6">
        
        {dbError && (
          <div className="mb-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <ShieldAlert className="w-4.5 h-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs">Avertissement de base de données :</p>
              <p className="text-[11px]">{dbError}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full border-4 border-amber-100 border-t-amber-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Chargement de la base de données Carpole...</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Business stats */}
            {currentUser?.role === 'admin' && (
              <DashboardStats clients={clients} suppliers={suppliers} />
            )}

            {/* Dynamic Segment Rendering */}
            <div className="bg-slate-50 rounded-lg">
              {activeTab === 'clients' ? (
                <ClientSection
                  clients={clients}
                  stockItems={stockItems}
                  suppliers={suppliers}
                  onAddClient={handleAddClient}
                  onEditClient={handleEditClient}
                  onDeleteClient={handleDeleteClient}
                  onViewFile={handleViewFile}
                  userRole={currentUser?.role}
                />
              ) : activeTab === 'suppliers' ? (
                <SupplierSection
                  suppliers={suppliers}
                  stockItems={stockItems}
                  onAddSupplier={handleAddSupplier}
                  onEditSupplier={handleEditSupplier}
                  onDeleteSupplier={handleDeleteSupplier}
                  onToggleDeliveryStatus={handleToggleDeliveryStatus}
                  userRole={currentUser?.role}
                />
              ) : activeTab === 'stock' ? (
                <StockSection
                  stockItems={stockItems}
                  clients={clients}
                  suppliers={suppliers}
                  onAddStockItem={handleAddStockItem}
                  onEditStockItem={handleEditStockItem}
                  onDeleteStockItem={handleDeleteStockItem}
                  userRole={currentUser?.role}
                />
              ) : currentUser?.role === 'admin' ? (
                <AnalyticsSection
                  clients={clients}
                  suppliers={suppliers}
                  stockItems={stockItems}
                />
              ) : (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-900">Accès Refusé</h3>
                  <p className="text-sm text-slate-500 mt-1">Vous n'avez pas l'autorisation d'accéder à la rubrique Analyses & BI.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Spacious Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8 text-center text-xs text-slate-500">
        <div className="w-full px-6 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 font-medium">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Truck className="w-4.5 h-4.5 text-slate-400" />
            <span>© {new Date().getFullYear()} CARPOLE INDUSTRIEL Alger. Tous droits réservés.</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-slate-500">RC: 16/00-0987654B15 • NIF: 001506012456789</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">
              Database Cloud-Based Offline Sync
            </span>
          </div>
        </div>
      </footer>

      {/* Globally triggered PDF/File viewer modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* User Profile & Account Settings Modal */}
      {isProfileModalOpen && currentUser && (
        <UserProfileModal
          currentUser={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
          clients={clients}
          suppliers={suppliers}
          stockItems={stockItems}
        />
      )}

    </div>
  );
}
