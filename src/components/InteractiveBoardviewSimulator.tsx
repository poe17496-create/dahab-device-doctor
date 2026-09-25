'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  Activity,
  Layers,
  Search,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Eye,
  Crosshair,
  Share2,
} from 'lucide-react';

interface BoardNode {
  id: string;
  label: string;
  type: 'IC' | 'COIL' | 'CAP' | 'TEST_POINT' | 'CONNECTOR';
  x: number;
  y: number;
  width: number;
  height: number;
  netId: string;
  pinNumber?: string;
  role: string;
  diodeMode: string;
  normalVoltage: string;
  commonFault: string;
}

interface BoardNet {
  id: string;
  name: string;
  voltage: string;
  diodeMode: string;
  color: string;
  description: string;
  sourceComponent: string;
  consumerComponents: string[];
}

const BOARD_NETS: Record<string, BoardNet> = {
  net_vdd_main: {
    id: 'net_vdd_main',
    name: 'PP_VDD_MAIN / VPH_PWR',
    voltage: '3.7V - 4.2V',
    diodeMode: '0.380V - 0.430V',
    color: '#f59e0b', // ذهبي
    description: 'خط التغذية العمومي الأساسي المغذي لكافة معالجات وآيسيات البوردة بعد دائرة الشحن.',
    sourceComponent: 'Charging IC (PMID/VSYS)',
    consumerComponents: ['Main PMIC', 'Audio Codec', 'Baseband PMU', 'Flash Driver'],
  },
  net_cpu_core: {
    id: 'net_cpu_core',
    name: 'PP_CPU_CORE / VDD_VCORE',
    voltage: '0.75V - 0.95V',
    diodeMode: '0.025V - 0.080V (ممانعة منخفضة طبيعية)',
    color: '#38bdf8', // سماوي
    description: 'خط إمداد الطاقة الرئيسي لقلب المعالج CPU. تياره عالي جداً وجهده منخفض.',
    sourceComponent: 'Main PMIC (Buck 1 & Buck 2)',
    consumerComponents: ['SoC / CPU', 'VCORE Coils L201/L202'],
  },
  net_vbus: {
    id: 'net_vbus',
    name: 'VBUS_5V / USB_IN',
    voltage: '5.0V - 9.0V (QC/PD)',
    diodeMode: '0.520V - 0.650V',
    color: '#10b981', // أخضر زمردي
    description: 'مسار دخل فولت الشاحن القادم من منفذ الـ USB-C مباشرة إلى آيسي الشحن والحماية.',
    sourceComponent: 'USB-C Port Connector',
    consumerComponents: ['OVP Protection IC', 'Charging IC', 'TIG / Hydra'],
  },
  net_vreg_1p8: {
    id: 'net_vreg_1p8',
    name: 'PP1V8_ALWAYS / VREG_L6',
    voltage: '1.8V دائم',
    diodeMode: '0.320V - 0.390V',
    color: '#a855f7', // بنفسجي
    description: 'خط التغذية الدائم لتشغيل حساسات الأزرار، كريستالة التوقيت، وخطوط اتصالات I2C.',
    sourceComponent: 'Main PMIC LDO',
    consumerComponents: ['I2C Pull-up', 'Power Button', 'EEPROM', 'Touch IC'],
  },
};

