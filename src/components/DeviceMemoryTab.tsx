'use client';

import React, { useState } from 'react';
import {
  History,
  Search,
  Cpu,
  Smartphone,
  Laptop,
  Monitor,
  Trash2,
  Download,
  ArrowRight,
  MessageSquare,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { RepairSession } from '@/lib/types';

interface DeviceMemoryTabProps {
  sessions: RepairSession[];
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewSession: () => void;
  onSwitchToChat: () => void;
}

export default function DeviceMemoryTab({
  sessions,
  onSelectSession,
  onDeleteSession,
  onNewSession,
  onSwitchToChat,
}: DeviceMemoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mobile' | 'laptop' | 'desktop'>('all');

  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.deviceModel && s.deviceModel.toLowerCase().includes(q)) ||
      (s.deviceType && s.deviceType.toLowerCase().includes(q));

    if (!matchesQuery) return false;

    if (filterType === 'all') return true;
    if (filterType === 'mobile') return s.deviceType?.includes('mobile');
    if (filterType === 'laptop') return s.deviceType?.includes('laptop');
    if (filterType === 'desktop') return s.deviceType?.includes('tv') || s.deviceType?.includes('general');
    return true;
  });

  const getDeviceIcon = (deviceType?: string) => {
    if (deviceType?.includes('laptop')) return Laptop;
    if (deviceType?.includes('mobile')) return Smartphone;
    return Monitor;
  };

  const handleExportSingle = (session: RepairSession) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(session, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `dahab_device_${session.id}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header والتحكم السريع */}
      <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dahab-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-dahab-500/20">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>ذاكرة الأجهزة والمحادثات السابقة</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-dahab-500/15 text-dahab-700 dark:text-dahab-300 font-bold border border-dahab-500/30">
                {sessions.length} جهاز مسجل
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              أرشيف شامل لجميع الأجهزة والتقارير والتشخيصات الذكية التي قمت بفحصها، مع إمكانية استرجاع أي جهاز فوراً
            </p>
          </div>
        </div>

        <button
          onClick={onNewSession}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-dahab-500 to-amber-600 text-slate-950 font-black text-xs hover:from-dahab-600 hover:to-amber-700 transition flex items-center gap-2 shadow-lg shadow-dahab-500/20 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>+ فحص جهاز جديد الآن</span>
        </button>
      </div>

      {/* 2. شريط البحث والفلترة */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في الأجهزة السابقة باسم الموديل أو العطل..."
            className="w-full pr-9 pl-4 py-2 bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-2xl text-xs text-gray-800 dark:text-gray-200 outline-none focus:border-dahab-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-workshop-card p-1 rounded-2xl border border-gray-200 dark:border-workshop-border text-xs font-bold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl transition ${filterType === 'all' ? 'bg-dahab-500 text-slate-950' : 'text-gray-600 dark:text-gray-400'}`}
          >
            الكل ({sessions.length})
          </button>
          <button
            onClick={() => setFilterType('mobile')}
            className={`px-3 py-1.5 rounded-xl transition ${filterType === 'mobile' ? 'bg-dahab-500 text-slate-950' : 'text-gray-600 dark:text-gray-400'}`}
          >
            📱 هواتف
          </button>
          <button
            onClick={() => setFilterType('laptop')}
            className={`px-3 py-1.5 rounded-xl transition ${filterType === 'laptop' ? 'bg-dahab-500 text-slate-950' : 'text-gray-600 dark:text-gray-400'}`}
          >
            💻 لابتوبات
          </button>
        </div>
      </div>

      {/* 3. قائمة الأجهزة المفحوصة سابقاً */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-gray-800/80 mx-auto flex items-center justify-center text-gray-400">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
            {searchQuery ? 'لا توجد أجهزة مطابقة للبحث' : 'لا توجد أجهزة مسجلة في الذاكرة بعد'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            عند إجراء أي تشخيص ذكي لأي هاتف أو لابتوب، سيتم حفظ الجلسة بالكامل هنا مع قراءات الباور ومحادثة الـ AI للرجوع إليها مستقبلاً.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => {
            const Icon = getDeviceIcon(session.deviceType);
            const messagesCount = session.messages?.length || 0;
            const assistantMsg = [...(session.messages || [])].reverse().find((m) => m.sender === 'assistant');
            const userMsg = session.messages?.find((m) => m.sender === 'user');

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border hover:border-dahab-500/50 rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-all group"
              >
                <div className="space-y-3">
                  {/* رأس البطاقة */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-dahab-500/15 text-dahab-600 dark:text-dahab-400 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 group-hover:text-dahab-500 transition line-clamp-1">
                          {session.deviceModel || session.title || 'جهاز بدون اسم'}
                        </h4>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.createdAt ? new Date(session.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'مؤخراً'}
                        </span>
                      </div>
                    </div>

                    {session.metrics?.classification && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        session.metrics.classification === 'HARDWARE'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                      }`}>
                        {session.metrics.classification === 'HARDWARE' ? 'عطل هاردوير' : 'عطل سوفتوير'}
                      </span>
                    )}
                  </div>

                  {/* ملخص العطل */}
                  {userMsg?.text && (
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                      <span className="font-bold text-dahab-600 dark:text-dahab-400">العطل: </span>
                      {userMsg.text}
                    </div>
                  )}

                  {/* جزء من تشخيص الذكاء الاصطناعي */}
                  {assistantMsg?.text && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                      {assistantMsg.text.replace(/[*#_`]/g, '')}
                    </p>
                  )}
                </div>

                {/* أزرار الإجراءات في أسفل البطاقة */}
                <div className="pt-4 mt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleExportSingle(session)}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition"
                      title="تصدير ملف JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 transition"
                      title="حذف الجلسة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectSession(session.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <span>استرجاع للفحص</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
