
import React, { useState, useEffect, useRef } from 'react';
import { Note, CapsuleColor, Category } from '../types';
import { Trash2, Folder, ChevronDown, Check, X, Tag } from 'lucide-react';
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
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });

      document.body.style.overflow = 'hidden';

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
      setAnimate(false);
      setIsCategoryOpen(false);
      timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = '';
      }, 500);
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

  const triggerClose = (shouldGoBack: boolean = true) => {
    if (shouldGoBack && historyPushedRef.current) {
        try {
            window.history.back(); 
            historyPushedRef.current = false;
        } catch (e) { /* ignore */ }
    }
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

  const handleDelete = () => {
      if (note) {
          onDelete(note.id);
      }
  };

  // 颜色对应的环形边框颜色
  const getColorRing = (c: CapsuleColor) => {
      switch (c) {
        case 'blue': return 'ring-blue-500';
        case 'purple': return 'ring-purple-500';
        case 'green': return 'ring-emerald-500';
        case 'rose': return 'ring-rose-500';
        case 'amber': return 'ring-amber-500';
        case 'slate': return 'ring-slate-500';
        default: return 'ring-slate-500';
      }
  };

  // 颜色对应的背景色
  const getColorBg = (c: CapsuleColor) => {
    switch (c) {
      case 'blue': return 'bg-blue-500';
      case 'purple': return 'bg-purple-500';
      case 'green': return 'bg-emerald-500';
      case 'rose': return 'bg-rose-500';
      case 'amber': return 'bg-amber-500';
      case 'slate': return 'bg-slate-500';
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
            relative w-full sm:w-[600px] h-[92vh] sm:h-[85vh]
            bg-[#FAFAFA] dark:bg-[#121212] 
            rounded-t-[32px] sm:rounded-[32px]
            shadow-[0_-10px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_60px_rgba(0,0,0,0.6)]
            flex flex-col overflow-hidden ring-1 ring-black/5 dark:ring-white/10
            transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
            ${animate ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-[100%] scale-95 opacity-80'}
        `}
      >
        {/* Drag Handle */}
        <div className="absolute top-0 left-0 right-0 h-6 flex justify-center pt-2.5 z-40 pointer-events-none">
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700/50"></div>
        </div>

        {/* --- Header & Tools Section (Sticky) --- */}
        <div className="flex-none flex flex-col bg-white/80 dark:bg-[#1E1E20]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 z-30 transition-colors">
            
            {/* Row 1: Navigation & Title */}
            <div className="relative flex items-center justify-between px-4 pt-3 pb-1 h-[56px]">
                {/* Left Action: Trash (if editing) or Close (if new) */}
                {note ? (
                    <button 
                        onClick={handleDelete}
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-slate-400 hover:text-red-500 active:scale-90 relative z-20"
                        title="删除"
                    >
                        <Trash2 size={22} />
                    </button>
                ) : (
                    <button 
                        onClick={() => triggerClose()}
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-transparent hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400 active:scale-90 relative z-20"
                        title="关闭"
                    >
                        <X size={22} />
                    </button>
                )}

                {/* Centered Large Title */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-2">
                    <span className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight">
                        {note ? '编辑中' : '新灵感'}
                    </span>
                </div>

                <button 
                    onClick={handleSave}
                    className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-[14px] shadow-lg shadow-slate-900/10 active:scale-95 transition-all relative z-20"
                >
                    完成
                </button>
            </div>

            {/* Row 2: Tools (Category Left, Color Right) */}
            <div className="flex items-center justify-between px-6 pb-4 pt-2 gap-4">
                
                {/* Left: Category Picker (Expandable) */}
                <div className="relative flex-shrink-0 max-w-[50%]" ref={categoryRef}>
                    <button 
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        className={`
                            flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all w-full
                            ${categoryId 
                                ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' 
                                : 'bg-transparent text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}
                        `}
                    >
                        {categoryId ? (
                            <>
                                <Tag size={14} className="opacity-70 flex-shrink-0" />
                                <span className="truncate">{categories.find(c => c.id === categoryId)?.name}</span>
                            </>
                        ) : (
                            <>
                                <Folder size={16} className="flex-shrink-0" />
                                <span>未分类</span>
                            </>
                        )}
                        <ChevronDown size={12} className={`opacity-50 transition-transform flex-shrink-0 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Category Dropdown */}
                    {isCategoryOpen && (
                        <div className="absolute top-full mt-2 left-0 w-48 bg-white dark:bg-[#2C2C2E] rounded-xl shadow-xl border border-black/5 dark:border-white/10 overflow-hidden animate-dropdown z-50">
                            <button 
                                onClick={() => { setCategoryId(''); setIsCategoryOpen(false); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-50 dark:border-white/5"
                            >
                                无分类
                            </button>
                            <div className="max-h-[200px] overflow-y-auto no-scrollbar">
                                {categories.map(cat => (
                                    <button 
                                        key={cat.id}
                                        onClick={() => { setCategoryId(cat.id); setIsCategoryOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-between ${categoryId === cat.id ? 'text-slate-900 dark:text-white bg-slate-50 dark:bg-white/5 font-medium' : 'text-slate-600 dark:text-slate-300'}`}
                                    >
                                        <span className="truncate">{cat.name}</span>
                                        {categoryId === cat.id && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                            {categories.length === 0 && (
                                <div className="px-4 py-3 text-center text-slate-400 text-xs">暂无分类，请在主页添加</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Color Dots (Right Aligned & Reversed Order) */}
                <div className="flex-1 flex justify-end">
                    <div className="flex items-center gap-3 flex-row-reverse">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setSelectedColor(c)}
                                className={`
                                    w-5 h-5 rounded-full transition-all duration-300
                                    ${getColorBg(c)}
                                    ${selectedColor === c ? `scale-125 ring-2 ring-offset-2 ring-offset-[#FAFAFA] dark:ring-offset-[#1E1E20] ${getColorRing(c)}` : 'opacity-40 hover:opacity-80 hover:scale-110'}
                                `}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* --- Editor Area --- */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
            <div className="max-w-xl mx-auto px-6 py-8 w-full flex-1 flex flex-col">
                
                {/* Title Input */}
                <input
                    type="text"
                    placeholder="标题"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-left text-[28px] font-bold bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-900 dark:text-white leading-tight mb-6"
                />
                
                {/* Content Input */}
                <textarea
                    ref={contentRef}
                    placeholder="捕捉灵感..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full flex-1 resize-none text-left text-[17px] leading-relaxed bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-700 dark:text-slate-300 font-normal pb-20"
                    spellCheck={false}
                />
            </div>
        </div>
      </div>
    </div>
  );
};
