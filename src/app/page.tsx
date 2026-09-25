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
import {
  DeviceSpecialty,
  PowerSupplyReadings,
  RepairSession,
  DiagnosticMetrics,
  ReferenceSource,
} from '@/lib/types';
import { createIntegratedContext } from '@/lib/schematicIntegration';
import { Menu, Crown, AlertCircle } from 'lucide-react';

export type MasterTab =
  | 'diagnosis'
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

  // حالة المستخدم والزائر
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [guestAttemptsRemaining, setGuestAttemptsRemaining] = useState<number | undefined>(undefined);

  // التحقق من رصيد الزائر اليومي (5 محاولات يومياً)
  const checkGuestUsage = () => {
    if (typeof window === 'undefined') return { isGuest: true, remaining: 5 };

    const userStr = localStorage.getItem('dahab_current_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCurrentUser(u);
        setGuestAttemptsRemaining(undefined); // الفني المسجل لديه فحص غير محدود
        return { isGuest: false, remaining: 9999 };
      } catch (e) {}
    }

    setCurrentUser(null);
    const today = new Date().toISOString().split('T')[0];
    const key = `dahab_guest_usage_${today}`;
    const used = parseInt(localStorage.getItem(key) || '0', 10);
    const remaining = Math.max(0, 5 - used);
    setGuestAttemptsRemaining(remaining);
    return { isGuest: true, remaining };
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
    fetchSessions();
    checkGuestUsage();
  }, []);

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

  // تنفيذ الفحص وتشغيل البث الحي (Streaming) مع مراعاة حد الـ 5 محاولات للزائر
  const handleDiagnose = async () => {
    if (!prompt.trim() && !imageBase64) return;

    // فحص صلاحية الزائر
    const guestStatus = checkGuestUsage();
    if (guestStatus.isGuest) {
      if (guestStatus.remaining <= 0) {
        alert(
          '⚠️ تنبيه استهلاك المحاولات:\nلقد استهلكت الـ 5 محاولات المجانية المخصصة للزائر اليوم.\nللحصول على وصول غير محدود، يرجى تسجيل الدخول بحساب فني معتمد أو التواصل مع المهندس إسلام دهب على:\n📞 01064147224'
        );
        return;
      }
      // خصم محاولة
      const today = new Date().toISOString().split('T')[0];
      const key = `dahab_guest_usage_${today}`;
      const used = parseInt(localStorage.getItem(key) || '0', 10);
      localStorage.setItem(key, String(used + 1));
      setGuestAttemptsRemaining(Math.max(0, 5 - (used + 1)));
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

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 dark:bg-workshop-bg text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header علوي مبسط */}
      <div className="bg-white/90 dark:bg-[#111827]/90 backdrop-blur-lg border-b border-gray-200 dark:border-[#1F2937] sticky top-0 z-50 transition-colors">
        <div className="p-3 md:p-4 max-w-full mx-auto flex items-center justify-between">
          <ConsoleHeader
            sessionId={activeSessionId}
            onNewSession={handleNewSession}
            onExportJson={handleExportJson}
            sessionsCount={sessions.length}
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
                    guestUsageRemaining={guestAttemptsRemaining}
                  />

                  {metrics && (
                    <div className="animate-fadeIn">
                      <HardwareSoftwareIndicator metrics={metrics} />
                    </div>
                  )}

                  <ResultStreamViewer rawOutput={output} loading={loading} />

                  {/* قائمة الفحص الهندسي وسجل الذاكرة داخل تبويب الفحص فقط */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-4">
                    {/* قائمة الفحص */}
                    <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl p-5 shadow-lg">
                      <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <span>قائمة الفحص الهندسي والخطوات القياسية</span>
                      </h3>
                      <InteractiveChecklist />
                    </div>

                    {/* ذاكرة الجلسات السابقة */}
                    <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl p-5 shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">
                          ذاكرة الأجهزة السابقة ({sessions.length})
                        </h3>
                        <button
                          onClick={handleNewSession}
                          className="text-xs bg-gradient-to-r from-dahab-500 to-amber-600 text-slate-950 px-3 py-1.5 rounded-xl font-bold hover:from-dahab-600 transition"
                        >
                          + جهاز جديد
                        </button>
                      </div>
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {sessions.slice(0, 8).map((session) => (
                          <button
                            key={session.id}
                            onClick={() => handleSelectSession(session.id)}
                            className="w-full text-right p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-dahab-500 transition"
                          >
                            <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{session.title}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">{session.deviceModel || 'طراز غير محدد'}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
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
