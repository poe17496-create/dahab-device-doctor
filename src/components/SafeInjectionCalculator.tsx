'use client';

import React, { useState } from 'react';
import { Zap, AlertTriangle, ShieldCheck, Flame, Info, CheckCircle2 } from 'lucide-react';

interface RailInfo {
  name: string;
  nominalVoltage: number;
  maxSafeVoltage: number;
  recommendedVoltage: number;
  maxSafeCurrent: number;
  dangerZone: number;
  firstSuspects: string;
  notes: string;
}

const COMMON_RAILS: RailInfo[] = [
  {
    name: 'PP_VDD_MAIN / VPH_PWR / VBUS',
    nominalVoltage: 3.8,
    maxSafeVoltage: 3.8,
    recommendedVoltage: 1.8,
    maxSafeCurrent: 3.0,
    dangerZone: 4.5,
    firstSuspects: 'مكثفات خط التغذية التوازي (Ceramic Caps)، آيسي الشحن، ومكبرات الصوت (Audio Amp)',
    notes: 'ابدأ بالحقن التدريجي عند 1.2V ثم 1.8V مع مراقبة انصهار الرجينة أو الكاميرا الحرارية.',
  },
  {
    name: 'PP_CPU_CORE / VCORE (فولت المعالج)',
    nominalVoltage: 0.9,
    maxSafeVoltage: 0.95,
    recommendedVoltage: 0.65,
    maxSafeCurrent: 1.5,
    dangerZone: 1.1,
    firstSuspects: 'مكثفات تصفية المعالج، موسفيتات درايفر البك (DrMOS / Buck Driver)، المعالج نفسه',
    notes: '⚠️ خط أحمر! لا ترفع الفولت أبداً فوق 0.8V. أي فولتية تتجاوز 1.0V تحرق طبقات المعالج فوراً!',
  },
  {
    name: 'PP_GPU / GFX (معالج الرسوميات)',
    nominalVoltage: 0.85,
    maxSafeVoltage: 0.9,
    recommendedVoltage: 0.6,
    maxSafeCurrent: 1.5,
    dangerZone: 1.05,
    firstSuspects: 'مكثفات تصفية الرسوميات، وحدات الفازات (Phase Controllers)',
    notes: 'الممانعة على هذا المسار منخفضة جداً بطبيعتها (0.010V - 0.050V) ولا تعني شورت بالضرورة.',
  },
  {
    name: 'PP1V8_ALWAYS / VREG_L6_1P8 (فولت 1.8V)',
    nominalVoltage: 1.8,
    maxSafeVoltage: 1.8,
    recommendedVoltage: 1.2,
    maxSafeCurrent: 2.0,
    dangerZone: 2.2,
    firstSuspects: 'آيسي الذاكرة NAND/UFS، آيسي الباور الرئيسي PMIC، مقاومات رفع ناقل I2C',
    notes: 'مسار حيوي جداً يغذي الذواكر ودوائر التوقيت. لا تحقن أكثر من 1.5V.',
  },
  {
    name: 'PP_DRAM / VDD_RAM (LPDDR4 / LPDDR5)',
    nominalVoltage: 1.1,
    maxSafeVoltage: 1.15,
    recommendedVoltage: 0.8,
    maxSafeCurrent: 1.5,
    dangerZone: 1.3,
    firstSuspects: 'مكثفات تصفية الرامات، آيسي إدارة رامات المعالج',
    notes: 'الرامات شديدة الحساسية للحرارة والفولت الزائد.',
  },
  {
    name: '19V DC-IN (لابتوب وماك بوك)',
    nominalVoltage: 19.5,
    maxSafeVoltage: 19.0,
    recommendedVoltage: 8.0,
    maxSafeCurrent: 2.5,
    dangerZone: 21.0,
    firstSuspects: 'موسفيتات الدخل الأولى (First & Second Input MOSFETs)، ومكثفات السيراميك الكبيرة',
    notes: 'ابدأ بحقن 5V ثم ارفعها إلى 8V ثم 12V تدريجياً لمشاهدة المكون الذي يسخن أولاً دون تفجيره.',
  },
  {
    name: '12V / 24V (كروت باور وإنفرتر وشاشات)',
    nominalVoltage: 12.0,
    maxSafeVoltage: 12.0,
    recommendedVoltage: 6.0,
    maxSafeCurrent: 3.0,
    dangerZone: 14.0,
    firstSuspects: 'مكثفات التنعيم، دايودات شوتكي، وترانزستورات الموسفيت للتقطيع (SMPS Switching)',
    notes: 'تأكد من تفريغ المكثف الكبير (400V) بمقاومة تفريغ قبل الفحص لتفادي الصعق!',
  },
];

