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
import {
  DeviceSpecialty,
  PowerSupplyReadings,
  RepairSession,
  DiagnosticMetrics,
  ReferenceSource,
} from '@/lib/types';
import { createIntegratedContext } from '@/lib/schematicIntegration';
import { Menu } from 'lucide-react';

export type MasterTab = 'diagnosis' | 'panic-log' | 'safe-injection' | 'boardview' | 'ic-encyclopedia' | 'checklist' | 'references' | 'integration' | 'ai-chat';

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

  // تبديل حالة Sidebar للتنقل
  const toggleNavSidebar = () => {
    setIsNavSidebarOpen(!isNavSidebarOpen);
  };

  // تصدير ملف JSON للجلسة الحالية
  const handleExportJson = () => {
    const active = sessions.find((s) => s.id === activeSessionId) || {
      id: activeSessionId,
      title: deviceModel || prompt.slice(0, 30) || 'Dahab Device Repair',
      deviceType: specialty,
      deviceModel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'diagnosed',
      powerReadings: readings,
      metrics,
      messages: [
        {
          id: `msg_export_${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          text: output,
          metrics,
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
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header علوي مبسط - بدون تكرار التنقل */}
      <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-lg border-b border-gray-200 dark:border-[#1F2937] sticky top-0 z-50">
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
              onClick={toggleNavSidebar}
              className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-[#1F2937] hover:bg-gray-200 dark:hover:bg-[#374151] transition-colors"
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
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {/* المحتوى الرئيسي */}
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
                    <div className="animate-fadeIn mb-5">
                      <HardwareSoftwareIndicator metrics={metrics} />
                    </div>
                  )}

                  <ResultStreamViewer rawOutput={output} loading={loading} />
                </>
              )}

              {activeTab === 'panic-log' && <PanicLogAnalyzer />}
              {activeTab === 'safe-injection' && <SafeInjectionCalculator />}
              {activeTab === 'boardview' && <InteractiveBoardviewSimulator />}
              {activeTab === 'ic-encyclopedia' && <ICEncyclopediaTab />}
              {activeTab === 'checklist' && <InteractiveChecklist />}
              {activeTab === 'references' && <SourcesReferences sources={sources} />}
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
                <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937] rounded-2xl p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    قم بإجراء تشخيص أولاً لعرض تقرير تكامل المخططات
                  </p>
                </div>
              )}
              {activeTab === 'ai-chat' && (
                <div className="h-[600px]">
                  <AIChat />
                </div>
              )}
            </div>
          </div>

          {/* Panel سفلي: Checklist + Session History */}
          <div className="border-t border-gray-200 dark:border-[#1F2937] bg-white dark:bg-[#111827] p-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* قائمة الفحص */}
              <div className="bg-gray-50 dark:bg-[#0B0F17] rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">قائمة الفحص الهندسي</h3>
                <InteractiveChecklist />
              </div>

              {/* ذاكرة الجلسات */}
              <div className="bg-gray-50 dark:bg-[#0B0F17] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">ذاكرة الأجهزة ({sessions.length})</h3>
                  <button
                    onClick={handleNewSession}
                    className="text-xs bg-dahab-500 text-white px-3 py-1 rounded-lg hover:bg-dahab-600 transition-colors"
                  >
                    جهاز جديد
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sessions.slice(0, 5).map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className="w-full text-right p-2 rounded-lg bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937] hover:border-dahab-500 transition-colors"
                    >
                      <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{session.title}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">{session.deviceModel}</div>
                    </button>
                  ))}
                </div>
              </div>
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
