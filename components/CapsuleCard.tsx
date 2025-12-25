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
// 颜色更明确，背景更干净
const colorStyles: Record<CapsuleColor, string> = {
  blue:   'bg-white dark:bg-[#1C1C1E] border-l-4 border-blue-500',
  purple: 'bg-white dark:bg-[#1C1C1E] border-l-4 border-purple-500',
  green:  'bg-white dark:bg-[#1C1C1E] border-l-4 border-emerald-500',
  rose:   'bg-white dark:bg-[#1C1C1E] border-l-4 border-rose-500',
  amber:  'bg-white dark:bg-[#1C1C1E] border-l-4 border-amber-500',
  slate:  'bg-white dark:bg-[#1C1C1E] border-l-4 border-slate-400',
};

// 列表模式下的纯色背景 (可选)
const listColorStyles: Record<CapsuleColor, string> = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100',
    green:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100',
    rose:   'bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-100',
    amber:  'bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100',
    slate:  'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100',
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
    }, 500); // 500ms 长按触发
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

  // 根据视图模式选择样式
  const cardStyle = viewMode === 'grid' 
    ? `${colorStyles[note.color]} shadow-sm` // Grid 模式：白底 + 彩色左边框
    : `${listColorStyles[note.color]} rounded-xl border-none`; // List 模式：通体淡色

  return (
    <div 
        className={`
            relative w-full group
            transition-all duration-200 ease-out
            ${isSelectionMode && isSelected ? 'transform scale-[0.98]' : 'active:scale-[0.98]'}
        `}
        onContextMenu={(e) => { e.preventDefault(); onLongPress(note); }} // Desktop right click
    >
        <div 
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd} // 移动手指取消长按
            className={`
                relative z-10 flex flex-col overflow-hidden
                ${cardStyle}
                ${viewMode === 'grid' ? 'rounded-2xl p-5 min-h-[140px]' : 'rounded-xl p-4 min-h-[4rem]'}
                transition-shadow duration-200
            `}
        >
            {/* 选中状态复选框 */}
            {isSelectionMode && (
                <div className="absolute top-3 right-3 z-20">
                    <div className={`
                        flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 border-2
                        ${isSelected 
                            ? 'bg-blue-500 border-blue-500 text-white' 
                            : 'border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-black/20'}
                    `}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                </div>
            )}
            
            <div className="flex flex-col h-full">
                <div className="flex-1">
                    {hasTitle && (
                        <h3 className={`
                            font-bold text-[16px] leading-snug tracking-tight mb-2
                            ${viewMode === 'list' ? 'text-inherit' : 'text-slate-900 dark:text-white'}
                            ${isSelectionMode ? 'pr-6' : ''}
                        `}>
                            {note.title}
                        </h3>
                    )}

                    <p className={`
                        text-[15px] leading-relaxed font-normal
                        ${viewMode === 'list' ? 'text-inherit opacity-90' : 'text-slate-600 dark:text-slate-300'}
                        ${!hasTitle && viewMode !== 'list' ? 'text-slate-800 dark:text-slate-200 text-[16px]' : ''}
                        ${viewMode === 'list' ? (hasTitle ? 'line-clamp-1' : 'line-clamp-2') : (hasTitle ? 'line-clamp-5' : 'line-clamp-[6]')}
                        ${isSelectionMode && !hasTitle ? 'pr-6' : ''}
                    `}>
                        {note.content || <span className="opacity-40 italic">无内容</span>}
                    </p>
                </div>

                <div className={`mt-3 flex items-center justify-between opacity-50 ${viewMode === 'list' ? 'hidden' : ''}`}>
                     <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {new Date(note.updatedAt).toLocaleDateString('zh-CN', {month:'numeric', day:'numeric'})}
                     </span>
                </div>
            </div>
        </div>
    </div>
  );
};
