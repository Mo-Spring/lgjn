// ============================================================
// components/TrashView.tsx — 小米笔记风格回收站
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
        className="flex items-center justify-between px-4 py-3 pt-safe"
        style={{ background: 'var(--mi-bg)', borderBottom: '1px solid var(--mi-border)' }}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--mi-text-primary)' }} />
        </button>
        <h1 className="text-base font-semibold" style={{ color: 'var(--mi-text-primary)' }}>回收站</h1>
        {notes.length > 0 ? (
          <button
            onClick={() => setConfirmEmpty(true)}
            className="text-sm font-medium"
            style={{ color: '#FF4444' }}
          >
            清空
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--mi-text-tertiary)' }}>
            <Trash2 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">回收站是空的</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="flex items-center gap-3 p-3.5 rounded-xl"
              style={{ background: 'var(--mi-card)', border: '1px solid var(--mi-border)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--mi-text-primary)' }}>
                  {note.title || '无标题'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--mi-text-tertiary)' }}>
                  删除于 {formatDeleteTime(note.deletedAt!)}
                </p>
              </div>
              <button
                onClick={() => onRestore(note.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center active:bg-blue-100 dark:active:bg-blue-900/30 transition-colors"
                style={{ background: 'var(--mi-bg)', color: '#3B82F6' }}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPermanentDelete(note.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center active:bg-red-100 dark:active:bg-red-900/30 transition-colors"
                style={{ background: 'var(--mi-bg)', color: '#FF4444' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* 清空确认 */}
      {confirmEmpty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmEmpty(false)} />
          <div
            className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-mi-editor-in"
            style={{ background: 'var(--mi-card)' }}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--mi-text-primary)' }}>
              清空回收站？
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--mi-text-secondary)' }}>
              将永久删除 {notes.length} 条笔记，此操作无法撤销
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmEmpty(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium active:opacity-80 transition-opacity"
                style={{ background: 'var(--mi-bg)', color: 'var(--mi-text-primary)' }}
              >
                取消
              </button>
              <button
                onClick={() => { onEmptyTrash(); setConfirmEmpty(false); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white active:opacity-80 transition-opacity"
                style={{ background: '#FF4444' }}
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
