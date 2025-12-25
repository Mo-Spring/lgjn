import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Search, BrainCircuit, Moon, Sun, Settings, LayoutGrid, List, Plus, Trash2, X, Archive, Menu, ChevronDown } from 'lucide-react';
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
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        return (localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark') || 'light';
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
      } catch (error: any) {
        console.error('Failed to load data from DB:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
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

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleCreateNew = () => {
    setCurrentEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    if (isSelectionMode) {
        handleToggleSelectNote(note.id);
        return;
    }
    setCurrentEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (note: Note) => {
    setNotes(prev => {
      const existingIndex = prev.findIndex(n => n.id === note.id);
      if (existingIndex >= 0) {
        const newNotes = [...prev];
        newNotes[existingIndex] = note;
        return newNotes.sort((a, b) => b.updatedAt - a.updatedAt);
      } else {
        return [note, ...prev];
      }
    });

    try {
      await storage.saveNote(note);
    } catch (error: any) {
      console.error("Failed to save note to DB:", error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
    }
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
        await storage.deleteNote(id);
    } catch (error: any) {
        console.error("Failed to delete note from DB:", error);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedNoteIds.size === 0) return;

    if (confirm(`确定要删除选中的 ${selectedNoteIds.size} 个胶囊吗？`)) {
      const idsToDelete: string[] = Array.from(selectedNoteIds);
      setNotes(prev => prev.filter(n => !selectedNoteIds.has(n.id)));
      try {
        await Promise.all(idsToDelete.map((id) => storage.deleteNote(id)));
        setIsSelectionMode(false);
      } catch (error: any) {
        console.error("Batch delete failed:", error);
      }
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
  };

  const handleToggleSelectNote = (id: string) => {
    setSelectedNoteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAddCategory = async () => {
    const name = prompt("新分类名称：");
    if (name && name.trim()) {
        const newCat: Category = {
            id: crypto.randomUUID(),
            name: name.trim(),
            createdAt: Date.now()
        };
        setCategories(prev => [...prev, newCat]);
        await storage.saveCategory(newCat);
        setSelectedCategoryId(newCat.id);
    }
  };

  const handleExportData = () => {
    const data = { notes, categories };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inspiration-capsules-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = e.target?.result as string;
        const importedData = JSON.parse(result);
        if (Array.isArray(importedData) || importedData.notes) {
            const importedNotes = Array.isArray(importedData) ? importedData : importedData.notes;
            const importedCats = importedData.categories || [];
             if (confirm(`导入 ${importedNotes.length} 条笔记？`)) {
                await storage.importData(importedNotes, importedCats);
                window.location.reload(); 
            }
        }
      } catch (err) {
        alert('导入失败');
      }
    };
    reader.readAsText(file);
  };

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
            n.title.toLowerCase().includes(lowerQ) || 
            n.content.toLowerCase().includes(lowerQ)
        );
    }
    return result;
  }, [notes, deferredSearchQuery, selectedCategoryId, categories]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/20 relative">
      
      {/* Noise Texture Overlay */}
      <div className="bg-noise" />

      {/* Decorative Background Blurs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] rounded-full bg-blue-300/30 dark:bg-blue-600/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] rounded-full bg-purple-300/30 dark:bg-purple-600/20 blur-[100px]" />
      </div>

      {/* Sticky Header with Safe Area support */}
      <header className="sticky top-0 z-40 pt-safe bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="h-14 flex items-center justify-between">
                {/* Logo & Settings */}
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 -ml-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 transition-colors">
                        <Menu size={22} />
                    </button>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        灵感胶囊
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    </h1>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1">
                    <div className={`
                        flex items-center transition-all duration-300 overflow-hidden
                        ${isSearchOpen ? 'w-full absolute inset-x-0 top-0 h-14 bg-white dark:bg-slate-900 px-4 z-50' : 'w-10 bg-transparent'}
                    `}>
                         <div className={`flex items-center w-full ${isSearchOpen ? '' : 'justify-end'}`}>
                            {isSearchOpen && <Search size={18} className="text-slate-400 mr-2 flex-shrink-0" />}
                            <input 
                                type="text"
                                placeholder="搜索..."
                                className={`bg-transparent border-none outline-none text-base w-full ${isSearchOpen ? 'block' : 'hidden'}`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus={isSearchOpen}
                                onBlur={() => !searchQuery && setIsSearchOpen(false)}
                            />
                            <button 
                                onClick={() => {
                                    setIsSearchOpen(!isSearchOpen);
                                    if (!isSearchOpen) setTimeout(() => document.querySelector('input')?.focus(), 100);
                                }}
                                className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white flex-shrink-0"
                            >
                                {isSearchOpen ? <X size={20} /> : <Search size={22} />}
                            </button>
                         </div>
                    </div>

                    <button 
                        onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                        className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors"
                    >
                        {viewMode === 'grid' ? <LayoutGrid size={22} /> : <List size={22} />}
                    </button>
                    
                    <button 
                        onClick={toggleSelectionMode}
                        className={`p-2 rounded-full transition-colors ${isSelectionMode ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        <Archive size={22} />
                    </button>
                </div>
            </div>

            {/* Category Pills (Scrollable) */}
            <div className="pb-3 pt-1 flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
                <button 
                    onClick={() => setSelectedCategoryId('all')}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${selectedCategoryId === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                >
                    全部
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${selectedCategoryId === cat.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                    >
                        {cat.name}
                    </button>
                ))}
                <button 
                    onClick={handleAddCategory} 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 flex-shrink-0"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-32 animate-fade-in">
        {loading ? (
             <div className="flex justify-center items-center h-40">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
        ) : (
             <>
                {notes.length === 0 && !searchQuery ? (
                  <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6 mt-10">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mb-6 rotate-3">
                        <BrainCircuit size={32} className="text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">空空如也</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                      点击右下角的按钮，捕捉你的第一个灵感瞬间。
                    </p>
                  </div>
                ) : (
                  <div className={
                        viewMode === 'grid' 
                            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 auto-rows-max" 
                            : "flex flex-col gap-2 max-w-3xl mx-auto"
                    }>
                      {filteredNotes.map(note => (
                        <CapsuleCard 
                          key={note.id} 
                          note={note} 
                          onClick={handleEditNote}
                          onDelete={handleDeleteNote}
                          viewMode={viewMode}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedNoteIds.has(note.id)}
                          onToggleSelect={handleToggleSelectNote}
                        />
                      ))}
                    </div>
                )}
             </>
        )}
      </main>

      {/* Floating Action Button / Selection Bar */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-4 pointer-events-none pb-safe">
         <div className="pointer-events-auto">
             {isSelectionMode ? (
                 <div className="flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 pr-5 rounded-full shadow-2xl border border-white/20 dark:border-slate-800/50 animate-slide-up">
                    <button 
                        onClick={() => setIsSelectionMode(false)}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 active:bg-slate-200"
                    >
                        <X size={20} />
                    </button>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{selectedNoteIds.size}</span>
                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
                    <button 
                        onClick={handleBatchDelete}
                        disabled={selectedNoteIds.size === 0}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm transition-all ${selectedNoteIds.size > 0 ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-slate-400'}`}
                    >
                        删除
                    </button>
                 </div>
             ) : (
                <button 
                    onClick={handleCreateNew}
                    className="group flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[24px] shadow-xl shadow-slate-900/20 active:scale-90 transition-all duration-300"
                >
                    <Plus size={28} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
             )}
         </div>
      </div>

      <EditorModal 
        isOpen={isEditorOpen}
        note={currentEditingNote}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        categories={categories}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onExport={handleExportData}
        onImport={handleImportData}
      />
      
      {/* Hidden Theme Toggle (Moved to Settings eventually, but keeping accessible for now via logo tap or separate logic if needed, currently rely on system or settings, but let's add a small toggle in the corner of settings or header) */}
       <div className="fixed top-safe left-0 z-50 opacity-0 pointer-events-none">
          {/* Placeholder for safe area logic debugging */}
       </div>
    </div>
  );
};

export default App;
