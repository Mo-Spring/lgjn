// ============================================================
// components/SettingsModal.tsx — 小米笔记风格设置
// ============================================================

import React, { useState, useRef } from 'react';
import {
  X, ArrowLeft, Moon, Sun, Download, Upload, Trash2,
  FolderPlus, Edit3, Check, Tag, Info, Smartphone,
} from 'lucide-react';
import type { Category, Theme } from '../types';
import { exportData, importData } from '../services/storageService';

interface Props {
  isOpen: boolean;
  theme: Theme;
  categories: Category[];
  onClose: () => void;
  onToggleTheme: () => void;
  onCreateCategory: (name: string) => Promise<Category>;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onDataImported: () => void;
}

export function SettingsModal({
  isOpen,
  theme,
  categories,
  onClose,
  onToggleTheme,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onDataImported,
}: Props) {
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    await onCreateCategory(newCatName.trim());
    setNewCatName('');
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      onUpdateCategory(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `笔记备份-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('导出失败:', e);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      await importData(text);
      onDataImported();
    } catch (err: any) {
      setImportError(err.message || '导入失败');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl flex flex-col overflow-hidden animate-mi-editor-in"
        style={{ background: 'var(--mi-bg)' }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 pt-safe" style={{ borderBottom: '1px solid var(--mi-border)' }}>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--mi-text-primary)' }} />
          </button>
          <h2 className="text-base font-semibold" style={{ color: 'var(--mi-text-primary)' }}>设置</h2>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-safe">

          {/* ── 外观 ── */}
          <section>
            <h3 className="text-xs font-medium mb-2.5 px-1" style={{ color: 'var(--mi-text-tertiary)' }}>外观</h3>
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--mi-card)' }}>
              <button
                onClick={onToggleTheme}
                className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {theme === 'light' ? (
                    <Sun className="w-5 h-5 text-orange-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-blue-400" />
                  )}
                  <span className="text-sm" style={{ color: 'var(--mi-text-primary)' }}>
                    {theme === 'light' ? '浅色模式' : '深色模式'}
                  </span>
                </div>
                <div
                  className="w-11 h-6 rounded-full flex items-center transition-colors"
                  style={{
                    background: theme === 'dark' ? 'var(--mi-orange)' : 'var(--mi-border)',
                    justifyContent: theme === 'dark' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow-sm mx-0.5" />
                </div>
              </button>
            </div>
          </section>

          {/* ── 分类管理 ── */}
          <section>
            <h3 className="text-xs font-medium mb-2.5 px-1" style={{ color: 'var(--mi-text-tertiary)' }}>分类管理</h3>
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--mi-card)' }}>
              {/* 新增分类 */}
              <div className="flex gap-2 p-3" style={{ borderBottom: categories.length > 0 ? '1px solid var(--mi-divider)' : 'none' }}>
                <input
                  type="text"
                  placeholder="新分类名称..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none border-0"
                  style={{ background: 'var(--mi-bg)', color: 'var(--mi-text-primary)' }}
                />
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCatName.trim()}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
                  style={{ background: 'var(--mi-orange)' }}
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>

              {/* 分类列表 */}
              {categories.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Tag className="w-10 h-10 mb-3" style={{ color: 'var(--mi-border)' }} />
                  <p className="text-sm mb-1" style={{ color: 'var(--mi-text-tertiary)' }}>还没有分类</p>
                  <p className="text-xs" style={{ color: 'var(--mi-text-tertiary)', opacity: 0.6 }}>
                    创建分类来整理你的笔记
                  </p>
                </div>
              ) : (
                <div>
                  {categories.map((cat, idx) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-2 px-4 py-3 group"
                      style={{ borderBottom: idx < categories.length - 1 ? '1px solid var(--mi-divider)' : 'none' }}
                    >
                      {editingId === cat.id ? (
                        <>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                            className="flex-1 text-sm bg-transparent outline-none border-0"
                            style={{ color: 'var(--mi-text-primary)' }}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                            style={{ background: '#22C55E' }}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm" style={{ color: 'var(--mi-text-primary)' }}>
                            {cat.name}
                          </span>
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: 'var(--mi-text-tertiary)' }}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteCategory(cat.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: '#FF4444' }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── 数据管理 ── */}
          <section>
            <h3 className="text-xs font-medium mb-2.5 px-1" style={{ color: 'var(--mi-text-tertiary)' }}>数据管理</h3>
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--mi-card)' }}>
              <button
                onClick={handleExport}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors"
                style={{ borderBottom: '1px solid var(--mi-divider)' }}
              >
                <Download className="w-5 h-5 text-blue-500" />
                <span className="text-sm" style={{ color: 'var(--mi-text-primary)' }}>导出备份</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors"
              >
                <Upload className="w-5 h-5 text-green-500" />
                <span className="text-sm" style={{ color: 'var(--mi-text-primary)' }}>导入数据</span>
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
              {importError && (
                <p className="text-xs px-4 pb-3" style={{ color: '#FF4444' }}>{importError}</p>
              )}
            </div>
          </section>

          {/* ── 关于 ── */}
          <section className="text-center pt-4 pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Smartphone className="w-4 h-4" style={{ color: 'var(--mi-text-tertiary)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--mi-text-tertiary)' }}>
                小米笔记 · 本地版
              </span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--mi-text-tertiary)', opacity: 0.5 }}>
              v1.0 · 数据仅存储在本地设备
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
