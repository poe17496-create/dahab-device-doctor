'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, CheckCircle2 } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // مسح كافة بيانات الجلسة المخزنة محلياً
    localStorage.removeItem('dahab_current_user');
    localStorage.removeItem('dahab_session_token');

    const timer = setTimeout(() => {
      router.push('/');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-workshop-bg text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
      <div className="p-8 rounded-3xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-2xl text-center space-y-4 max-w-sm w-full animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-dahab-500/15 text-dahab-500 border border-dahab-500/30 flex items-center justify-center mx-auto">
          <LogOut className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">
          تم تسجيل الخروج بنجاح
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          تم إنهاء جلستك وحماية بيانات الحساب، جاري تحويلك إلى شاشة الفحص الرئيسية...
        </p>
        <div className="flex justify-center pt-2">
          <div className="w-6 h-6 border-2 border-dahab-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </main>
  );
}
