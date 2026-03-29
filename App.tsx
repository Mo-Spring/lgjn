import React, { useState, useEffect, useMemo, useDeferredValue, useRef } from 'react';
import { Search, Plus, X, Archive, Menu, Grid, List, CheckCircle2, Moon, Sun, Trash2 } from 'lucide-react';
import { Note, Category } from './types';
import { CapsuleCard } from './components/CapsuleCard';
import { EditorModal } from './components/EditorModal';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmDialog, InputDialog } from './components/Dialogs';
import { NoteActionMenu } from './components/NoteActionMenu';
import { TrashView } from './components/TrashView';
import { storage } from './services/storageService';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

const THEME_STORAGE_KEY = 'inspiration_capsules_theme';
const VIEW_MODE_STORAGE_KEY = 'inspiration_capsules_view_mode';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) return stored as 'light' | 'dark';
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(VIEW_MODE_STORAGE_KEY) as 'grid' | 'list') || 'grid';
    }
    return 'grid';
  });

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set<string>());

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentEditingNote, setCurrentEditingNote] = useState<Note | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean; x: number; y: number; note: Note | null;
  }>({ isOpen: false, x: 0, y: 0, note: null });

  // Move-category picker
  const [moveCategoryDialog, setMoveCategoryDialog] = useState<{
    isOpen: boolean; note: Note | null;
  }>({ isOpen: false, note: null });

  // Trash
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [trashedNotes, setTrashedNotes] = useState<Note[]>([]);

  // Toast
  const [toast, setToast] = useState<{ message: string; action?: () => void; actionLabel?: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Dialog States
  const [inputDialog, setInputDialog] = useState({ isOpen: false, title: '', placeholder: '', onConfirm: (_val: string) => { } });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', isDangerous: false, onConfirm: () => { } });

  // ─── Data Loading ───

  const loadData = async () => {
    try {
      setLoading(true);
      await storage.init();
      const [loadedNotes, loadedCategories, trashed] = await Promise.all([
        storage.getAllNotes(),
        storage.getAllCategories(),
        storage.getTrashedNotes()
      ]);
      setNotes(loadedNotes);
      setCategories(loadedCategories);
      setTrashedNotes(trashed);
    } catch (error: any) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ─── Theme ───

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    if (Capacitor.isNativePlatform()) {
      const setStatusBarStyle = async () => {
        try {
          await StatusBar.setOverlaysWebView({ overlay: false });
          await StatusBar.setBackgroundColor({ color: theme === 'dark' ? '#000000' : '#F2F2F7' });
          await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
        } catch (e) { console.warn("Status bar not supported", e); }
      };
      setStatusBarStyle();
    }
  }, [theme]);

  useEffect(() => { localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode); }, [viewMode]);

  useEffect(() => {
    if (!isSelectionMode) setSelectedNoteIds(new Set());
  }, [isSelectionMode]);

  // ─── Back Button ───

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let backListener: any;
    const setupBackListener = async () => {
      backListener = await CapacitorApp.addListener('backButton', () => {
        if (isEditorOpen) return;
        if (inputDialog.isOpen) { setInputDialog(prev => ({ ...prev, isOpen: false })); return; }
        if (confirmDialog.isOpen) { setConfirmDialog(prev => ({ ...prev, isOpen: false })); return; }
        if (moveCategoryDialog.isOpen) { setMoveCategoryDialog({ isOpen: false, note: null }); return; }
        if (contextMenu.isOpen) { setContextMenu(prev => ({ ...prev, isOpen: false })); return; }
        if (isSettingsOpen) { setIsSettingsOpen(false); return; }
        if (isTrashOpen) { setIsTrashOpen(false); return; }
        if (isSelectionMode) { setIsSelectionMode(false); return; }
        if (isSearchOpen) { setIsSearchOpen(false); return; }
        CapacitorApp.exitApp();
      });
    };
    setupBackListener();
    return () => { if (backListener) backListener.remove(); };
  }, [isEditorOpen, inputDialog.isOpen, confirmDialog.isOpen, isSettingsOpen, isSelectionMode, isSearchOpen, isTrashOpen, contextMenu.isOpen, moveCategoryDialog.isOpen]);

  // ─── Toast ───

  const showToast = (message: string, action?: () => void, actionLabel?: string) => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, action, actionLabel });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  // ─── Notes CRUD ───

  const handleCreateNew = () => {
    setCurrentEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    if (isSelectionMode) { handleToggleSelectNote(note.id); return; }
    setCurrentEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (note: Note) => {
    setNotes(prev => {
      const idx = prev.findIndex(n => n.id === note.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = note;
        return updated.sort((a, b) => b.updatedAt - a.updatedAt);
      }
      return [note, ...prev];
    });
    try { await storage.saveNote(note); } catch (e) { console.error("Save error:", e); }
  };

  const executeSoftDelete = async (id: string) => {
    const note = notes.find(n => n.id === id);
    setNotes(prev => prev.filter(n => n.id !== id));
    if (note) setTrashedNotes(prev => [{ ...note, deletedAt: Date.now() }, ...prev]);
    try { await storage.softDeleteNote(id); } catch (e) { console.error("Delete error:", e); }
    showToast('已移到回收站', () => handleRestoreNote(id), '撤销');
  };

  const handleDeleteNote = (id: string) => {
    setConfirmDialog({
      isOpen: true, title: '删除胶囊', message: '确定要删除这条灵感吗？可在回收站中恢复。', isDangerous: true,
      onConfirm: () => {
        executeSoftDelete(id);
        if (isEditorOpen) setIsEditorOpen(false);
      }
    });
  };

  const handleRestoreNote = async (id: string) => {
    const note = trashedNotes.find(n => n.id === id);
    setTrashedNotes(prev => prev.filter(n => n.id !== id));
    if (note) {
      const restored = { ...note, updatedAt: Date.now() };
      delete restored.deletedAt;
      setNotes(prev => [restored as Note, ...prev]);
    }
    try { await storage.restoreNote(id); } catch (e) { console.error("Restore error:", e); }
    showToast('已恢复');
  };

  const handleDeleteForever = (id: string) => {
    setConfirmDialog({
      isOpen: true, title: '永久删除', message: '此操作无法撤销，确定要永久删除吗？', isDangerous: true,
      onConfirm: async () => {
        setTrashedNotes(prev => prev.filter(n => n.id !== id));
        try { await storage.deleteNote(id); } catch (e) { console.error(e); }
      }
    });
  };

  const handleEmptyTrash = () => {
    if (trashedNotes.length === 0) return;
    setConfirmDialog({
      isOpen: true, title: '清空回收站', message: `将永久删除 ${trashedNotes.length} 条笔记，此操作不可撤销。`, isDangerous: true,
      onConfirm: async () => {
        setTrashedNotes([]);
        try { await storage.emptyTrash(); } catch (e) { console.error(e); }
      }
    });
  };

  const handleBatchDelete = async () => {
    if (selectedNoteIds.size === 0) return;
    setConfirmDialog({
      isOpen: true, title: '批量删除', message: `将 ${selectedNoteIds.size} 条灵感移到回收站？`, isDangerous: true,
      onConfirm: async () => {
        const ids = Array.from(selectedNoteIds);
        for (const id of ids) {
          await executeSoftDelete(id);
        }
        setIsSelectionMode(false);
      }
    });
  };

  // ─── Selection ───

  const handleToggleSelectNote = (id: string) => {
    setSelectedNoteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      return newSet;
    });
  };

  // ─── Context Menu ───

  const handleLongPressNote = (note: Note, event?: React.MouseEvent | React.TouchEvent) => {
    if (isSelectionMode) return;
    if (window.navigator?.vibrate) window.navigator.vibrate(50);

    let x = window.innerWidth / 2 - 90;
    let y = window.innerHeight / 2 - 80;

    if (event && 'clientX' in event) {
      x = event.clientX;
      y = event.clientY;
    } else if (event && 'touches' in event && event.touches[0]) {
      x = event.touches[0].clientX;
      y = event.touches[0].clientY;
    }

    setContextMenu({ isOpen: true, x, y, note });
  };

  const handleCopyNote = () => {
    if (!contextMenu.note) return;
    const text = [contextMenu.note.title, contextMenu.note.content].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).then(() => showToast('已复制到剪贴板'));
  };

  const handleMoveCategoryForNote = () => {
    if (!contextMenu.note) return;
    setMoveCategoryDialog({ isOpen: true, note: contextMenu.note });
  };

  const executeMoveCategory = async (categoryId: string | null) => {
    if (!moveCategoryDialog.note) return;
    const updated: Note = {
      ...moveCategoryDialog.note,
      categoryId: categoryId || undefined,
      updatedAt: Date.now()
    };
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
    try { await storage.saveNote(updated); } catch (e) { console.error(e); }
    setMoveCategoryDialog({ isOpen: false, note: null });
    showToast(categoryId ? '已移动分类' : '已移除分类');
  };

  // ─── Categories ───

  const handleAddCategory = () => {
    setInputDialog({
      isOpen: true, title: '新建分类', placeholder: '输入分类名称...',
      onConfirm: async (name) => {
        if (!name?.trim()) return;
        const newCat: Category = { id: crypto.randomUUID(), name: name.trim(), createdAt: Date.now() };
        setCategories(prev => [...prev, newCat]);
        await storage.saveCategory(newCat);
        setSelectedCategoryId(newCat.id);
      }
    });
  };

  const handleRenameCategory = async (id: string, newName: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    const updated = { ...cat, name: newName };
    setCategories(prev => prev.map(c => c.id === id ? updated : c));
    try { await storage.saveCategory(updated); } catch (e) { console.error(e); }
    showToast('已重命名');
  };

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    setConfirmDialog({
      isOpen: true, title: '删除分类', message: `「${cat.name}」下的笔记将变为未分类。确定删除？`, isDangerous: true,
      onConfirm: async () => {
        setCategories(prev => prev.filter(c => c.id !== id));
        setNotes(prev => prev.map(n => n.categoryId === id ? { ...n, categoryId: undefined } : n));
        if (selectedCategoryId === id) setSelectedCategoryId('all');
        try {
          await storage.unassignNotesFromCategory(id);
          await storage.deleteCategory(id);
        } catch (e) { console.error(e); }
        showToast('分类已删除');
      }
    });
  };

  // ─── Import / Export ───

  const handleExportData = () => {
    const data = { notes, categories };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inspiration-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        const importedNotes = Array.isArray(importedData) ? importedData : importedData.notes || [];
        const importedCats = importedData.categories || [];
        setConfirmDialog({
          isOpen: true, title: '导入数据', message: `发现 ${importedNotes.length} 条笔记。确认覆盖当前数据？`, isDangerous: false,
          onConfirm: async () => {
            await storage.importData(importedNotes, importedCats);
            window.location.reload();
          }
        });
      } catch { showToast('文件格式错误'); }
    };
    reader.readAsText(file);
  };

  // ─── Filtered Notes ───

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (selectedCategoryId !== 'all') {
      if (selectedCategoryId === 'uncategorized') {
        result = result.filter(n => !n.categoryId || !categories.find(c => c.id === n.categoryId));
      } else {
        result = result.filter(n => n.categoryId === selectedCategoryId);
      }
    }
    if (deferredSearchQuery.trim()) {
      const lowerQ = deferredSearchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(lowerQ) || n.content.toLowerCase().includes(lowerQ)
      );
    }
    return result;
  }, [notes, deferredSearchQuery, selectedCategoryId, categories]);

  // ─── Render ───

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black text-slate-900 dark:text-slate-100 font-sans">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#F2F2F7]/95 dark:bg-black/95 backdrop-blur-md border-b border-black/5 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-4">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 -ml-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <Menu size={22} strokeWidth={2.5} />
              </button>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">灵感胶囊</h1>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (!isSearchOpen) setTimeout(() => document.getElementById('search-input')?.focus(), 100);
                  setIsSearchOpen(!isSearchOpen);
                }}
                className={`p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${isSearchOpen ? 'bg-black/5 dark:bg-white/10' : ''}`}
              >
                <Search size={20} />
              </button>
              <button
                onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                {viewMode === 'grid' ? <Grid size={20} /> : <List size={20} />}
              </button>
              <button
                onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button
                onClick={() => setIsSelectionMode(prev => !prev)}
                className={`p-2 rounded-full transition-colors ml-1 ${isSelectionMode ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'}`}
              >
                <CheckCircle2 size={20} />
              </button>
            </div>
          </div>

          {/* Search */}
          {isSearchOpen && (
            <div className="pb-3 animate-enter">
              <input
                id="search-input"
                type="text"
                placeholder="搜索灵感..."
                className="w-full bg-white dark:bg-[#1C1C1E] rounded-xl px-4 py-2.5 text-base outline-none text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {/* Categories */}
          <div className="pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all shadow-sm ${selectedCategoryId === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg shadow-slate-900/20' : 'bg-white dark:bg-[#1C1C1E] text-slate-500 dark:text-slate-400'}`}
            >
              全部
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all shadow-sm ${selectedCategoryId === cat.id ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg shadow-slate-900/20' : 'bg-white dark:bg-[#1C1C1E] text-slate-500 dark:text-slate-400'}`}
              >
                {cat.name}
              </button>
            ))}
            <button
              onClick={handleAddCategory}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-[#1C1C1E] text-slate-400 dark:text-slate-500 flex-shrink-0 shadow-sm active:scale-90 transition-transform"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-4 pb-32 animate-fade-in min-h-[80vh]">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {notes.length === 0 && !searchQuery ? (
              <div className="flex flex-col items-center justify-center pt-32 opacity-40 animate-fade-in">
                <div className="w-20 h-20 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <Archive size={32} className="text-slate-400" strokeWidth={1.5} />
                </div>
                <p className="text-slate-500 text-sm font-medium">暂无灵感，开始记录吧</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-32 opacity-40 animate-fade-in">
                <p className="text-slate-500 text-sm font-medium">没有匹配的灵感</p>
              </div>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? "grid grid-cols-2 gap-3 auto-rows-max"
                  : "flex flex-col gap-2"
              }>
                {filteredNotes.map((note, index) => (
                  <div key={note.id} className="animate-enter" style={{ animationDelay: `${index * 0.04}s` }}>
                    <CapsuleCard
                      note={note}
                      onClick={handleEditNote}
                      onLongPress={handleLongPressNote}
                      viewMode={viewMode}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedNoteIds.has(note.id)}
                      onToggleSelect={handleToggleSelectNote}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* FAB */}
      <div className="fixed bottom-8 right-6 z-40 flex flex-col items-end gap-4 pb-safe pointer-events-none">
        <div className="pointer-events-auto">
          {isSelectionMode ? (
            <div className="flex items-center gap-4 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl p-2 pr-6 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-slide-up border border-white/20 dark:border-white/5">
              <button
                onClick={() => setIsSelectionMode(false)}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300"
              >
                <X size={20} />
              </button>
              <span className="text-sm font-bold text-slate-900 dark:text-white">已选 {selectedNoteIds.size}</span>
              <button
                onClick={handleBatchDelete}
                disabled={selectedNoteIds.size === 0}
                className={`text-sm font-bold transition-colors ${selectedNoteIds.size > 0 ? 'text-red-500' : 'text-slate-300 dark:text-slate-600'}`}
              >
                删除
              </button>
            </div>
          ) : (
            <button
              onClick={handleCreateNew}
              className="group flex items-center justify-center w-14 h-14 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.15)] active:scale-90 transition-all duration-300 hover:rotate-90"
            >
              <Plus size={26} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <EditorModal
        isOpen={isEditorOpen}
        note={currentEditingNote}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        categories={categories}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onExport={handleExportData}
        onImport={handleImportData}
        categories={categories}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
        onOpenTrash={() => { setIsSettingsOpen(false); setTimeout(() => setIsTrashOpen(true), 200); }}
        trashedCount={trashedNotes.length}
      />

      {/* Trash View */}
      <TrashView
        isOpen={isTrashOpen}
        trashedNotes={trashedNotes}
        onClose={() => setIsTrashOpen(false)}
        onRestore={handleRestoreNote}
        onDeleteForever={handleDeleteForever}
        onEmptyTrash={handleEmptyTrash}
      />

      {/* Note Action Menu */}
      <NoteActionMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onEdit={() => {
          if (contextMenu.note) {
            setCurrentEditingNote(contextMenu.note);
            setIsEditorOpen(true);
          }
        }}
        onDelete={() => {
          if (contextMenu.note) handleDeleteNote(contextMenu.note.id);
        }}
        onMoveCategory={handleMoveCategoryForNote}
        onCopy={handleCopyNote}
      />

      {/* Move Category Dialog */}
      {moveCategoryDialog.isOpen && moveCategoryDialog.note && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-sm" onClick={() => setMoveCategoryDialog({ isOpen: false, note: null })} />
          <div className="relative w-full max-w-xs bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl rounded-[24px] shadow-2xl border border-white/40 dark:border-white/10 animate-enter overflow-hidden">
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 text-center">移动到分类</h3>
              <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                <button
                  onClick={() => executeMoveCategory(null)}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  未分类
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => executeMoveCategory(cat.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-[14px] font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/10 ${moveCategoryDialog.note?.categoryId === cat.id ? 'text-slate-900 dark:text-white bg-slate-50 dark:bg-white/5' : 'text-slate-600 dark:text-slate-300'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Dialogs */}
      <InputDialog
        isOpen={inputDialog.isOpen}
        onClose={() => setInputDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={inputDialog.onConfirm}
        title={inputDialog.title}
        placeholder={inputDialog.placeholder}
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDangerous={confirmDialog.isDangerous}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[80] animate-slide-up">
          <div className="flex items-center gap-3 px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] text-[14px] font-medium">
            <span>{toast.message}</span>
            {toast.action && toast.actionLabel && (
              <button
                onClick={() => { toast.action?.(); setToast(null); }}
                className="text-blue-300 dark:text-blue-600 font-bold hover:underline"
              >
                {toast.actionLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
