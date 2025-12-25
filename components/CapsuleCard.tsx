
import React, { useState, useRef, useEffect } from 'react';
import { Note, CapsuleColor } from '../types';
import { Trash2, MoreHorizontal, Edit3, Check } from 'lucide-react';

interface CapsuleCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onDelete?: (id: string) => void;
  viewMode: 'grid' | 'list';
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

// 高级感配色方案 (Morandi / Architectural Palette)
// 使用更低饱和度、更有质感的颜色
const colorStyles: Record<CapsuleColor, string> = {
  blue:   'bg-[#F0F4F8] dark:bg-[#1E293B] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700', // Fog (Blueish Grey)
  purple: 'bg-[#F3F0F8] dark:bg-[#2D2A3B] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700', // Mauve
  green:  'bg-[#F0F5F1] dark:bg-[#1F2D24] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700', // Sage
  rose:   'bg-[#F8F0F0] dark:bg-[#3B2525] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700', // Clay
  amber:  'bg-[#F8F5F0] dark:bg-[#3B3220] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700', // Sand
  slate:  'bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800', // Cloud/Charcoal
};

// 强调色的小圆点 (用于装饰)
const accentColors: Record<CapsuleColor, string> = {
    blue:   'bg-slate-400',
    purple: 'bg-indigo-300',
    green:  'bg-emerald-700/30',
    rose:   'bg-rose-700/30',
    amber:  'bg-amber-700/30',
    slate:  'bg-slate-700/30',
};

export const CapsuleCard: React.FC<CapsuleCardProps> = ({ 
  note, 
  onClick, 
  onDelete, 
  viewMode, 
  isSelectionMode, 
  isSelected, 
  onToggleSelect 
}) => {
  const styles = colorStyles[note.color];
  const hasTitle = note.title && note.title.trim().length > 0;
  
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (showMenu) {
        // 如果菜单打开，点击卡片其他地方关闭菜单
        setShowMenu(false);
        e.stopPropagation();
        return;
    }

    if (isSelectionMode) {
      onToggleSelect(note.id);
    } else {
      onClick(note);
    }
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onDelete) onDelete(note.id);
  };

  const handleLongPress = () => {
    if (!isSelectionMode) {
        onToggleSelect(note.id);
    }
  };

  // 简单的长按逻辑
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTouchStart = () => {
      timerRef.current = setTimeout(handleLongPress, 500);
  };
  const handleTouchEnd = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div 
        className={`
            relative w-full rounded-[24px] group 
            transition-all duration-300 ease-out
            ${isSelectionMode && isSelected ? 'ring-2 ring-slate-800 dark:ring-white ring-offset-2 ring-offset-[#fafafa] dark:ring-offset-[#050505] transform scale-[0.97]' : 'hover:scale-[1.01] active:scale-[0.99]'}
        `}
    >
        <div 
            onClick={handleCardClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`
                relative z-10 flex flex-col overflow-hidden
                ${styles}
                border border-opacity-60
                rounded-[24px]
                ${viewMode === 'list' ? 'min-h-[5rem]' : 'min-h-[160px] h-full'}
            `}
        >
            {/* 选中状态复选框 */}
            {isSelectionMode && (
                <div className={`absolute top-4 right-4 z-20 flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${isSelected ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 scale-100' : 'border-2 border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-black/20'}`}>
                    {isSelected && <Check size={14} strokeWidth={3} />}
                </div>
            )}
            
            {/* 更多操作按钮 (非选择模式下显示) */}
            {!isSelectionMode && (
                <div className="absolute top-2 right-2 z-20">
                     <button 
                        onClick={handleMenuToggle}
                        className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 sm:opacity-0 opacity-100" // 移动端常显，桌面端hover显
                     >
                        <MoreHorizontal size={18} />
                     </button>
                     
                     {/* 下拉菜单 */}
                     {showMenu && (
                         <div 
                            ref={menuRef}
                            className="absolute right-0 top-8 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-30 animate-enter origin-top-right"
                         >
                            <button 
                                onClick={(e) => { e.stopPropagation(); onClick(note); setShowMenu(false); }}
                                className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                            >
                                <Edit3 size={14} /> 编辑
                            </button>
                            <div className="h-px bg-slate-100 dark:bg-slate-700"></div>
                            <button 
                                onClick={handleDelete}
                                className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                                <Trash2 size={14} /> 删除
                            </button>
                         </div>
                     )}
                </div>
            )}
            
            <div className="p-6 flex flex-col h-full">
                {/* 装饰小点 */}
                {viewMode === 'grid' && <div className={`w-1.5 h-1.5 rounded-full ${accentColors[note.color]} mb-3 opacity-60`}></div>}

                {hasTitle && (
                    <h3 className={`font-bold text-[17px] mb-2 leading-snug tracking-tight text-slate-900 dark:text-slate-100 ${isSelectionMode || !viewMode ? 'pr-6' : ''}`}>
                        {note.title}
                    </h3>
                )}

                <p className={`
                    text-[15px] leading-relaxed opacity-70 flex-grow whitespace-pre-line font-normal font-sans
                    ${!hasTitle ? 'text-[16px] text-slate-800 dark:text-slate-200' : ''}
                    ${viewMode === 'list' ? (hasTitle ? 'line-clamp-1' : 'line-clamp-2') : (hasTitle ? 'line-clamp-5' : 'line-clamp-[7]')}
                    ${isSelectionMode && !hasTitle ? 'pr-8' : ''}
                `}>
                    {note.content || <span className="opacity-30 italic">写点什么...</span>}
                </p>

                {viewMode === 'grid' && (
                    <div className="mt-5 flex items-center justify-between opacity-30">
                         <span className="text-[10px] font-semibold tracking-widest uppercase">
                            {new Date(note.updatedAt).toLocaleDateString('en-US', {month:'short', day:'numeric'})}
                         </span>
                    </div>
                )}
                
                 {viewMode === 'list' && (
                    <div className="absolute bottom-6 right-5 opacity-30">
                         <span className="text-[11px] font-medium tracking-wide">
                            {new Date(note.updatedAt).toLocaleDateString('zh-CN', {month:'numeric', day:'numeric'})}
                         </span>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
