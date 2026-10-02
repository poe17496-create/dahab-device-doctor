'use client';

import React from 'react';
import { Cpu, AlertTriangle, RefreshCw, Upload } from 'lucide-react';
import { ComponentErrorBoundary } from './ErrorBoundary';

interface BoardviewErrorFallbackProps {
  onRetry: () => void;
  onUploadLocal: () => void;
}

function BoardviewErrorFallback({ onRetry, onUploadLocal }: BoardviewErrorFallbackProps) {
  return (
    <div className="bg-workshop-card border border-workshop-border rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
            محاكي البوردفيو غير متاح مؤقتاً
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            حدث خطأ في عرض البوردة. يمكنك المحاولة مرة أخرى أو رفع ملف محلي.
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={onRetry}
          className="flex-1 py-2.5 rounded-xl bg-dahab-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          <span>إعادة التحميل</span>
        </button>
        <button
          onClick={onUploadLocal}
          className="flex-1 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-xs font-bold transition flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          <span>رفع ملف محلي</span>
        </button>
      </div>
    </div>
  );
}

export function BoardviewErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ComponentErrorBoundary
      component="محاكي البوردفيو"
      fallback={
        <BoardviewErrorFallback 
          onRetry={() => window.location.reload()} 
          onUploadLocal={() => document.getElementById('boardview-file-input')?.click()} 
        />
      }
    >
      {children}
    </ComponentErrorBoundary>
  );
}
