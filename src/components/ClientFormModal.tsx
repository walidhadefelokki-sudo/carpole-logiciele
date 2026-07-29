/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client, AttachedFile, StockItem, Supplier, ClientType, EtapeCommande, DetailVente, ClientProductItem } from '../types';
import { X, Upload, Trash2, Eye, FileText, AlertCircle, Calculator, Percent, Sparkles, Box, DollarSign, Layers, Wrench, Factory, CheckCircle2, Plus, Clock, ShoppingCart, Check } from 'lucide-react';

interface ClientFormModalProps {
  client: Client | null; // Null means adding new, non-null means editing
  onClose: () => void;
  onSave: (client: Client) => void;
  onViewFile: (file: AttachedFile) => void;
  stockItems?: StockItem[];
  clients?: Client[];
  suppliers?: Supplier[];
}

export default function ClientFormModal({ 
  client, 
  onClose, 
  onSave, 
  onViewFile,
  stockItems,
  clients,
  suppliers
}: ClientFormModalProps) {
  const [nomPrenom, setNomPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [nis, setNis] = useState('');
  const [nif, setNif] = useState('');
  const [rc, setRc] = useState('');
  const [numArticle, setNumArticle] = useState('');
  const [retour, setRetour] = useState('');
  
  // General Order Settings
  const [detailVente, setDetailVente] = useState<DetailVente>('Caisse frigorifique positive');
  const [tvaApplicable, setTvaApplicable] = useState<boolean>(true);
  
  // Status En Attente
  const [enAttente, setEnAttente] = useState<boolean>(false);
  
  // Multi-Products State
  const [products, setProducts] = useState<ClientProductItem[]>([]);
  
  const [typeClient, setTypeClient] = useState<ClientType>('carrossier');
  const [etapeCommande, setEtapeCommande] = useState<EtapeCommande>('stratification');
  const [dateAchat, setDateAchat] = useState('');
  const [montantPaye, setMontantPaye] = useState<number>(0);

  // Files
  const [bonCommande, setBonCommande] = useState<AttachedFile | null>(null);
  const [facture, setFacture] = useState<AttachedFile | null>(null);
  const [bonLivraison, setBonLivraison] = useState<AttachedFile | null>(null);

  const [errorMsg, setErrorMsg] = useState('');

  // Helper to compute available stock for a product name
  const getAvailableStockForProduct = (productName: string) => {
    if (!stockItems || stockItems.length === 0) return null;
    const match = stockItems.find(s => s.nom.toLowerCase().trim() === productName.toLowerCase().trim());
    if (!match) return null;

    const recu = (suppliers || [])
      .filter(s => s.articleAchete.toLowerCase().trim() === match.nom.toLowerCase().trim() && s.livre)
      .reduce((sum, s) => sum + (s.quantite || 0), 0);

    const vendu = (clients || [])
      .filter(c => c.produit && c.produit.toLowerCase().trim() === match.nom.toLowerCase().trim() && c.id !== client?.id)
      .reduce((sum, c) => sum + (c.quantite || 0), 0);

    return match.quantiteInitiale + recu - vendu;
  };

  // Load existing client details if editing or initialize for new
  useEffect(() => {
    if (client) {
      setNomPrenom(client.nomPrenom || '');
      setTelephone(client.telephone || '');
      setEmail(client.email || '');
      setNis(client.nis || '');
      setNif(client.nif || '');
      setRc(client.rc || '');
      setNumArticle(client.numArticle || '');
      setRetour(client.retour || '');
      setEnAttente(client.enAttente ?? false);
      setDetailVente(client.detailVente || 'Caisse frigorifique positive');
      setTvaApplicable(client.tvaApplicable ?? true);
      setTypeClient(client.typeClient || 'carrossier');
      setEtapeCommande(client.etapeCommande || 'stratification');
      setDateAchat(client.dateAchat || (client.createdAt ? client.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]));
      setMontantPaye(client.montantPaye ?? 0);
      setBonCommande(client.bonCommande);
      setFacture(client.facture);
      setBonLivraison(client.bonLivraison);

      if (client.produits && client.produits.length > 0) {
        setProducts(client.produits);
      } else {
        // Fallback for single product client object
        setProducts([{
          id: 'prod-1',
          produit: client.produit || 'Fourgon Isotherme Frais (+4°C)',
          segment: client.segment || 'frais',
          quantite: client.quantite ?? 1,
          prixBase: client.prixBase ?? 1000000,
          remise: client.remise ?? false,
          tauxRemise: client.tauxRemise ?? 0,
          prixApresRemise: client.prixApresRemise ?? 1000000,
        }]);
      }
    } else {
      // Defaults for fresh client creation
      setNomPrenom('');
      setTelephone('');
      setEmail('');
      setNis('');
      setNif('');
      setRc('');
      setNumArticle('');
      setRetour('');
      setEnAttente(false);
      setDetailVente('Caisse frigorifique positive');
      setTvaApplicable(true);
      setTypeClient('carrossier');
      setEtapeCommande('stratification');
      setDateAchat(new Date().toISOString().split('T')[0]);
      setMontantPaye(0);
      setBonCommande(null);
      setFacture(null);
      setBonLivraison(null);

      const defaultProdName = stockItems && stockItems.length > 0 ? stockItems[0].nom : 'Fourgon Isotherme Frais (+4°C)';
      setProducts([{
        id: 'prod-1',
        produit: defaultProdName,
        segment: 'frais',
        quantite: 1,
        prixBase: 1000000,
        remise: false,
        tauxRemise: 0,
        prixApresRemise: 1000000,
      }]);
    }
  }, [client, stockItems]);

  // Methods to manage products list
  const addProduct = () => {
    const defaultProdName = stockItems && stockItems.length > 0 ? stockItems[0].nom : 'Fourgon Isotherme Frais (+4°C)';
    setProducts(prev => [
      ...prev,
      {
        id: `prod-${Date.now()}-${prev.length + 1}`,
        produit: defaultProdName,
        segment: 'frais',
        quantite: 1,
        prixBase: 500000,
        remise: false,
        tauxRemise: 0,
        prixApresRemise: 500000,
      }
    ]);
  };

  const removeProduct = (index: number) => {
    if (products.length <= 1) return;
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, key: keyof ClientProductItem, value: any) => {
    setProducts(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [key]: value };

      // Auto compute discount or price HT
      if (key === 'prixBase' || key === 'remise' || key === 'tauxRemise') {
        const pBase = key === 'prixBase' ? value : item.prixBase;
        const isRem = key === 'remise' ? value : item.remise;
        const tRem = key === 'tauxRemise' ? value : item.tauxRemise;

        if (isRem && tRem > 0) {
          item.prixApresRemise = Math.round(pBase * (1 - tRem / 100));
        } else {
          item.prixApresRemise = pBase;
        }
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'bonCommande' | 'facture' | 'bonLivraison') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorMsg("Seuls les fichiers PDF sont autorisés pour des raisons de conformité.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const attachedFile: AttachedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: result,
      };

      if (fileType === 'bonCommande') setBonCommande(attachedFile);
      if (fileType === 'facture') setFacture(attachedFile);
      if (fileType === 'bonLivraison') setBonLivraison(attachedFile);
      setErrorMsg(''); // clear error
    };

    reader.onerror = () => {
      setErrorMsg("Erreur lors de la lecture du fichier.");
    };

    reader.readAsDataURL(file);
  };

  const removeFile = (fileType: 'bonCommande' | 'facture' | 'bonLivraison') => {
    if (fileType === 'bonCommande') setBonCommande(null);
    if (fileType === 'facture') setFacture(null);
    if (fileType === 'bonLivraison') setBonLivraison(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomPrenom.trim()) {
      setErrorMsg("Le nom et prénom du client est obligatoire.");
      return;
    }

    if (!products || products.length === 0) {
      setErrorMsg("Veuillez ajouter au moins un produit ou article.");
      return;
    }

    const firstProd = products[0];
    const totalQuantite = products.reduce((sum, p) => sum + (p.quantite || 1), 0);
    const totalPrixBase = products.reduce((sum, p) => sum + (p.prixBase || 0) * (p.quantite || 1), 0);
    const totalPrixApresRemise = products.reduce((sum, p) => sum + (p.prixApresRemise || 0) * (p.quantite || 1), 0);
    const hasAnyRemise = products.some(p => p.remise);

    const savedClient: Client = {
      id: client ? client.id : crypto.randomUUID(),
      nomPrenom: nomPrenom.trim(),
      telephone: telephone.trim(),
      email: email.trim(),
      nis: nis.trim(),
      nif: nif.trim(),
      rc: rc.trim(),
      numArticle: numArticle.trim(),
      retour: retour.trim(),
      remise: hasAnyRemise,
      prixBase: totalPrixBase,
      tauxRemise: firstProd.tauxRemise || 0,
      prixApresRemise: totalPrixApresRemise,
      detailVente,
      tvaApplicable,
      enAttente,
      segment: firstProd.segment || 'frais',
      produit: products.map(p => `${p.produit}${p.quantite > 1 ? ` (x${p.quantite})` : ''}`).join(' + '),
      produits: products,
      typeClient,
      etapeCommande: typeClient === 'production' ? etapeCommande : undefined,
      quantite: totalQuantite,
      dateAchat,
      montantPaye,
      bonCommande,
      facture,
      bonLivraison,
      createdAt: client ? client.createdAt : new Date().toISOString(),
    };

    onSave(savedClient);
  };

  const renderFileInputSection = (
    label: string,
    file: AttachedFile | null,
    fileType: 'bonCommande' | 'facture' | 'bonLivraison'
  ) => {
    const inputId = `file-input-${fileType}`;
    return (
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{label}</label>
        {file ? (
          <div className="flex items-center justify-between p-3.5 bg-amber-50/40 border border-amber-200 rounded-xl hover:bg-amber-50/60 transition-all duration-150">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-amber-100 rounded-lg text-[#f5be1a] flex-shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="overflow-hidden leading-tight">
                <p className="text-xs font-bold text-slate-800 truncate font-mono" title={file.name}>{file.name}</p>
                <p className="text-[10px] text-slate-400 font-mono font-semibold mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => onViewFile(file)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all cursor-pointer"
                title="Visualiser"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => removeFile(fileType)}
                className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-all cursor-pointer"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative group">
            <input
              type="file"
              id={inputId}
              accept=".pdf"
              onChange={(e) => handleFileUpload(e, fileType)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="border border-dashed border-slate-250 hover:border-amber-400 hover:bg-amber-50/10 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-200">
              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-amber-50 flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors mb-2">
                <Upload className="w-4.5 h-4.5" />
              </div>
              <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 leading-none">Déposer PDF ou cliquer</span>
              <span className="text-[10px] text-slate-400 leading-none mt-1.5">PDF uniquement</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="client-form-backdrop" className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div id="client-form-content" className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-7xl w-full my-auto overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Sleek Dark Slate Brand Identity with Accent Line */}
        <div className="relative flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-200 bg-slate-950 text-white select-none">
          {/* Branded highlight border top */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#f5be1a]" />
          
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase font-sans">
                {client ? 'Modifier le Dossier Client' : 'Nouveau Dossier Client'}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {client ? `Édition des informations pour l'identifiant ${client.id}` : 'Saisie des données et documents du client'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto max-h-[82vh] p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8">
          
          {errorMsg && (
            <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 flex items-start gap-3.5 text-xs">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="leading-normal">
                <span className="font-extrabold uppercase tracking-wider block text-red-600 mb-0.5">Erreur de saisie</span>
                <span className="font-medium text-slate-700">{errorMsg}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            
            {/* Left section: Info & Finances (7/12) */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              
              {/* General Contact fields */}
              <div className="bg-slate-50/60 rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pb-2 border-b border-slate-200/60">
                  Informations Générales
                </h4>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nom complet / Entreprise *</label>
                  <input
                    type="text"
                    required
                    value={nomPrenom}
                    onChange={(e) => setNomPrenom(e.target.value)}
                    placeholder="Ex: SARL Froid Trans Soummam ou Benamar Karim"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-800 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                  />
                </div>

                {/* Type de Client Picklist */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Type de Client *
                  </label>
                  <select
                    value={typeClient}
                    onChange={(e) => setTypeClient(e.target.value as ClientType)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-850 text-sm font-bold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs cursor-pointer"
                  >
                    <option value="carrossier">Carrossier</option>
                    <option value="technicien_froid">Technicien en froid</option>
                    <option value="production">Production</option>
                  </select>
                </div>

                {/* If Production, show order progress steps (4 steps) */}
                {typeClient === 'production' && (
                  <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Factory className="w-4 h-4 text-purple-600" />
                        État d'avancement de la commande (Production) *
                      </label>
                      <span className="text-[10px] font-bold text-purple-700 font-mono bg-purple-100 px-2 py-0.5 rounded-full">
                        4 Étapes Industrielles
                      </span>
                    </div>

                    {/* Step Picklist Dropdown */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-extrabold text-purple-800 uppercase tracking-wider block">Sélection de l'Étape</span>
                      <select
                        value={etapeCommande}
                        onChange={(e) => setEtapeCommande(e.target.value as EtapeCommande)}
                        className="w-full px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-purple-950 text-sm font-bold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-hidden transition-all shadow-3xs cursor-pointer"
                      >
                        <option value="stratification">1- Stratification</option>
                        <option value="montage">2- Montage</option>
                        <option value="finition">3- Finition</option>
                        <option value="livraison">4- Livraison</option>
                      </select>
                    </div>

                    {/* Visual Stepper Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {[
                        { key: 'stratification', num: '1', label: 'Stratification' },
                        { key: 'montage', num: '2', label: 'Montage' },
                        { key: 'finition', num: '3', label: 'Finition' },
                        { key: 'livraison', num: '4', label: 'Livraison' },
                      ].map((step) => {
                        const isActive = etapeCommande === step.key;
                        return (
                          <button
                            key={step.key}
                            type="button"
                            onClick={() => setEtapeCommande(step.key as EtapeCommande)}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isActive
                                ? 'bg-purple-700 border-purple-800 text-white shadow-xs'
                                : 'bg-white border-purple-200 hover:bg-purple-100/60 text-purple-950 font-medium'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isActive ? 'bg-amber-400 text-slate-950' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {step.num}
                            </span>
                            <span className="text-xs font-bold leading-tight">{step.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">N° de Téléphone</label>
                    <input
                      type="tel"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      placeholder="Ex: 034 25 88 12"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-255 rounded-xl text-slate-800 text-sm font-bold font-mono placeholder:text-slate-450 focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Adresse E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: logistique@soummam-trans.dz"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-255 rounded-xl text-slate-800 text-sm font-bold placeholder:text-slate-450 focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                    />
                  </div>
                </div>
              </div>

              {/* Commercial Conditions & Multi-Product Management */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-amber-500" />
                      Détails des Produits & Commandes Client
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ajoutez un ou plusieurs articles/produits pour ce client avec leurs détails de vente respectifs.
                    </p>
                  </div>

                  {/* Status En attente Toggle */}
                  <div className="flex items-center gap-3 bg-amber-50/50 p-2 rounded-xl border border-amber-200/80 shrink-0">
                    <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider">Statut Client :</span>
                    <button
                      type="button"
                      onClick={() => setEnAttente(!enAttente)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-3xs ${
                        enAttente
                          ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {enAttente ? (
                        <>
                          <Clock className="w-3.5 h-3.5" /> ⏳ EN ATTENTE
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" /> VALIDÉ / ACTIF
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Common Order Metadata: Date d'achat & Détail de Vente Général */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
                      Détail de Vente Général *
                    </label>
                    <select
                      value={detailVente}
                      onChange={(e) => setDetailVente(e.target.value as DetailVente)}
                      className="w-full px-3.5 py-2 bg-amber-50/70 border border-amber-300 rounded-xl text-slate-900 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs cursor-pointer"
                    >
                      <option value="Caisse frigorifique positive">Caisse frigorifique positive</option>
                      <option value="Caisse frigorifique négative">Caisse frigorifique négative</option>
                      <option value="Conteneur">Conteneur</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                      Date d'Achat *
                    </label>
                    <input
                      type="date"
                      required
                      value={dateAchat}
                      onChange={(e) => setDateAchat(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-bold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                      Remarques Spéciales
                    </label>
                    <input
                      type="text"
                      value={retour}
                      onChange={(e) => setRetour(e.target.value)}
                      placeholder="Ex: Option hayon élévateur, couleur..."
                      className="w-full px-3.5 py-2 bg-white border border-slate-250 rounded-xl text-slate-850 text-xs font-bold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                    />
                  </div>
                </div>

                {/* PRODUCTS LIST */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                      Liste des Articles ({products.length})
                    </span>
                    <button
                      type="button"
                      onClick={addProduct}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase rounded-xl transition-all cursor-pointer shadow-3xs"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter un autre produit
                    </button>
                  </div>

                  {products.map((p, idx) => {
                    const selectedStock = getAvailableStockForProduct(p.produit);
                    const unitPriceHT = p.prixApresRemise || p.prixBase || 0;
                    const lineTotalHT = unitPriceHT * (p.quantite || 1);

                    return (
                      <div
                        key={p.id || idx}
                        className="p-4 sm:p-5 bg-slate-50/70 border-2 border-slate-200 rounded-2xl space-y-4 relative hover:border-amber-400/60 transition-all shadow-3xs"
                      >
                        {/* Header for Product Card */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>
                            <h5 className="font-extrabold text-slate-900 text-sm">
                              Article #{idx + 1} : {p.produit || 'Produit non spécifié'}
                            </h5>
                          </div>

                          {products.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeProduct(idx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 rounded-lg transition-all cursor-pointer"
                              title="Supprimer cet article"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Supprimer
                            </button>
                          )}
                        </div>

                        {/* Product Model & Stock selection */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                            Modèle / Article Acheté *
                          </label>
                          <select
                            value={p.produit}
                            onChange={(e) => updateProduct(idx, 'produit', e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs cursor-pointer"
                          >
                            {stockItems && stockItems.length > 0 ? (
                              <>
                                <optgroup label="Produits Finis (En Stock)">
                                  {stockItems.filter(item => item.type === 'produit_fini').map(item => {
                                    const stock = getAvailableStockForProduct(item.nom);
                                    return (
                                      <option key={item.id} value={item.nom}>
                                        {item.nom} {stock !== null ? `(Dispo: ${stock})` : ''}
                                      </option>
                                    );
                                  })}
                                </optgroup>
                                <optgroup label="Matières Premières (En Stock)">
                                  {stockItems.filter(item => item.type === 'matiere_premiere').map(item => {
                                    const stock = getAvailableStockForProduct(item.nom);
                                    return (
                                      <option key={item.id} value={item.nom}>
                                        {item.nom} {stock !== null ? `(Dispo: ${stock})` : ''}
                                      </option>
                                    );
                                  })}
                                </optgroup>
                              </>
                            ) : (
                              p.segment === 'surgele' ? (
                                <>
                                  <option value="Semi-remorque Frigorifique Multi-Température (-20°C)">Semi-remorque Frigorifique Multi-Température (-20°C)</option>
                                  <option value="Fourgon Frigorifique Renforcé (-18°C)">Fourgon Frigorifique Renforcé (-18°C)</option>
                                  <option value="Camion Frigorifique Classe C (-20°C)">Camion Frigorifique Classe C (-20°C)</option>
                                  <option value="Chambre Froide Négative Industrielle (-25°C)">Chambre Froide Négative Industrielle (-25°C)</option>
                                  <option value="Autre équipement frigorifique">Autre équipement frigorifique</option>
                                </>
                              ) : (
                                <>
                                  <option value="Fourgon Isotherme Frais (+4°C)">Fourgon Isotherme Frais (+4°C)</option>
                                  <option value="Semi-remorque Isotherme Frais (+4°C)">Semi-remorque Isotherme Frais (+4°C)</option>
                                  <option value="Camion Isotherme Classe A (+2°C / +12°C)">Camion Isotherme Classe A (+2°C / +12°C)</option>
                                  <option value="Chambre Froide Positive Industrielle">Chambre Froide Positive Industrielle</option>
                                  <option value="Autre équipement isotherme">Autre équipement isotherme</option>
                                </>
                              )
                            )}
                          </select>

                          {selectedStock !== null && (
                            <div className="text-[10px] font-bold text-slate-500 mt-1">
                              Stock disponible : <strong className={selectedStock > 0 ? 'text-emerald-600' : 'text-red-600'}>{selectedStock} unités</strong>
                            </div>
                          )}
                        </div>

                        {/* Segment & Quantité & Prix Unitaire */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Segment Froid</label>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => updateProduct(idx, 'segment', 'frais')}
                                className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border ${
                                  p.segment === 'frais'
                                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-3xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                Frais (+4°C)
                              </button>
                              <button
                                type="button"
                                onClick={() => updateProduct(idx, 'segment', 'surgele')}
                                className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border ${
                                  p.segment === 'surgele'
                                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-3xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                Surgelé (-20°C)
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Quantité *</label>
                            <input
                              type="number"
                              min="1"
                              value={p.quantite || 1}
                              onChange={(e) => updateProduct(idx, 'quantite', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-bold font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Prix HT Unitaire (DA) *</label>
                            <input
                              type="number"
                              min="0"
                              value={p.prixBase || ''}
                              onChange={(e) => updateProduct(idx, 'prixBase', Math.max(0, parseFloat(e.target.value) || 0))}
                              placeholder="0.00"
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            />
                          </div>
                        </div>

                        {/* Remise Line Setting */}
                        <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={p.remise}
                              onChange={(e) => updateProduct(idx, 'remise', e.target.checked)}
                              className="w-4 h-4 text-amber-500 accent-amber-500 rounded border-slate-300"
                            />
                            <span className="font-bold text-slate-800 text-[11px]">Remise Spéciale sur cet article (%)</span>
                          </label>
                          {p.remise && (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={p.tauxRemise || ''}
                                onChange={(e) => updateProduct(idx, 'tauxRemise', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                placeholder="0"
                                className="w-16 px-2 py-1 border border-emerald-300 rounded-lg text-xs font-bold text-right text-emerald-800 bg-emerald-50"
                              />
                              <span className="text-xs font-bold text-emerald-700">%</span>
                            </div>
                          )}
                        </div>

                        {/* Line Item Pricing Summary */}
                        <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs font-mono">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-sans font-bold block">Prix Total Article HT</span>
                            <span className="font-bold text-amber-400 text-sm">
                              {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(lineTotalHT)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 text-[10px] uppercase font-sans font-bold block">Sous-total Line</span>
                            <span className="font-bold text-slate-200">
                              {p.quantite || 1} x {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(unitPriceHT)} HT
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addProduct}
                    className="w-full py-3.5 border-2 border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50/50 rounded-2xl text-slate-800 font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-600" />
                    <span>+ Ajouter un autre produit ou article</span>
                  </button>
                </div>

                {/* GLOBAL CONTRAT FINANCIAL SUMMARY */}
                {(() => {
                  const totalContractHT = products.reduce((sum, p) => sum + (p.prixApresRemise || p.prixBase || 0) * (p.quantite || 1), 0);
                  const totalContractTVA = tvaApplicable ? Math.round(totalContractHT * 0.19) : 0;
                  const totalContractTTC = totalContractHT + totalContractTVA;
                  const resteAPayer = Math.max(0, totalContractTTC - montantPaye);
                  const pctPaye = totalContractTTC > 0 ? Math.min(100, Math.round((montantPaye / totalContractTTC) * 100)) : 0;

                  return (
                    <div className="p-5 bg-slate-950 text-white rounded-2xl space-y-4 shadow-md border border-slate-800">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <span className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                          <Calculator className="w-4 h-4" /> Récapitulatif de la Commande
                        </span>
                        <span className="text-xs font-mono text-slate-400 font-bold">
                          {products.length} article(s) • Qté totale: {products.reduce((s, p) => s + (p.quantite || 1), 0)}
                        </span>
                      </div>

                      {/* TVA 19% General Toggle inside Récapitulatif */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-amber-400" />
                          <div>
                            <span className="text-xs font-black text-white uppercase tracking-wider block">
                              TVA Applicabilité (19%)
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {tvaApplicable ? '✓ TVA 19% appliquée sur toute la commande (+19%)' : '○ Exonération de TVA (Montant Net HT)'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                          <button
                            type="button"
                            onClick={() => setTvaApplicable(true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              tvaApplicable
                                ? 'bg-amber-500 text-slate-950 shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Oui (+19%)
                          </button>
                          <button
                            type="button"
                            onClick={() => setTvaApplicable(false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              !tvaApplicable
                                ? 'bg-slate-700 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Non / Exonéré (0%)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-sans block">Total HT Contractuel</span>
                          <span className="text-sm font-bold text-slate-200">
                            {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(totalContractHT)}
                          </span>
                        </div>
                        <div>
                          <span className="text-amber-400 text-[10px] uppercase font-sans block">Total TVA {tvaApplicable ? '(19%)' : '(Exonérée)'}</span>
                          <span className="text-sm font-bold text-amber-300">
                            +{new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(totalContractTVA)}
                          </span>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[#f5be1a] text-[10px] uppercase font-sans font-black block">TOTAL GÉNÉRAL {tvaApplicable ? 'TTC' : 'HT'}</span>
                          <span className="text-base sm:text-lg font-black text-[#f5be1a]">
                            {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(totalContractTTC)}
                          </span>
                        </div>
                      </div>

                      {/* Payment Received Input & Shortcuts */}
                      <div className="pt-3 border-t border-slate-800 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider block">Montant Payé (DA)</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">DA</span>
                              <input
                                type="number"
                                min="0"
                                max={totalContractTTC}
                                value={montantPaye || ''}
                                onChange={(e) => setMontantPaye(Math.max(0, parseFloat(e.target.value) || 0))}
                                placeholder="0"
                                className="w-full pl-10 pr-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                              />
                            </div>
                          </div>

                          <div className="space-y-1 font-mono text-xs text-right">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Reste à Régler :</span>
                              <strong className={resteAPayer > 0 ? 'text-amber-400 font-black' : 'text-emerald-400 font-black'}>
                                {resteAPayer > 0 ? new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(resteAPayer) : 'Réglé (Solde 0 DA)'}
                              </strong>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full transition-all ${pctPaye === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${pctPaye}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Quick Payment Buttons */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setMontantPaye(0)}
                              className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-extrabold rounded-lg border border-slate-800 text-center transition-colors cursor-pointer"
                              title="Aucun acompte versé (Reste à payer = 100%)"
                            >
                              Non payé (0 DA)
                            </button>
                            <button
                              type="button"
                              onClick={() => setMontantPaye(Math.round(totalContractTTC / 2))}
                              className="flex-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-extrabold rounded-lg border border-amber-500/30 text-center transition-colors cursor-pointer"
                              title="Acompte de 50% calculé sur le montant total TTC de l'achat"
                            >
                              Acompte (50% du Total)
                            </button>
                            <button
                              type="button"
                              onClick={() => setMontantPaye(totalContractTTC)}
                              className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-extrabold rounded-lg border border-emerald-500/30 text-center transition-colors cursor-pointer"
                              title="Règlement total de la commande"
                            >
                              Total (100% TTC)
                            </button>
                          </div>
                          <p className="text-[9px] text-slate-400 font-sans italic">
                            💡 L'acompte 50% s'applique sur le montant total général de la commande (tous produits et quantités confondus).
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Suivi des retours */}
              <div className="bg-slate-50/40 rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Suivi des Retours & Observations Techniques</label>
                <textarea
                  rows={3}
                  value={retour}
                  onChange={(e) => setRetour(e.target.value)}
                  placeholder="Ex: Ajustement requis sur la charnière droite de la porte arrière isotherme lors de la livraison intermédiaire..."
                  className="w-full px-3.5 py-3 bg-white border border-slate-250 rounded-xl text-slate-800 text-sm font-medium focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs resize-none leading-relaxed"
                />
              </div>

            </div>

            {/* Right section: Tax IDs & File uploads (5/12) */}
            <div className="lg:col-span-5 space-y-6 sm:space-y-8">
              
              {/* Fiscal identifiers */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-4 shadow-xs">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pb-2 border-b border-slate-200/60">
                  Identifiants Fiscaux
                </h4>
                
                {/* Registre de Commerce */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Registre de Commerce (RC)</label>
                  <input
                    type="text"
                    value={rc}
                    onChange={(e) => setRc(e.target.value)}
                    placeholder="Ex: 16/00-0987654B15"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-800 text-sm font-bold font-mono uppercase focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                  />
                </div>

                {/* NIF */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">NIF (Identifiant Fiscal)</label>
                  <input
                    type="text"
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                    placeholder="Ex: 001506012456789"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-800 text-sm font-bold font-mono focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                  />
                </div>

                {/* NIS */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">NIS (Identifiant Statistique)</label>
                  <input
                    type="text"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="Ex: 002015340123456"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-800 text-sm font-bold font-mono focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                  />
                </div>

                {/* Numéro d'Article d'Imposition */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Article d'Imposition (Art)</label>
                  <input
                    type="text"
                    value={numArticle}
                    onChange={(e) => setNumArticle(e.target.value)}
                    placeholder="Ex: 16215432101"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-800 text-sm font-bold font-mono focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 focus:outline-hidden transition-all shadow-3xs"
                  />
                </div>
              </div>

              {/* Document uploads */}
              <div className="bg-slate-50/60 rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pb-2 border-b border-slate-250">
                  Fichiers Associés (PDF)
                </h4>
                
                <div className="space-y-3.5">
                  {renderFileInputSection('1. Bon de Commande', bonCommande, 'bonCommande')}
                  {renderFileInputSection('2. Facture Client', facture, 'facture')}
                  {renderFileInputSection('3. Bon de Livraison', bonLivraison, 'bonLivraison')}
                </div>
              </div>

            </div>

          </div>

        </form>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 sm:px-8 py-4 sm:py-5 border-t border-slate-200 bg-slate-50 gap-3">
          <div className="text-xs text-slate-400 italic order-2 sm:order-1 self-start sm:self-center font-mono">
            * Champs requis pour validation
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-6 py-2.5 text-sm font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-3xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-6 py-2.5 text-sm font-black text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs transition-all cursor-pointer uppercase"
            >
              {client ? 'Enregistrer les Modifications' : 'Créer le Dossier'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
