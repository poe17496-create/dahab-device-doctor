'use client';

import React, { useState, useEffect } from 'react';
import ConsoleHeader from '@/components/ConsoleHeader';
import { Image, Zap, Ticket } from 'lucide-react';
import HardwareSoftwareIndicator from '@/components/HardwareSoftwareIndicator';
import DiagnosticForm from '@/components/DiagnosticForm';
import ResultStreamViewer from '@/components/ResultStreamViewer';
import InteractiveChecklist from '@/components/InteractiveChecklist';
import SourcesReferences from '@/components/SourcesReferences';
import PanicLogAnalyzer from '@/components/PanicLogAnalyzer';
import SafeInjectionCalculator from '@/components/SafeInjectionCalculator';
import InteractiveBoardviewSimulator from '@/components/InteractiveBoardviewSimulator';
import ICEncyclopediaTab from '@/components/ICEncyclopediaTab';
import SchematicIntegrationReport from '@/components/SchematicIntegrationReport';
import NavigationSidebar from '@/components/NavigationSidebar';
import PWAInstallButton from '@/components/PWAInstallButton';
import PWAUpdateNotification from '@/components/PWAUpdateNotification';
import Notifications from '@/components/Notifications';
import AIChat from '@/components/AIChat';
import DahabEcosystem from '@/components/DahabEcosystem';
import AuthGate from '@/components/AuthGate';
import DeviceMemoryTab from '@/components/DeviceMemoryTab';
import FeedbackWidget from '@/components/FeedbackWidget';
import DiagnosticTabs from '@/components/DiagnosticTabs';
import VisualHighlightOverlay from '@/components/VisualHighlightOverlay';
import InteractiveDiagnosticBoard from '@/components/InteractiveDiagnosticBoard';
import SchematicBoard from '@/components/SchematicBoard';
import RepairStatusTracker from '@/components/RepairStatusTracker';
import CommonFaultsLibrary from '@/components/CommonFaultsLibrary';
import {
  DeviceSpecialty,
  PowerSupplyReadings,
  RepairSession,
  DiagnosticMetrics,
  ReferenceSource,
} from '@/lib/types';
import { createIntegratedContext } from '@/lib/schematicIntegration';
import { consumeGuestTrial, getGuestRemainingTrials } from '@/lib/guestUsage';
import { Menu, Crown, AlertCircle, Cpu } from 'lucide-react';
import { useDiagnosticContext } from '@/contexts/DiagnosticContext';

export type MasterTab =
  | 'diagnosis'
  | 'memory'
  | 'panic-log'
  | 'safe-injection'
  | 'boardview'
  | 'ic-encyclopedia'
  | 'checklist'
  | 'references'
  | 'integration'
  | 'ai-chat'
  | 'ecosystem';

