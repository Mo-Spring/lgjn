import React, { useState, useEffect, useRef } from 'react';
import { Note, CapsuleColor, Category } from '../types';
import { X, Trash2, Save, Folder, Mic, MicOff } from 'lucide-react';

interface EditorModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
  onDelete: (id: string) => void;
  categories: Category[];
  autoStartRecording?: boolean; // 新增属性
}

const COLORS: CapsuleColor[] = ['blue', 'purple', 'green', 'rose', 'amber', 'slate'];

export const EditorModal: React.FC<EditorModalProps> = ({ 
  note, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  categories,
  autoStartRecording = false 
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<CapsuleColor>('blue');
  const [categoryId, setCategoryId] = useState<string>('');
  
  // 语音识别状态
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // 初始化数据
  useEffect(() => {
    if (isOpen) {
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setSelectedColor(note.color);
        setCategoryId(note.categoryId || '');
      } else {
        setTitle('');
        setContent('');
        setSelectedColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
        setCategoryId('');
      }
    }
    // 关闭时重置录音状态
    if (!isOpen) {
      stopRecording();
    }
  }, [isOpen, note]);

  // 自动开始录音
  useEffect(() => {
    if (isOpen && autoStartRecording && !note) {
      // 立即尝试启动，不使用 setTimeout，避免浏览器安全策略拦截
      startRecording();
    }
  }, [isOpen, autoStartRecording, note]);

  // 语音识别逻辑
  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("您的浏览器或设备不支持语音输入功能。");
      return;
    }

    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true; // 连续录音
        recognition.interimResults = true; // 实时结果
        recognition.lang = 'zh-CN'; // 设置语言为中文

        recognition.onstart = () => {
          setIsListening(true);
          if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          // 如果是权限错误，提示用户
          if (event.error === 'not-allowed') {
              alert("语音输入需要麦克风权限，请在设置中允许。");
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
            setContent(prev => prev + (prev ? ' ' : '') + finalTranscript);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
    } catch (e) {
        console.error("Failed to start speech recognition:", e);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleRecording = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    stopRecording(); // 保存时停止录音
    if (!content.trim() && !title.trim()) {
      onClose();
      return;
    }
    const newNote: Note = {
      id: note ? note.id : crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      color: selectedColor,
      categoryId: categoryId || undefined,
      createdAt: note ? note.createdAt : Date.now(),
      updatedAt: Date.now(),
    };
    onSave(newNote);
    onClose();
  };

  const getColorClass = (c: CapsuleColor) => {
    switch (c) {
      case 'blue': return 'bg-blue-400 dark:bg-blue-500';
      case 'purple': return 'bg-purple-400 dark:bg-purple-500';
      case 'green': return 'bg-emerald-400 dark:bg-emerald-500';
      case 'rose': return 'bg-rose-400 dark:bg-rose-500';
      case 'amber': return 'bg-amber-400 dark:bg-amber-500';
      case 'slate': return 'bg-slate-400 dark:bg-slate-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={handleSave}
      />
      <div 
        ref={modalRef}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative transform transition-all animate-in fade-in zoom-in-95 duration-200 border-4 border-white dark:border-slate-800"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${getColorClass(c)} ${selectedColor === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110' : 'opacity-60 hover:opacity-100'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {/* 语音输入按钮 */}
            <button
              onClick={toggleRecording}
              className={`p-2 rounded-full transition-all ${
                isListening 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isListening ? "停止录音" : "开始录音"}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {note && (
              <button 
                onClick={() => { onDelete(note.id); onClose(); }}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button 
              onClick={handleSave}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2 mb-2">
             <div className="relative">
                <Folder size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <select 
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 border-none outline-none appearance-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <option value="">无分类</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
             </div>
             {isListening && (
               <span className="text-xs text-red-500 animate-pulse font-medium ml-2">正在听...</span>
             )}
          </div>

          <input
            type="text"
            placeholder="胶囊标题..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl md:text-3xl font-bold bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-100"
          />
          
          <textarea
            placeholder={isListening ? "请说话..." : "捕捉你的灵感..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full resize-none text-lg leading-relaxed bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-700 dark:text-slate-300 font-medium pb-20"
            spellCheck={false}
          />
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2 rounded-full hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-95 shadow-lg shadow-slate-300/50 dark:shadow-slate-900/50 font-medium"
            >
                <Save size={18} /> 保存胶囊
            </button>
        </div>
      </div>
    </div>
  );
};
