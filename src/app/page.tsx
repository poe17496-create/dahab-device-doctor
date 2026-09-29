'use client';

import React, { useState, useEffect } from 'react';
import ConsoleHeader from '@/components/ConsoleHeader';
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
import {
  DeviceSpecialty,
  PowerSupplyReadings,
  RepairSession,
  DiagnosticMetrics,
  ReferenceSource,
} from '@/lib/types';
import { createIntegratedContext } from '@/lib/schematicIntegration';
import { Menu, Crown, AlertCircle, Cpu } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<MasterTab>('diagnosis');
  const [activeSessionId, setActiveSessionId] = useState<string>(() => `dahab_${Date.now()}`);
  const [sessions, setSessions] = useState<RepairSession[]>([]);
  const [specialty, setSpecialty] = useState<DeviceSpecialty>('mobile-repair');
  const [deviceModel, setDeviceModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [readings, setReadings] = useState<PowerSupplyReadings>({});
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<ReferenceSource[]>([]);
  const [metrics, setMetrics] = useState<DiagnosticMetrics | undefined>(undefined);
  const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);

  // حالة تسجيل الدخول الإلزامي
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [guestTrialsRemaining, setGuestTrialsRemaining] = useState(5);

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

  // جلب الجلسات السابقة من ملفات JSON عند فتح المنظومة
  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error('فشل في جلب جلسات الذاكرة:', e);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchSessions();
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
    if (!prompt.trim() && !imageBase64) return;

    // فحص عداد الزائر قبل التشخيص
    if (currentUser?.isGuest) {
      const today = new Date().toISOString().split('T')[0];
      const key = `dahab_guest_usage_${today}`;
      const used = parseInt(localStorage.getItem(key) || '0', 10);
      if (used >= 5) {
        setOutput('⚠️ انتهت تجاربك المجانية اليومية (5 من 5).\n\nللحصول على وصول غير محدود، سجّل الدخول بحساب فني معتمد أو تواصل مع المطور م. إسلام دهب على واتساب: 01064147224');
        return;
      }
      // خصم تجربة
      const newUsed = used + 1;
      localStorage.setItem(key, String(newUsed));
      const remaining = 5 - newUsed;
      setGuestTrialsRemaining(remaining);
      // تحديث اسم الزائر ليعكس العدد الجديد
      const updatedGuest = { ...currentUser, name: `زائر (${remaining} تجربة متبقية اليوم)` };
      localStorage.setItem('dahab_current_user', JSON.stringify(updatedGuest));
      setCurrentUser(updatedGuest);

      // إخطار السيرفر بخصم تجربة
      fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId: currentUser.id, action: 'diagnose', remaining }),
      }).catch(() => {});
    }

    setLoading(true);
    setOutput('');
    setMetrics(undefined);
    setSources([]);

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

      setTimeout(fetchSessions, 600);
    } catch (err) {
      console.error(err);
      setOutput('حدث خطأ أثناء الاتصال بمحرك التشخيص الهندسي.');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 dark:bg-workshop-bg text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* شريط الزائر المؤقت */}
      {currentUser?.isGuest && (
        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-center py-2 px-4 text-xs font-bold flex items-center justify-center gap-3 flex-wrap z-[60] relative">
          <span>🧪 وضع الزائر — متبقي لك <strong>{guestTrialsRemaining}</strong> تجربة مجانية اليوم</span>
          <button
            onClick={() => { localStorage.removeItem('dahab_current_user'); setCurrentUser(null); }}
            className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition text-[11px] font-black"
          >
            تسجيل الدخول بحساب فني
          </button>
        </div>
      )}
      {/* Header علوي مبسط */}
      <div className="bg-white/90 dark:bg-[#111827]/90 backdrop-blur-lg border-b border-gray-200 dark:border-[#1F2937] sticky top-0 z-50 transition-colors">
        <div className="p-3 md:p-4 max-w-full mx-auto flex items-center justify-between">
          <ConsoleHeader
            sessionId={activeSessionId}
            onNewSession={handleNewSession}
            onExportJson={handleExportJson}
            sessionsCount={sessions.length}
            currentUser={currentUser}
            onLogout={() => setCurrentUser(null)}
          />
          <div className="flex items-center gap-2">
            <Notifications />
            <button
              onClick={() => setIsNavSidebarOpen(!isNavSidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-[#1F2937] hover:bg-gray-200 dark:hover:bg-[#374151] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
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
        />

        {/* مساحة العمل الرئيسية */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-4 md:p-6 flex-1">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* شاشة الفحص والتشخيص الهندسي الأساسية */}
              {activeTab === 'diagnosis' && (
                <>
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
                  />

                  {metrics && (
                    <div className="animate-fadeIn">
                      <HardwareSoftwareIndicator metrics={metrics} />
                    </div>
                  )}

                  <ResultStreamViewer rawOutput={output} loading={loading} />

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
              {activeTab === 'ai-chat' && (
                <div className="h-[650px]">
                  <AIChat />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* زر تثبيت PWA */}
      <PWAInstallButton />

      {/* إشعار تحديث PWA */}
      <PWAUpdateNotification />
    </div>
  );
}
