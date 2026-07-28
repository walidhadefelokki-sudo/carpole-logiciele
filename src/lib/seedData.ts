/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Supplier, StockItem } from '../types';

// A minimal valid 1-page PDF encoded in Base64 for the PDF previewer
const MINIMAL_PDF_BASE64 = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iagogIDw8IC9LaW5kcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4KZW5kb2JqCjIgMCBvYmoKICA8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMSAwIFIgPj4KZW5kb2JqCjMgMCBvYmoKICA8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDEgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUgODQyIF0gL1Jlc291cmNlcyA8PCA+PiA+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNjIgMDAwMDAgbiAKMDAwMDAwMDAxMTEgMDAwMDAgbiAKdHJhaWxlcgogIDw8IC9TaXplIDQgL1Jvb3QgMiAwIFIgPj4Kc3RhcnR4cmVmCjE3OQolJUVPRg==';

export const SEED_CLIENTS: Client[] = [
  {
    id: 'c1-soummam',
    nomPrenom: 'SARL Froid Trans Soummam',
    telephone: '034 25 88 12',
    email: 'logistique@soummam-trans.dz',
    nis: '002015340123456',
    nif: '001506012456789',
    rc: '16/00-0987654B15',
    numArticle: '16215432101',
    bonCommande: {
      id: 'bc-101',
      name: 'BC_SarlTransSoummam_Isotherme_3Van.pdf',
      type: 'application/pdf',
      size: 10450,
      dataUrl: MINIMAL_PDF_BASE64
    },
    facture: {
      id: 'fact-101',
      name: 'Facture_F1023_Carpole.pdf',
      type: 'application/pdf',
      size: 12100,
      dataUrl: MINIMAL_PDF_BASE64
    },
    bonLivraison: null, // Left empty to show visual "incomplet" status
    retour: 'Ajustement requis sur la charnière droite de la porte arrière isotherme lors de la livraison intermédiaire.',
    remise: true,
    prixBase: 2850000,
    tauxRemise: 5,
    prixApresRemise: 2707500, // calculated
    segment: 'surgele',
    produit: 'Semi-remorque Frigorifique Multi-Température (-20°C)',
    typeClient: 'production',
    etapeCommande: 'montage',
    quantite: 3,
    dateAchat: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    montantPaye: 5000000, // Partial payment
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString() // 7 days ago
  },
  {
    id: 'c2-mitidja',
    nomPrenom: 'EURL Agro-Alimentaire Mitidja',
    telephone: '025 43 11 90',
    email: 'achats@mitidja-agro.com',
    nis: '001925120654321',
    nif: '001925120654321000',
    rc: '09/00-1122334B20',
    numArticle: '09320987654',
    bonCommande: {
      id: 'bc-102',
      name: 'BC_Mitidja_GroupeFrigo_Carrier.pdf',
      type: 'application/pdf',
      size: 15400,
      dataUrl: MINIMAL_PDF_BASE64
    },
    facture: null,
    bonLivraison: null,
    retour: '',
    remise: false,
    prixBase: 1450000,
    tauxRemise: 0,
    prixApresRemise: 1450000,
    segment: 'frais',
    produit: 'Fourgon Isotherme Frais (+4°C)',
    typeClient: 'technicien_froid',
    quantite: 1,
    dateAchat: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    montantPaye: 1450000, // Fully paid
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() // 3 days ago
  },
  {
    id: 'c3-ramdy',
    nomPrenom: 'EURL Laiterie El Ramdy',
    telephone: '026 12 34 56',
    email: 'contact@ramdy-laiterie.dz',
    nis: '002015340112233',
    nif: '001506012456001',
    rc: '15/00-0987654B15',
    numArticle: '15215432101',
    bonCommande: {
      id: 'bc-103',
      name: 'BC_Ramdy_Laiterie_Porteur.pdf',
      type: 'application/pdf',
      size: 11200,
      dataUrl: MINIMAL_PDF_BASE64
    },
    facture: {
      id: 'fact-103',
      name: 'Facture_F1045_Carpole.pdf',
      type: 'application/pdf',
      size: 13500,
      dataUrl: MINIMAL_PDF_BASE64
    },
    bonLivraison: {
      id: 'bl-103',
      name: 'BL_L1045_Signe_Ramdy.pdf',
      type: 'application/pdf',
      size: 9800,
      dataUrl: MINIMAL_PDF_BASE64
    },
    retour: 'Installation impeccable, contrôle de température validé à +4°C.',
    remise: true,
    prixBase: 3100000,
    tauxRemise: 8,
    prixApresRemise: 2852000,
    segment: 'frais',
    produit: 'Camion Porteur Isotherme avec Groupe Thermoking (+4°C)',
    typeClient: 'production',
    etapeCommande: 'livraison',
    quantite: 1,
    dateAchat: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
    montantPaye: 2852000, // Fully paid
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'c4-ifri',
    nomPrenom: 'SNC Sources Ifri',
    telephone: '034 32 10 98',
    email: 'logistique@ifri-dz.com',
    nis: '001815340112244',
    nif: '001806012456002',
    rc: '18/00-0987654B16',
    numArticle: '18215432102',
    bonCommande: {
      id: 'bc-104',
      name: 'BC_Ifri_IsothermeGrandeCapacite.pdf',
      type: 'application/pdf',
      size: 14800,
      dataUrl: MINIMAL_PDF_BASE64
    },
    facture: null,
    bonLivraison: null,
    retour: 'Dossier en attente de la facture proforma finale.',
    remise: false,
    prixBase: 4200000,
    tauxRemise: 0,
    prixApresRemise: 4200000,
    segment: 'frais',
    produit: '3x Remorques Isothermes Grande Capacité (Frais)',
    typeClient: 'production',
    etapeCommande: 'stratification',
    quantite: 3,
    dateAchat: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    montantPaye: 0, // Unpaid
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'c5-saida',
    nomPrenom: 'SARL Eaux Minérales Saïda',
    telephone: '021 75 44 33',
    email: 'saida.logistique@saida-groupe.dz',
    nis: '001715340112255',
    nif: '001706012456003',
    rc: '17/00-0987654B17',
    numArticle: '17215432103',
    bonCommande: {
      id: 'bc-105',
      name: 'BC_Saida_Semi_Isotherme.pdf',
      type: 'application/pdf',
      size: 12500,
      dataUrl: MINIMAL_PDF_BASE64
    },
    facture: {
      id: 'fact-105',
      name: 'Facture_F1049_Carpole.pdf',
      type: 'application/pdf',
      size: 14100,
      dataUrl: MINIMAL_PDF_BASE64
    },
    bonLivraison: null,
    retour: 'En attente de réception du Bon de Livraison signé par le transporteur.',
    remise: true,
    prixBase: 2400000,
    tauxRemise: 10,
    prixApresRemise: 2160000,
    segment: 'frais',
    produit: "Semi-remorque Isotherme d'Alimentation Frais",
    typeClient: 'carrossier',
    quantite: 1,
    dateAchat: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString().split('T')[0],
    montantPaye: 1000000, // Partial payment
    createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'c6-cevital',
    nomPrenom: 'SPA Cevital Agro-Industrie',
    telephone: '034 20 11 22',
    email: 'supplychain@cevital.com',
    nis: '001615340112266',
    nif: '001606012456004',
    rc: '16/00-0987654B18',
    numArticle: '16215432104',
    bonCommande: {
      id: 'bc-106',
      name: 'BC_Cevital_ChambreFroideMobile.pdf',
      type: 'application/pdf',
      size: 19500,
      dataUrl: MINIMAL_PDF_BASE64
    },
    facture: {
      id: 'fact-106',
      name: 'Facture_F1039_Carpole.pdf',
      type: 'application/pdf',
      size: 17200,
      dataUrl: MINIMAL_PDF_BASE64
    },
    bonLivraison: {
      id: 'bl-106',
      name: 'BL_L1039_Signe_Cevital.pdf',
      type: 'application/pdf',
      size: 10800,
      dataUrl: MINIMAL_PDF_BASE64
    },
    retour: 'Validation complète de la chambre froide mobile négative.',
    remise: true,
    prixBase: 5800000,
    tauxRemise: 4,
    prixApresRemise: 5568000,
    segment: 'surgele',
    produit: "Superstructure Isotherme Grand Volume avec rideau d'air (-20°C)",
    quantite: 2,
    dateAchat: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString().split('T')[0],
    montantPaye: 11136000, // Fully paid (5568000 * 2)
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'c7-rouiba',
    nomPrenom: 'SARL NCA Rouiba (Boissons)',
    telephone: '021 81 50 50',
    email: 'achats@nca-rouiba.com',
    nis: '001515340112277',
    nif: '001506012456005',
    rc: '15/00-0987654B19',
    numArticle: '15215432105',
    bonCommande: {
      id: 'bc-107',
      name: 'BC_NCARouiba_FourgonA.pdf',
      type: 'application/pdf',
      size: 11400,
      dataUrl: MINIMAL_PDF_BASE64
    },
    facture: null,
    bonLivraison: null,
    retour: 'Livraison effectuée, signature administrative en cours.',
    remise: false,
    prixBase: 1950000,
    tauxRemise: 0,
    prixApresRemise: 1950000,
    segment: 'frais',
    produit: 'Fourgon Isotherme Renforcé classe A',
    quantite: 1,
    dateAchat: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
    montantPaye: 500000, // Partial payment
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  }
];

