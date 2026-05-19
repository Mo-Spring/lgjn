// ============================================================
// components/CapsuleCard.tsx — 灵感胶囊风格卡片
// 网格/列表两种视图、长按弹出操作菜单、搜索高亮
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

  // ── 触摸事件：仅长按触发菜单 ──
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      touchMovedRef.current = false;

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
    },
    [clearLongPress]
  );

  const handleTouchEnd = useCallback(() => {
    clearLongPress();
    touchStartRef.current = null;
  }, [clearLongPress]);

  // ── 鼠标长按（桌面端） ──
  const mouseTimer = useRef<number | null>(null);
  const mouseDownRef = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      mouseDownRef.current = false;
      mouseTimer.current = window.setTimeout(() => {
        mouseDownRef.current = true;
        if (isSelectionMode) {
          onToggleSelect(note.id);
        } else {
          onMenu(note, { x: e.clientX, y: e.clientY });
        }
      }, 500);
    },
    [note, isSelectionMode, onMenu, onToggleSelect]
  );

  const handleMouseUp = useCallback(() => {
    if (mouseTimer.current !== null) {
      clearTimeout(mouseTimer.current);
      mouseTimer.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (mouseTimer.current !== null) {
      clearTimeout(mouseTimer.current);
      mouseTimer.current = null;
    }
  }, []);

  // ── 点击 ──
  const handleClick = useCallback(() => {
    if (mouseDownRef.current) {
      mouseDownRef.current = false;
      return;
    }
    if (isSelectionMode) {
      onToggleSelect(note.id);
    } else {
      onTap(note);
    }
  }, [note, isSelectionMode, onTap, onToggleSelect]);

  const bgClass = colorClass[note.color] || colorClass.default;

  // ── 列表视图 ──
  if (viewMode === 'list') {
    return (
      <div
        ref={cardRef}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`
          ${bgClass} rounded-2xl p-4.5 cursor-pointer
          transition-all duration-200 ease-out select-none touch-pan-y
          flex items-start gap-3.5
          ${isSelected ? 'ring-2 ring-orange-500/50' : ''}
          active:scale-[0.98]
        `}
        style={{ boxShadow: 'var(--mi-shadow)' }}
      >
        {/* 选择指示器 */}
        {isSelectionMode && (
          <div className="flex-shrink-0 mt-0.5 animate-mi-check-in">
            <div
              className="w-5.5 h-5.5 rounded-full flex items-center justify-center transition-all"
              style={{
                background: isSelected ? 'var(--mi-orange)' : 'transparent',
                border: isSelected ? 'none' : '2px solid var(--mi-text-tertiary)',
              }}
            >
              {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* 置顶标记 */}
          {note.pinned && !isSelectionMode && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <Pin className="w-3.5 h-3.5 fill-current" style={{ color: 'var(--mi-orange)' }} />
              <span className="text-[11px] font-medium" style={{ color: 'var(--mi-orange)' }}>置顶</span>
            </div>
          )}

          {/* 标题 */}
          {note.title && (
            <h3 className="font-semibold text-[15px] mb-1.5 truncate" style={{ color: 'var(--mi-text-primary)' }}>
              {highlightText(note.title, searchQuery)}
            </h3>
          )}

          {/* 内容预览 */}
          {note.content && (
            <p className="text-[13px] line-clamp-2 leading-relaxed" style={{ color: 'var(--mi-text-secondary)' }}>
              {highlightText(note.content, searchQuery)}
            </p>
          )}

          {/* 底部 */}
          <div className="flex items-center gap-2.5 mt-2.5">
            {category && (
              <span
                className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'var(--mi-hover)', color: 'var(--mi-text-tertiary)' }}
              >
                {category.name}
              </span>
            )}
            <span className="text-[11px]" style={{ color: 'var(--mi-text-tertiary)' }}>
              {formatTime(note.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── 网格视图 ──
  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`
        ${bgClass} rounded-2xl p-4 cursor-pointer
        transition-all duration-200 ease-out select-none touch-pan-y
        ${isSelected ? 'ring-2 ring-orange-500/50' : ''}
        active:scale-[0.97]
        break-inside-avoid
      `}
      style={{ boxShadow: 'var(--mi-shadow)' }}
    >
      {/* 选择指示器 */}
      {isSelectionMode && (
        <div className="absolute top-3 right-3 animate-mi-check-in">
          <div
            className="w-5.5 h-5.5 rounded-full flex items-center justify-center transition-all"
            style={{
              background: isSelected ? 'var(--mi-orange)' : 'transparent',
              border: isSelected ? 'none' : '2px solid var(--mi-text-tertiary)',
            }}
          >
            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
        </div>
      )}

      {/* 置顶标记 */}
      {note.pinned && !isSelectionMode && (
        <div className="flex items-center gap-1.5 mb-2.5">
          <Pin className="w-3.5 h-3.5 fill-current" style={{ color: 'var(--mi-orange)' }} />
          <span className="text-[11px] font-medium" style={{ color: 'var(--mi-orange)' }}>置顶</span>
        </div>
      )}

      {/* 标题 */}
      {note.title && (
        <h3 className="font-semibold text-[15px] mb-2 line-clamp-2" style={{ color: 'var(--mi-text-primary)' }}>
          {highlightText(note.title, searchQuery)}
        </h3>
      )}

      {/* 内容预览 */}
      {note.content && (
        <p className="text-[13px] line-clamp-4 leading-relaxed" style={{ color: 'var(--mi-text-secondary)' }}>
          {highlightText(note.content, searchQuery)}
        </p>
      )}

      {/* 底部：分类 + 时间 */}
      <div className="flex items-center justify-between mt-3 pt-2.5" style={{ borderTop: '1px solid var(--mi-divider)' }}>
        {category ? (
          <span
            className="text-[11px] px-2.5 py-1 rounded-full font-medium"
            style={{ background: 'var(--mi-hover)', color: 'var(--mi-text-tertiary)' }}
          >
            {category.name}
          </span>
        ) : (
          <span />
        )}
        <span className="text-[11px]" style={{ color: 'var(--mi-text-tertiary)' }}>
          {formatTime(note.updatedAt)}
        </span>
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
