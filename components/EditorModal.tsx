
import React, { useState, useEffect, useRef } from 'react';
import { Note, CapsuleColor, Category } from '../types';
import { Trash2, Folder, Calendar, ChevronDown, Check, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

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
  
  // 动画控制状态
  const [isVisible, setIsVisible] = useState(false); // 控制组件是否渲染
  const [animate, setAnimate] = useState(false);     // 控制 CSS Transform
  
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const historyPushedRef = useRef(false);

  // 初始化数据
  useEffect(() => {
    if (isOpen && note) {
        setTitle(note.title);
        setContent(note.content);
        setSelectedColor(note.color);
        setCategoryId(note.categoryId || '');
    } else if (isOpen && !note) {
        setTitle('');
        setContent('');
        setSelectedColor('blue');
        setCategoryId('');
        setTimeout(() => {
            contentRef.current?.focus();
        }, 400);
    }
  }, [isOpen, note]);

  // 生命周期与动画控制
  useEffect(() => {
    let backButtonListener: any;
    let timer: any;

    if (isOpen) {
      setIsVisible(true);
      // 双重 RAF 确保 DOM 挂载后才应用动画类，触发 Transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });

      document.body.style.overflow = 'hidden';

      // Setup Listeners
      const setupListener = async () => {
          if (Capacitor.isNativePlatform()) {
              backButtonListener = await CapacitorApp.addListener('backButton', () => {
                  triggerClose(); 
              });
          } else {
              window.history.pushState({ modal: 'editor' }, '', window.location.href);
              historyPushedRef.current = true;
              window.addEventListener('popstate', handlePopState);
          }
      };
      setupListener();

    } else {
      // 关闭流程：先反转动画，再移除组件
      setAnimate(false);
      setIsCategoryOpen(false);
      timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = '';
      }, 500); // 匹配 CSS duration
    }

    return () => {
      if (backButtonListener) backButtonListener.remove();
      window.removeEventListener('popstate', handlePopState);
      clearTimeout(timer);
    };
  }, [isOpen]);

  const handlePopState = () => {
    historyPushedRef.current = false;
    triggerClose(false);
  };

  // 统一关闭入口
  const triggerClose = (shouldGoBack: boolean = true) => {
    // 处理浏览器历史记录
    if (shouldGoBack && historyPushedRef.current) {
        try {
            window.history.back(); 
            historyPushedRef.current = false;
        } catch (e) { /* ignore */ }
    }
    // 通知父组件修改 isOpen，触发 useEffect 的关闭动画流程
    onClose();
  };

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

  const handleSave = () => {
    if (!content.trim() && !title.trim()) {
      triggerClose();
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
    triggerClose();
  };

  const getBgColor = (c: CapsuleColor) => {
    switch (c) {
      case 'blue': return 'bg-blue-500 shadow-blue-500/40 ring-blue-500/20';
      case 'purple': return 'bg-purple-500 shadow-purple-500/40 ring-purple-500/20';
      case 'green': return 'bg-emerald-500 shadow-emerald-500/40 ring-emerald-500/20';
      case 'rose': return 'bg-rose-500 shadow-rose-500/40 ring-rose-500/20';
      case 'amber': return 'bg-amber-500 shadow-amber-500/40 ring-amber-500/20';
      case 'slate': return 'bg-slate-500 shadow-slate-500/40 ring-slate-500/20';
      default: return 'bg-slate-500';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center`}>
      {/* Backdrop */}
      <div 
        className={`
            absolute inset-0 bg-black/20 dark:bg-black/70 backdrop-blur-md transition-opacity duration-500 ease-out
            ${animate ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={() => triggerClose()}
      />
      
      {/* Panel */}
      <div 
        className={`
            relative w-full sm:w-[600px] h-[80vh]
            bg-[#FAFAFA] dark:bg-[#121212] 
            rounded-t-[32px] sm:rounded-[32px]
            shadow-[0_-10px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_60px_rgba(0,0,0,0.6)]
            flex flex-col overflow-hidden ring-1 ring-black/5 dark:ring-white/10
            transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
            ${animate ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-[100%] scale-95 opacity-80'}
        `}
      >
        {/* Drag Handle Indicator */}
        <div className="absolute top-0 left-0 right-0 h-7 flex justify-center pt-3 z-20 pointer-events-none">
            <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700/50"></div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 min-h-[64px] bg-transparent z-10">
           <button 
              onClick={() => triggerClose()}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-500 active:scale-90"
            >
              <X size={24} />
          </button>

          <div className="flex items-center gap-2 pt-1">
             <span className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                {note ? '编辑中' : '新灵感'}
             </span>
          </div>

          <button 
                onClick={handleSave}
                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-[15px] shadow-xl shadow-slate-900/10 active:scale-95 transition-all"
            >
                完成
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
            <div className="max-w-xl mx-auto px-6 pt-4 pb-safe w-full flex-1 flex flex-col">
                
                {/* Title */}
                <input
                    type="text"
                    placeholder="标题"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-[32px] font-bold bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-900 dark:text-white leading-tight mb-6"
                />
                
                {/* Content */}
                <textarea
                    ref={contentRef}
                    placeholder="捕捉灵感..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full flex-1 resize-none text-[18px] leading-relaxed bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-700 dark:text-slate-300 font-normal mb-8"
                    spellCheck={false}
                />

                {/* --- Bottom Floating Panel for Properties --- */}
                <div className="space-y-4 pb-8 sticky bottom-0 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA] to-transparent dark:from-[#121212] dark:via-[#121212] pt-12">
                    
                    {/* Color Picker - Horizontal Scroll */}
                    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-3 px-1">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setSelectedColor(c)}
                                className={`
                                    w-10 h-10 rounded-full transition-all flex items-center justify-center flex-shrink-0
                                    ${getBgColor(c)} 
                                    ${selectedColor === c ? 'scale-110 ring-4 ring-offset-2 ring-offset-[#FAFAFA] dark:ring-offset-[#121212]' : 'opacity-60 hover:opacity-100 scale-90'}
                                `}
                            >
                                {selectedColor === c && <Check size={16} className="text-white drop-shadow-md" strokeWidth={3} />}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Custom Category Dropdown */}
                        <div className="relative flex-1" ref={categoryRef}>
                            <button 
                                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#1E1E20] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 active:scale-[0.99] transition-all hover:border-slate-200 dark:hover:border-white/10"
                            >
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/10 flex items-center justify-center text-slate-400 dark:text-slate-300">
                                        <Folder size={16} strokeWidth={2.5} />
                                    </div>
                                    <span className="font-semibold text-[15px]">
                                        {categories.find(c => c.id === categoryId)?.name || "未分类"}
                                    </span>
                                </div>
                                <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isCategoryOpen && (
                                <div className="absolute bottom-full left-0 right-0 mb-3 bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-white/5 overflow-hidden z-20 animate-dropdown origin-bottom p-2">
                                    <button 
                                        onClick={() => { setCategoryId(''); setIsCategoryOpen(false); }}
                                        className={`w-full text-left px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors flex items-center justify-between ${categoryId === '' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                    >
                                        <span>未分类</span>
                                        {categoryId === '' && <Check size={16} />}
                                    </button>
                                    {categories.map(cat => (
                                        <button 
                                            key={cat.id}
                                            onClick={() => { setCategoryId(cat.id); setIsCategoryOpen(false); }}
                                            className={`w-full text-left px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors flex items-center justify-between ${categoryId === cat.id ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                        >
                                            <span>{cat.name}</span>
                                            {categoryId === cat.id && <Check size={16} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Date Display */}
                        <div className="flex-shrink-0 p-4 bg-white dark:bg-[#1E1E20] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-2 text-slate-400">
                             <Calendar size={18} />
                             <span className="text-sm font-bold uppercase tracking-wider">
                                {new Date().getDate()}日
                             </span>
                        </div>
                    </div>
                    
                    {note && (
                        <button 
                            onClick={() => { onDelete(note.id); }}
                            className="w-full mt-2 py-4 flex items-center justify-center gap-2 text-red-500 bg-white dark:bg-[#1E1E20] border border-transparent hover:border-red-100 dark:hover:border-red-900/30 rounded-2xl transition-all font-semibold text-[15px] active:scale-[0.98] shadow-sm"
                        >
                            <Trash2 size={18} /> 删除此胶囊
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
