'use client';

import React, { useEffect, useState } from 'react';
import { Users, Wifi, Activity, Clock, Monitor, LogOut, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { terminateUserSession } from '@/lib/auth';

export default function OnlineUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 15000); // تحديث كل 15 ثانية
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        const onlineUsers = data.users?.filter((u: any) => u.isOnline) || [];
        setUsers(onlineUsers);
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (userId: string, username: string) => {
    if (!confirm(`هل أنت متأكد من إنهاء جلسة المستخدم ${username}؟`)) return;

    try {
      const res = await fetch('/api/admin/terminate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        alert('تم إنهاء الجلسة بنجاح');
        fetchUsers();
      } else {
        alert('فشل في إنهاء الجلسة');
      }
    } catch (e) {
      console.error('Failed to terminate session:', e);
      alert('حدث خطأ أثناء إنهاء الجلسة');
    }
  };

  const onlineUsers = users.filter(u => u.isOnline);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0B0F17] dark:via-[#111827] dark:to-[#0B0F17] text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 hover:bg-gray-200 dark:hover:bg-[#111827] rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Wifi className="w-7 h-7 md:w-8 md:h-8 text-emerald-600 dark:text-emerald-400" />
              المستخدمين المتصلين حالياً
            </h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">{onlineUsers.length} متصل</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-dahab-600 dark:text-dahab-400" />
            <p>جاري تحميل البيانات...</p>
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-12 shadow-xl text-center">
            <Wifi className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold mb-2">لا يوجد مستخدمين متصلين حالياً</h2>
            <p className="text-gray-600 dark:text-gray-400">سيظهر المستخدمون هنا عند تسجيل الدخول</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-right p-3 text-sm font-bold text-gray-900 dark:text-gray-100">المستخدم</th>
                    <th className="text-right p-3 text-sm font-bold text-gray-900 dark:text-gray-100">الدور</th>
                    <th className="text-right p-3 text-sm font-bold text-gray-900 dark:text-gray-100">مدة الاتصال</th>
                    <th className="text-right p-3 text-sm font-bold text-gray-900 dark:text-gray-100">الجهاز</th>
                    <th className="text-right p-3 text-sm font-bold text-gray-900 dark:text-gray-100">آخر نشاط</th>
                    <th className="text-right p-3 text-sm font-bold text-gray-900 dark:text-gray-100">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {onlineUsers.map((user) => {
                    const connectionTime = user.lastSeenAt
                      ? Math.floor((Date.now() - new Date(user.lastSeenAt).getTime()) / 1000 / 60)
                      : 0;

                    return (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#0B0F17]">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm">
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
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            {connectionTime < 1 ? 'أقل من دقيقة' : `${connectionTime} دقيقة`}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Monitor className="w-4 h-4" />
                            {user.deviceInfo || 'غير معروف'}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                          {user.lastSeenAt ? new Date(user.lastSeenAt).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : '-'}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleTerminateSession(user.id, user.username)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            إنهاء الجلسة
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
