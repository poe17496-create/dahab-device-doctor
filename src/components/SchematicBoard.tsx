'use client';

import React, { useState } from 'react';
import {
  Zap,
  Ruler,
  Activity,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Grid3x3,
  CircuitBoard,
  Target,
  Power,
  Signal,
  BookOpen,
  X,
} from 'lucide-react';
import { TestPoint, DeviceSpecialty } from '@/lib/types';
import { useDiagnosticContext } from '@/contexts/DiagnosticContext';

interface CircuitTrace {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  name: string;
  type: 'power' | 'signal' | 'ground' | 'data';
  width: number;
}

interface CommonCircuit {
  id: string;
  category: 'laptop' | 'mobile' | 'tv' | 'auto';
  name: string;
  description: string;
  components: string[];
  testPoints: { name: string; expected: string; status: 'normal' | 'warning' | 'critical' }[];
}

interface SchematicBoardProps {
  imageBase64?: string | null;
  testPoints?: TestPoint[];
  circuitTraces?: CircuitTrace[];
  isAnalysing?: boolean;
  specialty?: DeviceSpecialty;
  deviceModel?: string;
}

const ALL_CIRCUITS: CommonCircuit[] = [
  // دوائر اللابتوب والمازربورد
  {
    id: 'lap_dell_standby',
    category: 'laptop',
    name: 'Dell / HP - 19V DC-IN & 3.3V/5V ALW',
    description: 'دائرة الباور الأساسية وتوليد جهود الستاندباي +3VALW و +5VALW',
    components: ['PU301', 'PQ301', 'PQ302', 'PL301', 'PL302'],
    testPoints: [
      { name: '19V_DCIN', expected: '19.5V', status: 'normal' },
      { name: '+3VALW', expected: '3.3V', status: 'normal' },
      { name: '+5VALW', expected: '5.0V', status: 'normal' },
    ],
  },
  {
    id: 'lap_lenovo_bq',
    category: 'laptop',
    name: 'Lenovo ThinkPad / Compal - BQ Charger',
    description: 'دائرة الشحن والتحكم في موسفيتات الدخل عبر شريحة BQ24780S',
    components: ['PU101', 'PQ101', 'PQ102', 'PR101', 'PR102'],
    testPoints: [
      { name: 'AC_IN', expected: '19V - 20V', status: 'normal' },
      { name: 'ACOK', expected: '3.3V', status: 'normal' },
      { name: 'REGN_6V', expected: '6.0V', status: 'normal' },
    ],
  },
  {
    id: 'lap_macbook_ppbus',
    category: 'laptop',
    name: 'MacBook Pro - PPBUS_G3H & CD3215',
    description: 'خط التغذية الرئيسي لأجهزة ماك بوك ومتحكمات الـ Type-C',
    components: ['U7000', 'Q7030', 'Q7040', 'U3100', 'U3200'],
    testPoints: [
      { name: 'PPBUS_G3H', expected: '12.6V - 13.1V', status: 'normal' },
      { name: 'PP3V3_G3H', expected: '3.3V', status: 'normal' },
      { name: 'PP20V_USBC', expected: '20.0V', status: 'normal' },
    ],
  },
  {
    id: 'lap_vcore_ram',
    category: 'laptop',
    name: 'CPU VCORE & DDR RAM Power Rail',
    description: 'دوائر تغذية المعالج ومتحكم DrMOS وتغذية الرامات',
    components: ['PU801', 'PQ801', 'PL801', 'PU501', 'PL501'],
    testPoints: [
      { name: '+VCC_CORE', expected: '0.85V - 1.1V', status: 'normal' },
      { name: '+1.2V_DDR4', expected: '1.2V', status: 'normal' },
      { name: '+1.05V_PCH', expected: '1.05V', status: 'normal' },
    ],
  },

  // دوائر الموبايل
  {
    id: 'mob_iphone_vdd_main',
    category: 'mobile',
    name: 'iPhone - VDD_MAIN & Boost Circuit',
    description: 'توزيع خط الباور الرئيسي ومضاعف الجهد لأجهزة آيفون',
    components: ['U2700', 'Q3200', 'C3201', 'C3202', 'L3200'],
    testPoints: [
      { name: 'PP_VDD_MAIN', expected: '3.8V - 4.2V', status: 'normal' },
      { name: 'PP_VDD_BOOST', expected: '4.0V', status: 'normal' },
      { name: 'PP_BATT_VCC', expected: '3.8V', status: 'normal' },
    ],
  },
  {
    id: 'mob_samsung_vph',
    category: 'mobile',
    name: 'Samsung Galaxy - VPH_PWR & PMI',
    description: 'دائرة الباور والشحن السريع في هواتف كوالكوم وميدياتك',
    components: ['PM8150', 'PMI632', 'SMB1390', 'L1000', 'C1001'],
    testPoints: [
      { name: 'VPH_PWR', expected: '3.8V - 4.2V', status: 'normal' },
      { name: 'VBAT', expected: '3.8V', status: 'normal' },
      { name: 'VBUS_5V', expected: '5.0V', status: 'normal' },
    ],
  },
  {
    id: 'mob_rf_baseband',
    category: 'mobile',
    name: 'Baseband & RF Power Management',
    description: 'مسارات تغذية مودم الشبكة ومكبرات التردد اللاسلكي',
    components: ['U_BB_PMU', 'U_WTR', 'L_BB01', 'C_BB02'],
    testPoints: [
      { name: 'PP_1V0_SMPS4', expected: '1.0V', status: 'normal' },
      { name: 'PP_1V8_SMPS3', expected: '1.8V', status: 'normal' },
      { name: 'VDD_RF', expected: '1.3V', status: 'normal' },
    ],
  },

  // دوائر كروت الباور والشاشات
  {
    id: 'tv_smps_pfc',
    category: 'tv',
    name: 'SMPS Power Board - PFC 390V & Standby',
    description: 'دائرة التوحيد ومصحح معامل القدرة وتوليد جهد الستاندباي 5VSB',
    components: ['Bridge_BD1', 'PFC_MOSFET', 'PC817', 'TL431'],
    testPoints: [
      { name: 'PFC_OUT', expected: '390V - 400V', status: 'normal' },
      { name: '+5VSB', expected: '5.0V', status: 'normal' },
      { name: '+12V_MAIN', expected: '12.0V', status: 'normal' },
    ],
  },
  {
    id: 'tv_led_inverter',
    category: 'tv',
    name: 'LED Backlight Driver & Inverter',
    description: 'دائرة رفع الجهد لتغذية مساطر الليد (Boost Converter)',
    components: ['Driver_IC', 'Boost_L1', 'Switch_Q1', 'D_Rectifier'],
    testPoints: [
      { name: 'VLED+', expected: '65V - 140V', status: 'normal' },
      { name: 'BL_ON', expected: '3.3V', status: 'normal' },
      { name: 'PWM_DIM', expected: '2.5V', status: 'normal' },
    ],
  },

  // دوائر كنترول وإلكترونيات السيارات
  {
    id: 'auto_ecu_can',
    category: 'auto',
    name: 'ECU 5V Regulator & CAN-Bus',
    description: 'دائرة تغذية حساسات السيارة 5V وشريحة اتصال شبكة CAN-Bus',
    components: ['TJA1040', 'TVS_Diode', 'LDO_5V', 'Choke_L'],
    testPoints: [
      { name: 'V_BATT', expected: '12.6V - 14.4V', status: 'normal' },
      { name: 'V_REF_5V', expected: '5.0V', status: 'normal' },
      { name: 'CAN_H', expected: '2.5V - 3.5V', status: 'normal' },
    ],
  },
];

