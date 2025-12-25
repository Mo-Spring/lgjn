
import React, { useEffect, useRef, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

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
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-[4px] transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Card */}
      <div className={`
        relative w-full max-w-xs bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl 
        rounded-[24px] shadow-2xl border border-white/40 dark:border-white/10
        transform transition-all duration-400 cubic-bezier(0.34, 1.56, 0.64, 1) origin-center
        ${animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4'}
      `}>
        <div className="p-6 text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
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
      <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {message}
      </p>
      <div className="flex gap-3">
        <button 
          onClick={onClose}
          className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-semibold text-[15px] active:scale-95 transition-transform"
        >
          {cancelText}
        </button>
        <button 
          onClick={() => { onConfirm(); onClose(); }}
          className={`
            flex-1 py-3 rounded-xl font-bold text-[15px] shadow-lg active:scale-95 transition-transform
            ${isDangerous 
                ? 'bg-red-500 text-white shadow-red-500/30' 
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
        // Delay focus slightly for animation
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
        className="w-full bg-slate-100 dark:bg-black/20 border border-transparent focus:border-blue-500 dark:focus:border-blue-400 rounded-xl px-4 py-3 text-base text-slate-900 dark:text-white outline-none mb-6 transition-colors text-center font-medium placeholder:font-normal"
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <div className="flex gap-3">
        <button 
          onClick={onClose}
          className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-semibold text-[15px] active:scale-95 transition-transform"
        >
          取消
        </button>
        <button 
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="flex-1 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-[15px] shadow-lg shadow-slate-900/20 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
        >
          确认
        </button>
      </div>
    </DialogBase>
  );
};
