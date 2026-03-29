import React, { useEffect, useRef, useState } from 'react';
import { Edit3, Trash2, Tag, Copy } from 'lucide-react';

interface NoteActionMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveCategory: () => void;
  onCopy: () => void;
}

export const NoteActionMenu: React.FC<NoteActionMenuProps> = ({
  isOpen, x, y, onClose, onEdit, onDelete, onMoveCategory, onCopy
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let nx = x;
    let ny = y;
    if (nx + rect.width > vw - 8) nx = vw - rect.width - 8;
    if (ny + rect.height > vh - 8) ny = vh - rect.height - 8;
    if (nx < 8) nx = 8;
    if (ny < 8) ny = 8;
    setPos({ x: nx, y: ny });
  }, [isOpen, x, y]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKey);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { icon: Edit3, label: '编辑', action: onEdit, color: '' },
    { icon: Tag, label: '移动分类', action: onMoveCategory, color: '' },
    { icon: Copy, label: '复制内容', action: onCopy, color: '' },
    { icon: Trash2, label: '删除', action: onDelete, color: 'text-red-500 dark:text-red-400' },
  ];

  return (
    <div className="fixed inset-0 z-[70]" style={{ pointerEvents: 'auto' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div
        ref={menuRef}
        className="absolute z-[71] min-w-[180px] py-1.5
          bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-2xl
          rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.6)]
          border border-black/[0.06] dark:border-white/[0.08] animate-pop overflow-hidden"
        style={{ left: pos.x, top: pos.y }}
      >
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => { item.action(); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium
              transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]
              ${item.color || 'text-slate-700 dark:text-slate-200'}`}
          >
            <item.icon size={15} strokeWidth={2} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