export default function DahabFixAiConsole() {
  const diagnosticContext = useDiagnosticContext();
  const {
    deviceModel: ctxDeviceModel,
    setDeviceModel: ctxSetDeviceModel,
    specialty: ctxSpecialty,
    setSpecialty: ctxSetSpecialty,
    readings: ctxReadings,
    setReadings: ctxSetReadings,
    metrics: ctxMetrics,
    setMetrics: ctxSetMetrics,
    boardData: ctxBoardData,
    setBoardData: ctxSetBoardData,
    recordDiagnosis,
  } = diagnosticContext;

  const [activeTab, setActiveTab] = useState<MasterTab>('diagnosis');
  const [activeSessionId, setActiveSessionId] = useState<string>(() => `dahab_${Date.now()}`);
  const [sessions, setSessions] = useState<RepairSession[]>([]);
  const [specialty, setSpecialty] = useState<DeviceSpecialty>(ctxSpecialty);
  const [deviceModel, setDeviceModel] = useState(ctxDeviceModel);
  const [prompt, setPrompt] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [readings, setReadings] = useState<PowerSupplyReadings>(ctxReadings);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<ReferenceSource[]>([]);
  const [metrics, setMetrics] = useState<DiagnosticMetrics | undefined>(ctxMetrics);
  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const isSubscriptionExpired = Boolean(
    currentUser &&
      !currentUser.isGuest &&
      currentUser.role !== 'admin' &&
      (currentUser.active === false ||
        (currentUser.expiresAt && new Date(currentUser.expiresAt).getTime() < Date.now()))
  );
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [guestTrialsRemaining, setGuestTrialsRemaining] = useState(5);
  const [isDesktopMode, setIsDesktopMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dahab_desktop_view') === 'true';
    }
    return false;
  });
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [diagnosticTab, setDiagnosticTab] = useState<'report' | 'visual' | 'schematic'>('report');
  const [currentTicketId, setCurrentTicketId] = useState<string>('');
  const [showCommonFaultsLibrary, setShowCommonFaultsLibrary] = useState(false);
  const [highlightedComponent, setHighlightedComponent] = useState<string | null>(null);
  const [diagnosisStartTime, setDiagnosisStartTime] = useState<number | null>(null);

  const toggleDesktopMode = () => {
    setIsDesktopMode(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('dahab_desktop_view', String(next));
      }
      return next;
    });
  };

  // مزامنة الـ Viewport تلقائياً لتصغير الصفحة وتكبيرها بدقة الكمبيوتر على شاشة الهاتف
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }

    if (isDesktopMode) {
      // ضبط العرض لـ 1200 بكسل وتصغير العرض ليتناسب تماماً مع شاشة الموبايل وتفعيل الزوم الحر
      meta.setAttribute('content', 'width=1200, initial-scale=0.32, minimum-scale=0.25, maximum-scale=5.0, user-scalable=yes');
    } else {
      // وضع الموبايل الطبيعي المتوافق تماماً مع مقاسات الشاشات الذكية
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
    }
  }, [isDesktopMode]);

  // التحقق من جلسة المستخدم المحفوظة (أو وضع الزائر)
  const checkAuth = () => {
    if (typeof window === 'undefined') return;

    const userStr = localStorage.getItem('dahab_current_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u && u.username) {
          // إذا كان زائراً: تحقق من المحاولات المتبقية
          if (u.isGuest) {
            const today = new Date().toISOString().split('T')[0];
            const used = parseInt(localStorage.getItem(`dahab_guest_usage_${today}`) || '0', 10);
            const remaining = Math.max(0, 5 - used);
            if (remaining <= 0) {
              localStorage.removeItem('dahab_current_user');
              setCurrentUser(null);
              setIsCheckingAuth(false);
              return;
            }
            setGuestTrialsRemaining(remaining);
          }
          setCurrentUser(u);
          setIsCheckingAuth(false);
          return;
        }
      } catch (e) {}
    }

    setCurrentUser(null);
    setIsCheckingAuth(false);
  };

  // معالجة دخول الزائر من AuthGate
  const handleGuestAccess = (remaining: number) => {
    const guestId = `guest_${Date.now()}`;
    const guestUser: any = {
      id: guestId,
      username: 'guest',
      name: `زائر (${remaining} تجربة متبقية اليوم)`,
      role: 'guest',
      active: true,
      isGuest: true,
    };
    localStorage.setItem('dahab_current_user', JSON.stringify(guestUser));
    localStorage.setItem('dahab_guest_id', guestId); // حفظ guestId بشكل منفصل
    setGuestTrialsRemaining(remaining);
    setCurrentUser(guestUser);

    // تسجيل دخول الزائر في الخادم للوحة التحكم
    const deviceInfo = typeof window !== 'undefined'
      ? `${navigator.platform || 'PC'} - ${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}`
      : 'Web Client';
    fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, action: 'enter', deviceInfo, remaining }),
    }).catch(() => {});
  };

  // جلب الجلسات السابقة من ملفات JSON مع نسخة احتياطية في localStorage
  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/memory', { cache: 'no-store' });
      const data = await res.json();
      if (data.sessions && data.sessions.length > 0) {
        setSessions(data.sessions);
        // حفظ نسخة احتياطية محلية
        try {
          localStorage.setItem('dahab_sessions_backup', JSON.stringify(data.sessions.slice(0, 50)));
        } catch {}
      } else {
        // إذا كان السيرفر فارغاً (cold start)، نحمّل من النسخة الاحتياطية
        try {
          const backup = localStorage.getItem('dahab_sessions_backup');
          if (backup) {
            const parsed = JSON.parse(backup);
            if (Array.isArray(parsed) && parsed.length > 0) setSessions(parsed);
          }
        } catch {}
      }
    } catch (e) {
      console.error('فشل في جلب جلسات الذاكرة:', e);
      // fallback: قراءة من النسخة الاحتياطية المحلية
      try {
        const backup = localStorage.getItem('dahab_sessions_backup');
        if (backup) setSessions(JSON.parse(backup));
      } catch {}
    }
  };

  useEffect(() => {
    checkAuth();
    fetchSessions();

    const handleTrialConsumed = (e: any) => {
      if (e.detail?.remaining !== undefined) {
        setGuestTrialsRemaining(e.detail.remaining);
      }
    };
    window.addEventListener('dahab_guest_trial_consumed', handleTrialConsumed);
    return () => window.removeEventListener('dahab_guest_trial_consumed', handleTrialConsumed);
  }, []);

  // نبض دوري لتأكيد نشاط الزائر الحالي في لوحة التحكم
  useEffect(() => {
    if (!currentUser?.isGuest || !currentUser?.id) return;
    const sendGuestHeartbeat = () => {
      fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId: currentUser.id, action: 'heartbeat' }),
      }).catch(() => {});
    };
    sendGuestHeartbeat();
    const interval = setInterval(sendGuestHeartbeat, 45000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // مزامنة الحالة المحلية مع الـ Context
  useEffect(() => {
    ctxSetDeviceModel(deviceModel);
  }, [deviceModel, ctxSetDeviceModel]);

  useEffect(() => {
    ctxSetSpecialty(specialty);
  }, [specialty, ctxSetSpecialty]);

  useEffect(() => {
    ctxSetReadings(readings);
  }, [readings, ctxSetReadings]);

  useEffect(() => {
    ctxSetMetrics(metrics);
  }, [metrics, ctxSetMetrics]);

  // اختيار جلسة سابقة من الذاكرة واسترجاع كامل حالتها
  const handleSelectSession = (sessionId: string) => {
    const selected = sessions.find((s) => s.id === sessionId);
    if (!selected) return;

    setActiveSessionId(selected.id);
    setSpecialty(selected.deviceType || 'mobile-repair');
    setDeviceModel(selected.deviceModel || '');
    if (selected.powerReadings) {
      setReadings(selected.powerReadings);
    }
    if (selected.metrics) {
      setMetrics(selected.metrics);
    }

    const lastAssistantMsg = [...selected.messages].reverse().find((m) => m.sender === 'assistant');
    if (lastAssistantMsg) {
      setOutput(lastAssistantMsg.text);
    } else {
      setOutput('');
    }

    setActiveTab('diagnosis');
  };

  // بدء جلسة فحص لجهاز جديد
  const handleNewSession = () => {
    const newId = `dahab_${Date.now()}`;
    setActiveSessionId(newId);
    setDeviceModel('');
    setPrompt('');
    setImageBase64(null);
    setReadings({});
    setOutput('');
    setMetrics(undefined);
    setSources([]);
    setActiveTab('diagnosis');
  };

  // حذف جلسة من ملفات الـ JSON
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await fetch(`/api/memory?id=${sessionId}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        handleNewSession();
      }
    } catch (err) {
      console.error('خطأ أثناء حذف الجلسة:', err);
    }
  };

  // تصدير الجلسة الحالية بصيغة JSON
  const handleExportJson = () => {
    const active: RepairSession = {
      id: activeSessionId,
      title: deviceModel || 'فحص جهاز غير محدد',
      deviceType: specialty,
      deviceModel,
      powerReadings: readings,
      metrics,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg_u_${Date.now()}`,
          sender: 'user',
          text: prompt,
          timestamp: new Date().toISOString(),
        },
        {
          id: `msg_a_${Date.now()}`,
          sender: 'assistant',
          text: output,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(active, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `dahab_device_${activeSessionId}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  // تنفيذ الفحص وتشغيل البث الحي (Streaming)
  const handleDiagnose = async () => {
    // فحص التحقق من الإدخال
    if (!deviceModel.trim()) {
      setValidationError('برجاء كتابة موديل الجهاز أولاً');
      return;
    }
    if (!prompt.trim() && !imageBase64) {
      setValidationError('برجاء كتابة وصف العطل أو رفع صورة');
      return;
    }
    setValidationError(null);

    if (isSubscriptionExpired) {
      alert('⚠️ حسابك معلق أو انتهت فترة الاشتراك. يرجى التواصل مع إدارة دهب دكتور للتجديد.');
      return;
    }

    // فحص وخصم رصيد الزائر الموحد
    if (currentUser?.isGuest) {
      const trial = consumeGuestTrial('diagnose');
      if (!trial.success) {
        setOutput('⚠️ انتهت تجاربك المجانية اليومية (5 من 5).\n\nللحصول على وصول غير محدود للتشخيص ومحاكي البورد فيو والمساعد، سجّل الدخول بحساب فني معتمد أو تواصل مع المطور م. إسلام دهب على واتساب: 01064147224');
        return;
      }
    }

    setLoading(true);
    setLoadingMessage('جاري قراءة المعطيات والقياسات...');
    setOutput('');
    setMetrics(undefined);
    setSources([]);
    setDiagnosisStartTime(Date.now());

    // توليد معرف تذكرة فريد
    const ticketId = `DDD-${Math.floor(1000 + Math.random() * 9000)}`;
    setCurrentTicketId(ticketId);

    // محاكاة خطوات التحميل
    setTimeout(() => setLoadingMessage('جاري مطابقة الأعطال الشائعة ومسارات التغذية...'), 1500);
    setTimeout(() => setLoadingMessage('جاري استخراج تقرير التشخيص ونسبة الثقة...'), 3000);

    try {
      // 1. جلب المراجع الهندسية الموازية (ZXW, يوتيوب, GSM-Forum)
      fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: `${deviceModel} ${prompt}`, specialty }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.results) setSources(data.results);
        })
        .catch(console.error);

      // 2. طلب التشخيص المباشر عبر الـ Streaming والربط بذاكرة الـ JSON
      let customKeys: any = undefined;
      try {
        const stored = localStorage.getItem('dahab_system_api_keys');
        if (stored) {
          customKeys = JSON.parse(stored);
        }
      } catch (e) {}

      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          specialty,
          deviceModel,
          readings,
          imageBase64,
          sessionId: activeSessionId,
          customKeys,
        }),
      });

      if (!response.body) {
        setOutput('لم يتم استلام أي تدفق بيانات من محرك الفحص.');
        setLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        accumulatedText += chunkText;
        setOutput(accumulatedText);

        // استخراج كود الميتريكس أثناء التدفق
        const match = accumulatedText.match(/<<<DAHAB_DIAGNOSTIC_METRICS>>>([\s\S]*?)<<<END_DAHAB_METRICS>>>/);
        if (match && match[1]) {
          try {
            const parsed = JSON.parse(match[1].trim());
            setMetrics(parsed);
          } catch (e) {
            // جاري اكتمال الـ JSON
          }
        }
      }

      setTimeout(() => {
        fetchSessions();
        // حفظ نسخة من الجلسة الحالية في localStorage مباشرةً
        try {
          const currentSession = {
            id: activeSessionId,
            title: prompt.slice(0, 50) || 'جلسة تشخيص',
            deviceModel: deviceModel || 'جهاز غير محدد',
            deviceType: specialty || 'mobile-repair',
            messages: [
              { id: `msg_u_${Date.now()}`, sender: 'user', text: prompt, timestamp: new Date().toLocaleTimeString('ar-EG') },
              { id: `msg_a_${Date.now()}`, sender: 'assistant', text: accumulatedText.replace(/<<<DAHAB_DIAGNOSTIC_METRICS>>>[\s\S]*?<<<END_DAHAB_METRICS>>>/g, '').trim(), timestamp: new Date().toLocaleTimeString('ar-EG') },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const existing = JSON.parse(localStorage.getItem('dahab_sessions_backup') || '[]');
          const filtered = existing.filter((s: any) => s.id !== activeSessionId);
          localStorage.setItem('dahab_sessions_backup', JSON.stringify([currentSession, ...filtered].slice(0, 50)));
        } catch {}
      }, 600);
    } catch (err) {
      console.error(err);
      setOutput('حدث خطأ أثناء الاتصال بمحرك التشخيص الهندسي.');
    } finally {
      setLoading(false);
      setLoadingMessage(null);

      // Record diagnosis time for productivity stats
      if (diagnosisStartTime) {
        const minutesSpent = Math.round((Date.now() - diagnosisStartTime) / 60000);
        if (minutesSpent > 0) {
          recordDiagnosis(minutesSpent);
        }
        setDiagnosisStartTime(null);
      }
    }
  };

  // شاشة فحص حالة تسجيل الدخول الأولية
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white font-sans">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-dahab-400 to-amber-600 flex items-center justify-center animate-pulse shadow-xl shadow-dahab-500/30 mb-4 border border-dahab-300">
          <Cpu className="w-8 h-8 text-slate-950 font-bold" />
        </div>
        <p className="text-sm font-bold text-amber-300">جاري تهيئة منظومة دهب دكتور...</p>
      </div>
    );
  }

  // إذا لم يكن المستخدم مسجلاً، اظهر بوابة تسجيل الدخول الإلزامية في كامل الشاشة
  if (!currentUser) {
    return <AuthGate onAuthenticated={(user) => setCurrentUser(user)} onGuestAccess={handleGuestAccess} />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans bg-gradient-to-br from-dahab-50 via-amber-50 to-orange-50 dark:from-[#0B0F17] dark:via-[#111827] dark:to-[#0B0F17] text-gray-900 dark:text-gray-100 transition-colors duration-300 ${isDesktopMode ? 'w-[1200px] max-w-[1200px] mx-auto overflow-x-visible' : 'w-full overflow-x-hidden'}`}>
      {/* شريط الزائر المؤقت - مدمج ومختصر */}
      {currentUser?.isGuest && (
        <div className="bg-gradient-to-r from-dahab-500 to-amber-600 text-white text-center py-1.5 px-3 text-xs font-bold flex items-center justify-between gap-2 z-[60] relative">
          <span className="truncate">🧪 وضع الزائر: متبقي لك <strong>{guestTrialsRemaining}</strong> تجارب اليوم</span>
          <button
            onClick={() => { localStorage.removeItem('dahab_current_user'); setCurrentUser(null); }}
            className="px-2.5 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 transition text-[10px] font-black shrink-0"
          >
            دخول فني ⚡
          </button>
        </div>
      )}
      {/* Header علوي نحيف ومضغوط بدون أي تداخل */}
      <div className="bg-white/95 dark:bg-[#111827]/95 backdrop-blur-lg border-b border-dahab-200 dark:border-[#1F2937] sticky top-0 z-40 transition-colors">
        <div className="px-3 py-2 md:px-6 md:py-2.5 max-w-full mx-auto flex items-center justify-between gap-2">
          <ConsoleHeader
            sessionId={activeSessionId}
            onNewSession={handleNewSession}
            onExportJson={handleExportJson}
            sessionsCount={sessions.length}
            currentUser={currentUser}
            onLogout={() => setCurrentUser(null)}
            isDesktopMode={isDesktopMode}
            onToggleDesktopMode={toggleDesktopMode}
          />
          <div className="flex items-center gap-1 shrink-0">
            <Notifications />
            {!isDesktopMode && (
              <button
                onClick={() => setIsNavSidebarOpen(!isNavSidebarOpen)}
                className="lg:hidden p-1.5 rounded-xl bg-gray-100 dark:bg-[#1F2937] hover:bg-gray-200 dark:hover:bg-[#374151] transition-colors"
                title="القائمة الكاملة"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* جسم التطبيق: Sidebar + مساحة العمل */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar موحد للتنقل */}
        <NavigationSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={isNavSidebarOpen}
          onClose={() => setIsNavSidebarOpen(false)}
          currentUser={currentUser}
          isDesktopMode={isDesktopMode}
        />

        {/* مساحة العمل الرئيسية */}
        <div className="flex-1 flex flex-col overflow-y-auto pb-20 lg:pb-0">
          <div className="p-4 md:p-6 flex-1">
            <div className="max-w-7xl mx-auto space-y-6">
              {isSubscriptionExpired && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3 shadow-md animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <span className="font-bold text-sm block">انتهت فترة اشتراك الحساب أو تم تعليقه مؤقتاً!</span>
                      <span className="text-[11px] opacity-90">تم تعطيل ميزات الذكاء الاصطناعي ومحاكي البوردفيو مؤقتاً، يُرجى التواصل مع إدارة دهب دكتور للتجديد.</span>
                    </div>
                  </div>
                  <a
                    href="https://wa.me/201026027877"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition shadow-sm"
                  >
                    تجديد الاشتراك 💬
                  </a>
                </div>
              )}

              {/* شاشة الفحص والتشخيص الهندسي الأساسية */}
              {activeTab === 'diagnosis' && (
                <>
                  {/* Common Faults Library Button */}
                  <button
                    onClick={() => setShowCommonFaultsLibrary(!showCommonFaultsLibrary)}
                    className="w-full mb-4 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition shadow-md"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>{showCommonFaultsLibrary ? 'إخفاء مكتبة الأعطال' : 'مكتبة الأعطال الشائعة'}</span>
                  </button>

                  {showCommonFaultsLibrary && (
                    <div className="mb-4 animate-fadeIn">
                      <CommonFaultsLibrary
                        onApplyFault={(fault) => {
                          setDeviceModel(fault.model);
                          setPrompt(`${fault.faultName}: ${fault.symptoms.join(', ')}`);
                          setShowCommonFaultsLibrary(false);
                        }}
                      />
                    </div>
                  )}

                  <DiagnosticForm
                    specialty={specialty}
                    setSpecialty={setSpecialty}
                    deviceModel={deviceModel}
                    setDeviceModel={setDeviceModel}
                    prompt={prompt}
                    setPrompt={setPrompt}
                    imageBase64={imageBase64}
                    setImageBase64={setImageBase64}
                    readings={readings}
                    setReadings={setReadings}
                    loading={loading}
                    onDiagnose={handleDiagnose}
                    loadingMessage={loadingMessage}
                    validationError={validationError}
                    boardData={ctxBoardData}
                    setBoardData={ctxSetBoardData}
                  />

                  {metrics && (
                    <div className="animate-fadeIn">
                      <HardwareSoftwareIndicator metrics={metrics} />
                    </div>
                  )}

                  {/* Tabbed Interface for Report and Visual Board */}
                  {output && (
                    <DiagnosticTabs
                      activeTab={diagnosticTab}
                      onTabChange={setDiagnosticTab}
                      reportContent={
                        <div className="space-y-4">
                          <ResultStreamViewer
                            rawOutput={output}
                            loading={loading}
                            onComponentHover={setHighlightedComponent}
                            onComponentLeave={() => setHighlightedComponent(null)}
                          />
                          {/* Repair Status Tracker */}
                          {currentTicketId && (
                            <RepairStatusTracker
                              ticketId={currentTicketId}
                              deviceModel={deviceModel}
                              deviceType={specialty}
                              symptoms={prompt}
                              aiDiagnosis={output}
                              suspectedComponent={metrics?.primarySuspectComponent}
                            />
                          )}
                          {/* Feedback Widget */}
                          <FeedbackWidget
                            sessionId={activeSessionId}
                            deviceModel={deviceModel}
                            aiOutput={output}
                          />
                        </div>
                      }
                      visualContent={
                        <div className="space-y-6">
                          {/* Visual Highlight Overlay */}
                          <div className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                              <Image className="w-5 h-5 text-dahab-500" />
                              <span>التظليل المرئي على البوردة</span>
                            </h3>
                            <VisualHighlightOverlay
                              imageBase64={imageBase64}
                              targetRegion={metrics?.targetRegion}
                              highlightedComponent={highlightedComponent}
                              isAnalysing={loading}
                            />
                          </div>

                          {/* Interactive Diagnostic Board */}
                          <div className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                              <Zap className="w-5 h-5 text-dahab-500" />
                              <span>لوحة القياس التفاعلية</span>
                            </h3>
                            <InteractiveDiagnosticBoard
                              testPoints={metrics?.testPoints}
                              imageBase64={imageBase64}
                            />
                          </div>
                        </div>
                      }
                      schematicContent={
                        <div className="space-y-6">
                          {/* Schematic Board */}
                          <div className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                              <Zap className="w-5 h-5 text-dahab-500" />
                              <span>المخطط الهندسي التفاعلي</span>
                            </h3>
                            <SchematicBoard
                              imageBase64={imageBase64}
                              testPoints={metrics?.testPoints}
                              isAnalysing={loading}
                            />
                          </div>
                        </div>
                      }
                    />
                  )}

                  {!output && <ResultStreamViewer rawOutput={output} loading={loading} />}

                </>
              )}

              {/* تبويب ذاكرة الأجهزة والمحادثات السابقة المستقل */}
              {activeTab === 'memory' && (
                <DeviceMemoryTab
                  sessions={sessions}
                  onSelectSession={(id) => {
                    handleSelectSession(id);
                    setActiveTab('diagnosis');
                  }}
                  onDeleteSession={handleDeleteSession}
                  onNewSession={handleNewSession}
                  onSwitchToChat={() => setActiveTab('ai-chat')}
                />
              )}

              {/* التبويبات الأخرى (تظهر نظيفة بالكامل بدون أي ازدحام بالأسفل) */}
              {activeTab === 'panic-log' && <PanicLogAnalyzer />}
              {activeTab === 'safe-injection' && <SafeInjectionCalculator />}
              {activeTab === 'boardview' && <InteractiveBoardviewSimulator />}
              {activeTab === 'ic-encyclopedia' && <ICEncyclopediaTab />}
              {activeTab === 'checklist' && <InteractiveChecklist />}
              {activeTab === 'references' && <SourcesReferences sources={sources} />}
              {activeTab === 'ecosystem' && <DahabEcosystem />}
              {activeTab === 'integration' && metrics && (
                <SchematicIntegrationReport
                  context={createIntegratedContext({
                    deviceModel,
                    specialty,
                    readings,
                    metrics,
                    symptoms: prompt,
                  })}
                />
              )}
              {activeTab === 'integration' && !metrics && (
                <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl p-8 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-dahab-500 mx-auto" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    يرجى إجراء فحص لجهاز أولاً لتوليد تقرير تكامل المخططات التفصيلي.
                  </p>
                </div>
              )}
              {/* تبويب المساعد الذكي - يأخذ كامل ارتفاع الشاشة في وضع الديسكتوب بدون فراغ سفلي */}
              <div className={`h-[calc(100dvh-150px)] md:h-[calc(100dvh-115px)] lg:h-[calc(100dvh-105px)] ${activeTab === 'ai-chat' ? 'block' : 'hidden'}`}>
                <AIChat currentUser={currentUser} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* فوتر ثابت أسفل الصفحة يحتوي روابط الشروط والخصوصية - يظهر فقط في وضع الديسكتوب */}
      <div className="hidden lg:flex items-center justify-center gap-6 py-2 border-t border-gray-200 dark:border-[#1F2937] bg-white/80 dark:bg-[#0B0F17]/80 backdrop-blur-sm text-[11px] text-gray-400 dark:text-gray-500 shrink-0">
        <span>© 2026 منظومة دهب دكتور الهندسية — <strong className="text-dahab-500">dahabsoftware.site</strong></span>
        <span className="text-gray-300 dark:text-gray-700">•</span>
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-dahab-500 transition font-medium underline underline-offset-2">
          شروط الاستخدام
        </a>
        <span className="text-gray-300 dark:text-gray-700">•</span>
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-dahab-500 transition font-medium underline underline-offset-2">
          سياسة الخصوصية
        </a>
        <span className="text-gray-300 dark:text-gray-700">•</span>
        <a href="https://wa.me/201064147224" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition font-medium">
          💬 دعم فني
        </a>
      </div>

      {/* شريط التنقل السفلي للموبايل فقط (يختفي عند تفعيل وضع الديسكتوب) */}
      {!isDesktopMode && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-gray-200 dark:border-[#1F2937] safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {[
            { id: 'diagnosis' as MasterTab, label: 'تشخيص', icon: '🔬' },
            { id: 'ai-chat' as MasterTab, label: 'مساعد AI', icon: '🤖' },
            { id: 'boardview' as MasterTab, label: 'بوردات', icon: '💻' },
            { id: 'memory' as MasterTab, label: 'ذاكرة', icon: '🧠' },
            { id: 'checklist' as MasterTab, label: 'فحص', icon: '✅' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-0 ${
                activeTab === item.id
                  ? 'text-amber-500 bg-amber-500/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => setIsNavSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all text-gray-500 dark:text-gray-400 hover:text-gray-700"
          >
            <span className="text-xl leading-none">☰</span>
            <span className="text-[10px] font-medium">المزيد</span>
          </button>
        </div>
      </div>
      )}

      {/* زر تثبيت PWA */}
      <PWAInstallButton />

      {/* إشعار تحديث PWA */}
      <PWAUpdateNotification />
    </div>
  );
}
