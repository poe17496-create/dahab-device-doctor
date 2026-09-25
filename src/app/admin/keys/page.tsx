'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Key } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import AIKeysManager from '@/components/AIKeysManager';

export default function AdminKeysPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-workshop-bg text-gray-900 dark:text-gray-100 font-sans p-4 md:p-6 selection:bg-dahab-500/30">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* هيدر الصفحة */}
        <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dahab-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-2xl shadow-lg shadow-dahab-500/20">
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
