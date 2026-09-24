'use client';

import React, { useState } from 'react';
import { Cpu, Zap, Activity, Info, Eye, CheckCircle2, Search, Layers, Maximize2, Minimize2 } from 'lucide-react';

interface ComponentPad {
  id: string;
  label: string;
  type: 'IC' | 'COIL' | 'CAP' | 'TEST_POINT' | 'CONNECTOR';
  x: number;
  y: number;
  width: number;
  height: number;
  railName: string;
  diodeMode: string;
  normalVoltage: string;
  role: string;
  commonFault: string;
  relatedComponents?: string[];
}

const BOARD_COMPONENTS: ComponentPad[] = [
  {
    id: 'cpu',
    label: 'SoC / CPU',
    type: 'IC',
    x: 42,
    y: 30,
    width: 28,
    height: 28,
    railName: 'PP_CPU_CORE / VDD_CPU',
    diodeMode: '0.025V - 0.080V',
    normalVoltage: '0.75V - 0.95V',
    role: 'المعالج المركزي ووحدة المعالجة العصبية والرسمية',
    commonFault: 'حرارة عالية جداً فور التشغيل، ممانعة 0.000V صريحة تعني تلف طبقات المعالج الداخلية',
    relatedComponents: ['PMIC', 'L201 (VCORE)', 'RAM'],
  },
  {
    id: 'pmic',
    label: 'Main PMIC',
    type: 'IC',
    x: 18,
    y: 25,
    width: 18,
    height: 18,
    railName: 'BUCK_S1..S8 / LDO1..L25',
    diodeMode: '0.350V - 0.480V',
    normalVoltage: 'متعدد (0.8V, 1.2V, 1.8V, 3.3V)',
    role: 'آيسي الباور الرئيسي لتوزيع جهود الإقلاع والتحكم في مفتاح الباور',
    commonFault: 'سحب 0.04A إلى 0.08A والتجمد عند الضغط على مفتاح الباور',
    relatedComponents: ['Charging IC', 'CPU', 'Power Button'],
  },
  {
    id: 'charging',
    label: 'Charging IC',
    type: 'IC',
    x: 18,
    y: 55,
    width: 16,
    height: 16,
    railName: 'VBUS_5V / VPH_PWR',
    diodeMode: '0.450V - 0.580V على رجل PMID',
    normalVoltage: '4.2V - 5.0V',
    role: 'تنظيم شحن البطارية وتوليد خط التغذية الرئيسي',
    commonFault: 'شحن وهمي، سخونة وسحب 0.25A قبل الضغط على زر الباور',
    relatedComponents: ['PMIC', 'Battery Connector', 'USB Port'],
  },
  {
    id: 'coil_buck1',
    label: 'L101 (Buck)',
    type: 'COIL',
    x: 39,
    y: 20,
    width: 10,
    height: 7,
    railName: 'VREG_S4_1P8',
    diodeMode: '0.380V',
    normalVoltage: '1.8V',
    role: 'ملف خفض جهد لتغذية دوائر الإشارة والتوقيت والذاكرة',
    commonFault: 'انفصال لحام الملف أو شورت في المكثف التابع له',
    relatedComponents: ['PMIC', 'Memory'],
  },
  {
    id: 'coil_cpu',
    label: 'L201 (VCORE)',
    type: 'COIL',
    x: 72,
    y: 35,
    width: 10,
    height: 8,
    railName: 'VDD_CORE',
    diodeMode: '0.035V',
    normalVoltage: '0.85V',
    role: 'تغذية قلب المعالج بالتيار العالي النبضي',
    commonFault: 'غياب الفولت عند التشغيل يعني عدم إصدار أمر الإقلاع',
    relatedComponents: ['CPU', 'PMIC'],
  },
  {
    id: 'tp_vph',
    label: 'TP_VPH',
    type: 'TEST_POINT',
    x: 20,
    y: 78,
    width: 6,
    height: 6,
    railName: 'PP_VDD_MAIN / VPH_PWR',
    diodeMode: '0.380V - 0.420V',
    normalVoltage: '3.7V - 4.2V',
    role: 'نقطة اختبار حيوية لقياس ممانعة وجهد الخط الأساسي',
    commonFault: 'إذا كانت الممانعة 0.000V فهناك شورت صريح',
    relatedComponents: ['PMIC', 'Charging IC'],
  },
  {
    id: 'battery',
    label: 'Battery Connector',
    type: 'CONNECTOR',
    x: 5,
    y: 70,
    width: 12,
    height: 12,
    railName: 'VBAT',
    diodeMode: '0.550V',
    normalVoltage: '4.2V',
    role: 'موصل البطارية الرئيسي',
    commonFault: 'تآكل الموصل أو تلف المسارات',
    relatedComponents: ['Charging IC', 'PMIC'],
  },
  {
    id: 'usb',
    label: 'USB-C Port',
    type: 'CONNECTOR',
    x: 5,
    y: 40,
    width: 10,
    height: 15,
    railName: 'VBUS / D+ / D-',
    diodeMode: '0.680V على D+/D-',
    normalVoltage: '5V',
    role: 'منفذ الشحن والبيانات',
    commonFault: 'تلف المسارات أو عدم التعرف على الأجهزة',
    relatedComponents: ['Charging IC', 'PMIC'],
  },
];

