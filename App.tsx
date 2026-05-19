// ============================================================
// App.tsx — 灵感胶囊风格 主应用
// ============================================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Plus, Search, Trash2, X,
  ArrowLeft, MoreHorizontal,
  LayoutGrid, List,
} from 'lucide-react';

import type { Note, ViewMode } from './types';
import { initStorage, getMeta, setMeta } from './services/storageService';

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

// Capacitor 插件（仅在原生环境生效）
let AppPlugin: any = null;
let StatusBarPlugin: any = null;

async function loadCapacitorPlugins() {
  try {
    const appMod = await import('@capacitor/app');
    AppPlugin = appMod.App;
  } catch {}
  try {
    const sbMod = await import('@capacitor/status-bar');
    StatusBarPlugin = sbMod.StatusBar;
  } catch {}
}

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
  const [viewModeLoaded, setViewModeLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [menuNote, setMenuNote] = useState<Note | null>(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [showSearch, setShowSearch] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: () => {} });
  const [pluginsLoaded, setPluginsLoaded] = useState(false);

  // ── 初始化存储 ──
  useEffect(() => { initStorage(); }, []);

  // ── 加载视图模式偏好 ──
  useEffect(() => {
    getMeta('viewMode').then((saved) => {
      if (saved === 'grid' || saved === 'list') {
        setViewMode(saved);
      }
      setViewModeLoaded(true);
    });
  }, []);

  // ── 保存视图模式偏好 ──
  useEffect(() => {
    if (viewModeLoaded) {
      setMeta('viewMode', viewMode);
    }
  }, [viewMode, viewModeLoaded]);

  // ── 加载 Capacitor 插件 ──
  useEffect(() => {
    loadCapacitorPlugins().then(() => {
      setPluginsLoaded(true);
    });
  }, []);

  // ── 状态栏 + 导航栏颜色跟随主题 ──
  useEffect(() => {
    if (!pluginsLoaded) return;
    const applyBarColors = async () => {
      const isDark = theme === 'dark';
      const bgColor = isDark ? '#131316' : '#F6F5F1';

      // 状态栏
      if (StatusBarPlugin) {
        try {
          await StatusBarPlugin.setBackgroundColor({ color: bgColor });
          await StatusBarPlugin.setStyle({ style: isDark ? 'DARK' : 'LIGHT' });
          await StatusBarPlugin.setOverlaysWebView({ overlay: false });
        } catch {}
      }

      // 同步 meta theme-color
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', bgColor);
    };
    applyBarColors();
  }, [theme, pluginsLoaded]);

  // ── 系统返回手势处理 ──
  useEffect(() => {
    if (!pluginsLoaded) return;
    let listener: any = null;

    const setupBackHandler = async () => {
      if (!AppPlugin) return;
      try {
        listener = await AppPlugin.addListener('backButton', (e: any) => {
          // 优先关闭弹窗/抽屉（后进先出）
          if (confirm.open) {
            setConfirm(d => ({ ...d, open: false }));
            return;
          }
          if (menuNote) {
            setMenuNote(null);
            return;
          }
          if (showSettings) {
            setShowSettings(false);
            return;
          }
          if (showTrash) {
            setShowTrash(false);
            return;
          }
          if (isEditorOpen) {
            closeEditor();
            return;
          }
          if (showSearch) {
            setShowSearch(false);
            setSearchQuery('');
            return;
          }
          if (sel.isSelectionMode) {
            sel.exitSelectionMode();
            return;
          }
          // 无弹窗时，交由系统处理（退出 app）
          if (AppPlugin?.exitApp) {
            AppPlugin.exitApp();
          }
        });
      } catch {}
    };

    setupBackHandler();

    return () => {
      if (listener) listener.remove();
    };
  }, [pluginsLoaded, confirm.open, menuNote, showSettings, showTrash, isEditorOpen, showSearch, sel.isSelectionMode]);

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
    addToast(`已删除 ${ids.length} 条胶囊`, 'info');
  }, [sel, notes, addToast]);

  const copyNote = useCallback((note: Note) => {
    navigator.clipboard?.writeText([note.title, note.content].filter(Boolean).join('\n'));
    addToast('已复制到剪贴板', 'success');
  }, [addToast]);

  // ── Loading ──
  if (notes.loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--mi-bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center animate-pulse shadow-lg">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-[15px]" style={{ color: 'var(--mi-text-tertiary)' }}>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: 'var(--mi-bg)', color: 'var(--mi-text-primary)' }}>

        {/* ── Header ── */}
        <header className="sticky top-0 z-30 glass" style={{ background: 'var(--mi-bg)' }}>
          {showSearch ? (
            /* 搜索模式 */
            <div className="px-5 pb-4 pt-4 animate-mi-page-in" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                  className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" style={{ color: 'var(--mi-text-primary)' }} />
                </button>
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--mi-text-tertiary)' }} />
                  <input
                    type="text"
                    placeholder="搜索胶囊..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 rounded-2xl text-[15px] outline-none border-0"
                    style={{ background: 'var(--mi-card)', color: 'var(--mi-text-primary)', boxShadow: 'var(--mi-shadow)' }}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--mi-text-tertiary)' }}
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* 正常模式 */
            <div className="px-5 pb-3 pt-4" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mi-text-primary)' }}>
                  灵感胶囊
                </h1>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors"
                  >
                    {viewMode === 'grid' ? (
                      <List className="w-5 h-5" style={{ color: 'var(--mi-text-secondary)' }} />
                    ) : (
                      <LayoutGrid className="w-5 h-5" style={{ color: 'var(--mi-text-secondary)' }} />
                    )}
                  </button>
                  <button
                    onClick={() => setShowSearch(true)}
                    className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors"
                  >
                    <Search className="w-5 h-5" style={{ color: 'var(--mi-text-secondary)' }} />
                  </button>
                  <button
                    onClick={() => setShowTrash(true)}
                    className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors relative"
                  >
                    <Trash2 className="w-5 h-5" style={{ color: 'var(--mi-text-secondary)' }} />
                    {notes.trashNotes.length > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 text-white text-[9px] rounded-full flex items-center justify-center font-bold" style={{ background: 'var(--mi-orange)' }}>
                        {notes.trashNotes.length > 9 ? '9+' : notes.trashNotes.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5" style={{ color: 'var(--mi-text-secondary)' }} />
                  </button>
                </div>
              </div>

              {/* 分类标签 */}
              <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-hide -mx-5 px-5">
                {[
                  { id: 'all', label: '全部' },
                  ...cats.categories.map(c => ({ id: c.id, label: c.name })),
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="px-5 py-2 rounded-full text-[14px] font-medium whitespace-nowrap transition-all"
                    style={{
                      background: activeCategory === cat.id
                        ? 'linear-gradient(135deg, #FF8533, #FF6A00)'
                        : 'var(--mi-card)',
                      color: activeCategory === cat.id ? '#FFFFFF' : 'var(--mi-text-secondary)',
                      border: activeCategory === cat.id ? 'none' : '1px solid var(--mi-border)',
                      boxShadow: activeCategory === cat.id
                        ? '0 2px 8px rgba(255, 106, 0, 0.25)'
                        : 'var(--mi-shadow)',
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
              className="flex items-center justify-between px-5 py-3 border-t animate-mi-page-in"
              style={{ background: 'var(--mi-card)', borderColor: 'var(--mi-border)' }}
            >
              <div className="flex items-center gap-2.5">
                <button
                  onClick={sel.exitSelectionMode}
                  className="w-9 h-9 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors"
                >
                  <X className="w-5 h-5" style={{ color: 'var(--mi-text-secondary)' }} />
                </button>
                <span className="text-[15px] font-medium" style={{ color: 'var(--mi-text-primary)' }}>
                  已选 {sel.selectedCount} 项
                </span>
              </div>
              <button
                onClick={batchDelete}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-[14px] font-medium active:opacity-80 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #FF5555, #DD3333)', boxShadow: '0 2px 8px rgba(255, 68, 68, 0.3)' }}
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          )}
        </header>

        {/* ── Notes list ── */}
        <main className="px-3 pb-28 animate-mi-page-in">
          {filtered.length === 0 ? (
            <EmptyState hasNotes={notes.notes.length > 0} hasSearch={!!searchQuery.trim()} />
          ) : (
            <div className={viewMode === 'grid'
              ? 'columns-2 gap-3 [column-fill:balance]'
              : 'flex flex-col gap-2.5'
            }>
              {filtered.map((note, idx) => (
                <div
                  key={note.id}
                  className="animate-mi-slide-up opacity-0 break-inside-avoid"
                  style={{ animationDelay: `${Math.min(idx * 0.04, 0.24)}s` }}
                >
                  <CapsuleCard
                    note={note}
                    categories={cats.categories}
                    viewMode={viewMode}
                    isSelectionMode={sel.isSelectionMode}
                    isSelected={sel.isSelected(note.id)}
                    searchQuery={searchQuery}
                    onTap={tapNote}
                    onLongPress={() => {}}
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

        {/* ── FAB — 仅在主页显示 ── */}
        {!isEditorOpen && !showSettings && !showTrash && !showSearch && (
          <button
            onClick={() => openEditor()}
            className="w-16 h-16 rounded-full text-white flex items-center justify-center active:scale-90 transition-all ripple-btn"
            style={{
              position: 'fixed',
              right: '22px',
              bottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
              zIndex: 9999,
              background: 'linear-gradient(135deg, #FF8533, #FF5500)',
              boxShadow: '0 6px 24px rgba(255, 106, 0, 0.4), 0 2px 8px rgba(255, 106, 0, 0.2)',
            }}
          >
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </button>
        )}

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
            message: '此操作无法撤销，胶囊将被永久删除',
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
