export type BoardSide = 'TOP' | 'BOTTOM';

export interface BoardPin {
  id: string;
  partId: string;
  pinNumber: string;
  netId: string;
  x: number;
  y: number;
  radius: number;
  shape?: 'circle' | 'rect';
  diodeValue?: string;
  isPin1?: boolean;
}

export interface BoardPart {
  id: string;
  name: string;
  packageType: 'BGA' | 'QFN' | '0402' | '0201' | 'COIL' | 'CONNECTOR' | 'TEST_POINT' | 'SOT';
  side: BoardSide;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  role: string;
  commonFault: string;
  pins: BoardPin[];
}

export interface BoardNet {
  id: string;
  name: string;
  voltage: string;
  diodeMode: string;
  color: string;
  description: string;
  isGround?: boolean;
  isPower?: boolean;
  safeInjectionVoltage?: string;
}

export interface BoardData {
  id: string;
  title: string;
  deviceModel: string;
  width: number;
  height: number;
  layersCount: number;
  nets: Record<string, BoardNet>;
  parts: BoardPart[];
  outlinePoints?: { x: number; y: number }[];
}

// دوال مساعدة لتوليد بنات وشبكات المكونات بدقة وسرعة
function createBgaPins(partId: string, rows: number, cols: number, pitch: number, netMapper: (r: number, c: number) => { netId: string; diode: string }): BoardPin[] {
  const pins: BoardPin[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const mapping = netMapper(r, c);
      pins.push({
        id: `${partId}_pin_${r}_${c}`,
        partId,
        pinNumber: `${String.fromCharCode(65 + (r % 26))}${c + 1}`,
        netId: mapping.netId,
        x: (c - (cols - 1) / 2) * pitch,
        y: (r - (rows - 1) / 2) * pitch,
        radius: 0.65,
        diodeValue: mapping.diode,
        isPin1: r === 0 && c === 0,
      });
    }
  }
  return pins;
}

function createQfnPins(partId: string, pinsPerSide: number, size: number, netMapper: (side: number, index: number) => { netId: string; diode: string }): BoardPin[] {
  const pins: BoardPin[] = [];
  const spacing = size / (pinsPerSide + 1);
  const half = size / 2;

  // 4 Sides: Top, Right, Bottom, Left
  let pinCounter = 1;
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < pinsPerSide; i++) {
      let x = 0;
      let y = 0;
      const offset = (i + 1) * spacing - half;

      if (side === 0) { // Top
        x = offset;
        y = -half;
      } else if (side === 1) { // Right
        x = half;
        y = offset;
      } else if (side === 2) { // Bottom
        x = -offset;
        y = half;
      } else { // Left
        x = -half;
        y = -offset;
      }

      const mapping = netMapper(side, i);
      pins.push({
        id: `${partId}_pin_${pinCounter}`,
        partId,
        pinNumber: `${pinCounter}`,
        netId: mapping.netId,
        x,
        y,
        radius: 0.6,
        diodeValue: mapping.diode,
        isPin1: pinCounter === 1,
      });
      pinCounter++;
    }
  }

  // Central Ground Pad
  pins.push({
    id: `${partId}_pad_gnd`,
    partId,
    pinNumber: 'PAD',
    netId: 'net_gnd',
    x: 0,
    y: 0,
    radius: 1.8,
    diodeValue: '0.000V',
  });

  return pins;
}

// ==========================================
// 1. هواتف آيفون (Apple iPhone Presets)
// ==========================================

