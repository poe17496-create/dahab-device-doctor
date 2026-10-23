'use client';

import React, { useState, useMemo } from 'react';
import { X, Activity, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';

interface QuickDiodeEvaluatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyReading?: (val: number) => void;
}

type RailType = 'main_pwr' | 'cpu_gpu' | 'dram' | 'data_i2c' | 'lcd_backlight';

export default function QuickDiodeEvaluatorModal({
  isOpen,
  onClose,
  onApplyReading,
}: QuickDiodeEvaluatorModalProps) {
  const [inputValue, setInputValue] = useState<string>('0.380');
  const [selectedRail, setSelectedRail] = useState<RailType>('main_pwr');

  const railOptions: { id: RailType; name: string; standardRange: string; nominalV: string }[] = [
    { id: 'main_pwr', name: 'خط باور رئيسي (VDD_MAIN / 19V VIN / VPH_PWR)', standardRange: '0.300V - 0.450V', nominalV: '3.8V - 20V' },
    { id: 'cpu_gpu', name: 'خط معالج / رسوميات (VCORE / GPU Core)', standardRange: '0.010V - 0.050V (منخفض جداً بطبيعته)', nominalV: '0.7V - 1.05V' },
    { id: 'dram', name: 'خط تغذية الرامات (DRAM / VDDQ 1.1V / 1.2V)', standardRange: '0.250V - 0.380V', nominalV: '1.1V - 1.2V' },
    { id: 'data_i2c', name: 'خط إشارة وداتا (I2C / SPI / USB D+/D-)', standardRange: '0.400V - 0.700V', nominalV: '1.8V - 3.3V' },
    { id: 'lcd_backlight', name: 'خط إضاءة وشاشة (Backlight Anode / LCD)', standardRange: '0.450V - 0.650V', nominalV: '4.0V - 22V' },
  ];

  const analysis = useMemo(() => {
    const trimmed = inputValue.trim().toUpperCase();

    if (trimmed === 'OL' || trimmed === 'OPEN' || trimmed === '1.') {
      return {
        status: 'open',
        title: 'خط مقطوع صريح (Open Loop - OL)',
        badge: 'انقطاع مسار',
        color: 'border-slate-400 bg-slate-500/10 text-slate-700 dark:text-slate-300',
        advice: 'قيمة الممانعة ما لا نهاية (OL). المسار غير متصل بالآيسي أو الأرضي. افحص فوراً: الفيوز (FL)، ملف التوالي (Inductor)، مقاومة الصفر (0Ω)، أو تأكد من عدم رفع/انفصال أرجل الآيسي عن البوردة.',
      };
    }

    const val = parseFloat(trimmed);
    if (isNaN(val)) {
      return {
        status: 'invalid',
        title: 'قيمة غير صالحة',
        badge: 'خطأ إدخال',
        color: 'border-gray-300 bg-gray-50 text-gray-500',
        advice: 'يرجى كتابة رقم الممانعة بالفولت (مثال: 0.380 أو 0.012) أو كتابة OL للخط المقطوع.',
      };
    }

    // تحليل خاص بمسار المعالج
    if (selectedRail === 'cpu_gpu') {
      if (val < 0.005) {
        return {
          status: 'short',
          title: 'شورت صريح للأرضي (Short to GND على مسار المعالج)',
          badge: 'شورت حرج',
          color: 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400',
          advice: 'القيمة صفرية تقريباً (< 0.005V). يوجد شورت صريح في مكثفات تصفية المعالج أو موسفيتات درايفر البك العلوية. تحذير: لا تحقن أكثر من 0.8V نهائياً لتفادي حرق طبقات السيليكون الداخلية.',
        };
      }
      if (val >= 0.008 && val <= 0.060) {
        return {
          status: 'normal',
          title: 'ممانعة طبيعية جداً لمسار المعالج (Normal Low Resistance)',
          badge: 'مسار سليم',
          color: 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400',
          advice: 'ممانعة مسارات VCORE للمعالج والرسوميات منخفضة جداً بطبيعتها (0.010V - 0.050V) بسبب ضخامة عدد الترانزستورات الداخلية بالنانومتر. هذا ليس شورت، والمسار سليم هندسياً.',
        };
      }
      return {
        status: 'caution',
        title: 'ممانعة مرتفعة عن الطبيعي لمعالج',
        badge: 'انفصال محتمل',
        color: 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        advice: 'الممانعة أعلى من المعتاد لخط معالج نشط. قد يشير إلى انقطاع كويل البك أو فصل في كورات القصدير (BGA Balls) أسفل المعالج.',
      };
    }

    // باقي مسارات الباور والداتا
    if (val < 0.015) {
      return {
        status: 'short',
        title: 'شورت صريح مباشر للأرضي (Dead Short to GND)',
        badge: 'شورت صريح',
        color: 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400',
        advice: 'الممانعة منهارة بالكامل (أقل من 0.015V). افحص فوراً المكثفات السيراميكية التوازي على الخط، دايود الحماية، أو آيسي التغذية المرتبط. ابدأ بالحقن الآمن بنصف الفولت (1.0V - 1.2V) مع مراقبة السخونة بالرجينة أو الكاميرا الحرارية.',
      };
    }

    if (val < 0.200) {
      return {
        status: 'leakage',
        title: 'ممانعة هابطة / تسريب جزئي (Partial Leakage)',
        badge: 'تسريب تيار',
        color: 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        advice: 'المسار يسحب أمبير غير طبيعي بسبب مكثف تالف جزئياً أو تسريب داخل شريحة الآيسي أو تلف دايود ESD. لا يسبب هبوط الفولت للصفر لكنه يفرغ البطارية أو يمنع الإقلاع التام.',
      };
    }

    if (val >= 0.250 && val <= 0.750) {
      return {
        status: 'normal',
        title: 'ممانعة سليمة وطبيعية (Healthy Circuit)',
        badge: 'سليم 100%',
        color: 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        advice: 'الممانعة مطابقة للمعايير الهندسية (0.280V - 0.700V). المسار متصل بالدايود الداخلي للسيليكون ولا يعاني من شورت أو انقطاع. ابحث عن العطل في إشارة الـ Enable أو مرحلة الباور التالية.',
      };
    }

    return {
      status: 'high',
      title: 'ممانعة مرتفعة نسبياً (> 0.750V)',
      badge: 'ممانعة عالية',
      color: 'border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
      advice: 'الممانعة مرتفعة. طبيعية في بعض خطوط الحساسات التناظرية والـ RF، ولكن على خطوط التغذية قد تدل على مقاومة فيوزية تالفة ارتفعت أوميتها أو خط شبه مقطوع.',
    };
  }, [inputValue, selectedRail]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-gray-100">
                مقيّم الممانعة السريع (Diode Mode Evaluator)
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                تحليل فوري لقراءة الملتيميتر وتحديد الشورت أو التسريب أو الخط المقطوع
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* اختيار نوع المسار */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              1. اختر نوع المسار المراد تقييم ممانعته:
            </label>
            <select
              value={selectedRail}
              onChange={(e) => setSelectedRail(e.target.value as RailType)}
              className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500"
            >
              {railOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* إدخال قراءة الملتيميتر */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                2. اكتب قراءة الملتيميتر بوضع الدايود (Diode Value):
              </label>
              <span className="text-[10px] text-gray-400 font-mono">
                المعدل النموذجي: {railOptions.find((r) => r.id === selectedRail)?.standardRange}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="مثال: 0.380 أو 0.015 أو OL..."
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-bold text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-emerald-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-400">
                  Volt
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInputValue('OL')}
                className="px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-mono font-bold transition"
                title="كتابة خط مقطوع OL"
              >
                OL
              </button>
              <button
                type="button"
                onClick={() => setInputValue('0.002')}
                className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 text-xs font-mono font-bold transition"
                title="شورت صفر"
              >
                0.000V
              </button>
            </div>
          </div>

          {/* نتيجة التحليل الفوري */}
          <div className={`p-4 rounded-2xl border ${analysis.color} space-y-2 transition-all`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {analysis.status === 'short' && <ShieldAlert className="w-5 h-5 shrink-0" />}
                {analysis.status === 'leakage' && <AlertTriangle className="w-5 h-5 shrink-0" />}
                {analysis.status === 'normal' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                {analysis.status === 'open' && <HelpCircle className="w-5 h-5 shrink-0" />}
                <h4 className="font-bold text-xs md:text-sm">{analysis.title}</h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/60 dark:bg-black/30 border border-current">
                {analysis.badge}
              </span>
            </div>
            <p className="text-xs leading-relaxed opacity-95">
              {analysis.advice}
            </p>
          </div>

          {/* نصيحة القياس الهندسي الصحيح */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 text-[11px] text-gray-600 dark:text-gray-400 space-y-1">
            <span className="font-bold text-gray-800 dark:text-gray-200 block">💡 قاعدة القياس الهندسي بوضع الدايود (Diode Mode Rule):</span>
            <p>
              • ضع المسبار <strong>الأحمر (+)</strong> على أرضي البوردة (GND)، والمسبار <strong>الأسود (-)</strong> على المسار المراد فحصه (انحياز عكسي Reverse Bias).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2 bg-gray-50/50 dark:bg-gray-900/30">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20"
          >
            تم الفحص
          </button>
        </div>
      </div>
    </div>
  );
}
