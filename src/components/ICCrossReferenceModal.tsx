'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Cpu, CheckCircle, AlertCircle } from 'lucide-react';
import { ICRecord } from '@/lib/icDatabase';

interface ICCrossReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ICCrossReferenceModal({ isOpen, onClose }: ICCrossReferenceModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ICRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
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

    const timer = setTimeout(fetchICs, 250);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-workshop-card border border-dahab-500/40 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* هيدر النافذة */}
        <div className="p-4 border-b border-workshop-border flex items-center justify-between bg-gray-900/80">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-dahab-400" />
            <h2 className="font-black text-sm text-gray-100">
              قاعدة بيانات بدائل الآيسيهات وممانعات القياس المرجعية
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* شريط البحث السريع */}
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="w-4 h-4 text-dahab-400 absolute right-3 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث برقم الآيسي (مثلاً: 1610A3 أو PM8150 أو BQ25601 أو Tristar)..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-100 outline-none focus:border-dahab-500"
              autoFocus
            />
          </div>
        </div>

        {/* عرض النتائج */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400">جاري مطابقة البدائل...</div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 space-y-1">
              <Cpu className="w-8 h-8 mx-auto text-gray-600 opacity-50" />
              <p>لم يتم العثور على بديل مباشر بهذا الرقم في قاعدة البيانات المحلية.</p>
              <p className="text-[10px] text-gray-600">
                يمكنك كتابة رقم الآيسي في شاشة الفحص ليقوم الذكاء الاصطناعي باستخراج بدائله من المخططات.
              </p>
            </div>
          ) : (
            results.map((ic, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-gray-800 bg-gray-900/60 hover:border-dahab-500/50 transition space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-dahab-400">
                      {ic.partNumber}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-semibold">
                      {ic.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{ic.deviceFamily}</span>
                </div>

                <div className="text-xs text-gray-200">
                  <strong className="text-dahab-300">الوظيفة:</strong> {ic.function}
                </div>

                {/* البدائل المتطابقة */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> البدائل المتوافقة:
                  </span>
                  {ic.compatibles.map((comp, cIdx) => (
                    <span
                      key={cIdx}
                      className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold"
                    >
                      {comp}
                    </span>
                  ))}
                </div>

                {/* الأعراض الشائعة */}
                <div className="text-[11px] text-gray-400 bg-gray-950 p-2.5 rounded-lg border border-gray-850">
                  <strong className="text-amber-400">الأعراض الشائعة عند تلفه:</strong>{' '}
                  {ic.commonSymptoms}
                </div>

                {/* قراءات الممانعات */}
                <div className="text-[11px] text-sky-300 bg-sky-950/20 p-2 rounded-lg border border-sky-900/40">
                  <strong className="text-sky-400">قراءات الممانعة (Diode Mode):</strong>{' '}
                  {ic.diodeReadings}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
