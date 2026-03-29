export type CapsuleColor = 'blue' | 'purple' | 'green' | 'rose' | 'amber' | 'slate';

export interface Category {
  id: string;
  name: string;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  color: CapsuleColor;
  categoryId?: string;
  deletedAt?: number; // 回收站：软删除时间戳
}
