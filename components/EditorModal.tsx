
import React, { useState, useEffect, useRef } from 'react';
import { Note, CapsuleColor, Category } from '../types';
import { X, Trash2, Save, Folder, Check, Calendar } from 'lucide-react';

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
        setTimeout(() => {
            contentRef.current?.focus();
        }, 300);
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

  const getColorClass = (c: CapsuleColor) => {
    switch (c) {
      case 'blue': return 'bg-blue-400 dark:bg-blue-500';
      case 'purple': return 'bg-purple-400 dark:bg-purple-500';
      case 'green': return 'bg-emerald-400 dark:bg-emerald-500';
      case 'rose': return 'bg-rose-400 dark:bg-rose-500';
      case 'amber': return 'bg-amber-400 dark:bg-amber-500';
      case 'slate': return 'bg-slate-400 dark:bg-slate-500';
      default: return 'bg-gray-400';
    }
  };

  // 生成背景渐变，基于选中的颜色
  const getGradientBg = () => {
      return "bg-slate-50 dark:bg-slate-950";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-6 animate-in fade-in duration-200">
      {/* 模糊背景 */}
      <div 
        className="absolute inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={handleSave}
      />
      
      {/* 模态框主体 */}
      <div 
        className={`
            w-full h-full sm:h-[90vh] sm:max-w-3xl sm:rounded-3xl 
            flex flex-col relative overflow-hidden shadow-2xl 
            bg-white dark:bg-slate-900
            transition-all duration-300 ease-out transform scale-100
        `}
      >
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between px-6 py-5 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0">
          <button 
              onClick={handleSave}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={24} />
          </button>

          <div className="flex items-center gap-3">
             {/* 颜色选择器 */}
             <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-full p-1 mr-2">
                {COLORS.map(c => (
                <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`
                        w-5 h-5 rounded-full transition-all duration-300
                        ${getColorClass(c)} 
                        ${selectedColor === c ? 'scale-125 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-800 ring-slate-300 dark:ring-slate-500' : 'opacity-40 hover:opacity-80 scale-90'}
                    `}
                />
                ))}
             </div>

            {note && (
              <button 
                onClick={() => { onDelete(note.id); onClose(); }}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                title="删除"
              >
                <Trash2 size={20} />
              </button>
            )}
            
            <button 
                onClick={handleSave}
                className="bg-slate-900 dark:bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
                保存
            </button>
          </div>
        </div>

        {/* 编辑区域 */}
        <div className="flex-1 overflow-y-auto px-6 md:px-12 py-4 no-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Meta Info Line */}
            <div className="flex items-center gap-4 text-sm text-slate-400 dark:text-slate-500 font-medium">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Folder size={14} />
                    <select 
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="bg-transparent border-none outline-none appearance-none cursor-pointer pr-4 text-slate-600 dark:text-slate-300"
                    >
                        <option value="">无分类</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-1.5 opacity-60">
                    <Calendar size={14} />
                    <span>{new Date(note?.updatedAt || Date.now()).toLocaleDateString()}</span>
                </div>
            </div>

            <input
                type="text"
                placeholder="无标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-4xl font-extrabold tracking-tight bg-transparent border-none outline-none placeholder:text-slate-200 dark:placeholder:text-slate-700 text-slate-900 dark:text-white"
            />
            
            <textarea
                ref={contentRef}
                placeholder="开始书写你的想法..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[50vh] resize-none text-lg leading-loose bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-700 dark:text-slate-200 font-normal pb-32"
                spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
