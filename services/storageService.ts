import { Note, Category } from '../types';

const DB_NAME = 'InspirationCapsulesDB';
const DB_VERSION = 3;
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
          store.createIndex('deletedAt', 'deletedAt', { unique: false });
        } else {
          try {
            const req = event.target as IDBOpenDBRequest;
            const tx = req.transaction;
            if (tx) {
              const store = tx.objectStore(STORE_NOTES);
              if (!store.indexNames.contains('deletedAt')) {
                store.createIndex('deletedAt', 'deletedAt', { unique: false });
              }
            }
          } catch { /* index may already exist */ }
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

  // ─── Notes ───

  async getAllNotes(): Promise<Note[]> {
    const store = await this.getStore(STORE_NOTES, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const notes = (request.result as Note[]).filter(n => !n.deletedAt);
        notes.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(notes);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getTrashedNotes(): Promise<Note[]> {
    const store = await this.getStore(STORE_NOTES, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const notes = (request.result as Note[]).filter(n => !!n.deletedAt);
        notes.sort((a, b) => b.deletedAt! - a.deletedAt!);
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

  /** 软删除：标记 deletedAt */
  async softDeleteNote(id: string): Promise<void> {
    const store = await this.getStore(STORE_NOTES, 'readwrite');
    return new Promise((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const note = getReq.result as Note | undefined;
        if (!note) { resolve(); return; }
        note.deletedAt = Date.now();
        note.updatedAt = Date.now();
        const putReq = store.put(note);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /** 恢复：清除 deletedAt */
  async restoreNote(id: string): Promise<void> {
    const store = await this.getStore(STORE_NOTES, 'readwrite');
    return new Promise((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const note = getReq.result as Note | undefined;
        if (!note) { resolve(); return; }
        delete note.deletedAt;
        note.updatedAt = Date.now();
        const putReq = store.put(note);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /** 真删除 */
  async deleteNote(id: string): Promise<void> {
    const store = await this.getStore(STORE_NOTES, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /** 清空回收站：永久删除所有已软删除的笔记 */
  async emptyTrash(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");
    const trashed = await this.getTrashedNotes();
    if (trashed.length === 0) return;
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NOTES, 'readwrite');
      const store = transaction.objectStore(STORE_NOTES);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      trashed.forEach(note => store.delete(note.id));
    });
  }

  // ─── Categories ───

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

  /** 删除分类时，将其下笔记的 categoryId 清除 */
  async unassignNotesFromCategory(categoryId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NOTES, 'readwrite');
      const store = transaction.objectStore(STORE_NOTES);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) return;
        const note = cursor.value as Note;
        if (note.categoryId === categoryId) {
          delete note.categoryId;
          cursor.update(note);
        }
        cursor.continue();
      };
    });
  }

  // ─── Import / Export ───

  async importData(notes: Note[], categories: Category[]): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NOTES, STORE_CATEGORIES], 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      // 先清空再导入
      transaction.objectStore(STORE_NOTES).clear();
      transaction.objectStore(STORE_CATEGORIES).clear();
      const noteStore = transaction.objectStore(STORE_NOTES);
      notes.forEach(note => noteStore.put(note));
      const catStore = transaction.objectStore(STORE_CATEGORIES);
      categories.forEach(cat => catStore.put(cat));
    });
  }
}
export const storage = new StorageService();