export default function InteractiveBoardviewSimulator() {
  const [selectedComp, setSelectedComp] = useState<ComponentPad>(BOARD_COMPONENTS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [showLayers, setShowLayers] = useState(false);

  const filteredComponents = BOARD_COMPONENTS.filter(comp =>
    comp.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.railName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937] rounded-2xl p-5 shadow-xl space-y-5 animate-fadeIn">
      {/* هيدر العارض */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-[#1F2937] pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>معمل البوردفيو والمسارات</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                ZXW & Borneo Simulator
              </span>
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              انقر على أي مكون لمعاينة المسار والفولت والممانعة
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-[#1F2937] hover:bg-gray-200 dark:hover:bg-[#374151] transition-colors"
            title={isZoomed ? 'تصغير' : 'تكبير'}
          >
            {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowLayers(!showLayers)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-[#1F2937] hover:bg-gray-200 dark:hover:bg-[#374151] transition-colors"
            title="إظهار الطبقات"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* شريط البحث */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="ابحث عن مكون أو مسار..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-10 py-2 rounded-xl bg-gray-100 dark:bg-[#1F2937] border border-gray-200 dark:border-[#374151] text-sm focus:outline-none focus:ring-2 focus:ring-dahab-500"
        />
      </div>

      {/* شاشة العرض التفاعلية */}
      <div className={`grid grid-cols-1 ${isZoomed ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-5`}>
        {/* رسم البوردة التفاعلي */}
        <div className={`${isZoomed ? 'lg:col-span-1' : 'lg:col-span-7'} bg-gray-950 border-2 border-dashed border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden select-none`}>
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
          
          <div className={`w-full ${isZoomed ? 'max-w-[700px] h-[450px]' : 'max-w-[480px] h-[320px]'} bg-gradient-to-br from-emerald-950/80 via-emerald-900/60 to-slate-950 rounded-2xl border-2 border-emerald-500/40 relative shadow-2xl shadow-emerald-950/50 p-2`}>
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg width="100%" height="100%">
                <line x1="25%" y1="35%" x2="50%" y2="40%" stroke="#10b981" strokeWidth="2" />
                <line x1="25%" y1="65%" x2="50%" y2="45%" stroke="#f59e0b" strokeWidth="2" />
                <line x1="55%" y1="45%" x2="75%" y2="40%" stroke="#38bdf8" strokeWidth="2" />
                <line x1="22%" y1="80%" x2="25%" y2="65%" stroke="#ef4444" strokeWidth="2" />
              </svg>
            </div>

            {filteredComponents.map((comp) => {
              const isSelected = selectedComp.id === comp.id;
              const isIC = comp.type === 'IC';
              const isCoil = comp.type === 'COIL';
              const isTP = comp.type === 'TEST_POINT';
              const isConnector = comp.type === 'CONNECTOR';

              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedComp(comp)}
                  style={{
                    left: `${comp.x}%`,
                    top: `${comp.y}%`,
                    width: `${comp.width}%`,
                    height: `${comp.height}%`,
                  }}
                  className={`absolute rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center text-center p-1 border ${
                    isSelected
                      ? 'ring-2 ring-dahab-400 scale-105 z-20 shadow-lg'
                      : 'hover:scale-102 hover:border-gray-400 z-10'
                  } ${
                    isIC
                      ? isSelected
                        ? 'bg-gray-900 border-dahab-400 text-dahab-300'
                        : 'bg-gray-900/90 border-gray-700 text-gray-200'
                      : isCoil
                      ? isSelected
                        ? 'bg-amber-950 border-amber-400 text-amber-300'
                        : 'bg-amber-950/80 border-amber-600/70 text-amber-200'
                      : isTP
                      ? isSelected
                        ? 'bg-rose-950 border-rose-400 text-rose-300 rounded-full'
                        : 'bg-rose-950/80 border-rose-600/70 text-rose-200 rounded-full'
                      : isSelected
                        ? 'bg-blue-950 border-blue-400 text-blue-300'
                        : 'bg-blue-950/80 border-blue-600/70 text-blue-200'
                  }`}
                  title={`${comp.label} - ${comp.railName}`}
                >
                  <span className="text-[10px] font-mono font-black leading-tight line-clamp-1">
                    {comp.label}
                  </span>
                  <span className="text-[8px] font-mono opacity-80 hidden sm:inline">
                    {isTP ? 'TP' : comp.type}
                  </span>
                </div>
              );
            })}

            <div className="absolute bottom-2 left-3 text-[9px] font-mono text-emerald-400/70">
              DAHAB_PCB_REV_2.4
            </div>
            <div className="absolute top-2 right-3 text-[9px] font-mono text-emerald-400/70">
              GND CHASSIS
            </div>
          </div>
        </div>

        {/* بطاقة تفاصيل المكون */}
        <div className={`${isZoomed ? 'lg:col-span-1' : 'lg:col-span-5'} bg-gray-900/90 border border-gray-800 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
              <div>
                <span className="text-[10px] text-dahab-400 font-bold uppercase tracking-wider block">
                  المكون النشط ({selectedComp.type})
                </span>
                <h3 className="text-base font-black text-gray-100 font-mono">
                  {selectedComp.label}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-gray-800 text-emerald-300 border border-gray-700">
                {selectedComp.railName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-800 space-y-1">
                <span className="text-[10px] text-gray-400 block font-bold">الممانعة بالدايود:</span>
                <span className="font-mono font-bold text-sky-400 text-xs">{selectedComp.diodeMode}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-800 space-y-1">
                <span className="text-[10px] text-gray-400 block font-bold">الفولت الطبيعي:</span>
                <span className="font-mono font-bold text-emerald-400 text-xs">{selectedComp.normalVoltage}</span>
              </div>
            </div>

            <div className="text-xs text-gray-300 bg-gray-950/60 p-3 rounded-xl border border-gray-800/80 space-y-1">
              <strong className="text-dahab-400 block text-[11px]">الوظيفة الهندسية:</strong>
              <p className="leading-relaxed text-[11px]">{selectedComp.role}</p>
            </div>

            <div className="text-xs text-rose-200 bg-rose-950/20 p-3 rounded-xl border border-rose-900/30 space-y-1">
              <strong className="text-rose-400 block text-[11px]">الأعراض عند التلف:</strong>
              <p className="leading-relaxed text-[11px]">{selectedComp.commonFault}</p>
            </div>

            {selectedComp.relatedComponents && (
              <div className="text-xs text-blue-200 bg-blue-950/20 p-3 rounded-xl border border-blue-900/30 space-y-1">
                <strong className="text-blue-400 block text-[11px]">مكونات مرتبطة:</strong>
                <div className="flex flex-wrap gap-1">
                  {selectedComp.relatedComponents.map((comp, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-blue-900/30 rounded text-[10px]">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-800 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-dahab-400" />
            <span>مطابقة القيم مع قياسات أجهزة الباور والملتيميتر</span>
          </div>
        </div>
      </div>
    </div>
  );
}
