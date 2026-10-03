'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Users, Ticket, Activity, Zap, Shield, Globe, Clock, UserCheck, UserX, Lock, Unlock, Wifi } from 'lucide-react';
import { localStorageStats } from '@/lib/localStorage';
import Link from 'next/link';
import ProductivityStats from '@/components/ProductivityStats';
import { useDiagnosticContext } from '@/contexts/DiagnosticContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [lockedCount, setLockedCount] = useState(0);
  const { getProductivityStats } = useDiagnosticContext();

  useEffect(() => {
    setStats(localStorageStats.getStats());

    // جلب بيانات المستخدمين مع حالة الاتصال
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
          setOnlineCount(data.users?.filter((u: any) => u.isOnline).length || 0);
          setLockedCount(data.users?.filter((u: any) => u.lockedUntil && new Date(u.lockedUntil) > new Date()).length || 0);
        }
      } catch (e) {
        console.error('Failed to fetch users:', e);
      }
    };

    fetchUsers();

    // تحديث الحالة كل 30 ثانية
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0B0F17] dark:via-[#111827] dark:to-[#0B0F17] text-gray-900 dark:text-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">لوحة التحكم</h1>
          <p>جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0B0F17] dark:via-[#111827] dark:to-[#0B0F17] text-gray-900 dark:text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Shield className="w-8 h-8 text-dahab-600 dark:text-dahab-400" />
          لوحة التحكم الأمنية
        </h1>

        {/* بطاقات الإحصاس */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl border-l-4 border-dahab-500">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-dahab-500/20 text-dahab-600 dark:text-dahab-400 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalDiagnoses}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي التشخيصات</p>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">المستخدمين</p>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl border-l-4 border-emerald-500">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{onlineCount}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">متصل الآن</p>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{lockedCount}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">حسابات مقفولة</p>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl border-l-4 border-rose-500">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Ticket className="w-6 h-6" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.openTickets}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">تذاكر مفتوحة</p>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{Object.keys(stats.diagnosesByEngine).length}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">المحركات النشطة</p>
          </div>
        </div>

        {/* إحصائيات الإنتاجية الشخصية */}
        <div className="mb-8">
          <ProductivityStats stats={getProductivityStats()} />
        </div>

        {/* جدول المستخدمين مع حالة الاتصال */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5" />
              حالة المستخدمين والاتصال
            </h2>
            <Link
              href="/admin/online-users"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Wifi className="w-4 h-4" />
              المستخدمين المتصلين
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-right p-3 text-sm font-bold text-gray-900 dark:text-gray-100">المستخدم</th>
                  <th className="text-right p-3 text-sm font-bold text-gray-900 dark:text-gray-100">الدور</th>
                  <th className="text-right p-3 text-sm font-bold text-gray-900 dark:text-gray-100">حالة الحساب</th>
                  <th className="text-right p-3 text-sm font-bold text-gray-900 dark:text-gray-100">الاتصال</th>
                  <th className="text-right p-3 text-sm font-bold text-gray-900 dark:text-gray-100">آخر ظهور</th>
                  <th className="text-right p-3 text-sm font-bold text-gray-900 dark:text-gray-100">الجهاز</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isLocked = user.lockedUntil && new Date(user.lockedUntil) > new Date();
                  return (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#0B0F17]">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dahab-500 to-amber-400 flex items-center justify-center text-slate-950 font-bold text-sm">
                            {user.name?.charAt(0) || user.username?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{user.name || user.username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {user.role === 'admin' ? 'مشرف' : 'فني'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {isLocked ? (
                            <>
                              <Lock className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">مقفول</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-4 h-4 text-emerald-500" />
                              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">مفتوح</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {user.isOnline ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">متصل</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-gray-400" />
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">غير متصل</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                        {user.lastSeenAt ? new Date(user.lastSeenAt).toLocaleDateString('ar-EG', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : '-'}
                      </td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                        {user.deviceInfo || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* التشخيصات حسب المحرك */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            التشخيصات حسب المحرك
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.diagnosesByEngine).map(([engine, count]) => (
              <div key={engine} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0B0F17] rounded-xl">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{engine}</span>
                <span className="text-sm font-bold text-dahab-600 dark:text-dahab-400">{count as number}</span>
              </div>
            ))}
          </div>
        </div>

        {/* التشخيصات حسب التخصص */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            التشخيصات حسب التخصص
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.diagnosesBySpecialty).map(([specialty, count]) => (
              <div key={specialty} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0B0F17] rounded-xl">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{specialty}</span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