const BOARD_NODES: BoardNode[] = [
  {
    id: 'charging_ic',
    label: 'Charging IC (U101)',
    type: 'IC',
    x: 15,
    y: 52,
    width: 16,
    height: 16,
    netId: 'net_vdd_main',
    pinNumber: 'Pin B3 (VSYS)',
    role: 'منظم الشحن وتوليد خط التغذية الرئيسي VDD_MAIN',
    diodeMode: '0.390V',
    normalVoltage: '4.0V',
    commonFault: 'شحن وهمي أو سخونة وسحب 0.20A قبل الضغط على زر الباور',
  },
  {
    id: 'pmic_ic',
    label: 'Main PMIC (U201)',
    type: 'IC',
    x: 22,
    y: 18,
    width: 20,
    height: 20,
    netId: 'net_vdd_main',
    pinNumber: 'Pin A1 (VIN)',
    role: 'آيسي الباور الرئيسي لتوزيع جهود الإقلاع والتحكم بمفتاح الباور',
    diodeMode: '0.385V',
    normalVoltage: '4.0V',
    commonFault: 'سحب 0.04A إلى 0.08A والتجمد عند الضغط على الباور',
  },
  {
    id: 'tp_vph',
    label: 'TP_VDD_MAIN (Test Point)',
    type: 'TEST_POINT',
    x: 38,
    y: 42,
    width: 6,
    height: 6,
    netId: 'net_vdd_main',
    pinNumber: 'TP12',
    role: 'نقطة اختبار حيوية لقياس ممانعة وجهد الخط الأساسي بحقن الفولت',
    diodeMode: '0.395V',
    normalVoltage: '4.0V',
    commonFault: 'ممانعة 0.000V تعني وجود مكثف شورت صريح على الخط',
  },
  {
    id: 'cap_vmain1',
    label: 'C104 (Filter Cap)',
    type: 'CAP',
    x: 20,
    y: 40,
    width: 5,
    height: 4,
    netId: 'net_vdd_main',
    pinNumber: 'Pin 1',
    role: 'مكثف تنعيم رئيسي على خط VDD_MAIN',
    diodeMode: '0.390V',
    normalVoltage: '4.0V',
    commonFault: 'أشهر مكثف يتعرض للانهيار والتسريب والشورت الحراري',
  },
  {
    id: 'cap_vmain2',
    label: 'C105 (Filter Cap)',
    type: 'CAP',
    x: 27,
    y: 40,
    width: 5,
    height: 4,
    netId: 'net_vdd_main',
    pinNumber: 'Pin 1',
    role: 'مكثف تنعيم ثانوي على مسار الباور الرئيسي',
    diodeMode: '0.390V',
    normalVoltage: '4.0V',
    commonFault: 'تفحم أو سخونة تحت الكاميرا الحرارية',
  },
  {
    id: 'cpu_soc',
    label: 'Application Processor (CPU)',
    type: 'IC',
    x: 52,
    y: 25,
    width: 26,
    height: 26,
    netId: 'net_cpu_core',
    pinNumber: 'Core BGA Balls',
    role: 'المعالج المركزي ووحدة الذكاء والرسوميات',
    diodeMode: '0.035V',
    normalVoltage: '0.85V',
    commonFault: 'ممانعة صفرية مطلقة 0.000V تعني تلف داخلي بالمعالج',
  },
  {
    id: 'coil_vcore1',
    label: 'L201 (VCORE Coil)',
    type: 'COIL',
    x: 80,
    y: 26,
    width: 9,
    height: 7,
    netId: 'net_cpu_core',
    pinNumber: 'Pin 2',
    role: 'ملف تغذية نبضية لقلب المعالج',
    diodeMode: '0.035V',
    normalVoltage: '0.85V',
    commonFault: 'انفصال اللحام أو انعدام الإشارة النبضية PWM',
  },
  {
    id: 'coil_vcore2',
    label: 'L202 (VCORE Coil)',
    type: 'COIL',
    x: 80,
    y: 36,
    width: 9,
    height: 7,
    netId: 'net_cpu_core',
    pinNumber: 'Pin 2',
    role: 'ملف المرحلة الثانية لجهد المعالج',
    diodeMode: '0.035V',
    normalVoltage: '0.85V',
    commonFault: 'شورت على أحد مكثفات الخرج',
  },
  {
    id: 'usb_port',
    label: 'USB-C / Lightning Port',
    type: 'CONNECTOR',
    x: 4,
    y: 45,
    width: 8,
    height: 16,
    netId: 'net_vbus',
    pinNumber: 'Pins A4/B4/A9/B9',
    role: 'منفذ دخول الشاحن والبيانات',
    diodeMode: '0.580V',
    normalVoltage: '5.0V',
    commonFault: 'كسر البنات أو التماس أرضي مباشر',
  },
  {
    id: 'ovp_ic',
    label: 'OVP IC (Protection)',
    type: 'IC',
    x: 14,
    y: 35,
    width: 7,
    height: 7,
    netId: 'net_vbus',
    pinNumber: 'Pin IN',
    role: 'حماية الدائرة من ارتفاع الجهد فوق 5.5V',
    diodeMode: '0.580V',
    normalVoltage: '5.0V',
    commonFault: 'احتراق الآيسي عند استخدام شاحن تجاري رديء',
  },
  {
    id: 'pwr_btn',
    label: 'Power Button TP',
    type: 'TEST_POINT',
    x: 45,
    y: 10,
    width: 6,
    height: 6,
    netId: 'net_vreg_1p8',
    pinNumber: 'TP_PWR_KEY',
    role: 'نقطة تشغيل الجهاز يدوياً بدون فلاتة الباور',
    diodeMode: '0.360V',
    normalVoltage: '1.8V',
    commonFault: 'فقدان فولت 1.8V يمنع استجابة الجهاز لزر التشغيل',
  },
  {
    id: 'i2c_resistor',
    label: 'R204 (I2C Pull-Up)',
    type: 'COIL',
    x: 35,
    y: 12,
    width: 6,
    height: 4,
    netId: 'net_vreg_1p8',
    pinNumber: 'Pin 1',
    role: 'مقاومة رفع 2.2K لمسارات بيانات I2C',
    diodeMode: '0.370V',
    normalVoltage: '1.8V',
    commonFault: 'انقطاع المقاومة يسبب ريستارت متكرر (Panic Sensor)',
  },
];

