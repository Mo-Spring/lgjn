// ============================================================
// hooks/useToast.ts — Toast 通知 Hook（带 undo 支持）
// ============================================================

import { useState, useCallback, useRef } from 'react';
import type { ToastMessage } from '../types';

let toastCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (
      message: string,
      type: ToastMessage['type'] = 'info',
      action?: ToastMessage['action'],
      duration = 3000
    ) => {
      const id = `toast-${++toastCounter}`;
      const toast: ToastMessage = { id, message, type, action, duration };
      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        const timer = window.setTimeout(() => removeToast(id), duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [removeToast]
  );

  const clearAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  return { toasts, addToast, removeToast, clearAll };
}
