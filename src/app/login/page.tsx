'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, User, ShieldCheck, AlertCircle, KeyRound, ArrowRight, Sparkles, PhoneCall } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const deviceInfo = typeof window !== 'undefined'
      ? `${navigator.platform || 'PC'} - ${navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser'}`
      : 'Web Client';

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password, deviceInfo }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل تسجيل الدخول، تأكد من صحة البيانات');
        setLoading(false);
        return;
      }

      localStorage.setItem('dahab_current_user', JSON.stringify(data.user));
      if (data.sessionToken) {
        localStorage.setItem('dahab_session_token', data.sessionToken);
      }

      // توجيه تلقائي بحسب الصلاحية
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم، يرجى المحاولة ثانية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-workshop-bg text-gray-900 dark:text-gray-100 flex flex-col justify-between p-4 md:p-8 transition-colors">
      {/* شريط علوي بسيط */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border text-xs font-bold hover:border-dahab-500 transition shadow-sm"
        >
          <ArrowRight className="w-4 h-4 text-dahab-500" />
          <span>العودة لمعمل الفحص</span>
        </Link>

        <ThemeToggle />
      </div>

      {/* صندوق تسجيل الدخول المركزي */}
      <div className="w-full max-w-md mx-auto my-auto p-6 md:p-8 rounded-3xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-dahab-500/30 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-dahab-400 to-amber-600 text-slate-950 font-black flex items-center justify-center mx-auto shadow-lg shadow-dahab-500/25">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-dahab-500 via-amber-600 to-yellow-500 bg-clip-text text-transparent">
            بوابة تسجيل دخول المهندسين والفنيين
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Dahab Device Doctor - وصول آمن ومصادقة فردية بجلسة واحدة
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
              اسم المستخدم:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="اسم المستخدم المصرح به"
                className="w-full pr-10 pl-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500 transition font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
              كلمة المرور:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-10 pl-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500 transition font-mono"
                required
              />
            </div>
          </div>

          <div className="text-[11px] text-gray-500 dark:text-gray-400 bg-amber-500/5 border border-amber-500/20 p-3 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-dahab-400">
              <KeyRound className="w-3.5 h-3.5" />
              <span>أمان الجلسة والاشتراك:</span>
            </div>
            <p className="text-[10px] leading-relaxed">
              يتم إصدار الحسابات حصرياً من المشرف العام. الحساب يعمل على جهاز واحد فقط في نفس الوقت، وعند تسجيل الدخول من جهاز آخر سيتم إنهاء الجلسة القديمة فوراً.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-sm transition shadow-lg shadow-dahab-500/25 disabled:opacity-50"
          >
            {loading ? 'جاري التحقق من الصلاحيات...' : 'تسجيل الدخول إلى المنظومة 🚀'}
          </button>
        </form>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
          <a
            href="https://wa.me/201064147224?text=طلب+إصدار+حساب+فني+في+منظومة+دهب+دكتور"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-dahab-600 dark:text-dahab-400 hover:underline inline-flex items-center gap-1.5 font-bold"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>طلب إصدار أو تجديد اشتراك (تواصل: 01064147224)</span>
          </a>
        </div>
      </div>

      {/* فوتر بسيط */}
      <div className="text-center text-xs text-gray-400 pt-4">
        منظومة Dahab Device Doctor © 2026 - تطوير المهندس إسلام دهب
      </div>
    </main>
  );
}
