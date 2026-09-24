'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Users, Ticket, Activity, Zap } from 'lucide-react';
import { localStorageStats } from '@/lib/localStorage';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setStats(localStorageStats.getStats());
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
        <h1 className="text-3xl font-bold mb-6">لوحة التحكم</h1>

        {/* بطاقات الإحصائ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-dahab-500/20 text-dahab-600 dark:text-dahab-400 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalDiagnoses}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي التشخيصات</p>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">المستخدمين</p>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Ticket className="w-6 h-6" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.openTickets}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">تذاكر مفتوحة</p>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{Object.keys(stats.diagnosesByEngine).length}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">المحركات النشطة</p>
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
