import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface DialogBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  placeholder?: string;
  initialValue?: string;
}

const DialogBase: React.FC<DialogBaseProps> = ({ isOpen, onClose, title, children }) => {
  const [show, setShow] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      requestAnimationFrame(() => setAnimate(true));
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div
        className={`absolute inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-xl transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div className={`
        relative w-full max-w-xs bg-white/95 dark:bg-[#111]/95 backdrop-blur-2xl
        rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)]
        border border-black/[0.06] dark:border-white/[0.06]
        transform transition-all duration-400 cubic-bezier(0.34, 1.56, 0.64, 1) origin-center
        ${animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4'}
      `}>
        <div className="p-6 text-center">
          <h3 className="text-[17px] font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, onClose, onConfirm, title, message,
  confirmText = "确认", cancelText = "取消", isDangerous = false
}) => {
  return (
    <DialogBase isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {message}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-2xl
            bg-black/[0.05] dark:bg-white/[0.08]
            text-slate-600 dark:text-slate-300
            font-semibold text-[14px] active:scale-95 transition-all"
        >
          {cancelText}
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`
            flex-1 py-3 rounded-2xl font-bold text-[14px] shadow-lg active:scale-95 transition-all
            ${isDangerous
              ? 'bg-red-500 text-white shadow-red-500/30 hover:bg-red-600'
              : 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-slate-900/20'}
          `}
        >
          {confirmText}
        </button>
      </div>
    </DialogBase>
  );
};

export const InputDialog: React.FC<InputDialogProps> = ({
  isOpen, onClose, onConfirm, title, placeholder, initialValue = ''
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = () => {
    if (!value.trim()) return;
    onConfirm(value);
    onClose();
  };

  return (
    <DialogBase isOpen={isOpen} onClose={onClose} title={title}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black/[0.04] dark:bg-white/[0.06]
          border border-transparent focus:border-blue-500/40 dark:focus:border-blue-400/40
          rounded-2xl px-4 py-3 text-[15px] text-slate-900 dark:text-white outline-none mb-6
          transition-all text-center font-medium placeholder:font-normal
          placeholder:text-slate-300 dark:placeholder:text-slate-600"
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-2xl
            bg-black/[0.05] dark:bg-white/[0.08]
            text-slate-600 dark:text-slate-300
            font-semibold text-[14px] active:scale-95 transition-all"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="flex-1 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black
            font-bold text-[14px] shadow-lg shadow-slate-900/20
            active:scale-95 transition-all disabled:opacity-40 disabled:scale-100"
        >
          确认
        </button>
      </div>
    </DialogBase>
  );
};
