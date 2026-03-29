import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Note, CapsuleColor, Category } from '../types';
import { Trash2, Folder, ChevronDown, Check, X, Tag, Save } from 'lucide-react';
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

const COLOR_MAP: Record<CapsuleColor, { bg: string; ring: string; dot: string; glow: string }> = {
  blue:   { bg: 'from-blue-500/20 to-blue-600/10', ring: 'ring-blue-500',   dot: 'bg-blue-500',   glow: 'shadow-blue-500/30' },
  purple: { bg: 'from-purple-500/20 to-purple-600/10', ring: 'ring-purple-500', dot: 'bg-purple-500', glow: 'shadow-purple-500/30' },
  green:  { bg: 'from-emerald-500/20 to-emerald-600/10', ring: 'ring-emerald-500', dot: 'bg-emerald-500', glow: 'shadow-emerald-500/30' },
  rose:   { bg: 'from-rose-500/20 to-rose-600/10', ring: 'ring-rose-500',   dot: 'bg-rose-500',   glow: 'shadow-rose-500/30' },
  amber:  { bg: 'from-amber-500/20 to-amber-600/10', ring: 'ring-amber-500',  dot: 'bg-amber-500',  glow: 'shadow-amber-500/30' },
  slate:  { bg: 'from-slate-400/20 to-slate-500/10', ring: 'ring-slate-500',  dot: 'bg-slate-500',  glow: 'shadow-slate-500/30' },
};

