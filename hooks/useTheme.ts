// ============================================================
// hooks/useTheme.ts — 主题切换 + 持久化
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

  // 同步 <html> class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
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
