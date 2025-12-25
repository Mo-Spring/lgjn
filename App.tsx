
import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Search, Plus, X, Archive, Menu, Grid, List, CheckCircle2, Moon, Sun } from 'lucide-react';
import { Note, Category } from './types';
import { CapsuleCard } from './components/CapsuleCard';
import { EditorModal } from './components/EditorModal';
import { SettingsModal } from './components/SettingsModal';
import { storage } from './services/storageService';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

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
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
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

    // 设置状态栏 (非沉浸式，实体背景)
    if (Capacitor.isNativePlatform()) {
        const setStatusBarStyle = async () => {
            try {
                // 关闭 Overlay 模式（内容在状态栏下方，不覆盖）
                await StatusBar.setOverlaysWebView({ overlay: false });
                
                // 设置状态栏背景色 (与 Header 一致)
                // Light: #F2F2F7, Dark: #000000
                const color = theme === 'dark' ? '#000000' : '#F2F2F7';
                await StatusBar.setBackgroundColor({ color: color });
                
                // 根据主题设置文字颜色
                await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
            } catch (e) {
                console.warn("Status bar not supported", e);
            }
        };
        setStatusBarStyle();
    }
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
      
      {/* Header - Sticky but distinct */}
      <header className="sticky top-0 z-40 bg-[#F2F2F7] dark:bg-black border-b border-black/5 dark:border-white/10 transition-colors duration-300">
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
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>

                    <button 
                        onClick={toggleSelectionMode}
                        className={`p-2 rounded-full transition-colors ml-1 ${isSelectionMode ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'}`}
                    >
                        <CheckCircle2 size={20} />
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
                        className="w-full bg-white dark:bg-[#1C1C1E] rounded-xl px-4 py-2.5 text-base outline-none text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            )}

            {/* Categories Scroll */}
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
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-[#1C1C1E] text-slate-400 dark:text-slate-500 flex-shrink-0 shadow-sm"
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
                ) : (
                  <div className={
                        viewMode === 'grid' 
                            ? "grid grid-cols-2 gap-3 auto-rows-max" 
                            : "flex flex-col gap-2"
                    }>
                      {filteredNotes.map((note, index) => (
                        <div key={note.id} className="animate-enter" style={{ animationDelay: `${index * 0.05}s` }}>
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

      {/* Floating Action Button - Glass Effect */}
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

      {/* Action Sheet (Context Menu) - Glass Effect */}
      {contextMenuNote && (
        <>
            <div 
                className="fixed inset-0 z-50 bg-black/20 dark:bg-black/60 backdrop-blur-[2px] transition-opacity" 
                onClick={() => setContextMenuNote(null)}
            />
            <div className="fixed inset-x-4 bottom-8 z-50 animate-slide-up pb-safe">
                <div className="bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-2xl rounded-[20px] overflow-hidden shadow-2xl border border-white/20 dark:border-white/5">
                    <div className="p-4 border-b border-black/5 dark:border-white/5 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate block px-8">
                            {contextMenuNote.title || "UNTITLED"}
                        </span>
                    </div>
                    <button 
                        onClick={() => {
                            setContextMenuNote(null);
                            handleEditNote(contextMenuNote);
                        }}
                        className="w-full py-4 text-[16px] font-medium text-slate-900 dark:text-white active:bg-black/5 dark:active:bg-white/10 border-b border-black/5 dark:border-white/5"
                    >
                        编辑内容
                    </button>
                    <button 
                        onClick={() => {
                            setContextMenuNote(null);
                            setIsSelectionMode(true);
                            handleToggleSelectNote(contextMenuNote.id);
                        }}
                        className="w-full py-4 text-[16px] font-medium text-slate-900 dark:text-white active:bg-black/5 dark:active:bg-white/10 border-b border-black/5 dark:border-white/5"
                    >
                        多选模式
                    </button>
                    <button 
                        onClick={() => {
                            setContextMenuNote(null);
                            if(confirm('确认删除？')) handleDeleteNote(contextMenuNote.id);
                        }}
                        className="w-full py-4 text-[16px] font-medium text-red-500 active:bg-black/5 dark:active:bg-white/10"
                    >
                        删除
                    </button>
                </div>
                <button 
                    onClick={() => setContextMenuNote(null)}
                    className="mt-3 w-full py-4 bg-white/90 dark:bg-[#2C2C2E]/90 backdrop-blur-xl rounded-[20px] text-[16px] font-bold text-slate-900 dark:text-white shadow-xl active:scale-[0.98] transition-transform"
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
