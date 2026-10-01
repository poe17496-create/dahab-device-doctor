'use client';

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Printer,
  Volume2,
  Sparkles,
  Terminal,
  Cpu,
  Zap,
  Wrench,
  Layers,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import ComponentBadge from '@/components/ComponentBadge';

interface ResultStreamViewerProps {
  rawOutput: string;
  loading: boolean;
  onPrint?: () => void;
  onComponentHover?: (componentName: string) => void;
  onComponentLeave?: () => void;
}

export default function ResultStreamViewer({ rawOutput, loading, onPrint, onComponentHover, onComponentLeave }: ResultStreamViewerProps) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [highlightedComponent, setHighlightedComponent] = useState<string | null>(null);

  // Typewriter Effect - عرض النص تدريجياً
  useEffect(() => {
    if (!rawOutput) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    // إزالة بلوك الميتريكس من النص المعروض
    const cleanText = rawOutput
      .replace(/<<<DAHAB_DIAGNOSTIC_METRICS>>>[\s\S]*?<<<END_DAHAB_METRICS>>>/g, '')
      .trim();

    if (cleanText === displayedText) {
      setIsTyping(false);
      return;
    }

    // إذا كان النص الجديد أطول، استمر في الكتابة
    if (cleanText.length > displayedText.length) {
      setIsTyping(true);
      const typingInterval = setInterval(() => {
        setDisplayedText((prev) => {
          const nextChar = cleanText[prev.length];
          if (nextChar === undefined) {
            clearInterval(typingInterval);
            setIsTyping(false);
            return prev;
          }
          return prev + nextChar;
        });
      }, 15); // سرعة الكتابة: 15ms لكل حرف

      return () => clearInterval(typingInterval);
    } else {
      // إذا كان النص الجديد أقصر (تم تغييره)، اعرضه فوراً
      setDisplayedText(cleanText);
      setIsTyping(false);
    }
  }, [rawOutput, displayedText]);

  // دالة للكشف عن المكونات في النص وتحويلها إلى Badges
  const highlightComponents = (text: string) => {
    // نمط للكشف عن أسماء المكونات (مثل U1001, C2015, R1502, etc.)
    const componentPattern = /([UFRCKQLD]\d{3,4}|[A-Z]\d{3,4})/g;
    
    let lastIndex = 0;
    const parts: { text: string; isComponent: boolean; name?: string; type?: 'ic' | 'capacitor' | 'resistor' | 'trace' }[] = [];
    
    let match;
    while ((match = componentPattern.exec(text)) !== null) {
      // إضافة النص قبل المكون
      if (match.index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.index), isComponent: false });
      }
      
      const componentName = match[1];
      // تحديد نوع المكون
      let type: 'ic' | 'capacitor' | 'resistor' | 'trace' = 'ic';
      if (componentName.startsWith('C')) type = 'capacitor';
      else if (componentName.startsWith('R')) type = 'resistor';
      else if (componentName.startsWith('F') || componentName.startsWith('T')) type = 'trace';
      
      parts.push({ text: componentName, isComponent: true, name: componentName, type });
      lastIndex = componentPattern.lastIndex;
    }
    
    // إضافة النص بعد آخر مكون
    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), isComponent: false });
    }
    
    return parts;
  };

  const handleComponentHover = (componentName: string) => {
    setHighlightedComponent(componentName);
    if (onComponentHover) onComponentHover(componentName);
  };

  const handleComponentLeave = () => {
    setHighlightedComponent(null);
    if (onComponentLeave) onComponentLeave();
  };

  // إزالة بلوك الميتريكس من العرض النصي حتى لا يظهر ككود مشوش للفني
  const cleanContent = displayedText;

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

  // تقسيم محتوى التشخيص إلى أقسام منظمة إن وجدت
  const renderFormattedSections = () => {
    if (!cleanContent) return null;

    // إذا لم يكن هناك تنسيق عناوين بعد، اعرض النص مع Badges المكونات
    if (!cleanContent.includes('###')) {
      const parts = highlightComponents(cleanContent);
      return (
        <div className="leading-relaxed text-gray-800 dark:text-gray-200 font-sans text-sm">
          {parts.map((part, idx) => {
            if (part.isComponent && part.name && part.type) {
              return (
                <ComponentBadge
                  key={idx}
                  name={part.name}
                  type={part.type}
                  onHover={() => part.name && handleComponentHover(part.name)}
                  onLeave={handleComponentLeave}
                  isHighlighted={highlightedComponent === part.name}
                />
              );
            }
            return <span key={idx}>{part.text}</span>;
          })}
        </div>
      );
    }

    const sections = cleanContent.split(/(?=###\s+[1-5]\.)/g);

    return (
      <div className="space-y-4">
        {sections.map((sec, idx) => {
          const trimmed = sec.trim();
          if (!trimmed) return null;

          const lines = trimmed.split('\n');
          const title = lines[0].replace(/###\s+/, '').trim();
          const body = lines.slice(1).join('\n').trim();

          // تحديد الأيقونة واللون بحسب القسم
          let sectionIcon = <Wrench className="w-4 h-4 text-dahab-500" />;
          let sectionBorder = 'border-dahab-500/20';
          let sectionBg = 'bg-gray-50/70 dark:bg-gray-900/40';

          if (title.includes('التشريح') || title.includes('تصنيف')) {
            sectionIcon = <Cpu className="w-4 h-4 text-sky-500" />;
            sectionBorder = 'border-sky-500/30';
          } else if (title.includes('سحب') || title.includes('القياسات')) {
            sectionIcon = <Zap className="w-4 h-4 text-amber-500" />;
            sectionBorder = 'border-amber-500/30';
          } else if (title.includes('المخططات')) {
            sectionIcon = <Layers className="w-4 h-4 text-purple-500" />;
            sectionBorder = 'border-purple-500/30';
          } else if (title.includes('تحذيرات') || title.includes('بدائل')) {
            sectionIcon = <AlertTriangle className="w-4 h-4 text-rose-500" />;
            sectionBorder = 'border-rose-500/30';
            sectionBg = 'bg-rose-500/5 dark:bg-rose-950/20';
          }

          return (
            <div
              key={idx}
              className={`p-4 md:p-5 rounded-2xl border ${sectionBorder} ${sectionBg} space-y-2.5 transition-all shadow-sm`}
            >
              <div className="flex items-center gap-2 border-b border-gray-200/60 dark:border-gray-800/80 pb-2">
                {sectionIcon}
                <h4 className="font-black text-sm text-gray-900 dark:text-gray-100">{title}</h4>
              </div>
              <div className="whitespace-pre-wrap text-xs md:text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                {(() => {
                  const parts = highlightComponents(body);
                  return parts.map((part, pIdx) => {
                    if (part.isComponent && part.name && part.type) {
                      return (
                        <ComponentBadge
                          key={pIdx}
                          name={part.name}
                          type={part.type}
                          onHover={() => part.name ? handleComponentHover(part.name) : undefined}
                          onLeave={handleComponentLeave}
                          isHighlighted={highlightedComponent === part.name}
                        />
                      );
                    }
                    return <span key={pIdx}>{part.text}</span>;
                  });
                })()}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl overflow-hidden shadow-2xl space-y-0 transition-colors">
      {/* هيدر شاشة النتائج */}
      <div className="bg-gray-50 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          </div>
          <span className="text-xs font-mono text-dahab-700 dark:text-dahab-400 font-bold mr-2 flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5" />
            <span>تقرير الفحص والتشخيص الهندسي المعتمد</span>
          </span>
          {(loading || isTyping) && (
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 animate-pulse flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{isTyping ? 'جاري كتابة التقرير تدريجياً...' : 'جاري التدفق والتحليل الهندسي الحي...'}</span>
            </span>
          )}
        </div>

        {/* أزرار الإجراءات */}
        {cleanContent && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSpeech}
              className={`px-2.5 py-1.5 rounded-xl border text-xs transition flex items-center gap-1 ${
                speaking
                  ? 'bg-amber-500/20 text-dahab-700 dark:text-dahab-300 border-dahab-500 font-bold'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:text-dahab-600'
              }`}
              title="قراءة صوتية للتشخيص"
            >
              <Volume2 className="w-3.5 h-3.5 text-dahab-500" />
              <span className="hidden sm:inline">{speaking ? 'إيقاف الصوت' : 'استماع صوتي'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs transition flex items-center gap-1"
              title="نسخ التقرير بالكامل"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-dahab-500" />}
              <span className="hidden sm:inline">{copied ? 'تم النسخ' : 'نسخ التقرير'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition flex items-center gap-1 shadow-sm"
              title="طباعة تقرير الفحص المعتمد"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">طباعة التقرير</span>
            </button>
          </div>
        )}
      </div>

      {/* محتوى الشاشة التدريجي (Streaming View) */}
      <div className="p-5 md:p-6 font-sans text-gray-800 dark:text-gray-200 text-sm leading-relaxed min-h-[300px] max-h-[680px] overflow-y-auto space-y-4">
        {cleanContent ? (
          <>
            {renderFormattedSections()}
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5 leading-relaxed shadow-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">⚠️ تنبيه هندسي وإخلاء مسؤولية:</span>
                <span>هذه الاقتراحات معتمدة على تحليل المخططات بالذكاء الاصطناعي. يُرجى مراجعة قياسات الممانعة بنفسك على المازربورد قبل حقن الفولت لتفادي تلف المعالج والدوائر الحساسة.</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-52 text-center text-gray-400 dark:text-gray-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-dahab-500/10 flex items-center justify-center text-dahab-500 border border-dahab-500/20">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-1">
                في انتظار إدخال بيانات الفحص...
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
                اختر تخصص الجهاز واكتب وصف العطل أو قراءات سحب الباور سبلاي، وسيقوم المساعد الهندسي بفرز العطل خطوة بخطوة بالقيم القياسية وبدائل القطع.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
