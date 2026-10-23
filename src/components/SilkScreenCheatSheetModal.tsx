'use client';

import React, { useState } from 'react';
import { X, Cpu, Search, Sparkles, BookOpen, Layers } from 'lucide-react';

interface SilkScreenCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ComponentSymbol {
  prefix: string;
  nameAr: string;
  nameEn: string;
  role: string;
  measurement: string;
  typicalDefect: string;
  category: 'power' | 'passive' | 'semiconductor' | 'connectors';
}

const SILK_SCREEN_SYMBOLS: ComponentSymbol[] = [
  {
    prefix: 'PU',
    nameAr: 'آيسي باور (Power IC)',
    nameEn: 'Power Management Unit / Controller',
    role: 'تنظيم وتوليد جهود الباور الأساسية (3.3V, 5V, VCORE, شحن البطارية BQ/ISL).',
    measurement: 'فحص ممانعة جهود الخرج والـ LDO حوله، والتأكد من إشارة الـ EN والـ VIN.',
    typicalDefect: 'سخونة مفرطة، شورت صريح، أو غياب خرج الفولتات.',
    category: 'power',
  },
  {
    prefix: 'PQ',
    nameAr: 'موسفيت باور (Power Mosfet)',
    nameEn: 'Power Mosfet Switch / Driver',
    role: 'مفتاح إلكتروني لتحويل خط الـ 19V/VIN أو تقطيع الفولت داخل دوائر البك (High-Side & Low-Side).',
    measurement: 'فحص الممانعة بين الـ Drain والـ Source (يجب ألا يعطي صفارة أو شورت 0Ω).',
    typicalDefect: 'احتراق وانهيار داخلي، تفويت 19V للمعالج أو قفل مسار الدخل.',
    category: 'power',
  },
  {
    prefix: 'PL',
    nameAr: 'ملف باور (Power Inductor / Choke)',
    nameEn: 'Power Inductor Coil',
    role: 'تخزين وتنعيم الطاقة في دوائر البك ومسارات الـ 3.3V و 5V و VCORE و VRAM.',
    measurement: 'صفارة شورت مع أطرافه طبيعية جداً (مقاومته شبه صفرية)، الفحص يقاس بين طرف الملف والأرضي.',
    typicalDefect: 'انكسار في قلب الفريت، تفحم، أو فك لحام من إحدى الأرجل.',
    category: 'power',
  },
  {
    prefix: 'PC',
    nameAr: 'مكثف باور (Power Capacitor)',
    nameEn: 'Power Filter Capacitor',
    role: 'تصفية وتثبيت الفولت، منع التموجات (Ripple)، وتغذية المعالج بالتيار اللحظي.',
    measurement: 'قياس الممانعة بين طرفيه؛ يجب ألا يعطي صفارة للطرفين إلا إذا كان على مسار معالج منخفض.',
    typicalDefect: 'شورت صريح للأرضي، تفحم، أو تسريب تيار يمنع استقرار الفولت.',
    category: 'power',
  },
  {
    prefix: 'PR',
    nameAr: 'مقاومة باور / شنت (Power Current Sense Resistor)',
    nameEn: 'Power / Current Sense Resistor',
    role: 'حساب وقياس كمية سحب الأمبير لآيسي الشحن، أو مقاومات فيوزية لحماية المسار.',
    measurement: 'قيمتها منخفضة جداً (0.01Ω - 0.05Ω)، يجب أن تعطي توصيل تام (0Ω تقريباً).',
    typicalDefect: 'احتراق وارتفاع قيمتها الأومية يمنع شحن البطارية أو يسبب فصل اللابتوب.',
    category: 'power',
  },
  {
    prefix: 'PD',
    nameAr: 'دايود باور (Power Diode)',
    nameEn: 'Schottky / TVS Power Diode',
    role: 'حماية الدائرة من عكس القطبية، أو دايود سريع (Schottky) في دوائر رفع الجهد (Boost).',
    measurement: 'يعطي ممانعة في اتجاه واحد فقط (0.150V - 0.400V)، والاتجاه العكسي يعطي OL.',
    typicalDefect: 'شورت في الاتجاهين يسحب المسار للأرضي ويمنع الإقلاع.',
    category: 'power',
  },
  {
    prefix: 'FL',
    nameAr: 'ملف فيوزي / فلتر (Ferrite Bead Filter)',
    nameEn: 'EMI Filter / Fuse Inductor',
    role: 'فلترة التداخل الكهرومغناطيسي وحماية خطوط الإضاءة والصوت ومسارات الشحن في الموبايل واللابتوب.',
    measurement: 'يجب أن يعطي صفارة توصيل كامل (0.000V) بين طرفيه كأنه سلك.',
    typicalDefect: 'انقطاع تام (يعطي OL) مما يسبب فاصل إضاءة أو انقطاع صوت أو توقف الشحن.',
    category: 'passive',
  },
  {
    prefix: 'U',
    nameAr: 'آيسي / دائرة متكاملة (Integrated Circuit)',
    nameEn: 'Integrated Circuit / Controller',
    role: 'معالج، آيسي صوت، آيسي شبكة، متحكم KBC/EC (IT8586, KB9022)، أو شريحة بيوس SPI.',
    measurement: 'فحص ممانعات خطوط التغذية VCC والـ Reset وإشارات الاتصال I2C/SPI.',
    typicalDefect: 'تلف داخلي، تلف برمجي (في البيوس والـ EC)، أو سخونة موضعية.',
    category: 'semiconductor',
  },
  {
    prefix: 'Q',
    nameAr: 'ترانزستور / سويتش (Transistor / Small Mosfet)',
    nameEn: 'Signal Transistor / Inverter Switch',
    role: 'عكس الإشارات الرقمية، تشغيل الإضاءة الخلفية، أو تمرير إشارات الـ Power Good.',
    measurement: 'فحص البوابات وأطراف التوصيل دون وجود قصر للأرضي.',
    typicalDefect: 'تلف يمنع وصول إشارة التشغيل للآيسي الرئيسي.',
    category: 'semiconductor',
  },
  {
    prefix: 'D',
    nameAr: 'دايود إشارة أو دايود حماية (Diode / ESD)',
    nameEn: 'Signal Diode / Zener / ESD Clamp',
    role: 'تفريغ الكهرباء الساكنة من منافذ الـ USB والشواحن والشاشات لحماية المعالج.',
    measurement: 'انحياز أمامي يعطي قراءة دايود، وانحياز عكسي يعطي OL.',
    typicalDefect: 'شورت للأرضي يعطل منفذ الـ USB أو يمنع التعرف على الأجهزة.',
    category: 'semiconductor',
  },
  {
    prefix: 'R',
    nameAr: 'مقاومة عادية (Resistor)',
    nameEn: 'Standard Resistor',
    role: 'مقاومات رفع لنواقل الـ I2C (Pull-Up 2.2K) أو مجزء جهد (Voltage Divider) لمسارات الفيدباك.',
    measurement: 'قياس قيمتها بالأوم ومقارنتها بالمكتوب عليها أو المخطط.',
    typicalDefect: 'ارتفاع قيمتها الأومية أو تفحمها مما يفقد الفولت المرجعي.',
    category: 'passive',
  },
  {
    prefix: 'C',
    nameAr: 'مكثف إشارة / تصفية (Capacitor)',
    nameEn: 'SMD Ceramic Capacitor',
    role: 'تصفية الضوضاء وفصل التيار المستمر في مسارات الصوت والداتا والترددات.',
    measurement: 'لا يجب أن يعطي صفارة للأرضي.',
    typicalDefect: 'تسريب جزئي يسبب استنزاف البطارية بدون توقف الجهاز تماماً.',
    category: 'passive',
  },
  {
    prefix: 'L',
    nameAr: 'ملف محث (Inductor)',
    nameEn: 'Small Inductor / Choke',
    role: 'تخزين الطاقة أو فلترة الترددات في دوائر الصوت والـ RF.',
    measurement: 'توصيل تام بين طرفيه (صفارة مستمرة).',
    typicalDefect: 'انقطاع يمنع وصول الإشارة.',
    category: 'passive',
  },
  {
    prefix: 'J / CN',
    nameAr: 'كونيكتور / سوكت (Connector / Socket)',
    nameEn: 'Jack / Connector',
    role: 'سوكت الشحن، كونيكتور الشاشة (FPC)، سوكت الرامات، أو منفذ الـ HDMI.',
    measurement: 'فحص ممانعات الأرجل بوضع الدايود وتأكد من عدم ثني الأطراف.',
    typicalDefect: 'كسر في البنات، كربنة وأكسدة بسبب السوائل، أو شورت بين مسار الفولت والأرضي.',
    category: 'connectors',
  },
  {
    prefix: 'TP',
    nameAr: 'نقطة قياس (Test Point)',
    nameEn: 'Test Point / Pad',
    role: 'نقطة مكشوفة مخصصة لملامسة مسبار الملتيميتر أو الأوسيلوسكوب لقياس الإشارات.',
    measurement: 'قياس الفولت الحي أو الممانعة أو شكل الموجة أثناء التشغيل.',
    typicalDefect: 'تآكل بسبب المياه أو قطع المسار الواصل إليها.',
    category: 'connectors',
  },
  {
    prefix: 'Y / X',
    nameAr: 'كريستالة تردد وتوقيت (Crystal Oscillator)',
    nameEn: 'Crystal Resonator (32.768kHz, 24MHz, 38.4MHz)',
    role: 'توليد نبضات الساعة (Clock) لتشغيل المعالج ودوائر الـ RTC والتوقيت.',
    measurement: 'قياس التردد بواسطة الأوسيلوسكوب أو فحص فولت التغذية (0.4V - 0.9V على طرفيها).',
    typicalDefect: 'توقف التردد يسبب موت تام للجهاز (سحب أمبير ضعيف وثابت 0.02A - 0.04A).',
    category: 'semiconductor',
  },
];

