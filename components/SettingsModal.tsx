import React, { useRef, useState } from 'react';
import { X, Download, Upload, Info, Trash2, Edit3, Tag, ChevronRight } from 'lucide-react';
import { Category } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  categories: Category[];
  onRenameCategory: (id: string, newName: string) => void;
  onDeleteCategory: (id: string) => void;
  onOpenTrash: () => void;
  trashedCount: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, onExport, onImport,
  categories, onRenameCategory, onDeleteCategory,
  onOpenTrash, trashedCount
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [section, setSection] = useState<'main' | 'categories'>('main');
  const editInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRename = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditingName(cat.name);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const confirmRename = () => {
    if (editingCatId && editingName.trim()) {
      onRenameCategory(editingCatId, editingName.trim());
    }
    setEditingCatId(null);
    setEditingName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-sm rounded-2xl shadow-2xl relative animate-enter overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          {section === 'categories' ? (
            <button onClick={() => setSection('main')} className="text-[14px] font-medium text-blue-500 hover:text-blue-600 transition-colors">
              ← 返回
            </button>
          ) : <div className="w-10" />}
          <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white">
            {section === 'main' ? '设置' : '管理分类'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
            <X size={18} />
          </button>
        </div>

        {section === 'main' ? (
          <div className="p-5 space-y-5">
            {/* 分类管理入口 */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">分类</h3>
              <button
                onClick={() => setSection('categories')}
                className="w-full flex items-center justify-between p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                    <Tag size={16} />
                  </div>
                  <div className="text-left">
                    <div className="text-[15px] font-medium text-slate-900 dark:text-white">管理分类</div>
                    <div className="text-[13px] text-slate-500 dark:text-slate-400">{categories.length} 个分类</div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            </div>

            {/* 回收站入口 */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">回收站</h3>
              <button
                onClick={onOpenTrash}
                className="w-full flex items-center justify-between p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <Trash2 size={16} />
                  </div>
                  <div className="text-left">
                    <div className="text-[15px] font-medium text-slate-900 dark:text-white">回收站</div>
                    <div className="text-[13px] text-slate-500 dark:text-slate-400">
                      {trashedCount > 0 ? `${trashedCount} 条已删除` : '空空如也'}
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            </div>

            {/* 数据备份 */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">数据备份</h3>
              <button
                onClick={onExport}
                className="w-full flex items-center gap-3 p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl text-left active:scale-[0.98] transition-transform"
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
                className="w-full flex items-center gap-3 p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl text-left active:scale-[0.98] transition-transform"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Upload size={16} />
                </div>
                <div>
                  <div className="text-[15px] font-medium text-slate-900 dark:text-white">恢复数据</div>
                  <div className="text-[13px] text-slate-500 dark:text-slate-400">从 JSON 文件导入（覆盖当前数据）</div>
                </div>
              </button>
              <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                所有数据均存储在您的本地浏览器中。请定期导出备份以防数据丢失。
              </p>
            </div>
          </div>
        ) : (
          /* 分类管理 */
          <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
            {categories.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                暂无分类，在主页点击 + 添加
              </div>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-2 p-3 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl group">
                  {editingCatId === cat.id ? (
                    <>
                      <input
                        ref={editInputRef}
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setEditingCatId(null); }}
                        onBlur={confirmRename}
                        className="flex-1 bg-white dark:bg-black/20 rounded-lg px-3 py-1.5 text-[14px] text-slate-900 dark:text-white outline-none border border-blue-400"
                      />
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-[14px] font-medium text-slate-800 dark:text-slate-200 truncate">{cat.name}</span>
                      <button
                        onClick={() => startRename(cat)}
                        className="p-1.5 rounded-full hover:bg-white dark:hover:bg-white/10 text-slate-400 hover:text-blue-500 transition-colors opacity-60 group-hover:opacity-100"
                        title="重命名"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteCategory(cat.id)}
                        className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors opacity-60 group-hover:opacity-100"
                        title="删除分类"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
