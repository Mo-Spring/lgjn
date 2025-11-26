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
  tags: string[];
  color: CapsuleColor;
  categoryId?: string;
}