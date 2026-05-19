// ============================================================
// components/CapsuleCard.tsx — 小米笔记风格卡片
// 瀑布流布局、滑动删除、长按菜单、搜索高亮
// ============================================================

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Pin, Trash2, Check } from 'lucide-react';
import type { Note, Category } from '../types';

interface Props {
  note: Note;
  categories: Category[];
  viewMode: 'grid' | 'list';
  isSelectionMode: boolean;
  isSelected: boolean;
  searchQuery: string;
  onTap: (note: Note) => void;
  onLongPress: (note: Note) => void;
  onMenu: (note: Note, position: { x: number; y: number }) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleSelect: (id: string) => void;
}

const colorClass: Record<string, string> = {
  default: 'mi-card-default',
  yellow: 'mi-card-yellow',
  green: 'mi-card-green',
  blue: 'mi-card-blue',
  purple: 'mi-card-purple',
  pink: 'mi-card-pink',
  orange: 'mi-card-orange',
  red: 'mi-card-red',
};

/** 高亮搜索关键词 */
function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return text;

  const parts: React.ReactNode[] = [];
  let last = 0;
  let pos = lower.indexOf(q, last);
  while (pos !== -1) {
    if (pos > last) parts.push(text.slice(last, pos));
    parts.push(
      <mark key={pos} className="bg-yellow-200/70 dark:bg-yellow-600/40 rounded px-0.5">
        {text.slice(pos, pos + q.length)}
      </mark>
    );
    last = pos + q.length;
    pos = lower.indexOf(q, last);
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function CapsuleCard({
  note,
  categories,
  viewMode,
  isSelectionMode,
  isSelected,
  searchQuery,
  onTap,
  onLongPress,
  onMenu,
  onTogglePin,
  onDelete,
  onToggleSelect,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchMovedRef = useRef(false);
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeRef = useRef<{ startX: number; currentX: number } | null>(null);

  const category = categories.find((c) => c.id === note.category);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearLongPress();
  }, [clearLongPress]);

  // ── 触摸事件 ──
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      touchMovedRef.current = false;
      swipeRef.current = { startX: touch.clientX, currentX: touch.clientX };

      clearLongPress();
      longPressTimer.current = window.setTimeout(() => {
        if (!touchMovedRef.current) {
          if (isSelectionMode) {
            onToggleSelect(note.id);
          } else {
            const t = touchStartRef.current;
            if (t) onMenu(note, { x: t.x, y: t.y });
          }
        }
      }, 500);
    },
    [note, isSelectionMode, onMenu, onToggleSelect, clearLongPress]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touchStartRef.current) {
        const dx = Math.abs(touch.clientX - touchStartRef.current.x);
        const dy = Math.abs(touch.clientY - touchStartRef.current.y);
        if (dx > 10 || dy > 10) {
          touchMovedRef.current = true;
          clearLongPress();
        }
      }

      if (swipeRef.current) {
        swipeRef.current.currentX = touch.clientX;
        const delta = swipeRef.current.currentX - swipeRef.current.startX;
        if (delta < 0) {
          setIsSwiping(true);
          setSwipeX(Math.max(delta, -100));
        }
      }
    },
    [clearLongPress]
  );

  const handleTouchEnd = useCallback(() => {
    clearLongPress();
    touchStartRef.current = null;
    swipeRef.current = null;

    if (isSwiping) {
      if (swipeX < -60) {
        onDelete(note.id);
      }
      setSwipeX(0);
      setIsSwiping(false);
    }
  }, [isSwiping, swipeX, note.id, onDelete, clearLongPress]);

  const handleClick = useCallback(() => {
    if (isSelectionMode) {
      onToggleSelect(note.id);
    } else {
      onTap(note);
    }
  }, [note, isSelectionMode, onTap, onToggleSelect]);

  const bgClass = colorClass[note.color] || colorClass.default;

  return (
    <div className="relative overflow-hidden rounded-xl break-inside-avoid mb-2.5">
      {/* 滑动删除背景 */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center rounded-xl"
        style={{ width: 80, background: '#FF4444' }}
      >
        <Trash2 className="w-5 h-5 text-white" />
      </div>

      <div
        ref={cardRef}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          ${bgClass}
          rounded-xl p-3.5 cursor-pointer
          transition-all duration-200 ease-out
          select-none touch-pan-y
          ${viewMode === 'grid' ? '' : 'flex gap-3'}
          ${isSelected ? 'ring-2 ring-offset-1' : ''}
        `}
        style={{
          transform: isSwiping ? `translateX(${swipeX}px)` : undefined,
          transition: isSwiping ? 'none' : undefined,
          boxShadow: 'var(--mi-shadow)',
          ...(isSelected ? { ringColor: 'var(--mi-orange)', ringOffsetColor: 'var(--mi-bg)' } : {}),
        }}
      >
        {/* 选择指示器 */}
        {isSelectionMode && (
          <div className="absolute top-2.5 right-2.5 animate-mi-check-in">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
              style={{
                background: isSelected ? 'var(--mi-orange)' : 'var(--mi-border)',
                border: isSelected ? 'none' : '2px solid var(--mi-text-tertiary)',
              }}
            >
              {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
          </div>
        )}

        {/* 置顶标记 */}
        {note.pinned && !isSelectionMode && (
          <div className="flex items-center gap-1 mb-2">
            <Pin className="w-3 h-3 fill-current" style={{ color: 'var(--mi-orange)' }} />
            <span className="text-[10px] font-medium" style={{ color: 'var(--mi-orange)' }}>置顶</span>
          </div>
        )}

        {/* 标题 */}
        {note.title && (
          <h3 className="font-semibold text-sm mb-1.5 line-clamp-2" style={{ color: 'var(--mi-text-primary)' }}>
            {highlightText(note.title, searchQuery)}
          </h3>
        )}

        {/* 内容预览 */}
        {note.content && (
          <p className="text-xs line-clamp-4 leading-relaxed" style={{ color: 'var(--mi-text-secondary)' }}>
            {highlightText(note.content, searchQuery)}
          </p>
        )}

        {/* 底部：分类 + 时间 */}
        <div className="flex items-center justify-between mt-2.5 pt-2" style={{ borderTop: '1px solid var(--mi-divider)' }}>
          {category ? (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--mi-hover)', color: 'var(--mi-text-tertiary)' }}
            >
              {category.name}
            </span>
          ) : (
            <span />
          )}
          <span className="text-[10px]" style={{ color: 'var(--mi-text-tertiary)' }}>
            {formatTime(note.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}天前`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
