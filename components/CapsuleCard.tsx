import React from 'react';
import { Note, CapsuleColor } from '../types';
import { Clock, Tag } from 'lucide-react';

interface CapsuleCardProps {
  note: Note;
  onClick: (note: Note) => void;
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

const tagStyles: Record<CapsuleColor, string> = {
  blue:   'bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  purple: 'bg-purple-100/50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  green:  'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  rose:   'bg-rose-100/50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  amber:  'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  slate:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export const CapsuleCard: React.FC<CapsuleCardProps> = ({ note, onClick, viewMode }) => {
  const styles = colorStyles[note.color];
  const tagStyle = tagStyles[note.color];
  const hasTitle = note.title && note.title.trim().length > 0;
  const hasTags = note.tags && note.tags.length > 0;

  if (viewMode === 'list') {
    return (
      <div 
        onClick={() => onClick(note)}
        className={`group relative px-4 py-3 rounded-xl border transition-all duration-200 active:scale-[0.98] ${styles} w-full flex flex-col justify-center min-h-[4.5rem]`}
      >
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
        
        {hasTags && (
             <div className="mt-1.5 flex gap-1.5 overflow-hidden opacity-60">
                {note.tags.slice(0, 3).map((tag, idx) => (
                   <span key={idx} className="text-[10px] flex items-center gap-0.5">
                     <span className="opacity-50">#</span>{tag}
                   </span>
                ))}
             </div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={() => onClick(note)}
      className={`group relative p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98] ${styles} h-full flex flex-col min-h-[160px]`}
    >
      {hasTitle && (
          <h3 className="font-bold text-lg mb-2 leading-tight">{note.title}</h3>
      )}
      
      <p className={`text-sm opacity-80 mb-4 flex-grow whitespace-pre-line font-medium leading-relaxed ${hasTitle ? 'line-clamp-6' : 'line-clamp-[8] text-base'}`}>
        {note.content || '无内容...'}
      </p>

      <div className="mt-auto pt-2 space-y-3">
        {hasTags && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((tag, idx) => (
              <span key={idx} className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${tagStyle}`}>
                <Tag size={8} /> {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center text-xs opacity-40 font-mono">
          <Clock size={10} className="mr-1" />
          {new Date(note.updatedAt).toLocaleDateString('zh-CN')}
        </div>
      </div>
    </div>
  );
};