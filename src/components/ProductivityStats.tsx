'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, Activity, Zap, Award, BarChart3 } from 'lucide-react';

interface DailyStats {
  date: string;
  diagnosisCount: number;
  totalMinutes: number;
}

interface ProductivityStatsProps {
  stats?: DailyStats[];
}

export default function ProductivityStats({ stats = [] }: ProductivityStatsProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Load stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dahab_productivity_stats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter stats to keep only last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const filtered = parsed.filter((s: DailyStats) => new Date(s.date) >= thirtyDaysAgo);
        if (filtered.length > 0) {
          stats = filtered;
        }
      } catch (e) {
        console.error('Failed to load productivity stats:', e);
      }
    }
  }, []);

  // Get today's stats
  const today = new Date().toISOString().split('T')[0];
  const todayStats = stats.find(s => s.date === today) || { date: today, diagnosisCount: 0, totalMinutes: 0 };

  // Get this month's stats
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyStats = stats.filter(s => s.date.startsWith(currentMonth));
  const monthlyTotal = monthlyStats.reduce((acc, s) => ({
    diagnosisCount: acc.diagnosisCount + s.diagnosisCount,
    totalMinutes: acc.totalMinutes + s.totalMinutes,
  }), { diagnosisCount: 0, totalMinutes: 0 });

  // Calculate averages
  const avgTimePerDiagnosis = todayStats.diagnosisCount > 0
    ? Math.round(todayStats.totalMinutes / todayStats.diagnosisCount)
    : 0;

  const monthlyAvgTime = monthlyTotal.diagnosisCount > 0
    ? Math.round(monthlyTotal.totalMinutes / monthlyTotal.diagnosisCount)
    : 0;

  // Format time
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} س ${mins} د` : `${hours} س`;
  };

  // Calculate productivity score (0-100)
  const calculateScore = (diagnoses: number, minutes: number) => {
    if (diagnoses === 0) return 0;
    const targetTimePerDiagnosis = 15; // 15 minutes target
    const efficiency = Math.min(100, (targetTimePerDiagnosis / Math.max(minutes / diagnoses, 1)) * 100);
    const volumeScore = Math.min(100, diagnoses * 10);
    return Math.round((efficiency + volumeScore) / 2);
  };

  const todayScore = calculateScore(todayStats.diagnosisCount, todayStats.totalMinutes);
  const monthlyScore = calculateScore(monthlyTotal.diagnosisCount, monthlyTotal.totalMinutes);

  // Last 7 days for chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const chartData = last7Days.map(date => {
    const dayStats = stats.find(s => s.date === date);
    return {
      date: new Date(date).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' }),
      count: dayStats?.diagnosisCount || 0,
    };
  });

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dahab-500 to-amber-500 flex items-center justify-center shadow-lg shadow-dahab-500/20">
            <BarChart3 className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">إحصائيات الإنتاجية</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">تتبع أداءك في تشخيص الأعطال</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              viewMode === 'daily'
                ? 'bg-dahab-500 text-slate-950'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            يومي
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              viewMode === 'monthly'
                ? 'bg-dahab-500 text-slate-950'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            شهري
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      {viewMode === 'daily' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Diagnosis Count */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">التشخيصات اليوم</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{todayStats.diagnosisCount}</p>
          </div>

          {/* Time Spent */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">الوقت المستغرك</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{formatTime(todayStats.totalMinutes)}</p>
          </div>

          {/* Avg Time */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">متوسط الوقت</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{avgTimePerDiagnosis} د</p>
          </div>

          {/* Productivity Score */}
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">درجة الإنتاجية</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{todayScore}%</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Monthly Diagnosis Count */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">تشخيصات الشهر</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{monthlyTotal.diagnosisCount}</p>
          </div>

          {/* Monthly Time */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">وقت الشهر</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{formatTime(monthlyTotal.totalMinutes)}</p>
          </div>

          {/* Monthly Avg */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">متوسط شهري</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{monthlyAvgTime} د</p>
          </div>

          {/* Monthly Score */}
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">درجة الشهر</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{monthlyScore}%</p>
          </div>
        </div>
      )}

      {/* Weekly Chart */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-dahab-500" />
          <span>آخر 7 أيام</span>
        </h3>
        <div className="flex items-end gap-2 h-32 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          {chartData.map((data, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-gradient-to-t from-dahab-500 to-amber-500 rounded-t-lg transition-all hover:from-dahab-600 hover:to-amber-600"
                style={{
                  height: `${(data.count / maxCount) * 100}%`,
                  minHeight: data.count > 0 ? '8px' : '0',
                }}
              />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">{data.date}</span>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{data.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="p-4 bg-gradient-to-r from-dahab-500/10 to-amber-500/10 border border-dahab-500/30 rounded-xl">
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          💡 <span className="font-bold">نصيحة:</span> الهدف هو إتمام 8-10 تشخيصات يومياً بمتوسط 15 دقيقة لكل تشخيص. درجة الإنتاجية تحسب بناءً على السرعة والكمية.
        </p>
      </div>
    </div>
  );
}
