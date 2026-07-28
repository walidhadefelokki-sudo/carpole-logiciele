/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Supplier, StockItem } from '../types';
import { X, Calendar, ShoppingCart, Info, AlertCircle, Sparkles, Box } from 'lucide-react';

interface SupplierFormModalProps {
  supplier: Supplier | null; // Null means adding new, non-null means editing
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
  stockItems?: StockItem[];
}

// Industry-specific suggestion chips to speed up data entry for Carpole's purchasing team
const INDUSTRIAL_EQUIPMENT_SUGGESTIONS = [
  "Compresseur Frigorifique Bitzer",
  "Fluide Frigorigène R404A (Bouteille 10kg)",
  "Panneaux Sandwich Isothermes (Épaisseur 80mm)",
  "Évaporateur Ventilé Double Flux",
  "Groupe Frigorifique de Route (Thermokking)",
  "Porte Isotherme Pivotante avec Résistance",
  "Thermostat Électronique Digital Eliwell",
  "Sonde de Température Intelligente PT100",
  "Profilés d'angle en Aluminium anodisé",
  "Joints d'étanchéité de porte silicone"
];

export default function SupplierFormModal({ supplier, onClose, onSave, stockItems }: SupplierFormModalProps) {
  const [nomPrenom, setNomPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [articleAchete, setArticleAchete] = useState('');
  const [prixUnitaire, setPrixUnitaire] = useState<number>(0);
  const [quantite, setQuantite] = useState<number>(1);
  const [dateAchat, setDateAchat] = useState('');
  const [livre, setLivre] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedStockId, setSelectedStockId] = useState<string>('__custom__');

  useEffect(() => {
    if (supplier) {
      setNomPrenom(supplier.nomPrenom || '');
      setTelephone(supplier.telephone || '');
      setArticleAchete(supplier.articleAchete || '');
      setPrixUnitaire(supplier.prixUnitaire ?? 0);
      setQuantite(supplier.quantite ?? 1);
      setDateAchat(supplier.dateAchat || new Date().toISOString().split('T')[0]);
      setLivre(supplier.livre ?? false);
      
      // Select matching stock item if exists
      if (stockItems) {
        const match = stockItems.find(s => s.nom.toLowerCase().trim() === (supplier.articleAchete || '').toLowerCase().trim());
        if (match) {
          setSelectedStockId(match.id);
        } else {
          setSelectedStockId('__custom__');
        }
      }
    } else {
      setNomPrenom('');
      setTelephone('');
      setArticleAchete('');
      setPrixUnitaire(0);
      setQuantite(1);
      setDateAchat(new Date().toISOString().split('T')[0]); // Default to today
      setLivre(false);
      
      if (stockItems && stockItems.length > 0) {
        setSelectedStockId(stockItems[0].id);
        setArticleAchete(stockItems[0].nom);
        setPrixUnitaire(stockItems[0].prixUnitaireMoyen);
      } else {
        setSelectedStockId('__custom__');
      }
    }
  }, [supplier, stockItems]);

  const handleStockChange = (id: string) => {
    setSelectedStockId(id);
    if (id === '__custom__') {
      setArticleAchete('');
      setPrixUnitaire(0);
    } else {
      const match = stockItems?.find(s => s.id === id);
      if (match) {
        setArticleAchete(match.nom);
        setPrixUnitaire(match.prixUnitaireMoyen);
      }
    }
  };

  const handleSelectSuggestion = (val: string) => {
    setSelectedStockId('__custom__');
    setArticleAchete(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomPrenom.trim()) {
      setErrorMsg("Le nom du fournisseur est obligatoire.");
      return;
    }

    if (!articleAchete.trim()) {
      setErrorMsg("L'article acheté est obligatoire.");
      return;
    }

    if (prixUnitaire <= 0) {
      setErrorMsg("Le prix unitaire doit être supérieur à 0.");
      return;
    }

    if (quantite <= 0) {
      setErrorMsg("La quantité doit être supérieure à 0.");
      return;
    }

    if (!dateAchat) {
      setErrorMsg("La date d'achat est requise.");
      return;
    }

    const savedSupplier: Supplier = {
      id: supplier ? supplier.id : crypto.randomUUID(),
      nomPrenom: nomPrenom.trim(),
      telephone: telephone.trim(),
      articleAchete: articleAchete.trim(),
      prixUnitaire,
      quantite,
      dateAchat,
      livre,
      createdAt: supplier ? supplier.createdAt : new Date().toISOString(),
    };

    onSave(savedSupplier);
  };

  const totalCost = prixUnitaire * quantite;

  return (
    <div id="supplier-form-backdrop" className="fixed inset-0 z-40 flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div id="supplier-form-content" className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full my-4 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
            <ShoppingCart className="w-4 h-4 text-slate-500" />
            {supplier ? 'Modifier l\'Achat Fournisseur' : 'Enregistrer un Nouvel Achat'}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-150 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[75vh] space-y-3.5">
          
          {errorMsg && (
            <div className="bg-red-50 text-red-700 border border-red-150 rounded-md p-2 flex items-start gap-1.5 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Erreur de validation : </span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Nom Fournisseur */}
            <div className="space-y-0.5 sm:col-span-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Fournisseur (Nom / Société) *</label>
              <input
                type="text"
                required
                value={nomPrenom}
                onChange={(e) => setNomPrenom(e.target.value)}
                placeholder="Ex: SARL Froid Composants Algérie"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 text-xs focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs font-bold"
              />
            </div>

            {/* Téléphone Fournisseur */}
            <div className="space-y-0.5 sm:col-span-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">N° de Téléphone (Urgence d'achats)</label>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex: 021 54 88 12 ou +33..."
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 text-xs focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs font-bold font-mono"
              />
            </div>

            {/* Article acheté */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Sélectionner un Article du Stock *</label>
              
              {stockItems && stockItems.length > 0 ? (
                <select
                  value={selectedStockId}
                  onChange={(e) => handleStockChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-850 text-xs focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs cursor-pointer mb-2"
                >
                  <optgroup label="Matières Premières (Stock)">
                    {stockItems.filter(item => item.type === 'matiere_premiere').map(item => (
                      <option key={item.id} value={item.id}>
                        {item.nom} (P.U. Moyen: {item.prixUnitaireMoyen.toLocaleString('fr-FR')} DA)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Produits Finis (Stock)">
                    {stockItems.filter(item => item.type === 'produit_fini').map(item => (
                      <option key={item.id} value={item.id}>
                        {item.nom} (P.U. Moyen: {item.prixUnitaireMoyen.toLocaleString('fr-FR')} DA)
                      </option>
                    ))}
                  </optgroup>
                  <option value="__custom__">🔍 Saisie personnalisée / Nouvel Article non référencé...</option>
                </select>
              ) : null}

              {/* Free text input if custom selected or stockItems is empty */}
              {(selectedStockId === '__custom__' || !stockItems || stockItems.length === 0) && (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase block">Nom de l'article personnalisé *</label>
                  <input
                    type="text"
                    required
                    value={articleAchete}
                    onChange={(e) => setArticleAchete(e.target.value)}
                    placeholder="Ex: Compresseur 12V haute capacité"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 text-xs focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                  />
                </div>
              )}

              {/* Suggestions chips */}
              <div className="pt-1.5">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide block mb-1 flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                  Suggestions rapides (Équipements frigorifiques & pièces de rechange) :
                </span>
                <div className="flex flex-wrap gap-1 max-h-[55px] overflow-y-auto p-1 border border-slate-200 rounded-md bg-slate-50/50">
                  {INDUSTRIAL_EQUIPMENT_SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug)}
                      className={`text-[9px] px-1.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                        articleAchete === sug 
                          ? 'bg-amber-500 border-amber-500 text-white font-bold' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Prix unitaire */}
            <div className="space-y-0.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Prix unitaire (DZD) *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">DA</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={prixUnitaire || ''}
                  onChange={(e) => setPrixUnitaire(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 text-xs font-mono font-bold focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                />
              </div>
            </div>

            {/* Quantite */}
            <div className="space-y-0.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Quantité *</label>
              <input
                type="number"
                min="1"
                required
                value={quantite}
                onChange={(e) => setQuantite(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="1"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 text-xs font-mono font-bold focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
              />
            </div>

            {/* Date d'achat */}
            <div className="space-y-0.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Date d'achat *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                </span>
                <input
                  type="date"
                  required
                  value={dateAchat}
                  onChange={(e) => setDateAchat(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 text-xs focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                />
              </div>
            </div>

            {/* Livré toggle */}
            <div className="flex flex-col justify-end">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md h-[34px]">
                <input
                  type="checkbox"
                  id="livre-checkbox"
                  checked={livre}
                  onChange={(e) => setLivre(e.target.checked)}
                  className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="livre-checkbox" className="text-[10px] font-bold text-slate-600 uppercase tracking-wide cursor-pointer select-none flex items-center gap-1">
                  L'article est déjà livré
                </label>
              </div>
            </div>
          </div>

          {/* Dynamic summary */}
          <div className="p-2.5 rounded-md border border-amber-200 bg-amber-50/20 flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Investissement Total Achat :</span>
            <span className="text-base font-black text-amber-900 font-mono">
              {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(totalCost)}
            </span>
          </div>

        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-4 py-2 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded shadow-3xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-1.5 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded shadow-3xs transition-colors cursor-pointer uppercase"
          >
            {supplier ? 'Enregistrer' : 'Créer l\'Achat'}
          </button>
        </div>

      </div>
    </div>
  );
}
