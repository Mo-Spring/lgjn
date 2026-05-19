// ============================================================
// components/Toast.tsx — 小米笔记风格 Toast 通知
// ============================================================

import React, { useEffect, useState } from 'react';
import type { ToastMessage } from '../types';

interface Props {
  toasts: ToastMessage[];
}

export function ToastContainer({ toasts }: Props) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: ToastMessage }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => setIsExiting(true), toast.duration - 200);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  return (
    <div
      className={`
        px-5 py-2.5 rounded-xl text-sm shadow-lg
        flex items-center gap-3 max-w-xs pointer-events-auto
        ${isExiting ? 'animate-mi-toast-out' : 'animate-mi-toast-in'}
      `}
      style={{
        background: 'var(--mi-card)',
        color: 'var(--mi-text-primary)',
        border: '1px solid var(--mi-border)',
      }}
    >
      <span>{toast.message}</span>
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="text-xs font-semibold whitespace-nowrap"
          style={{ color: 'var(--mi-orange)' }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
