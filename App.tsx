import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Search, Plus, X, Archive, Menu, Grid, List, CheckCircle2, Trash2, Edit2, MoreHorizontal } from 'lucide-react';
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
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        return 'light';
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
  
  // Context Menu State (Action Sheet)
  const [contextMenuNote, setContextMenuNote] = useState<Note | null>(null);

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
        console.error('Failed to load data:', error);
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

  const handleLongPressNote = (note: Note) => {
    if (isSelectionMode) return;
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
    setContextMenuNote(note);
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
      console.error("Save error:", error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
        await storage.deleteNote(id);
    } catch (error: any) {
        console.error("Delete error:", error);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedNoteIds.size === 0) return;

    if (confirm(`确定删除 ${selectedNoteIds.size} 个胶囊吗？`)) {
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
    const name = prompt("请输入分类名称：");
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
        const result = e.target?.result as string;
        const importedData = JSON.parse(result);
        if (Array.isArray(importedData) || importedData.notes) {
            const importedNotes = Array.isArray(importedData) ? importedData : importedData.notes;
            const importedCats = importedData.categories || [];
             if (confirm(`确认导入 ${importedNotes.length} 条笔记？`)) {
                await storage.importData(importedNotes, importedCats);
                window.location.reload(); 
            }
        }
      } catch (err) {
        alert('文件格式错误');
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
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Header - Glassmorphism */}
      <header className="sticky top-0 z-40 bg-[#F2F2F7]/90 dark:bg-black/80 backdrop-blur-md border-b border-black/5 dark:border-white/10 pt-safe">
        <div className="max-w-3xl mx-auto px-4">
            <div className="h-14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 -ml-2 rounded-full text-slate-900 dark:text-white active:bg-slate-200 dark:active:bg-white/10 transition-colors">
                        <Menu size={24} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight">灵感胶囊</h1>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            if (!isSearchOpen) setTimeout(() => document.getElementById('search-input')?.focus(), 100);
                            setIsSearchOpen(!isSearchOpen);
                        }}
                        className={`p-2 rounded-full text-slate-900 dark:text-white transition-colors ${isSearchOpen ? 'bg-slate-200 dark:bg-white/10' : ''}`}
                    >
                        <Search size={22} />
                    </button>

                    <button 
                        onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
                        className="p-2 rounded-full text-slate-900 dark:text-white"
                    >
                        {viewMode === 'grid' ? <Grid size={22} /> : <List size={22} />}
                    </button>
                    
                    <button 
                        onClick={toggleSelectionMode}
                        className={`p-2 rounded-full transition-colors ${isSelectionMode ? 'bg-blue-500 text-white' : 'text-slate-900 dark:text-white'}`}
                    >
                        <CheckCircle2 size={22} />
                    </button>
                </div>
            </div>
            
            {/* Expanded Search Bar */}
            {isSearchOpen && (
                <div className="pb-3 animate-enter">
                    <input 
                        id="search-input"
                        type="text"
                        placeholder="搜索灵感..."
                        className="w-full bg-[#E5E5EA] dark:bg-[#1C1C1E] rounded-xl px-4 py-2 text-base outline-none text-slate-900 dark:text-white placeholder:text-slate-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            )}

            {/* Categories Scroll */}
            <div className="pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setSelectedCategoryId('all')}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[14px] font-medium transition-all ${selectedCategoryId === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-black' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    全部
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[14px] font-medium transition-all ${selectedCategoryId === cat.id ? 'bg-slate-900 dark:bg-white text-white dark:text-black' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        {cat.name}
                    </button>
                ))}
                <button 
                    onClick={handleAddCategory} 
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-300 flex-shrink-0"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-4 pb-32 animate-fade-in min-h-[80vh]">
        {loading ? (
             <div className="flex justify-center items-center h-40">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
             </div>
        ) : (
             <>
                {notes.length === 0 && !searchQuery ? (
                  <div className="flex flex-col items-center justify-center pt-32 opacity-40">
                    <Archive size={48} className="text-slate-400 mb-4" strokeWidth={1} />
                    <p className="text-slate-500 text-sm">暂无灵感，开始记录吧</p>
                  </div>
                ) : (
                  <div className={
                        viewMode === 'grid' 
                            ? "grid grid-cols-2 gap-3 auto-rows-max" 
                            : "flex flex-col gap-2"
                    }>
                      {filteredNotes.map(note => (
                        <CapsuleCard 
                          key={note.id} 
                          note={note} 
                          onClick={handleEditNote}
                          onLongPress={handleLongPressNote}
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
      <div className="fixed bottom-8 right-6 z-40 flex flex-col items-end gap-4 pb-safe">
         {isSelectionMode ? (
             <div className="flex items-center gap-4 bg-white dark:bg-[#1C1C1E] p-2 pr-6 rounded-full shadow-2xl animate-slide-up border border-slate-100 dark:border-white/10">
                <button 
                    onClick={() => setIsSelectionMode(false)}
                    className="w-10 h-10 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-slate-600 dark:text-slate-300"
                >
                    <X size={20} />
                </button>
                <span className="text-sm font-medium text-slate-900 dark:text-white">已选 {selectedNoteIds.size} 项</span>
                <button 
                    onClick={handleBatchDelete}
                    disabled={selectedNoteIds.size === 0}
                    className={`text-sm font-bold ${selectedNoteIds.size > 0 ? 'text-red-500' : 'text-slate-400'}`}
                >
                    删除
                </button>
             </div>
         ) : (
            <button 
                onClick={handleCreateNew}
                className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/30 active:scale-90 transition-all hover:bg-blue-700"
            >
                <Plus size={28} />
            </button>
         )}
      </div>

      {/* Action Sheet (Context Menu) */}
      {contextMenuNote && (
        <>
            <div 
                className="fixed inset-0 z-50 bg-black/20 dark:bg-black/60 backdrop-blur-[1px]" 
                onClick={() => setContextMenuNote(null)}
            />
            <div className="fixed inset-x-4 bottom-8 z-50 animate-slide-up pb-safe">
                <div className="bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl rounded-[14px] overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-slate-200/50 dark:border-white/10 text-center">
                        <span className="text-xs font-medium text-slate-400 truncate block px-8">
                            {contextMenuNote.title || "未命名灵感"}
                        </span>
                    </div>
                    <button 
                        onClick={() => {
                            setContextMenuNote(null);
                            handleEditNote(contextMenuNote);
                        }}
                        className="w-full py-3.5 text-[16px] font-medium text-blue-600 dark:text-blue-400 active:bg-slate-100 dark:active:bg-white/10 border-b border-slate-200/50 dark:border-white/10"
                    >
                        编辑
                    </button>
                    <button 
                        onClick={() => {
                            setContextMenuNote(null);
                            setIsSelectionMode(true);
                            handleToggleSelectNote(contextMenuNote.id);
                        }}
                        className="w-full py-3.5 text-[16px] font-medium text-slate-900 dark:text-white active:bg-slate-100 dark:active:bg-white/10 border-b border-slate-200/50 dark:border-white/10"
                    >
                        选择
                    </button>
                    <button 
                        onClick={() => {
                            setContextMenuNote(null);
                            if(confirm('确认删除？')) handleDeleteNote(contextMenuNote.id);
                        }}
                        className="w-full py-3.5 text-[16px] font-medium text-red-500 active:bg-slate-100 dark:active:bg-white/10"
                    >
                        删除
                    </button>
                </div>
                <button 
                    onClick={() => setContextMenuNote(null)}
                    className="mt-3 w-full py-3.5 bg-white dark:bg-[#2C2C2E] rounded-[14px] text-[16px] font-semibold text-blue-600 dark:text-blue-400 shadow-lg active:scale-[0.98] transition-transform"
                >
                    取消
                </button>
            </div>
        </>
      )}

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
