'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, Zap, Key, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface DailyStats {
  date: string;
  gemini: {
    total_requests: number;
    total_tokens: number;
    success_count: number;
    error_count: number;
    active_keys: number;
  };
  openrouter: {
    total_requests: number;
    total_tokens: number;
    success_count: number;
    error_count: number;
    active_keys: number;
  };
  openai: {
    total_requests: number;
    total_tokens: number;
    success_count: number;
    error_count: number;
    active_keys: number;
  };
  deepseek: {
    total_requests: number;
    total_tokens: number;
    success_count: number;
    error_count: number;
    active_keys: number;
  };
}

interface TotalStats {
  gemini: {
    total_requests: number;
    total_tokens: number;
    success_count: number;
    error_count: number;
    days_active: number;
    active_keys: number;
  };
  openrouter: {
    total_requests: number;
    total_tokens: number;
    success_count: number;
    error_count: number;
    days_active: number;
    active_keys: number;
  };
  openai: {
    total_requests: number;
    total_tokens: number;
    success_count: number;
    error_count: number;
    days_active: number;
    active_keys: number;
  };
  deepseek: {
    total_requests: number;
    total_tokens: number;
    success_count: number;
    error_count: number;
    days_active: number;
    active_keys: number;
  };
}

export default function KeysStatsDashboard() {
  const [viewMode, setViewMode] = useState<'daily' | 'total'>('daily');
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [totalStats, setTotalStats] = useState<TotalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const type = viewMode === 'daily' ? 'daily' : 'total';
      const res = await fetch(`/api/admin/keys-stats?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        if (viewMode === 'daily') {
          setDailyStats(data.data);
        } else {
          setTotalStats(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [viewMode]);

  const handleRefresh = () => {
    fetchStats();
  };

  const ProviderCard = ({
    name,
    icon,
    color,
    stats,
    isTotal
  }: {
    name: string;
    icon: string;
    color: string;
    stats: any;
    isTotal: boolean;
  }) => {
    if (!stats) return null;

    const successRate = stats.total_requests > 0
      ? ((stats.success_count / stats.total_requests) * 100).toFixed(1)
      : '0';

    return (
      <div className="rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-gray-800 shadow-md overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 text-${color}-500 flex items-center justify-center text-xl`}>
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">{name}</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {isTotal ? `نشط ${stats.days_active} يوم` : 'إحصائيات اليوم'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-black text-${color}-600 dark:text-${color}-400`}>
              {stats.active_keys} مفتاح
            </span>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-[10px] mb-1">
                <Zap className="w-3 h-3" />
                الطلبات
              </div>
              <p className="text-lg font-black text-gray-900 dark:text-gray-100">
                {stats.total_requests.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-[10px] mb-1">
                <Key className="w-3 h-3" />
                التوكنات
              </div>
              <p className="text-lg font-black text-gray-900 dark:text-gray-100">
                {(stats.total_tokens / 1000).toFixed(1)}K
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[10px] mb-1">
                <CheckCircle2 className="w-3 h-3" />
                نجاح
              </div>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {stats.success_count.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-[10px] mb-1">
                <AlertCircle className="w-3 h-3" />
                أخطاء
              </div>
              <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                {stats.error_count.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-[10px]">
                <TrendingUp className="w-3 h-3" />
                نسبة النجاح
              </div>
              <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                {successRate}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* هيدر لوحة المراقبة */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dahab-400 to-amber-600 flex items-center justify-center text-slate-950">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">
              مراقبة استخدام المفاتيح
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              تتبع الاستخدام اليومي والإجمالي لكل مفتاح
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              viewMode === 'daily'
                ? 'bg-dahab-500 text-slate-950'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            اليومي
          </button>
          <button
            onClick={() => setViewMode('total')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              viewMode === 'total'
                ? 'bg-dahab-500 text-slate-950'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            الإجمالي
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-gray-500 animate-pulse">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-dahab-500" />
          جاري تحميل البيانات...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProviderCard
            name="Google Gemini"
            icon="⚡"
            color="blue"
            stats={viewMode === 'daily' ? dailyStats?.gemini : totalStats?.gemini}
            isTotal={viewMode === 'total'}
          />
          <ProviderCard
            name="OpenRouter"
            icon="🚀"
            color="purple"
            stats={viewMode === 'daily' ? dailyStats?.openrouter : totalStats?.openrouter}
            isTotal={viewMode === 'total'}
          />
          <ProviderCard
            name="OpenAI"
            icon="🤖"
            color="emerald"
            stats={viewMode === 'daily' ? dailyStats?.openai : totalStats?.openai}
            isTotal={viewMode === 'total'}
          />
          <ProviderCard
            name="DeepSeek"
            icon="🔍"
            color="amber"
            stats={viewMode === 'daily' ? dailyStats?.deepseek : totalStats?.deepseek}
            isTotal={viewMode === 'total'}
          />
        </div>
      )}
    </div>
  );
}