export const SEED_SUPPLIERS: Supplier[] = [
  {
    id: 's1-bitzer',
    nomPrenom: 'SARL Frigo Composants Algérie',
    telephone: '021 54 88 12',
    articleAchete: 'Compresseur Frigorifique Bitzer 4EES-6Y',
    prixUnitaire: 380000,
    quantite: 4,
    dateAchat: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0], // 10 days ago
    livre: true,
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 's2-panel',
    nomPrenom: 'IsolPanels Méditerranée',
    telephone: '034 11 22 33',
    articleAchete: 'Panneaux Sandwich Isothermes (Épaisseur 80mm)',
    prixUnitaire: 8500,
    quantite: 150,
    dateAchat: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0], // 2 days ago
    livre: false, // Pending delivery
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 's3-danfoss',
    nomPrenom: 'Danfoss Industries France',
    telephone: '+33 1 45 67 89 01',
    articleAchete: 'Détendeurs Thermostatiques T2 & Buses',
    prixUnitaire: 24000,
    quantite: 50,
    dateAchat: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString().split('T')[0],
    livre: true,
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 's4-alfalaval',
    nomPrenom: 'Alfa Laval Alger',
    telephone: '023 45 67 89',
    articleAchete: 'Évaporateurs Plafonniers Double Flux',
    prixUnitaire: 185000,
    quantite: 8,
    dateAchat: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString().split('T')[0],
    livre: true,
    createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 's5-schneider',
    nomPrenom: 'Schneider Electric Algérie',
    telephone: '021 89 90 91',
    articleAchete: 'Armoires Électriques de Régulation & Contacteurs',
    prixUnitaire: 95000,
    quantite: 15,
    dateAchat: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
    livre: false,
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 's6-emerson',
    nomPrenom: 'Emerson Climate Technologies',
    telephone: '025 55 66 77',
    articleAchete: 'Groupes de Condensation de secours Copeland',
    prixUnitaire: 420000,
    quantite: 3,
    dateAchat: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
    livre: true,
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 's7-eliwell',
    nomPrenom: 'Eliwell Controls Spa',
    telephone: '+39 0437 986111',
    articleAchete: 'Thermostats Électroniques IDPlus 961',
    prixUnitaire: 12000,
    quantite: 120,
    dateAchat: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString().split('T')[0],
    livre: true,
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()
  }
];