export default function SchematicBoard({
  imageBase64,
  testPoints = [],
  circuitTraces = [],
  isAnalysing = false,
  specialty: propSpecialty,
  deviceModel: propDeviceModel,
}: SchematicBoardProps) {
  const context = useDiagnosticContext();
  const currentSpecialty = propSpecialty || context?.specialty || 'laptop-motherboard';
  const currentDeviceModel = propDeviceModel || context?.deviceModel || '';

  const getInitialCategory = (): 'laptop' | 'mobile' | 'tv' | 'auto' | 'all' => {
    if (currentSpecialty === 'laptop-motherboard') return 'laptop';
    if (currentSpecialty === 'mobile-repair') return 'mobile';
    if (currentSpecialty === 'tv-power-boards') return 'tv';
    if (currentSpecialty === 'automotive-ecu') return 'auto';
    return 'laptop';
  };

  const [selectedCategory, setSelectedCategory] = useState<'laptop' | 'mobile' | 'tv' | 'auto' | 'all'>(getInitialCategory);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [showTraces, setShowTraces] = useState(true);
  const [showTestPoints, setShowTestPoints] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<TestPoint | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'measure' | 'probe'>('select');

  React.useEffect(() => {
    setSelectedCategory(getInitialCategory());
  }, [currentSpecialty]);

  const filteredCircuits = ALL_CIRCUITS.filter(circuit => {
    if (selectedCategory === 'all') return true;
    return circuit.category === selectedCategory;
  });

  const getPointIcon = (point: TestPoint) => {
    return <Target className="w-3 h-3" />;
  };

  const getPointColor = () => {
    return 'bg-dahab-500 border-dahab-400 shadow-dahab-500/50';
  };

  const getTraceColor = (type: CircuitTrace['type']) => {
    switch (type) {
      case 'power':
        return 'stroke-red-500';
      case 'signal':
        return 'stroke-blue-500';
      case 'ground':
        return 'stroke-black';
      case 'data':
        return 'stroke-green-500';
      default:
        return 'stroke-gray-500';
    }
  };

  return (
    <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTool('select')}
            className={`p-2 rounded-lg transition ${
              activeTool === 'select'
                ? 'bg-dahab-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Select Tool"
          >
            <Target className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('measure')}
            className={`p-2 rounded-lg transition ${
              activeTool === 'measure'
                ? 'bg-dahab-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Measure Tool"
          >
            <Ruler className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('probe')}
            className={`p-2 rounded-lg transition ${
              activeTool === 'probe'
                ? 'bg-dahab-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Probe Tool"
          >
            <Activity className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-600 mx-2" />
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition ${
              showGrid
                ? 'bg-dahab-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Toggle Grid"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowTraces(!showTraces)}
            className={`p-2 rounded-lg transition ${
              showTraces
                ? 'bg-dahab-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Toggle Traces"
          >
            <CircuitBoard className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowTestPoints(!showTestPoints)}
            className={`p-2 rounded-lg transition ${
              showTestPoints
                ? 'bg-dahab-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Toggle Test Points"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-300 font-mono w-12 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(Math.min(200, zoom + 10))}
            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
            title="Reset Zoom"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative w-full h-[600px] overflow-auto">
        <div
          className="relative w-full h-full"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Grid Background */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
              }}
            />
          )}

          {/* Board Image */}
          {imageBase64 && (
            <img
              src={imageBase64}
              alt="Board Image"
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}

          {/* Circuit Traces */}
          {showTraces && circuitTraces.map((trace) => (
            <svg
              key={trace.id}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 10 }}
            >
              <line
                x1={`${trace.from.x}%`}
                y1={`${trace.from.y}%`}
                x2={`${trace.to.x}%`}
                y2={`${trace.to.y}%`}
                className={getTraceColor(trace.type)}
                strokeWidth={trace.width}
                fill="none"
                opacity={0.6}
              />
            </svg>
          ))}

          {/* Test Points */}
          {showTestPoints && testPoints.map((point, idx) => (
            <div
              key={idx}
              className={`absolute w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center shadow-lg transition-all hover:scale-125 ${getPointColor()}`}
              style={{
                left: `${point.coordinates.x}%`,
                top: `${point.coordinates.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 20,
              }}
              onClick={() => setSelectedPoint(point)}
              title={point.name}
            >
              {getPointIcon(point)}
            </div>
          ))}

          {/* Analysis Overlay */}
          {isAnalysing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-gray-800 p-6 rounded-xl text-center">
                <div className="w-12 h-12 border-4 border-dahab-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white font-bold">جاري تحليل المخطط...</p>
                <p className="text-gray-400 text-sm mt-2">جاري مطابقة المكونات والمسارات</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pre-AI Knowledge Panel */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-dahab-500" />
            <h3 className="text-white font-bold text-sm">
              قاعدة المعرفة الهندسية المرجعية
            </h3>
            {currentDeviceModel && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-mono">
                {currentDeviceModel}
              </span>
            )}
          </div>

          {/* فلتر الفئات السريع */}
          <div className="flex items-center gap-1 bg-gray-900/80 p-1 rounded-lg border border-gray-700 text-xs">
            <button
              onClick={() => setSelectedCategory('laptop')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                selectedCategory === 'laptop'
                  ? 'bg-dahab-500 text-white font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              💻 لابتوب
            </button>
            <button
              onClick={() => setSelectedCategory('mobile')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                selectedCategory === 'mobile'
                  ? 'bg-dahab-500 text-white font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              📱 موبايل
            </button>
            <button
              onClick={() => setSelectedCategory('tv')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                selectedCategory === 'tv'
                  ? 'bg-dahab-500 text-white font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              ⚡ باور وشاشات
            </button>
            <button
              onClick={() => setSelectedCategory('auto')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                selectedCategory === 'auto'
                  ? 'bg-dahab-500 text-white font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              🚗 سيارات
            </button>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2 py-1 rounded transition ${
                selectedCategory === 'all'
                  ? 'bg-gray-700 text-white font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              الكل
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredCircuits.map((circuit) => (
            <div
              key={circuit.id}
              className="bg-gray-700/80 hover:bg-gray-700 border border-gray-600/50 rounded-lg p-3 transition cursor-pointer flex flex-col justify-between"
              onClick={() => {
                if (circuit.testPoints.length > 0) {
                  setSelectedPoint({
                    name: circuit.testPoints[0].name,
                    expectedValue: circuit.testPoints[0].expected,
                    coordinates: { x: 50, y: 50 },
                    instruction: `فحص خط ${circuit.testPoints[0].name} لدائرة ${circuit.name}`,
                  });
                }
              }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CircuitBoard className="w-4 h-4 text-dahab-500 shrink-0" />
                  <span className="text-white font-bold text-xs leading-snug">{circuit.name}</span>
                </div>
                <p className="text-gray-400 text-[11px] mb-2 leading-relaxed">{circuit.description}</p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {circuit.components.map((comp) => (
                    <span
                      key={comp}
                      className="bg-dahab-500/15 text-dahab-400 border border-dahab-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-gray-400 border-t border-gray-600/40 pt-1.5 flex items-center justify-between font-mono">
                  <span>{circuit.testPoints[0]?.name}</span>
                  <span className="text-emerald-400">{circuit.testPoints[0]?.expected}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Point Panel */}
      {selectedPoint && (
        <div className="absolute bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-2xl w-80 z-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-bold flex items-center gap-2">
              {getPointIcon(selectedPoint)}
              {selectedPoint.name}
            </h4>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">القيمة المتوقعة:</span>
              <span className="text-white text-sm font-mono">{selectedPoint.expectedValue}</span>
            </div>
            <div className="pt-2 border-t border-gray-700">
              <p className="text-gray-400 text-xs mb-1">تعليمات القياس:</p>
              <p className="text-white text-sm">{selectedPoint.instruction}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
