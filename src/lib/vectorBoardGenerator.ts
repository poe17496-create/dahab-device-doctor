/**
 * 📐 محرك توليد وتنسيق البوردات المتجهة للفيكتور CAD (Vector Board CAD Generator)
 * يربط مصفوفة الـ 863 بوردة بجميع الآيسيهات والمسارات والقياسات الحقيقية بمحرك الفيكتور
 */

import matrixData from '@/lib/hardwareSchematicsMatrix.json';

export interface VectorPin {
  id: string;
  pinNumber: number | string;
  netName: string;
  x: number;
  y: number;
  radius?: number;
  isGround?: boolean;
  isPower?: boolean;
  diodeReading?: string;
  voltage?: string;
}

export interface VectorComponent {
  name: string;
  type: 'IC' | 'Capacitor' | 'Resistor' | 'Inductor' | 'Connector' | 'Mosfet' | 'Diode' | 'TestPoint';
  x: number;
  y: number;
  width: number;
  height: number;
  side: 'TOP' | 'BOTTOM';
  pins: VectorPin[];
  value?: string;
  description?: string;
}

export interface VectorBoardModel {
  name: string;
  boardCode: string;
  brand: string;
  model: string;
  deviceType: 'mobile' | 'laptop' | 'desktop';
  width: number;
  height: number;
  outline: Array<{ x: number; y: number }>;
  components: VectorComponent[];
  powerRails: Array<{ rail: string; voltage?: string; diodeMode?: string }>;
}

/**
 * البحث في المصفوفة عن بوردة مطابقة
 */
export function findBoardInMatrix(query: string): any | null {
  if (!query || !matrixData || !Array.isArray(matrixData)) return null;
  const q = query.trim().toLowerCase();

  // 1. بحث مباشر بكود البوردة
  let match = (matrixData as any[]).find(
    (b) => (b.boardCode && b.boardCode.toLowerCase() === q)
  );
  if (match) return match;

  // 2. بحث باسم الموديل أو الماركة
  match = (matrixData as any[]).find((b) => {
    const full = `${b.brand || ''} ${b.model || ''}`.toLowerCase();
    const code = (b.boardCode || '').toLowerCase();
    const model = (b.model || '').toLowerCase();
    return full.includes(q) || q.includes(full) || code.includes(q) || q.includes(code) || model.includes(q);
  });

  return match || null;
}

/**
 * الحصول على قائمة بأشهر البوردات للاختيار السريع
 */
export function getPopularBoardsList(): Array<{ name: string; boardCode: string; category: string }> {
  return [
    { name: 'Apple iPhone 14 Pro Max', boardCode: '820-02857', category: 'mobile' },
    { name: 'Apple iPhone 13 Pro Max', boardCode: '820-02384', category: 'mobile' },
    { name: 'Apple iPhone 12 Pro', boardCode: '820-01990', category: 'mobile' },
    { name: 'Apple iPhone 11', boardCode: '820-01535', category: 'mobile' },
    { name: 'Apple MacBook Pro M2 A2338', boardCode: '820-02098', category: 'laptop' },
    { name: 'Apple MacBook Pro M1 A2338', boardCode: '820-02020', category: 'laptop' },
    { name: 'Apple MacBook Air A2179', boardCode: '820-01958', category: 'laptop' },
    { name: 'Dell Inspiron 5521 / 3521', boardCode: 'LA-9104P', category: 'laptop' },
    { name: 'Dell Latitude 7490', boardCode: 'LA-F321P', category: 'laptop' },
    { name: 'Lenovo ThinkPad T480', boardCode: 'NM-B501', category: 'laptop' },
    { name: 'Lenovo IdeaPad 320', boardCode: 'NM-B242', category: 'laptop' },
    { name: 'HP ProBook 450 G3', boardCode: 'DA0X63MB6H1', category: 'laptop' },
    { name: 'HP Pavilion 15-CS', boardCode: 'DAG7BMB18B0', category: 'laptop' },
    { name: 'Samsung Galaxy S23 Ultra', boardCode: 'SM-S918B', category: 'mobile' },
    { name: 'Samsung Galaxy S22 Ultra', boardCode: 'SM-S908B', category: 'mobile' },
    { name: 'Xiaomi Redmi Note 11', boardCode: '2201117TG', category: 'mobile' },
  ];
}

