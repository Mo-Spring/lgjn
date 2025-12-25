import React, { useState, useEffect, useRef } from 'react';
import { Note, CapsuleColor, Category } from '../types';
import { Trash2, Folder, Calendar, ChevronDown, Check } from 'lucide-react';

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
  
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
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
        setTimeout(() => {
            if (window.innerWidth > 768) contentRef.current?.focus();
        }, 300);
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, note]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
        onClose();
        setIsClosing(false);
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
      case 'blue': return 'bg-blue-500';
      case 'purple': return 'bg-purple-500';
      case 'green': return 'bg-emerald-500';
      case 'rose': return 'bg-rose-500';
      case 'amber': return 'bg-amber-500';
      case 'slate': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center ${isClosing ? 'pointer-events-none' : ''}`}>
      {/* Backdrop */}
      <div 
        className={`
            absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300
            ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleSave}
      />
      
      {/* Panel */}
      <div 
        className={`
            relative w-full sm:w-[600px] h-[95vh] sm:h-[80vh]
            bg-[#F2F2F7] dark:bg-[#1C1C1E] 
            rounded-t-[20px] sm:rounded-[20px]
            shadow-2xl
            flex flex-col overflow-hidden
            transform transition-transform duration-300 cubic-bezier(0.2, 0.9, 0.3, 1)
            ${isOpen && !isClosing ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-10 sm:scale-95 sm:opacity-0'}
        `}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#2C2C2E] border-b border-slate-200 dark:border-black/50 z-10">
           <button 
              onClick={handleClose}
              className="text-blue-500 dark:text-blue-400 font-medium text-[16px] px-2"
            >
              取消
          </button>

          <span className="text-[16px] font-semibold text-slate-900 dark:text-white">
            {note ? '编辑灵感' : '新灵感'}
          </span>

          <button 
                onClick={handleSave}
                className="text-blue-500 dark:text-blue-400 font-bold text-[16px] px-2"
            >
                完成
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-white dark:bg-[#1C1C1E]">
            <div className="max-w-xl mx-auto p-5 pb-32 space-y-6">
                
                {/* Title */}
                <input
                    type="text"
                    placeholder="标题"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-900 dark:text-white"
                />
                
                {/* Content */}
                <textarea
                    ref={contentRef}
                    placeholder="写下你的想法..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[300px] resize-none text-[17px] leading-relaxed bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-200"
                    spellCheck={false}
                />

                {/* Properties */}
                <div className="pt-6 space-y-4">
                    {/* Category */}
                    <div className="flex items-center justify-between p-3 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Folder size={18} />
                            <span className="text-sm">分类</span>
                        </div>
                        <div className="relative">
                            <select 
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="appearance-none bg-transparent border-none outline-none text-slate-900 dark:text-slate-200 text-sm font-medium pr-6 text-right w-full"
                            >
                                <option value="">未分类</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div className="p-3 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl flex items-center justify-between">
                         <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">颜色标签</span>
                         <div className="flex items-center gap-3">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setSelectedColor(c)}
                                    className={`
                                        w-6 h-6 rounded-full transition-all flex items-center justify-center
                                        ${getBgColor(c)} 
                                        ${selectedColor === c ? 'ring-2 ring-offset-2 ring-offset-[#F2F2F7] dark:ring-offset-[#2C2C2E] ring-slate-400' : 'opacity-70'}
                                    `}
                                >
                                    {selectedColor === c && <Check size={12} className="text-white" strokeWidth={3} />}
                                </button>
                            ))}
                         </div>
                    </div>

                    <div className="flex items-center justify-center pt-4">
                        <span className="text-xs text-slate-400 dark:text-slate-600">
                            {note ? `上次编辑于 ${new Date(note.updatedAt).toLocaleString('zh-CN')}` : ' '}
                        </span>
                    </div>

                    {note && (
                        <button 
                            onClick={() => { onDelete(note.id); onClose(); }}
                            className="w-full py-3 text-red-500 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl text-sm font-medium active:scale-95 transition-transform"
                        >
                            删除此胶囊
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
