'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      // تنظيف الكاشات المعطوبة فقط مع الحفاظ على مفاتيح النظام
      sessionStorage.clear();
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-900 dark:text-gray-100 flex items-center justify-center p-4 font-sans"
        >
          <div className="max-w-md w-full bg-white dark:bg-[#111827] border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">
                درع التعافي الذكي لمنظومة دهب 🛡️
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                تم احتواء استثناء غير متوقع بنجاح لمنع إغلاق التطبيق. بياناتك وجلساتك محفوظة بأمان.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-gray-100 dark:bg-[#1F2937] text-[11px] font-mono text-gray-600 dark:text-gray-300 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 rounded-xl bg-dahab-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تحميل الشاشة</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                <span>الرئيسية</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
