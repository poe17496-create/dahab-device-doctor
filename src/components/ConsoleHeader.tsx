'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cpu, PlusCircle, LogOut, Crown, Monitor, Smartphone } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LoginModal from '@/components/LoginModal';
import { UserAccount } from '@/lib/auth';

interface ConsoleHeaderProps {
  sessionId: string;
  onNewSession: () => void;
  onExportJson: () => void;
  sessionsCount: number;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  isDesktopMode?: boolean;
  onToggleDesktopMode?: () => void;
}

export default function ConsoleHeader({
  sessionId,
  onNewSession,
  onExportJson,
  sessionsCount,
  currentUser: propUser,
  onLogout,
  isDesktopMode = false,
  onToggleDesktopMode,
}: ConsoleHeaderProps) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(propUser || null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    if (propUser !== undefined) {
      setCurrentUser(propUser);
      return;
    }
    const saved = localStorage.getItem('dahab_current_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [propUser]);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'dahab';

  // نبض الجلسة الدورية للتحقق من عدم الفتح من جهاز آخر
  useEffect(() => {
    if (!currentUser) return;

    const sessionToken = localStorage.getItem('dahab_session_token');
    if (!sessionToken) return;

    const sendHeartbeat = async () => {
      try {
        const deviceInfo = `${navigator.platform || 'PC'} - ${navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser'}`;
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'heartbeat',
            username: currentUser.username,
            sessionToken,
            deviceInfo,
          }),
        });

        const data = await res.json();
        if (data.kicked && !isAdmin) {
          alert(`⚠️ تنبيه أمان:\n${data.error || 'تم تسجيل الدخول إلى هذا الحساب من جهاز آخر، وسيتم إغلاق هذه الجلسة فوراً.'}`);
          localStorage.removeItem('dahab_current_user');
          localStorage.removeItem('dahab_session_token');
          setCurrentUser(null);
          if (onLogout) onLogout();
        }
      } catch (err) {
        // تجاهل أخطاء الشبكة المؤقتة
      }
    };

    sendHeartbeat();
    const timer = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(timer);
  }, [currentUser, onLogout, isAdmin]);

  const handleLogout = () => {
    localStorage.removeItem('dahab_current_user');
    localStorage.removeItem('dahab_session_token');
    setCurrentUser(null);
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  return (
    <>
      <div className="w-full flex items-center justify-between gap-2">
        {/* الشعار والهوية الملكية لدهب */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-dahab-400 via-dahab-500 to-amber-700 flex items-center justify-center shadow-md text-slate-950 font-black shrink-0 border border-dahab-300">
            <Cpu className="w-5 h-5 md:w-6 md:h-6 text-slate-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base md:text-xl font-black bg-gradient-to-r from-amber-600 via-dahab-500 to-amber-400 bg-clip-text text-transparent truncate">
                Dahab FixAI
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-dahab-500/15 text-dahab-600 dark:text-dahab-400 border border-dahab-500/30 shrink-0">
                خبير الأعطال
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-gray-500 dark:text-gray-400 truncate">
              المنظومة الهندسية لتشخيص الموبايل واللابتوب والمازربورد
            </p>
          </div>
        </div>

        {/* أزرار الإجراءات العلوية وتغيير الوضع والحساب */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* زر تبديل وضع الديسكتوب / الموبايل */}
          {onToggleDesktopMode && (
            <button
              onClick={onToggleDesktopMode}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition shadow-sm ${
                isDesktopMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-amber-500/20'
                  : 'bg-gray-100 dark:bg-[#1F2937] hover:bg-gray-200 dark:hover:bg-[#374151] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
              }`}
              title={isDesktopMode ? 'العودة لوضع الموبايل' : 'تشغيل وضع سطح المكتب (Desktop Mode)'}
            >
              {isDesktopMode ? (
                <>
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">موبايل</span>
                </>
              ) : (
                <>
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">كمبيوتر</span>
                </>
              )}
            </button>
          )}

          {/* زر معرض برمجيات دهب سوفت وير */}
          <Link
            href="/ecosystem"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-black text-amber-700 dark:text-dahab-300 transition shadow-sm"
            title="استعراض كافة برمجيات وأنظمة دهب سوفت وير"
          >
            <Crown className="w-3.5 h-3.5 text-dahab-500" />
            <span className="hidden md:inline">برمجيات دهب</span>
          </Link>

          {/* زر الوضع النهاري والليلي */}
          <ThemeToggle />

          {/* رابط الشروط القانونية والخصوصية السريع */}
          <Link
            href="/terms"
            target="_blank"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-[#1F2937] hover:bg-gray-200 dark:hover:bg-[#374151] text-gray-700 dark:text-gray-300 text-xs font-bold transition shadow-sm"
            title="شروط الاستخدام وإخلاء المسؤولية القانونية"
          >
            <span>📜</span>
            <span className="hidden lg:inline">الشروط</span>
          </Link>

          {/* حالة تسجيل الدخول */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-dahab-500/10 border border-dahab-500/30 text-[11px]">
              <span className="font-bold text-dahab-700 dark:text-dahab-300 truncate max-w-[80px] md:max-w-[120px]">
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
          ) : null}

          {/* زر فحص جهاز جديد */}
          <button
            onClick={onNewSession}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 text-xs font-extrabold transition shadow-md shadow-dahab-500/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>جديد</span>
          </button>
        </div>
      </div>

      {/* نافذة تسجيل الدخول في حال طلبها */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(u) => setCurrentUser(u)}
      />
    </>
  );
}
