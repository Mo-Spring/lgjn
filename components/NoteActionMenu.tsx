// ============================================================
// components/NoteActionMenu.tsx — 灵感胶囊风格操作菜单
// ============================================================

import React from 'react';
import { Pin, Trash2, Copy, Edit3, CheckSquare } from 'lucide-react';

interface Props {
  isVisible: boolean;
  isPinned: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onSelect: () => void;
}

export function NoteActionMenu({
  isVisible,
  isPinned,
  position,
  onClose,
  onTogglePin,
  onDelete,
  onCopy,
  onEdit,
  onSelect,
}: Props) {
  if (!isVisible) return null;

  const items = [
    {
      icon: Pin,
      label: isPinned ? '取消置顶' : '置顶',
      onClick: () => { onTogglePin(); onClose(); },
      fill: isPinned,
      color: isPinned ? 'var(--mi-orange)' : undefined,
    },
    { icon: Edit3, label: '编辑', onClick: () => { onEdit(); onClose(); } },
    { icon: Copy, label: '复制', onClick: () => { onCopy(); onClose(); } },
    { icon: CheckSquare, label: '多选', onClick: () => { onSelect(); onClose(); } },
    { icon: Trash2, label: '删除', onClick: () => { onDelete(); onClose(); }, danger: true },
  ];

  return (
    <>
      {/* 透明遮罩 */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className="fixed z-50 w-44 rounded-2xl py-2 overflow-hidden animate-mi-slide-up"
        style={{
          top: Math.min(position.y, window.innerHeight - 340),
          left: Math.min(position.x, window.innerWidth - 200),
          background: 'var(--mi-card)',
          boxShadow: 'var(--mi-shadow-float)',
        }}
      >
        {items.map(({ icon: Icon, label, onClick, danger, fill, color }) => (
          <button
            key={label}
            onClick={onClick}
            className="w-full flex items-center gap-3.5 px-5 py-3 text-[15px] active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors"
            style={{ color: danger ? '#FF4444' : color || 'var(--mi-text-primary)' }}
          >
            <Icon className={`w-5 h-5 ${fill ? 'fill-current' : ''}`} />
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
