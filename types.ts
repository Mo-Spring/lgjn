// ============================================================
// types.ts — 小米笔记 核心类型定义
// ============================================================

/** 笔记颜色主题 — 小米笔记风格 */
export type NoteColor =
  | 'default'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'red';

/** 笔记数据结构 */
export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  category: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

/** 分类数据结构 */
export interface Category {
  id: string;
  name: string;
  order: number;
  createdAt: number;
}

/** 导出 / 导入数据结构 */
export interface ExportData {
  version: number;
  exportedAt: number;
  notes: Note[];
  categories: Category[];
}

/** Toast 通知 */
export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'undo';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

/** 主题 */
export type Theme = 'light' | 'dark';

/** 编辑器自动保存状态 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** 视图模式 */
export type ViewMode = 'grid' | 'list';
