
import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Search, BrainCircuit, Moon, Sun, Settings, FolderPlus, Folder, LayoutGrid, List, Plus, Trash2, X, Archive, Filter } from 'lucide-react';
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

  const handleDeleteCategory = async (catId: string) => {
      if (confirm("删除分类不会删除其中的笔记，确定吗？")) {
          setCategories(prev => prev.filter(c => c.id !== catId));
          if (selectedCategoryId === catId) setSelectedCategoryId('all');
          await storage.deleteCategory(catId);
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
        
        let importedNotes: Note[] = [];
        let importedCategories: Category[] = [];

        if (Array.isArray(importedData)) {
            importedNotes = importedData;
        } else if (importedData.notes && Array.isArray(importedData.notes)) {
            importedNotes = importedData.notes;
            importedCategories = importedData.categories || [];
        } else {
             alert('文件格式不正确。');
             return;
        }
        
        if (confirm(`导入 ${importedNotes.length} 条笔记和 ${importedCategories.length} 个分类？`)) {
            await storage.importData(importedNotes, importedCategories);
            const [updatedNotes, updatedCategories] = await Promise.all([
                storage.getAllNotes(),
                storage.getAllCategories()
            ]);
            setNotes(updatedNotes);
            setCategories(updatedCategories);
            setIsSettingsOpen(false);
            alert('数据恢复成功！');
        }
      } catch (err: any) {
        console.error('Import error:', err);
        alert('无法读取文件。');
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-500/20">
      
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/10 dark:bg-blue-600/5 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-400/10 dark:bg-purple-600/5 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 transition-all">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
                    <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all group-hover:scale-105">
                        <BrainCircuit size={20} />
                    </div>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hidden md:block">
                    灵感<span className="opacity-50 font-light">胶囊</span>
                </h1>
            </div>

            {/* Central Categories - Desktop */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-full border border-slate-200 dark:border-slate-800">
                <button 
                    onClick={() => setSelectedCategoryId('all')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategoryId === 'all' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    全部
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategoryId === cat.id ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        {cat.name}
                    </button>
                ))}
                <button onClick={handleAddCategory} className="p-1.5 rounded-full hover:bg-white/50 text-slate-400 hover:text-indigo-600 transition-colors">
                    <Plus size={16} />
                </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                 {/* Mobile Search Toggle */}
                 <button 
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className={`md:hidden p-2 rounded-full transition-colors ${isSearchOpen ? 'bg-slate-200 dark:bg-slate-800 text-indigo-600' : 'text-slate-500'}`}
                 >
                    <Search size={20} />
                 </button>

                 {/* Desktop Search */}
                 <div className="hidden md:flex items-center bg-white/50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 w-48 focus-within:w-64 focus-within:ring-2 ring-indigo-500/20 transition-all">
                    <Search size={16} className="text-slate-400 mr-2" />
                    <input 
                      type="text" 
                      placeholder="搜索..." 
                      className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>

                 <button 
                    onClick={toggleSelectionMode}
                    className={`p-2 rounded-full transition-colors ${isSelectionMode ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                 >
                    <Archive size={20} />
                 </button>

                 <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-full p-1 border border-slate-200 dark:border-slate-800">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-full transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}
                    >
                        <List size={16} />
                    </button>
                 </div>

                 <button onClick={toggleTheme} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                 </button>
            </div>
        </div>

        {/* Mobile Search Expanded */}
        {isSearchOpen && (
            <div className="md:hidden px-4 pb-3 animate-enter">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl">
                    <Search size={18} className="text-slate-400 mr-2" />
                    <input 
                        type="text" 
                        placeholder="搜索想法..." 
                        className="bg-transparent border-none outline-none text-base w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>
        )}

        {/* Mobile Category Scroll */}
        <div className="md:hidden border-t border-slate-200/50 dark:border-slate-800/50">
             <div className="px-4 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setSelectedCategoryId('all')}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${selectedCategoryId === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                >
                    全部
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${selectedCategoryId === cat.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                        {cat.name}
                    </button>
                ))}
                <button onClick={handleAddCategory} className="p-1.5 text-slate-400 border border-dashed border-slate-300 rounded-full flex-shrink-0">
                    <Plus size={16} />
                </button>
             </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-32">
        {loading ? (
             <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
             </div>
        ) : (
             <>
                {notes.length === 0 && !searchQuery ? (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                    <div className="w-24 h-24 bg-gradient-to-tr from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mb-6 animate-bounce duration-[3000ms]">
                        <BrainCircuit size={48} className="text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">捕捉每一个灵感瞬间</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                      不论是稍纵即逝的想法，还是深思熟虑的计划，这里都是它们最好的归宿。
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={
                        viewMode === 'grid' 
                            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-max" 
                            : "flex flex-col gap-3 max-w-3xl mx-auto"
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
                    
                    <div className="h-20"></div> {/* Spacer */}
                  </>
                )}
             </>
        )}
      </main>

      {/* Floating Action Button (FAB) or Selection Bar */}
      <div className="fixed bottom-8 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
         <div className="pointer-events-auto">
             {isSelectionMode ? (
                 <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 pr-6 rounded-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-enter">
                    <button 
                        onClick={() => setIsSelectionMode(false)}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <span className="text-sm font-medium text-slate-500 whitespace-nowrap">已选 {selectedNoteIds.size} 项</span>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button 
                        onClick={handleBatchDelete}
                        disabled={selectedNoteIds.size === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${selectedNoteIds.size > 0 ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-slate-200 text-slate-400'}`}
                    >
                        <Trash2 size={16} /> 删除
                    </button>
                 </div>
             ) : (
                <button 
                    onClick={handleCreateNew}
                    className="group relative flex items-center justify-center w-16 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-2xl shadow-slate-900/30 dark:shadow-white/20 hover:scale-110 active:scale-95 transition-all duration-300"
                >
                    <Plus size={32} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
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
