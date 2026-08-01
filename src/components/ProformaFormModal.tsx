import React, { useState } from 'react';
import { ProformaInvoice, ClientProductItem, StockItem } from '../types';
import { X, FileText, Calendar, Clock, MapPin, Plus, Trash2, ShoppingCart, Calculator, AlertCircle, Printer, Check } from 'lucide-react';

interface ProformaFormModalProps {
  onClose: () => void;
  onSave: (proforma: ProformaInvoice, autoPrint?: boolean) => void;
  stockItems?: StockItem[];
}

export default function ProformaFormModal({ onClose, onSave, stockItems = [] }: ProformaFormModalProps) {
  const [nomPrenom, setNomPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [rc, setRc] = useState('');
  const [nif, setNif] = useState('');
  const [nis, setNis] = useState('');
  const [dateCreation, setDateCreation] = useState(new Date().toISOString().split('T')[0]);
  const [delaiRealisation, setDelaiRealisation] = useState('15 jours ouvrables');
  const [rendezVous, setRendezVous] = useState('');
  const [tvaApplicable, setTvaApplicable] = useState(true);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Products state
  const [produits, setProduits] = useState<ClientProductItem[]>([
    {
      id: crypto.randomUUID(),
      produit: '',
      quantite: 1,
      prixBase: 0,
      remise: false,
      tauxRemise: 0,
      prixApresRemise: 0,
      tvaApplicable: true
    }
  ]);

  const handleAddProduct = () => {
    setProduits(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        produit: '',
        quantite: 1,
        prixBase: 0,
        remise: false,
        tauxRemise: 0,
        prixApresRemise: 0,
        tvaApplicable: true
      }
    ]);
  };

  const handleRemoveProduct = (id: string) => {
    if (produits.length === 1) return;
    setProduits(prev => prev.filter(p => p.id !== id));
  };

  const handleProductChange = (id: string, field: keyof ClientProductItem, value: any) => {
    setProduits(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };

        // Auto calculate discounted price
        if (field === 'prixBase' || field === 'tauxRemise' || field === 'remise') {
          const pb = field === 'prixBase' ? Math.max(0, parseFloat(value) || 0) : p.prixBase;
          const isRem = field === 'remise' ? Boolean(value) : p.remise;
          const tr = field === 'tauxRemise' ? Math.max(0, Math.min(100, parseFloat(value) || 0)) : p.tauxRemise;
          
          if (isRem && tr > 0) {
            updated.prixApresRemise = Math.round(pb * (1 - tr / 100));
          } else {
            updated.prixApresRemise = pb;
          }
        }

        // Auto populate price if stock item matches
        if (field === 'produit' && typeof value === 'string') {
          const match = stockItems.find(st => st.nom.toLowerCase().trim() === value.toLowerCase().trim());
          if (match && match.prixUnitaireMoyen) {
            updated.prixBase = match.prixUnitaireMoyen;
            updated.prixApresRemise = match.prixUnitaireMoyen;
          }
        }

        return updated;
      }
      return p;
    }));
  };

  // Calculations
  const totalHT = produits.reduce((sum, item) => {
    const unitPrice = item.remise && item.tauxRemise > 0 ? item.prixApresRemise : item.prixBase;
    return sum + (unitPrice * (item.quantite || 1));
  }, 0);

  const totalTVA = tvaApplicable ? Math.round(totalHT * 0.19) : 0;
  const totalTTC = totalHT + totalTVA;

  const handleSubmit = (e: React.FormEvent, autoPrint: boolean = false) => {
    e.preventDefault();

    if (!nomPrenom.trim()) {
      setErrorMsg("Le nom du client ou la raison sociale est obligatoire.");
      return;
    }

    if (produits.length === 0) {
      setErrorMsg("Veuillez ajouter au moins un produit à la facture proforma.");
      return;
    }

    for (let i = 0; i < produits.length; i++) {
      const p = produits[i];
      if (!p.produit || !p.produit.trim()) {
        setErrorMsg(`Le nom de l'article #${i + 1} est obligatoire.`);
        return;
      }
      if (p.prixBase <= 0) {
        setErrorMsg(`Le prix de l'article "${p.produit}" doit être supérieur à 0 DA.`);
        return;
      }
    }

    const proforma: ProformaInvoice = {
      id: crypto.randomUUID(),
      nomPrenom: nomPrenom.trim(),
      telephone: telephone.trim(),
      email: email.trim(),
      rc: rc.trim(),
      nif: nif.trim(),
      nis: nis.trim(),
      dateCreation,
      delaiRealisation: delaiRealisation.trim(),
      rendezVous: rendezVous.trim(),
      produits,
      tvaApplicable,
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    onSave(proforma, autoPrint);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-4 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-800 rounded-xl">
              <FileText className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Établir une Facture Proforma (Devis Client Potentiel)
              </h3>
              <p className="text-xs text-blue-200">
                Ne modifie pas le Chiffre d'Affaires ni les statistiques d'encaissement.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-blue-300 hover:text-white hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 overflow-y-auto max-h-[80vh] space-y-5">
          
          {errorMsg && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Client & Potentiel Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              1. Informations du Client Potentiel
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase block">Nom & Prénom / Raison Sociale *</label>
                <input
                  type="text"
                  required
                  value={nomPrenom}
                  onChange={(e) => setNomPrenom(e.target.value)}
                  placeholder="Ex: EURL Transport Froid & Logistique"
                  className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-900 text-xs font-bold focus:border-blue-500 focus:outline-hidden transition-all shadow-3xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase block">N° Téléphone</label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="Ex: 0550 12 34 56"
                  className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-slate-900 text-xs font-bold font-mono focus:border-blue-500 focus:outline-hidden transition-all shadow-3xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase block">N° Registre Commerce (RC)</label>
                <input
                  type="text"
                  value={rc}
                  onChange={(e) => setRc(e.target.value)}
                  placeholder="Optionnel"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase block">N° Identification Fiscale (NIF)</label>
                <input
                  type="text"
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  placeholder="Optionnel"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase block">N° Statistique (NIS)</label>
                <input
                  type="text"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="Optionnel"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Specific Proforma Requirements: Délai de réalisation & Rendez-vous */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80 space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              2. Modalités de la Proforma (Délai & Rendez-vous)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-blue-900 uppercase block">Date Proforma *</label>
                <input
                  type="date"
                  required
                  value={dateCreation}
                  onChange={(e) => setDateCreation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-900 text-xs font-bold focus:border-blue-500 focus:outline-hidden transition-all shadow-3xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-blue-900 uppercase block">Délai de Réalisation *</label>
                <input
                  type="text"
                  required
                  value={delaiRealisation}
                  onChange={(e) => setDelaiRealisation(e.target.value)}
                  placeholder="Ex: 15 jours après confirmation"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-900 text-xs font-bold focus:border-blue-500 focus:outline-hidden transition-all shadow-3xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-blue-900 uppercase block">Date / Note Rendez-vous</label>
                <input
                  type="text"
                  value={rendezVous}
                  onChange={(e) => setRendezVous(e.target.value)}
                  placeholder="Ex: Prise de mesure le 10/08 à 10h"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-900 text-xs font-bold focus:border-blue-500 focus:outline-hidden transition-all shadow-3xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Designations et Articles */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                3. Désignation des Articles / Carrosseries Proposés
              </h4>
              <button
                type="button"
                onClick={handleAddProduct}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-3xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter un article
              </button>
            </div>

            <div className="space-y-3">
              {produits.map((item, idx) => {
                const effectiveUnitPrice = item.remise && item.tauxRemise > 0 ? item.prixApresRemise : item.prixBase;
                const lineTotal = effectiveUnitPrice * item.quantite;

                return (
                  <div key={item.id} className="bg-white p-3.5 rounded-xl border border-slate-250 shadow-3xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Article Proforma #{idx + 1}</span>
                      {produits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(item.id)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-6 space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase block">Désignation Produit *</label>
                        <input
                          type="text"
                          required
                          list="proforma-stock-datalist"
                          value={item.produit}
                          onChange={(e) => handleProductChange(item.id, 'produit', e.target.value)}
                          placeholder="Ex: Caisse frigorifique isolée 4.2m"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-bold focus:bg-white focus:border-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase block">Quantité *</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantite}
                          onChange={(e) => handleProductChange(item.id, 'quantite', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase block">Prix Unitaire HT (DA) *</label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          required
                          value={item.prixBase || ''}
                          onChange={(e) => handleProductChange(item.id, 'prixBase', Math.max(0, parseFloat(e.target.value) || 0))}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end text-[11px] font-mono pt-1 text-slate-600">
                      Montant Ligne HT: <strong className="ml-1 text-blue-900">{formatCurrency(lineTotal)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            <datalist id="proforma-stock-datalist">
              {stockItems.map(st => (
                <option key={st.id} value={st.nom} />
              ))}
            </datalist>
          </div>

          {/* Totals & Options */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tvaApplicable}
                  onChange={(e) => setTvaApplicable(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-slate-800 border-slate-700"
                />
                <span className="text-xs font-bold text-blue-200">Appliquer la TVA 19% sur cette Facture Proforma</span>
              </label>

              <div className="text-right font-mono">
                <div className="text-xs text-slate-400">Total HT: {formatCurrency(totalHT)}</div>
                {tvaApplicable && <div className="text-xs text-amber-400">TVA (19%): +{formatCurrency(totalTVA)}</div>}
                <div className="text-lg font-black text-white">Total Proforma TTC: {formatCurrency(totalTTC)}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Notes / Remarques Offre</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Validité de l'offre 30 jours. Conditions de paiement à la commande..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Enregistrer Proforma
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Enregistrer & Imprimer
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
