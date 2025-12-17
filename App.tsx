import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Search, BrainCircuit, Moon, Sun, Settings, FolderPlus, Folder, LayoutGrid, List, PenLine, CheckSquare, Trash2, X, ArrowLeft } from 'lucide-react';
import { Note, Category } from './types';
import { CapsuleCard } from './components/CapsuleCard';
import { EditorModal } from './components/EditorModal';
import { SettingsModal } from './components/SettingsModal';
import { storage } from './services/storageService';

const THEME_STORAGE_KEY = 'inspiration_capsules_theme';
const VIEW_MODE_STORAGE_KEY = 'inspiration_capsules_view_mode';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  
  const [loading, setLoading] = useState(true);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme) return storedTheme as 'light' | 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem(VIEW_MODE_STORAGE_KEY) as 'grid' | 'list') || 'grid';
  });
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentEditingNote, setCurrentEditingNote] = useState<Note | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await storage.init();
        const [loadedNotes, loadedCategories] = await Promise.all([
            storage.getAllNotes(),
            storage.getAllCategories()
        ]);
        setNotes(loadedNotes);
        setCategories(loadedCategories);
      } catch (error) {
        console.error('Failed to load data from DB:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedNoteIds(new Set());
    }
  }, [isSelectionMode]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const handleCreateNew = () => { setCurrentEditingNote(null); setIsEditorOpen(true); };
  const handleEditNote = (note: Note) => { setCurrentEditingNote(note); setIsEditorOpen(true); };

  const handleSaveNote = async (note: Note) => {
    setNotes(prev => {
      const existingIndex = prev.findIndex(n => n.id === note.id);
      if (existingIndex >= 0) {
        const newNotes = [...prev];
        newNotes[existingIndex] = note;
        return newNotes.sort((a, b) => b.updatedAt - a.updatedAt);
      }
      return [note, ...prev.sort((a, b) => b.updatedAt - a.updatedAt)];
    });
    try {
      await storage.saveNote(note);
    } catch (error) {
      console.error("Failed to save note to DB:", error);
      alert("保存失败，请检查手机存储空间。");
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (window.navigator?.vibrate) window.navigator.vibrate(50);
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
      await storage.deleteNote(id);
    } catch (error) {
      console.error("Failed to delete note from DB:", error);
    }
  };
  
  const handleBatchDelete = async () => {
    if (selectedNoteIds.size === 0) return;
    if (confirm(`确定要删除选中的 ${selectedNoteIds.size} 个胶囊吗？`)) {
      const idsToDelete = Array.from(selectedNoteIds);
      setNotes(prev => prev.filter(n => !selectedNoteIds.has(n.id)));
      try {
        await Promise.all(idsToDelete.map(id => storage.deleteNote(id)));
        setIsSelectionMode(false);
      } catch (error) {
        console.error("Batch delete failed:", error);
        alert("部分删除失败");
      }
    }
  };

  const toggleSelectionMode = () => setIsSelectionMode(prev => !prev);

  const handleToggleSelectNote = (id: string) => {
    setSelectedNoteIds(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleAddCategory = async () => {
    const name = prompt("请输入新分类名称：");
    if (name?.trim()) {
        const newCat: Category = { id: crypto.randomUUID(), name: name.trim(), createdAt: Date.now() };
        setCategories(prev => [...prev, newCat]);
        await storage.saveCategory(newCat);
        setSelectedCategoryId(newCat.id);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
      if (confirm("删除分类不会删除其中的笔记，确定要删除吗？")) {
          setCategories(prev => prev.filter(c => c.id !== catId));
          if (selectedCategoryId === catId) setSelectedCategoryId('all');
          await storage.deleteCategory(catId);
      }
  };

  const handleExportData = () => { /* ... existing code ... */ };
  const handleImportData = (file: File) => { /* ... existing code ... */ };

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (selectedCategoryId !== 'all') {
      result = selectedCategoryId === 'uncategorized'
        ? result.filter(n => !n.categoryId || !categories.find(c => c.id === n.categoryId))
        : result.filter(n => n.categoryId === selectedCategoryId);
    }
    if (deferredSearchQuery.trim()) {
      const lowerQ = deferredSearchQuery.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(lowerQ) || n.content.toLowerCase().includes(lowerQ));
    }
    return result;
  }, [notes, deferredSearchQuery, selectedCategoryId, categories]);
  
  return (
    <div className="flex flex-col h-full min-h-screen">
      <header 
        className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-lg flex flex-col"
        style={{ paddingTop: 'var(--safe-area-inset-top)' }}
      >
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 dark:bg-indigo-500 text-white p-2 rounded-xl">
               <BrainCircuit size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">灵感胶囊</h1>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => setIsSearchFocused(true)} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><Search size={20} /></button>
            <button onClick={toggleTheme} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">{theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}</button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><Settings size={20} /></button>
          </div>
        </div>

        <div className="border-t border-slate-200/50 dark:border-slate-800/50 w-full overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button onClick={() => setSelectedCategoryId('all')} disabled={isSelectionMode} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategoryId === 'all' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'} ${isSelectionMode ? 'opacity-50' : ''}`}>全部</button>
            <button onClick={() => setSelectedCategoryId('uncategorized')} disabled={isSelectionMode} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategoryId === 'uncategorized' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'} ${isSelectionMode ? 'opacity-50' : ''}`}>无分类</button>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 flex-shrink-0"></div>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} onDoubleClick={() => !isSelectionMode && handleDeleteCategory(cat.id)} disabled={isSelectionMode} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${selectedCategoryId === cat.id ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'} ${isSelectionMode ? 'opacity-50' : ''}`}>{cat.name}</button>
            ))}
            <button onClick={handleAddCategory} disabled={isSelectionMode} className={`whitespace-nowrap p-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all ${isSelectionMode ? 'opacity-50' : ''}`}><FolderPlus size={18} /></button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32 w-full">
        {loading ? (
             <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div></div>
        ) : notes.length === 0 && !searchQuery ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4 mt-10">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm mb-6"><BrainCircuit size={48} className="text-slate-300 dark:text-slate-600" /></div>
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">暂无胶囊</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-8 text-sm">点击右下角的按钮，捕捉你的第一个灵感瞬间。</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-full p-1 border border-slate-200 dark:border-slate-800">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}><LayoutGrid size={18} /></button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-full transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}><List size={18} /></button>
              </div>
              <button onClick={toggleSelectionMode} className={`p-2 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ${isSelectionMode ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-500 dark:text-slate-400'}`} title="批量选择"><CheckSquare size={20} /></button>
            </div>
            <div className={viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-2.5"}>
              {filteredNotes.map(note => <CapsuleCard key={note.id} note={note} onClick={handleEditNote} onDelete={handleDeleteNote} viewMode={viewMode} isSelectionMode={isSelectionMode} isSelected={selectedNoteIds.has(note.id)} onToggleSelect={handleToggleSelectNote} />)}
            </div>
            {filteredNotes.length === 0 && <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-sm">{searchQuery ? <p>未找到匹配 “{searchQuery}” 的胶囊</p> : <p>该分类下暂无笔记</p>}</div>}
          </>
        )}
      </main>

      {!isSelectionMode ? (
        <div className="fixed bottom-0 right-0 z-40" style={{ right: 'calc(1.5rem + var(--safe-area-inset-right))', bottom: 'calc(1.5rem + var(--safe-area-inset-bottom))' }}>
          <button onClick={handleCreateNew} className="w-14 h-14 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl shadow-xl shadow-slate-300/50 dark:shadow-black/50 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"><PenLine size={24} /></button>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 transition-transform animate-in slide-in-from-bottom-full" style={{ paddingBottom: 'calc(1.5rem + var(--safe-area-inset-bottom))' }}>
          <div className="flex gap-3 max-w-md mx-auto bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-lg p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
            <button onClick={() => setIsSelectionMode(false)} className="flex-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 h-12 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 text-base font-medium active:scale-95 transition-transform"><X size={18} />取消</button>
            <button onClick={handleBatchDelete} disabled={selectedNoteIds.size === 0} className={`flex-[2] h-12 rounded-xl flex items-center justify-center gap-2 text-base font-medium transition-all active:scale-95 ${selectedNoteIds.size > 0 ? 'bg-red-600 text-white shadow-red-500/30' : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'}`}><Trash2 size={18} />删除 ({selectedNoteIds.size})</button>
          </div>
        </div>
      )}

      {isSearchFocused && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 animate-in fade-in" style={{ paddingTop: 'var(--safe-area-inset-top)' }}>
          <div className="h-16 flex items-center px-2 sm:px-4 lg:px-6">
            <button onClick={() => setIsSearchFocused(false)} className="p-2 text-slate-500 dark:text-slate-400"><ArrowLeft size={24} /></button>
            <input autoFocus type="text" placeholder="搜索所有灵感..." className="h-full w-full bg-transparent text-lg px-2 border-none outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-y-auto h-[calc(100%-4rem)]">
            {filteredNotes.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                    {filteredNotes.map(note => <CapsuleCard key={note.id} note={note} onClick={handleEditNote} onDelete={handleDeleteNote} viewMode='list' isSelectionMode={false} isSelected={false} onToggleSelect={() => {}} />)}
                </div>
            ) : (
                <div className="text-center pt-20 text-slate-400 dark:text-slate-500 text-sm">
                    {searchQuery ? <p>未找到匹配 “{searchQuery}” 的胶囊</p> : <p>输入关键词开始搜索</p>}
                </div>
            )}
          </div>
        </div>
      )}

      <EditorModal isOpen={isEditorOpen} note={currentEditingNote} onClose={() => setIsEditorOpen(false)} onSave={handleSaveNote} onDelete={handleDeleteNote} categories={categories} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onExport={handleExportData} onImport={handleImportData} />
    </div>
  );
};

export default App;
