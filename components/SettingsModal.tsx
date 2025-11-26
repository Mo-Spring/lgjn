import React, { useRef } from 'react';
import { X, Download, Upload, Database, AlertTriangle } from 'lucide-react';

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
        className="absolute inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl relative transform transition-all animate-in fade-in zoom-in-95 border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Database size={18} className="text-slate-500" />
            数据管理
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-2">
                    <Download size={16} /> 导出备份
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3 leading-relaxed">
                    将所有灵感胶囊打包成一个 JSON 文件保存到您的设备上。建议定期备份。
                </p>
                <button 
                    onClick={onExport}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-[0.98]"
                >
                    下载备份文件
                </button>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/50">
                <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-1 flex items-center gap-2">
                    <Upload size={16} /> 导入恢复
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-300 mb-3 leading-relaxed">
                    从备份文件中恢复灵感胶囊。
                    <span className="block mt-1 text-xs opacity-80 flex items-center gap-1">
                        <AlertTriangle size={10} /> 注意：这也将合并现有数据。
                    </span>
                </p>
                <input 
                    type="file" 
                    accept=".json" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    className="hidden" 
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 bg-amber-100 dark:bg-amber-800 hover:bg-amber-200 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 rounded-lg text-sm font-medium transition-colors border border-amber-200 dark:border-amber-700 active:scale-[0.98]"
                >
                    选择备份文件导入
                </button>
            </div>
          </div>
          <p className="text-xs text-center text-slate-400 dark:text-slate-500">
             数据目前存储在您的浏览器本地缓存中。
          </p>
        </div>
      </div>
    </div>
  );
};