export default function SafeInjectionCalculator() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const rail = COMMON_RAILS[selectedIdx];

  return (
    <div className="bg-workshop-card border border-workshop-border rounded-2xl p-5 shadow-2xl space-y-5 animate-fadeIn">
      {/* هيدر الحاسبة */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-workshop-border pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-dahab-400 border border-dahab-500/30 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-gray-100 flex items-center gap-2">
              <span>حاسبة حقن الفولت والحرارة الآمنة (Safe Voltage Injection Calculator)</span>
              <span className="text-[10px] bg-dahab-500/20 text-dahab-400 px-2 py-0.5 rounded-full font-bold border border-dahab-500/30">
                حماية المعالجات من الاحتراق
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              اختر المسار المراد كشف الشورت عليه لتعطيك المنظومة فوراً حدود الفولت والأمبير الآمنة لتبخير الرجينة والكاميرا الحرارية
            </p>
          </div>
        </div>
      </div>

      {/* اختيار المسار */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-300">اختر المسار الكهربائي المشتبه به:</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {COMMON_RAILS.map((r, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`p-2.5 rounded-xl border text-right transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-dahab-500/20 border-dahab-500 text-dahab-300 shadow-md'
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-850 hover:text-gray-200'
                }`}
              >
                <span className="font-mono text-xs font-bold line-clamp-1">{r.name}</span>
                <span className="text-[10px] text-gray-500 mt-1">الجهد النموذجي: {r.nominalVoltage}V</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* بطاقة القيم الهندسية للحقن */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {/* الفولت المقترح للبدء */}
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1">
          <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>فولت الحقن الآمن الأولي:</span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-300">
            {rail.recommendedVoltage}V
          </div>
          <div className="text-[10px] text-gray-400">ابدأ بهذا الجهد دائماً دون زيادة</div>
        </div>

        {/* أقصى فولت مسموح */}
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-1">
          <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>أقصى فولت مسموح:</span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-300">
            {rail.maxSafeVoltage}V
          </div>
          <div className="text-[10px] text-gray-400">لا تتجاوز هذا الرقم نهائياً</div>
        </div>

        {/* حد الأمبير على الباور سبلاي */}
        <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/40 space-y-1">
          <div className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            <span>أقصى تيار (Current Limit):</span>
          </div>
          <div className="text-2xl font-black font-mono text-sky-300">
            {rail.maxSafeCurrent}A
          </div>
          <div className="text-[10px] text-gray-400">حد ضبط الباور سبلاي</div>
        </div>

        {/* منطقة الخطر */}
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-1">
          <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>منطقة احتراق المكونات:</span>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            &gt; {rail.dangerZone}V
          </div>
          <div className="text-[10px] text-rose-300">تدمير مباشر للمعالج والرقاقات</div>
        </div>
      </div>

      {/* تفاصيل المكونات المتوقعة وتعليمات المعمل */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-xl space-y-1.5">
          <div className="text-xs font-bold text-dahab-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            <span>المكونات الأكثر احتمالية للانصهار أولاً تحت الرجينة أو الكاميرا:</span>
          </div>
          <p className="text-xs text-gray-200 leading-relaxed font-semibold">
            {rail.firstSuspects}
          </p>
        </div>

        <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-xl space-y-1.5">
          <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>توجيهات معمل الصيانة:</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            {rail.notes}
          </p>
        </div>
      </div>
    </div>
  );
}
