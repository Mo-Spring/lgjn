// ============================================================
// hooks/useNotes.ts — 胶囊 CRUD、软删除、恢复、批量操作
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { Note, NoteColor } from '../types';
import {
  getActiveNotes,
  getDeletedNotes,
  saveNote as dbSave,
  deleteNote as dbDelete,
} from '../services/storageService';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [trashNotes, setTrashNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  /** 从数据库加载胶囊 */
  const reload = useCallback(async () => {
    try {
      const [active, trash] = await Promise.all([
        getActiveNotes(),
        getDeletedNotes(),
      ]);
      setNotes(active);
      setTrashNotes(trash);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** 创建新胶囊 */
  const createNote = useCallback(
    async (partial?: Partial<Note>): Promise<Note> => {
      const now = Date.now();
      const note: Note = {
        id: generateId(),
        title: partial?.title ?? '',
        content: partial?.content ?? '',
        color: (partial?.color as NoteColor) ?? 'default',
        category: partial?.category ?? '',
        pinned: partial?.pinned ?? false,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      await dbSave(note);
      setNotes((prev) => [note, ...prev]);
      return note;
    },
    []
  );

  /** 更新胶囊 */
  const updateNote = useCallback(async (id: string, changes: Partial<Note>) => {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx === -1) return prev;
      const updated = { ...prev[idx], ...changes, updatedAt: Date.now() };
      dbSave(updated); // fire-and-forget
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  }, []);

  /** 软删除胶囊（移到回收站） */
  const softDelete = useCallback(async (id: string) => {
    // 先在 notes 中定位目标笔记，再同步更新两个 state
    const target = notes.find((n) => n.id === id);
    if (!target) return undefined;

    const deleted: Note = { ...target, deletedAt: Date.now() };
    dbSave(deleted); // fire-and-forget，不放在 state updater 里

    // 从活跃列表移除
    setNotes((prev) => prev.filter((n) => n.id !== id));
    // 加入回收站列表（置顶）
    setTrashNotes((prev) => [deleted, ...prev]);

    return deleted;
  }, [notes]);

  /** 从回收站恢复 */
  const restoreNote = useCallback(async (id: string) => {
    const target = trashNotes.find((n) => n.id === id);
    if (!target) return undefined;

    const restored: Note = { ...target, deletedAt: null, updatedAt: Date.now() };
    dbSave(restored);

    setTrashNotes((prev) => prev.filter((n) => n.id !== id));
    setNotes((prev) => [restored, ...prev]);

    return restored;
  }, [trashNotes]);

  /** 永久删除 */
  const permanentDelete = useCallback(async (id: string) => {
    await dbDelete(id);
    setTrashNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  /** 清空回收站 */
  const emptyTrash = useCallback(async () => {
    const ids = trashNotes.map((n) => n.id);
    await Promise.all(ids.map((id) => dbDelete(id)));
    setTrashNotes([]);
  }, [trashNotes]);

  /** 批量软删除 */
  const batchSoftDelete = useCallback(async (ids: string[]) => {
    const deletedNotes: Note[] = [];
    for (const n of notes) {
      if (ids.includes(n.id)) {
        const dn: Note = { ...n, deletedAt: Date.now() };
        dbSave(dn);
        deletedNotes.push(dn);
      }
    }
    if (deletedNotes.length) {
      const deletedIds = new Set(ids);
      setNotes((prev) => prev.filter((n) => !deletedIds.has(n.id)));
      setTrashNotes((prev) => [...deletedNotes, ...prev]);
    }
  }, [notes]);

  /** 切换置顶 */
  const togglePin = useCallback(async (id: string) => {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx === -1) return prev;
      const updated = { ...prev[idx], pinned: !prev[idx].pinned, updatedAt: Date.now() };
      dbSave(updated);
      const next = [...prev];
      next[idx] = updated;
      return next.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
    });
  }, []);

  return {
    notes,
    trashNotes,
    loading,
    reload,
    createNote,
    updateNote,
    softDelete,
    restoreNote,
    permanentDelete,
    emptyTrash,
    batchSoftDelete,
    togglePin,
  };
}
