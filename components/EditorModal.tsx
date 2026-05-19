// ============================================================
// components/EditorModal.tsx — 灵感胶囊风格编辑器
// 全屏滑入、自动保存、下拉关闭
// ============================================================

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { X, ArrowLeft, Palette, FolderOpen, Check, Save } from 'lucide-react';
import type { Note, NoteColor, Category, SaveStatus } from '../types';

interface Props {
  note: Note | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, changes: Partial<Note>) => void;
  onCreate: (partial?: Partial<Note>) => Promise<Note>;
}

const COLORS: { value: NoteColor; label: string; color: string }[] = [
  { value: 'default', label: '默认', color: '#F0F0F0' },
  { value: 'yellow', label: '黄色', color: '#FFF0B3' },
  { value: 'green', label: '绿色', color: '#C5EDD3' },
  { value: 'blue', label: '蓝色', color: '#C5DEFF' },
  { value: 'purple', label: '紫色', color: '#DCC5FF' },
  { value: 'pink', label: '粉色', color: '#FFC5D6' },
  { value: 'orange', label: '橙色', color: '#FFD6B3' },
  { value: 'red', label: '红色', color: '#FFC5C5' },
];

export function EditorModal({
  note,
  categories,
  isOpen,
  onClose,
  onSave,
  onCreate,
}: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColor>('default');
  const [category, setCategory] = useState('');
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // 拉下关闭
  const [dragDeltaY, setDragDeltaY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  // 自动保存计时器（防抖模式）
  const autoSaveTimer = useRef<number | null>(null);
  const contentChanged = useRef(false);

  // 初始化编辑器内容
  useEffect(() => {
    if (isOpen && note) {
      setTitle(note.title);
      setContent(note.content);
      setColor(note.color);
      setCategory(note.category);
      setCurrentNote(note);
      setSaveStatus('idle');
    } else if (isOpen && !note) {
      setTitle('');
      setContent('');
      setColor('default');
      setCategory('');
      setCurrentNote(null);
      setSaveStatus('idle');
    }
    setDragDeltaY(0);
    setIsClosing(false);
    setShowColorPicker(false);
    setShowCategoryPicker(false);
  }, [isOpen, note]);

  // 执行保存
  const doSave = useCallback(() => {
    if (!contentChanged.current) return;

    if (currentNote) {
      setSaveStatus('saving');
      onSave(currentNote.id, { title, content, color, category });
      setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 200);
    } else if (title || content) {
      setSaveStatus('saving');
      onCreate({ title, content, color, category }).then((newNote) => {
        setCurrentNote(newNote);
        setTimeout(() => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        }, 200);
      });
    }

    contentChanged.current = false;
  }, [currentNote, title, content, color, category, onSave, onCreate]);

  // 防抖自动保存：内容变化后 800ms 触发
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current !== null) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = window.setTimeout(() => {
      doSave();
      autoSaveTimer.current = null;
    }, 800);
  }, [doSave]);

  // 清理定时器
  useEffect(() => {
    if (!isOpen) return;
    return () => {
      if (autoSaveTimer.current !== null) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, [isOpen]);

  // beforeunload 清理
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => { if (contentChanged.current) doSave(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isOpen, doSave]);

  // 内容变化标记 + 触发防抖保存
  const markChanged = useCallback(() => {
    contentChanged.current = true;
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    markChanged();
  };
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    markChanged();
  };
  const handleColorChange = (c: NoteColor) => {
    setColor(c);
    markChanged();
    setShowColorPicker(false);
  };
  const handleCategoryChange = (catId: string) => {
    setCategory(catId);
    markChanged();
    setShowCategoryPicker(false);
  };

  // 手动保存按钮
  const handleManualSave = useCallback(() => {
    if (autoSaveTimer.current !== null) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    doSave();
  }, [doSave]);

  // 拉下关闭手势
  const handleDragStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const delta = e.touches[0].clientY - dragStartY.current;
      if (delta > 0) setDragDeltaY(delta);
    },
    [isDragging]
  );

  const handleDragEnd = useCallback(() => {
    if (dragDeltaY > 150) {
      setDragDeltaY(window.innerHeight);
      setTimeout(onClose, 200);
    } else {
      setDragDeltaY(0);
    }
    setIsDragging(false);
  }, [dragDeltaY, onClose]);

  // 关闭前保存
  const handleClose = useCallback(() => {
    if (contentChanged.current) doSave();
    setIsClosing(true);
    setTimeout(onClose, 250);
  }, [doSave, onClose]);

  if (!isOpen) return null;

  const selectedColor = COLORS.find(c => c.value === color) || COLORS[0];
  const selectedCategory = categories.find(c => c.id === category);

  return (
    <div className="fixed inset-0 z-50">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: 'rgba(0,0,0,0.5)', opacity: isClosing ? 0 : 1 }}
        onClick={handleClose}
      />

      {/* 编辑器面板 */}
      <div
        className={`
          absolute inset-x-0 bottom-0 top-6
          rounded-t-2xl flex flex-col overflow-hidden
          ${isClosing ? 'animate-mi-editor-out' : 'animate-mi-editor-in'}
        `}
        style={{
          background: 'var(--mi-bg)',
          transform: `translateY(${dragDeltaY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          opacity: Math.max(0, 1 - dragDeltaY / 400),
          boxShadow: 'var(--mi-shadow-float)',
        }}
      >
        {/* 拖拽手柄 */}
        <div
          className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="w-10 h-1.5 rounded-full" style={{ background: 'var(--mi-border)' }} />
        </div>

        {/* 头部工具栏 */}
        <div className="flex items-center justify-between px-5 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" style={{ color: 'var(--mi-text-primary)' }} />
            </button>
            {/* 保存状态 */}
            {saveStatus !== 'idle' && (
              <span
                className="text-[12px] px-3 py-1 rounded-full font-medium"
                style={{
                  background: saveStatus === 'saved' ? '#E8F8EE' : saveStatus === 'error' ? '#FFE8E8' : 'var(--mi-card)',
                  color: saveStatus === 'saved' ? '#22C55E' : saveStatus === 'error' ? '#FF4444' : 'var(--mi-text-tertiary)',
                }}
              >
                {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存' : '保存失败'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* 保存按钮 */}
            <button
              onClick={handleManualSave}
              disabled={!contentChanged.current && saveStatus !== 'saving'}
              className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors disabled:opacity-30"
              title="保存"
            >
              <Save className="w-5 h-5" style={{ color: saveStatus === 'saved' ? '#22C55E' : 'var(--mi-text-secondary)' }} />
            </button>
            {/* 颜色按钮 */}
            <button
              onClick={() => { setShowColorPicker(!showColorPicker); setShowCategoryPicker(false); }}
              className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors relative"
            >
              <div className="w-6 h-6 rounded-full border-2" style={{ background: selectedColor.color, borderColor: 'var(--mi-border)' }} />
            </button>
            {/* 分类按钮 */}
            <button
              onClick={() => { setShowCategoryPicker(!showCategoryPicker); setShowColorPicker(false); }}
              className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-200/60 dark:active:bg-gray-700/60 transition-colors"
            >
              <FolderOpen className="w-5 h-5" style={{ color: category ? 'var(--mi-orange)' : 'var(--mi-text-secondary)' }} />
            </button>
          </div>
        </div>

        {/* 颜色选择器弹出 */}
        {showColorPicker && (
          <div className="px-5 pb-4 animate-mi-page-in">
            <div className="flex gap-3.5 p-4 rounded-2xl" style={{ background: 'var(--mi-card)', boxShadow: 'var(--mi-shadow-lg)' }}>
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleColorChange(c.value)}
                  className="relative w-10 h-10 rounded-full transition-transform active:scale-90"
                  style={{ background: c.color, boxShadow: color === c.value ? '0 0 0 2px var(--mi-orange)' : 'none' }}
                >
                  {color === c.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-5 h-5 text-gray-600" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 分类选择器弹出 */}
        {showCategoryPicker && (
          <div className="px-5 pb-4 animate-mi-page-in">
            <div className="p-2.5 rounded-2xl" style={{ background: 'var(--mi-card)', boxShadow: 'var(--mi-shadow-lg)' }}>
              <button
                onClick={() => handleCategoryChange('')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[15px] transition-colors active:bg-gray-100 dark:active:bg-gray-700"
                style={{ color: !category ? 'var(--mi-orange)' : 'var(--mi-text-primary)' }}
              >
                <span>未分类</span>
                {!category && <Check className="w-5 h-5" />}
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCategoryChange(c.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[15px] transition-colors active:bg-gray-100 dark:active:bg-gray-700"
                  style={{ color: category === c.id ? 'var(--mi-orange)' : 'var(--mi-text-primary)' }}
                >
                  <span>{c.name}</span>
                  {category === c.id && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 编辑区域 */}
        <div className="flex-1 overflow-y-auto px-6 pb-10">
          {/* 标题 */}
          <input
            type="text"
            placeholder="标题"
            value={title}
            onChange={handleTitleChange}
            className="w-full text-2xl font-bold bg-transparent outline-none border-0 mb-4 placeholder-gray-300 dark:placeholder-gray-600"
            style={{ color: 'var(--mi-text-primary)' }}
          />

          {/* 分割线 */}
          <div className="h-px mb-5" style={{ background: 'var(--mi-divider)' }} />

          {/* 内容 */}
          <textarea
            placeholder="写下你的灵感..."
            value={content}
            onChange={handleContentChange}
            className="w-full bg-transparent outline-none resize-none border-0 leading-relaxed text-[16px] placeholder-gray-300 dark:placeholder-gray-600"
            style={{ color: 'var(--mi-text-secondary)', minHeight: '60vh' }}
            autoFocus
          />
        </div>

        {/* 底部状态栏 */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: 'var(--mi-border)', background: 'var(--mi-card)' }}
        >
          <span className="text-[12px]" style={{ color: 'var(--mi-text-tertiary)' }}>
            {content.length > 0 ? `${content.length} 字` : ''}
          </span>
          <span className="text-[12px]" style={{ color: 'var(--mi-text-tertiary)' }}>
            {currentNote ? `编辑于 ${formatTime(currentNote.updatedAt)}` : '新建胶囊'}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
