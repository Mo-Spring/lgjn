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

  const SettingItem = ({ icon, iconBg, iconColor, title, subtitle, onClick }: {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    title: string;
    subtitle?: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3.5
        rounded-2xl active:scale-[0.98] transition-all
        hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center`}>
          {icon}
        </div>
        <div className="text-left">
          <div className="text-[14px] font-semibold text-slate-900 dark:text-white">{title}</div>
          {subtitle && <div className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
      </div>
      <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-xl transition-opacity" onClick={onClose} />
      <div className="bg-white/95 dark:bg-[#111]/95 backdrop-blur-2xl w-full max-w-sm
        rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)]
        border border-black/[0.06] dark:border-white/[0.06]
        relative animate-enter overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between">
          {section === 'categories' ? (
            <button onClick={() => setSection('main')}
              className="text-[13px] font-semibold text-blue-500 hover:text-blue-600 transition-colors">
              返回
            </button>
          ) : <div className="w-10" />}
          <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">
            {section === 'main' ? '设置' : '管理分类'}
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/[0.05] dark:bg-white/[0.08]
              flex items-center justify-center text-slate-400 active:scale-90 transition-all">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {section === 'main' ? (
          <div className="px-4 pb-5 space-y-1">
            <SettingItem
              icon={<Tag size={16} />}
              iconBg="bg-violet-50 dark:bg-violet-500/10"
              iconColor="text-violet-500 dark:text-violet-400"
              title="管理分类"
              subtitle={`${categories.length} 个分类`}
              onClick={() => setSection('categories')}
            />
            <SettingItem
              icon={<Trash2 size={16} />}
              iconBg="bg-red-50 dark:bg-red-500/10"
              iconColor="text-red-500 dark:text-red-400"
              title="回收站"
              subtitle={trashedCount > 0 ? `${trashedCount} 条已删除` : '空空如也'}
              onClick={onOpenTrash}
            />

            <div className="h-px bg-black/[0.04] dark:bg-white/[0.04] my-2 mx-3" />

            <SettingItem
              icon={<Download size={16} />}
              iconBg="bg-blue-50 dark:bg-blue-500/10"
              iconColor="text-blue-500 dark:text-blue-400"
              title="导出数据"
              subtitle="保存为 JSON 文件"
              onClick={onExport}
            />
            <SettingItem
              icon={<Upload size={16} />}
              iconBg="bg-amber-50 dark:bg-amber-500/10"
              iconColor="text-amber-500 dark:text-amber-400"
              title="恢复数据"
              subtitle="从 JSON 文件导入"
              onClick={() => fileInputRef.current?.click()}
            />
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            <div className="mx-3 mt-3 p-3 bg-blue-50/80 dark:bg-blue-500/[0.06] rounded-2xl flex items-start gap-2.5">
              <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-blue-500/80 dark:text-blue-400/60 leading-relaxed">
                数据存储在本地浏览器中，请定期导出备份。
              </p>
            </div>
          </div>
        ) : (
          <div className="px-4 pb-5 space-y-1 max-h-[60vh] overflow-y-auto no-scrollbar">
            {categories.length === 0 ? (
              <div className="text-center py-12 text-slate-300 dark:text-slate-600 text-[13px]">
                暂无分类
              </div>
            ) : (
              categories.map(cat => (
                <div key={cat.id}
                  className="flex items-center gap-2 px-3.5 py-3 rounded-2xl group
                    hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors">
                  {editingCatId === cat.id ? (
                    <input
                      ref={editInputRef}
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setEditingCatId(null); }}
                      onBlur={confirmRename}
                      className="flex-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl px-3 py-2 text-[14px]
                        text-slate-900 dark:text-white outline-none border border-blue-400/40 transition-all"
                    />
                  ) : (
                    <>
                      <span className="flex-1 text-[14px] font-medium text-slate-700 dark:text-slate-200 truncate">
                        {cat.name}
                      </span>
                      <button onClick={() => startRename(cat)}
                        className="p-2 rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.08]
                          text-slate-300 hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100"
                        title="重命名">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => onDeleteCategory(cat.id)}
                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10
                          text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        title="删除">
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
