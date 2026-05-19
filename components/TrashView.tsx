// ============================================================
// components/TrashView.tsx — 灵感胶囊风格回收站
// ============================================================

import React, { useState } from 'react';
import { ArrowLeft, Trash2, RotateCcw, X } from 'lucide-react';
import type { Note } from '../types';

interface Props {
  notes: Note[];
  isOpen: boolean;
  onClose: () => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
}

export function TrashView({
  notes,
  isOpen,
  onClose,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
}: Props) {
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col animate-mi-page-in" style={{ background: 'var(--mi-bg)' }}>
      {/* 头部 */}
      <div
        className="flex items-center justify-between px-5 py-4 pt-safe"
        style={{ background: 'var(--mi-bg)', borderBottom: '1px solid var(--mi-border)' }}
      >
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--mi-text-primary)' }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--mi-text-primary)' }}>回收站</h1>
        {notes.length > 0 ? (
          <button
            onClick={() => setConfirmEmpty(true)}
            className="text-[14px] font-medium"
            style={{ color: '#FF4444' }}
          >
            清空
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--mi-text-tertiary)' }}>
            <Trash2 className="w-14 h-14 mb-4 opacity-30" />
            <p className="text-[15px]">回收站是空的</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="flex items-center gap-3.5 p-4 rounded-2xl"
              style={{ background: 'var(--mi-card)', boxShadow: 'var(--mi-shadow)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium truncate" style={{ color: 'var(--mi-text-primary)' }}>
                  {note.title || '无标题'}
                </p>
                <p className="text-[12px] mt-1" style={{ color: 'var(--mi-text-tertiary)' }}>
                  删除于 {formatDeleteTime(note.deletedAt!)}
                </p>
              </div>
              <button
                onClick={() => onRestore(note.id)}
                className="w-9 h-9 rounded-full flex items-center justify-center active:bg-blue-100 dark:active:bg-blue-900/30 transition-colors"
                style={{ background: 'var(--mi-bg)', color: '#3B82F6' }}
              >
                <RotateCcw className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => onPermanentDelete(note.id)}
                className="w-9 h-9 rounded-full flex items-center justify-center active:bg-red-100 dark:active:bg-red-900/30 transition-colors"
                style={{ background: 'var(--mi-bg)', color: '#FF4444' }}
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* 清空确认 */}
      {confirmEmpty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmEmpty(false)} />
          <div
            className="relative w-full max-w-sm rounded-3xl p-7 animate-mi-editor-in"
            style={{ background: 'var(--mi-card)', boxShadow: 'var(--mi-shadow-float)' }}
          >
            <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--mi-text-primary)' }}>
              清空回收站？
            </h3>
            <p className="text-[15px] mb-7 leading-relaxed" style={{ color: 'var(--mi-text-secondary)' }}>
              将永久删除 {notes.length} 条胶囊，此操作无法撤销
            </p>
            <div className="flex gap-3.5">
              <button
                onClick={() => setConfirmEmpty(false)}
                className="flex-1 py-3 rounded-xl text-[15px] font-medium active:opacity-80 transition-opacity"
                style={{ background: 'var(--mi-bg)', color: 'var(--mi-text-primary)' }}
              >
                取消
              </button>
              <button
                onClick={() => { onEmptyTrash(); setConfirmEmpty(false); }}
                className="flex-1 py-3 rounded-xl text-[15px] font-medium text-white active:opacity-80 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #FF5555, #DD3333)', boxShadow: '0 2px 8px rgba(255, 68, 68, 0.3)' }}
              >
                清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDeleteTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}
