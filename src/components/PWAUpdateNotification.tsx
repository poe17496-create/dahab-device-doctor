'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

const CURRENT_LOCAL_BUILD = 'dahab_build_2026_09_29_v3';

export default function PWAUpdateNotification() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // فحص أحدث إصدار منشور في السيرفر ومقارنته بالنسخة المخزنة
  const checkForUpdates = useCallback(async () => {
    try {
      const res = await fetch(`/api/version?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const storedBuild = localStorage.getItem('dahab_app_build_id');
        if (storedBuild && data.buildId && storedBuild !== data.buildId) {
          setHasUpdate(true);
        } else if (!storedBuild && data.buildId) {
          localStorage.setItem('dahab_app_build_id', data.buildId);
        }
      }
    } catch (e) {
      // Offline
    }
  }, []);

  useEffect(() => {
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 30000); // فحص كل 30 ثانية
    window.addEventListener('focus', checkForUpdates);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkForUpdates);
    };
  }, [checkForUpdates]);

  // تنفيذ التحديث الفوري ومسح أي كاش قديم على الموبايل والكمبيوتر
  const handleForceUpdate = async () => {
    setIsUpdating(true);
    try {
      // 1. مسح كل الكاش في المتصفح
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }

      // 2. تحديث الـ Service Worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }

      // 3. تحديث معرف النسخة المحلية
      localStorage.setItem('dahab_app_build_id', CURRENT_LOCAL_BUILD);

      // 4. إعادة تحميل الصفحة إجبارياً من السيرفر
      window.location.href = window.location.pathname + '?refresh=' + Date.now();
    } catch (e) {
      window.location.reload();
    }
  };

  if (!hasUpdate || dismissed) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-gradient-to-r from-amber-500 via-dahab-500 to-amber-600 text-slate-950 px-4 py-2.5 shadow-xl flex items-center justify-between gap-3 animate-fadeIn">
      <div className="flex items-center gap-2 text-xs md:text-sm font-black flex-1 justify-center md:justify-start">
        <Sparkles className="w-4 h-4 animate-bounce text-slate-950" />
        <span>يتوفر تحديث جديد للمنظومة الآن! تم تحديث الميزات والمخططات السحابية.</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleForceUpdate}
          disabled={isUpdating}
          className="px-3.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-400 text-xs font-black transition flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
          <span>{isUpdating ? 'جاري التحديث...' : 'تحديث هاتفي فوراً ⚡'}</span>
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg hover:bg-black/10 text-slate-950 transition"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
