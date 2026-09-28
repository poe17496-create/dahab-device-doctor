'use client';

import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  KeyRound, 
  Cpu, 
  MessageCircle, 
  Globe, 
  PhoneCall, 
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { UserAccount } from '@/lib/auth';

interface AuthGateProps {
  onAuthenticated: (user: UserAccount) => void;
}

export default function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    setError('');

    const deviceInfo = typeof window !== 'undefined'
      ? `${navigator.platform || 'PC'} - ${navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser'}`
      : 'Web Client';

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: username.trim(),
          password: password.trim(),
          deviceInfo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // دعم تسجيل الدخول المباشر للمشرف العام في حال تعذر السيرفر
        if (username.trim() === 'dahab' && password.trim() === 'dahab2026') {
          const adminUser: UserAccount = {
            id: 'user_admin',
            username: 'dahab',
            name: 'المهندس إسلام دهب (المالك والمطور)',
            email: 'dahab@dahabsoftware.com',
            role: 'admin',
            active: true,
            diagnosesCount: 1,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem('dahab_current_user', JSON.stringify(adminUser));
          localStorage.setItem('dahab_session_token', `admin_token_${Date.now()}`);
          onAuthenticated(adminUser);
          setLoading(false);
          return;
        }

        setError(data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة، أو انتهت صلاحية الحساب.');
        setLoading(false);
        return;
      }

      localStorage.setItem('dahab_current_user', JSON.stringify(data.user));
      if (data.sessionToken) {
        localStorage.setItem('dahab_session_token', data.sessionToken);
      }

      onAuthenticated(data.user);
    } catch (err) {
      if (username.trim() === 'dahab' && password.trim() === 'dahab2026') {
        const adminUser: UserAccount = {
          id: 'user_admin',
          username: 'dahab',
          name: 'المهندس إسلام دهب (المالك والمطور)',
          email: 'dahab@dahabsoftware.com',
          role: 'admin',
          active: true,
          diagnosesCount: 1,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('dahab_current_user', JSON.stringify(adminUser));
        localStorage.setItem('dahab_session_token', `admin_token_${Date.now()}`);
        onAuthenticated(adminUser);
      } else {
        setError('حدث خطأ في الاتصال بالخادم، يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 text-white relative overflow-hidden font-sans select-none">
      {/* خلفية ضوئية جمالية */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-dahab-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* شريط علوي بسيط */}
      <header className="w-full p-4 md:p-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-dahab-400 via-dahab-500 to-amber-700 flex items-center justify-center shadow-lg shadow-dahab-500/30 text-slate-950 font-black text-xl border border-dahab-300">
            <Cpu className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black bg-gradient-to-r from-amber-400 via-dahab-300 to-amber-200 bg-clip-text text-transparent">
              Dahab FixAI 🛠️⚡
            </h1>
            <p className="text-[11px] text-amber-200/70">
              المنظومة الهندسية الأولى بالشرق الأوسط لفحص الإلكترونيات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* كارت تسجيل الدخول المركزي المحمي */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-slate-900/90 border border-dahab-500/30 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/80 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-dahab-500/15 border border-dahab-500/30 text-dahab-400 mb-1">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              تسجيل دخول المهندسين والفنيين
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              يرجى إدخال اسم المستخدم وكلمة المرور الصادرة لك من إدارة دهب سوفت وير للوصول لكافة أدوات الفحص والمخططات.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5 animate-shake leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                اسم المستخدم (Username):
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: dahab أو اسم حسابك"
                  required
                  className="w-full pl-3 pr-10 py-3 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-dahab-500 focus:ring-1 focus:ring-dahab-500 text-white placeholder-slate-500 text-sm outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                كلمة المرور (Password):
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-3 pr-10 py-3 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-dahab-500 focus:ring-1 focus:ring-dahab-500 text-white placeholder-slate-500 text-sm outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-dahab-500 via-amber-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-sm transition shadow-lg shadow-dahab-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>جاري التحقق والمصادقة...</span>
              ) : (
                <>
                  <span>دخول المنظومة الهندسية</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* طلب حساب فني جديد عبر المطور مباشرة */}
          <div className="pt-4 border-t border-slate-800/80 text-center space-y-3">
            <p className="text-xs text-slate-400">ليس لديك حساب فني معتمد حتى الآن؟</p>
            
            <a
              href="https://wa.me/201064147224?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D9%85%D9%87%D9%86%D8%AF%D8%B3%20%D8%A5%D8%B3%D9%84%D8%A7%D9%85%20%D8%AF%D9%87%D8%A8%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%AD%D8%B5%D9%88%D9%84%20%D8%B9%D9%84%D9%89%20%D8%AD%D8%B3%D8%A7%D8%A8%20%D9%81%D9%86%D9%8A%20%D9%85%D8%B9%D8%AA%D9%85%D8%AF%20%D9%84%D9%85%D9%86%D8%B8%D9%88%D9%85%D8%A9%20Dahab%20FixAI."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>طلب حساب فني عبر واتساب (م. إسلام دهب: 01064147224)</span>
            </a>
          </div>
        </div>
      </main>

      {/* الفوتر ومواقع دهب سوفت وير */}
      <footer className="w-full p-4 border-t border-slate-800/80 relative z-10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-dahab-400" />
          <span>المطور م. إسلام دهب: <strong>01064147224</strong></span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://dahabsoftware.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-dahab-400 transition flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5 text-dahab-500" />
            <span>بوابة دهب سوفت وير الرسمية</span>
          </a>
          <span>•</span>
          <a
            href="https://dahabsoftware.online/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-dahab-400 transition flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span>بوابة نور للمكفوفين</span>
          </a>
        </div>

        <div className="text-slate-500">
          © 2026 جميع الحقوق محفوظة لمنظومة دهب سوفت وير
        </div>
      </footer>
    </div>
  );
}
