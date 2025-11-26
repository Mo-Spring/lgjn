import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Search, BrainCircuit, Moon, Sun, Settings, FolderPlus, Folder, LayoutGrid, List, PenLine } from 'lucide-react';
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
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleCreateNew = () => {
    setCurrentEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
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
    } catch (error) {
      console.error("Failed to save note to DB:", error);
      alert("保存失败，请检查手机存储空间。");
    }
  };

  const handleDeleteNote = async (id: string) => {
    // 增加震动反馈
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
    }
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
        await storage.deleteNote(id);
    } catch (error) {
        console.error("Failed to delete note from DB:", error);
    }
  };

  const handleAddCategory = async () => {
    const name = prompt("请输入新分类名称：");
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
      if (confirm("删除分类不会删除其中的笔记，确定要删除吗？")) {
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
        
        if (confirm(`准备导入 ${importedNotes.length} 条笔记和 ${importedCategories.length} 个分类。确定要继续吗？`)) {
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
      } catch (err) {
        console.error('Import error:', err);
        alert('无法读取文件，请确保是一个有效的 JSON 备份文件。');
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 flex flex-col font-sans">
      <header className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 dark:bg-indigo-500 text-white p-1.5 rounded-lg">
               <BrainCircuit size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              灵感<span className="text-slate-500 dark:text-slate-400 font-light">胶囊</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="hidden md:flex items-center bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm w-56">
                <Search size={16} className="text-slate-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="搜索..." 
                  className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 dark:text-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>

             <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-full p-1 border border-slate-200 dark:border-slate-800">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
                    title="网格视图"
                >
                    <LayoutGrid size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-full transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
                    title="列表视图"
                >
                    <List size={18} />
                </button>
             </div>

             <button 
                onClick={toggleTheme}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                <Settings size={20} />
            </button>
          </div>
        </div>
        
        {/* 移动端搜索框 */}
        <div className="md:hidden px-4 pb-2">
            <div className="flex items-center bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <Search size={18} className="text-slate-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="搜索想法..." 
                  className="bg-transparent border-none outline-none text-sm w-full dark:text-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
        </div>

        {/* 分类栏 - 移入Header内部彻底消除缝隙 */}
        <div className="border-t border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setSelectedCategoryId('all')}
                    className={`whitespace-nowrap px-3 py-1 rounded-lg text-sm font-medium transition-all ${selectedCategoryId === 'all' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md scale-105' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    全部
                </button>
                <button 
                    onClick={() => setSelectedCategoryId('uncategorized')}
                    className={`whitespace-nowrap px-3 py-1 rounded-lg text-sm font-medium transition-all ${selectedCategoryId === 'uncategorized' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md scale-105' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    无分类
                </button>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 flex-shrink-0"></div>
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        onDoubleClick={() => handleDeleteCategory(cat.id)}
                        className={`whitespace-nowrap px-3 py-1 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${selectedCategoryId === cat.id ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md scale-105' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        <Folder size={14} />
                        {cat.name}
                    </button>
                ))}
                <button 
                    onClick={handleAddCategory}
                    className="whitespace-nowrap px-2.5 py-1 rounded-lg text-sm font-medium text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-1"
                >
                    <FolderPlus size={16} />
                </button>
            </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 w-full">
        {loading ? (
             <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
             </div>
        ) : (
             <>
                {notes.length === 0 && !searchQuery ? (
                  <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4 mt-10">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm mb-6 transition-colors">
                        <BrainCircuit size={48} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">暂无胶囊</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-8 text-sm">
                      点击下方的按钮，捕捉你的第一个灵感瞬间。
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={
                        viewMode === 'grid' 
                            ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max" 
                            : "flex flex-col gap-2.5"
                    }>
                      {filteredNotes.map(note => (
                        <CapsuleCard 
                          key={note.id} 
                          note={note} 
                          onClick={handleEditNote}
                          onDelete={handleDeleteNote}
                          viewMode={viewMode}
                        />
                      ))}
                    </div>

                    {filteredNotes.length === 0 && (
                        <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-sm">
                            {searchQuery ? <p>未找到匹配 “{searchQuery}” 的胶囊</p> : <p>该分类下暂无笔记</p>}
                        </div>
                    )}
                  </>
                )}
             </>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 z-40 pointer-events-none pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto pointer-events-auto">
            <button 
                onClick={handleCreateNew}
                className="w-full bg-slate-900 dark:bg-indigo-600 text-white h-12 rounded-full shadow-xl shadow-slate-300/50 dark:shadow-black/50 flex items-center justify-center gap-2 text-base font-medium hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
                <PenLine size={18} />
                记录灵感
            </button>
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
