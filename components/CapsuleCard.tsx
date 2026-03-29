import React, { useRef } from 'react';
import { Note, CapsuleColor } from '../types';
import { Check, Clock, Sparkles } from 'lucide-react';

interface CapsuleCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onLongPress: (note: Note, event?: React.MouseEvent | React.TouchEvent) => void;
  viewMode: 'grid' | 'list';
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

const COLOR_STYLES: Record<CapsuleColor, {
  card: string;
  accent: string;
  border: string;
  glow: string;
  meta: string;
  dot: string;
}> = {
  blue: {
    card: 'bg-gradient-to-br from-blue-50/90 via-white to-blue-50/40 dark:from-blue-500/[0.08] dark:via-[#111] dark:to-blue-900/[0.03]',
    accent: 'from-blue-400 to-blue-600',
    border: 'border-blue-200/40 dark:border-blue-500/[0.12]',
    glow: 'shadow-blue-500/[0.08]',
    meta: 'text-blue-400/80 dark:text-blue-300/50',
    dot: 'bg-blue-500',
  },
  purple: {
    card: 'bg-gradient-to-br from-violet-50/90 via-white to-violet-50/40 dark:from-violet-500/[0.08] dark:via-[#111] dark:to-violet-900/[0.03]',
    accent: 'from-violet-400 to-purple-600',
    border: 'border-violet-200/40 dark:border-violet-500/[0.12]',
    glow: 'shadow-violet-500/[0.08]',
    meta: 'text-violet-400/80 dark:text-violet-300/50',
    dot: 'bg-violet-500',
  },
  green: {
    card: 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 dark:from-emerald-500/[0.08] dark:via-[#111] dark:to-emerald-900/[0.03]',
    accent: 'from-emerald-400 to-teal-500',
    border: 'border-emerald-200/40 dark:border-emerald-500/[0.12]',
    glow: 'shadow-emerald-500/[0.08]',
    meta: 'text-emerald-400/80 dark:text-emerald-300/50',
    dot: 'bg-emerald-500',
  },
  rose: {
    card: 'bg-gradient-to-br from-rose-50/90 via-white to-rose-50/40 dark:from-rose-500/[0.08] dark:via-[#111] dark:to-rose-900/[0.03]',
    accent: 'from-rose-400 to-pink-500',
    border: 'border-rose-200/40 dark:border-rose-500/[0.12]',
    glow: 'shadow-rose-500/[0.08]',
    meta: 'text-rose-400/80 dark:text-rose-300/50',
    dot: 'bg-rose-500',
  },
  amber: {
    card: 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 dark:from-amber-500/[0.08] dark:via-[#111] dark:to-amber-900/[0.03]',
    accent: 'from-amber-400 to-orange-500',
    border: 'border-amber-200/40 dark:border-amber-500/[0.12]',
    glow: 'shadow-amber-500/[0.08]',
    meta: 'text-amber-400/80 dark:text-amber-300/50',
    dot: 'bg-amber-500',
  },
  slate: {
    card: 'bg-gradient-to-br from-slate-50/90 via-white to-slate-100/40 dark:from-slate-400/[0.06] dark:via-[#111] dark:to-slate-800/[0.03]',
    accent: 'from-slate-400 to-slate-600',
    border: 'border-slate-200/40 dark:border-slate-500/[0.12]',
    glow: 'shadow-slate-500/[0.08]',
    meta: 'text-slate-400/80 dark:text-slate-400/50',
    dot: 'bg-slate-400',
  },
};

export const CapsuleCard: React.FC<CapsuleCardProps> = ({
  note, onClick, onLongPress, viewMode, isSelectionMode, isSelected, onToggleSelect
}) => {
  const hasTitle = note.title && note.title.trim().length > 0;
  const s = COLOR_STYLES[note.color];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSelectionMode) return;
    timerRef.current = setTimeout(() => onLongPress(note, e), 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode) { e.stopPropagation(); onToggleSelect(note.id); }
    else { onClick(note); }
  };

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
        relative w-full group/card
        transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
        ${isSelectionMode && isSelected ? 'scale-[0.96] opacity-90' : 'hover:-translate-y-[3px]'}
      `}
      onContextMenu={(e) => { e.preventDefault(); onLongPress(note, e); }}
    >
      <div
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        className={`
          relative z-10 overflow-hidden
          border ${s.border}
          ${s.card}
          shadow-[0_2px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.2)]
          ${viewMode === 'grid'
            ? 'rounded-[20px] p-5 min-h-[160px]'
            : 'rounded-2xl p-4 min-h-[56px]'}
          transition-all duration-300
          group-hover/card:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:group-hover/card:shadow-[0_8px_30px_rgba(0,0,0,0.4)]
          active:scale-[0.98]
        `}
      >
        {/* Top accent line */}
        <div className={`absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r ${s.accent} opacity-0 group-hover/card:opacity-40 transition-opacity duration-500`} />

        {/* Selection checkbox */}
        {isSelectionMode && (
          <div className="absolute top-3 right-3 z-20 animate-pop">
            <div className={`
              flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200
              ${isSelected
                ? `bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md`
                : 'bg-white/60 dark:bg-black/40 border-2 border-slate-200 dark:border-white/20'}
            `}>
              {isSelected && <Check size={13} strokeWidth={3} />}
            </div>
          </div>
        )}

        <div className="flex flex-col h-full">
          <div className="flex-1">
            {hasTitle && (
              <h3 className={`
                font-bold text-[16px] leading-snug mb-2 text-slate-800 dark:text-slate-100 tracking-tight
                ${isSelectionMode ? 'pr-7' : ''}
              `}>
                {note.title}
              </h3>
            )}

            <p className={`
              text-[14px] leading-[1.7] text-slate-500 dark:text-slate-400
              ${!hasTitle ? 'text-slate-700 dark:text-slate-200 font-medium' : ''}
              ${viewMode === 'list'
                ? (hasTitle ? 'line-clamp-1' : 'line-clamp-2')
                : (hasTitle ? 'line-clamp-5' : 'line-clamp-[6]')}
              ${isSelectionMode && !hasTitle ? 'pr-7' : ''}
            `}>
              {note.content || <span className="opacity-30 italic text-[13px]">空白灵感...</span>}
            </p>
          </div>

          {/* Footer */}
          {viewMode === 'grid' && (
            <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
              <div className={`flex items-center gap-1.5 text-[11px] font-medium ${s.meta}`}>
                <Clock size={11} strokeWidth={2} />
                <span>{formatDate(note.updatedAt)}</span>
              </div>
              <div className={`w-[6px] h-[6px] rounded-full ${s.dot} opacity-40`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
