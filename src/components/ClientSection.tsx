/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Client, AttachedFile, Supplier, StockItem, ClientType, EtapeCommande, ProformaInvoice } from '../types';
import { 
  Plus, Search, Edit, Trash2, Eye, FileText, Download, Check, AlertTriangle, 
  Sparkles, Filter, X, ChevronRight, CheckCircle2, Phone, Mail, FileCheck, Receipt, Truck, DollarSign, Factory, Layers, Clock, ArrowRightLeft, FileSpreadsheet, Printer
} from 'lucide-react';
import ClientFormModal from './ClientFormModal';
import ClientDetailsModal from './ClientDetailsModal';
import DocumentViewerModal, { DocumentType } from './DocumentViewerModal';
import ProformaFormModal from './ProformaFormModal';

interface ClientSectionProps {
  clients: Client[];
  stockItems: StockItem[];
  suppliers: Supplier[];
  onAddClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onViewFile: (file: AttachedFile) => void;
  userRole?: 'admin' | 'commercial' | 'gestionnaire_stock';
}

export default function ClientSection({
  clients,
  stockItems,
  suppliers,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onViewFile,
  userRole
}: ClientSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRemise, setFilterRemise] = useState<'all' | 'oui' | 'non'>('all');
  const [filterAttente, setFilterAttente] = useState<'all' | 'oui' | 'non'>('all');
  const [filterDocs, setFilterDocs] = useState<'all' | 'complets' | 'incomplets'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paye' | 'partiel' | 'non_paye'>('all');
  const [filterTypeClient, setFilterTypeClient] = useState<'all' | ClientType>('all');
  const [filterEtape, setFilterEtape] = useState<'all' | EtapeCommande>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<Client | null>(null);

  // Document Viewer Modal State
  const [selectedDocClient, setSelectedDocClient] = useState<Client | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('facture');

  // Proforma Invoices state
  const [proformaInvoices, setProformaInvoices] = useState<ProformaInvoice[]>(() => {
    try {
      const saved = localStorage.getItem('carpole_proforma_invoices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isProformaFormOpen, setIsProformaFormOpen] = useState(false);
  const [activeClientTab, setActiveClientTab] = useState<'real' | 'proforma'>('real');

  const handleOpenDocument = (client: Client, type: DocumentType) => {
    setSelectedDocClient(client);
    setSelectedDocType(type);
  };

  const handleSaveProforma = (proforma: ProformaInvoice, autoPrint: boolean = false) => {
    setProformaInvoices(prev => {
      const updated = [proforma, ...prev];
      localStorage.setItem('carpole_proforma_invoices', JSON.stringify(updated));
      return updated;
    });
    setIsProformaFormOpen(false);

    if (autoPrint) {
      handleOpenProformaDocument(proforma);
    }
  };

  const handleDeleteProforma = (id: string) => {
    setProformaInvoices(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('carpole_proforma_invoices', JSON.stringify(updated));
      return updated;
    });
  };

  const handleOpenProformaDocument = (proforma: ProformaInvoice) => {
    const clientView: Client = {
      id: proforma.id,
      nomPrenom: proforma.nomPrenom,
      telephone: proforma.telephone || '',
      email: proforma.email || '',
      nis: proforma.nis || '',
      nif: proforma.nif || '',
      rc: proforma.rc || '',
      numArticle: proforma.numArticle || '',
      bonCommande: null,
      facture: null,
      bonLivraison: null,
      retour: '',
      remise: false,
      prixBase: 0,
      tauxRemise: 0,
      prixApresRemise: 0,
      tvaApplicable: proforma.tvaApplicable,
      produits: proforma.produits,
      dateAchat: proforma.dateCreation,
      delaiRealisation: proforma.delaiRealisation,
      rendezVous: proforma.rendezVous,
      isProforma: true,
      createdAt: proforma.createdAt
    };
    setSelectedDocClient(clientView);
    setSelectedDocType('facture');
  };

  const handleConvertProformaToClient = (proforma: ProformaInvoice) => {
    const newClient: Client = {
      id: crypto.randomUUID(),
      nomPrenom: proforma.nomPrenom,
      telephone: proforma.telephone || '',
      email: proforma.email || '',
      nis: proforma.nis || '',
      nif: proforma.nif || '',
      rc: proforma.rc || '',
      numArticle: proforma.numArticle || '',
      bonCommande: null,
      facture: null,
      bonLivraison: null,
      retour: '',
      remise: false,
      prixBase: 0,
      tauxRemise: 0,
      prixApresRemise: 0,
      tvaApplicable: proforma.tvaApplicable,
      produits: proforma.produits,
      typeClient: 'carrossier',
      quantite: proforma.produits.reduce((s, p) => s + (p.quantite || 1), 0),
      dateAchat: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    onAddClient(newClient);
    handleDeleteProforma(proforma.id);
  };

  // Delete confirmation
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(val);
  };

  const handleOpenAddForm = () => {
    setSelectedClientForEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (client: Client) => {
    setSelectedClientForEdit(client);
    setIsFormOpen(true);
  };

  const handleSaveClient = (client: Client) => {
    if (selectedClientForEdit) {
      onEditClient(client);
    } else {
      onAddClient(client);
    }
    setIsFormOpen(false);
  };

  const confirmDelete = (id: string) => {
    setClientToDelete(id);
  };

  const executeDelete = () => {
    if (clientToDelete) {
      onDeleteClient(clientToDelete);
      setClientToDelete(null);
    }
  };

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || 
      (client.nomPrenom || '').toLowerCase().includes(term) ||
      (client.telephone || '').toLowerCase().includes(term) ||
      (client.email || '').toLowerCase().includes(term) ||
      (client.rc || '').toLowerCase().includes(term) ||
      (client.nif || '').toLowerCase().includes(term) ||
      (client.produit || '').toLowerCase().includes(term) ||
      (client.produits && client.produits.some(p => (p.produit || '').toLowerCase().includes(term)));

    const matchesRemise = 
      filterRemise === 'all' ? true :
      filterRemise === 'oui' ? client.remise : !client.remise;

    const matchesAttente = 
      filterAttente === 'all' ? true :
      filterAttente === 'oui' ? !!client.enAttente : !client.enAttente;

    const hasAllDocs = client.bonCommande && client.facture && client.bonLivraison;
    const matchesDocs = 
      filterDocs === 'all' ? true :
      filterDocs === 'complets' ? hasAllDocs : !hasAllDocs;

    const totalContratHT = client.produits && client.produits.length > 0
      ? client.produits.reduce((sum, item) => sum + ((item.prixApresRemise || item.prixBase || 0) * (item.quantite || 1)), 0)
      : (client.prixApresRemise || client.prixBase || 0);
    const totalContratTVA = client.tvaApplicable !== false ? Math.round(totalContratHT * 0.19) : 0;
    const totalContrat = totalContratHT + totalContratTVA;
    const montantPaye = client.montantPaye || 0;
    const remains = totalContrat - montantPaye;

    const matchesPayment = 
      filterPayment === 'all' ? true :
      filterPayment === 'paye' ? remains <= 0 && totalContrat > 0 :
      filterPayment === 'partiel' ? montantPaye > 0 && remains > 0 :
      filterPayment === 'non_paye' ? montantPaye === 0 && totalContrat > 0 : false;

    const matchesType = 
      filterTypeClient === 'all' ? true : (client.typeClient || 'carrossier') === filterTypeClient;

    const matchesEtape = 
      filterEtape === 'all' ? true : client.etapeCommande === filterEtape;

    return matchesSearch && matchesRemise && matchesAttente && matchesDocs && matchesPayment && matchesType && matchesEtape;
  }).sort((a, b) => {
    const dateA = new Date(a.dateAchat || a.createdAt || 0).getTime();
    const dateB = new Date(b.dateAchat || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  const filteredProformas = proformaInvoices.filter(p => {
    const productsSearchStr = p.produits ? p.produits.map(item => item.produit).join(' ') : '';
    const search = searchTerm.toLowerCase();
    return (
      p.nomPrenom.toLowerCase().includes(search) ||
      (p.telephone && p.telephone.toLowerCase().includes(search)) ||
      (p.email && p.email.toLowerCase().includes(search)) ||
      productsSearchStr.toLowerCase().includes(search)
    );
  }).sort((a, b) => new Date(b.dateCreation || b.createdAt || 0).getTime() - new Date(a.dateCreation || a.createdAt || 0).getTime());

  const renderDocBadge = (file: AttachedFile | null, label: string, icon: React.ReactNode) => {
    if (!file) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-50 text-slate-400 border border-slate-200">
          {icon}
          {label}
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onViewFile(file)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
        title={`Cliquer pour prévisualiser ${file.name}`}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div id="clients-section-container" className="space-y-4">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Gestion des Clients & Ventes
          </h2>
          <p className="text-sm text-slate-500 leading-tight mt-1">
            Dossiers d'installation de carrosserie isotherme, factures proformas et archivage des documents.
          </p>

          {/* Sub-tabs: Clients vs Proforma */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setActiveClientTab('real')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeClientTab === 'real'
                  ? 'bg-slate-900 text-white shadow-3xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              Clients & Ventes Réelles ({clients.length})
            </button>
            <button
              onClick={() => setActiveClientTab('proforma')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeClientTab === 'proforma'
                  ? 'bg-blue-900 text-white shadow-3xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              Factures Proforma ({proformaInvoices.length})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsProformaFormOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs transition-all duration-150 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-200" />
            Facture Proforma
          </button>

          <button
            onClick={handleOpenAddForm}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-lg shadow-xs transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5 text-slate-950" />
            Nouveau Client
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, téléphone, NIF, RC..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:bg-white focus:border-amber-500 focus:outline-hidden transition-all placeholder:text-slate-400"
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

        <div className="flex flex-wrap items-center gap-5">
          {/* Type Client Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1 uppercase tracking-wide">
              <Factory className="w-3.5 h-3.5" /> Type Client:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => { setFilterTypeClient('all'); setFilterEtape('all'); }}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${filterTypeClient === 'all' ? 'bg-white text-slate-800 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterTypeClient('carrossier')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${filterTypeClient === 'carrossier' ? 'bg-white text-blue-700 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Carrossier
              </button>
              <button
                onClick={() => setFilterTypeClient('technicien_froid')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${filterTypeClient === 'technicien_froid' ? 'bg-white text-teal-700 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Tech. Froid
              </button>
              <button
                onClick={() => setFilterTypeClient('production')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${filterTypeClient === 'production' ? 'bg-white text-purple-700 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Production
              </button>
            </div>
          </div>

          {/* Étape Commande Filter (when Production) */}
          {filterTypeClient === 'production' && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <span className="text-xs font-extrabold text-purple-600 flex items-center gap-1 uppercase tracking-wide">
                Étape:
              </span>
              <div className="inline-flex rounded-lg border border-purple-200 p-0.5 bg-purple-50 text-xs">
                <button
                  onClick={() => setFilterEtape('all')}
                  className={`px-2 py-0.5 rounded-sm font-medium transition-all cursor-pointer ${filterEtape === 'all' ? 'bg-white text-purple-900 shadow-4xs font-bold' : 'text-purple-700 hover:text-purple-950'}`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setFilterEtape('stratification')}
                  className={`px-2 py-0.5 rounded-sm font-medium transition-all cursor-pointer ${filterEtape === 'stratification' ? 'bg-amber-500 text-slate-950 shadow-4xs font-black' : 'text-purple-700 hover:text-purple-950'}`}
                >
                  1- Stratification
                </button>
                <button
                  onClick={() => setFilterEtape('montage')}
                  className={`px-2 py-0.5 rounded-sm font-medium transition-all cursor-pointer ${filterEtape === 'montage' ? 'bg-blue-600 text-white shadow-4xs font-black' : 'text-purple-700 hover:text-purple-950'}`}
                >
                  2- Montage
                </button>
                <button
                  onClick={() => setFilterEtape('finition')}
                  className={`px-2 py-0.5 rounded-sm font-medium transition-all cursor-pointer ${filterEtape === 'finition' ? 'bg-purple-600 text-white shadow-4xs font-black' : 'text-purple-700 hover:text-purple-950'}`}
                >
                  3- Finition
                </button>
                <button
                  onClick={() => setFilterEtape('livraison')}
                  className={`px-2 py-0.5 rounded-sm font-medium transition-all cursor-pointer ${filterEtape === 'livraison' ? 'bg-emerald-600 text-white shadow-4xs font-black' : 'text-purple-700 hover:text-purple-950'}`}
                >
                  4- Livraison
                </button>
              </div>
            </div>
          )}

          {/* Remise Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1 uppercase tracking-wide">
              <Filter className="w-3.5 h-3.5" /> Remise:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setFilterRemise('all')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${filterRemise === 'all' ? 'bg-white text-slate-800 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterRemise('oui')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${filterRemise === 'oui' ? 'bg-white text-emerald-700 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Avec
              </button>
              <button
                onClick={() => setFilterRemise('non')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${filterRemise === 'non' ? 'bg-white text-slate-800 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Sans
              </button>
            </div>
          </div>

          {/* En Attente Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-amber-600 flex items-center gap-1 uppercase tracking-wide">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> En attente:
            </span>
            <div className="inline-flex rounded-lg border border-amber-200 p-0.5 bg-amber-50/50 text-xs">
              <button
                onClick={() => setFilterAttente('all')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${filterAttente === 'all' ? 'bg-white text-slate-800 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterAttente('oui')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${filterAttente === 'oui' ? 'bg-amber-500 text-slate-950 shadow-3xs font-black' : 'text-amber-800 hover:text-amber-950'}`}
              >
                Oui (⏳)
              </button>
              <button
                onClick={() => setFilterAttente('non')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${filterAttente === 'non' ? 'bg-white text-slate-800 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Non
              </button>
            </div>
          </div>

          {/* Payment Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1 uppercase tracking-wide">
              <DollarSign className="w-3.5 h-3.5" /> Paiement:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setFilterPayment('all')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${filterPayment === 'all' ? 'bg-white text-slate-800 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterPayment('paye')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${filterPayment === 'paye' ? 'bg-white text-emerald-700 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Réglé
              </button>
              <button
                onClick={() => setFilterPayment('partiel')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${filterPayment === 'partiel' ? 'bg-white text-amber-600 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Partiel
              </button>
              <button
                onClick={() => setFilterPayment('non_paye')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${filterPayment === 'non_paye' ? 'bg-white text-red-600 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Non Payé
              </button>
            </div>
          </div>

          {/* Documents completeness filter */}
          {userRole === 'admin' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1 uppercase tracking-wide">
                <FileCheck className="w-3.5 h-3.5" /> PDF:
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                <button
                  onClick={() => setFilterDocs('all')}
                  className={`px-2 py-0.5 rounded-sm font-medium transition-all cursor-pointer ${filterDocs === 'all' ? 'bg-white text-slate-800 shadow-4xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilterDocs('complets')}
                  className={`px-2 py-0.5 rounded-sm font-medium transition-all cursor-pointer ${filterDocs === 'complets' ? 'bg-white text-amber-600 shadow-4xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Complets (3/3)
                </button>
                <button
                  onClick={() => setFilterDocs('incomplets')}
                  className={`px-2 py-0.5 rounded-sm font-medium transition-all cursor-pointer ${filterDocs === 'incomplets' ? 'bg-white text-amber-600 shadow-4xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Incomplets
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Customers or Proformas List */}
      {activeClientTab === 'proforma' ? (
        filteredProformas.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-900 text-white text-xs font-black uppercase tracking-wider">
                    <th className="px-5 py-3.5">Client Potentiel & Contact</th>
                    <th className="px-5 py-3.5">Articles & Désignation</th>
                    <th className="px-5 py-3.5">Délai & Rendez-vous</th>
                    <th className="px-5 py-3.5">Date Établissement</th>
                    <th className="px-5 py-3.5">Montant HT & TTC</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredProformas.map((proforma) => {
                    const totalHT = proforma.produits ? proforma.produits.reduce((sum, item) => sum + ((item.prixApresRemise || item.prixBase || 0) * (item.quantite || 1)), 0) : 0;
                    const totalTVA = proforma.tvaApplicable ? Math.round(totalHT * 0.19) : 0;
                    const totalTTC = totalHT + totalTVA;

                    return (
                      <tr key={proforma.id} className="hover:bg-blue-50/40 transition-colors group">
                        {/* Client Potentiel Info */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 border border-blue-200 text-blue-800 flex items-center justify-center font-black text-sm uppercase flex-shrink-0">
                              {proforma.nomPrenom.substring(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-slate-900 text-base truncate max-w-[240px]" title={proforma.nomPrenom}>
                                  {proforma.nomPrenom}
                                </p>
                                <span className="inline-flex items-center text-[9px] font-extrabold uppercase text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full tracking-wider">
                                  Facture Proforma
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                                {proforma.telephone && (
                                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                                    <Phone className="w-3.5 h-3.5 text-blue-600" /> {proforma.telephone}
                                  </span>
                                )}
                                {proforma.email && (
                                  <span className="flex items-center gap-1 truncate max-w-[150px]" title={proforma.email}>
                                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {proforma.email}
                                  </span>
                                )}
                              </div>
                              {(proforma.nif || proforma.rc || proforma.nis) && (
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {proforma.rc && <span className="mr-2">RC: {proforma.rc}</span>}
                                  {proforma.nif && <span className="mr-2">NIF: {proforma.nif}</span>}
                                  {proforma.nis && <span>NIS: {proforma.nis}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Articles & Désignation */}
                        <td className="px-5 py-4">
                          <div className="leading-tight space-y-1">
                            {proforma.produits && proforma.produits.length > 0 ? (
                              proforma.produits.map((p, pIdx) => (
                                <div key={p.id || pIdx} className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs max-w-[200px] truncate" title={p.produit}>
                                    • {p.produit}
                                  </span>
                                  <span className="inline-flex items-center text-[10px] font-black text-blue-900 bg-blue-100/80 px-1.5 py-0.5 rounded border border-blue-200">
                                    x{p.quantite}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs italic">-</span>
                            )}
                          </div>
                        </td>

                        {/* Délai & Rendez-vous */}
                        <td className="px-5 py-4 text-xs">
                          <div className="space-y-1">
                            {proforma.delaiRealisation ? (
                              <div className="font-bold text-slate-800 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span>Délai: {proforma.delaiRealisation}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Non spécifié</span>
                            )}
                            {proforma.rendezVous && (
                              <div className="text-[11px] text-blue-950 font-semibold bg-blue-50 border border-blue-100 rounded px-2 py-0.5 inline-block">
                                RDV: {proforma.rendezVous}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Date Proforma */}
                        <td className="px-5 py-4 font-mono text-xs text-slate-600">
                          {proforma.dateCreation ? new Date(proforma.dateCreation).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : '-'}
                        </td>

                        {/* Montants HT & TTC */}
                        <td className="px-5 py-4 font-mono">
                          <div className="space-y-0.5">
                            <p className="font-black text-slate-900 text-base">
                              {formatCurrency(totalTTC)} <span className="text-[10px] font-bold text-blue-700 font-sans uppercase">TTC</span>
                            </p>
                            <p className="text-xs text-slate-500 font-medium font-sans">
                              HT: <strong className="font-mono text-slate-700">{formatCurrency(totalHT)}</strong>
                              {proforma.tvaApplicable && <span className="ml-1 text-[10px] text-emerald-700 font-bold font-sans">(TVA 19%)</span>}
                            </p>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenProformaDocument(proforma)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-3xs transition-all cursor-pointer"
                              title="Voir & Imprimer la Facture Proforma PDF (Logo Carpôle)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Voir / Imprimer
                            </button>

                            <button
                              onClick={() => handleConvertProformaToClient(proforma)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-3xs transition-all cursor-pointer"
                              title="Convertir ce devis en Client & Commande Réelle"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Convertir en Vente
                            </button>

                            <button
                              onClick={() => handleDeleteProforma(proforma.id)}
                              className="p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer la Proforma"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="bg-blue-50 px-5 py-3 border-t border-blue-100 text-xs text-blue-900 font-bold flex justify-between items-center font-sans">
              <span>{filteredProformas.length} Facture{filteredProformas.length > 1 ? 's' : ''} Proforma enregistrée{filteredProformas.length > 1 ? 's' : ''}</span>
              <span className="font-mono text-blue-700">Devis & Proformas non comptabilisés en Vente Réelle</span>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-xs">
            <FileSpreadsheet className="w-10 h-10 text-blue-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 mb-1">Aucune Facture Proforma trouvée</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {searchTerm ? 'Aucune proforma ne correspond à votre recherche.' : 'Vous n\'avez pas encore rédigé de facture proforma.'}
            </p>
            <button
              onClick={() => setIsProformaFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Rédiger une Facture Proforma
            </button>
          </div>
        )
      ) : filteredClients.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider">
                  <th className="px-5 py-3.5">Client & Contact</th>
                  <th className="px-5 py-3.5">Type & Avancement</th>
                  <th className="px-5 py-3.5">Article & Quantité</th>
                  <th className="px-5 py-3.5">Date d'achat</th>
                  <th className="px-5 py-3.5">Édition Factures & BC/BL</th>
                  <th className="px-5 py-3.5">Paiement & Reste</th>
                  <th className="px-5 py-3.5">Tarification Net</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredClients.map((client) => {
                  const hasAllDocs = client.bonCommande && client.facture && client.bonLivraison;
                  const docCount = [client.bonCommande, client.facture, client.bonLivraison].filter(Boolean).length;

                  return (
                    <tr 
                      key={client.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Customer Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-black text-sm uppercase flex-shrink-0">
                            {client.nomPrenom.substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p 
                                className="font-bold text-slate-900 hover:text-amber-500 hover:underline cursor-pointer transition-colors text-base truncate max-w-[240px]"
                                onClick={() => setSelectedClientForDetails(client)}
                                title={client.nomPrenom}
                              >
                                {client.nomPrenom}
                              </p>
                              {client.segment === 'surgele' ? (
                                <span className="inline-flex items-center text-[9px] font-extrabold uppercase text-cyan-700 bg-cyan-50/80 border border-cyan-200 px-2 py-0.5 rounded-full tracking-wider leading-none">
                                  Surgelé
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[9px] font-extrabold uppercase text-amber-700 bg-amber-50/80 border border-amber-200 px-2 py-0.5 rounded-full tracking-wider leading-none">
                                  Frais
                                </span>
                              )}
                              {client.enAttente && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full tracking-wider leading-none shadow-3xs">
                                  <Clock className="w-2.5 h-2.5 text-amber-600" /> En Attente
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                              {client.telephone && (
                                <span className="flex items-center gap-1 font-semibold text-slate-500">
                                  <Phone className="w-3.5 h-3.5" /> {client.telephone}
                                </span>
                              )}
                              {client.email && (
                                <span className="flex items-center gap-1 truncate max-w-[150px]" title={client.email}>
                                  <Mail className="w-3.5 h-3.5" /> {client.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type Client & Étape Avancement */}
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <div>
                            {client.typeClient === 'production' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-300">
                                <Factory className="w-3 h-3 text-purple-700" />
                                Production
                              </span>
                            ) : client.typeClient === 'technicien_froid' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase bg-teal-50 text-teal-800 border border-teal-200">
                                Technicien froid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase bg-blue-50 text-blue-800 border border-blue-200">
                                Carrossier
                              </span>
                            )}
                          </div>

                          {/* Display Order Progress step ONLY if Production */}
                          {client.typeClient === 'production' ? (
                            <div>
                              {client.etapeCommande === 'stratification' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  1- Stratification
                                </span>
                              )}
                              {client.etapeCommande === 'montage' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                  2- Montage
                                </span>
                              )}
                              {client.etapeCommande === 'finition' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                  3- Finition
                                </span>
                              )}
                              {client.etapeCommande === 'livraison' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  4- Livraison
                                </span>
                              )}
                              {(!client.etapeCommande) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                  1- Stratification
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium italic block">-</span>
                          )}
                        </div>
                      </td>

                      {/* Article & Quantité */}
                      <td className="px-5 py-4">
                        <div className="leading-tight space-y-1">
                          {client.produits && client.produits.length > 0 ? (
                            client.produits.map((p, pIdx) => (
                              <div key={p.id || pIdx} className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 text-xs max-w-[200px] truncate" title={p.produit}>
                                  • {p.produit}
                                </span>
                                <span className="inline-flex items-center text-[10px] font-black text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200">
                                  x{p.quantite}
                                </span>
                              </div>
                            ))
                          ) : (
                            <>
                              <p className="font-bold text-slate-900 text-sm max-w-[220px] truncate" title={client.produit}>
                                {client.produit || 'Fourgon Isotherme'}
                              </p>
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-100 text-slate-600 mt-1">
                                Qté: {client.quantite ?? 1}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Date d'achat */}
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        {client.dateAchat ? new Date(client.dateAchat).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : (client.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : '-')}
                      </td>

                      {/* Édition & Impression Documents ERP (Facture, BC, BL) */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDocument(client, 'facture')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-3xs uppercase"
                            title="Rédiger & Voir la Facture (Logo Carpôle)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Facture
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDocument(client, 'bon_commande')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-200"
                            title="Rédiger & Voir le Bon de Commande (BC)"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-slate-600" />
                            BC
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDocument(client, 'bon_livraison')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-200"
                            title="Rédiger & Voir le Bon de Livraison (BL)"
                          >
                            <Truck className="w-3.5 h-3.5 text-slate-600" />
                            BL
                          </button>
                        </div>
                      </td>

                      {/* Statut Paiement (Avancement & Reste) */}
                      <td className="px-5 py-4">
                        {(() => {
                          const totalContratHT = client.produits && client.produits.length > 0
                            ? client.produits.reduce((sum, item) => sum + ((item.prixApresRemise || item.prixBase || 0) * (item.quantite || 1)), 0)
                            : (client.prixApresRemise || client.prixBase || 0);
                          const totalContratTVA = client.tvaApplicable !== false ? Math.round(totalContratHT * 0.19) : 0;
                          const totalContrat = totalContratHT + totalContratTVA;
                          const montantPaye = client.montantPaye || 0;
                          const reste = Math.max(0, totalContrat - montantPaye);
                          const pourcentage = totalContrat > 0 ? Math.min(100, Math.round((montantPaye / totalContrat) * 100)) : 0;

                          return (
                            <div className="space-y-1.5 min-w-[130px]">
                              <div className="flex items-center justify-between text-xs leading-none">
                                <span className="font-bold text-slate-700 font-mono">{pourcentage}% payé</span>
                                {pourcentage === 100 ? (
                                  <span className="text-[9px] font-extrabold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded leading-none">
                                    Réglé
                                  </span>
                                ) : pourcentage > 0 ? (
                                  <span className="text-[9px] font-extrabold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded leading-none">
                                    Partiel
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-extrabold uppercase text-red-650 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded leading-none">
                                    Reste
                                  </span>
                                )}
                              </div>

                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${pourcentage === 100 ? 'bg-emerald-500' : pourcentage > 0 ? 'bg-amber-500' : 'bg-red-400'}`}
                                  style={{ width: `${pourcentage}%` }}
                                />
                              </div>

                              <div className="text-[10px] text-slate-400 font-mono leading-none">
                                {reste > 0 ? (
                                  <span>Reste: <strong className="text-amber-600 font-extrabold">{formatCurrency(reste)}</strong></span>
                                ) : (
                                  <span className="text-emerald-600 font-extrabold">Solde à zéro</span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Pricing with and without discounts */}
                      <td className="px-5 py-4 font-mono text-sm">
                        <div className="leading-tight">
                          <p className="font-extrabold text-slate-950 text-base">
                            {formatCurrency(client.prixApresRemise)}
                          </p>
                          {client.remise ? (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mt-1">
                              <span className="bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">-{client.tauxRemise}%</span>
                              <span className="line-through text-slate-400">{formatCurrency(client.prixBase)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium block mt-1 font-sans">Sans remise</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedClientForDetails(client)}
                            className="p-2 hover:bg-amber-50 hover:text-amber-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title="Voir dossier complet"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditForm(client)}
                            className="p-2 hover:bg-slate-100 hover:text-slate-700 text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit className="w-4.5 h-4.5" />
                          </button>
                          {userRole === 'admin' && (
                            <button
                              onClick={() => confirmDelete(client.id)}
                              className="p-2 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer"
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
          
          {/* Subtitle footer showing filtered result count */}
          <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 text-xs text-slate-500 font-bold flex justify-between items-center font-sans">
            <span>Affichage de {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} sur un total de {clients.length}</span>
            <span className="font-mono">Dinar Algérien (DZD)</span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-xs">
          <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-xs font-bold text-slate-700 mb-0.5">Aucun client trouvé</h3>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto mb-3">
            {searchTerm || filterRemise !== 'all' || filterDocs !== 'all'
              ? 'Aucun client ne correspond à vos filtres de recherche actuels.'
              : 'Commencez par ajouter un premier dossier client pour gérer les fabrications de carrosseries.'}
          </p>
          {(searchTerm || filterRemise !== 'all' || filterDocs !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterRemise('all');
                setFilterDocs('all');
              }}
              className="px-2.5 py-1 text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded transition-colors cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div id="delete-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-base mb-1.5">Supprimer ce client ?</h4>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement le dossier de{' '}
              <strong className="text-slate-700">{clients.find(c => c.id === clientToDelete)?.nomPrenom}</strong> ? Cette action supprimera également tous les PDFs liés et est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setClientToDelete(null)}
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

      {/* Client Form Modal (Add / Edit) */}
      {isFormOpen && (
        <ClientFormModal
          client={selectedClientForEdit}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveClient}
          onViewFile={onViewFile}
          stockItems={stockItems}
          clients={clients}
          suppliers={suppliers}
        />
      )}

      {/* Client Details Modal */}
      {selectedClientForDetails && (
        <ClientDetailsModal
          client={selectedClientForDetails}
          onClose={() => setSelectedClientForDetails(null)}
          onEdit={handleOpenEditForm}
          onViewFile={onViewFile}
          onViewDocument={handleOpenDocument}
          userRole={userRole}
        />
      )}

      {/* Official Document Viewer & Printer Modal (Facture, BC, BL) */}
      {selectedDocClient && (
        <DocumentViewerModal
          client={selectedDocClient}
          initialType={selectedDocType}
          onClose={() => setSelectedDocClient(null)}
        />
      )}

      {/* Proforma Invoice Creation Modal */}
      {isProformaFormOpen && (
        <ProformaFormModal
          onClose={() => setIsProformaFormOpen(false)}
          onSave={handleSaveProforma}
          stockItems={stockItems}
        />
      )}

    </div>
  );
}
