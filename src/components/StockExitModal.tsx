import React, { useState, useEffect } from 'react';
import { StockItem, Client, User } from '../types';
import { MinusCircle, Plus, Trash2, ShieldAlert, UserCheck, Building2, PackageCheck, Calendar } from 'lucide-react';

export interface ExitItemRow {
  id: string;
  stockItemId: string;
  quantite: number;
  type: 'matiere_premiere' | 'produit_fini';
  unite: string;
}

interface StockExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItems: StockItem[];
  stockWithCalculations: Array<StockItem & { restante: number }>;
  clients: Client[];
  currentUser: User | null;
  onConfirmExit: (exits: Array<{
    stockItemId: string;
    produit: string;
    quantite: number;
    type: 'matiere_premiere' | 'produit_fini';
    unite: string;
    clientNom: string;
    username: string;
    motif?: string;
    date?: string;
  }>) => void;
}

export default function StockExitModal({
  isOpen,
  onClose,
  stockItems,
  stockWithCalculations,
  clients,
  currentUser,
  onConfirmExit,
}: StockExitModalProps) {
  const [nomUtilisateur, setNomUtilisateur] = useState('');
  const [clientNom, setClientNom] = useState('');
  const [dateSortie, setDateSortie] = useState('');
  const [motif, setMotif] = useState('');
  const [exitRows, setExitRows] = useState<ExitItemRow[]>([]);
  const [formError, setFormError] = useState('');

  // Initialize modal state when opened
  useEffect(() => {
    if (isOpen) {
      const defaultUser = currentUser?.fullName || currentUser?.username || 'Samy Stock';
      setNomUtilisateur(defaultUser);
      setClientNom('');
      setDateSortie(new Date().toISOString().split('T')[0]);
      setMotif('');
      setFormError('');

      // Create first initial row
      const firstItem = stockItems[0];
      if (firstItem) {
        setExitRows([{
          id: crypto.randomUUID(),
          stockItemId: firstItem.id,
          quantite: 1,
          type: firstItem.type,
          unite: firstItem.unite || 'Unités',
        }]);
      } else {
        setExitRows([{
          id: crypto.randomUUID(),
          stockItemId: '',
          quantite: 1,
          type: 'matiere_premiere',
          unite: 'Unités',
        }]);
      }
    }
  }, [isOpen, stockItems, currentUser]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    const firstItem = stockItems[0];
    setExitRows(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        stockItemId: firstItem ? firstItem.id : '',
        quantite: 1,
        type: firstItem ? firstItem.type : 'matiere_premiere',
        unite: firstItem ? (firstItem.unite || 'Unités') : 'Unités',
      }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (exitRows.length <= 1) return;
    setExitRows(prev => prev.filter(r => r.id !== id));
  };

  const handleRowProductChange = (rowId: string, stockItemId: string) => {
    const targetItem = stockItems.find(s => s.id === stockItemId);
    setExitRows(prev => prev.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          stockItemId,
          type: targetItem ? targetItem.type : row.type,
          unite: targetItem ? targetItem.unite : row.unite,
        };
      }
      return row;
    }));
  };

  const handleRowQuantityChange = (rowId: string, quantite: number) => {
    setExitRows(prev => prev.map(row => {
      if (row.id === rowId) {
        return { ...row, quantite: Math.max(1, quantite) };
      }
      return row;
    }));
  };

  const handleRowTypeChange = (rowId: string, type: 'matiere_premiere' | 'produit_fini') => {
    setExitRows(prev => prev.map(row => {
      if (row.id === rowId) {
        return { ...row, type };
      }
      return row;
    }));
  };

  const handleRowUniteChange = (rowId: string, unite: string) => {
    setExitRows(prev => prev.map(row => {
      if (row.id === rowId) {
        return { ...row, unite };
      }
      return row;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nomUtilisateur.trim()) {
      setFormError("Veuillez spécifier le nom de l'utilisateur qui effectue la sortie.");
      return;
    }

    if (exitRows.length === 0) {
      setFormError("Veuillez ajouter au moins un produit à sortir.");
      return;
    }

    // Validate each row
    const exitsToConfirm: Array<{
      stockItemId: string;
      produit: string;
      quantite: number;
      type: 'matiere_premiere' | 'produit_fini';
      unite: string;
      clientNom: string;
      username: string;
      motif?: string;
      date?: string;
    }> = [];

    for (let i = 0; i < exitRows.length; i++) {
      const row = exitRows[i];
      if (!row.stockItemId) {
        setFormError(`Veuillez sélectionner un produit pour la ligne #${i + 1}.`);
        return;
      }

      const targetItem = stockItems.find(s => s.id === row.stockItemId);
      if (!targetItem) {
        setFormError(`Produit introuvable pour la ligne #${i + 1}.`);
        return;
      }

      if (row.quantite <= 0) {
        setFormError(`La quantité pour "${targetItem.nom}" doit être supérieure à 0.`);
        return;
      }

      const calcItem = stockWithCalculations.find(s => s.id === row.stockItemId);
      const stockDispo = calcItem ? calcItem.restante : targetItem.quantiteInitiale;

      if (row.quantite > stockDispo) {
        setFormError(`La quantité demandée (${row.quantite}) pour "${targetItem.nom}" dépasse le stock disponible actuellement (${stockDispo} ${row.unite}).`);
        return;
      }

      exitsToConfirm.push({
        stockItemId: row.stockItemId,
        produit: targetItem.nom,
        quantite: row.quantite,
        type: row.type,
        unite: row.unite.trim() || targetItem.unite,
        clientNom: clientNom.trim() || 'Sortie Atelier / Interne',
        username: nomUtilisateur.trim(),
        motif: motif.trim() || undefined,
        date: dateSortie ? new Date(dateSortie).toISOString() : new Date().toISOString(),
      });
    }

    onConfirmExit(exitsToConfirm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 text-white">
          <h3 className="text-sm font-black flex items-center gap-2.5 uppercase tracking-wide text-amber-400">
            <MinusCircle className="w-5 h-5 text-amber-400 stroke-[2.5px]" />
            Formulaire de Sortie d'Articles du Stock
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5 rotate-45 stroke-[3px]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-left overflow-y-auto flex-1">
          
          {formError && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs">
              <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Erreur de validation : </span>
                <span>{formError}</span>
              </div>
            </div>
          )}

          {/* User, Client & Date Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            {/* Nom d'utilisateur */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                Intervenant *
              </label>
              <input
                type="text"
                required
                value={nomUtilisateur}
                onChange={(e) => setNomUtilisateur(e.target.value)}
                placeholder="Ex: Samy Stock..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
              />
            </div>

            {/* Client / Destination */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                Client / Destination
              </label>
              <input
                type="text"
                list="client-options-list"
                value={clientNom}
                onChange={(e) => setClientNom(e.target.value)}
                placeholder="Ex: SARL Frigo..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
              />
              <datalist id="client-options-list">
                {clients.map(c => (
                  <option key={c.id} value={c.nomPrenom} />
                ))}
                <option value="Consommation Interne / Atelier" />
                <option value="Maintenance Equipement" />
              </datalist>
            </div>

            {/* Date de Sortie */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Date de Sortie *
              </label>
              <input
                type="date"
                required
                value={dateSortie}
                onChange={(e) => setDateSortie(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs cursor-pointer"
              />
            </div>
          </div>

          {/* Motif / Remarque */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Motif / Remarque de Sortie (Optionnel)
            </label>
            <input
              type="text"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex: Montage caisse 14m3, Utilisation atelier stratification..."
              className="w-full px-3.5 py-2 bg-white border border-slate-250 rounded-xl text-slate-800 text-xs font-medium focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
            />
          </div>

          {/* Section Dynamic Articles list */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-amber-600" />
                Articles à Sortir du Stock ({exitRows.length})
              </label>

              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-3xs cursor-pointer active:scale-97"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                Sortir un autre article
              </button>
            </div>

            <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
              {exitRows.map((row, index) => {
                const selectedCalc = stockWithCalculations.find(s => s.id === row.stockItemId);
                const dispo = selectedCalc ? selectedCalc.restante : 0;

                return (
                  <div 
                    key={row.id} 
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-200 px-2 py-0.5 rounded-md">
                        Article #{index + 1}
                      </span>
                      {exitRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Product selection */}
                      <div className="sm:col-span-7 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Sélectionner l'article *
                        </label>
                        <select
                          required
                          value={row.stockItemId}
                          onChange={(e) => handleRowProductChange(row.id, e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs cursor-pointer"
                        >
                          <option value="">-- Choisir un produit du stock --</option>
                          {stockWithCalculations.map(st => (
                            <option key={st.id} value={st.id}>
                              {st.nom} ({st.type === 'matiere_premiere' ? 'Matière Première' : 'Produit Fini'}) — Stock: {st.restante} {st.unite}
                            </option>
                          ))}
                        </select>
                        {selectedCalc && (
                          <div className="text-[10px] font-medium text-slate-500 flex items-center justify-between px-1">
                            <span>Disponibilité actuelle :</span>
                            <span className={`font-mono font-bold ${dispo > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                              {dispo} {row.unite}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quantite */}
                      <div className="sm:col-span-5 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Quantité Sortie *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={row.quantite}
                          onChange={(e) => handleRowQuantityChange(row.id, parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                        />
                      </div>
                    </div>

                    {/* Type and Unit */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">
                          Type d'article
                        </label>
                        <select
                          value={row.type}
                          onChange={(e) => handleRowTypeChange(row.id, e.target.value as 'matiere_premiere' | 'produit_fini')}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-lg text-slate-800 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden cursor-pointer"
                        >
                          <option value="produit_fini">Produit Fini</option>
                          <option value="matiere_premiere">Matière Première</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">
                          Unité de mesure
                        </label>
                        <input
                          type="text"
                          required
                          value={row.unite}
                          onChange={(e) => handleRowUniteChange(row.id, e.target.value)}
                          placeholder="Ex: Unités, m², kg..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-lg text-slate-800 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddRow}
              className="w-full py-2.5 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 text-amber-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              Sortir un autre article
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-97 cursor-pointer"
            >
              Confirmer la Sortie ({exitRows.length} Article{exitRows.length > 1 ? 's' : ''})
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
