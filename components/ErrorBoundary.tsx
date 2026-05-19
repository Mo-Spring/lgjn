// ============================================================
// components/ErrorBoundary.tsx — 错误边界
// ============================================================

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center p-8"
          style={{ background: 'var(--mi-bg)', color: 'var(--mi-text-primary)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: '#FFE8E8' }}
          >
            <AlertTriangle className="w-8 h-8" style={{ color: '#FF4444' }} />
          </div>
          <h2 className="text-xl font-semibold mb-2">数据加载失败</h2>
          <p className="text-sm mb-8 text-center max-w-xs" style={{ color: 'var(--mi-text-secondary)' }}>
            应用遇到了意外错误，请尝试刷新页面或重新加载数据
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium active:scale-95 transition-all"
            style={{ background: 'var(--mi-orange)' }}
          >
            <RefreshCw className="w-4 h-4" />
            重新加载
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
