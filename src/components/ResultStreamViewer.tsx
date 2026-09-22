'use client';

import React, { useState } from 'react';
import { Copy, Check, Printer, Volume2, Sparkles, Terminal } from 'lucide-react';

interface ResultStreamViewerProps {
  rawOutput: string;
  loading: boolean;
  onPrint?: () => void;
}

export default function ResultStreamViewer({ rawOutput, loading, onPrint }: ResultStreamViewerProps) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // إزالة بلوك الميتريكس من العرض النصي حتى لا يظهر ككود مشوش للفني
  const cleanContent = rawOutput
    .replace(/<<<DAHAB_DIAGNOSTIC_METRICS>>>[\s\S]*?<<<END_DAHAB_METRICS>>>/g, '')
    .trim();

  const handleCopy = () => {
    if (!cleanContent) return;
    navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeech = () => {
    if (!window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanContent.slice(0, 1000));
    utterance.lang = 'ar-SA';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="bg-gray-950 border border-workshop-border rounded-2xl overflow-hidden shadow-2xl space-y-0">
      {/* هيدر شاشة النتائج */}
      <div className="bg-gray-900/90 border-b border-gray-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-xs font-mono text-dahab-400 font-bold mr-2 flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5" />
            <span>DAHAB_FIX_AI_ENGINE_TERMINAL</span>
          </span>
          {loading && (
            <span className="text-[11px] font-mono text-emerald-400 animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>LIVE_STREAMING_IN_PROGRESS...</span>
            </span>
          )}
        </div>

        {/* أزرار الإجراءات */}
        {cleanContent && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSpeech}
              className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
                speaking
                  ? 'bg-amber-500/20 text-dahab-300 border-dahab-500'
                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:text-white'
              }`}
              title="قراءة صوتية للتشخيص"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{speaking ? 'إيقاف' : 'صوت'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white text-xs transition flex items-center gap-1"
              title="نسخ التقرير بالكامل"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'تم النسخ' : 'نسخ'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white text-xs transition flex items-center gap-1"
              title="طباعة تقرير الفحص المعتمد"
            >
              <Printer className="w-3.5 h-3.5 text-dahab-400" />
              <span className="hidden sm:inline">طباعة التقرير</span>
            </button>
          </div>
        )}
      </div>

      {/* محتوى الشاشة التدريجي (Streaming View) */}
      <div className="p-6 font-sans text-gray-200 text-sm leading-relaxed min-h-[300px] max-h-[650px] overflow-y-auto space-y-4">
        {cleanContent ? (
          <div className="whitespace-pre-wrap selection:bg-dahab-500/30 selection:text-white">
            {cleanContent}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center text-gray-600 space-y-2">
            <Sparkles className="w-8 h-8 text-dahab-500/40 animate-pulse" />
            <p className="font-semibold text-sm text-gray-500">
              في انتظار إدخال البيانات... اختر التخصص وضع قراءات الباور والملتيميتر لبدء الفرز
            </p>
            <p className="text-xs text-gray-600">
              سيقوم الذكاء الاصطناعي بتحديد العطل (هاردوير أو سوفتوير) مع خطوات القياس خطوة بخطوة
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
