/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Supplier, StockItem } from '../types';
import { 
  Plus, Search, Edit, Trash2, Calendar, AlertTriangle, Filter, X, 
  CheckCircle, Hourglass, ShoppingBag, Coins, Layers, Phone, DollarSign, CreditCard
} from 'lucide-react';
import SupplierFormModal from './SupplierFormModal';

interface SupplierSectionProps {
  suppliers: Supplier[];
  stockItems: StockItem[];
  onAddSupplier: (supplier: Supplier) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onToggleDeliveryStatus: (id: string) => void;
  userRole?: 'admin' | 'commercial' | 'gestionnaire_stock';
}

export default function SupplierSection({
  suppliers,
  stockItems,
  onAddSupplier,
  onEditSupplier,
  onDeleteSupplier,
  onToggleDeliveryStatus,
  userRole
}: SupplierSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDelivery, setFilterDelivery] = useState<'all' | 'livre' | 'attente'>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<Supplier | null>(null);

  // Delete confirmation
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(val);
  };

  const getSupplierTotalHT = (s: Supplier): number => {
    if (s.produits && s.produits.length > 0) {
      return s.produits.reduce((sum, p) => sum + ((p.prixUnitaire || 0) * (p.quantite || 1)), 0);
    }
    return (s.prixUnitaire || 0) * (s.quantite || 1);
  };

  const getSupplierTotalTTC = (s: Supplier): number => {
    const ht = getSupplierTotalHT(s);
    return s.tvaApplicable ? Math.round(ht * 1.19) : ht;
  };

  const handleOpenAddForm = () => {
    setSelectedSupplierForEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (supplier: Supplier) => {
    setSelectedSupplierForEdit(supplier);
    setIsFormOpen(true);
  };

  const handleSaveSupplier = (supplier: Supplier) => {
    if (selectedSupplierForEdit) {
      onEditSupplier(supplier);
    } else {
      onAddSupplier(supplier);
    }
    setIsFormOpen(false);
  };

  const confirmDelete = (id: string) => {
    setSupplierToDelete(id);
  };

  const executeDelete = () => {
    if (supplierToDelete) {
      onDeleteSupplier(supplierToDelete);
      setSupplierToDelete(null);
    }
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((supplier) => {
    const productsSearchStr = supplier.produits && supplier.produits.length > 0
      ? supplier.produits.map(p => p.produit).join(' ')
      : supplier.articleAchete;

    const matchesSearch = 
      supplier.nomPrenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productsSearchStr.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDelivery = 
      filterDelivery === 'all' ? true :
      filterDelivery === 'livre' ? supplier.livre : !supplier.livre;

    return matchesSearch && matchesDelivery;
  });

  // Financial summary calculations
  const totalTTCAll = filteredSuppliers.reduce((sum, s) => sum + getSupplierTotalTTC(s), 0);
  const totalPayeAll = filteredSuppliers.reduce((sum, s) => sum + (s.montantPaye ?? getSupplierTotalTTC(s)), 0);
  const totalResteAll = Math.max(0, totalTTCAll - totalPayeAll);

  return (
    <div id="suppliers-section-container" className="space-y-4">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            Gestion des Fournisseurs & Achats Multi-Produits
          </h2>
          <p className="text-sm text-slate-500 leading-tight mt-1">
            Approvisionnements de matières premières et d'équipements frigorifiques. Les articles s'intègrent automatiquement au stock.
          </p>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-xs transition-all duration-150 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5 text-slate-950" />
          Enregistrer un Achat
        </button>
      </div>

      {/* Filters Area */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par fournisseur, matériel ou équipement..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-amber-500 focus:outline-hidden transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1 uppercase tracking-wide">
            <Filter className="w-3.5 h-3.5" /> État Livraison :
          </span>
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs">
            <button
              onClick={() => setFilterDelivery('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${filterDelivery === 'all' ? 'bg-white text-slate-900 shadow-3xs font-black' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterDelivery('livre')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${filterDelivery === 'livre' ? 'bg-white text-emerald-700 shadow-3xs font-black' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Livrés
            </button>
            <button
              onClick={() => setFilterDelivery('attente')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${filterDelivery === 'attente' ? 'bg-white text-amber-700 shadow-3xs font-black' : 'text-slate-500 hover:text-slate-800'}`}
            >
              En attente
            </button>
          </div>
        </div>
      </div>

      {/* Supplier Purchase Table */}
      {filteredSuppliers.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                  <th className="px-5 py-3.5">Fournisseur & Date</th>
                  <th className="px-5 py-3.5">Produit(s) Acheté(s)</th>
                  <th className="px-5 py-3.5">Total Commande</th>
                  <th className="px-5 py-3.5">Règlement Fournisseur</th>
                  <th className="px-5 py-3.5">État Livraison</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredSuppliers.map((supplier) => {
                  const totalTTC = getSupplierTotalTTC(supplier);
                  const montantPaye = supplier.montantPaye ?? totalTTC;
                  const resteAPayer = Math.max(0, totalTTC - montantPaye);
                  const pourcentagePaye = totalTTC > 0 ? Math.min(100, Math.round((montantPaye / totalTTC) * 100)) : 0;

                  const hasMultipleProducts = supplier.produits && supplier.produits.length > 0;

                  return (
                    <tr 
                      key={supplier.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Supplier and Date */}
                      <td className="px-5 py-4">
                        <div className="leading-tight space-y-1">
                          <p className="font-extrabold text-slate-900 text-base">{supplier.nomPrenom}</p>
                          {supplier.telephone && (
                            <a 
                              href={`tel:${supplier.telephone.replace(/\s/g, '')}`}
                              className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-bold font-mono hover:underline"
                              title="Cliquer pour appeler"
                            >
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              {supplier.telephone}
                            </a>
                          )}
                          <span className="flex items-center gap-1 text-xs text-slate-400 font-mono block">
                            <Calendar className="w-3 h-3 text-slate-300" />
                            {new Date(supplier.dateAchat).toLocaleDateString('fr-DZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </td>

                      {/* Purchased Products (Multi-product display) */}
                      <td className="px-5 py-4">
                        {hasMultipleProducts ? (
                          <div className="space-y-1.5 max-w-xs">
                            {supplier.produits!.map((prod, idx) => (
                              <div key={prod.id || idx} className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800 flex items-center gap-1 truncate" title={prod.produit}>
                                  <Layers className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                  {prod.produit}
                                </span>
                                <span className="font-mono text-[11px] font-black text-slate-500 ml-2">
                                  {prod.quantite} x {formatCurrency(prod.prixUnitaire)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-800 border border-slate-200 max-w-[260px] truncate" title={supplier.articleAchete}>
                            <Layers className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            {supplier.articleAchete} (x{supplier.quantite})
                          </span>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="px-5 py-4 font-mono text-sm">
                        <div className="leading-tight">
                          <p className="font-black text-slate-950 text-base">
                            {formatCurrency(totalTTC)}
                          </p>
                          {supplier.tvaApplicable && (
                            <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wide block">
                              TTC (TVA 19%)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Payment Progress / Montant Payé au Fournisseur */}
                      <td className="px-5 py-4">
                        <div className="space-y-1 max-w-[170px]">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              pourcentagePaye === 100
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : pourcentagePaye > 0
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              <CreditCard className="w-3 h-3" />
                              {pourcentagePaye === 100 ? 'Payé 100%' : `Acompte ${pourcentagePaye}%`}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                pourcentagePaye === 100 ? 'bg-emerald-500' : pourcentagePaye > 0 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${pourcentagePaye}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-[11px] font-mono">
                            <span className="text-slate-400 font-sans">Payé:</span>
                            <span className="font-bold text-slate-800">{formatCurrency(montantPaye)}</span>
                          </div>

                          {resteAPayer > 0 && (
                            <div className="flex justify-between items-center text-[10px] font-mono text-amber-700">
                              <span className="font-sans font-bold">Reste dû:</span>
                              <span className="font-black">{formatCurrency(resteAPayer)}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Delivery Status */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => onToggleDeliveryStatus(supplier.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer select-none transition-all duration-150 active:scale-95 ${
                            supplier.livre 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50' 
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/50'
                          }`}
                          title="Cliquer pour changer l'état de livraison"
                        >
                          {supplier.livre ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Livré en Stock
                            </>
                          ) : (
                            <>
                              <Hourglass className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                              En transit
                            </>
                          )}
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditForm(supplier)}
                            className="p-2 hover:bg-slate-100 hover:text-slate-700 text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title="Modifier cet achat"
                          >
                            <Edit className="w-4.5 h-4.5" />
                          </button>
                          {userRole === 'admin' && (
                            <button
                              onClick={() => confirmDelete(supplier.id)}
                              className="p-2 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer cet achat"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer with Detailed Financial Summary */}
          <div className="bg-slate-900 text-white px-5 py-4 border-t border-slate-800 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-sans">
            <span className="text-slate-400 font-medium">
              Affichage de <strong className="text-white">{filteredSuppliers.length}</strong> commande{filteredSuppliers.length > 1 ? 's' : ''} d'achat
            </span>
            
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 font-sans text-[10px] uppercase font-bold mr-2">Total Achats :</span>
                <span className="font-black text-white">{formatCurrency(totalTTCAll)}</span>
              </div>
              <div className="bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800/60">
                <span className="text-emerald-400 font-sans text-[10px] uppercase font-bold mr-2">Total Déboursé :</span>
                <span className="font-black text-emerald-400">{formatCurrency(totalPayeAll)}</span>
              </div>
              <div className="bg-amber-950/80 px-3 py-1.5 rounded-lg border border-amber-800/60">
                <span className="text-amber-400 font-sans text-[10px] uppercase font-bold mr-2">Reste Dû :</span>
                <span className="font-black text-amber-400">{formatCurrency(totalResteAll)}</span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-3xs">
          <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-xs font-bold text-slate-700 mb-0.5">Aucune transaction d'achat trouvée</h3>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto mb-3">
            {searchTerm || filterDelivery !== 'all'
              ? 'Aucun achat ne correspond à vos filtres de recherche actuels.'
              : 'Aucun enregistrement d\'achat n\'a été ajouté pour le moment.'}
          </p>
          {(searchTerm || filterDelivery !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterDelivery('all');
              }}
              className="px-3 py-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {supplierToDelete && (
        <div id="delete-supplier-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-base mb-1.5">Supprimer cet achat ?</h4>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement la transaction d'achat de{' '}
              <strong className="text-slate-700">{suppliers.find(s => s.id === supplierToDelete)?.articleAchete}</strong> auprès du fournisseur{' '}
              <strong className="text-slate-700">{suppliers.find(s => s.id === supplierToDelete)?.nomPrenom}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSupplierToDelete(null)}
                className="flex-1 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Form Modal */}
      {isFormOpen && (
        <SupplierFormModal
          supplier={selectedSupplierForEdit}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveSupplier}
          stockItems={stockItems}
        />
      )}

    </div>
  );
}