export const EditorModal: React.FC<EditorModalProps> = ({ note, isOpen, onClose, onSave, onDelete, categories }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<CapsuleColor>('blue');
  const [categoryId, setCategoryId] = useState<string>('');

  const [isVisible, setIsVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const historyPushedRef = useRef(false);
  const noteIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const hasUnsavedChanges = useRef(false);

  // ─── Build current note object ───
  const buildNote = useCallback((): Note => {
    return {
      id: noteIdRef.current!,
      title: title.trim(),
      content: content.trim(),
      color: selectedColor,
      categoryId: categoryId || undefined,
      createdAt: note ? note.createdAt : Date.now(),
      updatedAt: Date.now(),
    };
  }, [title, content, selectedColor, categoryId, note]);

  // ─── Auto-save (debounced 800ms) ───
  const triggerAutoSave = useCallback(() => {
    if (!noteIdRef.current) return;
    if (!title.trim() && !content.trim()) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus('saving');
      const n = buildNote();
      onSave(n);
      setTimeout(() => setSaveStatus('saved'), 200);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  }, [title, content, selectedColor, categoryId, onSave, buildNote]);

  useEffect(() => {
    if (isOpen) {
      hasUnsavedChanges.current = true;
      triggerAutoSave();
    }
  }, [title, content, selectedColor, categoryId]);

  // ─── beforeunload warning ───
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isOpen && hasUnsavedChanges.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isOpen]);

  // ─── Init data ───
  useEffect(() => {
    if (isOpen && note) {
      setTitle(note.title);
      setContent(note.content);
      setSelectedColor(note.color);
      setCategoryId(note.categoryId || '');
      noteIdRef.current = note.id;
      hasUnsavedChanges.current = false;
    } else if (isOpen && !note) {
      setTitle('');
      setContent('');
      setSelectedColor('blue');
      setCategoryId('');
      noteIdRef.current = crypto.randomUUID();
      hasUnsavedChanges.current = false;
      setTimeout(() => contentRef.current?.focus(), 400);
    }
  }, [isOpen, note]);

  // ─── Lifecycle & animation ───
  useEffect(() => {
    let backButtonListener: any;
    let timer: any;

    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
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
      setSaveStatus('idle');
      clearTimeout(saveTimerRef.current);
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
    // Final save on close
    if (noteIdRef.current && (title.trim() || content.trim())) {
      onSave(buildNote());
    }
    if (shouldGoBack && historyPushedRef.current) {
      try {
        window.history.back();
        historyPushedRef.current = false;
      } catch { /* ignore */ }
    }
    onClose();
  };

  // Click outside to close category
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    if (isCategoryOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCategoryOpen]);

  const handleDelete = () => {
    if (note) onDelete(note.id);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className={`
          absolute inset-0 transition-opacity duration-500 ease-out
          bg-black/30 dark:bg-black/80 backdrop-blur-xl
          ${animate ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={() => triggerClose()}
      />

      {/* Panel */}
      <div
        className={`
          relative w-full sm:w-[600px] h-[92vh] sm:h-[85vh]
          bg-white dark:bg-[#0A0A0A]
          rounded-t-[28px] sm:rounded-[28px]
          shadow-[0_-20px_80px_rgba(0,0,0,0.2)] dark:shadow-[0_-20px_80px_rgba(0,0,0,0.8)]
          flex flex-col overflow-hidden
          ring-1 ring-black/10 dark:ring-white/[0.06]
          transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
          ${animate ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-[100%] scale-95 opacity-80'}
        `}
      >
        {/* Drag Handle */}
        <div className="absolute top-0 left-0 right-0 h-6 flex justify-center pt-2.5 z-40 pointer-events-none">
          <div className="w-10 h-[5px] rounded-full bg-black/10 dark:bg-white/10"></div>
        </div>

        {/* Header */}
        <div className="flex-none relative z-30">
          {/* Nav Row */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            {/* Left: delete or close */}
            {note ? (
              <button
                onClick={handleDelete}
                className="w-10 h-10 rounded-2xl flex items-center justify-center
                  bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400
                  hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-90 transition-all"
                title="删除"
              >
                <Trash2 size={18} strokeWidth={2} />
              </button>
            ) : (
              <button
                onClick={() => triggerClose()}
                className="w-10 h-10 rounded-2xl flex items-center justify-center
                  bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300
                  hover:bg-black/10 dark:hover:bg-white/15 active:scale-90 transition-all"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            )}

            {/* Center: save status */}
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-slate-900 dark:text-white">
                {note ? '编辑灵感' : '新灵感'}
              </span>
              {saveStatus !== 'idle' && (
                <div className={`flex items-center gap-1 text-[11px] font-medium transition-all duration-300 ${
                  saveStatus === 'saving' ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    saveStatus === 'saving' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                  }`} />
                  {saveStatus === 'saving' ? '保存中' : '已保存'}
                </div>
              )}
            </div>

            {/* Right: done */}
            <button
              onClick={() => triggerClose()}
              className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-black
                rounded-full font-bold text-[13px]
                shadow-lg shadow-slate-900/20 dark:shadow-white/10
                hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              完成
            </button>
          </div>

          {/* Tools Row: Category + Color */}
          <div className="flex items-center justify-between px-5 pb-4 gap-3">
            {/* Category Picker */}
            <div className="relative flex-shrink-0" ref={categoryRef}>
              <button
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-2xl text-[13px] font-medium transition-all
                  ${categoryId
                    ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                    : 'bg-black/[0.04] dark:bg-white/[0.06] text-slate-400 hover:bg-black/[0.07] dark:hover:bg-white/[0.08]'}
                `}
              >
                {categoryId ? (
                  <>
                    <Tag size={13} className="opacity-60 flex-shrink-0" />
                    <span className="truncate max-w-[100px]">{categories.find(c => c.id === categoryId)?.name}</span>
                  </>
                ) : (
                  <>
                    <Folder size={14} className="flex-shrink-0 opacity-60" />
                    <span>分类</span>
                  </>
                )}
                <ChevronDown size={12} className={`opacity-40 transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Category Dropdown */}
              {isCategoryOpen && (
                <div className="absolute top-full mt-2 left-0 w-52 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-2xl
                  rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)]
                  border border-black/[0.06] dark:border-white/[0.08] overflow-hidden animate-dropdown z-50">
                  <button
                    onClick={() => { setCategoryId(''); setIsCategoryOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]
                      transition-colors border-b border-black/[0.04] dark:border-white/[0.04]"
                  >
                    无分类
                  </button>
                  <div className="max-h-[200px] overflow-y-auto no-scrollbar">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setCategoryId(cat.id); setIsCategoryOpen(false); }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]
                          flex items-center justify-between
                          ${categoryId === cat.id ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        <span className="truncate">{cat.name}</span>
                        {categoryId === cat.id && <Check size={14} className="text-blue-500" />}
                      </button>
                    ))}
                  </div>
                  {categories.length === 0 && (
                    <div className="px-4 py-4 text-center text-slate-400 text-xs">暂无分类</div>
                  )}
                </div>
              )}
            </div>

            {/* Color Dots */}
            <div className="flex items-center gap-2.5">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`
                    relative w-[18px] h-[18px] rounded-full transition-all duration-300
                    ${COLOR_MAP[c].dot}
                    ${selectedColor === c
                      ? `scale-[1.35] ring-2 ring-offset-[3px] ring-offset-white dark:ring-offset-[#0A0A0A] ${COLOR_MAP[c].ring} shadow-lg ${COLOR_MAP[c].glow}`
                      : 'opacity-30 hover:opacity-60 hover:scale-110'}
                  `}
                />
              ))}
            </div>
          </div>

          {/* Accent gradient bar under header */}
          <div className={`h-[2px] bg-gradient-to-r ${COLOR_MAP[selectedColor].bg} opacity-60 transition-all duration-700`} />
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          <div className={`absolute inset-0 bg-gradient-to-b ${COLOR_MAP[selectedColor].bg} opacity-[0.03] pointer-events-none transition-all duration-700`} />
          <div className="relative max-w-xl mx-auto px-6 py-8 w-full flex flex-col min-h-full">
            {/* Title */}
            <input
              type="text"
              placeholder="输入标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-[28px] font-bold bg-transparent border-none outline-none
                placeholder:text-slate-200 dark:placeholder:text-slate-700
                text-slate-900 dark:text-white leading-tight mb-4
                tracking-tight"
            />

            {/* Content */}
            <textarea
              ref={contentRef}
              placeholder="捕捉你的灵感..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 resize-none text-[16px] leading-[1.8] bg-transparent border-none outline-none
                placeholder:text-slate-200 dark:placeholder:text-slate-700
                text-slate-600 dark:text-slate-300 font-normal pb-24"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
