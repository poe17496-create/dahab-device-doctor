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
import {
  DeviceSpecialty,
  PowerSupplyReadings,
  RepairSession,
  DiagnosticMetrics,
  ReferenceSource,
} from '@/lib/types';
import {
  History,
  Stethoscope,
  AlertOctagon,
  Flame,
  Cpu,
  BookOpen,
} from 'lucide-react';

type MasterTab = 'diagnosis' | 'panic-log' | 'safe-injection' | 'boardview' | 'ic-encyclopedia';

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
    <div className="min-h-screen bg-gray-50 dark:bg-workshop-bg text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-200">
      {/* هيدر المنظومة الرئيسي */}
      <div className="p-3 md:p-4 max-w-7xl mx-auto w-full">
        <ConsoleHeader
          sessionId={activeSessionId}
          onNewSession={handleNewSession}
          onExportJson={handleExportJson}
          sessionsCount={sessions.length}
        />
      </div>

      {/* شريط الأدوات الهندسية الخمس المنظمة (5 Pure Engineering Tabs) */}
      <div className="max-w-7xl mx-auto w-full px-3 md:px-4 mb-4">
        <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-2xl p-1.5 flex flex-wrap gap-1.5 shadow-xl">
          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`flex-1 min-w-[145px] py-3 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'diagnosis'
                ? 'bg-gradient-to-r from-dahab-500 to-amber-600 text-slate-950 shadow-lg shadow-dahab-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>🩺 كاشف ومحلل الأعطال الذكي</span>
          </button>

          <button
            onClick={() => setActiveTab('panic-log')}
            className={`flex-1 min-w-[145px] py-3 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'panic-log'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>📱 محلل سجلات البانيك (iOS/Android)</span>
          </button>

          <button
            onClick={() => setActiveTab('safe-injection')}
            className={`flex-1 min-w-[145px] py-3 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'safe-injection'
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-lg shadow-amber-600/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>⚡ حاسبة حقن الفولت والحرارة</span>
          </button>

          <button
            onClick={() => setActiveTab('boardview')}
            className={`flex-1 min-w-[145px] py-3 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'boardview'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>🔬 معمل البوردفيو والمسارات</span>
          </button>

          <button
            onClick={() => setActiveTab('ic-encyclopedia')}
            className={`flex-1 min-w-[145px] py-3 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'ic-encyclopedia'
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-600/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-850'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>🧰 موسوعة بدائل وتوافق الآيسيهات</span>
          </button>
        </div>
      </div>

      {/* زر فتح الذاكرة على الهواتف والشاشات الصغيرة */}
      <div className="lg:hidden px-4 mb-2 flex items-center justify-between">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border text-xs font-bold text-dahab-600 dark:text-dahab-400"
        >
          <History className="w-4 h-4" />
          <span>سجل أجهزة الـ JSON ({sessions.length})</span>
        </button>
      </div>

      {/* جسم التطبيق: المحتوى + الشريط الجانبي */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-3 md:px-4 pb-12 flex gap-5">
        {/* العمود الرئيسي حسب التاب النشط */}
        <main className="flex-1 space-y-5 min-w-0">
          {activeTab === 'diagnosis' && (
            <>
              {/* 1. نموذج إدخال العطل والقياسات والباور سبلاي والمساعد الصوتي */}
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

              {/* 2. مؤشر الفصل الحاسم بين الهاردوير والسوفتوير */}
              {metrics && (
                <div className="animate-fadeIn">
                  <HardwareSoftwareIndicator metrics={metrics} />
                </div>
              )}

              {/* 3. شاشة إخراج ومتابعة تدفق النتائج الهندسية */}
              <ResultStreamViewer rawOutput={output} loading={loading} />

              {/* 4. شيك ليست تفاعلية لنقاط الفحص والقياس أثناء الصيانة */}
              <InteractiveChecklist />

              {/* 5. مراجع المخططات وقنوات الصيانة الموازية */}
              <SourcesReferences sources={sources} />
            </>
          )}

          {activeTab === 'panic-log' && <PanicLogAnalyzer />}

          {activeTab === 'safe-injection' && <SafeInjectionCalculator />}

          {activeTab === 'boardview' && <InteractiveBoardviewSimulator />}

          {activeTab === 'ic-encyclopedia' && <ICEncyclopediaTab />}
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
