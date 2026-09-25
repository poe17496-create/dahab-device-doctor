'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Key, Lock, User } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import AIKeysManager from '@/components/AIKeysManager';

export default function AdminKeysPage() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState('dahab');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('dahab_current_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.role === 'admin') {
          setIsAdminAuthenticated(true);
        }
      } catch (e) {}
    }
    setCheckingAuth(false);
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: adminUsername,
          password: adminPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.user?.role !== 'admin') {
        setAuthError(data.error || 'عذراً، هذه اللوحة مخصصة حصرياً للمشرف العام.');
        return;
      }

      localStorage.setItem('dahab_current_user', JSON.stringify(data.user));
      if (data.sessionToken) {
        localStorage.setItem('dahab_session_token', data.sessionToken);
      }
      setIsAdminAuthenticated(true);
    } catch (e) {
      setAuthError('حدث خطأ أثناء الاتصال.');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-workshop-bg flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-dahab-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-workshop-bg text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-dahab-500/40 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">
              إدارة المفاتيح مقفلة ومحمية
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              يرجى تسجيل الدخول بحساب المشرف العام لعرض وتعديل مفاتيح الذكاء الاصطناعي.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                اسم المستخدم:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full pr-10 pl-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                كلمة المرور:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500 font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-lg shadow-dahab-500/25"
            >
              فك قفل إدارة المفاتيح 🔓
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-dahab-500 transition inline-flex items-center gap-1 font-bold"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة لشاشة الفحص الرئيسية</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-workshop-bg text-gray-900 dark:text-gray-100 font-sans p-4 md:p-6 selection:bg-dahab-500/30">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* هيدر الصفحة */}
        <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dahab-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-2xl shadow-lg shadow-dahab-500/20">
              <Key className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-dahab-500 to-amber-600 bg-clip-text text-transparent">
                  إدارة واختبار مفاتيح الذكاء الاصطناعي
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-dahab-500/20 text-dahab-600 dark:text-dahab-400">
                  AI KEYS & CONNECTIVITY
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                التحكم المباشر في مفاتيح Gemini و OpenRouter و OpenAI مع ميزة الاختبار الحي والفوري
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 transition"
            >
              <span>لوحة الفنيين 👥</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-slate-950 text-xs font-bold transition shadow"
            >
              <span>شاشة الفحص 🩺</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* المكون الرئيسي لإدارة المفاتيح واختبارها */}
        <AIKeysManager />
      </div>
    </div>
  );
}
