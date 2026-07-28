/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { StockItem, Client, Supplier } from '../types';
import { 
  Package, Boxes, Plus, Search, Edit, Trash2, 
  AlertTriangle, CheckCircle, Info, Coins, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Layers, ShieldAlert, Phone
} from 'lucide-react';

interface StockSectionProps {
  stockItems: StockItem[];
  clients: Client[];
  suppliers: Supplier[];
  onAddStockItem: (item: StockItem) => void;
  onEditStockItem: (item: StockItem) => void;
  onDeleteStockItem: (id: string) => void;
  userRole?: 'admin' | 'commercial' | 'gestionnaire_stock';
}

export default function StockSection({
  stockItems,
  clients,
  suppliers,
  onAddStockItem,
  onEditStockItem,
  onDeleteStockItem,
  userRole
}: StockSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'matiere_premiere' | 'produit_fini'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'normal' | 'bas' | 'rupture'>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  
  // Form state
  const [formNom, setFormNom] = useState('');
  const [formType, setFormType] = useState<'matiere_premiere' | 'produit_fini'>('produit_fini');
  const [formUnite, setFormUnite] = useState('Unités');
  const [formQuantiteInitiale, setFormQuantiteInitiale] = useState<number>(10);
  const [formSeuilAlerte, setFormSeuilAlerte] = useState<number>(2);
  const [formPrixUnitaire, setFormPrixUnitaire] = useState<number>(150000);
  const [formFournisseurNom, setFormFournisseurNom] = useState('');
  const [formFournisseurTelephone, setFormFournisseurTelephone] = useState('');
  const [formError, setFormError] = useState('');

  // 1. Calculate dynamic statistics for each stock item based on client purchases & supplier deliveries
  const stockWithCalculations = useMemo(() => {
    return stockItems.map(item => {
      // Received quantity from suppliers (only if delivered)
      const recu = suppliers
        .filter(s => s.articleAchete.toLowerCase().trim() === item.nom.toLowerCase().trim() && s.livre)
        .reduce((sum, s) => sum + (s.quantite || 0), 0);

      // Pending quantity in transit from suppliers
      const enTransit = suppliers
        .filter(s => s.articleAchete.toLowerCase().trim() === item.nom.toLowerCase().trim() && !s.livre)
        .reduce((sum, s) => sum + (s.quantite || 0), 0);

      // Sold quantity to clients
      const vendu = clients
        .filter(c => c.produit && c.produit.toLowerCase().trim() === item.nom.toLowerCase().trim())
        .reduce((sum, c) => sum + (c.quantite || 0), 0);

      const restante = item.quantiteInitiale + recu - vendu;
      const valeurTotal = Math.max(0, restante) * item.prixUnitaireMoyen;

      let status: 'normal' | 'bas' | 'rupture' = 'normal';
      if (restante <= 0) {
        status = 'rupture';
      } else if (restante <= item.seuilAlerte) {
        status = 'bas';
      }

      return {
        ...item,
        recu,
        enTransit,
        vendu,
        restante: Math.max(0, restante),
        valeurTotal,
        status
      };
    });
  }, [stockItems, clients, suppliers]);

  // 2. Compute KPI card totals
  const stats = useMemo(() => {
    let totalValue = 0;
    let itemsInRupture = 0;
    let itemsInStockBas = 0;
    let totalMatierePremiere = 0;
    let totalProduitFini = 0;

    stockWithCalculations.forEach(item => {
      totalValue += item.valeurTotal;
      if (item.restante <= 0) {
        itemsInRupture++;
      } else if (item.restante <= item.seuilAlerte) {
        itemsInStockBas++;
      }

      if (item.type === 'matiere_premiere') {
        totalMatierePremiere++;
      } else {
        totalProduitFini++;
      }
    });

    return {
      totalValue,
      itemsInRupture,
      itemsInStockBas,
      totalMatierePremiere,
      totalProduitFini,
      totalItemsCount: stockItems.length
    };
  }, [stockWithCalculations, stockItems]);

  // 3. Filtered Stock list
  const filteredStock = useMemo(() => {
    return stockWithCalculations.filter(item => {
      const matchesSearch = item.nom.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [stockWithCalculations, searchTerm, typeFilter, statusFilter]);

  // Handle open modal
  const handleOpenModal = (item?: StockItem) => {
    if (item) {
      setEditingItem(item);
      setFormNom(item.nom);
      setFormType(item.type);
      setFormUnite(item.unite);
      setFormQuantiteInitiale(item.quantiteInitiale);
      setFormSeuilAlerte(item.seuilAlerte);
      setFormPrixUnitaire(item.prixUnitaireMoyen);
      setFormFournisseurNom(item.fournisseurNom || '');
      setFormFournisseurTelephone(item.fournisseurTelephone || '');
    } else {
      setEditingItem(null);
      setFormNom('');
      setFormType('produit_fini');
      setFormUnite('Unités');
      setFormQuantiteInitiale(10);
      setFormSeuilAlerte(2);
      setFormPrixUnitaire(150000);
      setFormFournisseurNom('');
      setFormFournisseurTelephone('');
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNom.trim()) {
      setFormError("Le nom de l'article de stock est obligatoire.");
      return;
    }

    if (formQuantiteInitiale < 0) {
      setFormError("La quantité initiale ne peut pas être négative.");
      return;
    }

    if (formSeuilAlerte < 0) {
      setFormError("Le seuil d'alerte ne peut pas être négatif.");
      return;
    }

    if (formPrixUnitaire < 0) {
      setFormError("Le prix unitaire ne peut pas être négatif.");
      return;
    }

    const savedItem: StockItem = {
      id: editingItem ? editingItem.id : crypto.randomUUID(),
      nom: formNom.trim(),
      type: formType,
      unite: formUnite.trim() || 'Unités',
      quantiteInitiale: formQuantiteInitiale,
      seuilAlerte: formSeuilAlerte,
      prixUnitaireMoyen: formPrixUnitaire,
      fournisseurNom: formFournisseurNom.trim() || undefined,
      fournisseurTelephone: formFournisseurTelephone.trim() || undefined,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString()
    };

    if (editingItem) {
      onEditStockItem(savedItem);
    } else {
      // Check for duplicate names
      const duplicate = stockItems.some(item => item.nom.toLowerCase().trim() === savedItem.nom.toLowerCase().trim());
      if (duplicate) {
        setFormError("Un article de stock portant exactement ce nom existe déjà.");
        return;
      }
      onAddStockItem(savedItem);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = (id: string, name: string) => {
    if (userRole !== 'admin' && userRole !== 'gestionnaire_stock') {
      alert("⚠️ Action Refusée : Vous n'avez pas l'autorisation de supprimer des articles de stock.");
      return;
    }
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'article "${name}" du stock ? Cette action est irréversible.`)) {
      onDeleteStockItem(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Stock Summary Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Boxes className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border border-amber-500/20 inline-flex items-center gap-1.5 mb-3">
              <Layers className="w-3.5 h-3.5" /> Module Centralisé & Intelligent
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
              Gestion de Stock Intégrée
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2 font-medium leading-relaxed max-w-xl">
              Suivi unifié et automatique des matières premières et produits finis. Les ventes clients réduisent le stock instantanément, tandis que les livraisons fournisseurs l'approvisionnent.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-97 cursor-pointer self-stretch md:self-auto justify-center"
          >
            <Plus className="w-4.5 h-4.5 stroke-[3px]" />
            Ajouter un Article
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Stock Value */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Valeur du Stock Global</span>
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Coins className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
              {stats.totalValue.toLocaleString('fr-FR')} <span className="text-xs text-slate-500 font-extrabold">DA</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-[11px] text-slate-400">
            <span className="font-bold text-slate-700">{stats.totalItemsCount}</span> articles enregistrés en base
          </div>
        </div>

        {/* Stock bas / Critique */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Alerte Stock Bas</span>
              <span className={`p-1.5 rounded-lg ${stats.itemsInStockBas > 0 ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
              {stats.itemsInStockBas} <span className="text-xs text-slate-500 font-extrabold">art.</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            {stats.itemsInStockBas > 0 ? (
              <span className="text-amber-600 font-bold">⚠️ Quantité sous le seuil critique</span>
            ) : (
              <span className="text-emerald-600 font-bold">✓ Aucun article en stock bas</span>
            )}
          </div>
        </div>

        {/* Ruptures de Stock */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Ruptures de Stock</span>
              <span className={`p-1.5 rounded-lg ${stats.itemsInRupture > 0 ? 'bg-red-100 text-red-600 animate-bounce' : 'bg-slate-50 text-slate-400'}`}>
                <RefreshCw className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
              {stats.itemsInRupture} <span className="text-xs text-slate-500 font-extrabold">art.</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            {stats.itemsInRupture > 0 ? (
              <span className="text-red-600 font-black">❌ Réapprovisionnement urgent requis</span>
            ) : (
              <span className="text-emerald-600 font-bold">✓ Aucune rupture de stock</span>
            )}
          </div>
        </div>

        {/* Composition du catalogue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Composition Catalogue</span>
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Boxes className="w-4 h-4" />
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Produits Finis</span>
                <span className="font-extrabold text-slate-800">{stats.totalProduitFini}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Mat. Premières</span>
                <span className="font-extrabold text-slate-800">{stats.totalMatierePremiere}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Rapport MP/PF :</span>
            <span className="font-extrabold text-slate-700">
              {stats.totalMatierePremiere} / {stats.totalProduitFini}
            </span>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-left">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom de matière première ou produit fini..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all placeholder-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Filter by Type */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wide">Type :</span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${typeFilter === 'all' ? 'bg-white text-slate-800 shadow-4xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setTypeFilter('matiere_premiere')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${typeFilter === 'matiere_premiere' ? 'bg-white text-slate-800 shadow-4xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Matières Premières
                </button>
                <button
                  onClick={() => setTypeFilter('produit_fini')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${typeFilter === 'produit_fini' ? 'bg-white text-slate-800 shadow-4xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Produits Finis
                </button>
              </div>
            </div>

            {/* Filter by Stock Status */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-extrabold uppercase text-[10px] tracking-wide">État :</span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-white text-slate-800 shadow-4xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setStatusFilter('normal')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${statusFilter === 'normal' ? 'bg-white text-emerald-600 shadow-4xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  En Stock
                </button>
                <button
                  onClick={() => setStatusFilter('bas')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${statusFilter === 'bas' ? 'bg-white text-amber-600 shadow-4xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Stock Bas
                </button>
                <button
                  onClick={() => setStatusFilter('rupture')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${statusFilter === 'rupture' ? 'bg-white text-red-600 shadow-4xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Rupture
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Stock Inventory Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-5 py-3.5">Article de Stock</th>
                <th className="px-5 py-3.5">Unité</th>
                <th className="px-5 py-3.5 text-center">Quantité Initiale</th>
                <th className="px-5 py-3.5 text-center">Reçu (Fournisseurs)</th>
                <th className="px-5 py-3.5 text-center">Vendu (Clients)</th>
                <th className="px-5 py-3.5 text-center">Stock Restant</th>
                <th className="px-5 py-3.5 text-center">Seuil d'Alerte</th>
                <th className="px-5 py-3.5">P.U. Moyen</th>
                <th className="px-5 py-3.5">Valeur Totale</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold">Aucun article de stock trouvé</p>
                    <p className="text-[11px] text-slate-400/80 mt-1">Essayez de modifier votre recherche ou ajoutez un nouvel article.</p>
                  </td>
                </tr>
              ) : (
                filteredStock.map(item => {
                  const matchingSupplierFromDeliveries = suppliers.find(s => s.articleAchete.toLowerCase().trim() === item.nom.toLowerCase().trim());
                  const supplierName = item.fournisseurNom || matchingSupplierFromDeliveries?.nomPrenom;
                  const supplierPhone = item.fournisseurTelephone || matchingSupplierFromDeliveries?.telephone;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        item.status === 'rupture' 
                          ? 'bg-red-50/15' 
                          : item.status === 'bas' 
                            ? 'bg-amber-50/15' 
                            : ''
                      }`}
                    >
                      {/* Name & Type */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-xs font-black text-slate-900 leading-snug">{item.nom}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm border ${
                              item.type === 'matiere_premiere'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                : 'bg-cyan-50 text-cyan-700 border-cyan-100'
                            }`}>
                              {item.type === 'matiere_premiere' ? 'Matière Première' : 'Produit Fini'}
                            </span>
                            {item.status === 'rupture' && (
                              <span className="bg-red-100 text-red-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-sm">
                                Rupture
                              </span>
                            )}
                            {item.status === 'bas' && (
                              <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-sm">
                                Stock Bas
                              </span>
                            )}
                          </div>
                          
                          {/* Supplier Quick Contact info on emergency */}
                          {supplierName && (
                            <div className="mt-2.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 font-bold flex flex-wrap items-center gap-1.5">
                              <span className="text-slate-400 font-medium">Fournisseur :</span>
                              <span className="text-slate-700 truncate max-w-[170px]" title={supplierName}>{supplierName}</span>
                              {supplierPhone && (
                                <a 
                                  href={`tel:${supplierPhone.replace(/\s/g, '')}`}
                                  className="inline-flex items-center gap-0.5 text-amber-600 hover:text-amber-700 font-black hover:underline px-1 py-0.5 bg-amber-50 border border-amber-250/40 rounded-sm"
                                  title="Appeler immédiatement"
                                >
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{supplierPhone}</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.unite}
                        </span>
                      </td>

                      {/* Initial Qty */}
                      <td className="px-5 py-4 text-center font-mono text-xs font-bold text-slate-600">
                        {item.quantiteInitiale}
                      </td>

                      {/* Received Qty */}
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`font-mono text-xs font-bold ${item.recu > 0 ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}`}>
                            {item.recu > 0 ? `+${item.recu}` : '0'}
                          </span>
                          {item.enTransit > 0 && (
                            <span className="text-[9px] text-amber-500 font-extrabold" title="Commande fournisseur en cours de livraison">
                              +{item.enTransit} en cours
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sold Qty */}
                      <td className="px-5 py-4 text-center font-mono text-xs font-bold">
                        <span className={item.vendu > 0 ? 'text-red-500 font-extrabold' : 'text-slate-400'}>
                          {item.vendu > 0 ? `-${item.vendu}` : '0'}
                        </span>
                      </td>

                      {/* Remaining Qty */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black font-mono shadow-3xs ${
                          item.status === 'rupture'
                            ? 'bg-red-100 text-red-700 font-black border border-red-200'
                            : item.status === 'bas'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {item.restante}
                        </span>
                      </td>

                      {/* Alert Threshold */}
                      <td className="px-5 py-4 text-center font-mono text-xs font-bold text-slate-400">
                        {item.seuilAlerte}
                      </td>

                      {/* Average Unit Price */}
                      <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700">
                        {item.prixUnitaireMoyen.toLocaleString('fr-FR')} DA
                      </td>

                      {/* Total Inventory Value */}
                      <td className="px-5 py-4 font-mono text-xs font-black text-slate-900">
                        {item.valeurTotal.toLocaleString('fr-FR')} DA
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-2 hover:bg-amber-50 hover:text-amber-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title="Modifier l'article"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {userRole === 'admin' && (
                            <button
                              onClick={() => confirmDelete(item.id, item.nom)}
                              className="p-2 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer l'article"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full my-4 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Package className="w-4 h-4 text-amber-500" />
                {editingItem ? 'Modifier l\'Article de Stock' : 'Ajouter un Nouvel Article de Stock'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 rotate-45 stroke-[3px]" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4 text-left">
              
              {formError && (
                <div className="bg-red-50 text-red-700 border border-red-150 rounded-xl p-3 flex items-start gap-1.5 text-xs">
                  <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Erreur : </span>
                    <span>{formError}</span>
                  </div>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Nom de l'Article / Produit de Stock *
                </label>
                <input
                  type="text"
                  required
                  value={formNom}
                  onChange={(e) => setFormNom(e.target.value)}
                  placeholder="Ex: Compresseur Frigorifique Bitzer 4EES-6Y"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-bold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  Important: Le nom doit correspondre à celui utilisé dans les fiches Clients ("Produit") ou Fournisseurs ("Article") pour une synchronisation automatique et intelligente.
                </p>
              </div>

              {/* Type and Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Type d'Article *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as 'matiere_premiere' | 'produit_fini')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-bold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs cursor-pointer"
                  >
                    <option value="produit_fini">Produit Fini (Vendu aux clients)</option>
                    <option value="matiere_premiere">Matière Première (Acheté aux fournisseurs)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Unité de Mesure *
                  </label>
                  <input
                    type="text"
                    required
                    value={formUnite}
                    onChange={(e) => setFormUnite(e.target.value)}
                    placeholder="Ex: Unités, m², kg, Litres"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-bold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                  />
                </div>
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Stock Initial de Départ *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formQuantiteInitiale}
                    onChange={(e) => setFormQuantiteInitiale(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                  />
                  <p className="text-[9px] text-slate-400 font-medium">
                    Quantité physique disponible avant d'enregistrer de nouveaux achats ou ventes.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Seuil d'Alerte (Stock Bas) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formSeuilAlerte}
                    onChange={(e) => setFormSeuilAlerte(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                  />
                  <p className="text-[9px] text-slate-400 font-medium">
                    Déclenche une alerte orange visuelle en dessous de cette valeur restante.
                  </p>
                </div>
              </div>

              {/* Unit Price */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Prix Unitaire Moyen Estimé (DA) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formPrixUnitaire}
                  onChange={(e) => setFormPrixUnitaire(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                />
              </div>

              {/* Supplier and Phone Number systematically included */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3.5 mt-2.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Fournisseur (Nom / Société)
                  </label>
                  <input
                    type="text"
                    list="suppliers-auto-list"
                    value={formFournisseurNom}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormFournisseurNom(val);
                      // Auto populate telephone if matching an existing supplier
                      const matched = suppliers.find(s => s.nomPrenom.toLowerCase().trim() === val.toLowerCase().trim());
                      if (matched && matched.telephone) {
                        setFormFournisseurTelephone(matched.telephone);
                      }
                    }}
                    placeholder="Ex: SARL Frigo Composants Algérie"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-bold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                  />
                  <datalist id="suppliers-auto-list">
                    {Array.from(new Set(suppliers.map(s => s.nomPrenom))).map((name, i) => (
                      <option key={i} value={name} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    N° de Téléphone du Fournisseur
                  </label>
                  <input
                    type="tel"
                    value={formFournisseurTelephone}
                    onChange={(e) => setFormFournisseurTelephone(e.target.value)}
                    placeholder="Ex: 021 54 88 12 ou +33..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-bold font-mono focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs active:scale-97 cursor-pointer"
                >
                  {editingItem ? 'Enregistrer les Modifications' : 'Ajouter au Stock'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