export default function SilkScreenCheatSheetModal({
  isOpen,
  onClose,
}: SilkScreenCheatSheetModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filtered = SILK_SCREEN_SYMBOLS.filter((item) => {
    const matchesSearch =
      item.prefix.toLowerCase().includes(search.toLowerCase()) ||
      item.nameAr.includes(search) ||
      item.role.includes(search) ||
      item.nameEn.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-orange-500/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-gray-100">
                دليل رموز السلك سكرين على البوردة (PCB Silk-Screen)
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                مرجع الحروف المطبوعة على مازربورد اللابتوب والكمبيوتر والموبايل ودور كل مكون
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

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برمز (PU, PL, PQ) أو الاسم..."
              className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'power', label: '⚡ دوائر الباور' },
              { id: 'semiconductor', label: '🔬 أشباه الموصلات' },
              { id: 'passive', label: '📐 مكونات سالبة' },
              { id: 'connectors', label: '🔌 منافذ وكونيكتورز' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-800/60">
          {filtered.map((item, idx) => (
            <div key={idx} className="pt-3 first:pt-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 font-mono font-black text-amber-700 dark:text-amber-400 text-xs">
                    {item.prefix}
                  </span>
                  <span className="font-bold text-xs md:text-sm text-gray-900 dark:text-gray-100">
                    {item.nameAr}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
                    ({item.nameEn})
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong>الوظيفة:</strong> {item.role}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                    📏 طريقة القياس الصحيحة:
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">{item.measurement}</span>
                </div>
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
                    ⚠️ مظهر العطل الشائع:
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">{item.typicalDefect}</span>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-xs">
              لم يتم العثور على رمز مطابق للبحث. جرب البحث برمز مثل: PU, PQ, PL
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            💡 معتمد وفق معايير جمعية مصممي البوردات الإلكترونية (IPC-7351)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
          >
            إغلاق الدليل
          </button>
        </div>
      </div>
    </div>
  );
}
