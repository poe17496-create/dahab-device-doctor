'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  AlertCircle, 
  KeyRound, 
  Cpu, 
  MessageCircle, 
  Globe, 
  PhoneCall,
  ArrowRight,
  Eye,
  Sparkles,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { UserAccount } from '@/lib/auth';

interface AuthGateProps {
  onAuthenticated: (user: UserAccount) => void;
  onGuestAccess: (attemptsRemaining: number) => void;
}

export default function AuthGate({ onAuthenticated, onGuestAccess }: AuthGateProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guestTrialsRemaining, setGuestTrialsRemaining] = useState(5);

  // جلب رصيد الزائر المتبقي من السيرفر مباشرة
  useEffect(() => {
    const fetchGuestRemaining = async () => {
      try {
        const response = await fetch('/api/guest/remaining', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (typeof data.remaining === 'number') {
            setGuestTrialsRemaining(data.remaining);
          }
        }
      } catch (error) {
        console.error('[AuthGate] Error fetching guest remaining from server:', error);
      }
    };

    fetchGuestRemaining();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    setLoading(true);
    setError('');

    let persistentDeviceId = typeof window !== 'undefined' ? localStorage.getItem('dahab_device_id') : null;
    if (!persistentDeviceId) {
      persistentDeviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      if (typeof window !== 'undefined') localStorage.setItem('dahab_device_id', persistentDeviceId);
    }

    const deviceInfo = persistentDeviceId;

    const buildAdminUser = (): UserAccount => ({
      id: 'user_admin',
      username: 'D3V1N_X9_ADMIN',
      name: 'المهندس إسلام دهب (المالك والمطور)',
      email: 'dahab@dahabsoftware.com',
      role: 'admin',
      active: true,
      diagnosesCount: 1,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      isGuest: false, // صريحاً غير زائر
    });

    const isDirectDahab = username.trim() === 'D3V1N_X9_ADMIN' && password.trim() === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '');

    // منع الدخول بالبيانات القديمة
    if (username.trim() === 'dahab' || password.trim() === 'dahab2026') {
      setError('⚠️ تم تحديث بيانات الأمان. يرجى استخدام البيانات الجديدة للدخول.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: username.trim(),
          password: password.trim(),
          deviceInfo,
          currentDeviceId: persistentDeviceId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (isDirectDahab) {
          const u = buildAdminUser();
          u.isGuest = false; // صريحاً غير زائر
          u.activeSessionToken = `admin_token_${Date.now()}`; // إضافة activeSessionToken
          localStorage.setItem('dahab_current_user', JSON.stringify(u));
          localStorage.setItem('dahab_session_token', u.activeSessionToken);
          console.log('[AuthGate] Direct admin login:', { username: u.username, hasSessionToken: !!u.activeSessionToken });
          onAuthenticated(u);
          return;
        }
        // معالجة خاصة لحالة تسجيل الدخول من جهاز آخر
        if (res.status === 409) {
          setError(data.message || '⚠️ هذا الحساب مسجل الدخول حالياً من جهاز آخر');
        } else {
          setError(data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة، أو انتهت صلاحية الحساب.');
        }
        return;
      }

      // إضافة isGuest: false صريحاً للمستخدم المسجل
      const authenticatedUser = {
        ...data.user,
        isGuest: false,
        activeSessionToken: data.sessionToken || data.user.activeSessionToken, // التأكد من وجود activeSessionToken
      };
      localStorage.setItem('dahab_current_user', JSON.stringify(authenticatedUser));
      if (data.sessionToken) localStorage.setItem('dahab_session_token', data.sessionToken);
      console.log('[AuthGate] User authenticated:', { username: authenticatedUser.username, hasSessionToken: !!authenticatedUser.activeSessionToken });
      onAuthenticated(authenticatedUser);
    } catch {
      if (isDirectDahab) {
        const u = buildAdminUser();
        u.isGuest = false; // صريحاً غير زائر
        u.activeSessionToken = `admin_token_${Date.now()}`; // إضافة activeSessionToken
        localStorage.setItem('dahab_current_user', JSON.stringify(u));
        localStorage.setItem('dahab_session_token', u.activeSessionToken);
        console.log('[AuthGate] Direct admin login (catch):', { username: u.username, hasSessionToken: !!u.activeSessionToken });
        onAuthenticated(u);
      } else {
        setError('حدث خطأ في الاتصال بالخادم، يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    try {
      const response = await fetch('/api/guest/remaining', { cache: 'no-store' });
      const data = await response.json();
      const remaining = typeof data.remaining === 'number' ? data.remaining : 0;

      if (remaining <= 0) {
        setGuestTrialsRemaining(0);
        setError('⚠️ انتهت تجاربك المجانية لليوم. سجّل كفني للاستخدام غير المحدود.');
        return;
      }

      const guestUser: any = {
        username: 'guest',
        name: `زائر (${remaining} تجربة متبقية)`,
        role: 'guest',
        active: true,
        isGuest: true,
      };
      localStorage.setItem('dahab_current_user', JSON.stringify(guestUser));
      onGuestAccess(remaining);
    } catch (error) {
      console.error('[AuthGate] Error during guest access:', error);
      setError('تعذر التحقق من رصيد الزائر، يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 text-white relative overflow-hidden font-sans select-none">
      {/* ضوء خلفي */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-dahab-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* هيدر */}
      <header className="w-full p-4 md:p-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-dahab-400 via-dahab-500 to-amber-700 flex items-center justify-center shadow-lg shadow-dahab-500/30 border border-dahab-300">
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
        <ThemeToggle />
      </header>

      {/* محتوى الكارت */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md space-y-4">

          {/* كارت تسجيل الدخول */}
          <div className="bg-slate-900/90 border border-dahab-500/30 backdrop-blur-2xl rounded-3xl p-6 md:p-7 shadow-2xl shadow-black/80 space-y-5">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-dahab-500/15 border border-dahab-500/30 text-dahab-400 mb-1">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white">تسجيل دخول المهندسين والفنيين</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                أدخل اسم المستخدم وكلمة المرور الصادرة من إدارة دهب سوفت وير
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">اسم المستخدم:</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    autoComplete="username"
                    className="w-full pl-3 pr-10 py-3 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-dahab-500 focus:ring-1 focus:ring-dahab-500 text-white placeholder-slate-500 text-sm outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">كلمة المرور:</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
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
                  <span>جاري التحقق...</span>
                ) : (
                  <>
                    <span>دخول المنظومة الهندسية</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* خيار الزائر */}
          <div className="bg-slate-900/60 border border-slate-700/50 backdrop-blur-md rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-bold text-white">وضع الزائر (تجربة مجانية)</span>
              </div>
              <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                guestTrialsRemaining > 0
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}>
                {guestTrialsRemaining} / 5 تجارب
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              يمكنك تجربة منظومة دهب دكتور بدون حساب مع حد أقصى <strong className="text-white">5 تشخيصات مجانية يومياً</strong>.
              للحصول على وصول غير محدود، سجّل الدخول بحساب فني معتمد.
            </p>
            <button
              onClick={handleGuestAccess}
              disabled={guestTrialsRemaining <= 0}
              className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition border ${
                guestTrialsRemaining > 0
                  ? 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/40 text-sky-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {guestTrialsRemaining > 0
                  ? `دخول كزائر (${guestTrialsRemaining} تجربة متبقية اليوم)`
                  : 'انتهت تجاربك المجانية لليوم. سجّل كفني للاستخدام غير المحدود'}
              </span>
            </button>
          </div>

          {/* طلب حساب */}
          <a
            href="https://wa.me/201064147224?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D9%85%D9%87%D9%86%D8%AF%D8%B3%20%D8%A5%D8%B3%D9%84%D8%A7%D9%85%20%D8%AF%D9%87%D8%A8%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%AD%D8%B3%D8%A7%D8%A8%20%D9%81%D9%86%D9%8A."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>طلب حساب فني دائم عبر واتساب (م. إسلام دهب: 01064147224)</span>
          </a>
        </div>
      </main>

      {/* فوتر */}
      <footer className="w-full p-4 border-t border-slate-800/80 relative z-10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-dahab-400" />
          <span>المطور م. إسلام دهب: <strong>01064147224</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://dahabsoftware.com/" target="_blank" rel="noopener noreferrer" className="hover:text-dahab-400 transition flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-dahab-500" />
            <span>بوابة دهب الرسمية</span>
          </a>
          <span>•</span>
          <a href="https://dahabsoftware.online/" target="_blank" rel="noopener noreferrer" className="hover:text-dahab-400 transition flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span>بوابة نور</span>
          </a>
        </div>
        <div className="text-slate-500">© 2026 دهب سوفت وير</div>
        <div className="flex items-center gap-2 text-slate-400">
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-dahab-400 transition underline underline-offset-2">
            شروط الاستخدام
          </a>
          <span>•</span>
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-dahab-400 transition underline underline-offset-2">
            سياسة الخصوصية
          </a>
        </div>
      </footer>
    </div>
  );
}
