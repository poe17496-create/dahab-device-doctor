'use client';

import React, { useState, useEffect } from 'react';
import ConsoleHeader from '@/components/ConsoleHeader';
import HardwareSoftwareIndicator from '@/components/HardwareSoftwareIndicator';
import DiagnosticForm from '@/components/DiagnosticForm';
import ResultStreamViewer from '@/components/ResultStreamViewer';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import InteractiveChecklist from '@/components/InteractiveChecklist';
import SourcesReferences from '@/components/SourcesReferences';
import PanicLogAnalyzer from '@/components/PanicLogAnalyzer';
import SafeInjectionCalculator from '@/components/SafeInjectionCalculator';
import InteractiveBoardviewSimulator from '@/components/InteractiveBoardviewSimulator';
import ICEncyclopediaTab from '@/components/ICEncyclopediaTab';
import SchematicIntegrationReport from '@/components/SchematicIntegrationReport';
import NavigationSidebar from '@/components/NavigationSidebar';
import {
  DeviceSpecialty,
  PowerSupplyReadings,
  RepairSession,
  DiagnosticMetrics,
  ReferenceSource,
} from '@/lib/types';
import { createIntegratedContext } from '@/lib/schematicIntegration';
import {
  History,
  Stethoscope,
  AlertOctagon,
  Flame,
  Cpu,
  BookOpen,
  CheckSquare,
  FileText,
  Zap,
  Menu,
} from 'lucide-react';

export type MasterTab = 'diagnosis' | 'panic-log' | 'safe-injection' | 'boardview' | 'ic-encyclopedia' | 'checklist' | 'references' | 'integration';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    setIsSidebarOpen(false);
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
    setIsSidebarOpen(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0B0F17] dark:via-[#111827] dark:to-[#0B0F17] text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-300">
      {/* Header محسن */}
      <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-lg border-b border-gray-200 dark:border-[#1F2937] sticky top-0 z-50">
        <div className="p-3 md:p-4 max-w-7xl mx-auto w-full flex items-center justify-between">
          <ConsoleHeader
            sessionId={activeSessionId}
            onNewSession={handleNewSession}
            onExportJson={handleExportJson}
            sessionsCount={sessions.length}
          />
          <button
            onClick={() => setIsNavSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-[#1F2937]"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* شريط الأدوات الهندسية - تصميم احترافي */}
      <div className="max-w-7xl mx-auto w-full px-3 md:px-4 mb-4">
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937] rounded-xl overflow-hidden shadow-xl">
          {/* Tab Navigation */}
          <div className="flex overflow-x-auto border-b border-gray-200 dark:border-[#1F2937]">
            <button
              onClick={() => setActiveTab('diagnosis')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'diagnosis'
                  ? 'bg-dahab-500 text-white border-b-2 border-dahab-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F2937] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>التشخيص الذكي</span>
            </button>

            <button
              onClick={() => setActiveTab('panic-log')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'panic-log'
                  ? 'bg-purple-600 text-white border-b-2 border-purple-700'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F2937] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>محلل البانيك</span>
            </button>

            <button
              onClick={() => setActiveTab('safe-injection')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'safe-injection'
                  ? 'bg-amber-600 text-white border-b-2 border-amber-700'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F2937] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>حاسبة الفولت</span>
            </button>

            <button
              onClick={() => setActiveTab('boardview')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'boardview'
                  ? 'bg-emerald-600 text-white border-b-2 border-emerald-700'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F2937] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>معمل البوردفيو</span>
            </button>

            <button
              onClick={() => setActiveTab('ic-encyclopedia')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'ic-encyclopedia'
                  ? 'bg-sky-600 text-white border-b-2 border-sky-700'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F2937] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>موسوعة الآيسيهات</span>
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'checklist'
                  ? 'bg-indigo-600 text-white border-b-2 border-indigo-700'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F2937] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>قائمة الفحص</span>
            </button>

            <button
              onClick={() => setActiveTab('references')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'references'
                  ? 'bg-rose-600 text-white border-b-2 border-rose-700'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F2937] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>المراجع</span>
            </button>

            <button
              onClick={() => setActiveTab('integration')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'integration'
                  ? 'bg-teal-600 text-white border-b-2 border-teal-700'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F2937] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>تكامل المخططات</span>
            </button>
          </div>
        </div>
      </div>

      {/* زر فتح الذاكرة على الهواتف والشاشات الصغيرة */}
      <div className="lg:hidden px-4 mb-2 flex items-center justify-between">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937] text-xs font-bold text-dahab-600 dark:text-dahab-400"
        >
          <History className="w-4 h-4" />
          <span>سجل أجهزة الـ JSON ({sessions.length})</span>
        </button>
      </div>

      {/* جسم التطبيق: المحتوى + الشريط الجانبي */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-3 md:px-4 pb-12 flex gap-5">
        {/* Sidebar للتنقل */}
        <div className="hidden lg:block">
          <NavigationSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isOpen={true}
            onClose={() => {}}
          />
        </div>

        {/* Mobile Sidebar */}
        <NavigationSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={isNavSidebarOpen}
          onClose={() => setIsNavSidebarOpen(false)}
        />

        {/* العمود الرئيسي حسب التاب النشط */}
        <main className="flex-1 space-y-5 min-w-0">
          {activeTab === 'diagnosis' && (
            <>
              {/* نموذج إدخال العطل والقياسات والباور سبلاي والمساعد الصوتي */}
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

              {/* مؤشر الفصل الحاسم بين الهاردوير والسوفتوير */}
              {metrics && (
                <div className="animate-fadeIn">
                  <HardwareSoftwareIndicator metrics={metrics} />
                </div>
              )}

              {/* شاشة إخراج ومتابعة تدفق النتائج الهندسية */}
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
              <Zap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                قم بإجراء تشخيص أولاً لعرض تقرير تكامل المخططات
              </p>
            </div>
          )}
        </main>

        {/* الشريط الجانبي لذاكرة الجلسات السابقة المخزنة في ملفات JSON */}
        <ChatHistorySidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
    </div>
  );
}
