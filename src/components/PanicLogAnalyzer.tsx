'use client';

import React, { useState, useEffect } from 'react';
import { AlertOctagon, CheckCircle2, FileText, Cpu, Search, Sparkles, Copy, Check, Download, Plus, Trash2, X, History, Save } from 'lucide-react';

interface PanicSignature {
  id: string;
  keyword: string;
  component: string;
  affectedDevices: string;
  symptom: string;
  fixSolution: string;
  dangerLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  isCustom?: boolean;
}

const DEFAULT_SIGNATURES: PanicSignature[] = [
  {
    id: 'sig_1',
    keyword: 'prs0',
    component: 'حساس الضغط الجوي (Barometer) وفلاتة مدخل الشحن',
    affectedDevices: 'iPhone 7 إلى iPhone 14 Pro Max',
    symptom: 'إعادة تشغيل (ريستارت) متكرر كل 3 دقائق بالدقيقة والثانية.',
    fixSolution: 'استبدال فلاتة فلاتة الشحن الأصلية أو فحص مسار I2C0_SDA/SCL المتصل بالحساس.',
    dangerLevel: 'HIGH',
  },
  {
    id: 'sig_2',
    keyword: 'mic2',
    component: 'المايك الثانوي وفلاتة زر الباور / الفلاش',
    affectedDevices: 'iPhone 11, 11 Pro, 12, 13',
    symptom: 'ريستارت مفاجئ كل 180 ثانية مع توقف أزرار الصوت أو الفلاش.',
    fixSolution: 'تغيير فلاتة الفلاش وزر الباور العلوية (Power/Flash Flex Cable).',
    dangerLevel: 'MEDIUM',
  },
  {
    id: 'sig_3',
    keyword: 'mic1',
    component: 'المايك الأساسي السفلي في فلاتة الشحن',
    affectedDevices: 'جميع موديلات iPhone و iPad',
    symptom: 'ريستارت دوري مع انقطاع صوت المكالمات أو عدم تسجيل مذكرات الصوت.',
    fixSolution: 'استبدال فلاتة الشحن السفلية (Charging Port Flex).',
    dangerLevel: 'MEDIUM',
  },
  {
    id: 'sig_4',
    keyword: 'tg0b',
    component: 'دائرة قياس سعة البطارية (Battery Gas Gauge / I2C Bus)',
    affectedDevices: 'iPhone X, XR, XS, 11, 12, 13, 14',
    symptom: 'ريستارت متكرر كل 3 دقائق، وعدم ظهور نسبة البطارية (علامة - أو 0%).',
    fixSolution: 'فحص ريش البطارية، مسار BSI/SWI، مقاومات رفع ناقل I2C بقيمة 2.2KΩ، أو تجربة بطارية أصلية أخرى.',
    dangerLevel: 'HIGH',
  },
  {
    id: 'sig_5',
    keyword: 'aop panic',
    component: 'معالج المستشعرات المستمر (Always-on Processor / FaceID / Proximity)',
    affectedDevices: 'iPhone X حتى iPhone 15 Pro',
    symptom: 'ريستارت متكرر مع سخونة في أعلى الشاشة أو توقف مستشعر التقارب.',
    fixSolution: 'فصل فلاتة السماعة العلوية ومستشعر الإضاءة (Ear Speaker Flex) وتشغيل الهاتف بدونها للتأكد.',
    dangerLevel: 'HIGH',
  },
  {
    id: 'sig_6',
    keyword: 'wdt timeout',
    component: 'مؤقت الحماية ومسارات الاتصال البيني (Watchdog Timer / I2C Hang)',
    affectedDevices: 'أجهزة iOS وأندرويد (Snapdragon / Exynos)',
    symptom: 'تجمد الجهاز لثوانٍ ثم انطفاء مفاجئ نتيجة تعليق أحد مسارات البيانات.',
    fixSolution: 'فحص ممانعات خطوط I2C والـ SPI، والتأكد من عدم وجود شورت في أجهزة الاستشعار أو آيسي الصوت (Audio Codec).',
    dangerLevel: 'CRITICAL',
  },
  {
    id: 'sig_7',
    keyword: 'smc_panic',
    component: 'متحكم إدارة النظام في الماك بوك (Apple SMC / T2 Controller)',
    affectedDevices: 'MacBook Pro / MacBook Air (Intel & Apple Silicon)',
    symptom: 'مروحة اللابتوب تعمل بأقصى سرعة ثم ينطفئ الجهاز فوراً (Kernel Panic).',
    fixSolution: 'فحص حساسات الحرارة الموزعة على البوردة ومسار SMBUS الخاص بالبطارية والشاحن.',
    dangerLevel: 'CRITICAL',
  },
  {
    id: 'sig_8',
    keyword: 'kernel_task',
    component: 'نواة النظام ومسارات الذاكرة (Kernel / Memory Controller)',
    affectedDevices: 'MacBook Pro / iMac / Mac Pro',
    symptom: 'توقف مفاجئ مع شاشة رمادية أو إعادة تشغيل مستمرة بدون سبب واضح.',
    fixSolution: 'فحص شرائح الذاكرة RAM، موسفيتات تغذية المعالج، أو تثبيت نظام macOS نظيف.',
    dangerLevel: 'CRITICAL',
  },
  {
    id: 'sig_9',
    keyword: 'thermalmonitord',
    component: 'نظام مراقبة الحرارة (Thermal Management System)',
    affectedDevices: 'iPhone و iPad و MacBook',
    symptom: 'سخونة شديدة ثم إغلاق تلقائي للحماية من الحرارة.',
    fixSolution: 'فحص أنبوب الحرارة (Heat Pipe)، المعجون الحراري، أو حساسات الحرارة.',
    dangerLevel: 'HIGH',
  },
  {
    id: 'sig_10',
    keyword: 'baseband panic',
    component: 'معالج الاتصالات (Baseband / Modem)',
    affectedDevices: 'iPhone و iPad مع LTE/5G',
    symptom: 'فقدان الإشارة أو عدم القدرة على الاتصال بالشبكة بعد الريستارت.',
    fixSolution: 'فحص آيسي الـ Baseband، مقاومات الطاقة، أو إعادة تثبيت الفيرموير.',
    dangerLevel: 'HIGH',
  },
];

