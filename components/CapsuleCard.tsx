
import React, { useRef } from 'react';
import { Note, CapsuleColor } from '../types';
import { Check, Clock } from 'lucide-react';

interface CapsuleCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onLongPress: (note: Note) => void;
  viewMode: 'grid' | 'list';
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

// 全卡片着色风格 - 柔和渐变与通透质感
const cardStyles: Record<CapsuleColor, string> = {
  blue:   'bg-gradient-to-br from-blue-50/80 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-600/5 border-blue-200/50 dark:border-blue-400/20 shadow-blue-200/20',
  purple: 'bg-gradient-to-br from-purple-50/80 to-purple-100/50 dark:from-purple-500/10 dark:to-purple-600/5 border-purple-200/50 dark:border-purple-400/20 shadow-purple-200/20',
  green:  'bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-600/5 border-emerald-200/50 dark:border-emerald-400/20 shadow-emerald-200/20',
  rose:   'bg-gradient-to-br from-rose-50/80 to-rose-100/50 dark:from-rose-500/10 dark:to-rose-600/5 border-rose-200/50 dark:border-rose-400/20 shadow-rose-200/20',
  amber:  'bg-gradient-to-br from-amber-50/80 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-600/5 border-amber-200/50 dark:border-amber-400/20 shadow-amber-200/20',
  slate:  'bg-gradient-to-br from-slate-50/80 to-slate-100/50 dark:from-slate-700/10 dark:to-slate-600/5 border-slate-200/50 dark:border-slate-500/20 shadow-slate-200/20',
};

// 辅助文字颜色 (日期等)
const metaTextColors: Record<CapsuleColor, string> = {
    blue: 'text-blue-400 dark:text-blue-300/60',
    purple: 'text-purple-400 dark:text-purple-300/60',
    green: 'text-emerald-400 dark:text-emerald-300/60',
    rose: 'text-rose-400 dark:text-rose-300/60',
    amber: 'text-amber-400 dark:text-amber-300/60',
    slate: 'text-slate-400 dark:text-slate-500',
};

export const CapsuleCard: React.FC<CapsuleCardProps> = ({ 
  note, 
  onClick, 
  onLongPress,
  viewMode, 
  isSelectionMode, 
  isSelected, 
  onToggleSelect 
}) => {
  const hasTitle = note.title && note.title.trim().length > 0;
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = () => {
    if (isSelectionMode) return;
    timerRef.current = setTimeout(() => {
        onLongPress(note);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
        e.stopPropagation();
        onToggleSelect(note.id);
    } else {
        onClick(note);
    }
  };

  // 格式化时间为中文
  const formatDate = (timestamp: number) => {
      const date = new Date(timestamp);
      const now = new Date();
      const isThisYear = date.getFullYear() === now.getFullYear();
      
      if (isThisYear) {
          return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      }
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  return (
    <div 
        className={`
            relative w-full group
            transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
            ${isSelectionMode && isSelected ? 'transform scale-[0.96] opacity-90' : 'hover:-translate-y-1 hover:shadow-lg'}
        `}
        onContextMenu={(e) => { e.preventDefault(); onLongPress(note); }}
    >
        <div 
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd}
            className={`
                relative z-10 flex flex-col overflow-hidden backdrop-blur-md
                border
                ${cardStyles[note.color]}
                ${viewMode === 'grid' 
                    ? `rounded-[20px] p-5 min-h-[160px]` 
                    : `rounded-2xl p-4 min-h-[4.5rem]`}
                transition-all duration-300
            `}
        >
            {/* 选中状态复选框 */}
            {isSelectionMode && (
                <div className="absolute top-3 right-3 z-20 animate-pop">
                    <div className={`
                        flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 shadow-sm
                        ${isSelected 
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 scale-110' 
                            : 'bg-white/50 dark:bg-black/20 border border-slate-300 dark:border-white/20'}
                    `}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                </div>
            )}
            
            <div className="flex flex-col h-full">
                <div className="flex-1">
                    {hasTitle && (
                        <h3 className={`
                            font-bold text-[17px] leading-tight mb-2.5 text-slate-800 dark:text-slate-100 tracking-tight
                            ${isSelectionMode ? 'pr-6' : ''}
                        `}>
                            {note.title}
                        </h3>
                    )}

                    <p className={`
                        text-[15px] leading-relaxed font-normal text-slate-600 dark:text-slate-300/90
                        ${!hasTitle ? 'text-slate-700 dark:text-slate-200' : ''}
                        ${viewMode === 'list' ? (hasTitle ? 'line-clamp-1' : 'line-clamp-2') : (hasTitle ? 'line-clamp-5' : 'line-clamp-[6]')}
                        ${isSelectionMode && !hasTitle ? 'pr-6' : ''}
                    `}>
                        {note.content || <span className="opacity-40 italic font-light">空白胶囊...</span>}
                    </p>
                </div>

                <div className={`mt-4 pt-3 flex items-center justify-between ${viewMode === 'list' ? 'hidden' : ''}`}>
                     <div className={`flex items-center gap-1.5 text-[11px] font-medium ${metaTextColors[note.color]}`}>
                        <Clock size={11} strokeWidth={2.5} />
                        <span>
                            {formatDate(note.updatedAt)}
                        </span>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};
