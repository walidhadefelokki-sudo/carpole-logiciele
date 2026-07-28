/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client } from '../types';
import { CarpoleLogo } from './CarpoleLogo';
import { Printer, X, FileText, CheckCircle2, Truck, FileCheck, DollarSign, Building2, Calendar, ShieldCheck, Factory, Layers, Info } from 'lucide-react';

export type DocumentType = 'facture' | 'bon_commande' | 'bon_livraison';
export type FactureVariant = 'auto' | 'acompte_30' | 'acompte_custom' | 'solde' | 'proforma';

interface DocumentViewerModalProps {
  client: Client | null;
  initialType?: DocumentType;
  onClose: () => void;
}

// Helper to convert numbers to French text for legal amount mention
function numberToFrenchWords(amount: number): string {
  if (amount === 0) return 'zéro dinar algérien';

  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

  function convertGroup(n: number): string {
    let str = '';
    const h = Math.floor(n / 100);
    const r = n % 100;

    if (h > 0) {
      if (h === 1) {
        str += 'cent';
      } else {
        str += units[h] + (r === 0 ? ' cents' : ' cent');
      }
    }

    if (r > 0) {
      if (str.length > 0) str += ' ';
      if (r < 10) {
        str += units[r];
      } else if (r < 20) {
        str += teens[r - 10];
      } else if (r >= 20 && r < 70) {
        const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
        const t = Math.floor(r / 10);
        const u = r % 10;
        if (u === 0) {
          str += tens[t];
        } else if (u === 1) {
          str += tens[t] + ' et un';
        } else {
          str += tens[t] + '-' + units[u];
        }
      } else if (r >= 70 && r < 80) {
        const u = r - 60;
        if (u === 11) {
          str += 'soixante et onze';
        } else {
          str += 'soixante-' + teens[u - 10];
        }
      } else if (r >= 80 && r < 90) {
        const u = r % 10;
        if (u === 0) {
          str += 'quatre-vingts';
        } else {
          str += 'quatre-vingt-' + units[u];
        }
      } else if (r >= 90 && r < 100) {
        const u = r - 80;
        str += 'quatre-vingt-' + teens[u - 10];
      }
    }
    return str.trim();
  }

  const millions = Math.floor(amount / 1000000);
  const thousands = Math.floor((amount % 1000000) / 1000);
  const remainder = Math.floor(amount % 1000);

  let result = '';

  if (millions > 0) {
    if (millions === 1) result += 'un million ';
    else result += convertGroup(millions) + ' millions ';
  }

  if (thousands > 0) {
    if (thousands === 1) result += 'mille ';
    else result += convertGroup(thousands) + ' mille ';
  }

  if (remainder > 0) {
    result += convertGroup(remainder);
  }

  return result.trim() + (amount > 1 ? ' Dinars Algériens' : ' Dinar Algérien');
}

