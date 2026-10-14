'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Layers,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  CircuitBoard,
} from 'lucide-react';
import { ICRecord } from '@/lib/icDatabase';

const QUICK_CHIPS = [
  { label: '1610A3 (Tristar)', q: '1610A3' },
  { label: 'PM8150 (Snapdragon)', q: 'PM8150' },
  { label: 'BQ25601 (شحن)', q: 'BQ25601' },
  { label: 'ISL95855 (VCORE)', q: 'ISL95855' },
  { label: 'TPS51980 (3.3V/5V)', q: 'TPS51980' },
  { label: 'RT8206B (لابتوب)', q: 'RT8206B' },
  { label: 'WCN3990 (Wi-Fi)', q: 'WCN3990' },
  { label: 'بوردة LA-9104P', q: 'LA-9104P' },
  { label: 'بوردة iPhone 820-3486', q: '820-3486' },
];

export default function ICEncyclopediaTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ICRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const CATEGORIES = [
    { id: 'ALL', label: 'الكل (جميع الدوائر)' },
    { id: 'Charging', label: '🔌 آيسيات الشحن والـ USB' },
    { id: 'PMIC', label: '⚡ آيسيات الباور الرئيسية (PMIC)' },
    { id: 'CPU', label: '💻 دوائر وفازات المعالج (VCORE)' },
  ];

  useEffect(() => {
    const fetchICs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ic-lookup?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchICs, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredResults = results.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl p-5 md:p-6 shadow-2xl space-y-5 animate-fadeIn">
      {/* هيدر الموسوعة */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-workshop-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-dahab-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>محرك بدائل الآيسيهات وبوردات التشليح (IC Donor Finder)</span>
              <span className="text-[10px] bg-dahab-500/20 text-dahab-600 dark:text-dahab-300 px-2.5 py-0.5 rounded-full font-bold border border-dahab-500/30">
                859 بوردة ومخطط
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              ابحث برقم أي آيسي تالف لمعرفة بدائله المتطابقة وأسماء بوردات التشليح المتوفرة في ورشتك
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-400 font-bold bg-gray-100 dark:bg-gray-800/80 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
          نتائج البحث: <span className="text-dahab-500 font-black">{filteredResults.length}</span> دائرة وبديل
        </div>
      </div>

      {/* البحث والتصنيف */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-dahab-500 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث برقم الآيسي (مثل 1610A3 أو PM8150) أو كود بوردة التشليح (مثل LA-9104P أو 820-3486)..."
              className="w-full pr-10 pl-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500 shadow-sm"
            />
          </div>

          {/* أزرار الفئات */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${
                  selectedCategory === cat.id
                    ? 'bg-dahab-500 text-slate-950 border-dahab-600 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-850'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* شرائح البحث السريع الشائعة */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-gray-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-dahab-500" /> اختصارات سريعة:
          </span>
          {QUICK_CHIPS.map((chip, i) => (
            <button
              key={i}
              onClick={() => setQuery(chip.q)}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800/80 hover:bg-dahab-500/20 text-gray-700 dark:text-gray-300 hover:text-dahab-600 dark:hover:text-dahab-300 border border-gray-200 dark:border-gray-700 transition"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* عرض كروت الآيسيهات والبدائل */}
      <div className="space-y-3 pt-1">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-dahab-500 border-t-transparent rounded-full animate-spin" />
            <span>جاري البحث في قاعدة البيانات ومصفوفة الـ 859 بوردة ومخطط...</span>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500 space-y-2 border border-dashed rounded-2xl dark:border-gray-800">
            <Cpu className="w-8 h-8 mx-auto text-gray-400 opacity-60" />
            <p className="font-bold text-gray-700 dark:text-gray-300">لم يتم العثور على بديل مطابق بهذا الكود حالياً.</p>
            <p className="text-[11px] text-gray-400">
              يمكنك كتابة رقم الآيسي في شاشة الفحص الأولى ليقوم الذكاء الاصطناعي باستخراج بدائله المباشرة فوراً.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResults.map((ic, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 hover:border-dahab-500/50 transition-all space-y-3 shadow-sm group"
              >
                {/* رأس كارت الآيسي */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800/80 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-base font-black text-amber-600 dark:text-dahab-400 group-hover:text-dahab-500 transition">
                      {ic.partNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {ic.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate max-w-[150px]">
                      {ic.deviceFamily}
                    </span>
                    <button
                      onClick={() => handleCopy(`${ic.partNumber} - البدائل: ${ic.compatibles.join(', ')}`, idx)}
                      className="p-1 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-500 hover:text-dahab-500 transition"
                      title="نسخ بيانات البدائل"
                    >
                      {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-800 dark:text-gray-200">
                  <strong className="text-amber-700 dark:text-dahab-300">الوظيفة في الدائرة:</strong>{' '}
                  {ic.function}
                </div>

                {/* البدائل المتوافقة */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>البدائل المتطابقة تماماً (Cross-Reference):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ic.compatibles && ic.compatibles.length > 0 ? (
                      ic.compatibles.map((comp, cIdx) => (
                        <span
                          key={cIdx}
                          className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold"
                        >
                          {comp}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-400">لا يوجد بديل تجاري مباشر مسجل - استخرج من بوردات التشليح أدناه</span>
                    )}
                  </div>
                </div>

                {/* بوردات التشليح المتوافقة (Donor Boards) */}
                {ic.donorBoards && ic.donorBoards.length > 0 && (
                  <div className="space-y-1.5 pt-1 bg-amber-500/5 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-500/20">
                    <div className="text-[11px] font-black text-amber-700 dark:text-amber-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-amber-500" />
                        <span>بوردات تشليح تحوي هذا الآيسي (Donor Boards):</span>
                      </span>
                      <span className="text-[10px] font-mono text-dahab-500">
                        {ic.donorBoards.length} بوردة
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                      {ic.donorBoards.map((donor, dIdx) => (
                        <button
                          key={dIdx}
                          type="button"
                          onClick={() => setQuery(donor.model)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800/90 hover:bg-amber-500/20 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1.5 transition text-right shadow-sm cursor-pointer"
                          title={`كود البوردة: ${donor.boardCode} | ${donor.roleOnBoard}`}
                        >
                          <span>{donor.category === 'mobile' ? '📱' : donor.category === 'laptop' ? '💻' : '🖥️'}</span>
                          <span className="font-bold">{donor.model}</span>
                          <span className="opacity-70 font-mono text-[9px] bg-black/10 dark:bg-black/30 px-1 rounded">
                            {donor.boardCode}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* الأعراض الشائعة */}
                <div className="text-[11px] text-gray-700 dark:text-gray-300 bg-amber-50/70 dark:bg-gray-950/80 p-2.5 rounded-xl border border-amber-200 dark:border-gray-800">
                  <strong className="text-amber-700 dark:text-amber-400">أشهر الأعراض عند التلف:</strong>{' '}
                  {ic.commonSymptoms}
                </div>

                {/* قراءات الممانعة النموذجية */}
                <div className="text-[11px] text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/20 p-2.5 rounded-xl border border-sky-200 dark:border-sky-900/40">
                  <strong className="text-sky-700 dark:text-sky-400">قراءات الممانعة السليمة (Diode Mode):</strong>{' '}
                  {ic.diodeReadings}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