export default function PanicLogAnalyzer() {
  const [logText, setLogText] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const [signatures, setSignatures] = useState<PanicSignature[]>(DEFAULT_SIGNATURES);
  const [detectedSignatures, setDetectedSignatures] = useState<PanicSignature[]>([]);
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSignature, setNewSignature] = useState({
    keyword: '',
    component: '',
    affectedDevices: '',
    symptom: '',
    fixSolution: '',
    dangerLevel: 'MEDIUM' as 'CRITICAL' | 'HIGH' | 'MEDIUM',
  });
  const [savedLogs, setSavedLogs] = useState<Array<{ id: string; date: string; text: string; results: PanicSignature[] }>>([]);

  // تحميل البصمات المخصصة والسجلات المحفوظة من localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSigs = localStorage.getItem('dahab_custom_signatures');
        if (savedSigs) {
          const parsed = JSON.parse(savedSigs);
          if (Array.isArray(parsed)) {
            setSignatures([...DEFAULT_SIGNATURES, ...parsed]);
          }
        }

        const savedLogsData = localStorage.getItem('dahab_saved_panic_logs');
        if (savedLogsData) {
          const parsed = JSON.parse(savedLogsData);
          if (Array.isArray(parsed)) setSavedLogs(parsed);
        }
      } catch {}
    }
  }, []);

  // حفظ البصمات المخصصة في localStorage
  const saveCustomSignatures = (customSigs: PanicSignature[]) => {
    try {
      localStorage.setItem('dahab_custom_signatures', JSON.stringify(customSigs));
    } catch {}
  };

  // حفظ السجلات في localStorage
  const saveLogs = (logs: typeof savedLogs) => {
    try {
      localStorage.setItem('dahab_saved_panic_logs', JSON.stringify(logs));
    } catch {}
  };

  const handleAnalyze = () => {
    if (!logText.trim()) return;
    const lower = logText.toLowerCase();

    const matched = signatures.filter((sig) =>
      lower.includes(sig.keyword.toLowerCase())
    );

    setDetectedSignatures(matched);
    setAnalyzed(true);

    // حفظ السجل المحلل
    const newLog = {
      id: `log_${Date.now()}`,
      date: new Date().toLocaleDateString('ar-EG'),
      text: logText,
      results: matched,
    };
    const updatedLogs = [newLog, ...savedLogs].slice(0, 20); // احتفظ بآخر 20 سجل
    setSavedLogs(updatedLogs);
    saveLogs(updatedLogs);
  };

  const handleClear = () => {
    setLogText('');
    setAnalyzed(false);
    setDetectedSignatures([]);
  };

  const handleCopy = () => {
    if (detectedSignatures.length === 0) return;
    const text = detectedSignatures
      .map(
        (s) =>
          `[تحليل البانيك] المكون المسبب: ${s.component}\nالعرض: ${s.symptom}\nالحل: ${s.fixSolution}`
      )
      .join('\n---\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportReport = () => {
    if (detectedSignatures.length === 0) return;
    const report = {
      date: new Date().toISOString(),
      logText: logText,
      detectedSignatures: detectedSignatures.map(s => ({
        keyword: s.keyword,
        component: s.component,
        affectedDevices: s.affectedDevices,
        symptom: s.symptom,
        fixSolution: s.fixSolution,
        dangerLevel: s.dangerLevel,
      })),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `panic_analysis_${Date.now()}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  // إضافة بصمة مخصصة
  const handleAddSignature = () => {
    if (!newSignature.keyword || !newSignature.component) {
      alert('يرجى إدخال الكلمة المفتاحية والمكون');
      return;
    }

    const customSig: PanicSignature = {
      id: `custom_${Date.now()}`,
      keyword: newSignature.keyword,
      component: newSignature.component,
      affectedDevices: newSignature.affectedDevices,
      symptom: newSignature.symptom,
      fixSolution: newSignature.fixSolution,
      dangerLevel: newSignature.dangerLevel,
      isCustom: true,
    };

    const customSigs = signatures.filter((s) => s.isCustom);
    const updatedCustomSigs = [customSig, ...customSigs];
    const updatedSignatures = [...DEFAULT_SIGNATURES, ...updatedCustomSigs];

    setSignatures(updatedSignatures);
    saveCustomSignatures(updatedCustomSigs);
    setNewSignature({
      keyword: '',
      component: '',
      affectedDevices: '',
      symptom: '',
      fixSolution: '',
      dangerLevel: 'MEDIUM',
    });
    setShowAddModal(false);
  };

  // حذف بصمة مخصصة
  const handleDeleteSignature = (id: string) => {
    if (!id.startsWith('custom_')) return;

    const updated = signatures.filter((s) => s.id !== id);
    const customSigs = updated.filter((s) => s.isCustom);
    setSignatures(updated);
    saveCustomSignatures(customSigs);
  };

  // استرجاع سجل محفوظ
  const handleRestoreLog = (log: typeof savedLogs[0]) => {
    setLogText(log.text);
    setDetectedSignatures(log.results);
    setAnalyzed(true);
  };

  // حذف سجل محفوظ
  const handleDeleteLog = (id: string) => {
    const updated = savedLogs.filter((l) => l.id !== id);
    setSavedLogs(updated);
    saveLogs(updated);
  };

  return (
    <div className="bg-workshop-card border border-workshop-border rounded-2xl p-5 shadow-2xl space-y-5 animate-fadeIn">
      {/* هيدر المحلل */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-workshop-border pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-gray-100 flex items-center gap-2">
              <span>محلل سجلات البانيك التلقائي (Panic Log & Crash Dump)</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold border border-purple-500/30">
                iOS & Android & Mac
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              الصق كود ملف `panic-full.ips` أو `logcat` وسيكتشف الذكاء الاصطناعي الحساس أو الكابل التالف المسبب للريستارت فوراً
            </p>
          </div>
        </div>

        {analyzed && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-gray-300 font-bold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>نسخ</span>
            </button>

            <button
              onClick={handleExportReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-gray-300 font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة بصمة</span>
        </button>
      </div>

      {/* صندوق إدخال ملف اللوج */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <label className="font-bold text-gray-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>الصق نص ملف الـ Panic أو السجل هنا:</span>
          </label>
          <span className="text-gray-500 text-[11px]">
            (من المسار: الإعدادات &gt; الخصوصية &gt; التحليلات والتحسينات &gt; بيانات التحليلات)
          </span>
        </div>

        <textarea
          value={logText}
          onChange={(e) => setLogText(e.target.value)}
          placeholder={`مثال على كود البانيك في آيفون:
{"bug_type":"210","timestamp":"2026-09-22 14:02:11","os_version":"iPhone OS 16.5"}
panic(cpu 1 caller 0xfffffff01bf890c4): "PanicString": "userspace watchdog timeout: no successful checkins from thermalmonitord in 180 seconds"
Missing sensor(s): Prs0, Mic2 ...`}
          className="w-full p-4 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-200 font-mono focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none h-36 resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-800 transition"
          >
            مسح النص
          </button>

          <button
            onClick={handleAnalyze}
            disabled={!logText.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg shadow-purple-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            <span>تشريح وتحليل سجل البانيك ⚡</span>
          </button>
        </div>
      </div>

      {/* نتائج التحليل الذكي */}
      {analyzed && (
        <div className="space-y-3 pt-2 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>نتائج تشريح السجل: تم رصد ({detectedSignatures.length}) مسببات محتملة</span>
            </h3>
          </div>

          {detectedSignatures.length === 0 ? (
            <div className="p-5 rounded-xl border border-dashed border-gray-800 bg-gray-900/40 text-center space-y-1">
              <Cpu className="w-6 h-6 text-gray-600 mx-auto" />
              <p className="text-xs font-bold text-gray-400">
                لم يتم رصد بصمة حساس شهيرة مباشرة، يرجى التأكد من احتواء النص على سطر `panic` أو `Missing sensor`.
              </p>
              <p className="text-[11px] text-gray-500">
                يمكنك نسخ محتوى اللوج إلى شاشة الفحص الرئيسية ليقوم الموديل بالتشخيص الشامل.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {detectedSignatures.map((sig, idx) => (
                <div
                  key={sig.id || idx}
                  className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:border-purple-500/50 transition space-y-2.5 relative group"
                >
                  {sig.isCustom && (
                    <button
                      onClick={() => handleDeleteSignature(sig.id)}
                      className="absolute top-2 left-2 p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition opacity-0 group-hover:opacity-100"
                      title="حذف البصمة"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                    <span className="font-mono font-black text-sm text-purple-300 uppercase">
                      كود الخطأ: {sig.keyword}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-black ${
                        sig.dangerLevel === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : sig.dangerLevel === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      }`}
                    >
                      {sig.dangerLevel === 'CRITICAL' ? 'حرج جداً' : sig.dangerLevel === 'HIGH' ? 'متكرر دورياً' : 'متوسط'}
                    </span>
                  </div>

                  <div className="text-xs text-gray-200">
                    <strong className="text-purple-300">المكون المعطوب:</strong> {sig.component}
                  </div>

                  <div className="text-[11px] text-gray-400">
                    <strong className="text-gray-300">الأجهزة الشائعة:</strong> {sig.affectedDevices}
                  </div>

                  <div className="text-[11px] text-gray-300 bg-gray-950/80 p-2 rounded-lg border border-gray-800">
                    <strong className="text-amber-400">العرض:</strong> {sig.symptom}
                  </div>

                  <div className="text-xs font-bold text-emerald-300 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/30">
                    <strong className="text-emerald-400">🛠️ الحل الفوري المقترح:</strong> {sig.fixSolution}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* سجل التحليلات المحفوظة */}
      {savedLogs.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <History className="w-4 h-4 text-sky-400" />
              <span>سجل التحليلات المحفوظة ({savedLogs.length})</span>
            </h3>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {savedLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-purple-500/50 transition flex items-center justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-gray-400">{log.date}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold">
                      {log.results.length} نتائج
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 truncate">{log.text.slice(0, 100)}...</p>
                </div>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleRestoreLog(log)}
                    className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition"
                    title="استرجاع"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal إضافة بصمة مخصصة */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-workshop-card border border-workshop-border rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-200">إضافة بصمة بانيك مخصصة</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">الكلمة المفتاحية *</label>
                <input
                  type="text"
                  value={newSignature.keyword}
                  onChange={(e) => setNewSignature({ ...newSignature, keyword: e.target.value })}
                  placeholder="مثال: sensor_name"
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">المكون المعطوب *</label>
                <input
                  type="text"
                  value={newSignature.component}
                  onChange={(e) => setNewSignature({ ...newSignature, component: e.target.value })}
                  placeholder="مثال: فلاتة الشحن"
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">الأجهزة المتأثرة</label>
                <input
                  type="text"
                  value={newSignature.affectedDevices}
                  onChange={(e) => setNewSignature({ ...newSignature, affectedDevices: e.target.value })}
                  placeholder="مثال: iPhone 12, 13"
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">العرض</label>
                <textarea
                  value={newSignature.symptom}
                  onChange={(e) => setNewSignature({ ...newSignature, symptom: e.target.value })}
                  placeholder="وصف العرض..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">الحل المقترح</label>
                <textarea
                  value={newSignature.fixSolution}
                  onChange={(e) => setNewSignature({ ...newSignature, fixSolution: e.target.value })}
                  placeholder="الحل الفني..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">مستوى الخطورة</label>
                <select
                  value={newSignature.dangerLevel}
                  onChange={(e) => setNewSignature({ ...newSignature, dangerLevel: e.target.value as 'CRITICAL' | 'HIGH' | 'MEDIUM' })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-purple-500"
                >
                  <option value="MEDIUM">متوسط</option>
                  <option value="HIGH">عالي</option>
                  <option value="CRITICAL">حرج جداً</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddSignature}
                className="flex-1 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-black transition shadow-sm"
              >
                إضافة
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
