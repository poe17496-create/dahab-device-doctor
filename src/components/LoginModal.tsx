'use client';

import React, { useState } from 'react';
import { X, Lock, User, ShieldCheck, AlertCircle, KeyRound, Clock } from 'lucide-react';
import { UserAccount } from '@/lib/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('dahab');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
        setError(data.error || 'فشل تسجيل الدخول، تأكد من بيانات الحساب');
        setLoading(false);
        return;
      }

      // حفظ بيانات المستخدم وتوكن الجلسة الحصرية في التخزين المحلي
      localStorage.setItem('dahab_current_user', JSON.stringify(data.user));
      if (data.sessionToken) {
        localStorage.setItem('dahab_session_token', data.sessionToken);
      }
      
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم، يرجى المحاولة ثانية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-dahab-500/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-5">
        {/* هيدر نافذة تسجيل الدخول */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-dahab-400 to-amber-600 text-slate-950 font-black shadow-md shadow-dahab-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-gray-900 dark:text-gray-100">
                تسجيل دخول المهندسين والفنيين
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                منظومة دهب دكتور - وصول حصري ببيانات معتمدة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
              اسم المستخدم (المصرح به):
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="tech_username"
                className="w-full pr-10 pl-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
              كلمة المرور:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-10 pl-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500 transition"
                required
              />
            </div>
          </div>

          <div className="text-[11px] text-gray-500 dark:text-gray-400 bg-amber-500/5 border border-amber-500/20 p-3 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-dahab-400">
              <KeyRound className="w-3.5 h-3.5" />
              <span>سياسة أمان الجلسة الواحدة (Single Session):</span>
            </div>
            <p className="text-[10px] leading-relaxed">
              الحساب مخصص للعمل على جهاز واحد فقط في نفس الوقت. عند تسجيل الدخول من جهاز جديد سيتم إغلاق الجلسة في الجهاز القديم تلقائياً. يتم إصدار وتجديد الحسابات بواسطة المشرف العام.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-lg shadow-dahab-500/25 disabled:opacity-50"
          >
            {loading ? 'جاري التحقق من الصلاحيات...' : 'تسجيل الدخول إلى منظومة الفحص 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
