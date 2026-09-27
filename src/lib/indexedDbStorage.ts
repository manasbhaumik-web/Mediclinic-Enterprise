/**
 * Native IndexedDB Persistent Storage & Transaction Manager
 * Phase P3 Enterprise Resilience: Provides asynchronous, high-capacity, multi-tab safe
 * IndexedDB persistence for offline clinic queue mutations and local data caching.
 */

const DB_NAME = 'MediclinicOfflineDB_v1';
const DB_VERSION = 1;

export interface IndexedDbOfflineAction {
  id: string;
  tenantId: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'SUCCESS';
}

export class IndexedDbStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this runtime environment.'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store 1: Offline mutations queue
        if (!db.objectStoreNames.contains('offline_actions')) {
          const actionStore = db.createObjectStore('offline_actions', { keyPath: 'id' });
          actionStore.createIndex('tenantId', 'tenantId', { unique: false });
          actionStore.createIndex('status', 'status', { unique: false });
        }

        // Store 2: Cached patients dataset
        if (!db.objectStoreNames.contains('cached_patients')) {
          const patientStore = db.createObjectStore('cached_patients', { keyPath: 'id' });
          patientStore.createIndex('tenantId', 'tenantId', { unique: false });
        }

        // Store 3: Cached visits queue
        if (!db.objectStoreNames.contains('cached_visits')) {
          const visitStore = db.createObjectStore('cached_visits', { keyPath: 'id' });
          visitStore.createIndex('tenantId', 'tenantId', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // =========================================================================
  // OFFLINE ACTIONS QUEUE (IndexedDB)
  // =========================================================================

  public async saveOfflineAction(action: IndexedDbOfflineAction): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_actions', 'readwrite');
      const store = tx.objectStore('offline_actions');
      const req = store.put(action);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getPendingOfflineActions(tenantId?: string): Promise<IndexedDbOfflineAction[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_actions', 'readonly');
      const store = tx.objectStore('offline_actions');
      const req = store.getAll();

      req.onsuccess = () => {
        let results: IndexedDbOfflineAction[] = req.result || [];
        if (tenantId) {
          results = results.filter(a => a.tenantId === tenantId);
        }
        resolve(results.sort((a, b) => a.timestamp - b.timestamp));
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async removeOfflineAction(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_actions', 'readwrite');
      const store = tx.objectStore('offline_actions');
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // =========================================================================
  // LOCAL DATA CACHING (IndexedDB)
  // =========================================================================

  public async cacheRecords(storeName: 'cached_patients' | 'cached_visits', records: any[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      records.forEach(record => store.put(record));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getCachedRecords(storeName: 'cached_patients' | 'cached_visits', tenantId?: string): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => {
        let results = req.result || [];
        if (tenantId) {
          results = results.filter(r => r.tenantId === tenantId);
        }
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }
}

export const indexedDbStorage = new IndexedDbStorage();
