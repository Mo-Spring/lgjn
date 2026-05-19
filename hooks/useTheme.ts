// ============================================================
// hooks/useTheme.ts — 主题切换 + 持久化 + 状态栏同步
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { Theme } from '../types';
import { getMeta, setMeta } from '../services/storageService';

const THEME_KEY = 'theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');

  // 初始化：从存储读取主题
  useEffect(() => {
    getMeta(THEME_KEY).then((saved) => {
      if (saved === 'dark' || saved === 'light') {
        setThemeState(saved);
      }
    });
  }, []);

  // 同步 <html> class + meta theme-color + body background
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const isDark = theme === 'dark';

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 同步 body 背景色（防止闪烁）
    body.style.backgroundColor = isDark ? '#131316' : '#F6F5F1';

    // 同步 meta theme-color（导航栏颜色）
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', isDark ? '#131316' : '#F6F5F1');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      setMeta(THEME_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
