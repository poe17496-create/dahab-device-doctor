'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cpu, FileJson, PlusCircle, ShieldCheck, User, LogOut, Settings } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LoginModal from '@/components/LoginModal';
import { UserAccount } from '@/lib/auth';

interface ConsoleHeaderProps {
  sessionId: string;
  onNewSession: () => void;
  onExportJson: () => void;
  sessionsCount: number;
}

export default function ConsoleHeader({
  sessionId,
  onNewSession,
  onExportJson,
  sessionsCount,
}: ConsoleHeaderProps) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dahab_current_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('dahab_current_user');
    setCurrentUser(null);
  };

  return (
    <>
      <header className="border-b border-gray-200 dark:border-workshop-border bg-white/90 dark:bg-workshop-card/85 backdrop-blur-md sticky top-0 z-40 px-4 py-3 rounded-2xl shadow-xl transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* الشعار والهوية الملكية لدهب */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dahab-400 via-dahab-500 to-amber-700 flex items-center justify-center shadow-lg shadow-dahab-500/20 text-slate-950 font-black text-2xl border border-dahab-300">
              <Cpu className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-amber-600 via-dahab-500 to-amber-400 bg-clip-text text-transparent">
                  Dahab FixAI 🛠️⚡
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dahab-500/15 text-dahab-600 dark:text-dahab-400 border border-dahab-500/30">
                  خبير الأعطال الأول
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                المنظومة الهندسية الرائدة لتشخيص أعطال الموبايل، واللابتوب، والشاشات، والكنترول
              </p>
            </div>
          </div>

          {/* أزرار الإجراءات العلوية وتغيير الوضع والحساب */}
          <div className="flex items-center flex-wrap gap-2">
            {/* زر الوضع النهاري والليلي */}
            <ThemeToggle />

            {/* رابط لوحة التحكم الإدارية */}
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold transition shadow-sm"
              title="لوحة تحكم المشرف وإدارة الفنيين"
            >
              <Settings className="w-4 h-4 text-dahab-500" />
              <span className="hidden sm:inline">لوحة التحكم</span>
            </Link>

            {/* زر تحميل الـ JSON */}
            <button
              onClick={onExportJson}
              title="تصدير ملف الجلسة بصيغة JSON لكي لا ينسى الذكاء الاصطناعي أي تفصيلة"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold transition shadow-sm"
            >
              <FileJson className="w-4 h-4 text-sky-500" />
              <span className="hidden sm:inline">تحميل JSON</span>
            </button>

            {/* حالة تسجيل الدخول */}
            {currentUser ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dahab-500/10 border border-dahab-500/30 text-xs">
                <span className="font-bold text-dahab-700 dark:text-dahab-300 line-clamp-1 max-w-[130px]">
                  {currentUser.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-rose-500 transition p-0.5"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold transition shadow-sm"
              >
                <User className="w-4 h-4 text-dahab-500" />
                <span>دخول الفني</span>
              </button>
            )}

            {/* زر فحص جهاز جديد */}
            <button
              onClick={onNewSession}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-dahab-500/25"
            >
              <PlusCircle className="w-4 h-4" />
              <span>جهاز جديد</span>
            </button>
          </div>
        </div>
      </header>

      {/* نافذة تسجيل الدخول */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(u) => setCurrentUser(u)}
      />
    </>
  );
}
