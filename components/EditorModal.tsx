
import React, { useState, useEffect, useRef } from 'react';
import { Note, CapsuleColor, Category } from '../types';
import { Trash2, Folder, Calendar, ChevronDown, Check, X } from 'lucide-react';

interface EditorModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
  onDelete: (id: string) => void;
  categories: Category[];
}

const COLORS: CapsuleColor[] = ['blue', 'purple', 'green', 'rose', 'amber', 'slate'];

export const EditorModal: React.FC<EditorModalProps> = ({ note, isOpen, onClose, onSave, onDelete, categories }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<CapsuleColor>('blue');
  const [categoryId, setCategoryId] = useState<string>('');
  
  const [isClosing, setIsClosing] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  // 初始化与返回键处理 (History API)
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      
      // Push history state so back button closes modal
      window.history.pushState({ modal: 'editor' }, '', window.location.href);

      const handlePopState = () => {
        handleClose(false); // Close without going back again
      };

      window.addEventListener('popstate', handlePopState);

      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setSelectedColor(note.color);
        setCategoryId(note.categoryId || '');
      } else {
        setTitle('');
        setContent('');
        setSelectedColor('blue');
        setCategoryId('');
        // Focus on Content for new notes
        setTimeout(() => {
            contentRef.current?.focus();
        }, 400); // 稍微延迟等待动画开始
      }
      document.body.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('popstate', handlePopState);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, note]);

  // 点击外部关闭分类下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    if (isCategoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryOpen]);

  const handleClose = (shouldGoBack: boolean = true) => {
    setIsClosing(true);
    if (shouldGoBack) {
        // Remove the history state we pushed
        try {
            window.history.back(); 
        } catch (e) {
            // ignore
        }
    }
    setTimeout(() => {
        onClose();
        setIsClosing(false);
        setIsCategoryOpen(false);
    }, 300);
  };

  const handleSave = () => {
    if (!content.trim() && !title.trim()) {
      handleClose();
      return;
    }
    const newNote: Note = {
      id: note ? note.id : crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      color: selectedColor,
      categoryId: categoryId || undefined,
      createdAt: note ? note.createdAt : Date.now(),
      updatedAt: Date.now(),
    };
    onSave(newNote);
    handleClose();
  };

  const getBgColor = (c: CapsuleColor) => {
    switch (c) {
      case 'blue': return 'bg-blue-500 shadow-blue-500/30';
      case 'purple': return 'bg-purple-500 shadow-purple-500/30';
      case 'green': return 'bg-emerald-500 shadow-emerald-500/30';
      case 'rose': return 'bg-rose-500 shadow-rose-500/30';
      case 'amber': return 'bg-amber-500 shadow-amber-500/30';
      case 'slate': return 'bg-slate-500 shadow-slate-500/30';
      default: return 'bg-slate-500';
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center ${isClosing ? 'pointer-events-none' : ''}`}>
      {/* Backdrop */}
      <div 
        className={`
            absolute inset-0 bg-black/20 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-300
            ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={() => handleClose()}
      />
      
      {/* Panel */}
      <div 
        className={`
            relative w-full sm:w-[600px] h-[80vh]
            bg-[#FAFAFA] dark:bg-[#121212] 
            rounded-t-[28px] sm:rounded-[28px]
            shadow-[0_-10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
            flex flex-col overflow-hidden
            transform transition-transform duration-300 cubic-bezier(0.2, 0.9, 0.3, 1)
            ${isOpen && !isClosing ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-10 sm:scale-95 sm:opacity-0'}
        `}
      >
        {/* Drag Handle Indicator */}
        <div className="absolute top-0 left-0 right-0 h-6 flex justify-center pt-2.5 z-20 pointer-events-none">
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 opacity-50"></div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-4 min-h-[60px] bg-transparent z-10">
           <button 
              onClick={() => handleClose()}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-500"
            >
              <X size={22} />
          </button>

          <div className="flex items-center gap-2 pt-1">
             <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {note ? 'EDITING' : 'NEW IDEA'}
             </span>
          </div>

          <button 
                onClick={handleSave}
                className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-sm shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
            >
                完成
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
            <div className="max-w-xl mx-auto px-6 pt-2 pb-safe w-full flex-1 flex flex-col">
                
                {/* Title */}
                <input
                    type="text"
                    placeholder="标题"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-900 dark:text-white leading-tight mb-6"
                />
                
                {/* Content */}
                <textarea
                    ref={contentRef}
                    placeholder="捕捉灵感..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full flex-1 resize-none text-[17px] leading-relaxed bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-700 dark:text-slate-300 font-normal mb-8"
                    spellCheck={false}
                />

                {/* --- Bottom Floating Panel for Properties --- */}
                <div className="space-y-4 pb-8 sticky bottom-0 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA] to-transparent dark:from-[#121212] dark:via-[#121212] pt-10">
                    
                    {/* Color Picker - Horizontal Scroll */}
                    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2 px-1">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setSelectedColor(c)}
                                className={`
                                    w-9 h-9 rounded-full transition-all flex items-center justify-center shadow-sm flex-shrink-0
                                    ${getBgColor(c)} 
                                    ${selectedColor === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-[#FAFAFA] dark:ring-offset-[#121212] ring-slate-300 dark:ring-slate-600' : 'opacity-40 scale-90'}
                                `}
                            >
                                {selectedColor === c && <Check size={14} className="text-white drop-shadow-md" strokeWidth={3} />}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Custom Category Dropdown */}
                        <div className="relative flex-1" ref={categoryRef}>
                            <button 
                                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-[#1E1E20] rounded-xl shadow-sm border border-slate-100 dark:border-white/5 active:scale-[0.99] transition-all"
                            >
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-white/10 flex items-center justify-center">
                                        <Folder size={14} />
                                    </div>
                                    <span className="font-medium text-[14px]">
                                        {categories.find(c => c.id === categoryId)?.name || "未分类"}
                                    </span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isCategoryOpen && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden z-20 animate-dropdown origin-bottom p-1.5">
                                    <button 
                                        onClick={() => { setCategoryId(''); setIsCategoryOpen(false); }}
                                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${categoryId === '' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                    >
                                        <span>未分类</span>
                                        {categoryId === '' && <Check size={14} />}
                                    </button>
                                    {categories.map(cat => (
                                        <button 
                                            key={cat.id}
                                            onClick={() => { setCategoryId(cat.id); setIsCategoryOpen(false); }}
                                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${categoryId === cat.id ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                        >
                                            <span>{cat.name}</span>
                                            {categoryId === cat.id && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Date Display */}
                        <div className="flex-shrink-0 p-3.5 bg-white dark:bg-[#1E1E20] rounded-xl shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-2 text-slate-400">
                             <Calendar size={16} />
                             <span className="text-xs font-bold uppercase tracking-wider">
                                {new Date().getDate()}
                             </span>
                        </div>
                    </div>
                    
                    {note && (
                        <button 
                            onClick={() => { onDelete(note.id); handleClose(); }}
                            className="w-full mt-2 py-3.5 flex items-center justify-center gap-2 text-red-500 bg-white dark:bg-[#1E1E20] border border-transparent hover:border-red-100 dark:hover:border-red-900/30 rounded-xl transition-all font-medium text-sm active:scale-[0.98]"
                        >
                            <Trash2 size={16} /> 删除此胶囊
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
