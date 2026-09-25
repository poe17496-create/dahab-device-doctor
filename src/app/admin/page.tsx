'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Trash2,
  CheckCircle,
  XCircle,
  Activity,
  ArrowRight,
  Cpu,
  Terminal,
  Layers,
  Sparkles,
  Key,
  Clock,
  Laptop,
  PowerOff,
  CalendarPlus,
  AlertTriangle,
  Radio,
  Crown,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { UserAccount } from '@/lib/auth';
import AIKeysManager from '@/components/AIKeysManager';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'technicians' | 'keys'>('technicians');
  const [users, setUsers] = useState<any[]>([]);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [hwCount, setHwCount] = useState(0);
  const [swCount, setSwCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // حالة إضافة فني جديد
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'admin' | 'technician'>('technician');
  const [specialty, setSpecialty] = useState('');
  const [password, setPassword] = useState('123456');
  const [subscriptionDays, setSubscriptionDays] = useState('30');

  const fetchData = async () => {
    try {
      // 1. جلب المستخدمين مع فحص الاشتراكات
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      if (usersData.users) setUsers(usersData.users);

      // 2. جلب الجلسات للإحصائيات
      const sessionsRes = await fetch('/api/memory');
      const sessionsData = await sessionsRes.json();
      if (sessionsData.sessions) {
        setSessionsCount(sessionsData.sessions.length);
        let hw = 0;
        let sw = 0;
        for (const s of sessionsData.sessions) {
          if (s.metrics?.classification === 'HARDWARE') hw++;
          if (s.metrics?.classification === 'SOFTWARE') sw++;
        }
        setHwCount(hw);
        setSwCount(sw);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // تحديث دوري كل 20 ثانية لمتابعة المتصلين حياً
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username,
          role,
          specialty,
          password,
          subscriptionDays: subscriptionDays === 'unlimited' ? undefined : Number(subscriptionDays),
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setName('');
        setUsername('');
        setSpecialty('');
        setSubscriptionDays('30');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('هل تريد بالتأكيد حذف هذا المستخدم نهائياً؟')) return;
    try {
      await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'toggleStatus' }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExtendSubscription = async (id: string, days: number) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'extendSubscription', days }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTerminateSession = async (id: string) => {
    if (!confirm('هل تريد طرد جلسة هذا الفني وإخراجه من كافة الأجهزة المتصلة فوراً؟')) return;
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'terminateSession' }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onlineUsersCount = users.filter((u) => u.isOnline).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-workshop-bg text-gray-900 dark:text-gray-100 font-sans p-4 md:p-6 selection:bg-dahab-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* هيدر لوحة التحكم */}
        <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dahab-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-2xl shadow-lg shadow-dahab-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-dahab-500 to-amber-600 bg-clip-text text-transparent">
                  لوحة تحكم المشرف وإدارة الفنيين
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-dahab-500/20 text-dahab-600 dark:text-dahab-400">
                  ADMIN PORTAL
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                منظومة Dahab Device Doctor - التحكم الحصري في الحسابات، مدة الصلاحية، وجلسة الجهاز الواحد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ThemeToggle />

            <Link
              href="/ecosystem"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-700 dark:text-dahab-300 transition"
              title="استعراض منظومة برمجيات دهب سوفت وير"
            >
              <Crown className="w-4 h-4 text-dahab-500" />
              <span>برمجيات دهب 👑</span>
            </Link>

            <Link
              href="/admin/keys"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dahab-500/15 hover:bg-dahab-500/25 border border-dahab-500/30 text-xs font-bold text-dahab-700 dark:text-dahab-300 transition"
              title="فتح صفحة المفاتيح في رابط مباشر ومستقل"
            >
              <Key className="w-4 h-4 text-dahab-500" />
              <span>رابط المفاتيح (/admin/keys)</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 transition"
            >
              <span>العودة لشاشة الفحص 🩺</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* أزرار التبديل بين التبويبات في لوحة التحكم */}
        <div className="flex items-center gap-2 p-1.5 bg-gray-200/70 dark:bg-gray-900 rounded-2xl max-w-fit border border-gray-300/50 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('technicians')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              activeTab === 'technicians'
                ? 'bg-white dark:bg-workshop-card text-dahab-600 dark:text-dahab-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>إدارة المهندسين والاشتراكات ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              activeTab === 'keys'
                ? 'bg-white dark:bg-workshop-card text-dahab-600 dark:text-dahab-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Key className="w-4 h-4 text-dahab-500" />
            <span>مفاتيح الذكاء الاصطناعي واختبار الاتصال الحي ⚡</span>
          </button>
        </div>

        {/* تبويب المفاتيح */}
        {activeTab === 'keys' && <AIKeysManager />}

        {/* تبويب الفنيين والإحصائيات */}
        {activeTab === 'technicians' && (
          <>
            {/* كروت الإحصائيات والمراقبة الحية */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>المتصلون بالمعمل الآن (Live)</span>
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                </div>
                <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {onlineUsersCount}
                </div>
                <div className="text-[10px] text-gray-400">فني متصل حالياً بنشاط مؤكد</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center justify-between">
                  <span>إجمالي الفحوصات المسجلة</span>
                  <Activity className="w-4 h-4 text-dahab-500" />
                </div>
                <div className="text-3xl font-black font-mono text-gray-900 dark:text-gray-100">
                  {sessionsCount}
                </div>
                <div className="text-[10px] text-gray-400">تقرير تشخيص محفوظ</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
                <div className="text-xs font-bold text-rose-500 flex items-center justify-between">
                  <span>أعطال هاردوير مشخصة</span>
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="text-3xl font-black font-mono text-rose-500">
                  {hwCount}
                </div>
                <div className="text-[10px] text-gray-400">شورت، ممانعات، وتبديل آيسيات</div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
                <div className="text-xs font-bold text-dahab-600 dark:text-dahab-400 flex items-center justify-between">
                  <span>إجمالي الحسابات الصادرة</span>
                  <Users className="w-4 h-4 text-dahab-500" />
                </div>
                <div className="text-3xl font-black font-mono text-dahab-600 dark:text-dahab-400">
                  {users.length}
                </div>
                <div className="text-[10px] text-gray-400">فني ومهندس مصرح لهم</div>
              </div>
            </div>

            {/* قسم إدارة المستخدمين والفنيين */}
            <div className="p-5 rounded-3xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-dahab-500" />
                  <div>
                    <h2 className="text-base font-black text-gray-900 dark:text-gray-100">
                      إدارة حسابات الفنيين وتحديد مدة الصلاحية والجلسات
                    </h2>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      يتم إصدار الحسابات حصرياً من هنا وتعمل على جهاز واحد فقط لكل فني
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-md shadow-dahab-500/25"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>إصدار حساب فني جديد 🔑</span>
                </button>
              </div>

              {/* جدول المستخدمين والاشتراكات */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-gray-100 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="p-3">الفني والصفة</th>
                      <th className="p-3">اسم الدخول</th>
                      <th className="p-3">حالة الاتصال (Live)</th>
                      <th className="p-3">صلاحية الاشتراك</th>
                      <th className="p-3">التخصص</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3 text-center">تمديد الاشتراك / إدارة الجلسة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {users.map((u) => {
                      const isExpired = u.subscriptionStatus?.isExpired;
                      const daysLeft = u.subscriptionStatus?.daysRemaining ?? 9999;
                      const isOnline = u.isOnline;

                      return (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/50 transition">
                          <td className="p-3">
                            <div className="font-bold text-gray-900 dark:text-gray-100">
                              {u.name}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {u.role === 'admin' ? '👑 المشرف العام' : '🔧 فني صيانة معتمد'}
                            </div>
                          </td>

                          <td className="p-3 font-mono text-gray-700 dark:text-gray-300">
                            @{u.username}
                          </td>

                          <td className="p-3">
                            {isOnline ? (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20 max-w-fit">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>متصل الآن</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Laptop className="w-3 h-3" />
                                <span>غير متصل</span>
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            {u.role === 'admin' || !u.expiresAt ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                ∞ غير محدود (دائم)
                              </span>
                            ) : isExpired ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-[10px] border border-rose-500/30 flex items-center gap-1 max-w-fit">
                                <AlertTriangle className="w-3 h-3" />
                                <span>انتهى الاشتراك</span>
                              </span>
                            ) : (
                              <div className="space-y-0.5">
                                <span
                                  className={`text-xs font-black ${
                                    daysLeft <= 7
                                      ? 'text-amber-500'
                                      : 'text-gray-800 dark:text-gray-200'
                                  }`}
                                >
                                  متبقي {daysLeft} يوم
                                </span>
                                <div className="text-[9px] text-gray-400">
                                  ينتهي: {new Date(u.expiresAt).toLocaleDateString('ar-EG')}
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                            {u.specialty || 'صيانة عامة'}
                          </td>

                          <td className="p-3">
                            <button
                              onClick={() => handleToggleStatus(u.id)}
                              className={`flex items-center gap-1 text-[11px] font-bold ${
                                u.active
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-gray-400'
                              }`}
                            >
                              {u.active ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>مفعل</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>معطل</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* تمديد 30 يوم */}
                              <button
                                onClick={() => handleExtendSubscription(u.id, 30)}
                                className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-[10px] font-bold text-gray-700 dark:text-gray-300 transition"
                                title="تمديد الاشتراك 30 يوم إضافية"
                              >
                                +30 يوم
                              </button>

                              {/* تمديد 90 يوم */}
                              <button
                                onClick={() => handleExtendSubscription(u.id, 90)}
                                className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-[10px] font-bold text-gray-700 dark:text-gray-300 transition"
                                title="تمديد الاشتراك 90 يوم إضافية"
                              >
                                +90 يوم
                              </button>

                              {/* طرد الجلسة عن بعد */}
                              {u.activeSessionToken && (
                                <button
                                  onClick={() => handleTerminateSession(u.id)}
                                  className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition"
                                  title="طرد الجلسة الحالية وإخراج المستخدم فوراً"
                                >
                                  <PowerOff className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* زر الحذف */}
                              {u.username !== 'dahab' && (
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-1 text-gray-400 hover:text-rose-500 rounded-lg transition"
                                  title="حذف الحساب نهائياً"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* مودال إصدار حساب فني جديد مع مدة الاشتراك */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-dahab-500/40 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
              <h3 className="font-black text-base text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-2">
                إصدار حساب جديد لفني أو مهندس مع تحديد مدة الصلاحية
              </h3>

              <form onSubmit={handleAddUser} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    الاسم بالكامل:
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثلاً: م. عادل إبراهيم"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      اسم المستخدم (اسم الدخول):
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="tech_adel"
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      فترة صلاحية الاشتراك:
                    </label>
                    <select
                      value={subscriptionDays}
                      onChange={(e) => setSubscriptionDays(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                    >
                      <option value="30">شهر واحد (30 يوم)</option>
                      <option value="90">3 أشهر (90 يوم)</option>
                      <option value="180">6 أشهر (نصف سنة)</option>
                      <option value="365">سنة كاملة (365 يوم)</option>
                      <option value="unlimited">اشتراك دائم (غير محدود)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    التخصص الفني:
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="مثلاً: صيانة شاشات، كروت باور، سواب معالجات، لابتوب"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    كلمة المرور الحصرية:
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500 font-mono"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-md shadow-dahab-500/25"
                  >
                    إصدار وتفعيل الحساب فوراً 🚀
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
