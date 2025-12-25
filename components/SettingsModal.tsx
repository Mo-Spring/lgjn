import React, { useRef } from 'react';
import { X, Download, Upload, Info } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onExport, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-sm rounded-2xl shadow-2xl relative animate-enter overflow-hidden">
        
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white">
            设置
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">数据备份</h3>
            
            <button 
                onClick={onExport}
                className="w-full flex items-center gap-3 p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl text-left active:scale-95 transition-transform"
            >
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Download size={16} />
                </div>
                <div>
                    <div className="text-[15px] font-medium text-slate-900 dark:text-white">导出数据</div>
                    <div className="text-[13px] text-slate-500 dark:text-slate-400">保存为 JSON 文件</div>
                </div>
            </button>

            <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl text-left active:scale-95 transition-transform"
            >
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Upload size={16} />
                </div>
                <div>
                    <div className="text-[15px] font-medium text-slate-900 dark:text-white">恢复数据</div>
                    <div className="text-[13px] text-slate-500 dark:text-slate-400">从 JSON 文件导入</div>
                </div>
            </button>
            <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                className="hidden" 
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
             <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
             <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                所有数据均存储在您的本地浏览器中。请定期导出备份以防数据丢失。
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
