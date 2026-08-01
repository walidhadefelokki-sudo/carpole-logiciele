/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string; // Base64 or object URL stored in IndexedDB
}

export interface User {
  username: string;
  fullName: string;
  email: string;
  role: 'admin' | 'commercial' | 'gestionnaire_stock';
}

export type ClientType = 'carrossier' | 'technicien_froid' | 'production';
export type EtapeCommande = 'stratification' | 'montage' | 'finition' | 'livraison';
export type DetailVente = 'Caisse frigorifique positive' | 'Caisse frigorifique négative' | 'Conteneur' | 'Autre';

export interface ClientProductItem {
  id: string;
  produit: string;
  detailVente?: DetailVente;
  segment?: 'frais' | 'surgele';
  quantite: number;
  prixBase: number;
  remise: boolean;
  tauxRemise: number;
  prixApresRemise: number;
  tvaApplicable?: boolean;
}

export interface Client {
  id: string;
  nomPrenom: string;
  telephone: string;
  email: string;
  nis: string; // Numéro d'identité de statistique
  nif: string; // Numéro d'identité fiscale
  rc: string; // Numéro de registre de commerce
  numArticle: string; // Numéro d'article d'imposition
  bonCommande: AttachedFile | null; // PDF Bon de commande
  facture: AttachedFile | null; // PDF Facture
  bonLivraison: AttachedFile | null; // PDF Bon de livraison
  retour: string; // Remarques de retour
  remise: boolean; // Remise oui/non
  prixBase: number; // Prix brut de base
  tauxRemise: number; // Pourcentage de remise %
  prixApresRemise: number; // Prix final après remise HT
  detailVente?: DetailVente; // Détail de vente (Caisse positive, Caisse négative, Conteneur, Autre)
  tvaApplicable?: boolean; // TVA 19% applicable (Oui / Non)
  enAttente?: boolean; // En attente oui/non
  segment?: 'frais' | 'surgele'; // Type de carrosserie: Frais (Froid Positif) ou Surgelé (Froid Négatif)
  produit?: string; // Modèle de carrosserie ou équipement frigorifique installé
  produits?: ClientProductItem[]; // Liste de plusieurs produits/articles commandés
  typeClient?: ClientType; // Type de client: Carrossier, Technicien en froid, Production
  etapeCommande?: EtapeCommande; // Étape de la commande (si production)
  quantite?: number; // Quantité achetée
  dateAchat?: string; // Date d'achat
  montantPaye?: number; // Montant payé en DA
  modePaiement?: 'cash' | 'cheque'; // Moyen de paiement (cash ou chèque)
  chequeNomPrenom?: string; // Nom et prénom pour le chèque
  chequeBanque?: string; // Banque émettrice du chèque
  chequeReference?: string; // Référence / N° du chèque
  delaiRealisation?: string; // Délai de réalisation (Proforma)
  rendezVous?: string; // Rendez-vous pris (Proforma)
  isProforma?: boolean; // Facture proforma uniquement
  createdAt: string;
}

export interface ProformaInvoice {
  id: string;
  nomPrenom: string;
  telephone?: string;
  email?: string;
  nis?: string;
  nif?: string;
  rc?: string;
  numArticle?: string;
  dateCreation: string;
  delaiRealisation?: string; // Délai de réalisation
  rendezVous?: string; // Date / note de rendez-vous
  produits: ClientProductItem[];
  tvaApplicable?: boolean;
  notes?: string;
  createdAt: string;
}

export interface SupplierProductItem {
  id: string;
  produit: string;
  prixUnitaire: number;
  quantite: number;
  type?: 'matiere_premiere' | 'produit_fini';
  unite?: string;
  transit?: number; // Prix unitaire du transit DA
  margeBeneficiaire?: number; // Marge bénéficiaire
}

export interface Supplier {
  id: string;
  nomPrenom: string;
  telephone?: string; // Téléphone du fournisseur pour urgences d'achats
  articleAchete: string;
  prixUnitaire: number;
  quantite: number;
  dateAchat: string;
  livre: boolean; // Livré oui/non
  createdAt: string;
  produits?: SupplierProductItem[]; // Liste de plusieurs produits/articles achetés
  montantPaye?: number; // Montant payé au fournisseur en DA
  tvaApplicable?: boolean; // TVA 19% applicable (Oui / Non)
  devis?: AttachedFile | null; // Devis du fournisseur attaché (PDF)
}

export interface StockItem {
  id: string;
  nom: string;
  type: 'matiere_premiere' | 'produit_fini';
  unite: string; // Ex: Unités, m², kg, Litres
  quantiteInitiale: number;
  seuilAlerte: number;
  prixUnitaireMoyen: number;
  createdAt: string;
  fournisseurNom?: string; // Fournisseur par défaut/habituel
  fournisseurTelephone?: string; // Téléphone du fournisseur par défaut
}

export interface StockMovement {
  id: string;
  typeMouvement: 'ENTREE' | 'SORTIE';
  date: string;
  produit: string;
  quantite: number;
  unite: string;
  typeArticle: 'matiere_premiere' | 'produit_fini';
  nomUtilisateur: string; // Intervenant / Nom d'utilisateur (ex: Samy Stock)
  tierNom?: string; // Nom du Client (pour Sortie) ou Fournisseur (pour Entrée)
  motif?: string; // Remarque / Motif (ex: Consommation atelier, Vente client, etc.)
  createdAt: string;
}
