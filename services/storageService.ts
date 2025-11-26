import { Note, Category } from '../types';

const DB_NAME = 'InspirationCapsulesDB';
const DB_VERSION = 2;
const STORE_NOTES = 'notes';
const STORE_CATEGORIES = 'categories';

class StorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("IndexedDB error:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NOTES)) {
          const store = db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('title', 'title', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
          db.createObjectStore(STORE_CATEGORIES, { keyPath: 'id' });
        }
      };
    });
    return this.initPromise;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async getAllNotes(): Promise<Note[]> {
    const store = await this.getStore(STORE_NOTES, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const notes = request.result as Note[];
        notes.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(notes);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveNote(note: Note): Promise<void> {
    const store = await this.getStore(STORE_NOTES, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(note);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteNote(id: string): Promise<void> {
    const store = await this.getStore(STORE_NOTES, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCategories(): Promise<Category[]> {
    const store = await this.getStore(STORE_CATEGORIES, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const cats = request.result as Category[];
        cats.sort((a, b) => a.createdAt - b.createdAt);
        resolve(cats);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveCategory(category: Category): Promise<void> {
    const store = await this.getStore(STORE_CATEGORIES, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(category);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCategory(id: string): Promise<void> {
    const store = await this.getStore(STORE_CATEGORIES, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async importData(notes: Note[], categories: Category[]): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NOTES, STORE_CATEGORIES], 'readwrite');
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        const noteStore = transaction.objectStore(STORE_NOTES);
        notes.forEach(note => noteStore.put(note));
        const catStore = transaction.objectStore(STORE_CATEGORIES);
        categories.forEach(cat => catStore.put(cat));
    });
  }
}
export const storage = new StorageService();