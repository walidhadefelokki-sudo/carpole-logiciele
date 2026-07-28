/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Client, Supplier } from '../types';
import { Users, ShoppingCart, TrendingUp, Truck } from 'lucide-react';

interface DashboardStatsProps {
  clients: Client[];
  suppliers: Supplier[];
}

export default function DashboardStats({ clients, suppliers }: DashboardStatsProps) {
  // Calculations
  const totalClients = clients.length;
  const totalSuppliers = suppliers.length;

  const totalSales = clients.reduce((acc, c) => acc + (Number(c.prixApresRemise) || 0), 0);
  const totalPurchases = suppliers.reduce((acc, s) => acc + ((Number(s.prixUnitaire) || 0) * (Number(s.quantite) || 0)), 0);

  const pendingDeliveries = suppliers.filter(s => !s.livre).length;
  const completedDeliveries = suppliers.filter(s => s.livre).length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div id="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
      {/* Stat Card 1: Clients / Ventes */}
      <div id="stat-sales" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between transition-all duration-200 hover:border-amber-400/75">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 truncate">Ventes Totales (Clients)</p>
          <h3 className="text-xl sm:text-2xl font-black font-mono text-slate-800 tracking-tight leading-tight truncate">{formatCurrency(totalSales)}</h3>
          <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{totalClients} client{totalClients > 1 ? 's' : ''} enregistré{totalClients > 1 ? 's' : ''}</span>
          </p>
        </div>
        <div className="p-3 rounded-lg bg-amber-50 text-amber-600 flex-shrink-0 ml-1">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      {/* Stat Card 2: Achats */}
      <div id="stat-purchases" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between transition-all duration-200 hover:border-slate-350">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 truncate">Achats Totaux (Fournisseurs)</p>
          <h3 className="text-xl sm:text-2xl font-black font-mono text-slate-800 tracking-tight leading-tight truncate">{formatCurrency(totalPurchases)}</h3>
          <p className="text-xs text-slate-500 font-medium truncate">
            {totalSuppliers} transaction{totalSuppliers > 1 ? 's' : ''} d'achat
          </p>
        </div>
        <div className="p-3 rounded-lg bg-slate-100 text-slate-600 flex-shrink-0 ml-1">
          <ShoppingCart className="w-5 h-5" />
        </div>
      </div>

      {/* Stat Card 3: Livraisons fournisseurs */}
      <div id="stat-deliveries" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between transition-all duration-200 hover:border-amber-400/75">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 truncate">Livraisons Fournisseurs</p>
          <h3 className="text-xl sm:text-2xl font-black font-mono text-slate-800 tracking-tight leading-tight truncate">
            {pendingDeliveries} <span className="text-xs font-normal text-slate-400 font-sans">en attente</span>
          </h3>
          <p className="text-xs text-amber-600 font-bold truncate">
            {completedDeliveries} livrée{completedDeliveries > 1 ? 's' : ''} avec succès
          </p>
        </div>
        <div className="p-3 rounded-lg bg-amber-50 text-amber-600 flex-shrink-0 ml-1">
          <Truck className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