export default function InteractiveBoardviewSimulator() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('charging_ic');
  const [searchTerm, setSearchTerm] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);

  const selectedNode = BOARD_NODES.find((n) => n.id === selectedNodeId) || BOARD_NODES[0];
  const activeNet = BOARD_NETS[selectedNode.netId] || BOARD_NETS['net_vdd_main'];

  // كافة المكونات المتصلة بنفس المسار الحالي المضاء
  const connectedNodes = BOARD_NODES.filter((n) => n.netId === activeNet.id);

  const filteredNodes = BOARD_NODES.filter(
    (n) =>
      n.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activeNet.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl p-5 md:p-6 shadow-2xl space-y-6 animate-fadeIn transition-colors">
      {/* هيدر العارض */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dahab-400 to-amber-600 text-slate-950 font-black shadow-lg shadow-dahab-500/20 flex items-center justify-center">
            <Crosshair className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-black text-gray-900 dark:text-gray-100">
                محاكي البورد فيو التفاعلي وتتبع المسارات الحية
              </h2>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
                ZXW & FlexBV Net-Tracer
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              انقر على أي مسار أو مكون لإضاءة المسار بالكامل وكافة المكونات المتصلة به فوراً
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* اختيار سريع للمسار */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {Object.values(BOARD_NETS).map((net) => {
              const isActive = net.id === activeNet.id;
              return (
                <button
                  key={net.id}
                  onClick={() => {
                    const firstNode = BOARD_NODES.find((n) => n.netId === net.id);
                    if (firstNode) setSelectedNodeId(firstNode.id);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black transition border flex items-center gap-1.5 ${
                    isActive
                      ? 'shadow-md'
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: `${net.color}25`,
                          borderColor: net.color,
                          color: net.color,
                        }
                      : {}
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: net.color }}
                  />
                  <span>{net.name.split('/')[0].trim()}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-dahab-500 transition"
            title={isZoomed ? 'تصغير الشاشة' : 'تكبير الشاشة'}
          >
            {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* شريط المسار المضاء النشط (Active Net Banner) */}
      <div
        className="p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 shadow-sm"
        style={{
          backgroundColor: `${activeNet.color}15`,
          borderColor: `${activeNet.color}40`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full animate-ping"
            style={{ backgroundColor: activeNet.color }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                المسار المضاء حالياً (Active Net):
              </span>
              <span className="text-sm font-black font-mono" style={{ color: activeNet.color }}>
                {activeNet.name}
              </span>
            </div>
            <p className="text-[11px] text-gray-600 dark:text-gray-300">{activeNet.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-white/80 dark:bg-gray-900/80 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800">
            <span className="text-gray-500 text-[10px] block">الفولت النموذجي:</span>
            <strong className="text-emerald-600 dark:text-emerald-400">{activeNet.voltage}</strong>
          </div>
          <div className="bg-white/80 dark:bg-gray-900/80 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800">
            <span className="text-gray-500 text-[10px] block">الممانعة (Diode Mode):</span>
            <strong style={{ color: activeNet.color }}>{activeNet.diodeMode}</strong>
          </div>
          <div className="bg-white/80 dark:bg-gray-900/80 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800">
            <span className="text-gray-500 text-[10px] block">النقاط المتصلة:</span>
            <strong className="text-dahab-600 dark:text-dahab-400">{connectedNodes.length} مكونات</strong>
          </div>
        </div>
      </div>

      {/* شاشة العرض التفاعلية: لوحة البوردة + اللوحة الجانبية */}
      <div className={`grid grid-cols-1 ${isZoomed ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-6`}>
        {/* رسم البوردة التفاعلي بالأشعة والمكونات */}
        <div
          className={`${
            isZoomed ? 'lg:col-span-1' : 'lg:col-span-7 xl:col-span-8'
          } bg-slate-950 border-2 border-dashed border-gray-800 rounded-3xl p-4 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden select-none shadow-inner`}
        >
          {/* شبكة البوردة الهندسية */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-35" />

          {/* البوردة الإلكترونية */}
          <div
            className={`w-full ${
              isZoomed ? 'max-w-[760px] h-[520px]' : 'max-w-[580px] h-[380px]'
            } bg-gradient-to-br from-emerald-950 via-[#062419] to-slate-950 rounded-3xl border-2 border-emerald-500/40 relative shadow-2xl p-2 transition-all`}
          >
            {/* خطوط المسارات المضيئة الموصلة بين كافة مكونات المسار النشط (SVG Circuit Traces) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {connectedNodes.map((source, i) =>
                connectedNodes.slice(i + 1).map((target, j) => {
                  const x1 = `${source.x + source.width / 2}%`;
                  const y1 = `${source.y + source.height / 2}%`;
                  const x2 = `${target.x + target.width / 2}%`;
                  const y2 = `${target.y + target.height / 2}%`;

                  return (
                    <g key={`${source.id}_${target.id}`}>
                      {/* خط التوهج الخارجي */}
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={activeNet.color}
                        strokeWidth="5"
                        strokeOpacity="0.4"
                        strokeLinecap="round"
                        className="animate-pulse"
                      />
                      {/* المسار الداخلي المضيء */}
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={activeNet.color}
                        strokeWidth="2"
                        strokeDasharray="4,4"
                        strokeLinecap="round"
                      />
                    </g>
                  );
                })
              )}
            </svg>

            {/* رسم المكونات والقطع الإلكترونية */}
            {BOARD_NODES.map((node) => {
              const isSelected = selectedNode.id === node.id;
              const isConnectedToNet = node.netId === activeNet.id;

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    width: `${node.width}%`,
                    height: `${node.height}%`,
                  }}
                  className={`absolute rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center text-center p-1 border select-none ${
                    isSelected
                      ? 'ring-4 ring-dahab-400 scale-110 z-30 shadow-2xl'
                      : isConnectedToNet
                      ? 'ring-2 scale-105 z-20 shadow-lg'
                      : 'opacity-40 hover:opacity-100 hover:scale-102 z-10'
                  }`}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    width: `${node.width}%`,
                    height: `${node.height}%`,
                    borderColor: isSelected
                      ? '#f59e0b'
                      : isConnectedToNet
                      ? activeNet.color
                      : '#334155',
                    backgroundColor: isConnectedToNet
                      ? `${activeNet.color}35`
                      : '#0f172a95',
                    color: isConnectedToNet ? '#ffffff' : '#94a3b8',
                  }}
                >
                  <span className="text-[9px] font-black font-mono leading-none truncate max-w-full">
                    {node.label.split(' ')[0]}
                  </span>
                  {node.pinNumber && (
                    <span className="text-[7px] text-gray-300 font-mono">
                      {node.pinNumber.split(' ')[0]}
                    </span>
                  )}
                  {isConnectedToNet && (
                    <span
                      className="w-1.5 h-1.5 rounded-full absolute -top-1 -right-1 animate-ping"
                      style={{ backgroundColor: activeNet.color }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-gray-400 mt-2 font-mono flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-dahab-500 animate-pulse" />
            <span>انقر على أي مكون لعرض دائرته، أو اختر مساراً من القائمة العلوية لإضاءته</span>
          </div>
        </div>

        {/* لوحة المعلومات الهندسية التفاعلية للمسار والمكون */}
        <div
          className={`${
            isZoomed ? 'lg:col-span-1' : 'lg:col-span-5 xl:col-span-4'
          } space-y-4`}
        >
          {/* كارت المكون المحدد */}
          <div className="p-5 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm">
            <div className="flex items-start justify-between gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400 block mb-0.5">
                  المكون المختار (Selected Component):
                </span>
                <h3 className="text-base font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span>{selectedNode.label}</span>
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-dahab-500/15 border border-dahab-500/30 text-dahab-700 dark:text-dahab-300 text-[10px] font-black">
                {selectedNode.type}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200/50 dark:border-gray-800">
                <span className="text-gray-500">رقم الرجل / النقطة:</span>
                <span className="font-mono font-bold">{selectedNode.pinNumber || 'All Pins'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/50 dark:border-gray-800">
                <span className="text-gray-500">الممانعة (Diode Mode):</span>
                <span className="font-mono font-bold text-dahab-600 dark:text-dahab-400">
                  {selectedNode.diodeMode}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/50 dark:border-gray-800">
                <span className="text-gray-500">الفولت في وضع التشغيل:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedNode.normalVoltage}
                </span>
              </div>
              <div className="py-1">
                <span className="text-gray-500 block mb-1">الدور الوظيفي بالدائرة:</span>
                <p className="text-gray-700 dark:text-gray-300 text-[11px] leading-relaxed">
                  {selectedNode.role}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>العطل الشائع المرتبط بهذه النقطة:</span>
                </div>
                <p className="leading-relaxed">{selectedNode.commonFault}</p>
              </div>
            </div>
          </div>

          {/* قائمة المكونات المتصلة بالمسار حالياً (Connected Nodes List) */}
          <div className="p-5 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-dahab-500" />
                <span>المكونات المشتركة على نفس الخط ({connectedNodes.length}):</span>
              </h4>
              <span className="text-[10px] text-gray-400">انقر للتركيز</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {connectedNodes.map((n) => {
                const isCurrent = n.id === selectedNode.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNodeId(n.id)}
                    className={`w-full p-2.5 rounded-xl text-right text-xs transition flex items-center justify-between border ${
                      isCurrent
                        ? 'bg-dahab-500/15 border-dahab-500 text-dahab-700 dark:text-dahab-300 font-bold'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-dahab-500 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="truncate">{n.label}</span>
                    <span className="text-[10px] font-mono text-gray-400">{n.pinNumber || n.type}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
