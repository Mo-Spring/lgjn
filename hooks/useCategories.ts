// ============================================================
// hooks/useCategories.ts — 分类 CRUD
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { Category } from '../types';
import {
  getAllCategories,
  saveCategory as dbSave,
  deleteCategory as dbDelete,
} from '../services/storageService';

function generateId(): string {
  return `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  const reload = useCallback(async () => {
    const cats = await getAllCategories();
    setCategories(cats);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const createCategory = useCallback(async (name: string): Promise<Category> => {
    const cat: Category = {
      id: generateId(),
      name: name.trim(),
      order: Date.now(),
      createdAt: Date.now(),
    };
    await dbSave(cat);
    setCategories((prev) => [...prev, cat].sort((a, b) => a.order - b.order));
    return cat;
  }, []);

  const updateCategory = useCallback(async (id: string, name: string) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1) return prev;
      const updated = { ...prev[idx], name: name.trim() };
      dbSave(updated);
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  }, []);

  const removeCategory = useCallback(async (id: string) => {
    await dbDelete(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { categories, reload: reload, createCategory, updateCategory, removeCategory };
}
