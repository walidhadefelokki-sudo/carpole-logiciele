/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Supplier, StockItem, StockMovement } from '../types';

const DB_NAME = 'CarpoleIndustrielDB';
const DB_VERSION = 3;
const STORE_CLIENTS = 'clients';
const STORE_SUPPLIERS = 'suppliers';
const STORE_STOCK = 'stock';
const STORE_MOVEMENTS = 'stock_movements';

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_CLIENTS)) {
        db.createObjectStore(STORE_CLIENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SUPPLIERS)) {
        db.createObjectStore(STORE_SUPPLIERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_STOCK)) {
        db.createObjectStore(STORE_STOCK, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MOVEMENTS)) {
        db.createObjectStore(STORE_MOVEMENTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function getClients(): Promise<Client[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_CLIENTS, 'readonly');
    const store = transaction.objectStore(STORE_CLIENTS);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as Client[]);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function saveClient(client: Client): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_CLIENTS, 'readwrite');
    const store = transaction.objectStore(STORE_CLIENTS);
    const request = store.put(client);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function deleteClient(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_CLIENTS, 'readwrite');
    const store = transaction.objectStore(STORE_CLIENTS);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getSuppliers(): Promise<Supplier[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SUPPLIERS, 'readonly');
    const store = transaction.objectStore(STORE_SUPPLIERS);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as Supplier[]);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function saveSupplier(supplier: Supplier): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SUPPLIERS, 'readwrite');
    const store = transaction.objectStore(STORE_SUPPLIERS);
    const request = store.put(supplier);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function deleteSupplier(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SUPPLIERS, 'readwrite');
    const store = transaction.objectStore(STORE_SUPPLIERS);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getStockItems(): Promise<StockItem[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_STOCK, 'readonly');
    const store = transaction.objectStore(STORE_STOCK);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as StockItem[]);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function saveStockItem(item: StockItem): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_STOCK, 'readwrite');
    const store = transaction.objectStore(STORE_STOCK);
    const request = store.put(item);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function deleteStockItem(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_STOCK, 'readwrite');
    const store = transaction.objectStore(STORE_STOCK);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getStockMovements(): Promise<StockMovement[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_MOVEMENTS, 'readonly');
    const store = transaction.objectStore(STORE_MOVEMENTS);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as StockMovement[]);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function saveStockMovement(movement: StockMovement): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_MOVEMENTS, 'readwrite');
    const store = transaction.objectStore(STORE_MOVEMENTS);
    const request = store.put(movement);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function deleteStockMovement(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_MOVEMENTS, 'readwrite');
    const store = transaction.objectStore(STORE_MOVEMENTS);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

