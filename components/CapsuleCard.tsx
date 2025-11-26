
import React, { useRef, useState } from 'react';
import { Note, CapsuleColor } from '../types';
import { Clock, Trash2, CheckCircle2, Circle } from 'lucide-react';

interface CapsuleCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onDelete?: (id: string) => void;
  viewMode: 'grid' | 'list';
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

const colorStyles: Record<CapsuleColor, string> = {
  blue:   'bg-blue-50 border-blue-200 text-blue-900 hover:border-blue-300 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-100 dark:hover:border-blue-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-900 hover:border-purple-300 dark:bg-purple-950/40 dark:border-purple-900 dark:text-purple-100 dark:hover:border-purple-700',
  green:  'bg-emerald-50 border-emerald-200 text-emerald-900 hover:border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-100 dark:hover:border-emerald-700',
  rose:   'bg-rose-50 border-rose-200 text-rose-900 hover:border-rose-300 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-100 dark:hover:border-rose-700',
  amber:  'bg-amber-50 border-amber-200 text-amber-900 hover:border-amber-300 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-100 dark:hover:border-amber-700',
  slate:  'bg-white border-slate-200 text-slate-900 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:hover:border-slate-700',
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
  
  // 增大按钮宽度，适应手机操作
  const DELETE_BTN_WIDTH = 100; 
  
  // 状态
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // 使用 ref 记录触摸起始数据，避免闭包陷阱和状态更新延迟
  const touchStartX = useRef<number | null>(null);
  const startTranslateX = useRef<number>(0);

  // 触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSelectionMode) return;
    touchStartX.current = e.touches[0].clientX;
    startTranslateX.current = translateX; // 记录按下时的位置（可能是0，也可能是已展开状态）
    setIsDragging(false);
  };

  // 触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isSelectionMode || touchStartX.current === null) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    
    // 计算目标位置：起始位置 + 移动距离
    let newTranslate = startTranslateX.current + diff;

    // 边界限制：
    // 不能向右滑超过0（关闭状态）
    // 不能向左滑超过按钮宽度（完全展开状态）
    if (newTranslate > 0) newTranslate = 0;
    if (newTranslate < -DELETE_BTN_WIDTH) newTranslate = -DELETE_BTN_WIDTH;

    setIsDragging(true);
    setTranslateX(newTranslate);
  };

  // 触摸结束
  const handleTouchEnd = () => {
    if (isSelectionMode) return;
    touchStartX.current = null;
    setIsDragging(false);

    // 吸附逻辑：如果拉动超过按钮宽度的一半，则自动展开；否则回弹关闭
    if (translateX < -(DELETE_BTN_WIDTH / 2)) {
        setTranslateX(-DELETE_BTN_WIDTH);
    } else {
        setTranslateX(0);
    }
  };

  // 点击卡片本体
  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.stopPropagation();
      onToggleSelect(note.id);
      return;
    }

    // 如果处于打开状态，点击任意位置都是关闭
    if (translateX !== 0) {
        e.stopPropagation();
        setTranslateX(0);
        return;
    }

    onClick(note);
  };

  // 点击删除按钮
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止冒泡
    if (onDelete) {
        // 增加震动反馈
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
        onDelete(note.id);
    }
    setTranslateX(0);
  };

  // 复选框
  const renderCheckbox = () => {
    if (!isSelectionMode) return null;
    return (
      <div className={`absolute top-2 right-2 z-20 transition-transform duration-200 ${isSelected ? 'scale-110' : 'scale-100'}`}>
        {isSelected ? (
          <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-900/20" />
        ) : (
          <Circle className="w-6 h-6 text-slate-400 dark:text-slate-500" />
        )}
      </div>
    );
  };

  const selectionBorderClass = isSelectionMode && isSelected 
    ? 'ring-2 ring-blue-500 dark:ring-blue-400 border-transparent' 
    : '';

  // 列表视图内容
  const renderListContent = () => (
    <div className={`flex flex-col gap-0.5 ${isSelectionMode ? 'pr-8' : ''}`}>
      {hasTitle ? (
        <>
            <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-base truncate leading-snug flex-1">{note.title}</h3>
                <span className="text-[10px] opacity-40 font-mono flex-shrink-0 whitespace-nowrap">
                    {new Date(note.updatedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                </span>
            </div>
            <p className="text-sm opacity-70 line-clamp-1 leading-snug font-medium pr-2">
                {note.content || '无内容'}
            </p>
        </>
      ) : (
        <div className="flex items-start justify-between gap-2">
            <p className="text-base font-medium opacity-90 line-clamp-2 leading-snug flex-1">
                {note.content || '无内容'}
            </p>
            <span className="text-[10px] opacity-40 font-mono flex-shrink-0 whitespace-nowrap mt-1">
                {new Date(note.updatedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
            </span>
        </div>
      )}
    </div>
  );

  // 网格视图内容
  const renderGridContent = () => (
    <>
      {hasTitle && (
          <h3 className={`font-bold text-lg mb-2 leading-tight ${isSelectionMode ? 'pr-6' : ''}`}>{note.title}</h3>
      )}
      
      <p className={`text-sm opacity-80 mb-4 flex-grow whitespace-pre-line font-medium leading-relaxed ${hasTitle ? 'line-clamp-6' : 'line-clamp-[8] text-base'} ${isSelectionMode && !hasTitle ? 'pr-6' : ''}`}>
        {note.content || '无内容...'}
      </p>

      <div className="mt-auto pt-2 flex items-center justify-between">
        <div className="flex items-center text-xs opacity-40 font-mono">
          <Clock size={10} className="mr-1" />
          {new Date(note.updatedAt).toLocaleDateString('zh-CN')}
        </div>
      </div>
    </>
  );

  // 公共样式
  const containerClasses = viewMode === 'list'
    ? `px-4 py-3 min-h-[4.5rem] flex flex-col justify-center`
    : `p-5 h-full flex flex-col min-h-[160px]`;

  return (
    <div className={`relative w-full rounded-xl overflow-hidden group ${viewMode === 'grid' ? 'h-full' : ''}`}>
        {/* 背景层：删除按钮 */}
        <div className="absolute inset-y-0 right-0 bg-red-600 flex items-center justify-center rounded-xl" style={{ width: DELETE_BTN_WIDTH }}>
             <button 
                onClick={handleDeleteClick}
                className="w-full h-full flex flex-col items-center justify-center text-white active:bg-red-700 transition-colors"
             >
                <Trash2 size={28} />
             </button>
        </div>

        {/* 前景层：卡片内容 */}
        <div 
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`
                relative bg-white dark:bg-slate-900 border transition-transform
                ${isDragging ? 'duration-0' : 'duration-300 ease-out'} 
                ${styles} ${selectionBorderClass} ${containerClasses} rounded-xl
                shadow-sm active:scale-[0.99] z-10
            `}
            style={{ 
                transform: `translateX(${translateX}px)`,
                WebkitUserSelect: 'none',
                touchAction: 'pan-y' // 允许垂直滚动，接管水平滑动
            }}
        >
            {renderCheckbox()}
            {viewMode === 'list' ? renderListContent() : renderGridContent()}
        </div>
    </div>
  );
};