export function buildIphone15ProMaxBoard(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND (أرضي عام)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', description: 'الشاسيه الأرضي للبوردة', isGround: true },
    net_vdd_main: { id: 'net_vdd_main', name: 'PP_VDD_MAIN (4.0V)', voltage: '3.7V - 4.2V', diodeMode: '0.395V', color: '#f59e0b', description: 'شريان التغذية الأساسي بعد آيسي الشحن', isPower: true, safeInjectionVoltage: '3.8V' },
    net_vbus: { id: 'net_vbus', name: 'PP_VBUS_USB-C (5V)', voltage: '5.0V', diodeMode: '0.580V', color: '#10b981', description: 'دخل الشاحن من كونكتور USB-C', isPower: true },
    net_a17_core: { id: 'net_a17_core', name: 'PP_A17_CPU_CORE (0.82V)', voltage: '0.82V', diodeMode: '0.022V', color: '#38bdf8', description: 'تغذية أنوية معالج A17 Pro', isPower: true, safeInjectionVoltage: '0.8V' },
    net_1v8_always: { id: 'net_1v8_always', name: 'PP1V8_ALWAYS_AOP', voltage: '1.80V', diodeMode: '0.360V', color: '#a855f7', description: 'فولت الإقلاع والتحكم الدائم', isPower: true },
  };

  const parts: BoardPart[] = [
    {
      id: 'U1000_A17',
      name: 'A17 Pro SoC (U1000)',
      packageType: 'BGA',
      side: 'TOP',
      x: 115,
      y: 105,
      width: 27,
      height: 27,
      rotation: 0,
      role: 'المعالج المركزي ومحرك الذكاء الاصطناعي الجديد',
      commonFault: 'فصل في كورات الـ BGA بسبب السقوط أو احتراق داخلي نادر',
      pins: createBgaPins('U1000_A17', 9, 9, 2.3, (r, c) => {
        if (r >= 2 && r <= 6 && c >= 2 && c <= 6) return { netId: 'net_a17_core', diode: '0.022V' };
        if (r === 0 || c === 0) return { netId: 'net_1v8_always', diode: '0.360V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'U3100_PMIC',
      name: 'A17 Power PMIC (U3100)',
      packageType: 'BGA',
      side: 'TOP',
      x: 75,
      y: 105,
      width: 20,
      height: 20,
      rotation: 0,
      role: 'إدارة وتوزيع كافة فولتيات المعالج والذاكرة',
      commonFault: 'سحب تيار عالي قبل التشغيل وتصل حرارته لأكثر من 60 درجة',
      pins: createBgaPins('U3100_PMIC', 7, 7, 2.2, (r, c) => {
        if (r < 2) return { netId: 'net_vdd_main', diode: '0.395V' };
        if (r >= 4) return { netId: 'net_a17_core', diode: '0.022V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
  ];

  return {
    id: 'iphone_15_pro_max',
    title: 'iPhone 15 Pro Max (A17 Pro Logic Board)',
    deviceModel: 'Apple iPhone 15 Pro Max (A3108 / A2848)',
    width: 190,
    height: 220,
    layersCount: 10,
    nets,
    parts,
    outlinePoints: [{ x: 10, y: 40 }, { x: 175, y: 40 }, { x: 175, y: 195 }, { x: 45, y: 195 }, { x: 45, y: 180 }, { x: 10, y: 180 }],
  };
}

export function buildIphone14ProMaxBoard(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND (أرضي عام)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', description: 'الشاسيه الأرضي للبوردة', isGround: true },
    net_vdd_main: { id: 'net_vdd_main', name: 'PP_VDD_MAIN (4.0V)', voltage: '3.7V - 4.2V', diodeMode: '0.395V', color: '#f59e0b', description: 'شريان التغذية الأساسي بعد آيسي الشحن', isPower: true, safeInjectionVoltage: '3.8V' },
    net_vbus: { id: 'net_vbus', name: 'PP_VBUS_LIGHTNING (5V)', voltage: '5.0V', diodeMode: '0.580V', color: '#10b981', description: 'دخل الشاحن من كونكتور الفلكس', isPower: true },
    net_a16_core: { id: 'net_a16_core', name: 'PP_A16_CPU_CORE (0.82V)', voltage: '0.82V', diodeMode: '0.022V', color: '#38bdf8', description: 'تغذية أنوية معالج A16 Bionic', isPower: true, safeInjectionVoltage: '0.8V' },
    net_1v8_always: { id: 'net_1v8_always', name: 'PP1V8_ALWAYS_AOP', voltage: '1.80V', diodeMode: '0.360V', color: '#a855f7', description: 'فولت الإقلاع والتحكم الدائم', isPower: true },
  };

  const parts: BoardPart[] = [
    {
      id: 'U1000_A16',
      name: 'A16 Bionic SoC (U1000)',
      packageType: 'BGA',
      side: 'TOP',
      x: 115,
      y: 105,
      width: 27,
      height: 27,
      rotation: 0,
      role: 'المعالج المركزي ومحرك الذكاء الاصطناعي',
      commonFault: 'فصل في كورات الـ BGA بسبب السقوط أو احتراق داخلي',
      pins: createBgaPins('U1000_A16', 9, 9, 2.3, (r, c) => {
        if (r >= 2 && r <= 6 && c >= 2 && c <= 6) return { netId: 'net_a16_core', diode: '0.022V' };
        if (r === 0 || c === 0) return { netId: 'net_1v8_always', diode: '0.360V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'U3100_PMIC',
      name: 'A16 Power PMIC (U3100)',
      packageType: 'BGA',
      side: 'TOP',
      x: 75,
      y: 105,
      width: 20,
      height: 20,
      rotation: 0,
      role: 'إدارة وتوزيع كافة فولتيات المعالج والذاكرة',
      commonFault: 'سحب تيار عالي قبل التشغيل وتصل حرارته لأكثر من 60 درجة',
      pins: createBgaPins('U3100_PMIC', 7, 7, 2.2, (r, c) => {
        if (r < 2) return { netId: 'net_vdd_main', diode: '0.395V' };
        if (r >= 4) return { netId: 'net_a16_core', diode: '0.022V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'U3300_HYDRA',
      name: 'Hydra Charging / USB-PD Controller (U3300)',
      packageType: 'BGA',
      side: 'BOTTOM',
      x: 110,
      y: 130,
      width: 14,
      height: 14,
      rotation: 0,
      role: 'التعرف على الشاحن والتحكم بجهد الشحن السريع',
      commonFault: 'الهاتف لا يشحن أو يسحب 0.00A أو يعطي رسالة الملحق غير مدعوم',
      pins: createBgaPins('U3300_HYDRA', 5, 5, 2.1, (r, c) => {
        if (r === 0) return { netId: 'net_vbus', diode: '0.580V' };
        if (r === 4) return { netId: 'net_vdd_main', diode: '0.395V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'L3100_COIL',
      name: 'BUCK VCORE Power Inductor (L3100)',
      packageType: 'COIL',
      side: 'TOP',
      x: 95,
      y: 90,
      width: 12,
      height: 8,
      rotation: 0,
      role: 'ملف تنعيم تيار المعالج الرئيسي',
      commonFault: 'كسر في الملف أو تفريغ شورت للأرضي',
      pins: [
        { id: 'l3100_1', partId: 'L3100_COIL', pinNumber: '1', netId: 'net_a16_core', x: -4, y: 0, radius: 1.2, diodeValue: '0.022V' },
        { id: 'l3100_2', partId: 'L3100_COIL', pinNumber: '2', netId: 'net_a16_core', x: 4, y: 0, radius: 1.2, diodeValue: '0.022V' },
      ],
    },
  ];

  return {
    id: 'iphone_14_pro_max',
    title: 'iPhone 14 Pro / 14 Pro Max (A16 Bionic Logic Board)',
    deviceModel: 'Apple iPhone 14 Pro Max (A2894 / A2651)',
    width: 190,
    height: 220,
    layersCount: 10,
    nets,
    parts,
    outlinePoints: [{ x: 10, y: 40 }, { x: 175, y: 40 }, { x: 175, y: 195 }, { x: 45, y: 195 }, { x: 45, y: 180 }, { x: 10, y: 180 }],
  };
}

// iPhone 15 Pro Max (بناء إضافي)
export function buildIphone15ProBoard(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND (أرضي عام)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', description: 'الشاسيه الأرضي للبوردة', isGround: true },
    net_vdd_main: { id: 'net_vdd_main', name: 'PP_VDD_MAIN (4.0V)', voltage: '3.7V - 4.2V', diodeMode: '0.395V', color: '#f59e0b', description: 'شريان التغذية الأساسي بعد آيسي الشحن', isPower: true, safeInjectionVoltage: '3.8V' },
    net_a17_core: { id: 'net_a17_core', name: 'PP_A17_CPU_CORE (0.82V)', voltage: '0.82V', diodeMode: '0.022V', color: '#38bdf8', description: 'تغذية أنوية معالج A17 Pro', isPower: true, safeInjectionVoltage: '0.8V' },
    net_1v8_always: { id: 'net_1v8_always', name: 'PP1V8_ALWAYS_AOP', voltage: '1.80V', diodeMode: '0.360V', color: '#a855f7', description: 'فولت الإقلاع والتحكم الدائم', isPower: true },
  };

  const parts: BoardPart[] = [
    {
      id: 'U1000_A17',
      name: 'A17 Pro SoC (U1000)',
      packageType: 'BGA',
      side: 'TOP',
      x: 115,
      y: 105,
      width: 27,
      height: 27,
      rotation: 0,
      role: 'المعالج المركزي ومحرك الذكاء الاصطناعي الجديد',
      commonFault: 'فصل في كورات الـ BGA بسبب السقوط أو احتراق داخلي نادر',
      pins: createBgaPins('U1000_A17', 9, 9, 2.3, (r, c) => {
        if (r >= 2 && r <= 6 && c >= 2 && c <= 6) return { netId: 'net_a17_core', diode: '0.022V' };
        if (r === 0 || c === 0) return { netId: 'net_1v8_always', diode: '0.360V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'U3100_PMIC',
      name: 'A17 Power PMIC (U3100)',
      packageType: 'BGA',
      side: 'TOP',
      x: 75,
      y: 105,
      width: 20,
      height: 20,
      rotation: 0,
      role: 'إدارة وتوزيع كافة فولتيات المعالج والذاكرة',
      commonFault: 'سحب تيار عالي قبل التشغيل وتصل حرارته لأكثر من 60 درجة',
      pins: createBgaPins('U3100_PMIC', 7, 7, 2.2, (r, c) => {
        if (r < 2) return { netId: 'net_vdd_main', diode: '0.395V' };
        if (r >= 4) return { netId: 'net_a17_core', diode: '0.022V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
  ];

  return {
    id: 'iphone_15_pro',
    title: 'iPhone 15 Pro (A17 Pro Logic Board)',
    deviceModel: 'Apple iPhone 15 Pro (A3102 / A2784)',
    width: 190,
    height: 220,
    layersCount: 10,
    nets,
    parts,
    outlinePoints: [{ x: 10, y: 40 }, { x: 175, y: 40 }, { x: 175, y: 195 }, { x: 45, y: 195 }, { x: 45, y: 180 }, { x: 10, y: 180 }],
  };
}

export function buildIphone13ProBoard(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND (أرضي)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', description: 'الشاسيه الأرضي العام', isGround: true },
    net_vdd_main: { id: 'net_vdd_main', name: 'PP_VDD_MAIN (4.0V)', voltage: '3.8V - 4.2V', diodeMode: '0.410V', color: '#f59e0b', description: 'الخط الرئيسي لتشغيل البوردة', isPower: true, safeInjectionVoltage: '3.8V' },
    net_a15_core: { id: 'net_a15_core', name: 'PP_A15_CPU_CORE (0.80V)', voltage: '0.80V', diodeMode: '0.026V', color: '#38bdf8', description: 'تغذية معالج A15 Bionic', isPower: true, safeInjectionVoltage: '0.8V' },
    net_1v8_s2: { id: 'net_1v8_s2', name: 'PP1V8_S2', voltage: '1.80V', diodeMode: '0.370V', color: '#a855f7', description: 'تغذية دوائر الإشارة والحساسات', isPower: true },
  };

  const parts: BoardPart[] = [
    {
      id: 'U1000_A15',
      name: 'A15 Bionic SoC (U1000)',
      packageType: 'BGA',
      side: 'TOP',
      x: 110,
      y: 110,
      width: 26,
      height: 26,
      rotation: 0,
      role: 'معالج آبل A15 سداسي النواة',
      commonFault: 'شورت على خطوط التغذية أو إعادة تشغيل متكرر (Panic)',
      pins: createBgaPins('U1000_A15', 8, 8, 2.4, (r, c) => {
        if (r >= 2 && r <= 5 && c >= 2 && c <= 5) return { netId: 'net_a15_core', diode: '0.026V' };
        if (r === 0 || c === 0) return { netId: 'net_1v8_s2', diode: '0.370V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'U2800_PMIC',
      name: 'Main PMIC Dialog D2800 (U2800)',
      packageType: 'BGA',
      side: 'TOP',
      x: 70,
      y: 110,
      width: 18,
      height: 18,
      rotation: 0,
      role: 'متحكم الباور وتوليد الجهود المنخفضة',
      commonFault: 'انعدام خرج 1.8V أو تفريغ شحن البطارية سريعاً',
      pins: createBgaPins('U2800_PMIC', 6, 6, 2.3, (r) => {
        if (r < 2) return { netId: 'net_vdd_main', diode: '0.410V' };
        if (r >= 4) return { netId: 'net_a15_core', diode: '0.026V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
  ];

  return {
    id: 'iphone_13_pro',
    title: 'iPhone 13 Pro / 13 (A15 Bionic Board)',
    deviceModel: 'Apple iPhone 13 Pro (A2638 / A2483)',
    width: 185,
    height: 210,
    layersCount: 10,
    nets,
    parts,
    outlinePoints: [{ x: 10, y: 35 }, { x: 170, y: 35 }, { x: 170, y: 190 }, { x: 40, y: 190 }, { x: 40, y: 175 }, { x: 10, y: 175 }],
  };
}

export function buildIphone12ProBoard(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND (أرضي)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', description: 'أرضي البوردة', isGround: true },
    net_vdd_main: { id: 'net_vdd_main', name: 'PP_VDD_MAIN', voltage: '3.8V - 4.2V', diodeMode: '0.420V', color: '#f59e0b', description: 'شريان الباور العام', isPower: true, safeInjectionVoltage: '3.8V' },
    net_a14_core: { id: 'net_a14_core', name: 'PP_A14_CPU_CORE (0.78V)', voltage: '0.78V', diodeMode: '0.030V', color: '#38bdf8', description: 'فولت معالج A14 Bionic', isPower: true, safeInjectionVoltage: '0.8V' },
    net_bb_pmu: { id: 'net_bb_pmu', name: 'PP_VDD_BB (مودم 5G)', voltage: '1.2V', diodeMode: '0.310V', color: '#10b981', description: 'تغذية بيسباند مودم كوالكوم X55', isPower: true },
  };

  const parts: BoardPart[] = [
    {
      id: 'U1000_A14',
      name: 'A14 Bionic Processor (U1000)',
      packageType: 'BGA',
      side: 'TOP',
      x: 105,
      y: 100,
      width: 25,
      height: 25,
      rotation: 0,
      role: 'معالج آيفون 12 بتقنية 5 نانومتر',
      commonFault: 'انطفاء الجهاز أو تعليق على التفاحة بسبب فصل الطبقات (Sandwich)',
      pins: createBgaPins('U1000_A14', 8, 8, 2.3, (r, c) => {
        if (r >= 2 && r <= 5 && c >= 2 && c <= 5) return { netId: 'net_a14_core', diode: '0.030V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'BB_PMU_X55',
      name: 'Qualcomm Baseband PMU PMX55 (U_BB_PMU)',
      packageType: 'BGA',
      side: 'BOTTOM',
      x: 105,
      y: 140,
      width: 15,
      height: 15,
      rotation: 0,
      role: 'باور شبكة المودم و5G',
      commonFault: 'لا توجد شبكة (Searching / No Service) واختفاء الإيمي (*#06#)',
      pins: createBgaPins('BB_PMU_X55', 5, 5, 2.2, (r) => {
        if (r < 2) return { netId: 'net_vdd_main', diode: '0.420V' };
        if (r >= 3) return { netId: 'net_bb_pmu', diode: '0.310V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
  ];

  return {
    id: 'iphone_12_pro',
    title: 'iPhone 12 / 12 Pro (A14 Bionic Double-Board)',
    deviceModel: 'Apple iPhone 12 Pro (A2407 / A2341)',
    width: 180,
    height: 200,
    layersCount: 10,
    nets,
    parts,
    outlinePoints: [{ x: 10, y: 30 }, { x: 165, y: 30 }, { x: 165, y: 185 }, { x: 35, y: 185 }, { x: 35, y: 170 }, { x: 10, y: 170 }],
  };
}

export function buildIphone11ProMaxBoard(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND (أرضي)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', description: 'أرضي الشاسيه', isGround: true },
    net_vdd_main: { id: 'net_vdd_main', name: 'PP_VDD_MAIN', voltage: '3.8V - 4.2V', diodeMode: '0.430V', color: '#f59e0b', description: 'شريان الطاقة الرئيسي للبوردة', isPower: true, safeInjectionVoltage: '3.8V' },
    net_a13_core: { id: 'net_a13_core', name: 'PP_A13_CPU_CORE (0.85V)', voltage: '0.85V', diodeMode: '0.035V', color: '#38bdf8', description: 'تغذية أنوية A13 Bionic', isPower: true, safeInjectionVoltage: '0.85V' },
  };

  const parts: BoardPart[] = [
    {
      id: 'U1000_A13',
      name: 'A13 Bionic Processor (U1000)',
      packageType: 'BGA',
      side: 'TOP',
      x: 100,
      y: 95,
      width: 25,
      height: 25,
      rotation: 0,
      role: 'معالج آيفون 11 برو ماكس',
      commonFault: 'شورت في مكثفات التنعيم المحيطة بالمعالج أو كسر في الطبقة السفلية',
      pins: createBgaPins('U1000_A13', 8, 8, 2.2, (r, c) => {
        if (r >= 2 && r <= 5 && c >= 2 && c <= 5) return { netId: 'net_a13_core', diode: '0.035V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'U2700_PMIC',
      name: 'Main PMIC Dialog D2700 (U2700)',
      packageType: 'BGA',
      side: 'TOP',
      x: 65,
      y: 95,
      width: 17,
      height: 17,
      rotation: 0,
      role: 'موزع الطاقة العام لآيفون 11',
      commonFault: 'سحب 0.08A قبل الضغط على زر الباور وسخونة بالبوردة',
      pins: createBgaPins('U2700_PMIC', 6, 6, 2.2, (r) => {
        if (r < 2) return { netId: 'net_vdd_main', diode: '0.430V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
  ];

  return {
    id: 'iphone_11_pro_max',
    title: 'iPhone 11 Pro Max (A13 Bionic Sandwich Board)',
    deviceModel: 'Apple iPhone 11 Pro Max (A2218 / A2161)',
    width: 180,
    height: 200,
    layersCount: 8,
    nets,
    parts,
    outlinePoints: [{ x: 10, y: 30 }, { x: 165, y: 30 }, { x: 165, y: 185 }, { x: 35, y: 185 }, { x: 35, y: 170 }, { x: 10, y: 170 }],
  };
}

// ==========================================
// 2. هواتف سامسونج جالاكسي (Samsung Galaxy)
// ==========================================

export function buildSamsungS24UltraBoard(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND (System Ground)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', description: 'أرضي الشاسيه', isGround: true },
    net_vsys: { id: 'net_vsys', name: 'V_SYS / VPH_PWR (3.8V)', voltage: '3.6V - 4.2V', diodeMode: '0.385V', color: '#f59e0b', description: 'شريان الطاقة الرئيسي لهواتف سامسونج وكوالكوم', isPower: true, safeInjectionVoltage: '3.8V' },
    net_vbus_typec: { id: 'net_vbus_typec', name: 'VBUS_TYPE_C (45W PD)', voltage: '5.0V / 9.0V / 15.0V', diodeMode: '0.620V', color: '#10b981', description: 'دخل الشحن فائق السرعة عبر منفذ Type-C', isPower: true },
    net_snapdragon_core: { id: 'net_snapdragon_core', name: 'VDD_CPU_GOLD / SILVER (0.75V)', voltage: '0.75V', diodeMode: '0.019V', color: '#38bdf8', description: 'تغذية معالج Snapdragon 8 Gen 3', isPower: true, safeInjectionVoltage: '0.75V' },
    net_vreg_l5a: { id: 'net_vreg_l5a', name: 'VREG_L5A_1P8 (1.8V LDO)', voltage: '1.80V', diodeMode: '0.350V', color: '#a855f7', description: 'تغذية حساس البصمة والشاشة وحساسات الكاميرا', isPower: true },
  };

  const parts: BoardPart[] = [
    {
      id: 'U100_SNAPDRAGON',
      name: 'Snapdragon 8 Gen 3 for Galaxy (SM8650)',
      packageType: 'BGA',
      side: 'TOP',
      x: 110,
      y: 105,
      width: 28,
      height: 28,
      rotation: 0,
      role: 'معالج فلاجشيب سامسونج فائق الأداء',
      commonFault: 'تلف ناتج عن ارتفاع درجات الحرارة أو شورت في مكثف تنعيم VDD_GOLD',
      pins: createBgaPins('U100_SNAPDRAGON', 9, 9, 2.4, (r, c) => {
        if (r >= 2 && r <= 6 && c >= 2 && c <= 6) return { netId: 'net_snapdragon_core', diode: '0.019V' };
        if (r === 0 || c === 0) return { netId: 'net_vreg_l5a', diode: '0.350V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'U200_PM8550',
      name: 'Qualcomm Primary PMIC (PM8550)',
      packageType: 'BGA',
      side: 'TOP',
      x: 65,
      y: 105,
      width: 22,
      height: 22,
      rotation: 0,
      role: 'آيسي الباور الرئيسي في هواتف الفلاجشيب',
      commonFault: 'الهاتف ميت تماماً ويسحب 0.00A أو نبضة 0.05A ويهبط للصفر',
      pins: createBgaPins('U200_PM8550', 7, 7, 2.3, (r) => {
        if (r < 2) return { netId: 'net_vsys', diode: '0.385V' };
        if (r >= 4) return { netId: 'net_snapdragon_core', diode: '0.019V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'U300_SMB1396',
      name: 'Fast Charging Sub-PMIC 45W (SMB1396)',
      packageType: 'BGA',
      side: 'BOTTOM',
      x: 100,
      y: 140,
      width: 16,
      height: 16,
      rotation: 0,
      role: 'متحكم الشحن السريع والشحن اللاسلكي العكسي',
      commonFault: 'الهاتف يشحن ببطء شديد أو لا يشحن بالسرعة الفائقة 45W',
      pins: createBgaPins('U300_SMB1396', 5, 5, 2.2, (r) => {
        if (r === 0) return { netId: 'net_vbus_typec', diode: '0.620V' };
        if (r === 4) return { netId: 'net_vsys', diode: '0.385V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
  ];

  return {
    id: 'samsung_s24_ultra',
    title: 'Samsung Galaxy S24 Ultra (SM-S928B Main Board)',
    deviceModel: 'Samsung Galaxy S24 Ultra (Snapdragon 8 Gen 3)',
    width: 200,
    height: 220,
    layersCount: 12,
    nets,
    parts,
    outlinePoints: [{ x: 15, y: 25 }, { x: 185, y: 25 }, { x: 185, y: 200 }, { x: 15, y: 200 }],
  };
}

export function buildSamsungA54Board(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND (أرضي)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', description: 'الشاسيه الأرضي', isGround: true },
    net_vsys: { id: 'net_vsys', name: 'V_SYS (3.8V)', voltage: '3.8V', diodeMode: '0.410V', color: '#f59e0b', description: 'الباور العمومي للبوردة', isPower: true, safeInjectionVoltage: '3.8V' },
    net_exynos_core: { id: 'net_exynos_core', name: 'VDD_CPU_EXYNOS1380 (0.80V)', voltage: '0.80V', diodeMode: '0.028V', color: '#38bdf8', description: 'تغذية معالج إكسينوس 1380', isPower: true },
    net_vbus: { id: 'net_vbus', name: 'VBUS_5V (شحن 25W)', voltage: '5.0V / 9.0V', diodeMode: '0.590V', color: '#10b981', description: 'دخل الشاحن من كونكتور الفلكس', isPower: true },
  };

  const parts: BoardPart[] = [
    {
      id: 'U100_EXYNOS',
      name: 'Samsung Exynos 1380 SoC (U100)',
      packageType: 'BGA',
      side: 'TOP',
      x: 105,
      y: 100,
      width: 24,
      height: 24,
      rotation: 0,
      role: 'معالج سامسونج للفئة المتوسطة الأكثر مبيعاً',
      commonFault: 'ريستارت متكرر وتوقف على لوجو سامسونج',
      pins: createBgaPins('U100_EXYNOS', 8, 8, 2.3, (r, c) => {
        if (r >= 2 && r <= 5 && c >= 2 && c <= 5) return { netId: 'net_exynos_core', diode: '0.028V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'U200_S2MPB02',
      name: 'Samsung Power PMIC (S2MPB02)',
      packageType: 'BGA',
      side: 'TOP',
      x: 65,
      y: 100,
      width: 18,
      height: 18,
      rotation: 0,
      role: 'آيسي باور سلسلة A من سامسونج',
      commonFault: 'شورت في مسار VSYS وسخونة شديدة في الآيسي',
      pins: createBgaPins('U200_S2MPB02', 6, 6, 2.2, (r) => {
        if (r < 2) return { netId: 'net_vsys', diode: '0.410V' };
        if (r >= 4) return { netId: 'net_exynos_core', diode: '0.028V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
  ];

  return {
    id: 'samsung_a54_5g',
    title: 'Samsung Galaxy A54 5G (SM-A546B Main Board)',
    deviceModel: 'Samsung Galaxy A54 5G (Exynos 1380)',
    width: 190,
    height: 210,
    layersCount: 8,
    nets,
    parts,
    outlinePoints: [{ x: 15, y: 25 }, { x: 175, y: 25 }, { x: 175, y: 190 }, { x: 15, y: 190 }],
  };
}

// ==========================================
// 3. هواتف شاومي وبوكو (Xiaomi & Poco Presets)
// ==========================================

export function buildPocoX3ProBoard(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND (أرضي)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', description: 'أرضي الشاسيه', isGround: true },
    net_vph_pwr: { id: 'net_vph_pwr', name: 'VPH_PWR (3.8V)', voltage: '3.7V - 4.2V', diodeMode: '0.390V', color: '#f59e0b', description: 'الخط الرئيسي لهواتف شاومي وكوالكوم', isPower: true, safeInjectionVoltage: '3.8V' },
    net_snapdragon_860: { id: 'net_snapdragon_860', name: 'VDD_CPU_CORE (0.80V)', voltage: '0.80V', diodeMode: '0.020V', color: '#38bdf8', description: 'تغذية معالج Snapdragon 860', isPower: true, safeInjectionVoltage: '0.8V' },
    net_vreg_s4a: { id: 'net_vreg_s4a', name: 'VREG_S4A_1P8 (1.8V RAM)', voltage: '1.80V', diodeMode: '0.360V', color: '#a855f7', description: 'تغذية رام LPDDR4X المتراكبة على المعالج', isPower: true },
  };

  const parts: BoardPart[] = [
    {
      id: 'U100_CPU_RAM',
      name: 'Snapdragon 860 + Micron RAM Layer (U100)',
      packageType: 'BGA',
      side: 'TOP',
      x: 105,
      y: 95,
      width: 27,
      height: 27,
      rotation: 0,
      role: 'المعالج وطبقة الرام المتراكبة (Dual Stack)',
      commonFault: 'أشهر عطل صيانة في مصر والوطن العربي: فصل الرام والمعالج والشاشة البيضاء وفقدان الصوت والكاميرات (يتطلب ريبولينج Reballing)',
      pins: createBgaPins('U100_CPU_RAM', 9, 9, 2.3, (r, c) => {
        if (r >= 2 && r <= 6 && c >= 2 && c <= 6) return { netId: 'net_snapdragon_860', diode: '0.020V' };
        if (r === 0 || c === 0) return { netId: 'net_vreg_s4a', diode: '0.360V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'U200_PM8150',
      name: 'Qualcomm Primary PMIC (PM8150)',
      packageType: 'BGA',
      side: 'TOP',
      x: 65,
      y: 95,
      width: 20,
      height: 20,
      rotation: 0,
      role: 'متحكم الباور الأساسي',
      commonFault: 'تلف كرات اللحام نتيجة سخونة تشغيل الألعاب الثقيلة',
      pins: createBgaPins('U200_PM8150', 7, 7, 2.2, (r) => {
        if (r < 2) return { netId: 'net_vph_pwr', diode: '0.390V' };
        if (r >= 4) return { netId: 'net_snapdragon_860', diode: '0.020V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'U300_PM8150B',
      name: 'Qualcomm Secondary Sub-PMIC (PM8150B)',
      packageType: 'BGA',
      side: 'BOTTOM',
      x: 105,
      y: 135,
      width: 18,
      height: 18,
      rotation: 0,
      role: 'باور الشحن السريع والشاشات السريعة',
      commonFault: 'الهاتف يشحن ببطء ويسخن جداً من الخلف',
      pins: createBgaPins('U300_PM8150B', 6, 6, 2.2, (r) => {
        if (r < 2) return { netId: 'net_vph_pwr', diode: '0.390V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
  ];

  return {
    id: 'poco_x3_pro',
    title: 'Poco X3 Pro / F5 (Snapdragon 860 CPU Reballing Board)',
    deviceModel: 'Xiaomi Poco X3 Pro (M2102J20SG / Bhima / Vayu)',
    width: 190,
    height: 210,
    layersCount: 8,
    nets,
    parts,
    outlinePoints: [{ x: 15, y: 25 }, { x: 175, y: 25 }, { x: 175, y: 190 }, { x: 15, y: 190 }],
  };
}

// ==========================================
// 4. أجهزة أبل ماك بوك (Apple MacBook Presets)
// ==========================================

export function buildMacBookAirM2Board(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND (System Ground)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', description: 'أرضي الشاسيه', isGround: true },
    net_ppbus_g3h: { id: 'net_ppbus_g3h', name: 'PPBUS_G3H (12.3V)', voltage: '12.0V - 12.6V', diodeMode: '0.440V', color: '#f59e0b', description: 'شريان ماك بوك العمومي', isPower: true, safeInjectionVoltage: '12.0V' },
    net_pp3v3_s2: { id: 'net_pp3v3_s2', name: 'PP3V3_S2_MAIN', voltage: '3.30V', diodeMode: '0.350V', color: '#10b981', description: 'تغذية دوائر الإقلاع AON ومنافذ MagSafe 3', isPower: true },
    net_m2_soc_core: { id: 'net_m2_soc_core', name: 'PPVDD_CPU_AWAKE (0.82V)', voltage: '0.82V', diodeMode: '0.015V', color: '#a855f7', description: 'تغذية معالج آبل سيليكون M2', isPower: true, safeInjectionVoltage: '0.8V' },
  };

  const parts: BoardPart[] = [
    {
      id: 'U0500_M2_SOC',
      name: 'Apple Silicon M2 SoC (U0500)',
      packageType: 'BGA',
      side: 'TOP',
      x: 105,
      y: 95,
      width: 38,
      height: 38,
      rotation: 0,
      role: 'معالج آبل سيليكون M2 المتكامل مع الذاكرة',
      commonFault: 'تلف داخلي بسبب سوائل على منافذ Type-C ودخول 20V مباشرة على مسارات المعالج',
      pins: createBgaPins('U0500_M2_SOC', 10, 10, 2.5, (r, c) => {
        if (r >= 3 && r <= 7 && c >= 3 && c <= 7) return { netId: 'net_m2_soc_core', diode: '0.015V' };
        if (r === 0 || c === 0) return { netId: 'net_pp3v3_s2', diode: '0.350V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'U7000_ISL9240',
      name: 'ISL9240 / Renesas Charger IC (U7000)',
      packageType: 'QFN',
      side: 'TOP',
      x: 155,
      y: 75,
      width: 14,
      height: 14,
      rotation: 0,
      role: 'توليد PPBUS_G3H وشحن بطارية ماك بوك',
      commonFault: 'اللابتوب يسحب 5V فقط ولا يرفع لـ 20V Type-C PD، وPPBUS_G3H يعطي 0V',
      pins: createQfnPins('U7000_ISL9240', 8, 12, (side) => {
        if (side === 0) return { netId: 'net_ppbus_g3h', diode: '0.440V' };
        if (side === 2) return { netId: 'net_pp3v3_s2', diode: '0.350V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
  ];

  return {
    id: 'macbook_air_m2',
    title: 'MacBook Air M2 (A2681 / 820-02536 Motherboard)',
    deviceModel: 'Apple MacBook Air M2 (A2681)',
    width: 210,
    height: 175,
    layersCount: 8,
    nets,
    parts,
    outlinePoints: [{ x: 15, y: 15 }, { x: 195, y: 15 }, { x: 195, y: 155 }, { x: 15, y: 155 }],
  };
}

export function buildMacBookIntelA1708Board(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND (System Ground)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', description: 'أرضي الشاسيه', isGround: true },
    net_ppbus_g3h: { id: 'net_ppbus_g3h', name: 'PPBUS_G3H (13.0V)', voltage: '13.0V', diodeMode: '0.420V', color: '#f59e0b', description: 'خط الباور الرئيسي لمعالجات إنتل', isPower: true, safeInjectionVoltage: '13.0V' },
    net_pp3v3_g3h: { id: 'net_pp3v3_g3h', name: 'PP3V3_G3H (3.3V)', voltage: '3.30V', diodeMode: '0.340V', color: '#10b981', description: 'تغذية شريحة SMC وشرائح Type-C CD3215', isPower: true },
    net_intel_vcore: { id: 'net_intel_vcore', name: 'PPVCC_S0_CPU (1.05V)', voltage: '1.05V', diodeMode: '0.038V', color: '#38bdf8', description: 'تغذية أنوية معالج إنتل Core i5/i7', isPower: true },
  };

  const parts: BoardPart[] = [
    {
      id: 'U3100_CD3215',
      name: 'TI CD3215 Type-C Controller (U3100)',
      packageType: 'BGA',
      side: 'BOTTOM',
      x: 160,
      y: 60,
      width: 14,
      height: 14,
      rotation: 0,
      role: 'متحكم منفذ الـ Type-C ورفع الفولت لـ 20V',
      commonFault: 'تلف آيسي CD3215 يتسبب في تعليق سحب الشاحن على 5V 0.03A وانطفاء اللابتوب تماماً',
      pins: createBgaPins('U3100_CD3215', 5, 5, 2.1, (r) => {
        if (r === 0) return { netId: 'net_pp3v3_g3h', diode: '0.340V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'U7000_ISL9239',
      name: 'ISL9239 Intersil Charger (U7000)',
      packageType: 'QFN',
      side: 'TOP',
      x: 140,
      y: 80,
      width: 13,
      height: 13,
      rotation: 0,
      role: 'شحن بطارية الماك بوك وتوليد PPBUS_G3H',
      commonFault: 'شورت في موسفتات الشحن وخروج 0V على PPBUS_G3H',
      pins: createQfnPins('U7000_ISL9239', 7, 11, (side) => {
        if (side === 0) return { netId: 'net_ppbus_g3h', diode: '0.420V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
  ];

  return {
    id: 'macbook_intel_a1708',
    title: 'MacBook Pro 13" Intel (A1708 / 820-00840)',
    deviceModel: 'Apple MacBook Pro A1708 (CD3215 Type-C)',
    width: 210,
    height: 175,
    layersCount: 8,
    nets,
    parts,
    outlinePoints: [{ x: 15, y: 15 }, { x: 195, y: 15 }, { x: 195, y: 155 }, { x: 15, y: 155 }],
  };
}

// ==========================================
// 5. لابتوبات ديل ولينوفو وإتش بي (PC Laptops)
// ==========================================

export function buildDellXpsBoard(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND (أرضي اللوحة)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', description: 'الشاسيه الأرضي العام', isGround: true },
    net_19v_bplus: { id: 'net_19v_bplus', name: '+19V_DC_IN / +PWR_SRC (B+)', voltage: '19.5V', diodeMode: '0.460V', color: '#f59e0b', description: 'شريان اللابتوب الأساسي من الشاحن بعد موسفتات الدخل', isPower: true, safeInjectionVoltage: '19.0V' },
    net_3v_always: { id: 'net_3v_always', name: '+3V_ALW (Always-On 3.3V)', voltage: '3.30V', diodeMode: '0.360V', color: '#10b981', description: 'تغذية آيسي الـ I/O و ITE/ENE وشريحة البايوس BIOS', isPower: true },
    net_5v_always: { id: 'net_5v_always', name: '+5V_ALW (Always-On 5V)', voltage: '5.00V', diodeMode: '0.410V', color: '#38bdf8', description: 'تغذية دوائر USB ومنظمات الصوت', isPower: true },
    net_vcore_intel: { id: 'net_vcore_intel', name: '+CPU_VCORE (0.95V)', voltage: '0.85V - 1.10V', diodeMode: '0.018V', color: '#a855f7', description: 'تغذية أنوية معالج إنتل عبر دوائر DrMOS و ISL95855', isPower: true, safeInjectionVoltage: '0.9V' },
  };

  const parts: BoardPart[] = [
    {
      id: 'PQ301_INPUT_FET',
      name: 'First Input Protection MOSFET (PQ301)',
      packageType: 'SOT',
      side: 'TOP',
      x: 35,
      y: 40,
      width: 10,
      height: 10,
      rotation: 0,
      role: 'موسفت الحماية الأول لمنفذ دخل الشاحن 19.5V',
      commonFault: 'تلف الموسفت (احتراق أو تسريب) يمنع وصول 19V للبوردة واللابتوب لا يعمل نهائياً',
      pins: [
        { id: 'pq301_d', partId: 'PQ301_INPUT_FET', pinNumber: 'Drain', netId: 'net_19v_bplus', x: 0, y: -3, radius: 1.0, diodeValue: '0.460V' },
        { id: 'pq301_s', partId: 'PQ301_INPUT_FET', pinNumber: 'Source', netId: 'net_19v_bplus', x: -2, y: 3, radius: 1.0, diodeValue: '0.460V' },
        { id: 'pq301_g', partId: 'PQ301_INPUT_FET', pinNumber: 'Gate', netId: 'net_gnd', x: 2, y: 3, radius: 0.8, diodeValue: '0.520V' },
      ],
    },
    {
      id: 'PU301_CHARGER',
      name: 'ISL95855 / BQ24780 Battery Charger IC (PU301)',
      packageType: 'QFN',
      side: 'TOP',
      x: 65,
      y: 50,
      width: 14,
      height: 14,
      rotation: 0,
      role: 'التحكم بموسفتات الدخل وشحن البطارية وتوليد إشارة ACDET',
      commonFault: 'غياب فولت البوابة ACDRV وعدم فتح الموسفتات',
      pins: createQfnPins('PU301_CHARGER', 7, 12, (side) => {
        if (side === 0) return { netId: 'net_19v_bplus', diode: '0.460V' };
        if (side === 1) return { netId: 'net_3v_always', diode: '0.360V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'PU401_3V_5V',
      name: 'TPS51285 / 3V & 5V Standby Regulator (PU401)',
      packageType: 'QFN',
      side: 'TOP',
      x: 100,
      y: 60,
      width: 15,
      height: 15,
      rotation: 0,
      role: 'توليد جهود الستاندباي 3.3V و 5V الدائمة',
      commonFault: 'شورت في مكثف تنعيم خط 3V يسبب سخونة الآيسي وعدم إقلاع اللابتوب',
      pins: createQfnPins('PU401_3V_5V', 8, 13, (side) => {
        if (side === 0) return { netId: 'net_3v_always', diode: '0.360V' };
        if (side === 1) return { netId: 'net_5v_always', diode: '0.410V' };
        if (side === 2) return { netId: 'net_19v_bplus', diode: '0.460V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'U100_INTEL_CPU',
      name: 'Intel Core i7 11th/12th Gen SoC (U100)',
      packageType: 'BGA',
      side: 'TOP',
      x: 125,
      y: 110,
      width: 36,
      height: 36,
      rotation: 0,
      role: 'المعالج المركزي ومعالج الرسوميات المدمج',
      commonFault: 'ممانعة منخفضة جداً طبيعية (0.015V - 0.025V) يخطئ البعض فيها كشورت',
      pins: createBgaPins('U100_INTEL_CPU', 10, 10, 2.5, (r, c) => {
        if (r >= 3 && r <= 7 && c >= 3 && c <= 7) return { netId: 'net_vcore_intel', diode: '0.018V' };
        if (r === 0 || c === 0) return { netId: 'net_3v_always', diode: '0.360V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
  ];

  return {
    id: 'dell_xps_latitude',
    title: 'Dell XPS 15 / Latitude 5420 (ISL95855 Motherboard)',
    deviceModel: 'Dell Latitude 5420 / XPS 15 (LA-K491P)',
    width: 220,
    height: 190,
    layersCount: 8,
    nets,
    parts,
    outlinePoints: [{ x: 15, y: 20 }, { x: 205, y: 20 }, { x: 205, y: 175 }, { x: 15, y: 175 }],
  };
}

export function buildLenovoThinkPadBoard(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND (أرضي)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', description: 'أرضي اللوحة', isGround: true },
    net_v20_main: { id: 'net_v20_main', name: '20V_DC_IN (شاحن لينوفو المربع/Type-C)', voltage: '20.0V', diodeMode: '0.470V', color: '#f59e0b', description: 'الخط الرئيسي لتغذية أجهزة لينوفو', isPower: true, safeInjectionVoltage: '19.5V' },
    net_3v_standby: { id: 'net_3v_standby', name: '+3VALW (3.3V)', voltage: '3.30V', diodeMode: '0.370V', color: '#10b981', description: 'تغذية شريحة ITE/Super I/O للإقلاع', isPower: true },
    net_vcore: { id: 'net_vcore', name: 'VCC_CORE (1.0V)', voltage: '1.00V', diodeMode: '0.022V', color: '#38bdf8', description: 'تغذية أنوية المعالج', isPower: true },
  };

  const parts: BoardPart[] = [
    {
      id: 'PU101_BQ24780',
      name: 'TI BQ24780S Charging Controller (PU101)',
      packageType: 'QFN',
      side: 'TOP',
      x: 60,
      y: 50,
      width: 14,
      height: 14,
      rotation: 0,
      role: 'آيسي الشحن الشهير في لابتوبات لينوفو ThinkPad و Legion',
      commonFault: 'تلف ناتج عن شاحن تجاري غير أصلي يسبب توقف اللابتوب عن الشحن وانطفاء اللمبة البيضاء',
      pins: createQfnPins('PU101_BQ24780', 7, 12, (side) => {
        if (side === 0) return { netId: 'net_v20_main', diode: '0.470V' };
        if (side === 1) return { netId: 'net_3v_standby', diode: '0.370V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
    {
      id: 'UE1_SUPER_IO',
      name: 'ITE IT8586E / ENE Super I/O Controller (UE1)',
      packageType: 'QFN',
      side: 'BOTTOM',
      x: 100,
      y: 120,
      width: 18,
      height: 18,
      rotation: 0,
      role: 'متحكم زر الباور، الكيبورد، شحن البطارية وإشارات الإقلاع',
      commonFault: 'فقدان إشارة EC_ON أو تلف الفيرموير الداخلي المبرمج يتطلب إعادة شحن سوفت وير I/O',
      pins: createQfnPins('UE1_SUPER_IO', 10, 16, (side) => {
        if (side === 0) return { netId: 'net_3v_standby', diode: '0.370V' };
        return { netId: 'net_gnd', diode: '0.000V' };
      }),
    },
  ];

  return {
    id: 'lenovo_thinkpad_legion',
    title: 'Lenovo ThinkPad T14 / Legion (BQ24780S Motherboard)',
    deviceModel: 'Lenovo ThinkPad T14 / Legion 5 (NM-D562)',
    width: 220,
    height: 190,
    layersCount: 8,
    nets,
    parts,
    outlinePoints: [{ x: 15, y: 20 }, { x: 205, y: 20 }, { x: 205, y: 175 }, { x: 15, y: 175 }],
  };
}

// 12. بوردة ديل 3521 الأسطورية (Compal LA-9104P)
export function buildDellInspiron3521Board(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND', voltage: '0V', diodeMode: '0.000V', color: '#64748b', description: 'أرضي البوردة المشترك', isGround: true },
    net_19v_vin: { id: 'net_19v_vin', name: '+19V_VIN (B+)', voltage: '19.5V', diodeMode: '0.485V', color: '#ef4444', description: 'مسار التغذية الرئيسي بعد موصفات الدخل PQ101/PQ102', isPower: true, safeInjectionVoltage: '19.0V @ 2.0A' },
    net_3valw: { id: 'net_3valw', name: '+3VALW', voltage: '3.3V', diodeMode: '0.380V', color: '#f59e0b', description: 'تغذية الـ Super I/O وزر الباور وشريحة البايوس', isPower: true, safeInjectionVoltage: '3.3V @ 1.5A' },
    net_5valw: { id: 'net_5valw', name: '+5VALW', voltage: '5.0V', diodeMode: '0.420V', color: '#10b981', description: 'تغذية الـ 5V لمنافذ USB ودوائر الصوت', isPower: true, safeInjectionVoltage: '5.0V @ 1.5A' },
    net_vcore: { id: 'net_vcore', name: '+VCC_CORE', voltage: '0.9V - 1.15V', diodeMode: '0.015V', color: '#8b5cf6', description: 'تغذية معالج إنتل الأساسية (VCORE)', isPower: true, safeInjectionVoltage: '0.8V @ 1.0A' },
  };

  const parts: BoardPart[] = [
    {
      id: 'PU100_CHARGER',
      name: 'BQ24725A (PU100)',
      packageType: 'QFN',
      side: 'TOP',
      x: 45,
      y: 40,
      width: 14,
      height: 14,
      rotation: 0,
      role: 'آيسي الشحن ومتحكم فتح موصفات الدخل ACDRV',
      commonFault: 'فصل مسار الـ 19V عن البوردة تماماً، سخونة مع سحب أمبير عالي، أو عدم شحن البطارية',
      pins: createBgaPins('PU100_CHARGER', 4, 5, 2.2, (r, c) => ({
        netId: (r === 0 && c === 0) ? 'net_19v_vin' : 'net_gnd',
        diode: (r === 0 && c === 0) ? '0.485V' : '0.000V',
      })),
    },
    {
      id: 'PU400_3V5V',
      name: 'RT8205L (PU400)',
      packageType: 'QFN',
      side: 'TOP',
      x: 105,
      y: 65,
      width: 16,
      height: 16,
      rotation: 0,
      role: 'آيسي الباور الرئيسي لتوليد 3.3V و 5.0V Always-ON',
      commonFault: 'سخونة شديدة في الآيسي عند تركيب الشاحن نتيجة شورت بمكثف سيراميك أو قفلة في خط الـ 3VALW',
      pins: createBgaPins('PU400_3V5V', 5, 5, 2.4, (r, c) => ({
        netId: (r === 1 && c === 1) ? 'net_3valw' : (r === 3 && c === 3) ? 'net_5valw' : 'net_gnd',
        diode: (r === 1 && c === 1) ? '0.380V' : (r === 3 && c === 3) ? '0.420V' : '0.000V',
      })),
    },
    {
      id: 'KB9012_SIO',
      name: 'KB9012QF A3 (KBC)',
      packageType: 'QFN',
      side: 'TOP',
      x: 155,
      y: 110,
      width: 22,
      height: 22,
      rotation: 0,
      role: 'متحكم الـ Super I/O المبرمج، ومسؤول تشغيل إشارة الباور',
      commonFault: 'تلف الشريحة نتيجة شورت 3.3V، أو تلف كود السوفتوير الداخلي المحروق ويتطلب إعادة برمجة بالـ RT809F',
      pins: createBgaPins('KB9012_SIO', 6, 6, 2.5, (r, c) => ({
        netId: (r === 0) ? 'net_3valw' : 'net_gnd',
        diode: (r === 0) ? '0.380V' : '0.000V',
      })),
    },
  ];

  return {
    id: 'dell_inspiron_3521',
    title: 'Dell Inspiron 15 3521 (Compal LA-9104P BQ24725)',
    deviceModel: 'Dell Inspiron 15 3521 / 5521 (LA-9104P)',
    width: 210,
    height: 180,
    layersCount: 6,
    nets,
    parts,
    outlinePoints: [{ x: 10, y: 15 }, { x: 200, y: 15 }, { x: 200, y: 165 }, { x: 10, y: 165 }],
  };
}

// 13. بوردة إتش بي بروبوك 450 (HP ProBook 450 G3/G4)
export function buildHpProBook450Board(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND', voltage: '0V', diodeMode: '0.000V', color: '#64748b', description: 'أرضي البوردة', isGround: true },
    net_hp_19v: { id: 'net_hp_19v', name: '+19.5V_ADAPT', voltage: '19.5V', diodeMode: '0.490V', color: '#ef4444', description: 'خط الدخل بعد موصفات الحماية', isPower: true, safeInjectionVoltage: '19.0V @ 2.0A' },
    net_hp_3valw: { id: 'net_hp_3valw', name: '+3V_ALW', voltage: '3.3V', diodeMode: '0.365V', color: '#f59e0b', description: 'خط التغذية المستمر', isPower: true, safeInjectionVoltage: '3.3V @ 1.5A' },
    net_hp_5valw: { id: 'net_hp_5valw', name: '+5V_ALW', voltage: '5.0V', diodeMode: '0.410V', color: '#10b981', description: 'خط الـ 5 فولت الأساسي', isPower: true, safeInjectionVoltage: '5.0V @ 1.5A' },
  };

  const parts: BoardPart[] = [
    {
      id: 'U450_CHARGER',
      name: 'BQ24725 / BQ24738',
      packageType: 'QFN',
      side: 'TOP',
      x: 50,
      y: 45,
      width: 14,
      height: 14,
      rotation: 0,
      role: 'آيسي الشحن وإدارة بطارية HP الذكية',
      commonFault: 'تلف مسار الإشارة HP Smart Pin (مسار السلك الأوسط للشاحن 19.5V) يسبب رفض الشحن',
      pins: createBgaPins('U450_CHARGER', 4, 4, 2.5, (r, c) => ({
        netId: (r === 0) ? 'net_hp_19v' : 'net_gnd',
        diode: (r === 0) ? '0.490V' : '0.000V',
      })),
    },
    {
      id: 'U450_SIO',
      name: 'ITE IT8587E / IT8987E',
      packageType: 'QFN',
      side: 'TOP',
      x: 140,
      y: 95,
      width: 20,
      height: 20,
      rotation: 0,
      role: 'متحكم الـ Super I/O المبرمج في لابتوبات HP',
      commonFault: 'تلف الآيسي يسبب موت الجهاز تماماً مع سحب 0.00A واختفاء إشارة RSMRST#',
      pins: createBgaPins('U450_SIO', 6, 6, 2.4, (r, c) => ({
        netId: (r === 0) ? 'net_hp_3valw' : 'net_gnd',
        diode: (r === 0) ? '0.365V' : '0.000V',
      })),
    },
  ];

  return {
    id: 'hp_probook_450',
    title: 'HP ProBook 450 G3 / G4 (DA0X63MB6H1)',
    deviceModel: 'HP ProBook 450 G3/G4 (Quanta X63)',
    width: 215,
    height: 185,
    layersCount: 6,
    nets,
    parts,
    outlinePoints: [{ x: 12, y: 15 }, { x: 205, y: 15 }, { x: 205, y: 170 }, { x: 12, y: 170 }],
  };
}

// 14. مازربورد كمبيوتر H81 / H61 الشهيرة (Desktop Motherboard)
export function buildDesktopH81Board(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND', voltage: '0V', diodeMode: '0.000V', color: '#64748b', description: 'أرضي الشاسيه والمازربورد', isGround: true },
    net_12v_atx: { id: 'net_12v_atx', name: '+12V_ATX (CPU EPS 8-Pin)', voltage: '12.0V', diodeMode: '0.510V', color: '#ef4444', description: 'خط الدخل الرئيسي لفازات المعالج', isPower: true, safeInjectionVoltage: '12.0V @ 2.0A' },
    net_5v_sb: { id: 'net_5v_sb', name: '+5V_STANDBY (5VSB)', voltage: '5.0V', diodeMode: '0.440V', color: '#10b981', description: 'جهد الاستعداد القادم من الباور سبلاي', isPower: true, safeInjectionVoltage: '5.0V @ 1.5A' },
    net_3v_sb: { id: 'net_3v_sb', name: '+3V_STANDBY (3VSB)', voltage: '3.3V', diodeMode: '0.370V', color: '#f59e0b', description: 'تغذية شريحة الـ Super I/O قبل الضغط على زر الباور', isPower: true, safeInjectionVoltage: '3.3V @ 1.5A' },
    net_desk_vcore: { id: 'net_desk_vcore', name: '+VCORE (LGA1150 Socket)', voltage: '0.8V - 1.25V', diodeMode: '0.004V', color: '#8b5cf6', description: 'تغذية أنوية معالج إنتل', isPower: true, safeInjectionVoltage: '0.8V @ 1.0A' },
  };

  const parts: BoardPart[] = [
    {
      id: 'PWM_ISL95836',
      name: 'ISL95836 / RT8876A (VRM PWM)',
      packageType: 'QFN',
      side: 'TOP',
      x: 75,
      y: 60,
      width: 16,
      height: 16,
      rotation: 0,
      role: 'متحكم فازات المعالج لتوليد الـ VCore والـ VTT',
      commonFault: 'تلف الآيسي أو أحد موسفتات الـ High-side يسبب قفلة تفصل الباور سبلاي فوراً (Spin & Stop Loop)',
      pins: createBgaPins('PWM_ISL95836', 5, 5, 2.4, (r, c) => ({
        netId: (r === 0) ? 'net_12v_atx' : 'net_gnd',
        diode: (r === 0) ? '0.510V' : '0.000V',
      })),
    },
    {
      id: 'SIO_IT8728F',
      name: 'ITE IT8728F / Nuvoton NCT5532D',
      packageType: 'QFN',
      side: 'TOP',
      x: 165,
      y: 120,
      width: 22,
      height: 22,
      rotation: 0,
      role: 'آيسي الـ Super I/O للمازربورد المسؤول عن مراقبة الحرارة وسرعة المراوح وإشارة PS_ON#',
      commonFault: 'المازربورد لا تستجيب لزر الباور الأمامي أو سخونة في الشريحة عند تركيب كابل 24-Pin',
      pins: createBgaPins('SIO_IT8728F', 6, 6, 2.5, (r, c) => ({
        netId: (r === 0) ? 'net_3v_sb' : 'net_gnd',
        diode: (r === 0) ? '0.370V' : '0.000V',
      })),
    },
  ];

  return {
    id: 'desktop_h81_h61',
    title: 'PC Motherboard Intel H81 / H61 (LGA1150 Socket)',
    deviceModel: 'Gigabyte / ASUS H81M-S2PV (Socket LGA1150)',
    width: 230,
    height: 200,
    layersCount: 4,
    nets,
    parts,
    outlinePoints: [{ x: 15, y: 15 }, { x: 215, y: 15 }, { x: 215, y: 185 }, { x: 15, y: 185 }],
  };
}

// 15. كارت الشاشة NVIDIA GeForce RTX 3060 12GB
export function buildRtx3060GpuBoard(): BoardData {
  const nets: Record<string, BoardNet> = {
    net_gnd: { id: 'net_gnd', name: 'GND', voltage: '0V', diodeMode: '0.000V', color: '#64748b', description: 'أرضي كارت الشاشة', isGround: true },
    net_12v_pcie: { id: 'net_12v_pcie', name: '+12V_PCIe & EXT', voltage: '12.0V', diodeMode: '0.520V', color: '#ef4444', description: 'خط الدخل الرئيسي من كابل 8-Pin ومنفذ PCIe', isPower: true, safeInjectionVoltage: '12.0V @ 2.0A' },
    net_1v8_pll: { id: 'net_1v8_pll', name: '+1.8V_PLL', voltage: '1.8V', diodeMode: '0.420V', color: '#f59e0b', description: 'تغذية دوائر التوقيت الداخلية للنواة', isPower: true, safeInjectionVoltage: '1.8V @ 1.0A' },
    net_vram: { id: 'net_vram', name: '+1.35V_VRAM (GDDR6)', voltage: '1.35V', diodeMode: '0.080V', color: '#10b981', description: 'تغذية رقاقات رامات كارت الشاشة', isPower: true, safeInjectionVoltage: '1.2V @ 1.0A' },
    net_nvvdd: { id: 'net_nvvdd', name: '+NVVDD (GPU Core)', voltage: '0.75V - 1.05V', diodeMode: '0.003V', color: '#8b5cf6', description: 'تغذية نواة كارت الشاشة GA106 (ممانعة منخفضة جداً)', isPower: true, safeInjectionVoltage: '0.8V @ 1.0A' },
  };

  const parts: BoardPart[] = [
    {
      id: 'GA106_DIE',
      name: 'NVIDIA GA106-300-A1 GPU',
      packageType: 'BGA',
      side: 'TOP',
      x: 110,
      y: 90,
      width: 32,
      height: 32,
      rotation: 0,
      role: 'نواة المعالج الرسومي الأساسية RTX 3060',
      commonFault: 'شورت صريح على خط الـ NVVDD أو تلف داخلي يسبب كود 43 في نظام التشغيل',
      pins: createBgaPins('GA106_DIE', 8, 8, 2.6, (r, c) => ({
        netId: (r < 3) ? 'net_nvvdd' : 'net_gnd',
        diode: (r < 3) ? '0.003V' : '0.000V',
      })),
    },
    {
      id: 'VRM_UP9512R',
      name: 'uP9512R (Core VRM PWM)',
      packageType: 'QFN',
      side: 'TOP',
      x: 45,
      y: 70,
      width: 14,
      height: 14,
      rotation: 0,
      role: 'متحكم فازات تغذية النواة NVVDD',
      commonFault: 'احتراق فازة DrMOS يسبب مرور 12V مباشرة إلى الأرضي وحرق فيوز الدخل',
      pins: createBgaPins('VRM_UP9512R', 4, 4, 2.4, (r, c) => ({
        netId: (r === 0) ? 'net_12v_pcie' : 'net_gnd',
        diode: (r === 0) ? '0.520V' : '0.000V',
      })),
    },
  ];

  return {
    id: 'gpu_rtx_3060',
    title: 'NVIDIA GeForce RTX 3060 12GB (GA106-300)',
    deviceModel: 'GeForce RTX 3060 12GB GDDR6 (PG190)',
    width: 240,
    height: 160,
    layersCount: 8,
    nets,
    parts,
    outlinePoints: [{ x: 10, y: 15 }, { x: 230, y: 15 }, { x: 230, y: 145 }, { x: 10, y: 145 }],
  };
}

// قائمة التصنيفات الشاملة لجميع الموديلات الجاهزة
export const BOARD_CATEGORIES = [
  {
    name: '📱 هواتف آبل آيفون (Apple iPhone)',
    boards: [
      { id: 'iphone_15_pro_max', title: 'iPhone 15 Pro Max (A17 Pro / U3100 PMIC)' },
      { id: 'iphone_15_pro', title: 'iPhone 15 Pro (A17 Pro)' },
      { id: 'iphone_15_plus', title: 'iPhone 15 Plus (A16 Bionic)' },
      { id: 'iphone_15', title: 'iPhone 15 (A16 Bionic)' },
      { id: 'iphone_14_pro_max', title: 'iPhone 14 Pro / 14 Pro Max (A16 Bionic)' },
      { id: 'iphone_14_pro', title: 'iPhone 14 Pro (A16 Bionic)' },
      { id: 'iphone_14_plus', title: 'iPhone 14 Plus (A15 Bionic)' },
      { id: 'iphone_14', title: 'iPhone 14 (A15 Bionic)' },
      { id: 'iphone_13_pro_max', title: 'iPhone 13 Pro Max (A15 Bionic)' },
      { id: 'iphone_13_pro', title: 'iPhone 13 Pro / 13 (A15 Bionic / D2800)' },
      { id: 'iphone_13_mini', title: 'iPhone 13 Mini (A15 Bionic)' },
      { id: 'iphone_12_pro_max', title: 'iPhone 12 Pro Max (A14 Bionic)' },
      { id: 'iphone_12_pro', title: 'iPhone 12 / 12 Pro (A14 Bionic / Baseband)' },
      { id: 'iphone_12_mini', title: 'iPhone 12 Mini (A14 Bionic)' },
      { id: 'iphone_11_pro_max', title: 'iPhone 11 Pro Max (A13 Bionic)' },
      { id: 'iphone_11', title: 'iPhone 11 (A13 Bionic)' },
      { id: 'iphone_xr', title: 'iPhone XR (A12 Bionic)' },
      { id: 'iphone_xs_max', title: 'iPhone XS Max (A12 Bionic)' },
    ],
  },
  {
    name: '📱 هواتف سامسونج جالاكسي (Samsung Galaxy)',
    boards: [
      { id: 'samsung_s24_ultra', title: 'Samsung Galaxy S24 Ultra (Snapdragon 8 Gen 3)' },
      { id: 'samsung_s24_plus', title: 'Samsung Galaxy S24 Plus' },
      { id: 'samsung_s24', title: 'Samsung Galaxy S24' },
      { id: 'samsung_s23_ultra', title: 'Samsung Galaxy S23 Ultra (Snapdragon 8 Gen 2)' },
      { id: 'samsung_s23', title: 'Samsung Galaxy S23' },
      { id: 'samsung_s22_ultra', title: 'Samsung Galaxy S22 Ultra (Exynos 2200)' },
      { id: 'samsung_s21_ultra', title: 'Samsung Galaxy S21 Ultra (Exynos 2100)' },
      { id: 'samsung_a54_5g', title: 'Samsung Galaxy A54 5G (Exynos 1380 / S2MPB02)' },
      { id: 'samsung_a34_5g', title: 'Samsung Galaxy A34 5G' },
      { id: 'samsung_a53_5g', title: 'Samsung Galaxy A53 5G' },
      { id: 'samsung_note20_ultra', title: 'Samsung Galaxy Note20 Ultra' },
    ],
  },
  {
    name: '📱 هواتف شاومي وبوكو (Xiaomi & Poco)',
    boards: [
      { id: 'xiaomi_14_ultra', title: 'Xiaomi 14 Ultra (Snapdragon 8 Gen 3)' },
      { id: 'xiaomi_14', title: 'Xiaomi 14 (Snapdragon 8 Gen 3)' },
      { id: 'xiaomi_13_ultra', title: 'Xiaomi 13 Ultra (Snapdragon 8 Gen 2)' },
      { id: 'xiaomi_13', title: 'Xiaomi 13' },
      { id: 'xiaomi_12_pro', title: 'Xiaomi 12 Pro (Snapdragon 8 Gen 1)' },
      { id: 'redmi_note_13_pro', title: 'Redmi Note 13 Pro' },
      { id: 'redmi_note_12_pro', title: 'Redmi Note 12 Pro' },
      { id: 'poco_x6_pro', title: 'Poco X6 Pro (Snapdragon 7s Gen 2)' },
      { id: 'poco_x5_pro', title: 'Poco X5 Pro' },
      { id: 'poco_f5', title: 'Poco F5 (PM8150 / أشهر أعطال Reballing)' },
      { id: 'poco_x3_pro', title: 'Poco X3 Pro (PM8150 / أشهر أعطال Reballing)' },
    ],
  },
  {
    name: '💻 أجهزة أبل ماك بوك (Apple MacBook)',
    boards: [
      { id: 'macbook_m3_pro', title: 'MacBook Pro M3 Pro 16" (A2780 / 820-02596)' },
      { id: 'macbook_m3_max', title: 'MacBook Pro M3 Max 16" (A2780 / 820-02596)' },
      { id: 'macbook_m3_air', title: 'MacBook Air M3 15" (A3116 / 820-02613)' },
      { id: 'macbook_m2_pro', title: 'MacBook Pro M2 Pro 14" (A2780 / 820-02596)' },
      { id: 'macbook_m2_max', title: 'MacBook Pro M2 Max 16" (A2780 / 820-02596)' },
      { id: 'macbook_m2_air', title: 'MacBook Air M2 (A2681 / 820-02536)' },
      { id: 'macbook_m1_pro', title: 'MacBook Pro M1 Pro 14" (A2338 / 820-02020)' },
      { id: 'macbook_m1_max', title: 'MacBook Pro M1 Max 16" (A2338 / 820-02020)' },
      { id: 'macbook_m1_air', title: 'MacBook Air M1 (A2337 / 820-01958)' },
      { id: 'macbook_intel_a1708', title: 'MacBook Pro 13" Intel (A1708 / CD3215)' },
      { id: 'macbook_intel_a1932', title: 'MacBook Pro 15" Intel (A1932 / 820-01628)' },
    ],
  },
  {
    name: '💻 لابتوبات ديل وإتش بي ولينوفو (Dell, HP & Lenovo)',
    boards: [
      { id: 'dell_xps_15_9530', title: 'Dell XPS 15 9530 (Alienware M18 R1 / 19V B+)' },
      { id: 'dell_xps_13_9320', title: 'Dell XPS 13 9320 (Circuit 7.0 / 19V)' },
      { id: 'dell_latitude_5420', title: 'Dell Latitude 5420 (ISL95855 / 19V B+)' },
      { id: 'dell_inspiron_3521', title: 'Dell Inspiron 3521 (Compal LA-9104P BQ24725)' },
      { id: 'dell_inspiron_5520', title: 'Dell Inspiron 15 5520 (Compal LA-9104P)' },
      { id: 'dell_g15_5520', title: 'Dell G15 5520 (Circuit 7.0 / 19V)' },
      { id: 'hp_probook_450', title: 'HP ProBook 450 G3/G4 (Quanta X63 DA0X63)' },
      { id: 'hp_probook_470', title: 'HP ProBook 470 G5 (Quanta X66)' },
      { id: 'hp_pavilion_15', title: 'HP Pavilion 15 (Compal LA-9141P)' },
      { id: 'hp_omen_15', title: 'HP Omen 15 (Circuit 7.0 / 19V)' },
      { id: 'lenovo_thinkpad_x1', title: 'Lenovo ThinkPad X1 Carbon (BQ24780S / IT8586E)' },
      { id: 'lenovo_thinkpad_t14', title: 'Lenovo ThinkPad T14 / Legion (BQ24780S / IT8586E)' },
      { id: 'lenovo_legion_5', title: 'Lenovo Legion 5 Pro (RT8876A / 19V)' },
      { id: 'lenovo_ideapad_3', title: 'Lenovo IdeaPad 3 (Compal LA-9041P)' },
    ],
  },
  {
    name: '🖥️ مازربوردات PC وكروت شاشة (Motherboards & GPUs)',
    boards: [
      { id: 'desktop_z790', title: 'Motherboard Intel Z790 (LGA1700 Socket / RT8876A)' },
      { id: 'desktop_b760', title: 'Motherboard Intel B760 (LGA1700 Socket / ISL95836)' },
      { id: 'desktop_h81_h61', title: 'Motherboard Intel H81 / H61 (LGA1150 Socket)' },
      { id: 'desktop_b450', title: 'Motherboard AMD B450 (AM4 Socket / IR35201)' },
      { id: 'gpu_rtx_4090', title: 'GeForce RTX 4090 24GB (AD102 / uP9512R)' },
      { id: 'gpu_rtx_4080', title: 'GeForce RTX 4080 16GB (AD103 / uP9512R)' },
      { id: 'gpu_rtx_4070', title: 'GeForce RTX 4070 12GB (AD104 / uP9512R)' },
      { id: 'gpu_rtx_3060', title: 'GeForce RTX 3060 12GB (GA106 / GDDR6 / uP9512R)' },
      { id: 'gpu_rtx_3070', title: 'GeForce RTX 3070 8GB (GA104 / uP9512R)' },
      { id: 'gpu_rtx_3080', title: 'GeForce RTX 3080 10GB (GA102 / uP9512R)' },
      { id: 'gpu_rx_7900xtx', title: 'AMD Radeon RX 7900 XTX (Navi 31 / IR35201)' },
      { id: 'gpu_rx_6800xt', title: 'AMD Radeon RX 6800 XT (Navi 21 / IR35201)' },
    ],
  },
];

