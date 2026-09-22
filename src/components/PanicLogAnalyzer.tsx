'use client';

import React, { useState } from 'react';
import { AlertOctagon, CheckCircle2, FileText, Cpu, Search, Sparkles, Copy, Check } from 'lucide-react';

interface PanicSignature {
  keyword: string;
  component: string;
  affectedDevices: string;
  symptom: string;
  fixSolution: string;
  dangerLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

const KNOWN_PANIC_SIGNATURES: PanicSignature[] = [
  {
    keyword: 'prs0',
    component: 'حساس الضغط الجوي (Barometer) وفلاتة مدخل الشحن',
    affectedDevices: 'iPhone 7 إلى iPhone 14 Pro Max',
    symptom: 'إعادة تشغيل (ريستارت) متكرر كل 3 دقائق بالدقيقة والثانية.',
    fixSolution: 'استبدال فلاتة فلاتة الشحن الأصلية أو فحص مسار I2C0_SDA/SCL المتصل بالحساس.',
    dangerLevel: 'HIGH',
  },
  {
    keyword: 'mic2',
    component: 'المايك الثانوي وفلاتة زر الباور / الفلاش',
    affectedDevices: 'iPhone 11, 11 Pro, 12, 13',
    symptom: 'ريستارت مفاجئ كل 180 ثانية مع توقف أزرار الصوت أو الفلاش.',
    fixSolution: 'تغيير فلاتة الفلاش وزر الباور العلوية (Power/Flash Flex Cable).',
    dangerLevel: 'MEDIUM',
  },
  {
    keyword: 'mic1',
    component: 'المايك الأساسي السفلي في فلاتة الشحن',
    affectedDevices: 'جميع موديلات iPhone و iPad',
    symptom: 'ريستارت دوري مع انقطاع صوت المكالمات أو عدم تسجيل مذكرات الصوت.',
    fixSolution: 'استبدال فلاتة الشحن السفلية (Charging Port Flex).',
    dangerLevel: 'MEDIUM',
  },
  {
    keyword: 'tg0b',
    component: 'دائرة قياس سعة البطارية (Battery Gas Gauge / I2C Bus)',
    affectedDevices: 'iPhone X, XR, XS, 11, 12, 13, 14',
    symptom: 'ريستارت متكرر كل 3 دقائق، وعدم ظهور نسبة البطارية (علامة - أو 0%).',
    fixSolution: 'فحص ريش البطارية، مسار BSI/SWI، مقاومات رفع ناقل I2C بقيمة 2.2KΩ، أو تجربة بطارية أصلية أخرى.',
    dangerLevel: 'HIGH',
  },
  {
    keyword: 'aop panic',
    component: 'معالج المستشعرات المستمر (Always-on Processor / FaceID / Proximity)',
    affectedDevices: 'iPhone X حتى iPhone 15 Pro',
    symptom: 'ريستارت متكرر مع سخونة في أعلى الشاشة أو توقف مستشعر التقارب.',
    fixSolution: 'فصل فلاتة السماعة العلوية ومستشعر الإضاءة (Ear Speaker Flex) وتشغيل الهاتف بدونها للتأكد.',
    dangerLevel: 'HIGH',
  },
  {
    keyword: 'wdt timeout',
    component: 'مؤقت الحماية ومسارات الاتصال البيني (Watchdog Timer / I2C Hang)',
    affectedDevices: 'أجهزة iOS وأندرويد (Snapdragon / Exynos)',
    symptom: 'تجمد الجهاز لثوانٍ ثم انطفاء مفاجئ نتيجة تعليق أحد مسارات البيانات.',
    fixSolution: 'فحص ممانعات خطوط I2C والـ SPI، والتأكد من عدم وجود شورت في أجهزة الاستشعار أو آيسي الصوت (Audio Codec).',
    dangerLevel: 'CRITICAL',
  },
  {
    keyword: 'smc_panic',
    component: 'متحكم إدارة النظام في الماك بوك (Apple SMC / T2 Controller)',
    affectedDevices: 'MacBook Pro / MacBook Air (Intel & Apple Silicon)',
    symptom: 'مروحة اللابتوب تعمل بأقصى سرعة ثم ينطفئ الجهاز فوراً (Kernel Panic).',
    fixSolution: 'فحص حساسات الحرارة الموزعة على البوردة ومسار SMBUS الخاص بالبطارية والشاحن.',
    dangerLevel: 'CRITICAL',
  },
];

export default function PanicLogAnalyzer() {
  const [logText, setLogText] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const [detectedSignatures, setDetectedSignatures] = useState<PanicSignature[]>([]);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = () => {
    if (!logText.trim()) return;
    const lower = logText.toLowerCase();

    const matched = KNOWN_PANIC_SIGNATURES.filter((sig) =>
      lower.includes(sig.keyword.toLowerCase())
    );

    setDetectedSignatures(matched);
    setAnalyzed(true);
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
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-gray-300 font-bold"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>نسخ تقرير البانيك</span>
          </button>
        )}
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
                  key={idx}
                  className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:border-purple-500/50 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                    <span className="font-mono font-black text-sm text-purple-300 uppercase">
                      كود الخطأ: {sig.keyword}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-black ${
                        sig.dangerLevel === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {sig.dangerLevel === 'CRITICAL' ? 'حرج جداً' : 'متكرر دورياً'}
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
    </div>
  );
}
