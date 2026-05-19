// ============================================================
// components/EmptyState.tsx — 小米笔记风格空状态
// ============================================================

import React from 'react';

interface Props {
  hasNotes: boolean;
  hasSearch: boolean;
}

export function EmptyState({ hasNotes, hasSearch }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="animate-mi-float mb-6">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'var(--mi-card)' }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path
              d="M16 8H10C8.89543 8 8 8.89543 8 10V30C8 31.1046 8.89543 32 10 32H30C31.1046 32 32 31.1046 32 30V24"
              stroke="var(--mi-text-tertiary)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M20 20L32 8M32 8H24M32 8V16"
              stroke="var(--mi-text-tertiary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            />
          </svg>
        </div>
      </div>

      {hasSearch ? (
        <>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--mi-text-secondary)' }}>
            没有找到匹配的笔记
          </p>
          <p className="text-xs" style={{ color: 'var(--mi-text-tertiary)' }}>
            试试其他关键词
          </p>
        </>
      ) : hasNotes ? (
        <>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--mi-text-secondary)' }}>
            当前分类没有笔记
          </p>
          <p className="text-xs" style={{ color: 'var(--mi-text-tertiary)' }}>
            点击 + 按钮记录灵感
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--mi-text-secondary)' }}>
            还没有笔记
          </p>
          <p className="text-xs" style={{ color: 'var(--mi-text-tertiary)' }}>
            点击右下角 + 按钮，记录你的第一个灵感
          </p>
        </>
      )}
    </div>
  );
}