export const SEED_STOCK: StockItem[] = [
  // Finished Products
  {
    id: 'st-1',
    nom: 'Fourgon Isotherme Frais (+4°C)',
    type: 'produit_fini',
    unite: 'Unités',
    quantiteInitiale: 10,
    seuilAlerte: 2,
    prixUnitaireMoyen: 1450000,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'st-2',
    nom: 'Semi-remorque Frigorifique Multi-Température (-20°C)',
    type: 'produit_fini',
    unite: 'Unités',
    quantiteInitiale: 5,
    seuilAlerte: 1,
    prixUnitaireMoyen: 4800000,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'st-3',
    nom: 'Fourgon Isotherme Renforcé classe A',
    type: 'produit_fini',
    unite: 'Unités',
    quantiteInitiale: 8,
    seuilAlerte: 2,
    prixUnitaireMoyen: 1800000,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'st-4',
    nom: 'Camion Porteur Isotherme avec Groupe Thermoking (+4°C)',
    type: 'produit_fini',
    unite: 'Unités',
    quantiteInitiale: 4,
    seuilAlerte: 1,
    prixUnitaireMoyen: 3500000,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'st-5',
    nom: 'Semi-remorque Isotherme d\'Alimentation Frais',
    type: 'produit_fini',
    unite: 'Unités',
    quantiteInitiale: 3,
    seuilAlerte: 1,
    prixUnitaireMoyen: 4200000,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },

  // Raw Materials
  {
    id: 'st-m1',
    nom: 'Compresseur Frigorifique Bitzer 4EES-6Y',
    type: 'matiere_premiere',
    unite: 'Unités',
    quantiteInitiale: 12,
    seuilAlerte: 3,
    prixUnitaireMoyen: 380000,
    fournisseurNom: 'SARL Frigo Composants Algérie',
    fournisseurTelephone: '021 54 88 12',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'st-m2',
    nom: 'Panneaux Sandwich Isothermes (Épaisseur 80mm)',
    type: 'matiere_premiere',
    unite: 'm²',
    quantiteInitiale: 400,
    seuilAlerte: 100,
    prixUnitaireMoyen: 8500,
    fournisseurNom: 'IsolPanels Méditerranée',
    fournisseurTelephone: '034 11 22 33',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'st-m3',
    nom: 'Détendeurs Thermostatiques T2 & Buses',
    type: 'matiere_premiere',
    unite: 'Unités',
    quantiteInitiale: 80,
    seuilAlerte: 15,
    prixUnitaireMoyen: 24000,
    fournisseurNom: 'Danfoss Industries France',
    fournisseurTelephone: '+33 1 45 67 89 01',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'st-m4',
    nom: 'Évaporateurs Plafonniers Double Flux',
    type: 'matiere_premiere',
    unite: 'Unités',
    quantiteInitiale: 15,
    seuilAlerte: 4,
    prixUnitaireMoyen: 185000,
    fournisseurNom: 'Alfa Laval Alger',
    fournisseurTelephone: '023 45 67 89',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'st-m5',
    nom: 'Armoires Électriques de Régulation & Contacteurs',
    type: 'matiere_premiere',
    unite: 'Unités',
    quantiteInitiale: 20,
    seuilAlerte: 5,
    prixUnitaireMoyen: 95000,
    fournisseurNom: 'Schneider Electric Algérie',
    fournisseurTelephone: '021 89 90 91',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'st-m6',
    nom: 'Groupes de Condensation de secours Copeland',
    type: 'matiere_premiere',
    unite: 'Unités',
    quantiteInitiale: 6,
    seuilAlerte: 2,
    prixUnitaireMoyen: 420000,
    fournisseurNom: 'Emerson Climate Technologies',
    fournisseurTelephone: '025 55 66 77',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'st-m7',
    nom: 'Thermostats Électroniques IDPlus 961',
    type: 'matiere_premiere',
    unite: 'Unités',
    quantiteInitiale: 200,
    seuilAlerte: 30,
    prixUnitaireMoyen: 12000,
    fournisseurNom: 'Eliwell Controls Spa',
    fournisseurTelephone: '+39 0437 986111',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  }
];