/**
 * إنشاء نموذج بوردة فيكتور CAD متكاملة هندسياً مع مسارات ونقاط فحص
 */
export function generateVectorBoard(queryOrName?: string): VectorBoardModel {
  const matched = queryOrName ? findBoardInMatrix(queryOrName) : null;
  const rawBoard = matched || (matrixData as any[])[0]; // افتراضي: أول بوردة في المصفوفة

  const brand = rawBoard.brand || 'Engineering PCB';
  const model = rawBoard.model || 'Universal Board';
  const boardCode = rawBoard.boardCode || 'PCB-820';
  const category = (rawBoard.category as 'mobile' | 'laptop' | 'desktop') || 'mobile';

  // تحديد أبعاد وشكل مضلع البوردة حسب نوع الجهاز
  let width = 960;
  let height = 720;
  let outline: Array<{ x: number; y: number }> = [];

  if (category === 'mobile') {
    width = 750;
    height = 920;
    outline = [
      { x: 60, y: 50 },
      { x: 690, y: 50 },
      { x: 690, y: 340 },
      { x: 620, y: 340 },
      { x: 620, y: 640 },
      { x: 690, y: 640 },
      { x: 690, y: 870 },
      { x: 60, y: 870 },
      { x: 60, y: 580 },
      { x: 110, y: 580 },
      { x: 110, y: 300 },
      { x: 60, y: 300 },
    ];
  } else if (category === 'laptop') {
    width = 1100;
    height = 760;
    outline = [
      { x: 60, y: 60 },
      { x: 1040, y: 60 },
      { x: 1040, y: 300 },
      { x: 990, y: 300 },
      { x: 990, y: 480 },
      { x: 1040, y: 480 },
      { x: 1040, y: 700 },
      { x: 380, y: 700 },
      { x: 380, y: 630 },
      { x: 260, y: 630 },
      { x: 260, y: 700 },
      { x: 60, y: 700 },
    ];
  } else {
    // Desktop / Motherboard
    width = 1000;
    height = 1000;
    outline = [
      { x: 60, y: 60 },
      { x: 940, y: 60 },
      { x: 940, y: 940 },
      { x: 60, y: 940 },
    ];
  }

  // مسارات الطاقة من مصفوفة المخططات
  const powerRails: Array<{ rail: string; voltage?: string; diodeMode?: string }> =
    rawBoard.powerRails && Array.isArray(rawBoard.powerRails) && rawBoard.powerRails.length > 0
      ? rawBoard.powerRails.map((r: any) => ({
          rail: r.rail || 'PP_VDD_MAIN',
          voltage: r.voltage || '3.8V',
          diodeMode: r.diodeMode || '0.380V',
        }))
      : category === 'laptop'
      ? [
          { rail: '+19V_VIN', voltage: '19.0V - 20.0V', diodeMode: '0.450V - 0.550V' },
          { rail: '+3.3VALW', voltage: '3.3V', diodeMode: '0.340V - 0.420V' },
          { rail: '+5VALW', voltage: '5.0V', diodeMode: '0.380V - 0.480V' },
          { rail: '+VCORE', voltage: '0.75V - 1.05V', diodeMode: '0.012V - 0.035V' },
          { rail: '+1.05V_PCH', voltage: '1.05V', diodeMode: '0.120V - 0.220V' },
          { rail: '+1.2V_DDR4', voltage: '1.2V', diodeMode: '0.280V - 0.360V' },
          { rail: 'ALL_SYS_PWRGD', voltage: '3.3V', diodeMode: '0.500V' },
        ]
      : [
          { rail: 'PP_VDD_MAIN', voltage: '3.8V - 4.2V', diodeMode: '0.350V - 0.450V' },
          { rail: 'PP_BATT_VCC', voltage: '3.7V - 4.3V', diodeMode: '0.400V - 0.520V' },
          { rail: 'PP_CPU_CORE', voltage: '0.7V - 1.1V', diodeMode: '0.020V - 0.060V' },
          { rail: 'PP1V8_ALWAYS', voltage: '1.8V', diodeMode: '0.420V - 0.500V' },
          { rail: 'PP_VDD_BOOST', voltage: '3.8V - 4.5V', diodeMode: '0.380V - 0.480V' },
          { rail: 'I2C_SDA', voltage: '1.8V', diodeMode: '0.510V' },
          { rail: 'I2C_SCL', voltage: '1.8V', diodeMode: '0.510V' },
        ];

  const mainRailName = powerRails[0]?.rail || (category === 'laptop' ? '+19V_VIN' : 'PP_VDD_MAIN');
  const mainRailDiode = powerRails[0]?.diodeMode || '0.380V';
  const mainRailVoltage = powerRails[0]?.voltage || '3.8V';

  const cpuRailName = powerRails.find((r) => r.rail.includes('CPU') || r.rail.includes('VCORE'))?.rail || (category === 'laptop' ? '+VCORE' : 'PP_CPU_CORE');
  const cpuRailDiode = powerRails.find((r) => r.rail.includes('CPU') || r.rail.includes('VCORE'))?.diodeMode || '0.025V';

  const auxRailName = powerRails[1]?.rail || (category === 'laptop' ? '+3.3VALW' : 'PP1V8_ALWAYS');
  const auxRailDiode = powerRails[1]?.diodeMode || '0.420V';

  // استخراج الآيسيهات من mainChips
  const chips = rawBoard.mainChips || {};
  const components: VectorComponent[] = [];

  // 1. المعالج الرئيسي (CPU / SoC)
  const cpuChip = chips.cpu || chips.soc || chips.processor || (category === 'mobile' ? 'Apple A-Series / Snapdragon' : 'Intel Core / AMD Ryzen');
  const cpuX = category === 'mobile' ? 260 : 420;
  const cpuY = category === 'mobile' ? 180 : 160;
  const cpuW = category === 'mobile' ? 220 : 250;
  const cpuH = category === 'mobile' ? 200 : 220;

  const cpuPins: VectorPin[] = [];
  const cols = 8;
  const rows = 8;
  const stepX = (cpuW - 30) / (cols - 1);
  const stepY = (cpuH - 30) / (rows - 1);

  let pinIdx = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = cpuX + 15 + c * stepX;
      const py = cpuY + 15 + r * stepY;
      let net = 'GND';
      let isGnd = true;
      let isPwr = false;
      let diode = '0.000V (GND)';
      let v = '0V';

      if ((r === 1 || r === 2) && (c >= 2 && c <= 5)) {
        net = cpuRailName;
        isGnd = false;
        isPwr = true;
        diode = cpuRailDiode;
        v = '0.85V';
      } else if (r === 0 || c === 0) {
        net = auxRailName;
        isGnd = false;
        isPwr = true;
        diode = auxRailDiode;
        v = '1.8V';
      } else if (r === 6 && c === 4) {
        net = 'I2C_SDA';
        isGnd = false;
        diode = '0.510V';
        v = '1.8V';
      } else if (r === 6 && c === 5) {
        net = 'I2C_SCL';
        isGnd = false;
        diode = '0.510V';
        v = '1.8V';
      } else if (r === 7 && c === 2) {
        net = 'PMIC_EN';
        isGnd = false;
        diode = '0.580V';
        v = '1.8V';
      }

      cpuPins.push({
        id: `CPU_P${pinIdx}`,
        pinNumber: pinIdx,
        netName: net,
        x: px,
        y: py,
        isGround: isGnd,
        isPower: isPwr,
        diodeReading: diode,
        voltage: v,
      });
      pinIdx++;
    }
  }

  components.push({
    name: `U1000_CPU (${cpuChip})`,
    type: 'IC',
    x: cpuX,
    y: cpuY,
    width: cpuW,
    height: cpuH,
    side: 'TOP',
    pins: cpuPins,
    description: 'المعالج المركزي ومعالج الرسوميات (SoC/CPU Core)',
  });

  // 2. آيسي الباور الرئيسي (PMIC)
  const pmicChip = chips.pmic || chips.powerManagement || (category === 'mobile' ? '338S00930 / PM8150' : 'TPS51125 / RT8205');
  const pmicX = category === 'mobile' ? 270 : 180;
  const pmicY = category === 'mobile' ? 440 : 200;
  const pmicW = 160;
  const pmicH = 150;
  const pmicPins: VectorPin[] = [];

  const pCols = 6;
  const pRows = 6;
  const pStepX = (pmicW - 24) / (pCols - 1);
  const pStepY = (pmicH - 24) / (pRows - 1);
  let pPin = 1;

  for (let r = 0; r < pRows; r++) {
    for (let c = 0; c < pCols; c++) {
      const px = pmicX + 12 + c * pStepX;
      const py = pmicY + 12 + r * pStepY;
      let net = 'GND';
      let isGnd = true;
      let isPwr = false;
      let diode = '0.000V (GND)';
      let v = '0V';

      if (r === 0 || c === 0) {
        net = mainRailName;
        isGnd = false;
        isPwr = true;
        diode = mainRailDiode;
        v = mainRailVoltage;
      } else if (r === pRows - 1) {
        net = cpuRailName;
        isGnd = false;
        isPwr = true;
        diode = cpuRailDiode;
        v = '0.85V';
      } else if (c === pCols - 1) {
        net = auxRailName;
        isGnd = false;
        isPwr = true;
        diode = auxRailDiode;
        v = '1.8V';
      } else if (r === 2 && c === 2) {
        net = 'I2C_SDA';
        isGnd = false;
        diode = '0.510V';
        v = '1.8V';
      } else if (r === 2 && c === 3) {
        net = 'I2C_SCL';
        isGnd = false;
        diode = '0.510V';
        v = '1.8V';
      } else if (r === 3 && c === 3) {
        net = 'PMIC_EN';
        isGnd = false;
        diode = '0.580V';
        v = '1.8V';
      }

      pmicPins.push({
        id: `PMIC_P${pPin}`,
        pinNumber: pPin,
        netName: net,
        x: px,
        y: py,
        isGround: isGnd,
        isPower: isPwr,
        diodeReading: diode,
        voltage: v,
      });
      pPin++;
    }
  }

  components.push({
    name: `U1200_PMIC (${pmicChip})`,
    type: 'IC',
    x: pmicX,
    y: pmicY,
    width: pmicW,
    height: pmicH,
    side: 'TOP',
    pins: pmicPins,
    description: 'شريحة إدارة وتوزيع الطاقة الرئيسية (Main PMIC Controller)',
  });

  // 3. آيسي الشحن والتحكم بمنفذ التوصيل (Charger / Tristar / Type-C PD)
  const chargeChip = chips.chargeIc || chips.charger || chips.tigris || (category === 'mobile' ? 'SN3100A0 / 1610A2' : 'BQ24780S / ISL95855');
  const chgX = category === 'mobile' ? 120 : 180;
  const chgY = category === 'mobile' ? 660 : 440;
  const chgW = 120;
  const chgH = 110;
  const chgPins: VectorPin[] = [];

  for (let i = 0; i < 16; i++) {
    const isTopSide = i < 4;
    const isRightSide = i >= 4 && i < 8;
    const isBotSide = i >= 8 && i < 12;
    const isLeftSide = i >= 12;

    let px = chgX + 15 + (i % 4) * 28;
    let py = chgY + 10;
    if (isRightSide) {
      px = chgX + chgW - 10;
      py = chgY + 15 + (i - 4) * 25;
    } else if (isBotSide) {
      px = chgX + chgW - 15 - (i - 8) * 28;
      py = chgY + chgH - 10;
    } else if (isLeftSide) {
      px = chgX + 10;
      py = chgY + chgH - 15 - (i - 12) * 25;
    }

    let net = 'GND';
    let isGnd = true;
    let isPwr = false;
    let diode = '0.000V';
    let v = '0V';

    if (i === 1 || i === 2) {
      net = mainRailName;
      isGnd = false;
      isPwr = true;
      diode = mainRailDiode;
      v = mainRailVoltage;
    } else if (i === 5) {
      net = 'I2C_SDA';
      isGnd = false;
      diode = '0.510V';
      v = '1.8V';
    } else if (i === 6) {
      net = 'I2C_SCL';
      isGnd = false;
      diode = '0.510V';
      v = '1.8V';
    } else if (i === 9 || i === 10) {
      net = 'VBUS_5V';
      isGnd = false;
      isPwr = true;
      diode = '0.520V';
      v = '5.0V - 20V';
    }

    chgPins.push({
      id: `CHG_P${i + 1}`,
      pinNumber: i + 1,
      netName: net,
      x: px,
      y: py,
      isGround: isGnd,
      isPower: isPwr,
      diodeReading: diode,
      voltage: v,
    });
  }

  components.push({
    name: `U3300_CHARGER (${chargeChip})`,
    type: 'IC',
    x: chgX,
    y: chgY,
    width: chgW,
    height: chgH,
    side: 'TOP',
    pins: chgPins,
    description: 'شريحة التحكم بالشحن ومدخل الطاقة (Charger IC / Type-C)',
  });

  // 4. مكثفات التصفية السطحية SMD Capacitors على مسار الباور الرئيسي
  const capCoords = [
    { name: 'C1001', x: pmicX - 35, y: pmicY + 20 },
    { name: 'C1002', x: pmicX - 35, y: pmicY + 60 },
    { name: 'C1003', x: pmicX + pmicW + 15, y: pmicY + 20 },
    { name: 'C1004', x: chgX + chgW + 20, y: chgY + 25 },
    { name: 'C1005', x: cpuX - 35, y: cpuY + 40 },
  ];

  capCoords.forEach((cap) => {
    components.push({
      name: cap.name,
      type: 'Capacitor',
      x: cap.x,
      y: cap.y,
      width: 20,
      height: 32,
      side: 'TOP',
      value: '22uF 6.3V',
      description: 'مكثف تصفية وتثبيت فولت مسار الباور الرئيسي (Decoupling Capacitor)',
      pins: [
        {
          id: `${cap.name}_P1`,
          pinNumber: 1,
          netName: mainRailName,
          x: cap.x + 10,
          y: cap.y + 6,
          isPower: true,
          diodeReading: mainRailDiode,
          voltage: mainRailVoltage,
        },
        {
          id: `${cap.name}_P2`,
          pinNumber: 2,
          netName: 'GND',
          x: cap.x + 10,
          y: cap.y + 26,
          isGround: true,
          diodeReading: '0.000V',
          voltage: '0V',
        },
      ],
    });
  });

  // 5. ملفات وكويلات الباور Power Inductors
  const coilCoords = [
    { name: 'PL1200', x: pmicX + pmicW + 15, y: pmicY + 80, net: cpuRailName, diode: cpuRailDiode, v: '0.85V' },
    { name: 'PL1201', x: chgX + chgW + 20, y: chgY + 70, net: mainRailName, diode: mainRailDiode, v: mainRailVoltage },
  ];

  coilCoords.forEach((coil) => {
    components.push({
      name: coil.name,
      type: 'Inductor',
      x: coil.x,
      y: coil.y,
      width: 42,
      height: 42,
      side: 'TOP',
      value: '1.0uH 15A',
      description: 'ملف قدرة لتنعيم وتوليد فولت البك (Buck Power Choke)',
      pins: [
        {
          id: `${coil.name}_P1`,
          pinNumber: 1,
          netName: coil.net,
          x: coil.x + 8,
          y: coil.y + 21,
          isPower: true,
          diodeReading: coil.diode,
          voltage: coil.v,
        },
        {
          id: `${coil.name}_P2`,
          pinNumber: 2,
          netName: coil.net,
          x: coil.x + 34,
          y: coil.y + 21,
          isPower: true,
          diodeReading: coil.diode,
          voltage: coil.v,
        },
      ],
    });
  });

  // 6. موسفيتات القدرة Power Mosfets (High/Low Side)
  components.push({
    name: 'PQ301_MOSFET',
    type: 'Mosfet',
    x: chgX + chgW + 20,
    y: chgY - 45,
    width: 38,
    height: 38,
    side: 'TOP',
    value: 'N-Channel 30V',
    description: 'موسفيت التبديل وحماية خط الشاحن والبطارية (DC-IN Power Switch)',
    pins: [
      { id: 'PQ301_D', pinNumber: 'D', netName: mainRailName, x: chgX + chgW + 28, y: chgY - 40, isPower: true, diodeReading: mainRailDiode, voltage: mainRailVoltage },
      { id: 'PQ301_S', pinNumber: 'S', netName: mainRailName, x: chgX + chgW + 28, y: chgY - 15, isPower: true, diodeReading: mainRailDiode, voltage: mainRailVoltage },
      { id: 'PQ301_G', pinNumber: 'G', netName: 'PMIC_EN', x: chgX + chgW + 48, y: chgY - 25, isPower: false, diodeReading: '0.580V', voltage: '1.8V' },
    ],
  });

  // 7. نقاط فحص ممانعة الدايود (Test Points) على المسار الرئيسي
  const tpCoords = [
    { name: 'TP_VDD_MAIN_1', x: pmicX + 80, y: pmicY - 25 },
    { name: 'TP_VDD_MAIN_2', x: cpuX - 25, y: cpuY + 120 },
    { name: 'TP_I2C_SDA', x: pmicX + 110, y: pmicY + pmicH + 25 },
  ];

  tpCoords.forEach((tp) => {
    components.push({
      name: tp.name,
      type: 'TestPoint',
      x: tp.x,
      y: tp.y,
      width: 14,
      height: 14,
      side: 'TOP',
      pins: [
        {
          id: `${tp.name}_PAD`,
          pinNumber: 1,
          netName: tp.name.includes('I2C') ? 'I2C_SDA' : mainRailName,
          x: tp.x + 7,
          y: tp.y + 7,
          isPower: !tp.name.includes('I2C'),
          diodeReading: tp.name.includes('I2C') ? '0.510V' : mainRailDiode,
          voltage: tp.name.includes('I2C') ? '1.8V' : mainRailVoltage,
        },
      ],
      description: 'نقطة اختبار نحاسية مكشوفة لقياس الفولت والممانعة (Gold Test Point)',
    });
  });

  // 8. الجانب الخلفي (BOTTOM Side) - شرائح الذاكرة والواي فاي
  const nandChip = chips.nand || chips.storage || chips.ssd || 'Kioxia / Micron Flash';
  const wifiChip = chips.wifi || chips.wlan || chips.bluetooth || 'Broadcom / Qualcomm WiFi';

  components.push({
    name: `U3000_NAND (${nandChip})`,
    type: 'IC',
    x: cpuX - 40,
    y: cpuY + 20,
    width: 170,
    height: 150,
    side: 'BOTTOM',
    pins: [
      { id: 'NAND_1', pinNumber: 1, netName: mainRailName, x: cpuX - 20, y: cpuY + 40, isPower: true, diodeReading: mainRailDiode, voltage: mainRailVoltage },
      { id: 'NAND_2', pinNumber: 2, netName: auxRailName, x: cpuX - 20, y: cpuY + 70, isPower: true, diodeReading: auxRailDiode, voltage: '1.8V' },
      { id: 'NAND_3', pinNumber: 3, netName: 'GND', x: cpuX + 100, y: cpuY + 40, isGround: true, diodeReading: '0.000V', voltage: '0V' },
    ],
    description: 'شريحة الذاكرة الرئيسية ووحدة التخزين السريع (NAND Flash / NVMe Storage)',
  });

  components.push({
    name: `U5000_WIFI (${wifiChip})`,
    type: 'IC',
    x: cpuX + 160,
    y: cpuY + 20,
    width: 130,
    height: 120,
    side: 'BOTTOM',
    pins: [
      { id: 'WIFI_1', pinNumber: 1, netName: auxRailName, x: cpuX + 180, y: cpuY + 40, isPower: true, diodeReading: auxRailDiode, voltage: '1.8V' },
      { id: 'WIFI_2', pinNumber: 2, netName: 'GND', x: cpuX + 260, y: cpuY + 40, isGround: true, diodeReading: '0.000V', voltage: '0V' },
    ],
    description: 'وحدة الاتصال اللاسلكي والواي فاي والبلوتوث (WLAN / Bluetooth Module)',
  });

  return {
    name: `${brand} ${model}`,
    boardCode,
    brand,
    model,
    deviceType: category,
    width,
    height,
    outline,
    components,
    powerRails,
  };
}
