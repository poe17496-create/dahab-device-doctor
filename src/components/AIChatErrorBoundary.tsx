'use client';

import React from 'react';
import { MessageSquare, AlertTriangle, RefreshCw } from 'lucide-react';
import { ComponentErrorBoundary } from './ErrorBoundary';

interface AIChatErrorFallbackProps {
  onRetry: () => void;
}

function AIChatErrorFallback({ onRetry }: AIChatErrorFallbackProps) {
  return (
    <div className="bg-workshop-card border border-workshop-border rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
            مساعد الذكاء الاصطناعي غير متاح مؤقتاً
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            حدث خطأ في المحادثة. يمكنك المحاولة مرة أخرى أو استخدام الميزات الأخرى.
          </p>
        </div>
      </div>
      
      <button
        onClick={onRetry}
        className="w-full py-2.5 rounded-xl bg-dahab-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-md"
      >
        <RefreshCw className="w-4 h-4" />
        <span>إعادة تشغيل المساعد</span>
      </button>
    </div>
  );
}

export function AIChatErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ComponentErrorBoundary
      component="مساعد الذكاء الاصطناعي"
      fallback={<AIChatErrorFallback onRetry={() => window.location.reload()} />}
    >
      {children}
    </ComponentErrorBoundary>
  );
}
