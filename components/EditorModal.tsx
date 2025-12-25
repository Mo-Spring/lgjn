
import React, { useState, useEffect, useRef } from 'react';
import { Note, CapsuleColor, Category } from '../types';
import { Trash2, Folder, Calendar } from 'lucide-react';

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
  const containerRef = useRef<HTMLDivElement>(null);

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
        setSelectedColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
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

  // 这里的颜色仅用于选择器的小圆点，需要对应高级配色
  const getColorClass = (c: CapsuleColor) => {
    switch (c) {
      case 'blue': return 'bg-slate-300 dark:bg-slate-600';
      case 'purple': return 'bg-[#d8d4e0] dark:bg-[#4a4759]';
      case 'green': return 'bg-[#dce3de] dark:bg-[#344239]';
      case 'rose': return 'bg-[#e3dcdc] dark:bg-[#4d3a3a]';
      case 'amber': return 'bg-[#e3ded4] dark:bg-[#4d4533]';
      case 'slate': return 'bg-slate-200 dark:bg-slate-700';
      default: return 'bg-gray-400';
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center ${isClosing ? 'pointer-events-none' : ''}`}>
      {/* Backdrop */}
      <div 
        className={`
            absolute inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-[2px] transition-opacity duration-300
            ${isOpen && !isClosing ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleSave}
      />
      
      {/* Panel */}
      <div 
        ref={containerRef}
        className={`
            relative w-full sm:w-[90vw] sm:max-w-3xl sm:h-[85vh] h-[92vh]
            bg-[#FAFAFA] dark:bg-[#121212] 
            rounded-t-[32px] sm:rounded-3xl
            shadow-2xl shadow-black/10
            flex flex-col overflow-hidden
            transform transition-transform duration-300 cubic-bezier(0.2, 0.9, 0.3, 1)
            ${isOpen && !isClosing ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-10 sm:scale-95 sm:opacity-0'}
        `}
      >
        {/* Drag Handle */}
        <div className="w-full h-5 flex items-center justify-center sm:hidden flex-shrink-0" onClick={handleSave}>
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-2" />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 sm:py-5 flex-shrink-0">
           <button 
              onClick={handleSave}
              className="sm:hidden text-slate-500 font-medium text-[15px]"
            >
              取消
          </button>

          <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-900 rounded-full p-1.5 border border-slate-100 dark:border-slate-800">
             {COLORS.map(c => (
                <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`
                        w-5 h-5 rounded-full transition-all duration-300
                        ${getColorClass(c)} 
                        ${selectedColor === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-slate-400' : 'opacity-60 hover:opacity-100'}
                    `}
                />
             ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
             {note && (
              <button 
                onClick={() => { onDelete(note.id); onClose(); }}
                className="p-2.5 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/10"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button 
                onClick={handleSave}
                className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
            >
                完成
            </button>
          </div>
        </div>

        {/* Mobile Color Picker */}
        <div className="sm:hidden px-6 pb-2 flex items-center justify-center gap-4 overflow-x-auto no-scrollbar py-2">
            {COLORS.map(c => (
                <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`
                        w-6 h-6 rounded-full transition-all duration-300
                        ${getColorClass(c)} 
                        ${selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-[#FAFAFA] dark:ring-offset-[#121212] ring-slate-400' : 'opacity-50'}
                    `}
                />
             ))}
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-2 no-scrollbar">
            <div className="max-w-2xl mx-auto space-y-5 pb-[40vh]">
                
                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
                        <Folder size={12} />
                        <select 
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="bg-transparent border-none outline-none appearance-none cursor-pointer pr-2 text-slate-600 dark:text-slate-300 uppercase tracking-wider"
                        >
                            <option value="">Uncategorized</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-1.5 px-2">
                        <Calendar size={12} />
                        <span className="uppercase tracking-wider">{new Date(note?.updatedAt || Date.now()).toLocaleDateString('en-US', {month: 'short', day:'numeric'})}</span>
                    </div>
                </div>

                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-3xl sm:text-4xl font-bold tracking-tight bg-transparent border-none outline-none placeholder:text-slate-200 dark:placeholder:text-slate-800 text-slate-900 dark:text-white"
                />
                
                <textarea
                    ref={contentRef}
                    placeholder="Capture your thought..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full min-h-[400px] resize-none text-lg leading-relaxed bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-600 dark:text-slate-300 font-normal"
                    spellCheck={false}
                />
            </div>
        </div>
      </div>
    </div>
  );
};
