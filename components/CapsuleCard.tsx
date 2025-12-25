
import React, { useRef, useState } from 'react';
import { Note, CapsuleColor } from '../types';
import { Clock, Trash2, Check, GripVertical } from 'lucide-react';

interface CapsuleCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onDelete?: (id: string) => void;
  viewMode: 'grid' | 'list';
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

// 使用渐变色和更高级的边框颜色
const colorStyles: Record<CapsuleColor, string> = {
  blue:   'bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/60 dark:to-slate-900 border-blue-100 dark:border-blue-900/50 text-slate-800 dark:text-blue-100',
  purple: 'bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/60 dark:to-slate-900 border-purple-100 dark:border-purple-900/50 text-slate-800 dark:text-purple-100',
  green:  'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/60 dark:to-slate-900 border-emerald-100 dark:border-emerald-900/50 text-slate-800 dark:text-emerald-100',
  rose:   'bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/60 dark:to-slate-900 border-rose-100 dark:border-rose-900/50 text-slate-800 dark:text-rose-100',
  amber:  'bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/60 dark:to-slate-900 border-amber-100 dark:border-amber-900/50 text-slate-800 dark:text-amber-100',
  slate:  'bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300',
};

// 装饰性光晕颜色
const glowStyles: Record<CapsuleColor, string> = {
    blue: 'shadow-blue-100/50 dark:shadow-blue-900/20',
    purple: 'shadow-purple-100/50 dark:shadow-purple-900/20',
    green: 'shadow-emerald-100/50 dark:shadow-emerald-900/20',
    rose: 'shadow-rose-100/50 dark:shadow-rose-900/20',
    amber: 'shadow-amber-100/50 dark:shadow-amber-900/20',
    slate: 'shadow-slate-200/50 dark:shadow-black/40',
};

export const CapsuleCard: React.FC<CapsuleCardProps> = ({ 
  note, 
  onClick, 
  onDelete, 
  viewMode, 
  isSelectionMode, 
  isSelected, 
  onToggleSelect 
}) => {
  const styles = colorStyles[note.color];
  const glow = glowStyles[note.color];
  const hasTitle = note.title && note.title.trim().length > 0;
  
  const DELETE_BTN_WIDTH = 80; 
  
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const touchStartX = useRef<number | null>(null);
  const startTranslateX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSelectionMode) return;
    touchStartX.current = e.touches[0].clientX;
    startTranslateX.current = translateX;
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isSelectionMode || touchStartX.current === null) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    
    // 只允许向左滑
    if (diff > 0 && translateX === 0) return;

    let newTranslate = startTranslateX.current + diff;

    if (newTranslate > 0) newTranslate = 0;
    if (newTranslate < -DELETE_BTN_WIDTH) newTranslate = -DELETE_BTN_WIDTH - (Math.abs(newTranslate + DELETE_BTN_WIDTH) * 0.2); // 阻尼效果

    setIsDragging(true);
    setTranslateX(newTranslate);
  };

  const handleTouchEnd = () => {
    if (isSelectionMode) return;
    touchStartX.current = null;
    setIsDragging(false);

    if (translateX < -(DELETE_BTN_WIDTH / 2)) {
        setTranslateX(-DELETE_BTN_WIDTH);
    } else {
        setTranslateX(0);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.stopPropagation();
      onToggleSelect(note.id);
      return;
    }

    if (translateX !== 0) {
        e.stopPropagation();
        setTranslateX(0);
        return;
    }

    onClick(note);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
        onDelete(note.id);
    }
    setTranslateX(0);
  };

  const renderCheckbox = () => {
    if (!isSelectionMode) return null;
    return (
      <div className={`absolute top-3 right-3 z-20 transition-all duration-300 ${isSelected ? 'scale-100 opacity-100' : 'scale-90 opacity-60'}`}>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            isSelected 
                ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500' 
                : 'bg-white/50 dark:bg-black/20 border-slate-300 dark:border-slate-600'
        }`}>
            {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
        </div>
      </div>
    );
  };

  // 选中态的样式覆盖
  const selectionStyle = isSelectionMode && isSelected 
    ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 transform scale-[0.98]' 
    : 'hover:scale-[1.01]';

  const dateString = new Date(note.updatedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });

  return (
    <div className={`relative w-full rounded-2xl group ${viewMode === 'grid' ? 'h-full' : ''} transition-transform duration-300`}>
        {/* 背景层：删除按钮 */}
        <div className="absolute inset-y-1 right-0 flex items-center justify-center rounded-2xl overflow-hidden" style={{ width: DELETE_BTN_WIDTH }}>
             <button 
                onClick={handleDeleteClick}
                className="w-full h-full flex flex-col items-center justify-center bg-red-500 text-white active:bg-red-600 transition-colors shadow-inner"
             >
                <Trash2 size={24} />
             </button>
        </div>

        {/* 前景层：卡片内容 */}
        <div 
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`
                relative flex flex-col overflow-hidden
                ${styles} ${glow} ${selectionStyle}
                border shadow-sm
                transition-all cubic-bezier(0.4, 0, 0.2, 1)
                ${isDragging ? 'duration-0' : 'duration-500'} 
                rounded-2xl
                ${viewMode === 'list' ? 'min-h-[5rem]' : 'min-h-[180px] h-full'}
            `}
            style={{ 
                transform: `translateX(${translateX}px)`,
                WebkitUserSelect: 'none',
                touchAction: 'pan-y'
            }}
        >
            {renderCheckbox()}
            
            <div className={`p-5 flex flex-col h-full ${isSelectionMode ? 'opacity-90' : ''}`}>
                {/* Header: Title or First line */}
                {hasTitle && (
                    <h3 className={`font-bold text-lg mb-2 leading-tight tracking-tight text-slate-900 dark:text-slate-100 ${isSelectionMode ? 'pr-6' : ''}`}>
                        {note.title}
                    </h3>
                )}

                {/* Content Body */}
                <p className={`
                    text-[15px] leading-relaxed font-normal opacity-80 flex-grow whitespace-pre-line
                    ${!hasTitle ? 'text-base font-medium text-slate-800 dark:text-slate-200' : 'text-slate-700 dark:text-slate-300'}
                    ${viewMode === 'list' ? (hasTitle ? 'line-clamp-1' : 'line-clamp-2') : (hasTitle ? 'line-clamp-6' : 'line-clamp-[8]')}
                    ${isSelectionMode && !hasTitle ? 'pr-6' : ''}
                `}>
                    {note.content || <span className="italic opacity-40">空白胶囊...</span>}
                </p>

                {/* Footer: Metadata */}
                <div className={`mt-4 pt-2 flex items-center justify-between border-t border-black/5 dark:border-white/5 ${viewMode === 'list' ? 'hidden' : ''}`}>
                    <div className="flex items-center text-[10px] font-bold tracking-wider opacity-40 uppercase text-slate-900 dark:text-slate-100">
                        <Clock size={10} className="mr-1.5" />
                        {dateString}
                    </div>
                </div>

                {/* List View Date (Absolute positioning) */}
                {viewMode === 'list' && (
                    <div className="absolute bottom-3 right-4 text-[10px] font-bold opacity-40">
                         {dateString}
                    </div>
                )}
            </div>
            
            {/* 装饰性高光 */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>
        </div>
    </div>
  );
};
