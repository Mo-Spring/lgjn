import React, { useRef, useState } from 'react';
import { Note, CapsuleColor } from '../types';
import { Clock, Trash2 } from 'lucide-react';

interface CapsuleCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onDelete?: (id: string) => void;
  viewMode: 'grid' | 'list';
}

const colorStyles: Record<CapsuleColor, string> = {
  blue:   'bg-blue-50 border-blue-200 text-blue-900 hover:border-blue-300 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-100 dark:hover:border-blue-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-900 hover:border-purple-300 dark:bg-purple-950/40 dark:border-purple-900 dark:text-purple-100 dark:hover:border-purple-700',
  green:  'bg-emerald-50 border-emerald-200 text-emerald-900 hover:border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-100 dark:hover:border-emerald-700',
  rose:   'bg-rose-50 border-rose-200 text-rose-900 hover:border-rose-300 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-100 dark:hover:border-rose-700',
  amber:  'bg-amber-50 border-amber-200 text-amber-900 hover:border-amber-300 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-100 dark:hover:border-amber-700',
  slate:  'bg-white border-slate-200 text-slate-900 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:hover:border-slate-700',
};

export const CapsuleCard: React.FC<CapsuleCardProps> = ({ note, onClick, onDelete, viewMode }) => {
  const styles = colorStyles[note.color];
  const hasTitle = note.title && note.title.trim().length > 0;
  
  const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 长按逻辑
  const handleStart = () => {
    timerRef.current = setTimeout(() => {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50); // 震动反馈
      }
      setShowDeleteOverlay(true);
    }, 600); // 600ms 长按触发
  };

  const handleEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(note.id);
    }
    setShowDeleteOverlay(false);
  };

  const handleCancelOverlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteOverlay(false);
  };

  // 渲染覆盖层
  const renderOverlay = () => {
    if (!showDeleteOverlay) return null;
    return (
      <div 
        className="absolute inset-0 bg-slate-900/80 dark:bg-black/80 z-20 rounded-xl flex items-center justify-center animate-in fade-in duration-200 backdrop-blur-sm"
        onClick={handleCancelOverlay}
      >
        <button 
          onClick={handleConfirmDelete}
          className="flex flex-col items-center gap-2 text-white p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors shadow-lg scale-110"
        >
          <Trash2 size={28} />
          <span className="text-xs font-bold">删除</span>
        </button>
      </div>
    );
  };

  if (viewMode === 'list') {
    return (
      <div 
        onClick={() => !showDeleteOverlay && onClick(note)}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onTouchMove={handleEnd} // 滑动时取消长按
        className={`group relative px-4 py-3 rounded-xl border transition-all duration-200 active:scale-[0.98] ${styles} w-full flex flex-col justify-center min-h-[4.5rem] select-none`}
        style={{ WebkitUserSelect: 'none' }}
      >
        {renderOverlay()}
        <div className="flex flex-col gap-0.5">
          {hasTitle ? (
            <>
                <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-base truncate leading-snug flex-1">{note.title}</h3>
                    <span className="text-[10px] opacity-40 font-mono flex-shrink-0 whitespace-nowrap">
                        {new Date(note.updatedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                    </span>
                </div>
                <p className="text-sm opacity-70 line-clamp-1 leading-snug font-medium pr-2">
                    {note.content || '无内容'}
                </p>
            </>
          ) : (
            <div className="flex items-start justify-between gap-2">
                <p className="text-base font-medium opacity-90 line-clamp-2 leading-snug flex-1">
                    {note.content || '无内容'}
                </p>
                <span className="text-[10px] opacity-40 font-mono flex-shrink-0 whitespace-nowrap mt-1">
                    {new Date(note.updatedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid 模式
  return (
    <div 
      onClick={() => !showDeleteOverlay && onClick(note)}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchMove={handleEnd}
      className={`group relative p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98] ${styles} h-full flex flex-col min-h-[160px] select-none`}
      style={{ WebkitUserSelect: 'none' }}
    >
      {renderOverlay()}
      {hasTitle && (
          <h3 className="font-bold text-lg mb-2 leading-tight">{note.title}</h3>
      )}
      
      <p className={`text-sm opacity-80 mb-4 flex-grow whitespace-pre-line font-medium leading-relaxed ${hasTitle ? 'line-clamp-6' : 'line-clamp-[8] text-base'}`}>
        {note.content || '无内容...'}
      </p>

      <div className="mt-auto pt-2 flex items-center justify-between">
        <div className="flex items-center text-xs opacity-40 font-mono">
          <Clock size={10} className="mr-1" />
          {new Date(note.updatedAt).toLocaleDateString('zh-CN')}
        </div>
      </div>
    </div>
  );
};
