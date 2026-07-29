/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Supplier, SupplierProductItem, StockItem } from '../types';
import { X, Calendar, ShoppingCart, AlertCircle, Plus, Trash2, Coins, Package, DollarSign, Building2, Phone, ShieldCheck } from 'lucide-react';

interface SupplierFormModalProps {
  supplier: Supplier | null; // Null means adding new, non-null means editing
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
  stockItems?: StockItem[];
}

export default function SupplierFormModal({ supplier, onClose, onSave, stockItems = [] }: SupplierFormModalProps) {
  const [nomPrenom, setNomPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [dateAchat, setDateAchat] = useState('');
  const [livre, setLivre] = useState(false);
  const [tvaApplicable, setTvaApplicable] = useState(false);
  const [montantPaye, setMontantPaye] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Multi-product state
  const [produits, setProduits] = useState<SupplierProductItem[]>([
    {
      id: crypto.randomUUID(),
      produit: '',
      prixUnitaire: 0,
      quantite: 1,
      type: 'matiere_premiere',
      unite: 'Unités'
    }
  ]);

  useEffect(() => {
    if (supplier) {
      setNomPrenom(supplier.nomPrenom || '');
      setTelephone(supplier.telephone || '');
      setDateAchat(supplier.dateAchat || new Date().toISOString().split('T')[0]);
      setLivre(supplier.livre ?? false);
      setTvaApplicable(supplier.tvaApplicable ?? false);
      setMontantPaye(supplier.montantPaye ?? 0);

      if (supplier.produits && supplier.produits.length > 0) {
        setProduits(supplier.produits.map(p => ({
          ...p,
          id: p.id || crypto.randomUUID(),
          type: p.type || 'matiere_premiere',
          unite: p.unite || 'Unités'
        })));
      } else if (supplier.articleAchete) {
        setProduits([{
          id: crypto.randomUUID(),
          produit: supplier.articleAchete,
          prixUnitaire: supplier.prixUnitaire || 0,
          quantite: supplier.quantite || 1,
          type: 'matiere_premiere',
          unite: 'Unités'
        }]);
      }
    } else {
      setNomPrenom('');
      setTelephone('');
      setDateAchat(new Date().toISOString().split('T')[0]);
      setLivre(false);
      setTvaApplicable(false);
      setMontantPaye(0);
      setProduits([{
        id: crypto.randomUUID(),
        produit: '',
        prixUnitaire: 0,
        quantite: 1,
        type: 'matiere_premiere',
        unite: 'Unités'
      }]);
    }
  }, [supplier]);

  // Calculations
  const totalCostHT = produits.reduce((sum, item) => sum + ((item.prixUnitaire || 0) * (item.quantite || 1)), 0);
  const totalTVA = tvaApplicable ? Math.round(totalCostHT * 0.19) : 0;
  const totalCostTTC = totalCostHT + totalTVA;

  const resteAPayer = Math.max(0, totalCostTTC - montantPaye);
  const pourcentagePaye = totalCostTTC > 0 ? Math.min(100, Math.round((montantPaye / totalCostTTC) * 100)) : 0;

  // Multi-product handlers
  const handleAddProductRow = () => {
    setProduits(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        produit: '',
        prixUnitaire: 0,
        quantite: 1,
        type: 'matiere_premiere',
        unite: 'Unités'
      }
    ]);
  };

  const handleRemoveProductRow = (id: string) => {
    if (produits.length === 1) return;
    setProduits(prev => prev.filter(p => p.id !== id));
  };

  const handleProductChange = (id: string, field: keyof SupplierProductItem, value: any) => {
    setProduits(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Auto populate unit & price if matching a stock item
        if (field === 'produit' && typeof value === 'string') {
          const matchedStock = stockItems.find(st => st.nom.toLowerCase().trim() === value.toLowerCase().trim());
          if (matchedStock) {
            updated.prixUnitaire = matchedStock.prixUnitaireMoyen || updated.prixUnitaire;
            updated.type = matchedStock.type || updated.type;
            updated.unite = matchedStock.unite || updated.unite;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomPrenom.trim()) {
      setErrorMsg("Le nom du fournisseur est obligatoire.");
      return;
    }

    if (produits.length === 0) {
      setErrorMsg("Vous devez ajouter au moins un produit d'achat.");
      return;
    }

    for (let i = 0; i < produits.length; i++) {
      const p = produits[i];
      if (!p.produit || !p.produit.trim()) {
        setErrorMsg(`Le nom de l'article #${i + 1} est obligatoire.`);
        return;
      }
      if (p.prixUnitaire <= 0) {
        setErrorMsg(`Le prix unitaire de l'article "${p.produit}" doit être supérieur à 0 DA.`);
        return;
      }
      if (p.quantite <= 0) {
        setErrorMsg(`La quantité de l'article "${p.produit}" doit être d'au moins 1.`);
        return;
      }
    }

    if (!dateAchat) {
      setErrorMsg("La date d'achat est requise.");
      return;
    }

    // Build main article summary for legacy tables
    const articleSummary = produits.map(p => `${p.produit} (x${p.quantite})`).join(', ');
    const firstPrice = produits[0]?.prixUnitaire || 0;
    const totalQty = produits.reduce((sum, p) => sum + p.quantite, 0);

    const savedSupplier: Supplier = {
      id: supplier ? supplier.id : crypto.randomUUID(),
      nomPrenom: nomPrenom.trim(),
      telephone: telephone.trim(),
      articleAchete: articleSummary,
      prixUnitaire: firstPrice,
      quantite: totalQty,
      dateAchat,
      livre,
      createdAt: supplier ? supplier.createdAt : new Date().toISOString(),
      produits,
      montantPaye,
      tvaApplicable
    };

    onSave(savedSupplier);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div id="supplier-form-backdrop" className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div id="supplier-form-content" className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-4 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-900 text-white">
          <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
            <ShoppingCart className="w-4.5 h-4.5 text-amber-400" />
            {supplier ? 'Modifier la Commande / Fiche Fournisseur' : 'Enregistrer une Commande d\'Achat Fournisseur'}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto max-h-[80vh] space-y-5 text-left">
          
          {errorMsg && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Erreur de saisie : </span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Section 1: Informations du Fournisseur */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-500" />
              1. Coordonnées du Fournisseur & Date d'Achat
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide block">
                  Nom du Fournisseur / Raison Sociale *
                </label>
                <input
                  type="text"
                  required
                  value={nomPrenom}
                  onChange={(e) => setNomPrenom(e.target.value)}
                  placeholder="Ex: SARL Frigo Composants Algérie"
                  className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-900 text-xs font-bold focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide block">
                  Téléphone (Urgence d'Approvisionnement)
                </label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="Ex: 021 54 88 12 ou +33..."
                  className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-900 text-xs font-bold font-mono focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide block">
                  Date d'Achat / Commande *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="date"
                    required
                    value={dateAchat}
                    onChange={(e) => setDateAchat(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-900 text-xs font-bold focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Liste des Produits Achetés */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-500" />
                  2. Produits Achetés & Entrée Automatique en Stock
                </h4>
                <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                  Les produits ajoutés ici s'affichent automatiquement dans le tableau de Gestion de Stock.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddProductRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] rounded-lg shadow-3xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter un produit
              </button>
            </div>

            {/* List of product items */}
            <div className="space-y-3">
              {produits.map((item, index) => (
                <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-250 shadow-3xs space-y-2 relative">
                  
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                      Article #{index + 1}
                    </span>
                    {produits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProductRow(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Supprimer cette ligne"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    
                    {/* Nom du Produit */}
                    <div className="sm:col-span-5 space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase block">Nom du Produit / Matériel *</label>
                      <input
                        type="text"
                        required
                        list="stock-items-datalist"
                        value={item.produit}
                        onChange={(e) => handleProductChange(item.id, 'produit', e.target.value)}
                        placeholder="Ex: Compresseur Bitzer, Panneaux 80mm..."
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-bold focus:bg-white focus:border-amber-500 focus:outline-hidden transition-all"
                      />
                    </div>

                    {/* Type d'article */}
                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase block">Type d'Article</label>
                      <select
                        value={item.type || 'matiere_premiere'}
                        onChange={(e) => handleProductChange(item.id, 'type', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11px] font-bold focus:bg-white focus:border-amber-500 focus:outline-hidden transition-all cursor-pointer"
                      >
                        <option value="matiere_premiere">Matière Première</option>
                        <option value="produit_fini">Produit Fini</option>
                      </select>
                    </div>

                    {/* Prix Unitaire HT */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase block">P.U. (DA) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.prixUnitaire || ''}
                        onChange={(e) => handleProductChange(item.id, 'prixUnitaire', Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-mono font-bold focus:bg-white focus:border-amber-500 focus:outline-hidden transition-all"
                      />
                    </div>

                    {/* Quantité */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase block">Quantité *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantite}
                        onChange={(e) => handleProductChange(item.id, 'quantite', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-mono font-bold focus:bg-white focus:border-amber-500 focus:outline-hidden transition-all"
                      />
                    </div>

                  </div>

                  {/* Line Total preview */}
                  <div className="flex justify-end pt-1">
                    <span className="text-[10px] text-slate-400 font-mono font-bold">
                      Sous-total ligne : <strong className="text-slate-800">{formatCurrency((item.prixUnitaire || 0) * (item.quantite || 1))}</strong>
                    </span>
                  </div>

                </div>
              ))}
            </div>

            {/* Datalist for stock items suggestion */}
            <datalist id="stock-items-datalist">
              {stockItems.map(st => (
                <option key={st.id} value={st.nom} />
              ))}
            </datalist>

          </div>

          {/* Section 3: TVA, Total et Pourcentage de Règlement (Montant Payé au Fournisseur) */}
          <div className="bg-slate-900 text-white p-4.5 rounded-xl border border-slate-800 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  3. Tarification Global & Règlement Fournisseur
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  Définissez le montant payé ou l'acompte versé pour cet achat.
                </p>
              </div>

              {/* Toggle TVA 19% */}
              <div className="flex items-center gap-2 bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-750 self-start sm:self-center">
                <input
                  type="checkbox"
                  id="tva-supplier-checkbox"
                  checked={tvaApplicable}
                  onChange={(e) => setTvaApplicable(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-slate-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="tva-supplier-checkbox" className="text-xs font-bold text-slate-200 cursor-pointer select-none">
                  TVA 19% applicable
                </label>
              </div>
            </div>

            {/* Grid for Total HT / TVA / Total TTC */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">Total HT Achats</span>
                <span className="text-sm font-black font-mono text-white">{formatCurrency(totalCostHT)}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">Montant TVA (19%)</span>
                <span className="text-sm font-black font-mono text-amber-300">{formatCurrency(totalTVA)}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/40">
                <span className="text-[9px] text-amber-400 font-black uppercase tracking-wider block mb-1">Total Général TTC</span>
                <span className="text-base font-black font-mono text-amber-400">{formatCurrency(totalCostTTC)}</span>
              </div>
            </div>

            {/* Montant Payé au Fournisseur & Quick Buttons */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-black text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Montant Déboursé / Payé au Fournisseur (DA) :
                </label>
                
                {/* Input for Montant Payé */}
                <div className="relative w-full sm:w-56">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">DA</span>
                  <input
                    type="number"
                    min="0"
                    max={totalCostTTC}
                    value={montantPaye || ''}
                    onChange={(e) => setMontantPaye(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-mono font-black text-sm focus:border-amber-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Quick Percentage Action Buttons */}
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMontantPaye(0)}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-extrabold rounded-lg border border-slate-700 text-center transition-colors cursor-pointer"
                    title="Aucun acompte versé au fournisseur"
                  >
                    Non payé (0 DA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMontantPaye(Math.round(totalCostTTC / 2))}
                    className="flex-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-extrabold rounded-lg border border-amber-500/30 text-center transition-colors cursor-pointer"
                    title="Acompte de 50% versé au fournisseur"
                  >
                    Acompte (50% TTC)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMontantPaye(totalCostTTC)}
                    className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-extrabold rounded-lg border border-emerald-500/30 text-center transition-colors cursor-pointer"
                    title="Commande payée à 100%"
                  >
                    Total (100% TTC)
                  </button>
                </div>
              </div>

              {/* Payment Progress Fill Bar & Balance Info */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 font-sans font-bold">Avancement du règlement :</span>
                  <span className="text-amber-400 font-black">{pourcentagePaye}% Payé</span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      pourcentagePaye === 100
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : pourcentagePaye > 0
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${pourcentagePaye}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-mono pt-1">
                  <span className="text-slate-400 font-sans">Reste à payer au fournisseur :</span>
                  <span className={`font-black ${resteAPayer > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {formatCurrency(resteAPayer)}
                  </span>
                </div>
              </div>

            </div>

            {/* Delivery Status Checkbox */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="checkbox"
                id="livre-checkbox-main"
                checked={livre}
                onChange={(e) => setLivre(e.target.checked)}
                className="w-4.5 h-4.5 text-amber-500 border-slate-700 rounded focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="livre-checkbox-main" className="text-xs font-bold text-slate-200 cursor-pointer select-none flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Marchandise déjà livrée et réceptionnée au stock
              </label>
            </div>

          </div>

        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-extrabold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl shadow-3xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-xs transition-all cursor-pointer uppercase tracking-wider"
          >
            {supplier ? 'Enregistrer les modifications' : 'Créer la Commande Achat'}
          </button>
        </div>

      </div>
    </div>
  );
}
