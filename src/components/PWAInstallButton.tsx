'use client';

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installation accepted');
    }

    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937] rounded-2xl shadow-2xl p-4 max-w-sm">
        <button
          onClick={() => setShowInstall(false)}
          className="absolute top-2 left-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1F2937] transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dahab-500 to-amber-600 flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
              تثبيت دهب دكتور
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              قم بتثبيت التطبيق على جهازك للوصول السريع
            </p>
            <button
              onClick={handleInstall}
              className="w-full bg-dahab-500 hover:bg-dahab-600 text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors"
            >
              تثبيت التطبيق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
