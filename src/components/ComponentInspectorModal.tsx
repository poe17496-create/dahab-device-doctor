'use client';

import React from 'react';
import { X, Cpu, Zap, Activity, HelpCircle, Layers, Search, ShieldAlert, CheckCircle2 } from 'lucide-react';

export interface ComponentInfo {
  name: string;
  type: 'ic' | 'capacitor' | 'resistor' | 'trace' | 'mosfet' | 'coil' | 'diode' | 'crystal';
}

interface ComponentInspectorModalProps {
  component: ComponentInfo | null;
  onClose: () => void;
  onSearchDonor?: (partNumber: string) => void;
}

export default function ComponentInspectorModal({
  component,
  onClose,
  onSearchDonor,
}: ComponentInspectorModalProps) {
  if (!component) return null;

  const { name, type } = component;
  const upper = name.toUpperCase();

  // استخراج التفاصيل الهندسية بحسب نوع المكون
  const getDetails = () => {
    // 1. مكثفات (C...)
    if (type === 'capacitor' || upper.startsWith('C') || upper.startsWith('PC')) {
      return {
        categoryTitle: 'مكثف سيراميكي SMD (Ceramic Capacitor)',
        package: 'SMD Package (0201 / 0402 / 0603 / Tantalum)',
        role: 'تصفية الفولت وتثبيته ضد التموجات (Filtering & Decoupling)، وتغذية المعالج والدوائر المتكاملة بالطاقة اللحظية.',
        diodeTest: 'ضع المسبار الأحمر على الأرضي (GND) والأسود على طرف المكثف: يجب أن يعطي ممانعة في اتجاه واحد فقط (0.350V - 0.700V)، والطرف الآخر أرضي صريح (0.000V).',
        defectSigns: 'المكثفات هي المسبب الأول بنسبة 85% لشورت مسارات الباور (VDD_MAIN / VIN). يظهر تفحم أو سخونة تحت الكاميرا الحرارية أو الرجينة.',
        symbolSvg: (
          <svg viewBox="0 0 100 40" className="w-28 h-12 stroke-current fill-none stroke-2">
            <line x1="5" y1="20" x2="42" y2="20" />
            <line x1="42" y1="6" x2="42" y2="34" />
            <line x1="58" y1="6" x2="58" y2="34" />
            <line x1="58" y1="20" x2="95" y2="20" />
          </svg>
        ),
      };
    }

    // 2. مقاومات (R... / PR...)
    if (type === 'resistor' || upper.startsWith('R') || upper.startsWith('PR')) {
      return {
        categoryTitle: 'مقاومة سطحية SMD (Resistor)',
        package: 'SMD Thick Film (0201 / 0402 / 0603 / Current Sense)',
        role: 'مقاومات رفع لنواقل الاتصال (I2C Pull-Up 2.2KΩ)، أو مجزئ جهد (Feedback Divider) لتحديد قيمة فولت الخرج، أو مقاومة شنت (PR 0.01Ω) لقياس سحب الأمبير.',
        diodeTest: 'تُفحص بوضع قياس المقاومة (Ohm Ω). مقاومات الرفع تعطي 2.2KΩ، ومقاومات الشنت تعطي 0.01Ω - 0.1Ω تقريباً (توصيل تام).',
        defectSigns: 'ارتفاع قيمتها الأومية أو احتراقها يسبب توقف الشحن، غياب خرج آيسي الباور، أو شلل تام في ناقل الـ I2C.',
        symbolSvg: (
          <svg viewBox="0 0 100 40" className="w-28 h-12 stroke-current fill-none stroke-2">
            <line x1="5" y1="20" x2="30" y2="20" />
            <path d="M 30 20 L 35 10 L 45 30 L 55 10 L 65 30 L 70 20" />
            <line x1="70" y1="20" x2="95" y2="20" />
          </svg>
        ),
      };
    }

    // 3. موسفيتات (PQ... / Q...)
    if (type === 'mosfet' || upper.startsWith('PQ') || (upper.startsWith('Q') && !upper.startsWith('Q_'))) {
      return {
        categoryTitle: 'موسفيت قدرة وتبديل (Power Mosfet N-Channel / P-Channel)',
        package: 'DFN-8 / PowerPAK / SO-8 / SOT-23',
        role: 'مفتاح إلكتروني لتحويل مسار الـ 19V/VIN الرئيسي، أو تقطيع الفولت داخل دوائر البك (High-Side و Low-Side).',
        diodeTest: 'فحص ممانعة الدايود الداخلي بين الـ Source والمسبار الأسود على الـ Drain: القراءة الطبيعية (0.400V - 0.550V). أي صفارة بين D و S تعني احتراق الموسفيت.',
        defectSigns: 'انهيار الموسفيت يسبب شورت صريح في مدخل الشاحن (DC-IN)، أو غياب خرج الـ 3.3V/5V، أو تفويت 19V للمعالج.',
        symbolSvg: (
          <svg viewBox="0 0 100 50" className="w-28 h-14 stroke-current fill-none stroke-2">
            <line x1="10" y1="25" x2="35" y2="25" />
            <line x1="35" y1="10" x2="35" y2="40" />
            <line x1="45" y1="12" x2="45" y2="20" />
            <line x1="45" y1="22" x2="45" y2="28" />
            <line x1="45" y1="30" x2="45" y2="38" />
            <line x1="45" y1="16" x2="70" y2="16" />
            <line x1="45" y1="34" x2="70" y2="34" />
          </svg>
        ),
      };
    }

    // 4. ملفات وكويلات (PL... / L... / FL...)
    if (type === 'coil' || upper.startsWith('PL') || upper.startsWith('L') || upper.startsWith('FL')) {
      const isFuse = upper.startsWith('FL');
      return {
        categoryTitle: isFuse ? 'ملف فيوزي فلتر (Ferrite Bead Filter)' : 'ملف باور محث (Power Choke / Coil)',
        package: 'SMD Power Inductor (Molded Choke / 0402 Ferrite)',
        role: isFuse
          ? 'فلترة التداخل الكهرومغناطيسي وحماية خطوط الشاشة والإضاءة والصوت.'
          : 'تخزين وتفريغ الطاقة الكهرومغناطيسية لتوليد جهود البك (Buck Converters 3.3V, 5V, VCORE).',
        diodeTest: 'يجب أن يعطي توصيل تام (صفارة شورت 0.000V) بين طرفيه. الفحص يقاس بين طرف الملف والأرضي لمعرفة ممانعة الخط.',
        defectSigns: isFuse
          ? 'انقطاع الملف (يعطي OL) يسبب فاصل إضاءة أو انقطاع الصوت أو عطل الشحن.'
          : 'تفحم الملف أو تخلخل لحامه يسبب ريستارت الجهاز عند التحميل.',
        symbolSvg: (
          <svg viewBox="0 0 100 40" className="w-28 h-12 stroke-current fill-none stroke-2">
            <line x1="5" y1="25" x2="25" y2="25" />
            <path d="M 25 25 A 8 8 0 0 1 41 25 A 8 8 0 0 1 57 25 A 8 8 0 0 1 73 25" />
            <line x1="73" y1="25" x2="95" y2="25" />
          </svg>
        ),
      };
    }

    // 5. مسارات التغذية (PP_... / +3V... / VCORE)
    if (type === 'trace' || upper.startsWith('PP_') || upper.startsWith('+') || upper.includes('VCORE') || upper.includes('VIN')) {
      return {
        categoryTitle: 'مسار تغذية رئيسي (Power Distribution Rail)',
        package: 'Copper PCB Track / Plane',
        role: 'توزيع تيار التغذية على الآيسيهات والدوائر الفرعية من البطارية أو الشاحن أو الـ PMIC.',
        diodeTest: 'قس الممانعة بوضع الدايود (الأحمر على الأرضي والأسود على أي مكثف متصل بالمسار): القراءة الطبيعية تتراوح بين 0.300V إلى 0.600V (عدا خطوط المعالج 0.015V - 0.050V).',
        defectSigns: 'الشورت على هذا المسار يسبب سحب أمبير عالي قبل زر الباور أو غياب تام لأي إقلاع.',
        symbolSvg: (
          <svg viewBox="0 0 100 40" className="w-28 h-12 stroke-current fill-none stroke-2">
            <line x1="5" y1="20" x2="95" y2="20" className="stroke-[3]" />
            <circle cx="50" cy="20" r="4" className="fill-current" />
          </svg>
        ),
      };
    }

    // 6. كريستالات توقيت (Y... / X...)
    if (type === 'crystal' || upper.startsWith('Y') || upper.startsWith('X')) {
      return {
        categoryTitle: 'كريستالة تردد وتوقيت (Crystal Oscillator)',
        package: 'SMD Metal Can / 4-Pin Crystal (32.768kHz / 24MHz / 38.4MHz)',
        role: 'توليد نبضات الساعة المرجعية للمعالج ومتحكم الـ EC ودوائر التوقيت الـ RTC لبدء تشغيل سيكونس الباور.',
        diodeTest: 'فحص وجود جهد تشغيلي ضعيف (0.4V - 0.9V) على أحد أطرافها، وفحص التردد بواسطة الأوسيلوسكوب.',
        defectSigns: 'تلف الكريستالة يسبب موت تام للجهاز مع سحب أمبير ضعيف ومجمد (0.02A - 0.04A).',
        symbolSvg: (
          <svg viewBox="0 0 100 40" className="w-28 h-12 stroke-current fill-none stroke-2">
            <line x1="10" y1="20" x2="35" y2="20" />
            <line x1="35" y1="8" x2="35" y2="32" />
            <rect x="42" y="10" width="16" height="20" />
            <line x1="65" y1="8" x2="65" y2="32" />
            <line x1="65" y1="20" x2="90" y2="20" />
          </svg>
        ),
      };
    }

    // 7. دوائر متكاملة وآيسيهات (PU... / U... / Part Numbers)
    return {
      categoryTitle: 'دائرة متكاملة / آيسي رئيسي (Integrated Circuit / IC Controller)',
      package: 'BGA / QFN / WLCSP Ball Grid Array',
      role: 'إدارة وتوزيع الطاقة (PMIC)، التحكم بالشحن (Charger IC)، فك تشفير الصوت، أو معالجة الإشارات.',
      diodeTest: 'فحص ممانعات ملفات الخرج والـ LDO حول الآيسي، والتأكد من وصول خط الدخل (VIN/VPH_PWR) وإشارة الـ Enable.',
      defectSigns: 'سخونة مفرطة، شورت على مكثفات التغذية المحيطة به، أو غياب إشارة الـ Power Good.',
      symbolSvg: (
        <svg viewBox="0 0 100 50" className="w-28 h-14 stroke-current fill-none stroke-2">
          <rect x="25" y="8" width="50" height="34" rx="3" />
          <line x1="10" y1="16" x2="25" y2="16" />
          <line x1="10" y1="26" x2="25" y2="26" />
          <line x1="10" y1="36" x2="25" y2="36" />
          <line x1="75" y1="16" x2="90" y2="16" />
          <line x1="75" y1="26" x2="90" y2="26" />
          <line x1="75" y1="36" x2="90" y2="36" />
        </svg>
      ),
    };
  };

  const details = getDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-dahab-500/10 via-amber-500/10 to-orange-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-dahab-500/20 text-dahab-600 dark:text-dahab-400 flex items-center justify-center font-mono font-black text-sm border border-dahab-500/30">
              {name.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-black text-base md:text-lg text-gray-900 dark:text-gray-100">
                  {name}
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {details.categoryTitle.split('(')[0].trim()}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {details.categoryTitle}
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
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-right" dir="rtl">
          {/* الرمز الهندسي والشكل التوضيحي */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold block">الرمز الهندسي بالمخطط (Schematic Symbol):</span>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                نوع التغليف: <span className="font-mono text-dahab-600 dark:text-dahab-400">{details.package}</span>
              </span>
            </div>
            <div className="text-dahab-600 dark:text-dahab-400 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
              {details.symbolSvg}
            </div>
          </div>

          {/* الدور والوظيفة بالدائرة */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-500" />
              <span>الدور والوظيفة في البوردة:</span>
            </h4>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed p-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30">
              {details.role}
            </p>
          </div>

          {/* طريقة الفحص والقياس بالملتيميتر */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>طريقة القياس والفحص بالملتيميتر (Diode Mode):</span>
            </h4>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
              {details.diodeTest}
            </p>
          </div>

          {/* مظاهر العطل والتلف */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>مظاهر العطل وأعراض التلف الشائعة:</span>
            </h4>
            <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40">
              {details.defectSigns}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 bg-gray-50/50 dark:bg-gray-900/30">
          <a
            href={`https://www.google.com/search?q=schematic+pinout+datasheet+${encodeURIComponent(name)}`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>بحث في المخططات والداتاشيت</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-slate-950 font-bold text-xs transition shadow-md shadow-dahab-500/20"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
