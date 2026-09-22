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
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { UserAccount } from '@/lib/auth';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
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

  const fetchData = async () => {
    try {
      // 1. جلب المستخدمين
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
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, role, specialty, password }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setName('');
        setUsername('');
        setSpecialty('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('هل تريد بالتأكيد حذف هذا المستخدم؟')) return;
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-workshop-bg text-gray-900 dark:text-gray-100 font-sans p-4 md:p-6 selection:bg-dahab-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* هيدر لوحة التحكم */}
        <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dahab-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-2xl shadow-lg shadow-dahab-500/20">
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
                منظومة Dahab Device Doctor - إدارة فريق العمل وصلاحيات الوصول وإحصائيات المعمل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              href="/"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 transition"
            >
              <span>العودة لشاشة الفحص 🩺</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* كروت الإحصائيات العامة للمعمل */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <span>إجمالي الأجهزة المفحوصة</span>
              <Activity className="w-4 h-4 text-dahab-500" />
            </div>
            <div className="text-3xl font-black font-mono text-gray-900 dark:text-gray-100">
              {sessionsCount}
            </div>
            <div className="text-[10px] text-gray-400">مسجلة في ملفات الـ JSON</div>
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
            <div className="text-xs font-bold text-sky-500 flex items-center justify-between">
              <span>أعطال سوفتوير وفريموير</span>
              <Terminal className="w-4 h-4" />
            </div>
            <div className="text-3xl font-black font-mono text-sky-500">
              {swCount}
            </div>
            <div className="text-[10px] text-gray-400">بوت لوب، تفليش، وإصلاح بوت</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-lg space-y-1">
            <div className="text-xs font-bold text-emerald-500 flex items-center justify-between">
              <span>فريق الفنيين والمهندسين</span>
              <Users className="w-4 h-4" />
            </div>
            <div className="text-3xl font-black font-mono text-emerald-500">
              {users.length}
            </div>
            <div className="text-[10px] text-gray-400">مهندس مصرح لهم بالعمل</div>
          </div>
        </div>

        {/* قسم إدارة المستخدمين والفنيين */}
        <div className="p-5 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-dahab-500" />
              <h2 className="text-base font-black text-gray-900 dark:text-gray-100">
                سجل الفنيين والمستخدمين المصرح لهم (Users & Technicians)
              </h2>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-md shadow-dahab-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة فني جديد</span>
            </button>
          </div>

          {/* جدول المستخدمين */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-100 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="p-3">الاسم والصفة</th>
                  <th className="p-3">اسم المستخدم</th>
                  <th className="p-3">الدور / الصلاحية</th>
                  <th className="p-3">التخصص الدقيق</th>
                  <th className="p-3">عدد الفحوصات</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/50 transition">
                    <td className="p-3 font-bold text-gray-900 dark:text-gray-100">
                      {u.name}
                    </td>
                    <td className="p-3 font-mono text-gray-600 dark:text-gray-400">
                      @{u.username}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          u.role === 'admin'
                            ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                            : 'bg-dahab-100 dark:bg-dahab-950/40 text-dahab-800 dark:text-dahab-300 border border-dahab-300 dark:border-dahab-800'
                        }`}
                      >
                        {u.role === 'admin' ? 'مشرف عام' : 'مهندس فحص'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">
                      {u.specialty || 'صيانة عامة'}
                    </td>
                    <td className="p-3 font-mono font-bold text-dahab-600 dark:text-dahab-400">
                      {u.diagnosesCount || 0} جهاز
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={`flex items-center gap-1 text-[11px] font-bold ${
                          u.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                        }`}
                      >
                        {u.active ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>نشط</span>
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
                      {u.username !== 'dahab' && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg transition"
                          title="حذف المستخدم"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* مودال إضافة فني جديد */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-dahab-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
              <h3 className="font-black text-base text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-2">
                إضافة مهندس أو فني جديد للمنظومة
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
                    placeholder="مثلاً: م. خالد الصاوي"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      اسم المستخدم:
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="tech_khaled"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      الصلاحية:
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                    >
                      <option value="technician">فني صيانة</option>
                      <option value="admin">مشرف عام</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    التخصص الدقيق:
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="مثلاً: صيانة شاشات وكروت باور، أو آيفون وماك"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    كلمة المرور الأولية:
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-dahab-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-slate-950 font-black text-xs transition"
                  >
                    حفظ وإضافة الفني
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