export default function DocumentViewerModal({ client, initialType = 'facture', onClose }: DocumentViewerModalProps) {
  const [docType, setDocType] = useState<DocumentType>(initialType);
  const [factureVariant, setFactureVariant] = useState<FactureVariant>('auto');

  if (!client) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleDateString('fr-DZ', { day: 'numeric', month: 'long', year: 'numeric' });
    try {
      return new Date(dateStr).toLocaleDateString('fr-DZ', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // Financial Calculations
  const hasProductsArray = !!(client.produits && client.produits.length > 0);
  const qte = client.quantite || 1;
  const unitPriceTTC = client.prixApresRemise || client.prixBase || 0;

  const totalTTC = hasProductsArray
    ? client.produits!.reduce((sum, item) => sum + ((item.prixApresRemise || item.prixBase) * (item.quantite || 1)), 0)
    : unitPriceTTC * qte;

  // 19% TVA standard in Algeria
  const unitPriceHT = Math.round(unitPriceTTC / 1.19);
  const totalHT = Math.round(totalTTC / 1.19);
  const totalTVA = totalTTC - totalHT;

  const montantPaye = client.montantPaye || 0;
  const soldeRestant = Math.max(0, totalTTC - montantPaye);
  const pourcentagePaye = totalTTC > 0 ? Math.round((montantPaye / totalTTC) * 100) : 0;

  // Determine active invoice type
  let activeFactureType = 'FACTURE D\'ACOMPTE';
  let acompteLabel = 'Acompte versé';
  let montantFactureTTC = montantPaye;

  if (factureVariant === 'proforma' || (factureVariant === 'auto' && montantPaye === 0)) {
    activeFactureType = 'FACTURE PROFORMA';
    montantFactureTTC = totalTTC;
  } else if (factureVariant === 'solde' || (factureVariant === 'auto' && montantPaye >= totalTTC && totalTTC > 0)) {
    activeFactureType = 'FACTURE DÉFINITIVE & SOLDE';
    montantFactureTTC = totalTTC;
  } else if (factureVariant === 'acompte_30') {
    activeFactureType = 'FACTURE D\'ACOMPTE (30%)';
    const min30 = Math.round(totalTTC * 0.3);
    montantFactureTTC = min30;
    acompteLabel = 'Acompte 30% obligatoire';
  } else {
    // Auto or custom payment
    if (pourcentagePaye === 30) {
      activeFactureType = 'FACTURE D\'ACOMPTE (30%)';
    } else if (pourcentagePaye > 30) {
      activeFactureType = `FACTURE D'ACOMPTE (${pourcentagePaye}%)`;
    } else {
      activeFactureType = `FACTURE D'ACOMPTE (${pourcentagePaye}%)`;
    }
    montantFactureTTC = montantPaye;
  }

  const docNumber = docType === 'facture'
    ? `FAC-${new Date().getFullYear()}-${client.id.substring(0, 5).toUpperCase()}`
    : docType === 'bon_commande'
    ? `BC-${new Date().getFullYear()}-${client.id.substring(0, 5).toUpperCase()}`
    : `BL-${new Date().getFullYear()}-${client.id.substring(0, 5).toUpperCase()}`;

  const docTitle = docType === 'facture'
    ? activeFactureType
    : docType === 'bon_commande'
    ? 'BON DE COMMANDE'
    : 'BON DE LIVRAISON';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0 print:z-9999">
      
      {/* Printable Style Sheet Injection for exact clean A4 page printing */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 12pt;
          }
          /* Hide non-printable UI components */
          .no-print, header, nav, button, .print-hidden {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
          }
        }
      `}</style>

      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh] print-full-width print:max-h-none print:shadow-none print:border-none">
        
        {/* Top Control Bar - Hidden during printing */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-900 border-b border-slate-800 text-white shrink-0">
          
          {/* Document Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-700">
            <button
              type="button"
              onClick={() => setDocType('facture')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                docType === 'facture'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Facture</span>
            </button>

            <button
              type="button"
              onClick={() => setDocType('bon_commande')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                docType === 'bon_commande'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Bon de Commande (BC)</span>
            </button>

            <button
              type="button"
              onClick={() => setDocType('bon_livraison')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                docType === 'bon_livraison'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Bon de Livraison (BL)</span>
            </button>
          </div>

          {/* Action Buttons: Imprimer & Close */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-amber-300"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer {docType === 'facture' ? 'la Facture' : docType === 'bon_commande' ? 'le Bon de Commande' : 'le Bon de Livraison'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Facture Option Toolbar (Specific for Facture variants based on payments) */}
        {docType === 'facture' && (
          <div className="no-print bg-amber-50/90 border-b border-amber-200/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-950 font-bold">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                État du Règlement : <strong className="font-black font-mono text-amber-900">{formatCurrency(montantPaye)}</strong> payés sur <strong className="font-black font-mono text-amber-900">{formatCurrency(totalTTC)}</strong> ({pourcentagePaye}%)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-amber-800">Modèle de facture :</span>
              <select
                value={factureVariant}
                onChange={(e) => setFactureVariant(e.target.value as FactureVariant)}
                className="bg-white border border-amber-300 text-slate-900 font-bold text-xs py-1 px-2.5 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-3xs"
              >
                <option value="auto">Automatique (Détecter selon versement)</option>
                <option value="acompte_30">Facture d'Acompte (30% obligatoire)</option>
                <option value="acompte_custom">Facture d'Acompte (Montant versé)</option>
                <option value="solde">Facture de Solde / Finale (100%)</option>
                <option value="proforma">Facture Proforma / Devis</option>
              </select>
            </div>
          </div>
        )}

        {/* Printable Document Sheet Content */}
        <div id="printable-document" className="p-8 sm:p-10 overflow-y-auto bg-white text-slate-900 font-sans print:p-0 print:overflow-visible">
          
          {/* Header Section: Logo & Company Address */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
            
            {/* Left: Official Carpole Logo & Subtitle */}
            <div className="space-y-2 max-w-sm">
              <div className="w-52 h-16 flex items-center">
                <CarpoleLogo width="210" height="65" textColor="#0f172a" subtitleColor="#d97706" />
              </div>
              <div className="text-[11px] text-slate-600 font-medium leading-relaxed pt-1">
                <p className="font-black text-slate-900 text-xs uppercase tracking-wide">SARL CARPÔLE INDUSTRIEL</p>
                <p className="text-[10px] text-slate-500 font-medium pb-0.5">Fabrication d'équipements isothermes & carrosseries frigorifiques</p>
                <p><strong className="text-slate-800 font-bold">Adresse de l’Atelier :</strong> Chaab Ersas, Lot F, N° M1, Constantine</p>
                <p><strong className="text-slate-800 font-bold">Téléphone & WhatsApp :</strong> 0770 97 32 53 / 0770 97 32 03</p>
                <p><strong className="text-slate-800 font-bold">Email de contact :</strong> a.derrouiche@motorest-dz.com</p>
                <p><strong className="text-slate-800 font-bold">Web :</strong> www.carpole.dz</p>
              </div>
            </div>

            {/* Right: Company Fiscal Registration Box */}
            <div className="text-right text-[11px] font-mono text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 min-w-[240px] space-y-1">
              <p className="font-extrabold text-slate-900 text-xs border-b border-slate-200 pb-1 mb-1 font-sans uppercase">Identifiants Légaux</p>
              <p><span className="text-slate-500 font-sans">N° RC :</span> 19/00-0123456B19</p>
              <p><span className="text-slate-500 font-sans">N° NIF :</span> 001919012345678</p>
              <p><span className="text-slate-500 font-sans">N° NIS :</span> 001919001002</p>
              <p><span className="text-slate-500 font-sans">N° Article :</span> 19012345678</p>
            </div>
          </div>

          {/* Document Title & Reference Metadata */}
          <div className="my-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 text-white p-4 rounded-xl print:bg-slate-900 print:text-white">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest block font-mono">
                {docType === 'facture' ? 'DOCUMENT COMPTABLE OFFICIEL' : docType === 'bon_commande' ? 'COMMANDE CLIENT' : 'DOCUMENT DE LIVRAISON ET RÉCEPTION'}
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-0.5">
                {docTitle}
              </h1>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-700 pt-2 sm:pt-0 sm:pl-6 leading-tight">
              <p className="text-sm font-black text-amber-400 font-mono tracking-wider">{docNumber}</p>
              <p className="text-xs text-slate-300 font-medium mt-1">Date : <span className="font-bold text-white">{formatDate(client.dateAchat)}</span></p>
            </div>
          </div>

          {/* Client Information Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="space-y-1.5 text-xs">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Informations Client / Destinataire</p>
              <p className="text-base font-black text-slate-900 uppercase">{client.nomPrenom}</p>
              <p className="text-slate-700 font-bold flex items-center gap-1.5">
                <span className="text-slate-400 font-normal">Type Client :</span>
                {client.typeClient === 'production' ? (
                  <span className="text-purple-700 font-extrabold uppercase">Production</span>
                ) : client.typeClient === 'technicien_froid' ? (
                  <span className="text-teal-700 font-extrabold uppercase">Technicien en Froid</span>
                ) : (
                  <span className="text-blue-700 font-extrabold uppercase">Carrossier</span>
                )}
              </p>
              <p className="text-slate-700"><span className="text-slate-400">Téléphone :</span> <strong className="font-mono">{client.telephone || 'Non renseigné'}</strong></p>
              {client.email && <p className="text-slate-700"><span className="text-slate-400">Email :</span> {client.email}</p>}
            </div>

            <div className="space-y-1 text-xs font-mono border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-sans mb-1">Fiscalité Client (Si Pro)</p>
              <p><span className="text-slate-500 font-sans">NIF Client :</span> {client.nif || 'N/A'}</p>
              <p><span className="text-slate-500 font-sans">NIS Client :</span> {client.nis || 'N/A'}</p>
              <p><span className="text-slate-500 font-sans">RC Client :</span> {client.rc || 'N/A'}</p>
              <p><span className="text-slate-500 font-sans">Article :</span> {client.numArticle || 'N/A'}</p>
            </div>
          </div>

          {/* Order Details Table */}
          <div className="my-6 overflow-hidden rounded-xl border border-slate-300">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 w-12 text-center border-r border-slate-800">N°</th>
                  <th className="py-3 px-4 border-r border-slate-800">Désignation de l'Équipement / Produit</th>
                  <th className="py-3 px-4 border-r border-slate-800 text-center w-28">Segment</th>
                  <th className="py-3 px-4 border-r border-slate-800 text-center w-16">Qté</th>
                  <th className="py-3 px-4 border-r border-slate-800 text-right w-32">P.U. HT (DA)</th>
                  <th className="py-3 px-4 text-right w-36">Total HT (DA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {hasProductsArray ? (
                  client.produits!.map((item, idx) => {
                    const itemQte = item.quantite || 1;
                    const itemPriceHT = item.prixApresRemise || item.prixBase || 0;
                    return (
                      <tr key={item.id || idx} className="bg-white hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-500 border-r border-slate-200">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-3.5 px-4 border-r border-slate-200">
                          <p className="font-black text-slate-900 text-sm">{item.produit}</p>
                          <p className="text-[11px] text-amber-800 font-bold mt-0.5">• {client.detailVente || 'Caisse frigorifique'}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center border-r border-slate-200 font-bold">
                          {item.segment === 'surgele' ? (
                            <span className="text-cyan-800 font-black uppercase text-[10px] bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">Surgelé (-20°C)</span>
                          ) : (
                            <span className="text-amber-800 font-black uppercase text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Frais (+4°C)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center border-r border-slate-200 font-black font-mono text-sm">{itemQte}</td>
                        <td className="py-3.5 px-4 text-right border-r border-slate-200 font-mono font-bold">{formatCurrency(itemPriceHT)}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">{formatCurrency(itemPriceHT * itemQte)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="bg-white hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-500 border-r border-slate-200">01</td>
                    <td className="py-3.5 px-4 border-r border-slate-200">
                      <p className="font-black text-slate-900 text-sm">{client.produit || 'Équipement Isotherme / Frigorifique'}</p>
                      {client.typeClient === 'production' && client.etapeCommande && (
                        <p className="text-[11px] text-purple-800 font-bold mt-1">
                          • Étape d'avancement de production : <span className="uppercase text-purple-900 font-extrabold">{client.etapeCommande.replace('_', ' ')}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 mt-0.5">Conforme aux normes industrielles d'isolation thermique CARPÔLE.</p>
                    </td>
                    <td className="py-3.5 px-4 text-center border-r border-slate-200 font-bold">
                      {client.segment === 'surgele' ? (
                        <span className="text-cyan-800 font-black uppercase text-[10px] bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">Surgelé (-20°C)</span>
                      ) : (
                        <span className="text-amber-800 font-black uppercase text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Frais (+4°C)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center border-r border-slate-200 font-black font-mono text-sm">{qte}</td>
                    <td className="py-3.5 px-4 text-right border-r border-slate-200 font-mono font-bold">{formatCurrency(unitPriceHT)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">{formatCurrency(unitPriceHT * qte)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Summary & Calculations Box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6 items-start">
            
            {/* Left: Terms & Payment Breakdown (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              
              {docType === 'bon_commande' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
                  <p className="font-black text-slate-900 uppercase text-[11px]">Conditions Générales de Vente & Commande</p>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li>Un acompte minimal de 30% est exigible à la signature du présent bon de commande.</li>
                    <li>Les délais de fabrication débutent à compter de la réception de l'acompte.</li>
                    <li>Le solde est payable avant l'enlèvement ou la livraison du matériel.</li>
                  </ul>
                </div>
              )}

              {docType === 'bon_livraison' && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-950">
                  <p className="font-black uppercase text-[11px] flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    Déclaration de Réception Conforme
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Le client soussigné reconnaît avoir reçu la marchandise / l'équipement désigné ci-dessus en parfait état de fonctionnement, conforme aux caractéristiques techniques convenues.
                  </p>
                </div>
              )}

              {/* Amount in French Words */}
              <div className="p-3.5 bg-slate-100/70 rounded-xl border border-slate-200 text-xs">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  {docType === 'facture' ? 'Arrêtée la présente facture à la somme de :' : docType === 'bon_commande' ? 'Arrêté le présent bon de commande à la somme de :' : 'Arrêté le présent bon de livraison à la somme de :'}
                </p>
                <p className="font-bold text-slate-900 italic capitalize">
                  « {numberToFrenchWords(docType === 'facture' ? (activeFactureType.includes('ACOMPTE') ? montantFactureTTC : totalTTC) : totalTTC)} »
                </p>
              </div>
            </div>

            {/* Right: Totals Box (5 cols) */}
            <div className="md:col-span-5 bg-slate-50 rounded-xl border border-slate-300 p-4 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-600">
                <span>Total Hors Taxes (HT) :</span>
                <span className="font-bold text-slate-900">{formatCurrency(totalHT)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 pb-2 border-b border-slate-200">
                <span>TVA (19%) :</span>
                <span className="font-bold text-slate-900">{formatCurrency(totalTVA)}</span>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1">
                <span className="font-sans uppercase">Total Général TTC :</span>
                <span className="text-base text-slate-950">{formatCurrency(totalTTC)}</span>
              </div>

              {docType === 'facture' && (
                <div className="mt-3 pt-3 border-t-2 border-slate-900 space-y-2">
                  <div className="flex justify-between items-center text-amber-900 font-extrabold bg-amber-100/70 p-2 rounded">
                    <span className="font-sans text-[11px] uppercase">{acompteLabel} :</span>
                    <span className="text-sm font-black">{formatCurrency(montantFactureTTC)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-700 pt-1">
                    <span className="font-sans text-[10px] text-slate-500 uppercase">Reste à payer :</span>
                    <span className="font-black text-slate-900">{formatCurrency(Math.max(0, totalTTC - montantFactureTTC))}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Signatures & Stamp Section */}
          <div className="mt-12 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-16">
              <p className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                Pour la SARL CARPÔLE INDUSTRIEL
              </p>
              <div className="text-[10px] text-slate-400 italic">
                (Cachet et signature autorisés)
              </div>
            </div>

            <div className="space-y-16">
              <p className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                Le Client / Le Destinataire
              </p>
              <div className="text-[10px] text-slate-400 italic">
                (Nom, Date & Mention « Bon pour accord »)
              </div>
            </div>
          </div>

          {/* Footer watermark notice */}
          <div className="mt-10 pt-4 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
            SARL CARPÔLE INDUSTRIEL — Capital Social : 50.000.000 DA — Document généré le {new Date().toLocaleDateString('fr-DZ')} via CARPÔLE ERP
          </div>

        </div>

      </div>
    </div>
  );
}
