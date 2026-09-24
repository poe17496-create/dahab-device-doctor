'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function PWAUpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // الاستماع لرسائل Service Worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'NEW_VERSION_AVAILABLE') {
        setShowUpdate(true);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    // إرسال رسالة للـ Service Worker لتخطي الانتظار
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      }
    }

    // إعادة تحميل الصفحة بعد فترة قصيرة
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937] rounded-2xl shadow-2xl p-4 max-w-sm">
        <button
          onClick={() => setShowUpdate(false)}
          className="absolute top-2 left-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F2937]"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-dahab-500/20 text-dahab-600 dark:text-dahab-400 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
              تحديث جديد متاح
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              تم إصدار نسخة جديدة من التطبيق. قم بالتحديث للحصول على أحدث الميزات.
            </p>
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full bg-dahab-500 hover:bg-dahab-600 text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                'تحديث الآن'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
