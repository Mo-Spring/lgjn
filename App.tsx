
import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Search, BrainCircuit, Moon, Sun, LayoutGrid, List, Plus, Trash2, X, Archive, Menu } from 'lucide-react';
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
  
  // Track scroll for header effect
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
        setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    const name = prompt("Name for new collection:");
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
    link.download = `inspiration-capsules-backup.json`;
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
             if (confirm(`Import ${importedNotes.length} notes?`)) {
                await storage.importData(importedNotes, importedCats);
                window.location.reload(); 
            }
        }
      } catch (err) {
        alert('Import failed');
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#050505] text-slate-900 dark:text-slate-100 font-sans selection:bg-slate-300 dark:selection:bg-slate-700 relative transition-colors duration-500">
      
      {/* Noise Texture */}
      <div className="bg-noise opacity-50 dark:opacity-20" />

      {/* Header - Truly transparent initially, then blurs on scroll */}
      <header 
        className={`
            sticky top-0 z-40 pt-safe transition-all duration-300
            ${isScrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5' : 'bg-transparent'}
        `}
      >
        <div className="max-w-7xl mx-auto px-5">
            <div className="h-14 flex items-center justify-between">
                {/* Brand */}
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors">
                        <Menu size={20} />
                    </button>
                    <span className="text-sm font-bold tracking-[0.2em] text-slate-900 dark:text-slate-100 uppercase">
                        Capsules
                    </span>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1">
                     {/* Search Input - Expanding */}
                    <div className={`
                        flex items-center transition-all duration-300 overflow-hidden
                        ${isSearchOpen ? 'w-48 bg-black/5 dark:bg-white/10 px-3 rounded-full mr-2' : 'w-10 bg-transparent'}
                    `}>
                         <div className={`flex items-center w-full ${isSearchOpen ? '' : 'justify-end'}`}>
                            <input 
                                type="text"
                                placeholder="Search..."
                                className={`bg-transparent border-none outline-none text-sm w-full h-8 ${isSearchOpen ? 'block' : 'hidden'}`}
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
                                className={`p-2 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white flex-shrink-0 ${isSearchOpen ? '' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                            >
                                {isSearchOpen ? <X size={16} /> : <Search size={20} />}
                            </button>
                         </div>
                    </div>

                    <button 
                        onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                        className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        {viewMode === 'grid' ? <LayoutGrid size={20} /> : <List size={20} />}
                    </button>

                    <button 
                        onClick={toggleTheme} 
                        className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    
                    <button 
                        onClick={toggleSelectionMode}
                        className={`p-2 rounded-full transition-colors ${isSelectionMode ? 'text-white bg-slate-900 dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'}`}
                    >
                        <Archive size={20} />
                    </button>
                </div>
            </div>

            {/* Collections (Pills) */}
            <div className="pb-4 pt-1 flex items-center gap-3 overflow-x-auto no-scrollbar mask-linear-fade">
                <button 
                    onClick={() => setSelectedCategoryId('all')}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wide uppercase transition-all border ${selectedCategoryId === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 hover:border-slate-400'}`}
                >
                    All
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wide uppercase transition-all border ${selectedCategoryId === cat.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 hover:border-slate-400'}`}
                    >
                        {cat.name}
                    </button>
                ))}
                <button 
                    onClick={handleAddCategory} 
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white flex-shrink-0"
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-0 max-w-7xl mx-auto px-5 sm:px-6 py-4 pb-32 animate-fade-in">
        {loading ? (
             <div className="flex justify-center items-center h-40">
                <div className="w-5 h-5 border-2 border-slate-800 dark:border-slate-200 border-t-transparent rounded-full animate-spin"></div>
             </div>
        ) : (
             <>
                {notes.length === 0 && !searchQuery ? (
                  <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6 mt-10 opacity-40">
                    <BrainCircuit size={40} className="text-slate-400 mb-4" strokeWidth={1} />
                    <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-1">Begin Here</h2>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">
                      Your mind is a universe
                    </p>
                  </div>
                ) : (
                  <div className={
                        viewMode === 'grid' 
                            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max" 
                            : "flex flex-col gap-3 max-w-2xl mx-auto"
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

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-4 pointer-events-none pb-safe">
         <div className="pointer-events-auto">
             {isSelectionMode ? (
                 <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 pr-6 rounded-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-slide-up">
                    <button 
                        onClick={() => setIsSelectionMode(false)}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
                    >
                        <X size={18} />
                    </button>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedNoteIds.size} SELECTED</span>
                    <button 
                        onClick={handleBatchDelete}
                        disabled={selectedNoteIds.size === 0}
                        className={`text-sm font-bold transition-all ${selectedNoteIds.size > 0 ? 'text-red-500' : 'text-slate-300'}`}
                    >
                        DELETE
                    </button>
                 </div>
             ) : (
                <button 
                    onClick={handleCreateNew}
                    className="group flex items-center justify-center w-16 h-16 bg-[#1A1A1A] dark:bg-[#EDEDED] text-white dark:text-black rounded-[22px] shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
                >
                    <Plus size={30} strokeWidth={2} />
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
    </div>
  );
};

export default App;
