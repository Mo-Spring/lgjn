// ============================================================
// components/Dialogs.tsx — 灵感胶囊风格确认弹窗
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        className="relative w-full max-w-sm rounded-3xl p-7 animate-mi-editor-in"
        style={{ background: 'var(--mi-card)', boxShadow: 'var(--mi-shadow-float)' }}
      >
        <div className="flex items-center gap-3.5 mb-5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: variant === 'danger' ? '#FFE8E8' : '#E8F2FF' }}
          >
            <AlertTriangle className="w-6 h-6" style={{ color: variant === 'danger' ? '#FF4444' : '#3B82F6' }} />
          </div>
          <h3 className="text-xl font-semibold" style={{ color: 'var(--mi-text-primary)' }}>{title}</h3>
        </div>
        <p className="text-[15px] mb-7 leading-relaxed" style={{ color: 'var(--mi-text-secondary)' }}>
          {message}
        </p>
        <div className="flex gap-3.5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-[15px] font-medium active:opacity-80 transition-opacity"
            style={{ background: 'var(--mi-bg)', color: 'var(--mi-text-primary)' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-[15px] font-medium text-white active:opacity-80 transition-opacity"
            style={{
              background: variant === 'danger'
                ? 'linear-gradient(135deg, #FF5555, #DD3333)'
                : 'linear-gradient(135deg, #FF8533, #FF6A00)',
              boxShadow: variant === 'danger'
                ? '0 2px 8px rgba(255, 68, 68, 0.3)'
                : '0 2px 8px rgba(255, 106, 0, 0.3)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
