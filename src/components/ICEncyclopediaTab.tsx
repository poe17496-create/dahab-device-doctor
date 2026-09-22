'use client';

import React, { useState, useEffect } from 'react';
import { Search, Cpu, CheckCircle2, AlertTriangle, Layers, BookOpen, ExternalLink } from 'lucide-react';
import { ICRecord } from '@/lib/icDatabase';

export default function ICEncyclopediaTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ICRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

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

  return (
    <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-2xl p-5 shadow-2xl space-y-5 animate-fadeIn">
      {/* هيدر الموسوعة */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-workshop-border pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-dahab-500/20 text-dahab-500 border border-dahab-500/30 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>موسوعة بدائل وتوافقات الآيسيهات والمسارات (IC Cross-Reference)</span>
              <span className="text-[10px] bg-dahab-500/20 text-dahab-600 dark:text-dahab-300 px-2 py-0.5 rounded-full font-bold border border-dahab-500/30">
                مرجع المعمل المعتمد
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              قاعدة بيانات بدائل الآيسيهات المتطابقة، وممانعات القياس المرجعية (Diode Mode)، وأشهر أعطالها
            </p>
          </div>
        </div>
      </div>

      {/* البحث والتصنيف */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-dahab-500 absolute right-3.5 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث برقم الآيسي (مثلاً: 1610A3 أو PM8150 أو BQ25601 أو Tristar أو ISL)..."
            className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500 shadow-sm"
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

      {/* عرض كروت الآيسيهات والبدائل */}
      <div className="space-y-3 pt-1">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500">جاري البحث في قاعدة البيانات...</div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500 space-y-2 border border-dashed rounded-xl dark:border-gray-800">
            <Cpu className="w-8 h-8 mx-auto text-gray-400 opacity-60" />
            <p>لم يتم العثور على بديل مطابق بهذا الرقم في قاعدة البيانات المدمجة.</p>
            <p className="text-[11px] text-gray-400">
              يمكنك كتابة رقم الآيسي في شاشة الفحص الأولى ليقوم الذكاء الاصطناعي باستخراج بدائله من المخططات فوراً.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResults.map((ic, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 hover:border-dahab-500/50 transition-all space-y-3 shadow-sm"
              >
                {/* رأس كارت الآيسي */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-amber-600 dark:text-dahab-400">
                      {ic.partNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {ic.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {ic.deviceFamily}
                  </span>
                </div>

                <div className="text-xs text-gray-800 dark:text-gray-200">
                  <strong className="text-amber-700 dark:text-dahab-300">الوظيفة في الدائرة:</strong>{' '}
                  {ic.function}
                </div>

                {/* البدائل المتوافقة */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>البدائل المتطابقة تماماً من بوردات أخرى:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ic.compatibles.map((comp, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* الأعراض الشائعة */}
                <div className="text-[11px] text-gray-700 dark:text-gray-300 bg-amber-50 dark:bg-gray-950 p-2.5 rounded-lg border border-amber-200 dark:border-gray-800">
                  <strong className="text-amber-700 dark:text-amber-400">الأعراض عند التلف:</strong>{' '}
                  {ic.commonSymptoms}
                </div>

                {/* قراءات الممانعة النموذجية */}
                <div className="text-[11px] text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/20 p-2.5 rounded-lg border border-sky-200 dark:border-sky-900/40">
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
