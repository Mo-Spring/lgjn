
import React, { useRef } from 'react';
import { Note, CapsuleColor } from '../types';
import { Check } from 'lucide-react';

interface CapsuleCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onLongPress: (note: Note) => void;
  viewMode: 'grid' | 'list';
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

// 现代清爽配色 (iOS Notes / Productivity Style)
// 使用 class 来处理边框颜色，保持背景统一洁净
const colorBorders: Record<CapsuleColor, string> = {
  blue:   'border-blue-500 dark:border-blue-400',
  purple: 'border-purple-500 dark:border-purple-400',
  green:  'border-emerald-500 dark:border-emerald-400',
  rose:   'border-rose-500 dark:border-rose-400',
  amber:  'border-amber-500 dark:border-amber-400',
  slate:  'border-slate-400 dark:border-slate-500',
};

const bgColors: Record<CapsuleColor, string> = {
    blue:   'bg-white dark:bg-[#1E1E20]',
    purple: 'bg-white dark:bg-[#1E1E20]',
    green:  'bg-white dark:bg-[#1E1E20]',
    rose:   'bg-white dark:bg-[#1E1E20]',
    amber:  'bg-white dark:bg-[#1E1E20]',
    slate:  'bg-white dark:bg-[#1E1E20]',
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

  return (
    <div 
        className={`
            relative w-full group
            transition-all duration-300 ease-out
            ${isSelectionMode && isSelected ? 'transform scale-[0.96] opacity-80' : 'hover:-translate-y-1'}
        `}
        onContextMenu={(e) => { e.preventDefault(); onLongPress(note); }}
    >
        <div 
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd}
            className={`
                relative z-10 flex flex-col overflow-hidden
                ${bgColors[note.color]}
                ${viewMode === 'grid' 
                    ? `rounded-2xl p-5 min-h-[150px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.3)] border-l-[3px] ${colorBorders[note.color]}` 
                    : `rounded-xl p-4 min-h-[4rem] shadow-sm border-l-4 ${colorBorders[note.color]}`}
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
                            : 'bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20'}
                    `}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                </div>
            )}
            
            <div className="flex flex-col h-full">
                <div className="flex-1">
                    {hasTitle && (
                        <h3 className={`
                            font-bold text-[16px] leading-tight mb-2 text-slate-900 dark:text-white
                            ${isSelectionMode ? 'pr-6' : ''}
                        `}>
                            {note.title}
                        </h3>
                    )}

                    <p className={`
                        text-[15px] leading-relaxed font-normal text-slate-600 dark:text-slate-300
                        ${!hasTitle ? 'text-[15px] text-slate-800 dark:text-slate-200' : ''}
                        ${viewMode === 'list' ? (hasTitle ? 'line-clamp-1' : 'line-clamp-2') : (hasTitle ? 'line-clamp-5' : 'line-clamp-[6]')}
                        ${isSelectionMode && !hasTitle ? 'pr-6' : ''}
                    `}>
                        {note.content || <span className="opacity-30 italic">...</span>}
                    </p>
                </div>

                <div className={`mt-4 pt-3 border-t border-slate-50 dark:border-white/5 flex items-center justify-between ${viewMode === 'list' ? 'hidden' : ''}`}>
                     <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {new Date(note.updatedAt).toLocaleDateString('en-US', {month:'short', day:'numeric'})}
                     </span>
                </div>
            </div>
        </div>
    </div>
  );
};
