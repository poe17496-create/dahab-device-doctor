'use client';

import React, { useState, useEffect } from 'react';
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
  Layers,
  Bot,
} from 'lucide-react';
import { RepairSession } from '@/lib/types';

// حالات وأجهزة فحص نموذجية استرشادية جاهزة حتى لا يكون التبويب فارغاً أبداً
const BENCHMARK_REFERENCE_SESSIONS: RepairSession[] = [
  {
    id: 'ref_iphone_15_pro_max',
    title: 'iPhone 15 Pro Max - سحب 0.08A مع دفء بمحيط مسار VDD_MAIN',
    deviceType: 'mobile-repair',
    deviceModel: 'iPhone 15 Pro Max',
    status: 'diagnosed',
    powerReadings: { voltageInput: 4.2, currentBeforePower: 0.08, shortDetected: true },
    metrics: {
      classification: 'HARDWARE',
      hardwareProbability: 96,
      softwareProbability: 4,
      urgencyLevel: 'HIGH',
      recommendedAction: 'فحص خط VDD_MAIN وحقن 2.5V مع دخان الروزينا',
    },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    messages: [
      {
        id: 'm1',
        sender: 'user',
        text: 'الجهاز قاطع باور تماماً، عند التوصيل بالباور سبلاي يسحب 0.08A فوراً دون الضغط على مفتاح التشغيل مع دفء بسيط حول المعالج.',
        timestamp: 'منذ ساعتين',
      },
      {
        id: 'm2',
        sender: 'assistant',
        text: 'تشخيص هندسي: سحب 0.08A فوري قبل الإقلاع يشير لتسريب أو ممانعة هابطة على خط PP_VDD_MAIN. افحص مكثفات الفلترة C3201 و C3204 واحقن 2.5V بتيار 2A مع استخدام الدخان الصمغي (Rosin Smoke).',
        timestamp: 'منذ ساعتين',
      },
    ],
  },
  {
    id: 'ref_macbook_pro_m3',
    title: 'MacBook Pro M3 (A2992) - توقف الشحن ونبضات على مسار PPBUS_AON',
    deviceType: 'laptop-motherboard',
    deviceModel: 'MacBook Pro 14" M3',
    status: 'diagnosed',
    powerReadings: { voltageInput: 5.0, currentBeforePower: 0.02 },
    metrics: {
      classification: 'HARDWARE',
      hardwareProbability: 94,
      softwareProbability: 6,
      urgencyLevel: 'MEDIUM',
      recommendedAction: 'فحص ممانعات خطوط CC وتفاوض شريحة CD3217',
    },
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    messages: [
      {
        id: 'm3',
        sender: 'user',
        text: 'شاحن Type-C يعطي 5V و 0.02A ثابتة ولا يصعد لـ 20V مع تكتكة نبضية على ملف الدخل.',
        timestamp: 'منذ 5 ساعات',
      },
      {
        id: 'm4',
        sender: 'assistant',
        text: 'تشخيص هندسي: عدم صعود الفولت لـ 20V يعني عدم اكتمال التفاوض عبر شريحة CD3217. قس ممانعات خطوط CC1/CC2 وتحقق من وجود قصر صريح على خط PPBUS_AON أو تلف مقاومة الإحساس بالتيار R5400.',
        timestamp: 'منذ 5 ساعات',
      },
    ],
  },
  {
    id: 'ref_samsung_s24_ultra',
    title: 'Samsung S24 Ultra - شاشة سوداء مع صوت إشعارات وتيار شحن طبيعي',
    deviceType: 'mobile-repair',
    deviceModel: 'Samsung Galaxy S24 Ultra',
    status: 'diagnosed',
    powerReadings: { voltageInput: 5.1, currentBeforePower: 1.85 },
    metrics: {
      classification: 'HARDWARE',
      hardwareProbability: 91,
      softwareProbability: 9,
      urgencyLevel: 'LOW',
      recommendedAction: 'فحص كونكتر FPC الشاشة وتغذية ELVDD',
    },
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    messages: [
      {
        id: 'm5',
        sender: 'user',
        text: 'الهاتف يرن ويعطي هزاز عند لمس الشاشة لكن لا توجد إضاءة أو بيانات نهائياً.',
        timestamp: 'منذ 12 ساعة',
      },
      {
        id: 'm6',
        sender: 'assistant',
        text: 'تشخيص هندسي: الجهاز يعمل سوفتويرياً. العطل محصور في دائرة الإضاءة والبيانات. افحص كونكتر الشاشة FPC بحثاً عن أسنان متآكلة، وقس جهود ELVDD (+4.6V) و ELVSS (-4.0V) المغذية للبانل.',
        timestamp: 'منذ 12 ساعة',
      },
    ],
  },
  {
    id: 'ref_asus_rog_z790',
    title: 'لوحة أم ASUS ROG Z790 - صفارة رام مستمرة وتوقف كود البوست على 55',
    deviceType: 'general-electronics',
    deviceModel: 'ASUS ROG MAXIMUS Z790',
    status: 'diagnosed',
    powerReadings: { voltageInput: 12.0, currentBeforePower: 2.1 },
    metrics: {
      classification: 'HARDWARE',
      hardwareProbability: 95,
      softwareProbability: 5,
      urgencyLevel: 'MEDIUM',
      recommendedAction: 'فحص دائرة تغذية الذاكرة VDDQ وتوافقية الرام',
    },
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    messages: [
      {
        id: 'm7',
        sender: 'user',
        text: 'شاشة الـ Q-Code تتوقف عند 55 مع صفارة رامات مستمرة واللوحة ترفض إكمال البوست.',
        timestamp: 'أمس',
      },
      {
        id: 'm8',
        sender: 'assistant',
        text: 'تشخيص هندسي: كود 55 هو Memory Not Installed. افحص جهد تغذية الذاكرة VDDQ (1.2V) على ملفات الرام وتأكد من سلامة موسفت الـ High-Side، وتأكد من سلامة سوكت المعالج LGA1700.',
        timestamp: 'أمس',
      },
    ],
  },
];

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
  const [activeSubTab, setActiveSubTab] = useState<'devices' | 'chats'>('devices');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mobile' | 'laptop' | 'desktop'>('all');
  const [savedChats, setSavedChats] = useState<any[]>([]);

  // تحميل جلسات الشات المؤرشفة من localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('dahab_saved_chat_sessions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedChats(parsed);
      }
    } catch {}
  }, []);

  // دمج الجلسات الفعلية مع الحالات الاسترشادية النموذجية
  const allDisplaySessions: RepairSession[] = React.useMemo(() => {
    const userSessionIds = new Set(sessions.map((s) => s.id));
    const uniqueRefs = BENCHMARK_REFERENCE_SESSIONS.filter((r) => !userSessionIds.has(r.id));
    return [...sessions, ...uniqueRefs];
  }, [sessions]);

  const filteredSessions = allDisplaySessions.filter((s) => {
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
                {allDisplaySessions.length} أجهزة وبوردات
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              أرشيف شامل لجميع الأجهزة والتقارير الفنية ومحادثات المساعد الذكي، مع إمكانية استرجاع أي جهاز أو محادثة فوراً
            </p>
          </div>
        </div>

        <button
          onClick={onNewSession}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-dahab-500 to-amber-600 text-slate-950 font-black text-xs hover:from-dahab-600 hover:to-amber-700 transition flex items-center gap-2 shadow-lg shadow-dahab-500/20 cursor-pointer active:scale-95"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>+ فحص جهاز جديد الآن</span>
        </button>
      </div>

      {/* 2. التبديل بين فحوصات الأجهزة ومحادثات المساعد الذكي */}
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-workshop-card/80 p-1.5 rounded-2xl border border-gray-200 dark:border-workshop-border w-fit text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('devices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'devices'
              ? 'bg-dahab-500 text-slate-950 shadow-md font-black'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>📱 فحوصات الأجهزة والبوردات ({allDisplaySessions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('chats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'chats'
              ? 'bg-dahab-500 text-slate-950 shadow-md font-black'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>🤖 أرشيف محادثات المساعد ({savedChats.length})</span>
        </button>
      </div>

      {/* 3. شريط البحث والفلترة (يظهر في وضع الأجهزة) */}
      {activeSubTab === 'devices' && (
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
              الكل ({allDisplaySessions.length})
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
      )}

      {/* 4. عرض المحتوى حسب التبويب النشط */}
      {activeSubTab === 'devices' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => {
            const Icon = getDeviceIcon(session.deviceType);
            const isReference = session.id.startsWith('ref_');
            const assistantMsg = [...(session.messages || [])].reverse().find((m) => m.sender === 'assistant');
            const userMsg = session.messages?.find((m) => m.sender === 'user');

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border hover:border-dahab-500/50 rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-all group relative overflow-hidden"
              >
                {/* علامة للحالات الاسترشادية */}
                {isReference && (
                  <div className="absolute top-0 left-0 bg-gradient-to-r from-amber-500 to-dahab-500 text-slate-950 text-[9px] font-black px-2.5 py-0.5 rounded-br-xl shadow-sm">
                    حالة استرشادية جاهزة
                  </div>
                )}

                <div className="space-y-3 pt-1">
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
                          {session.createdAt
                            ? new Date(session.createdAt).toLocaleDateString('ar-EG', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'مؤخراً'}
                        </span>
                      </div>
                    </div>

                    {session.metrics?.classification && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          session.metrics.classification === 'HARDWARE'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                        }`}
                      >
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
                    {!isReference && (
                      <button
                        onClick={() => onDeleteSession(session.id)}
                        className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 transition"
                        title="حذف الجلسة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
      ) : (
        /* تبويب محادثات المساعد الذكي */
        <div className="space-y-3">
          {savedChats.length === 0 ? (
            <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                لا توجد محادثات مؤرشفة بعد
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                عند استخدام المساعد الذكي والضغط على <strong>"+ محادثة جديدة"</strong>، يتم حفظ محادثاتك السابقة بالكامل هنا للرجوع إليها مستقبلاً.
              </p>
              <button
                onClick={onSwitchToChat}
                className="px-4 py-2 rounded-xl bg-dahab-500 text-slate-950 font-bold text-xs hover:bg-dahab-600 transition"
              >
                الانتقال للمساعد الذكي الآن 🤖
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedChats.map((chat) => (
                <div
                  key={chat.id}
                  className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border hover:border-dahab-500/50 rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                          💬
                        </div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 line-clamp-1">
                          {chat.title}
                        </h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                        {chat.messageCount} رسائل
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                      {chat.preview || 'محادثة هندسية مع المساعد الذكي'}
                    </p>

                    <span className="text-[10px] text-gray-400 block">{chat.date}</span>
                  </div>

                  <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <button
                      onClick={onSwitchToChat}
                      className="px-3.5 py-1.5 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-slate-950 text-xs font-black transition flex items-center gap-1.5"
                    >
                      <span>فتح المحادثة بالمساعد</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
