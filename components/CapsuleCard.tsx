import React, { useRef, useState } from 'react';
import { Note, CapsuleColor } from '../types';
import { Trash2, Check } from 'lucide-react';

interface CapsuleCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onDelete?: (id: string) => void;
  viewMode: 'grid' | 'list';
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

// Sophisticated gradients - barely there, but adds depth
const colorStyles: Record<CapsuleColor, string> = {
  blue:   'bg-gradient-to-b from-blue-50/80 to-white dark:from-blue-950/40 dark:to-slate-900 border-blue-100/50 dark:border-blue-900/30 text-slate-800 dark:text-blue-100',
  purple: 'bg-gradient-to-b from-purple-50/80 to-white dark:from-purple-950/40 dark:to-slate-900 border-purple-100/50 dark:border-purple-900/30 text-slate-800 dark:text-purple-100',
  green:  'bg-gradient-to-b from-emerald-50/80 to-white dark:from-emerald-950/40 dark:to-slate-900 border-emerald-100/50 dark:border-emerald-900/30 text-slate-800 dark:text-emerald-100',
  rose:   'bg-gradient-to-b from-rose-50/80 to-white dark:from-rose-950/40 dark:to-slate-900 border-rose-100/50 dark:border-rose-900/30 text-slate-800 dark:text-rose-100',
  amber:  'bg-gradient-to-b from-amber-50/80 to-white dark:from-amber-950/40 dark:to-slate-900 border-amber-100/50 dark:border-amber-900/30 text-slate-800 dark:text-amber-100',
  slate:  'bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-900 dark:to-slate-950 border-slate-200/50 dark:border-slate-800/30 text-slate-800 dark:text-slate-300',
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
    if (diff > 0 && translateX === 0) return;

    let newTranslate = startTranslateX.current + diff;
    if (newTranslate > 0) newTranslate = 0;
    if (newTranslate < -DELETE_BTN_WIDTH) newTranslate = -DELETE_BTN_WIDTH - (Math.abs(newTranslate + DELETE_BTN_WIDTH) * 0.2); 

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
        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
        onDelete(note.id);
    }
    setTranslateX(0);
  };

  // Modern subtle scaling for selection
  const containerClasses = `
    relative w-full rounded-3xl group 
    ${viewMode === 'grid' ? 'h-full' : ''} 
    transition-all duration-300
    ${isSelectionMode && isSelected ? 'transform scale-[0.95]' : ''}
  `;

  return (
    <div className={containerClasses}>
        {/* Swipe Delete Background */}
        <div className="absolute inset-y-0 right-0 rounded-3xl overflow-hidden" style={{ width: DELETE_BTN_WIDTH, zIndex: 0 }}>
             <button 
                onClick={handleDeleteClick}
                className="w-full h-full flex flex-col items-center justify-center bg-red-500/90 text-white"
             >
                <Trash2 size={24} />
             </button>
        </div>

        {/* Card Content */}
        <div 
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`
                relative z-10 flex flex-col overflow-hidden
                ${styles}
                border shadow-sm
                transition-all cubic-bezier(0.2, 0.8, 0.2, 1)
                ${isDragging ? 'duration-0' : 'duration-500'} 
                rounded-3xl
                ${viewMode === 'list' ? 'min-h-[5rem]' : 'min-h-[160px] h-full'}
                ${isSelectionMode && isSelected ? 'ring-2 ring-slate-900 dark:ring-white ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950' : 'active:scale-[0.98]'}
            `}
            style={{ 
                transform: `translateX(${translateX}px)`,
                touchAction: 'pan-y'
            }}
        >
            {/* Selection Checkbox Overlay */}
            {isSelectionMode && (
                <div className={`absolute top-4 right-4 z-20 flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${isSelected ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 scale-100' : 'border-2 border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-black/20'}`}>
                    {isSelected && <Check size={14} strokeWidth={3} />}
                </div>
            )}
            
            <div className="p-5 flex flex-col h-full">
                {hasTitle && (
                    <h3 className={`font-bold text-[17px] mb-2 leading-snug tracking-tight text-slate-900 dark:text-slate-100 ${isSelectionMode ? 'pr-8' : ''}`}>
                        {note.title}
                    </h3>
                )}

                <p className={`
                    text-[15px] leading-relaxed opacity-80 flex-grow whitespace-pre-line font-normal
                    ${!hasTitle ? 'text-[16px] text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}
                    ${viewMode === 'list' ? (hasTitle ? 'line-clamp-1' : 'line-clamp-2') : (hasTitle ? 'line-clamp-5' : 'line-clamp-[7]')}
                    ${isSelectionMode && !hasTitle ? 'pr-8' : ''}
                `}>
                    {note.content || <span className="opacity-30">空</span>}
                </p>

                {viewMode === 'grid' && (
                    <div className="mt-4 flex items-center justify-between opacity-40">
                         <span className="text-[10px] font-bold tracking-wider uppercase">
                            {new Date(note.updatedAt).toLocaleDateString('zh-CN', {month:'numeric', day:'numeric'})}
                         </span>
                    </div>
                )}
                
                 {viewMode === 'list' && (
                    <div className="absolute bottom-5 right-5 opacity-40">
                         <span className="text-[11px] font-medium">
                            {new Date(note.updatedAt).toLocaleDateString('zh-CN', {month:'numeric', day:'numeric'})}
                         </span>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
