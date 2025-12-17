import React, { useRef, useState } from 'react';
import { Note, CapsuleColor } from '../types';
import { Clock, Trash2, CheckCircle2, Circle } from 'lucide-react';

interface CapsuleCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onDelete?: (id: string) => void;
  viewMode: 'grid' | 'list';
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

const colorStyles: Record<CapsuleColor, { container: string; title: string; }> = {
  blue:   { container: 'bg-blue-50 border-blue-200 dark:bg-slate-900 dark:border-blue-800/60', title: 'text-blue-900 dark:text-blue-300' },
  purple: { container: 'bg-purple-50 border-purple-200 dark:bg-slate-900 dark:border-purple-800/60', title: 'text-purple-900 dark:text-purple-300' },
  green:  { container: 'bg-emerald-50 border-emerald-200 dark:bg-slate-900 dark:border-emerald-800/60', title: 'text-emerald-900 dark:text-emerald-300' },
  rose:   { container: 'bg-rose-50 border-rose-200 dark:bg-slate-900 dark:border-rose-800/60', title: 'text-rose-900 dark:text-rose-300' },
  amber:  { container: 'bg-amber-50 border-amber-200 dark:bg-slate-900 dark:border-amber-800/60', title: 'text-amber-900 dark:text-amber-300' },
  slate:  { container: 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700/80', title: 'text-slate-900 dark:text-slate-300' },
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
  const hasTitle = note.title && note.title.trim().length > 0;
  
  const DELETE_BTN_WIDTH = 100; 
  
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
    let newTranslate = startTranslateX.current + diff;
    if (newTranslate > 0) newTranslate = 0;
    if (newTranslate < -DELETE_BTN_WIDTH) newTranslate = -DELETE_BTN_WIDTH;
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
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(50);
      }
      onDelete(note.id);
    }
    setTranslateX(0);
  };

  const renderCheckbox = () => {
    if (!isSelectionMode) return null;
    return (
      <div className={`absolute top-3 right-3 z-20 transition-transform duration-200 ${isSelected ? 'scale-110' : 'scale-100'}`}>
        {isSelected ? (
          <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400 fill-current" />
        ) : (
          <Circle className="w-6 h-6 text-slate-400 dark:text-slate-600 bg-white/50 dark:bg-slate-950/50 rounded-full" />
        )}
      </div>
    );
  };

  const selectionBorderClass = isSelectionMode && isSelected 
    ? 'ring-2 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950 ring-blue-500 dark:ring-blue-400' 
    : '';

  const renderListContent = () => (
    <div className={`flex flex-col gap-0.5 ${isSelectionMode ? 'pr-8' : ''}`}>
      {hasTitle ? (
        <>
            <div className="flex items-center justify-between gap-2">
                <h3 className={`font-bold text-base truncate leading-snug flex-1 ${styles.title}`}>{note.title}</h3>
                <span className="text-[10px] opacity-40 font-mono flex-shrink-0 whitespace-nowrap">
                    {new Date(note.updatedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                </span>
            </div>
            <p className="text-sm opacity-60 line-clamp-1 leading-snug font-medium pr-2 text-slate-700 dark:text-slate-400">
                {note.content || '无内容'}
            </p>
        </>
      ) : (
        <div className="flex items-start justify-between gap-2">
            <p className={`text-base font-medium opacity-90 line-clamp-2 leading-snug flex-1 ${styles.title}`}>
                {note.content || '无内容'}
            </p>
            <span className="text-[10px] opacity-40 font-mono flex-shrink-0 whitespace-nowrap mt-1">
                {new Date(note.updatedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
            </span>
        </div>
      )}
    </div>
  );

  const renderGridContent = () => (
    <>
      {hasTitle && (
          <h3 className={`font-bold text-lg mb-2 leading-tight ${styles.title} ${isSelectionMode ? 'pr-6' : ''}`}>{note.title}</h3>
      )}
      <p className={`text-sm opacity-80 mb-4 flex-grow whitespace-pre-line font-medium leading-relaxed text-slate-700 dark:text-slate-300 ${hasTitle ? 'line-clamp-6' : 'line-clamp-[8] text-base'} ${isSelectionMode && !hasTitle ? 'pr-6' : ''}`}>
        {note.content || '无内容...'}
      </p>
      <div className="mt-auto pt-2 flex items-center text-xs opacity-40 font-mono">
        <Clock size={10} className="mr-1" />
        {new Date(note.updatedAt).toLocaleDateString('zh-CN')}
      </div>
    </>
  );

  const containerClasses = viewMode === 'list'
    ? `p-4 min-h-[4.5rem] flex flex-col justify-center`
    : `p-5 h-full flex flex-col min-h-[160px]`;

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden group ${viewMode === 'grid' ? 'h-full' : ''}`}>
        <div className="absolute inset-y-0 right-0 bg-red-600 flex items-center justify-center rounded-2xl" style={{ width: DELETE_BTN_WIDTH }}>
             <button onClick={handleDeleteClick} className="w-full h-full flex flex-col items-center justify-center text-white active:bg-red-700 transition-colors">
                <Trash2 size={28} />
             </button>
        </div>
        <div 
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`
                relative border transition-transform
                ${isDragging ? 'duration-0' : 'duration-300 ease-out'} 
                ${styles.container} ${selectionBorderClass} ${containerClasses} rounded-2xl
                dark:shadow-none active:scale-[0.98] z-10
            `}
            style={{ 
                transform: `translateX(${translateX}px)`,
                WebkitUserSelect: 'none',
                touchAction: 'pan-y'
            }}
        >
            {renderCheckbox()}
            {viewMode === 'list' ? renderListContent() : renderGridContent()}
        </div>
    </div>
  );
};
