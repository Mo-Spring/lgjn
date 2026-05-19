// ============================================================
// App.tsx — 小米笔记风格 主应用
// ============================================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Plus, Search, Settings, Trash2, X,
  ArrowLeft, CheckSquare, MoreHorizontal,
} from 'lucide-react';

import type { Note, ViewMode } from './types';
import { initStorage } from './services/storageService';

import { useNotes } from './hooks/useNotes';
import { useCategories } from './hooks/useCategories';
import { useTheme } from './hooks/useTheme';
import { useSelection } from './hooks/useSelection';
import { useToast } from './hooks/useToast';

import { CapsuleCard } from './components/CapsuleCard';
import { EditorModal } from './components/EditorModal';
import { SettingsModal } from './components/SettingsModal';
import { NoteActionMenu } from './components/NoteActionMenu';
import { TrashView } from './components/TrashView';
import { ConfirmDialog } from './components/Dialogs';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EmptyState } from './components/EmptyState';
import { ToastContainer } from './components/Toast';

export default function App() {
  // ── Hooks ──
  const { theme, toggleTheme } = useTheme();
  const { toasts, addToast, removeToast } = useToast();
  const notes = useNotes();
  const cats = useCategories();
  const sel = useSelection();

  // ── UI state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showSettings, setShowSettings] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [menuNote, setMenuNote] = useState<Note | null>(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [showSearch, setShowSearch] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => { initStorage(); }, []);

  // ── 筛选 ──
  const filtered = useMemo(() => {
    let r = notes.notes;
    if (activeCategory !== 'all') r = r.filter((n) => n.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }
    return r;
  }, [notes.notes, activeCategory, searchQuery]);

  const catCounts = useMemo(() => {
    const m: Record<string, number> = { all: notes.notes.length };
    cats.categories.forEach((c) => { m[c.id] = notes.notes.filter((n) => n.category === c.id).length; });
    return m;
  }, [notes.notes, cats.categories]);

  // ── Handlers ──
  const openEditor = useCallback((note?: Note) => { setEditingNote(note ?? null); setIsEditorOpen(true); }, []);
  const closeEditor = useCallback(() => { setIsEditorOpen(false); setEditingNote(null); }, []);

  const tapNote = useCallback((note: Note) => {
    sel.isSelectionMode ? sel.toggleSelection(note.id) : openEditor(note);
  }, [sel, openEditor]);

  const longPressNote = useCallback((note: Note) => {
    sel.enterSelectionMode(note.id);
    addToast('已进入多选模式', 'info');
  }, [sel, addToast]);

  const openMenu = useCallback((note: Note, pos: { x: number; y: number }) => {
    setMenuNote(note);
    setMenuPos(pos);
  }, []);

  const deleteNote = useCallback((id: string) => {
    notes.softDelete(id);
    addToast('已移到回收站', 'undo', { label: '撤销', onClick: () => notes.restoreNote(id) });
  }, [notes, addToast]);

  const batchDelete = useCallback(() => {
    const ids = Array.from(sel.selectedIds);
    notes.batchSoftDelete(ids);
    sel.clearSelection();
    addToast(`已删除 ${ids.length} 条笔记`, 'info');
  }, [sel, notes, addToast]);

  const copyNote = useCallback((note: Note) => {
    navigator.clipboard?.writeText([note.title, note.content].filter(Boolean).join('\n'));
    addToast('已复制到剪贴板', 'success');
  }, [addToast]);

  // ── Loading ──
  if (notes.loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--mi-bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center animate-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm" style={{ color: 'var(--mi-text-tertiary)' }}>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: 'var(--mi-bg)', color: 'var(--mi-text-primary)' }}>

        {/* ── Header — 小米笔记风格 ── */}
        <header className="sticky top-0 z-30 pt-safe" style={{ background: 'var(--mi-bg)' }}>
          {showSearch ? (
            /* 搜索模式 */
            <div className="px-4 pb-3 pt-3 animate-mi-page-in">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" style={{ color: 'var(--mi-text-primary)' }} />
                </button>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--mi-text-tertiary)' }} />
                  <input
                    type="text"
                    placeholder="搜索笔记..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none border-0"
                    style={{
                      background: 'var(--mi-card)',
                      color: 'var(--mi-text-primary)',
                    }}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--mi-text-tertiary)' }}
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* 正常模式 */
            <div className="px-4 pb-2 pt-3">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--mi-text-primary)' }}>
                  笔记
                </h1>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowSearch(true)}
                    className="w-9 h-9 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors"
                  >
                    <Search className="w-[18px] h-[18px]" style={{ color: 'var(--mi-text-secondary)' }} />
                  </button>
                  <button
                    onClick={() => setShowTrash(true)}
                    className="w-9 h-9 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors relative"
                  >
                    <Trash2 className="w-[18px] h-[18px]" style={{ color: 'var(--mi-text-secondary)' }} />
                    {notes.trashNotes.length > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 text-white text-[8px] rounded-full flex items-center justify-center font-bold" style={{ background: 'var(--mi-orange)' }}>
                        {notes.trashNotes.length > 9 ? '9+' : notes.trashNotes.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="w-9 h-9 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors"
                  >
                    <MoreHorizontal className="w-[18px] h-[18px]" style={{ color: 'var(--mi-text-secondary)' }} />
                  </button>
                </div>
              </div>

              {/* 分类标签 — 小米风格 */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                {[
                  { id: 'all', label: '全部' },
                  ...cats.categories.map(c => ({ id: c.id, label: c.name })),
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
                    style={{
                      background: activeCategory === cat.id ? 'var(--mi-orange)' : 'var(--mi-card)',
                      color: activeCategory === cat.id ? '#FFFFFF' : 'var(--mi-text-secondary)',
                      border: activeCategory === cat.id ? 'none' : '1px solid var(--mi-border)',
                    }}
                  >
                    {cat.label}
                    <span className="ml-1.5 opacity-60">{catCounts[cat.id] || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 多选操作栏 */}
          {sel.isSelectionMode && (
            <div
              className="flex items-center justify-between px-4 py-2.5 border-t animate-mi-page-in"
              style={{ background: 'var(--mi-card)', borderColor: 'var(--mi-border)' }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={sel.exitSelectionMode}
                  className="w-8 h-8 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors"
                >
                  <X className="w-4 h-4" style={{ color: 'var(--mi-text-secondary)' }} />
                </button>
                <span className="text-sm font-medium" style={{ color: 'var(--mi-text-primary)' }}>
                  已选 {sel.selectedCount} 项
                </span>
              </div>
              <button
                onClick={batchDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium active:opacity-80 transition-opacity"
                style={{ background: '#FF4444' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                删除
              </button>
            </div>
          )}
        </header>

        {/* ── Notes list — 小米瀑布流风格 ── */}
        <main className="px-3 pb-24 animate-mi-page-in">
          {filtered.length === 0 ? (
            <EmptyState hasNotes={notes.notes.length > 0} hasSearch={!!searchQuery.trim()} />
          ) : (
            <div className={viewMode === 'grid'
              ? 'columns-2 gap-2.5 [column-fill:balance]'
              : 'flex flex-col gap-2'
            }>
              {filtered.map((note, idx) => (
                <div
                  key={note.id}
                  className="animate-mi-slide-up opacity-0"
                  style={{ animationDelay: `${Math.min(idx * 0.03, 0.18)}s` }}
                >
                  <CapsuleCard
                    note={note}
                    categories={cats.categories}
                    viewMode={viewMode}
                    isSelectionMode={sel.isSelectionMode}
                    isSelected={sel.isSelected(note.id)}
                    searchQuery={searchQuery}
                    onTap={tapNote}
                    onLongPress={longPressNote}
                    onMenu={openMenu}
                    onTogglePin={notes.togglePin}
                    onDelete={deleteNote}
                    onToggleSelect={sel.toggleSelection}
                  />
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ── FAB — 小米风格橙色 ── */}
        <button
          onClick={() => openEditor()}
          className="fixed right-5 bottom-7 w-14 h-14 rounded-full text-white flex items-center justify-center active:scale-90 transition-all z-20 shadow-lg ripple-btn"
          style={{
            background: 'linear-gradient(135deg, #FF8533, #FF6A00)',
            boxShadow: '0 4px 16px rgba(255, 106, 0, 0.3)',
          }}
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>

        {/* ── Modals ── */}
        <EditorModal
          note={editingNote}
          categories={cats.categories}
          isOpen={isEditorOpen}
          onClose={closeEditor}
          onSave={(id, ch) => notes.updateNote(id, ch)}
          onCreate={(p) => notes.createNote(p)}
        />

        <SettingsModal
          isOpen={showSettings}
          theme={theme}
          categories={cats.categories}
          onClose={() => setShowSettings(false)}
          onToggleTheme={toggleTheme}
          onCreateCategory={cats.createCategory}
          onUpdateCategory={cats.updateCategory}
          onDeleteCategory={cats.removeCategory}
          onDataImported={() => { notes.reload(); cats.reload(); setShowSettings(false); addToast('数据导入成功', 'success'); }}
        />

        <NoteActionMenu
          isVisible={!!menuNote}
          isPinned={menuNote?.pinned || false}
          position={menuPos}
          onClose={() => setMenuNote(null)}
          onTogglePin={() => menuNote && notes.togglePin(menuNote.id)}
          onDelete={() => menuNote && deleteNote(menuNote.id)}
          onCopy={() => menuNote && copyNote(menuNote)}
          onEdit={() => menuNote && openEditor(menuNote)}
          onSelect={() => menuNote && sel.enterSelectionMode(menuNote.id)}
        />

        <TrashView
          notes={notes.trashNotes}
          isOpen={showTrash}
          onClose={() => setShowTrash(false)}
          onRestore={(id) => { notes.restoreNote(id); addToast('已恢复', 'success'); }}
          onPermanentDelete={(id) => setConfirm({
            open: true,
            title: '永久删除？',
            message: '此操作无法撤销，笔记将被永久删除',
            onConfirm: () => { notes.permanentDelete(id); setConfirm((d) => ({ ...d, open: false })); }
          })}
          onEmptyTrash={() => { notes.emptyTrash(); addToast('回收站已清空', 'info'); }}
        />

        <ConfirmDialog
          isOpen={confirm.open}
          title={confirm.title}
          message={confirm.message}
          variant="danger"
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm((d) => ({ ...d, open: false }))}
        />

        <ToastContainer toasts={toasts} />
      </div>
    </ErrorBoundary>
  );
}
