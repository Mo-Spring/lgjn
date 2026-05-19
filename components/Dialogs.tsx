// ============================================================
// components/Dialogs.tsx — 小米笔记风格确认弹窗
// ============================================================

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-mi-editor-in"
        style={{ background: 'var(--mi-card)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: variant === 'danger' ? '#FFE8E8' : '#E8F2FF' }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: variant === 'danger' ? '#FF4444' : '#3B82F6' }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--mi-text-primary)' }}>{title}</h3>
        </div>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--mi-text-secondary)' }}>
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium active:opacity-80 transition-opacity"
            style={{ background: 'var(--mi-bg)', color: 'var(--mi-text-primary)' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white active:opacity-80 transition-opacity"
            style={{ background: variant === 'danger' ? '#FF4444' : 'var(--mi-orange)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
