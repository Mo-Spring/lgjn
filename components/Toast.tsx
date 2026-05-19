// ============================================================
// components/Toast.tsx — 灵感胶囊风格 Toast 通知
// ============================================================

import React, { useEffect, useState } from 'react';
import type { ToastMessage } from '../types';

interface Props {
  toasts: ToastMessage[];
}

export function ToastContainer({ toasts }: Props) {
  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse gap-2.5 items-center pointer-events-none">
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
        px-6 py-3 rounded-2xl text-[14px] shadow-lg
        flex items-center gap-3.5 max-w-xs pointer-events-auto
        ${isExiting ? 'animate-mi-toast-out' : 'animate-mi-toast-in'}
      `}
      style={{
        background: 'var(--mi-card)',
        color: 'var(--mi-text-primary)',
        boxShadow: 'var(--mi-shadow-lg)',
      }}
    >
      <span>{toast.message}</span>
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="text-[13px] font-semibold whitespace-nowrap"
          style={{ color: 'var(--mi-orange)' }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
