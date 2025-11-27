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
}

// 扩展 Window 接口以支持语音识别 API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
