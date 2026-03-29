import React from 'react';
import { Note } from '../types';
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';

interface TrashViewProps {
  isOpen: boolean;
  trashedNotes: Note[];
  onClose: () => void;
  onRestore: (id: string) => void;
  onDeleteForever: (id: string) => void;
  onEmptyTrash: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({
  isOpen, trashedNotes, onClose, onRestore, onDeleteForever, onEmptyTrash
}) => {
  const [animate, setAnimate] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
      });
      document.body.style.overflow = 'hidden';
    } else {
      setAnimate(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = '';
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const formatDeletedTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 30) return `${days} 天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center">
      <div
        className={`absolute inset-0 bg-black/30 dark:bg-black/80 backdrop-blur-xl transition-opacity duration-400 ${animate ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`relative w-full sm:w-[600px] h-[85vh] sm:h-[80vh]
          bg-white dark:bg-[#0A0A0A]
          rounded-t-[28px] sm:rounded-[28px]
          shadow-[0_-20px_80px_rgba(0,0,0,0.2)] dark:shadow-[0_-20px_80px_rgba(0,0,0,0.8)]
          flex flex-col overflow-hidden
          ring-1 ring-black/10 dark:ring-white/[0.06]
          transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
          ${animate ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-[100%] scale-95 opacity-80'}`}
      >
        {/* Drag Handle */}
        <div className="absolute top-0 left-0 right-0 h-6 flex justify-center pt-2.5 z-10 pointer-events-none">
          <div className="w-10 h-[5px] rounded-full bg-black/10 dark:bg-white/10"></div>
        </div>

        {/* Header */}
        <div className="flex-none flex items-center justify-between px-5 pt-5 pb-3 border-b border-black/[0.04] dark:border-white/[0.04]">
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center
              bg-black/[0.04] dark:bg-white/[0.06] text-slate-500 dark:text-slate-400
              hover:bg-black/[0.08] dark:hover:bg-white/[0.08] active:scale-90 transition-all">
            <X size={18} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">回收站</h2>
            {trashedNotes.length > 0 && (
              <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500
                bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 rounded-full tabular-nums">
                {trashedNotes.length}
              </span>
            )}
          </div>
          {trashedNotes.length > 0 ? (
            <button onClick={onEmptyTrash}
              className="text-[13px] font-semibold text-red-500 hover:text-red-600 transition-colors">
              清空
            </button>
          ) : <div className="w-9" />}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {trashedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-slate-100 to-slate-50 dark:from-white/[0.06] dark:to-white/[0.02]
                flex items-center justify-center mb-5 border border-black/[0.04] dark:border-white/[0.04]">
                <Trash2 size={32} className="text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
              </div>
              <p className="text-slate-300 dark:text-slate-600 text-[13px] font-medium">回收站是空的</p>
            </div>
          ) : (
            trashedNotes.map(note => (
              <div
                key={note.id}
                className="flex items-start gap-3 p-4
                  bg-black/[0.02] dark:bg-white/[0.03]
                  rounded-2xl border border-black/[0.03] dark:border-white/[0.03]
                  group hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  {note.title && (
                    <h3 className="font-semibold text-[14px] text-slate-700 dark:text-slate-200 truncate mb-1">
                      {note.title}
                    </h3>
                  )}
                  <p className="text-[13px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                    {note.content || '空白内容'}
                  </p>
                  <p className="text-[11px] text-slate-300 dark:text-slate-600 mt-2">
                    删除于 {formatDeletedTime(note.deletedAt!)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onRestore(note.id)}
                    className="p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10
                      text-slate-300 hover:text-emerald-500 transition-all"
                    title="恢复"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <button
                    onClick={() => onDeleteForever(note.id)}
                    className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10
                      text-slate-300 hover:text-red-500 transition-all"
                    title="永久删除"
                  >
                    <AlertTriangle size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
