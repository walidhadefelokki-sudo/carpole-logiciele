import React, { useState, useMemo } from 'react';
import { StockMovement, Supplier, Client, User } from '../types';
import { 
  History, ArrowUpRight, ArrowDownRight, Search, Filter, 
  Calendar, UserCheck, Building2, Package, Layers, RefreshCw, 
  CheckCircle2, AlertCircle, FileText
} from 'lucide-react';

interface StockHistorySectionProps {
  movements: StockMovement[];
  suppliers: Supplier[];
  clients: Client[];
  currentUser: User | null;
  onDeleteMovement?: (id: string) => void;
}

export interface UnifiedHistoryItem {
  id: string;
  typeMouvement: 'ENTREE' | 'SORTIE';
  date: string;
  produit: string;
  quantite: number;
  unite: string;
  typeArticle: 'matiere_premiere' | 'produit_fini';
  nomUtilisateur: string;
  tierNom: string;
  motif: string;
  source: 'MANUEL' | 'FOURNISSEUR' | 'CLIENT';
  createdAt: string;
}

export default function StockHistorySection({
  movements,
  suppliers,
  clients,
  currentUser,
}: StockHistorySectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeMouvementFilter, setTypeMouvementFilter] = useState<'ALL' | 'ENTREE' | 'SORTIE'>('ALL');
  const [articleTypeFilter, setArticleTypeFilter] = useState<'ALL' | 'matiere_premiere' | 'produit_fini'>('ALL');

  // Build unified history from explicit movements, supplier arrivals, and client sales
  const unifiedHistory = useMemo<UnifiedHistoryItem[]>(() => {
    const items: UnifiedHistoryItem[] = [];

    // 1. Direct manual stock movements
    movements.forEach(m => {
      items.push({
        id: m.id,
        typeMouvement: m.typeMouvement,
        date: m.date || m.createdAt,
        produit: m.produit,
        quantite: m.quantite,
        unite: m.unite || 'Unités',
        typeArticle: m.typeArticle || 'matiere_premiere',
        nomUtilisateur: m.nomUtilisateur || 'Gestionnaire Stock',
        tierNom: m.tierNom || (m.typeMouvement === 'ENTREE' ? 'Fournisseur' : 'Client Interne'),
        motif: m.motif || (m.typeMouvement === 'ENTREE' ? 'Réception Stock' : 'Sortie Atelier'),
        source: 'MANUEL',
        createdAt: m.createdAt,
      });
    });

    // 2. Supplier purchases & deliveries (ENTRÉE)
    suppliers.forEach(s => {
      if (s.produits && s.produits.length > 0) {
        s.produits.forEach(p => {
          items.push({
            id: `sup-${s.id}-${p.id}`,
            typeMouvement: 'ENTREE',
            date: s.dateAchat || s.createdAt,
            produit: p.produit,
            quantite: p.quantite,
            unite: p.unite || 'Unités',
            typeArticle: p.type || 'matiere_premiere',
            nomUtilisateur: 'Service Achats',
            tierNom: s.nomPrenom || 'Fournisseur',
            motif: s.livre ? 'Achat Fournisseur (Livré)' : 'Achat En Transit',
            source: 'FOURNISSEUR',
            createdAt: s.createdAt,
          });
        });
      } else if (s.articleAchete) {
        items.push({
          id: `sup-${s.id}`,
          typeMouvement: 'ENTREE',
          date: s.dateAchat || s.createdAt,
          produit: s.articleAchete,
          quantite: s.quantite || 0,
          unite: 'Unités',
          typeArticle: 'matiere_premiere',
          nomUtilisateur: 'Service Achats',
          tierNom: s.nomPrenom || 'Fournisseur',
          motif: s.livre ? 'Achat Fournisseur (Livré)' : 'Achat En Transit',
          source: 'FOURNISSEUR',
          createdAt: s.createdAt,
        });
      }
    });

    // 3. Client sales (SORTIE)
    clients.forEach(c => {
      if (c.produits && c.produits.length > 0) {
        c.produits.forEach(p => {
          items.push({
            id: `cli-${c.id}-${p.id}`,
            typeMouvement: 'SORTIE',
            date: c.dateAchat || c.createdAt,
            produit: p.produit,
            quantite: p.quantite,
            unite: 'Unités',
            typeArticle: 'produit_fini',
            nomUtilisateur: 'Commercial',
            tierNom: c.nomPrenom || 'Client',
            motif: `Vente Client (${c.detailVente || 'Commande'})`,
            source: 'CLIENT',
            createdAt: c.createdAt,
          });
        });
      } else if (c.produit) {
        items.push({
          id: `cli-${c.id}`,
          typeMouvement: 'SORTIE',
          date: c.dateAchat || c.createdAt,
          produit: c.produit,
          quantite: c.quantite || 1,
          unite: 'Unités',
          typeArticle: 'produit_fini',
          nomUtilisateur: 'Commercial',
          tierNom: c.nomPrenom || 'Client',
          motif: `Vente Client (${c.detailVente || 'Commande'})`,
          source: 'CLIENT',
          createdAt: c.createdAt,
        });
      }
    });

    // Sort chronologically by date/createdAt desc
    return items.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
  }, [movements, suppliers, clients]);

  // Filtered list
  const filteredHistory = useMemo(() => {
    return unifiedHistory.filter(item => {
      // Type filter
      if (typeMouvementFilter !== 'ALL' && item.typeMouvement !== typeMouvementFilter) {
        return false;
      }
      // Article type filter
      if (articleTypeFilter !== 'ALL' && item.typeArticle !== articleTypeFilter) {
        return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesProduct = item.produit.toLowerCase().includes(query);
        const matchesUser = item.nomUtilisateur.toLowerCase().includes(query);
        const matchesTier = item.tierNom.toLowerCase().includes(query);
        const matchesMotif = item.motif.toLowerCase().includes(query);
        const matchesDate = item.date.toLowerCase().includes(query);
        return matchesProduct || matchesUser || matchesTier || matchesMotif || matchesDate;
      }
      return true;
    });
  }, [unifiedHistory, typeMouvementFilter, articleTypeFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    let totalEntrees = 0;
    let totalSorties = 0;
    unifiedHistory.forEach(item => {
      if (item.typeMouvement === 'ENTREE') totalEntrees += item.quantite;
      if (item.typeMouvement === 'SORTIE') totalSorties += item.quantite;
    });
    return {
      totalMouvements: unifiedHistory.length,
      totalEntrees,
      totalSorties,
    };
  }, [unifiedHistory]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Non spécifiée';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Title */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <History className="w-3.5 h-3.5" />
              Traçabilité & Journal des Mouvements
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Historique des Entrées & Sorties du Stock
            </h2>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl font-medium">
              Consultez en temps réel l'ensemble des réceptions fournisseurs, ventes clients et sorties manuelles d'atelier enregistrées par les intervenants.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 self-start md:self-auto">
            <span className="text-xs font-bold text-slate-300 px-3 py-1">
              Connecté en tant que : <strong className="text-amber-400">{currentUser?.role === 'admin' ? 'Administrateur' : currentUser?.role === 'commercial' ? 'Responsable Commercial' : 'Gestionnaire Stock'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black flex-shrink-0">
            <History className="w-6 h-6 stroke-[2.2px]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mouvements Totaux</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{stats.totalMouvements}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">Opérations enregistrées</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black flex-shrink-0">
            <ArrowUpRight className="w-6 h-6 stroke-[2.5px]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Quantités Entrées</p>
            <p className="text-2xl font-black text-emerald-700 tracking-tight">+{stats.totalEntrees}</p>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">Achats & réceptions stock</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black flex-shrink-0">
            <ArrowDownRight className="w-6 h-6 stroke-[2.5px]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Quantités Sorties</p>
            <p className="text-2xl font-black text-amber-700 tracking-tight">-{stats.totalSorties}</p>
            <p className="text-[10px] font-bold text-amber-600 mt-0.5">Ventes & prélèvements atelier</p>
          </div>
        </div>

      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-3xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par produit, client, fournisseur, utilisateur..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Movement Type Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTypeMouvementFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeMouvementFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous ({unifiedHistory.length})
            </button>
            <button
              onClick={() => setTypeMouvementFilter('ENTREE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                typeMouvementFilter === 'ENTREE'
                  ? 'bg-emerald-600 text-white shadow-2xs font-black'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5px]" />
              Entrées
            </button>
            <button
              onClick={() => setTypeMouvementFilter('SORTIE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                typeMouvementFilter === 'SORTIE'
                  ? 'bg-amber-600 text-white shadow-2xs font-black'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5px]" />
              Sorties
            </button>
          </div>

          {/* Article Type Filter */}
          <select
            value={articleTypeFilter}
            onChange={(e) => setArticleTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
          >
            <option value="ALL">Tous les types d'articles</option>
            <option value="matiere_premiere">Matières premières</option>
            <option value="produit_fini">Produits finis</option>
          </select>

        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                <th className="py-3.5 px-4">Mouvement</th>
                <th className="py-3.5 px-4">Date & Heure</th>
                <th className="py-3.5 px-4">Produit / Article</th>
                <th className="py-3.5 px-4">Quantité</th>
                <th className="py-3.5 px-4">Type Article</th>
                <th className="py-3.5 px-4">Utilisateur / Intervenant</th>
                <th className="py-3.5 px-4">Client / Fournisseur</th>
                <th className="py-3.5 px-4">Motif / Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-xs">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <History className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-1" />
                    <p className="font-bold text-slate-700">Aucun mouvement trouvé</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchTerm || typeMouvementFilter !== 'ALL' || articleTypeFilter !== 'ALL'
                        ? 'Modifiez vos critères de recherche ou de filtre'
                        : "Les entrées et sorties du stock s'afficheront ici automatiquement."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const isEntree = item.typeMouvement === 'ENTREE';

                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors font-medium text-slate-800"
                    >
                      {/* Mouvement badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                          isEntree
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {isEntree ? (
                            <>
                              <ArrowUpRight className="w-3 h-3 text-emerald-600 stroke-[3px]" />
                              ENTRÉE
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="w-3 h-3 text-amber-600 stroke-[3px]" />
                              SORTIE
                            </>
                          )}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{formatDate(item.date)}</span>
                        </div>
                      </td>

                      {/* Produit */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>{item.produit}</span>
                        </div>
                      </td>

                      {/* Quantité */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className={`font-black text-xs ${isEntree ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {isEntree ? `+${item.quantite}` : `-${item.quantite}`}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold ml-1">{item.unite}</span>
                      </td>

                      {/* Type Article */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.typeArticle === 'matiere_premiere'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                        }`}>
                          {item.typeArticle === 'matiere_premiere' ? 'Matière Première' : 'Produit Fini'}
                        </span>
                      </td>

                      {/* Nom Utilisateur */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px]">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span>{item.nomUtilisateur}</span>
                        </div>
                      </td>

                      {/* Client / Fournisseur */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                          <Building2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span>{item.tierNom}</span>
                        </div>
                      </td>

                      {/* Motif / Source */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1 text-slate-600 max-w-xs truncate" title={item.motif}>
                          <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span>{item.motif}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Affichage de <strong>{filteredHistory.length}</strong> mouvement(s) sur {unifiedHistory.length} au total</span>
          <span className="text-[11px] text-slate-400">Carpole Industriel — Module de Traçabilité</span>
        </div>
      </div>

    </div>
  );
}
