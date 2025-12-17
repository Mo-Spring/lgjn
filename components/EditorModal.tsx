import React, { useState, useEffect, useRef } from 'react';
import { Note, CapsuleColor, Category } from '../types';
import { X, Trash2, Folder, Check, BrainCircuit } from 'lucide-react';
import { generateNoteEnhancement } from '../services/geminiService';

interface EditorModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
  onDelete: (id: string) => void;
  categories: Category[];
}

const COLORS: CapsuleColor[] = ['slate', 'rose', 'amber', 'green', 'blue', 'purple'];

export const EditorModal: React.FC<EditorModalProps> = ({ note, isOpen, onClose, onSave, onDelete, categories }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<CapsuleColor>('slate');
  const [categoryId, setCategoryId] = useState<string>('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
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
        setTimeout(() => contentRef.current?.focus(), 150);
      }
    }
  }, [isOpen, note]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!content.trim() && !title.trim()) {
      onClose();
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
    onClose();
  };

  const handleEnhanceNote = async () => {
    if (!content.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
        const enhancedContent = await generateNoteEnhancement(content);
        if (enhancedContent) {
          setContent(enhancedContent);
        }
    } catch (error) {
        console.error("Failed to enhance note", error);
        alert("AI 增强失败，请稍后再试。");
    } finally {
        setIsEnhancing(false);
    }
  };

  const getColorClass = (c: CapsuleColor, isSelected: boolean) => {
    const base = 'w-7 h-7 rounded-full transition-all duration-200 ease-in-out flex-shrink-0';
    const selected = isSelected ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-slate-400 dark:ring-slate-500 scale-110' : 'opacity-60 hover:opacity-100 scale-90 hover:scale-100';
    switch (c) {
      case 'blue': return `${base} ${selected} bg-blue-400 dark:bg-blue-500`;
      case 'purple': return `${base} ${selected} bg-purple-400 dark:bg-purple-500`;
      case 'green': return `${base} ${selected} bg-emerald-400 dark:bg-emerald-500`;
      case 'rose': return `${base} ${selected} bg-rose-400 dark:bg-rose-500`;
      case 'amber': return `${base} ${selected} bg-amber-400 dark:bg-amber-500`;
      case 'slate': return `${base} ${selected} bg-slate-400 dark:bg-slate-500`;
      default: return `${base} ${selected} bg-gray-400`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center">
      <div 
        className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in-0 duration-300" 
        onClick={handleSave}
      />
      <div 
        className="bg-white dark:bg-slate-900 w-full h-full sm:max-w-2xl sm:h-[85vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative transition-all animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300"
      >
        <header 
          className="flex items-center justify-between px-4 sm:px-6 h-16 border-b border-slate-100 dark:border-slate-800 shrink-0"
          style={{ paddingTop: 'var(--safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-1">
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={24} /></button>
            {note && (
              <button onClick={() => { onDelete(note.id); onClose(); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"><Trash2 size={20} /></button>
            )}
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
                <Folder size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 border-none outline-none appearance-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <option value="">无分类</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
             </div>
             <button onClick={handleSave} className="flex items-center gap-1.5 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-full hover:bg-slate-700 dark:hover:bg-slate-200 transition-all active:scale-95 font-medium text-sm"><Check size={16} /> 完成</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4">
          <input
            type="text"
            placeholder="胶囊标题..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl md:text-3xl font-bold bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-100"
          />
          <textarea
            ref={contentRef}
            placeholder="捕捉你的灵感..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full min-h-[50vh] resize-none text-lg leading-relaxed bg-transparent border-none outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-300 font-medium pb-20"
            spellCheck={false}
          />
        </div>

        <footer 
            className="px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4"
            style={{ paddingBottom: 'calc(0.75rem + var(--safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-4">
            {COLORS.map(c => (
              <button key={c} onClick={() => setSelectedColor(c)} className={getColorClass(c, selectedColor === c)} />
            ))}
          </div>
          <button 
            onClick={handleEnhanceNote} 
            disabled={isEnhancing || !content.trim()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEnhancing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500"></div>
            ) : (
              <BrainCircuit size={16} />
            )}
            <span className="whitespace-nowrap">{isEnhancing ? '增强中...' : 'AI 增强'}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
