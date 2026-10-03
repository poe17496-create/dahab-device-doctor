'use client';

import React, { useEffect, useState } from 'react';
import { Zap, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';

interface KeyPoolStat {
  provider: string;
  totalKeys: number;
  currentIndex: number;
  successCount: number;
  failureCount: number;
  lastUsed: string | null;
  lastError: string | null;
}

interface KeyPoolStatsResponse {
  success: boolean;
  stats: KeyPoolStat[];
  summary: {
    totalKeys: number;
    totalSuccesses: number;
    totalFailures: number;
    providersWithKeys: number;
  };
}

export default function KeyPoolStats() {
  const [stats, setStats] = useState<KeyPoolStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/key-pool-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch key pool stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetRotation = async (provider?: string) => {
    try {
      const res = await fetch('/api/admin/reset-key-rotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      if (res.ok) {
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to reset rotation:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl">
        <p>جاري تحميل إحصائيات المفاتيح...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl">
        <p className="text-red-500">فشل تحميل الإحصائيات</p>
      </div>
    );
  }

  const providerNames: Record<string, string> = {
    gemini: 'Google Gemini',
    openrouter: 'OpenRouter',
    openai: 'OpenAI',
    groq: 'Groq',
    deepseek: 'DeepSeek',
  };

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Zap className="w-6 h-6 text-dahab-600 dark:text-dahab-400" />
          إحصائيات مفتاح الذكاء الاصطناعي
        </h2>
        <button
          onClick={() => resetRotation()}
          className="flex items-center gap-2 px-4 py-2 bg-dahab-500 hover:bg-dahab-600 text-white rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          إعادة تعيين التدوير
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-dahab-50 to-orange-50 dark:from-dahab-900/20 dark:to-orange-900/20 rounded-xl p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المفاتيح</p>
          <p className="text-2xl font-bold text-dahab-600 dark:text-dahab-400">{stats.summary.totalKeys}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">النجاحات</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.summary.totalSuccesses}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">الفشل</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.summary.totalFailures}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">المزودين النشطين</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.summary.providersWithKeys}</p>
        </div>
      </div>

      {/* Provider Stats */}
      <div className="space-y-4">
        {stats.stats.map((stat) => (
          <div
            key={stat.provider}
            className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">{providerNames[stat.provider] || stat.provider}</h3>
                {stat.totalKeys > 0 ? (
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">
                    {stat.totalKeys} مفاتيح
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                    لا مفاتيح
                  </span>
                )}
              </div>
              <button
                onClick={() => resetRotation(stat.provider as any)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="إعادة تعيين التدوير"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-gray-600 dark:text-gray-400">النجاحات:</span>
                <span className="font-semibold">{stat.successCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-gray-600 dark:text-gray-400">الفشل:</span>
                <span className="font-semibold">{stat.failureCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">آخر استخدام:</span>
                <span className="font-semibold">
                  {stat.lastUsed ? new Date(stat.lastUsed).toLocaleTimeString('ar-EG') : 'لا يوجد'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-dahab-500" />
                <span className="text-gray-600 dark:text-gray-400">المفتاح الحالي:</span>
                <span className="font-semibold">#{stat.currentIndex + 1}</span>
              </div>
            </div>

            {stat.lastError && (
              <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400 truncate">{stat.lastError}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
