// ============================================================
// services/storageService.ts — IndexedDB 存储服务
// ============================================================

import type { Note, Category, ExportData } from '../types';

const DB_NAME = 'inspiration-capsule';
const DB_VERSION = 1;
const NOTES_STORE = 'notes';
const CATEGORIES_STORE = 'categories';
const META_STORE = 'meta';

let dbInstance: IDBDatabase | null = null;

/** 打开数据库连接（单例） */
function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(NOTES_STORE)) {
        const store = db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('deletedAt', 'deletedAt', { unique: false });
        store.createIndex('pinned', 'pinned', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(CATEGORIES_STORE)) {
        db.createObjectStore(CATEGORIES_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

/** 通用事务辅助 */
async function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** 获取存储中的所有对象 */
async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

/** 放入单个对象 */
async function put<T>(storeName: string, value: T): Promise<T> {
  return tx<T>(storeName, 'readwrite', (s) => s.put(value) as unknown as IDBRequest<T>);
}

/** 删除单个对象 */
async function remove(storeName: string, key: string): Promise<void> {
  return tx(storeName, 'readwrite', (s) => s.delete(key));
}

/** 清空整个 store */
async function clear(storeName: string): Promise<void> {
  return tx(storeName, 'readwrite', (s) => s.clear());
}

// ──────────────────────────────────────
// Notes
// ──────────────────────────────────────

export async function getAllNotes(): Promise<Note[]> {
  return getAll<Note>(NOTES_STORE);
}

export async function getActiveNotes(): Promise<Note[]> {
  const all = await getAllNotes();
  return all.filter((n) => !n.deletedAt).sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

export async function getDeletedNotes(): Promise<Note[]> {
  const all = await getAllNotes();
  return all
    .filter((n) => !!n.deletedAt)
    .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
}

export async function saveNote(note: Note): Promise<Note> {
  return put<Note>(NOTES_STORE, { ...note, updatedAt: Date.now() });
}

export async function deleteNote(id: string): Promise<void> {
  return remove(NOTES_STORE, id);
}

// ──────────────────────────────────────
// Categories
// ──────────────────────────────────────

export async function getAllCategories(): Promise<Category[]> {
  const cats = await getAll<Category>(CATEGORIES_STORE);
  return cats.sort((a, b) => a.order - b.order);
}

export async function saveCategory(category: Category): Promise<Category> {
  return put<Category>(CATEGORIES_STORE, category);
}

export async function deleteCategory(id: string): Promise<void> {
  return remove(CATEGORIES_STORE, id);
}

// ──────────────────────────────────────
// Meta (theme etc.)
// ──────────────────────────────────────

export async function getMeta(key: string): Promise<string | null> {
  const result = await tx<{ key: string; value: string } | undefined>(
    META_STORE,
    'readonly',
    (s) => s.get(key)
  );
  return result?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await put(META_STORE, { key, value });
}

// ──────────────────────────────────────
// 导入导出
// ──────────────────────────────────────

/** 验证导入数据结构完整性 */
function isValidExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.version !== 'number') return false;
  if (typeof d.exportedAt !== 'number') return false;
  if (!Array.isArray(d.notes)) return false;
  if (!Array.isArray(d.categories)) return false;

  // 验证 notes 元素结构
  for (const note of d.notes) {
    if (!note || typeof note !== 'object') return false;
    const n = note as Record<string, unknown>;
    if (typeof n.id !== 'string') return false;
    if (typeof n.title !== 'string') return false;
    if (typeof n.content !== 'string') return false;
    if (typeof n.createdAt !== 'number') return false;
    if (typeof n.updatedAt !== 'number') return false;
  }

  // 验证 categories 元素结构
  for (const cat of d.categories) {
    if (!cat || typeof cat !== 'object') return false;
    const c = cat as Record<string, unknown>;
    if (typeof c.id !== 'string') return false;
    if (typeof c.name !== 'string') return false;
  }

  return true;
}

export async function exportData(): Promise<ExportData> {
  const [notes, categories] = await Promise.all([
    getAllNotes(),
    getAllCategories(),
  ]);
  return {
    version: 1,
    exportedAt: Date.now(),
    notes,
    categories,
  };
}

export async function importData(json: string): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('导入文件格式无效：无法解析 JSON');
  }

  if (!isValidExportData(parsed)) {
    throw new Error('导入数据结构不完整，请检查文件是否为本应用导出的备份');
  }

  const data = parsed as ExportData;

  // 数据验证通过后才清空旧数据
  await clear(NOTES_STORE);
  await clear(CATEGORIES_STORE);

  const db = await openDB();
  const txNotes = db.transaction(NOTES_STORE, 'readwrite');
  const notesStore = txNotes.objectStore(NOTES_STORE);
  for (const note of data.notes) {
    notesStore.put(note);
  }

  const txCats = db.transaction(CATEGORIES_STORE, 'readwrite');
  const catsStore = txCats.objectStore(CATEGORIES_STORE);
  for (const cat of data.categories) {
    catsStore.put(cat);
  }

  // 等待两个事务完成
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      txNotes.oncomplete = () => resolve();
      txNotes.onerror = () => reject(txNotes.error);
    }),
    new Promise<void>((resolve, reject) => {
      txCats.oncomplete = () => resolve();
      txCats.onerror = () => reject(txCats.error);
    }),
  ]);
}

// ──────────────────────────────────────
// 初始化：请求持久化存储
// ──────────────────────────────────────

export async function initStorage(): Promise<void> {
  await openDB();
  // 请求浏览器持久化存储，防止自动清理 IndexedDB
  try {
    if (navigator.storage?.persist) {
      const persisted = await navigator.storage.persist();
      if (!persisted) {
        console.warn('存储持久化请求被拒绝');
      }
    }
  } catch (e) {
    console.warn('存储持久化请求失败:', e);
  }
}
