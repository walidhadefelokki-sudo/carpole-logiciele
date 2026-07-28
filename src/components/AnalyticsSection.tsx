/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Client, Supplier, StockItem } from '../types';
import { 
  TrendingUp, Users, ShoppingBag, Landmark, Snowflake, Thermometer, 
  ChevronRight, Calendar, Sparkles, PieChart as PieIcon, BarChart3, HelpCircle,
  Calculator, CheckCircle2, FileText, Layers, Settings2, ArrowUpRight, ArrowDownRight,
  Briefcase, AlertTriangle, Search, X, Eye, Check, AlertCircle, Phone, Boxes
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, BarChart, Bar, Cell, PieChart, Pie 
} from 'recharts';

interface AnalyticsSectionProps {
  clients: Client[];
  suppliers: Supplier[];
  stockItems?: StockItem[];
}

export default function AnalyticsSection({ clients, suppliers, stockItems = [] }: AnalyticsSectionProps) {
  const [timeRange, setTimeRange] = useState<'6m' | 'ytd' | 'all' | 'custom'>('6m');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  
  // States for predictive What-If Profit Simulator
  const [simSalesChange, setSimSalesChange] = useState<number>(0);
  const [simCostsChange, setSimCostsChange] = useState<number>(0);
  const [simDiscountChange, setSimDiscountChange] = useState<number>(0);

  // States for missing documents audit
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');
  const [auditFilterType, setAuditFilterType] = useState<'all' | 'bc' | 'facture' | 'bl'>('all');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-DZ', { 
      style: 'currency', 
      currency: 'DZD', 
      maximumFractionDigits: 0 
    }).format(val);
  };

  // --- CONSTRUCT AVAILABLE MONTHS FROM RECORDS & CALENDAR ---
  const availableMonths = useMemo(() => {
    const monthsFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const map: { [key: string]: { key: string; label: string; date: Date } } = {};
    
    // 1. Add last 12 months to guarantee options
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = {
        key,
        label: `${monthsFr[d.getMonth()]} ${d.getFullYear()}`,
        date: d
      };
    }

    // 2. Add any other months from clients
    clients.forEach(c => {
      try {
        const d = new Date(c.createdAt);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (!map[key]) {
            map[key] = {
              key,
              label: `${monthsFr[d.getMonth()]} ${d.getFullYear()}`,
              date: new Date(d.getFullYear(), d.getMonth(), 1)
            };
          }
        }
      } catch (e) {}
    });

    // 3. Add any other months from suppliers
    suppliers.forEach(s => {
      try {
        const d = new Date(s.createdAt);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (!map[key]) {
            map[key] = {
              key,
              label: `${monthsFr[d.getMonth()]} ${d.getFullYear()}`,
              date: new Date(d.getFullYear(), d.getMonth(), 1)
            };
          }
        }
      } catch (e) {}
    });

    // Sort chronologically descending
    return Object.values(map).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [clients, suppliers]);

  // --- FILTERED CLIENTS & SUPPLIERS ---
  const { filteredClients, filteredSuppliers } = useMemo(() => {
    if (timeRange === 'all') {
      return { filteredClients: clients, filteredSuppliers: suppliers };
    }

    const now = new Date();

    if (timeRange === '6m') {
      const last6Keys = new Set<string>();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        last6Keys.add(key);
      }

      return {
        filteredClients: clients.filter(c => {
          const date = new Date(c.createdAt);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return last6Keys.has(key);
        }),
        filteredSuppliers: suppliers.filter(s => {
          const date = new Date(s.createdAt);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return last6Keys.has(key);
        })
      };
    }

    if (timeRange === 'ytd') {
      const currentYear = now.getFullYear();
      return {
        filteredClients: clients.filter(c => {
          const date = new Date(c.createdAt);
          return date.getFullYear() === currentYear;
        }),
        filteredSuppliers: suppliers.filter(s => {
          const date = new Date(s.createdAt);
          return date.getFullYear() === currentYear;
        })
      };
    }

    // Custom Months Selected
    if (selectedMonths.length === 0) {
      return { filteredClients: [], filteredSuppliers: [] };
    }

    const selectedKeys = new Set(selectedMonths);
    return {
      filteredClients: clients.filter(c => {
        const date = new Date(c.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return selectedKeys.has(key);
      }),
      filteredSuppliers: suppliers.filter(s => {
        const date = new Date(s.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return selectedKeys.has(key);
      })
    };
  }, [clients, suppliers, timeRange, selectedMonths]);

  // --- KPI CALCULATIONS ---
  const stats = useMemo(() => {
    const totalSales = filteredClients.reduce((sum, c) => sum + c.prixApresRemise, 0);
    const totalPurchases = filteredSuppliers.reduce((sum, s) => sum + (s.prixUnitaire * s.quantite), 0);
    const pendingPurchases = filteredSuppliers
      .filter(s => !s.livre)
      .reduce((sum, s) => sum + (s.prixUnitaire * s.quantite), 0);
    
    const grossMargin = totalSales - totalPurchases;
    const marginRate = totalSales > 0 ? (grossMargin / totalSales) * 100 : 0;

    const averageSale = filteredClients.length > 0 ? totalSales / filteredClients.length : 0;
    const discountRateAverage = filteredClients.length > 0 
      ? filteredClients.reduce((sum, c) => sum + (c.remise ? c.tauxRemise : 0), 0) / filteredClients.length 
      : 0;

    return {
      totalSales,
      totalPurchases,
      pendingPurchases,
      grossMargin,
      marginRate,
      averageSale,
      discountRateAverage,
      clientCount: filteredClients.length,
      supplierCount: filteredSuppliers.length
    };
  }, [filteredClients, filteredSuppliers]);

  // --- STOCK & PRODUCT EXPENDITURES BI ANALYTICS ---
  const stockAnalytics = useMemo(() => {
    // Group expenditures (from suppliers) by article / product.
    // Categorize into "Matière Première" or "Produit Fini"
    const productStats: { 
      [name: string]: { 
        name: string; 
        type: 'matiere_premiere' | 'produit_fini'; 
        totalSpend: number; 
        quantiteAchetee: number;
        occurrences: number;
      } 
    } = {};

    // First populate from the active stockItems list as a baseline or to resolve types
    const stockTypeMap: { [name: string]: 'matiere_premiere' | 'produit_fini' } = {};
    stockItems.forEach(item => {
      stockTypeMap[item.nom.toLowerCase().trim()] = item.type;
    });

    // Populate spending from suppliers (purchases)
    filteredSuppliers.forEach(s => {
      const name = s.articleAchete;
      const key = name.toLowerCase().trim();
      const detectedType = stockTypeMap[key] || 'matiere_premiere'; // Default to raw materials for supplier purchases if unmapped

      if (!productStats[key]) {
        productStats[key] = {
          name,
          type: detectedType,
          totalSpend: 0,
          quantiteAchetee: 0,
          occurrences: 0,
        };
      }
      productStats[key].totalSpend += (s.prixUnitaire * s.quantite);
      productStats[key].quantiteAchetee += s.quantite;
      productStats[key].occurrences += 1;
    });

    // Also factor in any stockItem values from stockItems
    stockItems.forEach(item => {
      const key = item.nom.toLowerCase().trim();
      if (!productStats[key]) {
        productStats[key] = {
          name: item.nom,
          type: item.type,
          totalSpend: item.quantiteInitiale * item.prixUnitaireMoyen,
          quantiteAchetee: item.quantiteInitiale,
          occurrences: 0,
        };
      }
    });

    const list = Object.values(productStats);

    const rawMaterialsList = list.filter(p => p.type === 'matiere_premiere');
    const finishedProductsList = list.filter(p => p.type === 'produit_fini');

    const totalRawSpend = rawMaterialsList.reduce((sum, p) => sum + p.totalSpend, 0);
    const totalFinishedSpend = finishedProductsList.reduce((sum, p) => sum + p.totalSpend, 0);
    const totalOverallSpend = totalRawSpend + totalFinishedSpend;

    // Sort by spending
    const sortedRawMaterials = [...rawMaterialsList].sort((a, b) => b.totalSpend - a.totalSpend).map(p => ({
      ...p,
      percentage: totalRawSpend > 0 ? (p.totalSpend / totalRawSpend) * 100 : 0,
      percentageOverall: totalOverallSpend > 0 ? (p.totalSpend / totalOverallSpend) * 100 : 0
    }));

    const sortedFinishedProducts = [...finishedProductsList].sort((a, b) => b.totalSpend - a.totalSpend).map(p => ({
      ...p,
      percentage: totalFinishedSpend > 0 ? (p.totalSpend / totalFinishedSpend) * 100 : 0,
      percentageOverall: totalOverallSpend > 0 ? (p.totalSpend / totalOverallSpend) * 100 : 0
    }));

    // Client spending on Raw Materials (matières premières)
    // Identify clients buying commodities or raw materials.
    // Map of raw material name to list of clients who purchased it
    const clientsByRawMaterial: {
      [rawMaterialName: string]: {
        clientName: string;
        clientEmail: string;
        quantity: number;
        totalPaid: number;
      }[]
    } = {};

    // Setup an overall clients list who bought raw materials
    const clientsRawMaterialExpenditures: {
      [clientEmail: string]: {
        name: string;
        email: string;
        telephone: string;
        rawMaterialsPurchased: { material: string; qty: number; spent: number }[];
        totalSpentOnRaw: number;
      }
    } = {};

    filteredClients.forEach(c => {
      const prodName = c.produit || '';
      const prodKey = prodName.toLowerCase().trim();
      const isRawMaterial = stockTypeMap[prodKey] === 'matiere_premiere' || 
                            stockItems.find(item => item.nom.toLowerCase().trim() === prodKey)?.type === 'matiere_premiere';

      if (isRawMaterial) {
        // Group by material
        if (!clientsByRawMaterial[prodName]) {
          clientsByRawMaterial[prodName] = [];
        }
        clientsByRawMaterial[prodName].push({
          clientName: c.nomPrenom,
          clientEmail: c.email,
          quantity: c.quantite,
          totalPaid: c.prixApresRemise,
        });

        // Group by client
        const emailKey = c.email.toLowerCase().trim();
        if (!clientsRawMaterialExpenditures[emailKey]) {
          clientsRawMaterialExpenditures[emailKey] = {
            name: c.nomPrenom,
            email: c.email,
            telephone: c.telephone || '',
            rawMaterialsPurchased: [],
            totalSpentOnRaw: 0,
          };
        }
        const clRef = clientsRawMaterialExpenditures[emailKey];
        clRef.totalSpentOnRaw += c.prixApresRemise;
        clRef.rawMaterialsPurchased.push({
          material: prodName,
          qty: c.quantite,
          spent: c.prixApresRemise,
        });
      }
    });

    // For each raw material, sort its clients descending by paid amount
    const topClientPerRawMaterial: { [material: string]: { clientName: string; totalPaid: number; quantity: number } } = {};
    Object.keys(clientsByRawMaterial).forEach(material => {
      const sortedClientsForMat = [...clientsByRawMaterial[material]].sort((a, b) => b.totalPaid - a.totalPaid);
      if (sortedClientsForMat.length > 0) {
        topClientPerRawMaterial[material] = {
          clientName: sortedClientsForMat[0].clientName,
          totalPaid: sortedClientsForMat[0].totalPaid,
          quantity: sortedClientsForMat[0].quantity
        };
      }
    });

    const sortedClientsRawSpend = Object.values(clientsRawMaterialExpenditures)
      .sort((a, b) => b.totalSpentOnRaw - a.totalSpentOnRaw);

    return {
      sortedRawMaterials,
      sortedFinishedProducts,
      totalRawSpend,
      totalFinishedSpend,
      totalOverallSpend,
      topClientPerRawMaterial,
      sortedClientsRawSpend,
      hasRawMaterialSales: sortedClientsRawSpend.length > 0
    };
  }, [filteredClients, filteredSuppliers, stockItems]);

  // --- CHART 1: MONTHLY SALES EVOLUTION ---
  const monthlySalesData = useMemo(() => {
    const monthsFr = ['Janv', 'Févr', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    const dataMap: { [key: string]: { key: string, monthName: string, ventes: number, achats: number, date: Date } } = {};

    const now = new Date();

    if (timeRange === '6m') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        dataMap[key] = {
          key,
          monthName: `${monthsFr[d.getMonth()]} ${d.getFullYear()}`,
          ventes: 0,
          achats: 0,
          date: d
        };
      }
    } else if (timeRange === 'ytd') {
      const currentYear = now.getFullYear();
      for (let m = 0; m <= now.getMonth(); m++) {
        const d = new Date(currentYear, m, 1);
        const key = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
        dataMap[key] = {
          key,
          monthName: `${monthsFr[m]} ${currentYear}`,
          ventes: 0,
          achats: 0,
          date: d
        };
      }
    } else if (timeRange === 'all') {
      clients.forEach(c => {
        const d = new Date(c.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!dataMap[key]) {
          dataMap[key] = {
            key,
            monthName: `${monthsFr[d.getMonth()]} ${d.getFullYear()}`,
            ventes: 0,
            achats: 0,
            date: new Date(d.getFullYear(), d.getMonth(), 1)
          };
        }
      });
      suppliers.forEach(s => {
        const d = new Date(s.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!dataMap[key]) {
          dataMap[key] = {
            key,
            monthName: `${monthsFr[d.getMonth()]} ${d.getFullYear()}`,
            ventes: 0,
            achats: 0,
            date: new Date(d.getFullYear(), d.getMonth(), 1)
          };
        }
      });
    } else {
      selectedMonths.forEach(key => {
        const [yearStr, monthStr] = key.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr) - 1;
        const d = new Date(year, month, 1);
        dataMap[key] = {
          key,
          monthName: `${monthsFr[month]} ${year}`,
          ventes: 0,
          achats: 0,
          date: d
        };
      });
    }

    filteredClients.forEach(c => {
      const date = new Date(c.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (dataMap[key]) {
        dataMap[key].ventes += c.prixApresRemise;
      }
    });

    filteredSuppliers.forEach(s => {
      const date = new Date(s.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (dataMap[key]) {
        dataMap[key].achats += (s.prixUnitaire * s.quantite);
      }
    });

    return Object.values(dataMap).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filteredClients, filteredSuppliers, timeRange, selectedMonths, clients, suppliers]);

  // --- CHART 2: TOP PRODUCTS SOLD ---
  const topProductsData = useMemo(() => {
    const productsMap: { [key: string]: { name: string; salesCount: number; revenue: number } } = {};

    filteredClients.forEach(c => {
      const prodName = c.produit || (c.segment === 'surgele' ? 'Semi-remorque Frigorifique Multi-Température (-20°C)' : 'Fourgon Isotherme Frais (+4°C)');
      if (!productsMap[prodName]) {
        productsMap[prodName] = { name: prodName, salesCount: 0, revenue: 0 };
      }
      productsMap[prodName].salesCount += 1;
      productsMap[prodName].revenue += c.prixApresRemise;
    });

    return Object.values(productsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredClients]);

  // --- CHART 3: TOP CLIENTS BY REVENUE ---
  const topClientsData = useMemo(() => {
    const clientsMap: { [key: string]: { name: string; salesCount: number; revenue: number; email: string; phone: string } } = {};

    filteredClients.forEach(c => {
      const name = c.nomPrenom;
      if (!clientsMap[name]) {
        clientsMap[name] = { name, salesCount: 0, revenue: 0, email: c.email || 'N/A', phone: c.telephone || 'N/A' };
      }
      clientsMap[name].salesCount += 1;
      clientsMap[name].revenue += c.prixApresRemise;
    });

    return Object.values(clientsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredClients]);

  // --- OPERATIONS & FILE COMPLETENESS AUDIT ---
  const operationalPipeline = useMemo(() => {
    const total = filteredClients.length;
    if (total === 0) {
      return {
        healthRate: 0,
        bonCommandeCount: 0,
        factureCount: 0,
        bonLivraisonCount: 0,
        stepCommande: 0,
        stepFacture: 0,
        stepLivraison: 0,
        missingDocsCount: 0,
      };
    }

    const bonCommandeCount = filteredClients.filter(c => c.bonCommande).length;
    const factureCount = filteredClients.filter(c => c.facture).length;
    const bonLivraisonCount = filteredClients.filter(c => c.bonLivraison).length;

    // A dossier is physically complete if all three vital PDFs exist (Command, Invoice, Delivery)
    const completedDossiers = filteredClients.filter(c => c.bonCommande && c.facture && c.bonLivraison).length;
    const healthRate = (completedDossiers / total) * 100;

    // Pipeline Steps
    // Phase 1: Commande enregistrée mais non facturée, non livrée
    const stepCommande = filteredClients.filter(c => c.bonCommande && !c.facture && !c.bonLivraison).length;
    // Phase 2: Facturée mais non livrée
    const stepFacture = filteredClients.filter(c => c.facture && !c.bonLivraison).length;
    // Phase 3: Totalement Livrée et Clôturée
    const stepLivraison = filteredClients.filter(c => c.bonLivraison).length;

    // Remaining cases (unclassified or transitional)
    const otherCases = total - (stepCommande + stepFacture + stepLivraison);

    const missingDocsCount = filteredClients.reduce((sum, c) => {
      let missing = 0;
      if (!c.bonCommande) missing++;
      if (!c.facture) missing++;
      if (!c.bonLivraison) missing++;
      return sum + missing;
    }, 0);

    return {
      healthRate,
      bonCommandeCount,
      factureCount,
      bonLivraisonCount,
      stepCommande,
      stepFacture,
      stepLivraison,
      missingDocsCount,
    };
  }, [filteredClients]);

  // --- ADMINISTRATIVE MISSING DOCUMENTS AUDIT ---
  const clientsWithMissingDocs = useMemo(() => {
    return filteredClients.filter(c => !c.bonCommande || !c.facture || !c.bonLivraison);
  }, [filteredClients]);

  const auditedClients = useMemo(() => {
    return clientsWithMissingDocs.filter(c => {
      const matchesSearch = c.nomPrenom.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
        (c.telephone && c.telephone.includes(auditSearchQuery)) ||
        (c.email && c.email.toLowerCase().includes(auditSearchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (auditFilterType === 'bc') return !c.bonCommande;
      if (auditFilterType === 'facture') return !c.facture;
      if (auditFilterType === 'bl') return !c.bonLivraison;

      return true;
    });
  }, [clientsWithMissingDocs, auditSearchQuery, auditFilterType]);

  // --- THERMAL SEGMENTS PERFORMANCE ANALYSIS ---
  const thermalSegmentsStats = useMemo(() => {
    let fraisCount = 0;
    let fraisRevenue = 0;
    let fraisDiscounts = 0;
    let surgeleCount = 0;
    let surgeleRevenue = 0;
    let surgeleDiscounts = 0;

    filteredClients.forEach(c => {
      const isSurgele = c.segment === 'surgele' || (!c.segment && c.prixBase > 1800000);
      const discountVal = (c.prixBase || c.prixApresRemise) - c.prixApresRemise;
      if (isSurgele) {
        surgeleCount++;
        surgeleRevenue += c.prixApresRemise;
        surgeleDiscounts += discountVal;
      } else {
        fraisCount++;
        fraisRevenue += c.prixApresRemise;
        fraisDiscounts += discountVal;
      }
    });

    const totalRevenue = (fraisRevenue + surgeleRevenue) || 1;

    return {
      frais: {
        count: fraisCount,
        revenue: fraisRevenue,
        share: (fraisRevenue / totalRevenue) * 100,
        avgPrice: fraisCount > 0 ? fraisRevenue / fraisCount : 0,
        discountRate: (fraisRevenue + fraisDiscounts) > 0 ? (fraisDiscounts / (fraisRevenue + fraisDiscounts)) * 100 : 0,
        discountVal: fraisDiscounts,
      },
      surgele: {
        count: surgeleCount,
        revenue: surgeleRevenue,
        share: (surgeleRevenue / totalRevenue) * 100,
        avgPrice: surgeleCount > 0 ? surgeleRevenue / surgeleCount : 0,
        discountRate: (surgeleRevenue + surgeleDiscounts) > 0 ? (surgeleDiscounts / (surgeleRevenue + surgeleDiscounts)) * 100 : 0,
        discountVal: surgeleDiscounts,
      }
    };
  }, [filteredClients]);

  // --- PREDICTIVE WHAT-IF PROFITABILITY SIMULATION ---
  const simulationResults = useMemo(() => {
    const currentSales = stats.totalSales;
    const currentCosts = stats.totalPurchases;
    const currentMargin = stats.grossMargin;

    // Calculate baseline before discounts
    const baseSalesBeforeDiscount = filteredClients.reduce((sum, c) => sum + (c.prixBase || c.prixApresRemise), 0) || 1;

    // 1. Tweak base sales price by slider percentage
    const simulatedBaseSales = baseSalesBeforeDiscount * (1 + simSalesChange / 100);

    // 2. Tweak average discount percentage
    const currentAvgDiscountPct = stats.discountRateAverage;
    const simulatedDiscountPct = Math.max(0, Math.min(100, currentAvgDiscountPct + simDiscountChange));
    const simulatedDiscounts = simulatedBaseSales * (simulatedDiscountPct / 100);
    const simulatedSalesNet = simulatedBaseSales - simulatedDiscounts;

    // 3. Tweak material cost by slider percentage
    const simulatedCosts = currentCosts * (1 + simCostsChange / 100);

    const simulatedMargin = simulatedSalesNet - simulatedCosts;
    const simulatedMarginPct = simulatedSalesNet > 0 ? (simulatedMargin / simulatedSalesNet) * 100 : 0;

    const salesDelta = simulatedSalesNet - currentSales;
    const costsDelta = simulatedCosts - currentCosts;
    const marginDelta = simulatedMargin - currentMargin;

    return {
      simulatedSalesNet,
      simulatedCosts,
      simulatedMargin,
      simulatedMarginPct,
      salesDelta,
      costsDelta,
      marginDelta,
      simulatedDiscountPct,
    };
  }, [stats, filteredClients, simSalesChange, simCostsChange, simDiscountChange]);


  // Custom Tooltip for Monthly sales
  const CustomSalesTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-850 shadow-xl font-sans text-xs">
          <p className="font-black text-slate-400 mb-1.5 uppercase tracking-wider">{label}</p>
          <div className="space-y-1 font-semibold">
            <p className="flex items-center justify-between gap-6 text-[#f5be1a]">
              <span>Ventes (Net) :</span>
              <span className="font-mono font-black">{formatCurrency(payload[0].value)}</span>
            </p>
            {payload[1] && (
              <p className="flex items-center justify-between gap-6 text-slate-300">
                <span>Achats :</span>
                <span className="font-mono font-black">{formatCurrency(payload[1].value)}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Title block with BI Branding */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-3xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
              Business Intelligence & Analyses Financières
            </h2>
          </div>
          <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-medium">
            Rapports de performance en temps réel, répartition des carrosseries isothermes et suivi analytique des flux de trésorerie Carpole.
          </p>
        </div>
        
        {/* Time period filter */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start sm:self-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 hidden lg:inline">Période :</span>
          <button
            type="button"
            onClick={() => setTimeRange('6m')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
              timeRange === '6m' 
                ? 'bg-white text-slate-900 shadow-3xs font-black' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            6 Derniers Mois
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('ytd')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
              timeRange === 'ytd' 
                ? 'bg-white text-slate-900 shadow-3xs font-black' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Année (YTD)
          </button>
          <button
            type="button"
            onClick={() => {
              setTimeRange('custom');
              if (selectedMonths.length === 0) {
                // Pre-populate with current and last month
                const now = new Date();
                const m1 = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const m2 = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
                setSelectedMonths([m1, m2]);
              }
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1 ${
              timeRange === 'custom' 
                ? 'bg-white text-slate-900 shadow-3xs font-black' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3 h-3 text-amber-500" />
            Mois Personnalisés
            {selectedMonths.length > 0 && timeRange === 'custom' && (
              <span className="bg-amber-500 text-slate-950 px-1 py-0.1 rounded-full text-[9px] font-black leading-none min-w-[14px] text-center inline-block">
                {selectedMonths.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('all')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
              timeRange === 'all' 
                ? 'bg-white text-slate-900 shadow-3xs font-black' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tout
          </button>
        </div>
      </div>

      {/* Expandable Custom Months Selector Panel */}
      {timeRange === 'custom' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-500" />
                Sélection Multiple des Mois à Analyser
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Cliquez sur un ou plusieurs mois pour filtrer instantanément l'intégralité des KPIs, graphiques, produits et clients.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const allKeys = availableMonths.map(m => m.key);
                  setSelectedMonths(allKeys);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-[10px] font-black tracking-wide transition-all cursor-pointer"
              >
                Sélectionner Tout
              </button>
              <button
                type="button"
                onClick={() => setSelectedMonths([])}
                className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-[10px] font-black tracking-wide transition-all cursor-pointer"
              >
                Effacer la Sélection
              </button>
            </div>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {availableMonths.map((m) => {
              const isSelected = selectedMonths.includes(m.key);
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedMonths(prev => prev.filter(k => k !== m.key));
                    } else {
                      setSelectedMonths(prev => [...prev, m.key]);
                    }
                  }}
                  className={`px-2 py-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs flex flex-col justify-center items-center ${
                    isSelected
                      ? 'bg-amber-500 border-amber-500 text-slate-950 font-extrabold shadow-3xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 font-bold'
                  }`}
                >
                  <span className="text-[11px] leading-tight font-black truncate max-w-full">
                    {m.label.split(' ')[0]}
                  </span>
                  <span className={`text-[9px] leading-none mt-0.5 ${isSelected ? 'text-slate-900/80' : 'text-slate-400'}`}>
                    {m.label.split(' ')[1]}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedMonths.length === 0 && (
            <div className="text-amber-600 bg-amber-50 border border-amber-200/50 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Aucun mois sélectionné. Veuillez cliquer sur un ou plusieurs mois dans la liste ci-dessus pour afficher les données.
            </div>
          )}
        </div>
      )}

      {/* KPI Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Sales / Turnover */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-[#f5be1a] transition-transform duration-300 group-hover:scale-110 pointer-events-none">
            <Landmark className="w-24 h-24" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Ventes Totales (CA Net)
          </span>
          <p className="text-2xl font-black font-mono text-[#f5be1a] mt-2 tracking-tight">
            {formatCurrency(stats.totalSales)}
          </p>
          <div className="mt-3.5 flex items-center justify-between text-xs border-t border-slate-800/80 pt-3">
            <span className="text-slate-400 font-medium">Dossiers signés</span>
            <span className="font-black font-mono text-slate-200">{stats.clientCount} clients</span>
          </div>
        </div>

        {/* KPI 2: Total Supplier Purchases */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-3xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-900 transition-transform duration-300 group-hover:scale-110 pointer-events-none">
            <ShoppingBag className="w-24 h-24" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Achats Fournisseurs Cumulés
          </span>
          <p className="text-2xl font-black font-mono text-slate-900 mt-2 tracking-tight">
            {formatCurrency(stats.totalPurchases)}
          </p>
          <div className="mt-3.5 flex items-center justify-between text-xs border-t border-slate-100 pt-3">
            <span className="text-slate-400 font-medium">En attente de livraison</span>
            <span className="font-black font-mono text-red-500 bg-red-50 px-2 py-0.5 rounded-md text-[10px]">
              {formatCurrency(stats.pendingPurchases)}
            </span>
          </div>
        </div>

        {/* KPI 3: Calculated Profit Margin */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-3xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-emerald-500 transition-transform duration-300 group-hover:scale-110 pointer-events-none">
            <TrendingUp className="w-24 h-24" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Marge Brute Estimée
          </span>
          <p className={`text-2xl font-black font-mono mt-2 tracking-tight ${stats.grossMargin >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatCurrency(stats.grossMargin)}
          </p>
          <div className="mt-3.5 flex items-center justify-between text-xs border-t border-slate-100 pt-3">
            <span className="text-slate-400 font-medium">Taux de Marge brut</span>
            <span className="font-black font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px]">
              {stats.marginRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* KPI 4: AOV (Panier Moyen) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-3xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-slate-900 transition-transform duration-300 group-hover:scale-110 pointer-events-none">
            <Users className="w-24 h-24" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Panier Moyen de Vente
          </span>
          <p className="text-2xl font-black font-mono text-slate-800 mt-2 tracking-tight">
            {formatCurrency(stats.averageSale)}
          </p>
          <div className="mt-3.5 flex items-center justify-between text-xs border-t border-slate-100 pt-3">
            <span className="text-slate-400 font-medium">Remise Moyenne Accordée</span>
            <span className="font-black font-mono text-slate-600">
              {stats.discountRateAverage.toFixed(1)}%
            </span>
          </div>
        </div>

      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Revenue & Purchases Area Chart (Takes 2 columns on large screens) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-3xs lg:col-span-2 flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4.5 h-4.5 text-amber-500" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Évolution des Ventes vs Volume d'Achats
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-mono text-[9px] font-bold">
                <Calendar className="w-3 h-3" /> Dynamique par mois
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-1">
              Visualisation comparée du chiffre d'affaires perçu et des dépenses matérielles chez les fournisseurs.
            </p>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlySalesData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f5be1a" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f5be1a" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="monthName" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M DA`}
                />
                <Tooltip content={<CustomSalesTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, fontWeight: 'bold', color: '#475569' }}
                />
                <Area 
                  name="Chiffre d'Affaires Net" 
                  type="monotone" 
                  dataKey="ventes" 
                  stroke="#f5be1a" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
                <Area 
                  name="Dépenses d'Achats" 
                  type="monotone" 
                  dataKey="achats" 
                  stroke="#94a3b8" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorPurchases)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top Products Progress Widget */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Top Produits Vendus
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-600 font-extrabold uppercase bg-amber-50 px-2 py-0.5 rounded-full">
                Par Chiffre d'Affaires
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-1 leading-tight">
              Classement des modèles de carrosserie isotherme et frigorifique les plus vendus.
            </p>
          </div>

          {topProductsData.length > 0 ? (
            <div className="space-y-4 my-4 flex-1 flex flex-col justify-center">
              {topProductsData.map((item, idx) => {
                const totalSalesRevenue = topProductsData.reduce((sum, p) => sum + p.revenue, 0) || 1;
                const percentage = Math.round((item.revenue / totalSalesRevenue) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="truncate max-w-[170px]" title={item.name}>{item.name}</span>
                      <span className="font-mono text-slate-900">{formatCurrency(item.revenue)}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${idx === 0 ? 'bg-amber-500' : 'bg-slate-400'}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 font-black min-w-[32px] text-right">
                        {percentage}%
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">
                      {item.salesCount} unité{item.salesCount > 1 ? 's' : ''} installée{item.salesCount > 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-xs font-semibold">
              Aucun produit enregistré pour le moment.
            </div>
          )}
        </div>

      </div>

      {/* Row 2: Top Clients List and Performance */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-3xs">
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-amber-500" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Classement des Top Clients (Volume d'Affaires)
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 font-mono">Top 5 Clients d'Élite</span>
          </div>
          <p className="text-slate-400 text-[11px] mt-1 leading-tight">
            Analyse des partenaires commerciaux les plus importants en termes de chiffre d'affaires brut injecté dans l'activité.
          </p>
        </div>

        {topClientsData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Top list of client cards (takes 7 columns) */}
            <div className="lg:col-span-7 space-y-3">
              {topClientsData.map((client, index) => {
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;
                
                let badgeStyle = "bg-slate-100 text-slate-600 border-slate-200";
                if (isFirst) badgeStyle = "bg-amber-100 text-amber-800 border-amber-300 font-black";
                else if (isSecond) badgeStyle = "bg-slate-200 text-slate-800 border-slate-300 font-black";
                else if (isThird) badgeStyle = "bg-amber-700/10 text-amber-900 border-amber-700/20 font-black";

                const clientShare = stats.totalSales > 0 ? (client.revenue / stats.totalSales) * 100 : 0;

                return (
                  <div 
                    key={index} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-105 bg-slate-50/40 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank badge */}
                      <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs ${badgeStyle}`}>
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-slate-800 truncate">
                          {client.name}
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-medium">
                          <span className="truncate">{client.email}</span>
                          <span>•</span>
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                      <span className="text-sm font-black font-mono text-slate-900">
                        {formatCurrency(client.revenue)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {client.salesCount} dossier{client.salesCount > 1 ? 's' : ''} ({clientShare.toFixed(1)}% du CA)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Performance analysis widget (takes 5 columns) */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1.5 border-b border-slate-200">
                  Performance & Concentration Client
                </h4>
                <div className="mt-4 space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Le premier client, <strong className="text-slate-800">{topClientsData[0]?.name || 'N/A'}</strong>, représente à lui seul{' '}
                    <strong className="text-amber-600 font-black">
                      {stats.totalSales > 0 ? ((topClientsData[0]?.revenue / stats.totalSales) * 100).toFixed(1) : 0}%
                    </strong>{' '}
                    du chiffre d'affaires global.
                  </p>
                  
                  {/* Progress visualization */}
                  <div className="space-y-2 bg-white rounded-xl p-4 border border-slate-200/50">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                      Part des 3 Premiers Clients dans le CA
                    </span>
                    {(() => {
                      const top3Sum = topClientsData.slice(0, 3).reduce((sum, c) => sum + c.revenue, 0);
                      const top3Percentage = stats.totalSales > 0 ? (top3Sum / stats.totalSales) * 100 : 0;
                      return (
                        <div className="space-y-1">
                          <div className="flex items-baseline justify-between">
                            <span className="text-lg font-black text-slate-800 font-mono">
                              {top3Percentage.toFixed(1)}%
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {formatCurrency(top3Sum)} / {formatCurrency(stats.totalSales)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-1">
                            <div 
                              className="h-full bg-amber-500 rounded-full" 
                              style={{ width: `${top3Percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-medium leading-normal mt-4 bg-white/60 p-3 rounded-lg border border-slate-100">
                💡 Un taux de concentration élevé suggère des partenariats stratégiques solides, mais invite à élargir le portefeuille commercial pour lisser les risques de saisonnalité.
              </div>
            </div>

          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400 text-xs font-semibold">
            Aucune vente enregistrée pour le moment.
          </div>
        )}
      </div>

      {/* Analyses Avancées du Stock & BI d'Approvisionnement */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-3xs text-left space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border border-amber-500/20 inline-flex items-center gap-1.5 mb-2.5">
            <Boxes className="w-3.5 h-3.5" /> Intelligence de Stock & Approvisionnement
          </span>
          <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
            Analyse BI du Stock & Consommation des Matières Premières
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Visualisez le poids financier de chaque produit acheté, la ventilation précise entre Matières Premières et Produits Finis, ainsi que la cartographie des clients consommateurs de vos ressources.
          </p>
        </div>

        {/* Global Breakdown Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Spend */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Budgétisé (Valeur + Achats)</span>
            <div className="mt-2.5">
              <span className="text-xl font-mono font-black text-slate-800 block">
                {formatCurrency(stockAnalytics.totalOverallSpend)}
              </span>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                Investissement matériel consolidé
              </span>
            </div>
          </div>

          {/* Raw Materials Total */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Part Matières Premières</span>
              <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-sm border border-indigo-100">
                {stockAnalytics.totalOverallSpend > 0 ? ((stockAnalytics.totalRawSpend / stockAnalytics.totalOverallSpend) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-xl font-mono font-black text-slate-800 block">
                {formatCurrency(stockAnalytics.totalRawSpend)}
              </span>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                Composants, isolants, tuyauteries
              </span>
            </div>
          </div>

          {/* Finished Products Total */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Part Produits Finis</span>
              <span className="bg-cyan-50 text-cyan-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-sm border border-cyan-100">
                {stockAnalytics.totalOverallSpend > 0 ? ((stockAnalytics.totalFinishedSpend / stockAnalytics.totalOverallSpend) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-xl font-mono font-black text-slate-800 block">
                {formatCurrency(stockAnalytics.totalFinishedSpend)}
              </span>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                Groupes complets, portes montées
              </span>
            </div>
          </div>
        </div>

        {/* Master Grid: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Column A: Expenditures breakdown by category (Takes 7 columns) */}
          <div className="lg:col-span-7 space-y-5 bg-slate-50/30 border border-slate-105 p-5 rounded-xl">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Pourcentage de Dépense de chaque Produit
                </h4>
                <p className="text-slate-400 text-[10px]">
                  Classement par poids budgétaire, ventilé par type d'article.
                </p>
              </div>
            </div>

            {/* Sub-grid for Raw Materials vs Finished Products list */}
            <div className="space-y-6">
              {/* Category 1: Matières Premières */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm uppercase tracking-widest border border-indigo-100 inline-block">
                  Matières Premières ({stockAnalytics.sortedRawMaterials.length} articles)
                </span>
                
                {stockAnalytics.sortedRawMaterials.length > 0 ? (
                  <div className="space-y-2 bg-white p-3.5 border border-slate-150 rounded-xl shadow-3xs max-h-[220px] overflow-y-auto">
                    {stockAnalytics.sortedRawMaterials.map((product, i) => (
                      <div key={i} className="space-y-1 pb-2 border-b border-slate-50 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="font-extrabold text-slate-800 truncate max-w-[280px]" title={product.name}>
                            {product.name}
                          </span>
                          <span className="font-mono font-black text-slate-900">
                            {formatCurrency(product.totalSpend)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Qté cumulée: <strong className="text-slate-600">{product.quantiteAchetee}</strong>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-indigo-600 font-extrabold" title="Part dans la catégorie Matières Premières">
                              Catégorie: {product.percentage.toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold" title="Part dans l'investissement total">
                              Total: {product.percentageOverall.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full" 
                            style={{ width: `${product.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-4">Aucune matière première enregistrée.</p>
                )}
              </div>

              {/* Category 2: Produits Finis */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-sm uppercase tracking-widest border border-cyan-100 inline-block">
                  Produits Finis ({stockAnalytics.sortedFinishedProducts.length} articles)
                </span>

                {stockAnalytics.sortedFinishedProducts.length > 0 ? (
                  <div className="space-y-2 bg-white p-3.5 border border-slate-150 rounded-xl shadow-3xs max-h-[220px] overflow-y-auto">
                    {stockAnalytics.sortedFinishedProducts.map((product, i) => (
                      <div key={i} className="space-y-1 pb-2 border-b border-slate-50 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="font-extrabold text-slate-800 truncate max-w-[280px]" title={product.name}>
                            {product.name}
                          </span>
                          <span className="font-mono font-black text-slate-900">
                            {formatCurrency(product.totalSpend)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Qté cumulée: <strong className="text-slate-600">{product.quantiteAchetee}</strong>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-cyan-600 font-extrabold" title="Part dans la catégorie Produits Finis">
                              Catégorie: {product.percentage.toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold" title="Part dans l'investissement total">
                              Total: {product.percentageOverall.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-cyan-500 h-full rounded-full" 
                            style={{ width: `${product.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-4">Aucun produit fini enregistré.</p>
                )}
              </div>
            </div>
          </div>

          {/* Column B: Client raw material consumption analysis (Takes 5 columns) */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-100 rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Consommation de Matières Premières par Client
                </h4>
                <p className="text-slate-400 text-[10px] mt-0.5">
                  Clients ayant acheté des matières premières (composants / fournitures de stock).
                </p>
              </div>

              {stockAnalytics.hasRawMaterialSales ? (
                <div className="space-y-3.5">
                  <div className="bg-indigo-50/40 p-3 rounded-lg border border-indigo-100/40">
                    <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block">Le plus gros consommateur</span>
                    <div className="flex items-center justify-between mt-1.5">
                      <div>
                        <strong className="text-slate-800 text-xs">{stockAnalytics.sortedClientsRawSpend[0].name}</strong>
                        <p className="text-[10px] text-slate-400 mt-0.5">{stockAnalytics.sortedClientsRawSpend[0].email}</p>
                      </div>
                      <span className="text-sm font-mono font-black text-indigo-700">
                        {formatCurrency(stockAnalytics.sortedClientsRawSpend[0].totalSpentOnRaw)}
                      </span>
                    </div>
                  </div>

                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                    Classement des Clients Consommateurs
                  </span>

                  <div className="space-y-2 max-h-[230px] overflow-y-auto pr-1">
                    {stockAnalytics.sortedClientsRawSpend.map((client, index) => (
                      <div key={index} className="bg-white border border-slate-200/60 p-3 rounded-xl flex flex-col gap-1.5 shadow-3xs hover:border-slate-300/80 transition-colors">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <span className="w-4.5 h-4.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] flex items-center justify-center font-bold font-mono">
                              {index + 1}
                            </span>
                            {client.name}
                          </span>
                          <span className="text-xs font-mono font-black text-slate-900">
                            {formatCurrency(client.totalSpentOnRaw)}
                          </span>
                        </div>

                        {/* List of specific raw materials purchased by this client */}
                        <div className="flex flex-wrap gap-1 mt-1 border-t border-slate-50 pt-1.5">
                          {client.rawMaterialsPurchased.map((item, idx) => (
                            <span key={idx} className="bg-slate-50 border border-slate-200/50 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-md" title={`${item.material}: ${item.qty} unités`}>
                              {item.material} ({item.qty})
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center text-center p-4 bg-white border border-slate-100 border-dashed rounded-xl">
                  <Boxes className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-[11px] font-bold text-slate-400">Aucune consommation de matière première</p>
                  <p className="text-[10px] text-slate-400/80 mt-0.5 max-w-[200px] leading-normal">
                    Assurez-vous d'avoir des clients dont le "produit" correspond au nom d'une matière première enregistrée en stock.
                  </p>
                </div>
              )}
            </div>

            {/* Quick action helper card */}
            <div className="text-[10px] text-slate-400 font-medium leading-normal mt-4 bg-white p-3 rounded-lg border border-slate-100 flex items-center gap-2">
              <span className="text-amber-500 font-bold">💡 BI Tip:</span>
              <span>Cibler les clients qui consomment le plus de matières premières pour leur proposer des contrats d'approvisionnement annuel de gros.</span>
            </div>
          </div>

        </div>
      </div>

      {/* Row 3: Operational Pipeline */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-3xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-amber-500" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Avancement Opérationnel & Audit Documentaire
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full font-mono text-[9px] font-black uppercase">
              Pipeline Interne
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-1">
            Visualisation du cycle de vie des dossiers et taux de conformité administrative des pièces jointes (BC, Factures, BL).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5">
          {/* Step 1: Commande */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 relative overflow-hidden">
            <span className="absolute top-1 right-2 text-3xl font-black text-slate-200/50 select-none">1</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Étape 1</span>
            <span className="text-xs font-black text-slate-800 mt-1 block">Commandes Initiées</span>
            <p className="text-lg font-mono font-black text-slate-900 mt-1.5">
              {operationalPipeline.bonCommandeCount} <span className="text-[10px] text-slate-400 font-bold">dossiers</span>
            </p>
            <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full" 
                style={{ width: `${filteredClients.length > 0 ? (operationalPipeline.bonCommandeCount / filteredClients.length) * 100 : 0}%` }} 
              />
            </div>
            <span className="text-[9px] text-slate-400 font-semibold mt-1 block">
              {operationalPipeline.stepCommande} en attente de facturation
            </span>
          </div>

          {/* Step 2: Facturation */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 relative overflow-hidden">
            <span className="absolute top-1 right-2 text-3xl font-black text-slate-200/50 select-none">2</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Étape 2</span>
            <span className="text-xs font-black text-slate-800 mt-1 block">Dossiers Facturés</span>
            <p className="text-lg font-mono font-black text-slate-900 mt-1.5">
              {operationalPipeline.factureCount} <span className="text-[10px] text-slate-400 font-bold">dossiers</span>
            </p>
            <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-slate-500 h-full rounded-full" 
                style={{ width: `${filteredClients.length > 0 ? (operationalPipeline.factureCount / filteredClients.length) * 100 : 0}%` }} 
              />
            </div>
            <span className="text-[9px] text-slate-400 font-semibold mt-1 block">
              {operationalPipeline.stepFacture} en attente de livraison
            </span>
          </div>

          {/* Step 3: Livraison */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 relative overflow-hidden">
            <span className="absolute top-1 right-2 text-3xl font-black text-slate-200/50 select-none">3</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Étape 3</span>
            <span className="text-xs font-black text-slate-800 mt-1 block">Clôturés & Livrés</span>
            <p className="text-lg font-mono font-black text-slate-900 mt-1.5">
              {operationalPipeline.bonLivraisonCount} <span className="text-[10px] text-slate-400 font-bold">dossiers</span>
            </p>
            <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full" 
                style={{ width: `${filteredClients.length > 0 ? (operationalPipeline.bonLivraisonCount / filteredClients.length) * 100 : 0}%` }} 
              />
            </div>
            <span className="text-[9px] text-slate-400 font-semibold mt-1 block">
              100% archivés et conformes
            </span>
          </div>
        </div>

        {/* Compliance Audit and Document Completeness Health Score */}
        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center font-mono font-black text-slate-700 text-sm">
              {Math.round(operationalPipeline.healthRate)}%
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 block">Indice de Conformité Administrative</span>
              <span className="text-[10px] text-slate-400 font-medium">
                Pourcentage de dossiers de vente contenant l'intégralité des 3 pièces justificatives.
              </span>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-100 sm:pl-4 flex flex-col items-end justify-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Fichiers manquants détectés</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-black font-mono text-red-500 bg-red-50 px-2 py-0.5 rounded-md inline-block">
                {operationalPipeline.missingDocsCount} documents absents
              </span>
              {clientsWithMissingDocs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAuditModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-3xs flex items-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Auditer les dossiers
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Predictive What-If Profit Simulator & Margin Optimization Playground */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-3xs">
        <div className="mb-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-500 animate-pulse" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Simulateur de Rentabilité "What-If" & Optimisation de Marge
              </h3>
            </div>
            <p className="text-slate-400 text-[11px] mt-1">
              Modélisez l'impact d'une modification tarifaire globale, d'une fluctuation des coûts d'approvisionnement ou d'une maîtrise des remises accordées.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSimSalesChange(0);
              setSimCostsChange(0);
              setSimDiscountChange(0);
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-[10px] font-black tracking-wide transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-400" />
            Réinitialiser au Réel
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Sliders Area (takes 5 columns) */}
          <div className="lg:col-span-5 space-y-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100 flex flex-col justify-between">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">
              Paramètres de Simulation d'Activité
            </h4>

            {/* Slider 1: Sales Price modification */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Prix de Vente de Base :</span>
                <span className={`font-mono font-black px-1.5 py-0.5 rounded ${simSalesChange > 0 ? 'text-emerald-700 bg-emerald-50' : simSalesChange < 0 ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100'}`}>
                  {simSalesChange > 0 ? `+${simSalesChange}` : simSalesChange}%
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="1"
                value={simSalesChange}
                onChange={(e) => setSimSalesChange(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                <span>-20% (Baisse)</span>
                <span>Neutre</span>
                <span>+20% (Hausse)</span>
              </div>
            </div>

            {/* Slider 2: Supplier costs modification */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Coûts Fournisseurs (Fournitures) :</span>
                <span className={`font-mono font-black px-1.5 py-0.5 rounded ${simCostsChange > 0 ? 'text-red-600 bg-red-50' : simCostsChange < 0 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'}`}>
                  {simCostsChange > 0 ? `+${simCostsChange}` : simCostsChange}%
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="1"
                value={simCostsChange}
                onChange={(e) => setSimCostsChange(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                <span>-20% (Économie)</span>
                <span>Neutre</span>
                <span>+20% (Inflation)</span>
              </div>
            </div>

            {/* Slider 3: Allowed Discount shift */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Variation du Taux de Remise global :</span>
                <span className={`font-mono font-black px-1.5 py-0.5 rounded ${simDiscountChange > 0 ? 'text-red-600 bg-red-50' : simDiscountChange < 0 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'}`}>
                  {simDiscountChange > 0 ? `+${simDiscountChange}` : simDiscountChange}% de remise
                </span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={simDiscountChange}
                onChange={(e) => setSimDiscountChange(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                <span>-10% (Moins de remises)</span>
                <span>Actuel</span>
                <span>+10% (Plus de remises)</span>
              </div>
            </div>
          </div>

          {/* Simulation Output Area (takes 7 columns) */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">
              Résultats Financiers Modélisés (Simulé vs Réel)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Simulated Revenue */}
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/20">
                <span className="text-[10px] font-black text-slate-400 uppercase block">Chiffre d'Affaires Net</span>
                <span className="text-lg font-mono font-black text-slate-800 mt-1 block">
                  {formatCurrency(simulationResults.simulatedSalesNet)}
                </span>
                <div className="mt-1.5 flex items-center gap-1">
                  {simulationResults.salesDelta > 0 ? (
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                      +{formatCurrency(simulationResults.salesDelta)}
                    </span>
                  ) : simulationResults.salesDelta < 0 ? (
                    <span className="inline-flex items-center text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                      <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                      {formatCurrency(simulationResults.salesDelta)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold">Inchangé</span>
                  )}
                </div>
              </div>

              {/* Simulated Cost */}
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/20">
                <span className="text-[10px] font-black text-slate-400 uppercase block">Coût Matériel Fournisseur</span>
                <span className="text-lg font-mono font-black text-slate-800 mt-1 block">
                  {formatCurrency(simulationResults.simulatedCosts)}
                </span>
                <div className="mt-1.5 flex items-center gap-1">
                  {simulationResults.costsDelta < 0 ? (
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                      -{formatCurrency(Math.abs(simulationResults.costsDelta))} (Économie)
                    </span>
                  ) : simulationResults.costsDelta > 0 ? (
                    <span className="inline-flex items-center text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                      <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                      +{formatCurrency(simulationResults.costsDelta)} (Surcoût)
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold">Inchangé</span>
                  )}
                </div>
              </div>

              {/* Simulated Margin */}
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/20 sm:col-span-2 relative overflow-hidden">
                <div className="absolute right-4 top-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase block text-right">Taux de Marge</span>
                  <span className="text-lg font-mono font-black text-slate-900 block text-right">
                    {simulationResults.simulatedMarginPct.toFixed(1)}%
                  </span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase block">Marge Brute Modélisée</span>
                <span className={`text-xl font-mono font-black mt-1 block ${simulationResults.simulatedMargin >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatCurrency(simulationResults.simulatedMargin)}
                </span>
                
                <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Écart sur profit net :</span>
                  {simulationResults.marginDelta > 0 ? (
                    <span className="inline-flex items-center text-[11px] font-black text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                      <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                      Surgain de +{formatCurrency(simulationResults.marginDelta)} (Marge +{ (simulationResults.simulatedMarginPct - stats.marginRate).toFixed(1) } pts)
                    </span>
                  ) : simulationResults.marginDelta < 0 ? (
                    <span className="inline-flex items-center text-[11px] font-black text-red-700 bg-red-100/60 px-2 py-0.5 rounded-full">
                      <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                      Déficit de {formatCurrency(simulationResults.marginDelta)} (Marge { (simulationResults.simulatedMarginPct - stats.marginRate).toFixed(1) } pts)
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-black bg-slate-100 px-2 py-0.5 rounded-full">Identique à la réalité</span>
                  )}
                </div>
              </div>
            </div>

            {/* Simulated Advisory and Insights Card */}
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-xs space-y-1.5 flex-1 flex flex-col justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Recommandation Stratégique</span>
              <p className="text-slate-600 font-medium leading-relaxed">
                {simulationResults.marginDelta > 0 ? (
                  <span>
                    🚀 <strong>Scénario Favorable</strong> : La configuration de prix appliquée (+{simSalesChange}% en vente, {simDiscountChange < 0 ? `${simDiscountChange}% remises` : 'remises actuelles'}) surmonte l'inflation fournisseur et booste votre marge de <strong className="text-emerald-600">{formatCurrency(simulationResults.marginDelta)}</strong>. Ce positionnement protège durablement la trésorerie de l'entreprise.
                  </span>
                ) : simulationResults.marginDelta < 0 ? (
                  <span>
                    ⚠️ <strong>Attention Risque de Contraction</strong> : Ce scénario engendre une érosion de marge de <strong className="text-red-500">{formatCurrency(Math.abs(simulationResults.marginDelta))}</strong>. Si vos prix de vente ne suivent pas la hausse des fournitures fournisseur (+{simCostsChange}%), vous détruisez de la valeur commerciale. Reconsidérer la stratégie de remise.
                  </span>
                ) : (
                  <span>
                    💡 Ajustez les curseurs ci-contre pour modéliser une politique de pricing robuste. Un point de pourcentage de marge brute préservé correspond à un gain immédiat de trésorerie disponible pour Carpole.
                  </span>
                )}
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* Missing documents audit modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-500 animate-bounce" />
                  Audit Documentaire : Dossiers Clients Incomplets
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Liste des ventes pour lesquelles il manque au moins l'une des pièces justificatives obligatoires ({clientsWithMissingDocs.length} dossiers identifiés).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAuditModal(false);
                  setAuditSearchQuery('');
                  setAuditFilterType('all');
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Filters & Search bar */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold"
                />
                {auditSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAuditSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-black"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Status Tabs */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start md:self-center">
                <button
                  type="button"
                  onClick={() => setAuditFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    auditFilterType === 'all'
                      ? 'bg-white text-slate-900 shadow-3xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tout ({clientsWithMissingDocs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilterType('bc')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                    auditFilterType === 'bc'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-3xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${auditFilterType === 'bc' ? 'bg-slate-950' : 'bg-amber-500'}`} />
                  Sans BC ({clientsWithMissingDocs.filter(c => !c.bonCommande).length})
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilterType('facture')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                    auditFilterType === 'facture'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-3xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${auditFilterType === 'facture' ? 'bg-slate-950' : 'bg-rose-500'}`} />
                  Sans Facture ({clientsWithMissingDocs.filter(c => !c.facture).length})
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilterType('bl')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                    auditFilterType === 'bl'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-3xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${auditFilterType === 'bl' ? 'bg-slate-950' : 'bg-cyan-500'}`} />
                  Sans BL ({clientsWithMissingDocs.filter(c => !c.bonLivraison).length})
                </button>
              </div>
            </div>

            {/* Modal Body / Client Audit Table */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/40">
              {auditedClients.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200/60 p-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-pulse" />
                  <p className="mt-3 text-xs font-black text-slate-700 uppercase">Aucun dossier incomplet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Tous les dossiers de cette sélection sont complets ou aucun client ne correspond à votre filtre de recherche.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-3xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-slate-100">
                        <th className="py-3 px-4">Client / Date</th>
                        <th className="py-3 px-4">Segment / Matériel</th>
                        <th className="py-3 px-4 text-center">Bon de Commande (BC)</th>
                        <th className="py-3 px-4 text-center">Facture</th>
                        <th className="py-3 px-4 text-center">Bon de Livraison (BL)</th>
                        <th className="py-3 px-4 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditedClients.map((client) => {
                        return (
                          <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Client & Contact info */}
                            <td className="py-3.5 px-4">
                              <div className="font-extrabold text-slate-800">{client.nomPrenom}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                                <span className="font-mono">{new Date(client.createdAt).toLocaleDateString('fr-DZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                <span>•</span>
                                <span>{client.telephone || 'Sans tél'}</span>
                              </div>
                            </td>

                            {/* Segment and Product */}
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                client.segment === 'surgele' || (!client.segment && client.prixBase > 1800000)
                                  ? 'bg-cyan-50 text-cyan-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}>
                                {client.segment === 'surgele' || (!client.segment && client.prixBase > 1800000) ? 'Surgelé' : 'Frais'}
                              </span>
                              <div className="text-[10px] text-slate-500 font-bold truncate max-w-[180px] mt-0.5" title={client.produit}>
                                {client.produit || 'Équipement isotherme'}
                              </div>
                            </td>

                            {/* Bon de commande status */}
                            <td className="py-3.5 px-4 text-center">
                              {client.bonCommande ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black border border-emerald-100/50">
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  Reçu
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black border border-amber-200/40">
                                  <AlertCircle className="w-3 h-3 text-amber-500 animate-pulse" />
                                  Manquant
                                </span>
                              )}
                            </td>

                            {/* Facture status */}
                            <td className="py-3.5 px-4 text-center">
                              {client.facture ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black border border-emerald-100/50">
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  Reçu
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-black border border-rose-200/40">
                                  <AlertCircle className="w-3 h-3 text-rose-500 animate-pulse" />
                                  Manquant
                                </span>
                              )}
                            </td>

                            {/* Bon de livraison status */}
                            <td className="py-3.5 px-4 text-center">
                              {client.bonLivraison ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black border border-emerald-100/50">
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  Reçu
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-50 text-cyan-700 rounded-full text-[10px] font-black border border-cyan-200/40">
                                  <AlertCircle className="w-3 h-3 text-cyan-500 animate-pulse" />
                                  Manquant
                                </span>
                              )}
                            </td>

                            {/* Price */}
                            <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                              {formatCurrency(client.prixApresRemise)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400 font-bold">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                Conseil : Importez les documents manquants directement dans la fiche de chaque client dans la section "Clients".
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowAuditModal(false);
                  setAuditSearchQuery('');
                  setAuditFilterType('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-950 text-white transition-colors cursor-pointer text-[10px] font-black uppercase tracking-wider"
              >
                Fermer l'audit
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
