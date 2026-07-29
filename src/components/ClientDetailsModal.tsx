/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, AttachedFile } from '../types';
import { DocumentType } from './DocumentViewerModal';
import { X, Phone, Mail, Building2, FileText, Clipboard, Check, DollarSign, AlertCircle, Edit, Download, Eye, Snowflake, Thermometer, ShieldAlert, FileCheck, Truck, Printer, Clock } from 'lucide-react';

interface ClientDetailsModalProps {
  client: Client | null;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onViewFile: (file: AttachedFile) => void;
  onViewDocument?: (client: Client, type: DocumentType) => void;
  userRole?: 'admin' | 'commercial' | 'gestionnaire_stock';
}

export default function ClientDetailsModal({ client, onClose, onEdit, onViewFile, onViewDocument, userRole }: ClientDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!client) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(val);
  };

  const renderFileCard = (file: AttachedFile | null, title: string) => {
    if (!file) {
      return (
        <div className="border border-dashed border-slate-200 rounded-xl p-4 flex items-center gap-3.5 bg-slate-50/50 text-slate-400">
          <FileText className="w-5 h-5 opacity-40 flex-shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1 leading-normal">
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider leading-none">{title}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Non joint au dossier</p>
          </div>
        </div>
      );
    }

    return (
      <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-amber-400 hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 group">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
            <FileText className="w-5 h-5 text-[#f5be1a]" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider leading-none">{title}</p>
            <p className="text-sm text-slate-800 font-bold truncate max-w-[200px] mt-1.5 font-mono" title={file.name}>
              {file.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onViewFile(file)}
            className="inline-flex items-center justify-center p-2 bg-slate-50 hover:bg-slate-200 hover:text-slate-900 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Visualiser le document"
          >
            <Eye className="w-4.5 h-4.5" />
          </button>
          <a
            href={file.dataUrl}
            download={file.name}
            className="inline-flex items-center justify-center p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors text-center cursor-pointer"
            title="Télécharger"
          >
            <Download className="w-4.5 h-4.5 text-[#f5be1a]" />
          </a>
        </div>
      </div>
    );
  };

  return (
    <div id="client-details-backdrop" className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div id="client-details-content" className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full my-auto overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Sleek Dark Slate Brand Identity with Accent Line */}
        <div className="relative flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-200 bg-slate-950 text-white">
          {/* Branded highlight border top */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#f5be1a]" />
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f5be1a] to-amber-600 flex items-center justify-center border border-amber-400 shadow-md font-black text-slate-950 text-base tracking-wider uppercase flex-shrink-0">
              {client.nomPrenom.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase font-sans flex flex-wrap items-center gap-2">
                <span>{client.nomPrenom}</span>
                {client.segment === 'surgele' ? (
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-full bg-cyan-950/40 tracking-wider">
                    <Snowflake className="w-3 h-3 text-cyan-400 animate-pulse" /> Surgelé
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full bg-amber-950/40 tracking-wider">
                    <Thermometer className="w-3 h-3 text-amber-400" /> Frais
                  </span>
                )}
                {client.enAttente ? (
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-amber-300 border border-amber-400/50 px-2.5 py-1 rounded-full bg-amber-950/80 tracking-wider shadow-xs">
                    <Clock className="w-3 h-3 text-amber-400" /> En Attente
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full bg-emerald-950/40 tracking-wider">
                    <Check className="w-3 h-3 text-emerald-400" /> Validé
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                <Building2 className="w-4 h-4 text-[#f5be1a]" />
                <span className="font-medium">
                  Dossier d'installation • Enregistré le {new Date(client.createdAt).toLocaleDateString('fr-DZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Panel with Clean Spacing & Generous Negative Space */}
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[70vh] grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Column Left: Main Info & Commercial pricing (7/12) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            
            {/* General Contact Card */}
            <div className="bg-slate-50/60 rounded-2xl p-5 sm:p-6 border border-slate-200/80">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-200/60">
                Contact & Communication
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600 flex-shrink-0 border border-amber-100">
                    <Phone className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Téléphone</p>
                    <a href={`tel:${client.telephone}`} className="text-sm sm:text-base font-black font-mono text-slate-900 hover:text-amber-600 hover:underline transition-colors block mt-1.5">
                      {client.telephone || 'Non renseigné'}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600 flex-shrink-0 border border-amber-100">
                    <Mail className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">E-mail de contact</p>
                    <a href={`mailto:${client.email}`} className="text-sm sm:text-base font-black text-slate-900 hover:text-amber-600 hover:underline truncate block mt-1.5 transition-colors" title={client.email}>
                      {client.email || 'Non renseigné'}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Détails de l'Achat */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-200/60">
                Type de Client & Avancement de la Commande
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Type de Client</p>
                  <div className="mt-2">
                    {client.typeClient === 'production' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase bg-purple-100 text-purple-900 border border-purple-300">
                        Production
                      </span>
                    ) : client.typeClient === 'technicien_froid' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase bg-teal-100 text-teal-900 border border-teal-300">
                        Technicien en froid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase bg-blue-100 text-blue-900 border border-blue-300">
                        Carrossier
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">État d'avancement de la commande</p>
                  <div className="mt-2">
                    {client.typeClient === 'production' ? (
                      <div className="flex items-center gap-2">
                        {client.etapeCommande === 'stratification' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                            1- Stratification
                          </span>
                        )}
                        {client.etapeCommande === 'montage' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase bg-blue-100 text-blue-900 border border-blue-300">
                            2- Montage
                          </span>
                        )}
                        {client.etapeCommande === 'finition' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase bg-purple-100 text-purple-900 border border-purple-300">
                            3- Finition
                          </span>
                        )}
                        {client.etapeCommande === 'livraison' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                            4- Livraison
                          </span>
                        )}
                        {(!client.etapeCommande) && (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                            1- Stratification
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 italic">Non applicable (réservé au type Production)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Détail de Vente Général</span>
                    <span className="text-xs font-black text-amber-900 bg-amber-100/80 border border-amber-300 px-2.5 py-1 rounded-lg mt-0.5 inline-block">
                      {client.detailVente || 'Caisse frigorifique positive'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Régime TVA</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg mt-0.5 inline-block ${
                      client.tvaApplicable !== false 
                        ? 'text-emerald-900 bg-emerald-100 border border-emerald-300' 
                        : 'text-slate-700 bg-slate-200 border border-slate-300'
                    }`}>
                      {client.tvaApplicable !== false ? 'Assujetti TVA (19%)' : 'Exonéré TVA (0%)'}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none pt-1">
                  Articles / Produits Achetés ({client.produits?.length || 1})
                </p>
                {client.produits && client.produits.length > 0 ? (
                  <div className="space-y-2">
                    {client.produits.map((item, idx) => (
                      <div key={item.id || idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-800 font-extrabold text-[10px] flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <span className="font-extrabold text-slate-900">{item.produit}</span>
                          {item.segment === 'surgele' ? (
                            <span className="text-[10px] font-bold uppercase text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-md">
                              Surgelé (-20°C)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              Frais (+4°C)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="font-extrabold text-slate-700">Qté: {item.quantite}</span>
                          <span className="font-extrabold text-amber-700">{formatCurrency((item.prixApresRemise || item.prixBase) * item.quantite)} HT</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Article / Produit acheté</p>
                      <p className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                        {client.produit || 'Fourgon Isotherme'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Quantité</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-1.5 font-mono">
                        {client.quantite ?? 1} { (client.quantite ?? 1) > 1 ? 'unités' : 'unité' }
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Date d'achat effective :</span>
                  <span className="font-extrabold text-slate-800 font-mono">
                    {client.dateAchat ? new Date(client.dateAchat).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : (client.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : '-')}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Status Section */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-200/60 flex justify-between items-center">
                <span>Conditions Commerciales & Tarification</span>
                <span className="text-[10px] text-slate-400 font-mono tracking-normal font-bold">Base de données Centrale</span>
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                {(() => {
                  const totalHT = client.produits && client.produits.length > 0
                    ? client.produits.reduce((sum, item) => sum + ((item.prixApresRemise || item.prixBase || 0) * (item.quantite || 1)), 0)
                    : (client.prixApresRemise || client.prixBase || 0);
                  const totalTVA = client.tvaApplicable !== false ? Math.round(totalHT * 0.19) : 0;
                  const totalTTC = totalHT + totalTVA;

                  return (
                    <>
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200 leading-normal">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider leading-none mb-1.5">Total HT Commande</p>
                        <p className="text-xs sm:text-sm font-black font-mono text-slate-800">{formatCurrency(totalHT)}</p>
                      </div>
                      
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between leading-normal">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider leading-none mb-1.5">Remise</p>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-black leading-none uppercase ${client.remise ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600'}`}>
                            {client.remise ? 'OUI' : 'NON'}
                          </span>
                          {client.remise && (
                            <span className="text-xs font-black text-emerald-600 font-mono">-{client.tauxRemise}%</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between leading-normal">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider leading-none mb-1.5">TVA (19%)</p>
                        <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-md text-[9px] font-black leading-none uppercase ${client.tvaApplicable !== false ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-200 text-slate-600'}`}>
                          {client.tvaApplicable !== false ? 'OUI (19%)' : 'NON (0%)'}
                        </span>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between leading-normal shadow-xs">
                        <p className="text-[9px] text-amber-300 font-black uppercase tracking-wider leading-none mb-1.5">Total Général TTC</p>
                        <p className="text-sm font-black font-mono text-white leading-none">
                          {formatCurrency(totalTTC)}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {client.remise && (
                <div className="text-xs bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/80 text-emerald-800 flex items-center gap-2 font-bold mb-4">
                  <DollarSign className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Remise accordée appliquée sur le montant de la commande
                  </span>
                </div>
              )}

              {/* Suivi de l'état d'avancement de paiement */}
              <div className="pt-4 border-t border-slate-100 space-y-3.5">
                {(() => {
                  const totalHT = client.produits && client.produits.length > 0
                    ? client.produits.reduce((sum, item) => sum + ((item.prixApresRemise || item.prixBase || 0) * (item.quantite || 1)), 0)
                    : (client.prixApresRemise || client.prixBase || 0);
                  const totalTVA = client.tvaApplicable !== false ? Math.round(totalHT * 0.19) : 0;
                  const totalContratTTC = totalHT + totalTVA;
                  const montantPaye = client.montantPaye || 0;
                  const reste = Math.max(0, totalContratTTC - montantPaye);
                  const pourcentage = totalContratTTC > 0 ? Math.min(100, Math.round((montantPaye / totalContratTTC) * 100)) : 0;

                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Échéancier & État de Règlement</h5>
                        {pourcentage === 100 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full leading-none">
                            ✓ Entièrement Payé (100%)
                          </span>
                        ) : pourcentage > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full leading-none">
                            ⚡ Acompte Versé ({pourcentage}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-red-50 text-red-650 border border-red-200 px-2.5 py-1 rounded-full leading-none">
                            ⚠️ En Attente de Règlement (0%)
                          </span>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        {/* Bar and percent text */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-bold">Pourcentage payé :</span>
                          <span className="font-mono font-black text-slate-900">{pourcentage}%</span>
                        </div>

                        {/* Custom styled track & progress fill */}
                        <div className="w-full bg-slate-100 border border-slate-200/60 rounded-full h-3 overflow-hidden p-0.5">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              pourcentage === 100 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-3xs' 
                                : pourcentage > 0 
                                  ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
                                  : 'bg-red-400'
                            }`}
                            style={{ width: `${pourcentage}%` }}
                          />
                        </div>

                        {/* Details row showing Paid / Total / Balance */}
                        <div className="grid grid-cols-3 gap-2 text-xs font-mono font-bold leading-tight pt-1.5 text-center">
                          <div className="bg-slate-50 border border-slate-150 rounded-xl p-2.5">
                            <span className="text-[8px] text-slate-400 font-sans block uppercase font-black tracking-wider mb-1">Total Commande ({client.quantite || 1} Qté)</span>
                            <span className="text-slate-800 text-[10px] sm:text-xs">{formatCurrency(totalContratTTC)}</span>
                          </div>
                          <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-2.5">
                            <span className="text-[8px] text-emerald-700 font-sans block uppercase font-black tracking-wider mb-1">Montant Payé (Acompte)</span>
                            <span className="text-emerald-700 text-[10px] sm:text-xs">{formatCurrency(montantPaye)}</span>
                          </div>
                          <div className={`border rounded-xl p-2.5 ${reste > 0 ? 'bg-amber-50/30 border-amber-200' : 'bg-slate-50 border-slate-150'}`}>
                            <span className="text-[8px] text-slate-400 font-sans block uppercase font-black tracking-wider mb-1">Reste à Régler</span>
                            <span className={`text-[10px] sm:text-xs ${reste > 0 ? 'text-amber-600 font-black' : 'text-slate-500'}`}>
                              {formatCurrency(reste)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Official Document Generator & Printer Buttons */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-amber-400" />
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">
                    Documents Officiels Carpôle ERP
                  </h4>
                </div>
                <span className="text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-mono">
                  Édition & Impression
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Générez les documents comptables et logistiques officiels avec le logo et les identifiants fiscaux de la SARL Carpôle Industriel.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onViewDocument && onViewDocument(client, 'facture')}
                  className="flex flex-col items-center justify-center p-3.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 hover:border-amber-400 rounded-xl transition-all cursor-pointer group text-center space-y-1.5 shadow-3xs"
                >
                  <FileText className="w-5 h-5 text-amber-400 group-hover:text-slate-950 transition-colors" />
                  <span className="text-xs font-black uppercase tracking-wider">Facture</span>
                  <span className="text-[9px] text-slate-400 group-hover:text-slate-900 font-medium">Acompte 30% / Finale</span>
                </button>

                <button
                  type="button"
                  onClick={() => onViewDocument && onViewDocument(client, 'bon_commande')}
                  className="flex flex-col items-center justify-center p-3.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 hover:border-amber-400 rounded-xl transition-all cursor-pointer group text-center space-y-1.5 shadow-3xs"
                >
                  <FileCheck className="w-5 h-5 text-amber-400 group-hover:text-slate-950 transition-colors" />
                  <span className="text-xs font-black uppercase tracking-wider">Bon de Commande</span>
                  <span className="text-[9px] text-slate-400 group-hover:text-slate-900 font-medium">BC Officiel</span>
                </button>

                <button
                  type="button"
                  onClick={() => onViewDocument && onViewDocument(client, 'bon_livraison')}
                  className="flex flex-col items-center justify-center p-3.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 hover:border-amber-400 rounded-xl transition-all cursor-pointer group text-center space-y-1.5 shadow-3xs"
                >
                  <Truck className="w-5 h-5 text-amber-400 group-hover:text-slate-950 transition-colors" />
                  <span className="text-xs font-black uppercase tracking-wider">Bon de Livraison</span>
                  <span className="text-[9px] text-slate-400 group-hover:text-slate-900 font-medium">BL et Réception</span>
                </button>
              </div>
            </div>

            {/* Retours & Notes techniques */}
            <div className="bg-slate-50/40 rounded-2xl p-5 sm:p-6 border border-slate-200/80">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200/60">
                <AlertCircle className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Suivi des Retours & Ajustements</h4>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-slate-700 text-sm min-h-[80px] max-h-[140px] overflow-y-auto leading-relaxed shadow-3xs">
                {client.retour ? (
                  <p className="whitespace-pre-wrap font-medium">{client.retour}</p>
                ) : (
                  <p className="text-slate-400 italic font-medium">Aucune observation ou retour technique enregistré pour ce dossier d'installation.</p>
                )}
              </div>
            </div>

          </div>

          {/* Column Right: Taxes IDs & Files Attachments (5/12) */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            
            {/* Tax Registrations */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-200/60">
                Identifiants Fiscaux
              </h4>
              
              <div className="divide-y divide-slate-100">
                {/* Registre de Commerce */}
                <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 group">
                  <div className="min-w-0 pr-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Registre de Commerce (RC)</p>
                    <p className="text-sm font-mono font-extrabold text-slate-950 mt-1.5 truncate">{client.rc || 'Néant'}</p>
                  </div>
                  {client.rc && (
                    <button 
                      onClick={() => handleCopy(client.rc, 'rc')} 
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer flex-shrink-0"
                      title="Copier le RC"
                    >
                      {copiedField === 'rc' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <Check className="w-4 h-4" /> Copié
                        </span>
                      ) : (
                        <Clipboard className="w-4.5 h-4.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* NIF */}
                <div className="flex items-center justify-between py-2.5 last:pb-0 group">
                  <div className="min-w-0 pr-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Identifiant Fiscal (NIF)</p>
                    <p className="text-sm font-mono font-extrabold text-slate-950 mt-1.5 truncate">{client.nif || 'Néant'}</p>
                  </div>
                  {client.nif && (
                    <button 
                      onClick={() => handleCopy(client.nif, 'nif')} 
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer flex-shrink-0"
                      title="Copier le NIF"
                    >
                      {copiedField === 'nif' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <Check className="w-4 h-4" /> Copié
                        </span>
                      ) : (
                        <Clipboard className="w-4.5 h-4.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* NIS */}
                <div className="flex items-center justify-between py-2.5 last:pb-0 group">
                  <div className="min-w-0 pr-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Numéro d'Identification Statistique (NIS)</p>
                    <p className="text-sm font-mono font-extrabold text-slate-950 mt-1.5 truncate">{client.nis || 'Néant'}</p>
                  </div>
                  {client.nis && (
                    <button 
                      onClick={() => handleCopy(client.nis, 'nis')} 
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer flex-shrink-0"
                      title="Copier le NIS"
                    >
                      {copiedField === 'nis' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <Check className="w-4 h-4" /> Copié
                        </span>
                      ) : (
                        <Clipboard className="w-4.5 h-4.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Numéro d'Article */}
                <div className="flex items-center justify-between py-2.5 last:pb-0 group">
                  <div className="min-w-0 pr-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Article d'Imposition (Art)</p>
                    <p className="text-sm font-mono font-extrabold text-slate-950 mt-1.5 truncate">{client.numArticle || 'Néant'}</p>
                  </div>
                  {client.numArticle && (
                    <button 
                      onClick={() => handleCopy(client.numArticle, 'numArticle')} 
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer flex-shrink-0"
                      title="Copier le numéro d'article"
                    >
                      {copiedField === 'numArticle' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <Check className="w-4 h-4" /> Copié
                        </span>
                      ) : (
                        <Clipboard className="w-4.5 h-4.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Attached Documents */}
            <div className="bg-slate-50/60 rounded-2xl p-5 sm:p-6 border border-slate-200/80">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-250">
                Documents Contractuels (PDF)
              </h4>
              {userRole === 'admin' ? (
                <div className="grid grid-cols-1 gap-3">
                  {renderFileCard(client.bonCommande, 'Bon de Commande')}
                  {renderFileCard(client.facture, 'Facture Client')}
                  {renderFileCard(client.bonLivraison, 'Bon de Livraison')}
                </div>
              ) : (
                <div className="text-center p-4 bg-white border border-slate-200 rounded-xl">
                  <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">Accès aux fichiers sécurisé</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    La consultation et le téléchargement des documents contractuels (Bon de commande, facture, bon de livraison) sont réservés à l'Administrateur.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer - Clear Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 sm:px-8 py-4 sm:py-5 border-t border-slate-200 bg-slate-50 gap-3">
          <div className="text-xs text-slate-400 italic order-2 sm:order-1 self-start sm:self-center font-mono">
            ID Dossier: <span className="font-bold">{client.id}</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2 justify-end">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-6 py-2.5 text-sm font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-3xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                onEdit(client);
                onClose();
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-black text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-all cursor-pointer uppercase"
            >
              <Edit className="w-4 h-4 text-slate-950" />
              Modifier le Dossier
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
