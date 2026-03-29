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
    <div className={`fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center`}>
      <div
        className={`absolute inset-0 bg-black/20 dark:bg-black/70 backdrop-blur-md transition-opacity duration-400 ${animate ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`relative w-full sm:w-[600px] h-[85vh] sm:h-[80vh]
          bg-[#FAFAFA] dark:bg-[#121212]
          rounded-t-[32px] sm:rounded-[32px]
          shadow-[0_-10px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_60px_rgba(0,0,0,0.6)]
          flex flex-col overflow-hidden ring-1 ring-black/5 dark:ring-white/10
          transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
          ${animate ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-[100%] scale-95 opacity-80'}`}
      >
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-5 pt-4 pb-3 border-b border-black/5 dark:border-white/5">
          <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400">
            <X size={20} />
          </button>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            回收站
            {trashedNotes.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">{trashedNotes.length} 条</span>
            )}
          </h2>
          {trashedNotes.length > 0 ? (
            <button
              onClick={onEmptyTrash}
              className="text-[13px] font-semibold text-red-500 hover:text-red-600 transition-colors"
            >
              清空
            </button>
          ) : <div className="w-8" />}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {trashedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-40">
              <div className="w-16 h-16 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={28} className="text-slate-400" strokeWidth={1.5} />
              </div>
              <p className="text-slate-500 text-sm font-medium">回收站是空的</p>
            </div>
          ) : (
            trashedNotes.map(note => (
              <div
                key={note.id}
                className="flex items-start gap-3 p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/5 group"
              >
                <div className="flex-1 min-w-0">
                  {note.title && (
                    <h3 className="font-semibold text-[15px] text-slate-800 dark:text-slate-200 truncate mb-1">
                      {note.title}
                    </h3>
                  )}
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {note.content || '空白内容'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                    删除于 {formatDeletedTime(note.deletedAt!)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onRestore(note.id)}
                    className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-500 transition-colors"
                    title="恢复"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteForever(note.id)}
                    className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                    title="永久删除"
                  >
                    <AlertTriangle size={16} />
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
