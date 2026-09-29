'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  RotateCw,
  ZoomIn,
  ZoomOut,
  Upload,
  Download,
  Crosshair,
  Sparkles,
  RefreshCw,
  Eye,
  Sliders,
  FolderOpen,
  ArrowRight,
  Info,
  Check,
  Globe,
} from 'lucide-react';
import {
  BOARD_CATEGORIES,
  buildIphone14ProMaxBoard,
  buildIphone13ProBoard,
  buildIphone12ProBoard,
  buildIphone11ProMaxBoard,
  buildSamsungS24UltraBoard,
  buildSamsungA54Board,
  buildPocoX3ProBoard,
  buildMacBookAirM2Board,
  buildMacBookIntelA1708Board,
  buildDellXpsBoard,
  buildLenovoThinkPadBoard,
  buildDellInspiron3521Board,
  buildHpProBook450Board,
  buildDesktopH81Board,
  buildRtx3060GpuBoard,
} from '@/lib/boardviewPresets';
import { consumeGuestTrial } from '@/lib/guestUsage';

// ==========================================
// 1. تعريف واجهات ونماذج بيانات البوردفيو
// ==========================================

export type BoardSide = 'TOP' | 'BOTTOM';

export interface BoardPin {
  id: string;
  partId: string;
  pinNumber: string;
  netId: string;
  x: number; // إحداثيات بالملم أو النقاط النسبية
  y: number;
  radius: number;
  shape?: 'circle' | 'rect';
  diodeValue?: string;
  isPin1?: boolean;
}

export interface BoardPart {
  id: string;
  name: string; // مثل U3100, C104, L201, TP12
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

// ==========================================
// 2. النماذج الهندسية الجاهزة المدمجة (Presets)
// ==========================================

// --- Preset 1: iPhone 15 Pro Max Logic Board ---
const IPHONE_15_PRO_MAX_BOARD: BoardData = (() => {
  const nets: Record<string, BoardNet> = {
    net_gnd: {
      id: 'net_gnd',
      name: 'GND (الأرضي العام)',
      voltage: '0.00V',
      diodeMode: '0.000V (صافي)',
      color: '#64748b',
      description: 'الشاسيه والأرضي العمومي لكافة دوائر البوردة.',
      isGround: true,
      safeInjectionVoltage: 'لا يحقن',
    },
    net_vdd_main: {
      id: 'net_vdd_main',
      name: 'PP_VDD_MAIN / VDD_BOOST',
      voltage: '3.7V - 4.2V',
      diodeMode: '0.380V - 0.420V',
      color: '#f59e0b',
      description: 'شريان الطاقة الأساسي للبوردة بعد آيسي الشحن، يغذي 70% من مكونات الهاتف.',
      isPower: true,
      safeInjectionVoltage: '3.8V - 4.0V (حد أقصى 2.5A)',
    },
    net_vbus: {
      id: 'net_vbus',
      name: 'PP_VBUS_USB_C (5V - 20V PD)',
      voltage: '5.0V / 9.0V / 15.0V',
      diodeMode: '0.550V - 0.620V',
      color: '#10b981',
      description: 'فولت دخل شاحن الـ USB-C عبر كونكتور الشحن إلى آيسي الحماية والشحن Hydra/Tigris.',
      isPower: true,
      safeInjectionVoltage: '5.0V (حد أقصى 1.5A)',
    },
    net_cpu_vcore: {
      id: 'net_cpu_vcore',
      name: 'PP_A17_CPU_VCORE (0.85V)',
      voltage: '0.75V - 0.90V',
      diodeMode: '0.018V - 0.045V (ممانعة منخفضة طبيعية)',
      color: '#38bdf8',
      description: 'خط إمداد الطاقة النبضية للمعالج المركزي A17 Pro. تياره عالي وجهده منخفض.',
      isPower: true,
      safeInjectionVoltage: '0.8V فقط! (خطر تجاوز 1.0V)',
    },
    net_gpu_vcore: {
      id: 'net_gpu_vcore',
      name: 'PP_A17_GPU_CORE (0.90V)',
      voltage: '0.80V - 0.95V',
      diodeMode: '0.022V - 0.050V',
      color: '#818cf8',
      description: 'مسار معالج الرسوميات سداسي النواة في A17 Pro.',
      isPower: true,
      safeInjectionVoltage: '0.85V (حد أقصى 2A)',
    },
    net_1v8_always: {
      id: 'net_1v8_always',
      name: 'PP1V8_ALWAYS_AOP',
      voltage: '1.80V دائم',
      diodeMode: '0.340V - 0.390V',
      color: '#a855f7',
      description: 'فولت الإقلاع والتغذية الدائمة لحساسات الشاشة وزر الباور وكريستالة التوقيت.',
      isPower: true,
      safeInjectionVoltage: '1.8V (حد أقصى 1A)',
    },
    net_batt_vcc: {
      id: 'net_batt_vcc',
      name: 'PP_BATT_VCC (بطارية)',
      voltage: '3.6V - 4.35V',
      diodeMode: '0.450V - 0.510V',
      color: '#ef4444',
      description: 'خط البطارية المباشر من كونكتور البطارية J_BATT إلى موسفت الحماية وآيسي الشحن.',
      isPower: true,
      safeInjectionVoltage: '3.8V (حد أقصى 2A)',
    },
    net_i2c_bus: {
      id: 'net_i2c_bus',
      name: 'I2C_AP_BI_PMIC_SDA/SCL',
      voltage: '1.80V Logic',
      diodeMode: '0.410V - 0.460V',
      color: '#ec4899',
      description: 'ناقل البيانات التسلسلي للتحكم بين المعالج وآيسي الباور وحساسات الحرارة.',
      safeInjectionVoltage: 'لا يحقن (إشارة منطقية)',
    },
  };

  const parts: BoardPart[] = [];

  // 1. A17 Pro SoC (BGA) - TOP SIDE
  const cpuPins: BoardPin[] = [];
  const rows = 10;
  const cols = 10;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let netId = 'net_gnd';
      let diode = '0.000V';
      if ((r >= 2 && r <= 5) && (c >= 2 && c <= 5)) {
        netId = 'net_cpu_vcore';
        diode = '0.025V';
      } else if (r >= 6 && c >= 6) {
        netId = 'net_gpu_vcore';
        diode = '0.030V';
      } else if (r === 0 || c === 0) {
        netId = 'net_1v8_always';
        diode = '0.360V';
      }
      cpuPins.push({
        id: `cpu_pin_${r}_${c}`,
        partId: 'U1000_SOC',
        pinNumber: `${String.fromCharCode(65 + r)}${c + 1}`,
        netId,
        x: (c - (cols - 1) / 2) * 2.2,
        y: (r - (rows - 1) / 2) * 2.2,
        radius: 0.65,
        diodeValue: diode,
        isPin1: r === 0 && c === 0,
      });
    }
  }

  parts.push({
    id: 'U1000_SOC',
    name: 'A17 Pro SoC (U1000)',
    packageType: 'BGA',
    side: 'TOP',
    x: 120,
    y: 110,
    width: 28,
    height: 28,
    rotation: 0,
    role: 'المعالج الرئيسي ووحدة التحكم الشاملة',
    commonFault: 'تلف داخلي بسبب سقوط عنيف، أو شورت صريح على خطوط VCORE (ممانعة 0.000V)',
    pins: cpuPins,
  });

  // 2. Main PMIC U3100 - TOP SIDE
  const pmicPins: BoardPin[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      let netId = 'net_gnd';
      let diode = '0.000V';
      if (r < 2 && c < 2) {
        netId = 'net_vdd_main';
        diode = '0.395V';
      } else if (r >= 4 && c < 3) {
        netId = 'net_cpu_vcore';
        diode = '0.028V';
      } else if (r >= 4 && c >= 4) {
        netId = 'net_1v8_always';
        diode = '0.365V';
      } else if (r === 2 && c === 2) {
        netId = 'net_i2c_bus';
        diode = '0.430V';
      }
      pmicPins.push({
        id: `pmic_pin_${r}_${c}`,
        partId: 'U3100_PMIC',
        pinNumber: `${String.fromCharCode(65 + r)}${c + 1}`,
        netId,
        x: (c - 3) * 2.4,
        y: (r - 3) * 2.4,
        radius: 0.7,
        diodeValue: diode,
        isPin1: r === 0 && c === 0,
      });
    }
  }

  parts.push({
    id: 'U3100_PMIC',
    name: 'Main PMIC (U3100)',
    packageType: 'BGA',
    side: 'TOP',
    x: 65,
    y: 110,
    width: 20,
    height: 20,
    rotation: 0,
    role: 'آيسي إدارة الطاقة الرئيسي وتوليد جهود الباور والريستارت',
    commonFault: 'سحب تيار 0.04A إلى 0.08A متجمد بعد الضغط على زر الباور',
    pins: pmicPins,
  });

  // 3. Charging IC Hydra / Tigris U3300 - TOP SIDE
  parts.push({
    id: 'U3300_CHG',
    name: 'Charging & USB-C IC (U3300)',
    packageType: 'QFN',
    side: 'TOP',
    x: 65,
    y: 165,
    width: 16,
    height: 16,
    rotation: 0,
    role: 'تنظيم شحن البطارية والتحكم بمنفذ USB-C وتوليد PP_VDD_MAIN',
    commonFault: 'سخونة شديدة وسحب تيار عالي قبل الضغط على زر الباور (Short Before Power)',
    pins: [
      { id: 'chg_p1', partId: 'U3300_CHG', pinNumber: '1', netId: 'net_vbus', x: -6, y: -6, radius: 0.8, diodeValue: '0.580V', isPin1: true },
      { id: 'chg_p2', partId: 'U3300_CHG', pinNumber: '2', netId: 'net_vbus', x: -2, y: -6, radius: 0.8, diodeValue: '0.580V' },
      { id: 'chg_p3', partId: 'U3300_CHG', pinNumber: '3', netId: 'net_gnd', x: 2, y: -6, radius: 0.8, diodeValue: '0.000V' },
      { id: 'chg_p4', partId: 'U3300_CHG', pinNumber: '4', netId: 'net_vdd_main', x: 6, y: -6, radius: 0.8, diodeValue: '0.395V' },
      { id: 'chg_p5', partId: 'U3300_CHG', pinNumber: '5', netId: 'net_vdd_main', x: 6, y: 0, radius: 0.8, diodeValue: '0.395V' },
      { id: 'chg_p6', partId: 'U3300_CHG', pinNumber: '6', netId: 'net_batt_vcc', x: 6, y: 6, radius: 0.8, diodeValue: '0.480V' },
      { id: 'chg_p7', partId: 'U3300_CHG', pinNumber: '7', netId: 'net_gnd', x: -6, y: 6, radius: 0.8, diodeValue: '0.000V' },
      { id: 'chg_p8', partId: 'U3300_CHG', pinNumber: '8', netId: 'net_i2c_bus', x: -6, y: 0, radius: 0.8, diodeValue: '0.420V' },
    ],
  });

  // 4. Bypass Capacitors (C3101 - C3108) on VDD_MAIN
  const caps = [
    { id: 'C3101', x: 85, y: 92, net: 'net_vdd_main', diode: '0.395V' },
    { id: 'C3102', x: 85, y: 100, net: 'net_vdd_main', diode: '0.395V' },
    { id: 'C3103', x: 85, y: 108, net: 'net_vdd_main', diode: '0.395V' },
    { id: 'C3104', x: 85, y: 116, net: 'net_vdd_main', diode: '0.395V' },
    { id: 'C3105', x: 100, y: 78, net: 'net_cpu_vcore', diode: '0.025V' },
    { id: 'C3106', x: 108, y: 78, net: 'net_cpu_vcore', diode: '0.025V' },
    { id: 'C3107', x: 48, y: 155, net: 'net_vbus', diode: '0.580V' },
    { id: 'C3108', x: 48, y: 165, net: 'net_batt_vcc', diode: '0.480V' },
  ];

  caps.forEach((cap) => {
    parts.push({
      id: cap.id,
      name: `${cap.id} (مكثف تنعيم)`,
      packageType: '0402',
      side: 'TOP',
      x: cap.x,
      y: cap.y,
      width: 4.5,
      height: 2.5,
      rotation: 0,
      role: `مكثف حماية وترشيح جهد على مسار ${cap.net}`,
      commonFault: 'انهيار عازلية وتفريغ شورت كامل على الأرضي مسبباً انطفاء الهاتف',
      pins: [
        { id: `${cap.id}_p1`, partId: cap.id, pinNumber: '1', netId: cap.net, x: -1.3, y: 0, radius: 0.6, shape: 'rect', diodeValue: cap.diode },
        { id: `${cap.id}_p2`, partId: cap.id, pinNumber: '2', netId: 'net_gnd', x: 1.3, y: 0, radius: 0.6, shape: 'rect', diodeValue: '0.000V' },
      ],
    });
  });

  // 5. Test Points (TP1 - TP5)
  const testPoints = [
    { id: 'TP_VDD_MAIN', name: 'TP_VDD_MAIN (نقطة حقن الفولت)', x: 92, y: 145, net: 'net_vdd_main', diode: '0.395V', volt: '4.0V' },
    { id: 'TP_CPU_VCORE', name: 'TP_CPU_VCORE (نقطة فحص المعالج)', x: 145, y: 92, net: 'net_cpu_vcore', diode: '0.025V', volt: '0.85V' },
    { id: 'TP_VBUS_5V', name: 'TP_VBUS (دخل الشاحن)', x: 35, y: 165, net: 'net_vbus', diode: '0.580V', volt: '5.0V' },
    { id: 'TP_1V8_ALWAYS', name: 'TP_1V8 (إشارة الإقلاع)', x: 65, y: 80, net: 'net_1v8_always', diode: '0.365V', volt: '1.8V' },
    { id: 'TP_BATT_PLUS', name: 'TP_BATT+ (ريش البطارية)', x: 35, y: 130, net: 'net_batt_vcc', diode: '0.480V', volt: '3.8V' },
  ];

  testPoints.forEach((tp) => {
    parts.push({
      id: tp.id,
      name: tp.name,
      packageType: 'TEST_POINT',
      side: 'TOP',
      x: tp.x,
      y: tp.y,
      width: 3.5,
      height: 3.5,
      rotation: 0,
      role: `نقطة فحص هندسية مباشرة لقياس جهد وممانعة مسار ${tp.net}`,
      commonFault: 'تآكل بفعل الرطوبة أو قياس غير دقيق',
      pins: [
        { id: `${tp.id}_pin`, partId: tp.id, pinNumber: 'TP', netId: tp.net, x: 0, y: 0, radius: 1.1, diodeValue: tp.diode },
      ],
    });
  });

  // 6. Connectors (USB-C & Battery Connector)
  parts.push({
    id: 'J_USBC_PORT',
    name: 'USB-C Dock Connector (J4000)',
    packageType: 'CONNECTOR',
    side: 'TOP',
    x: 20,
    y: 165,
    width: 10,
    height: 22,
    rotation: 0,
    role: 'منفذ توصيل فلاتة الشحن USB-C والمايكروفون السفلي',
    commonFault: 'تلف البنات جراء استخدام كوابل تجارية رديئة أو دخول سوائل',
    pins: [
      { id: 'usbc_1', partId: 'J_USBC_PORT', pinNumber: '1', netId: 'net_vbus', x: 0, y: -8, radius: 0.7, diodeValue: '0.580V' },
      { id: 'usbc_2', partId: 'J_USBC_PORT', pinNumber: '2', netId: 'net_vbus', x: 0, y: -4, radius: 0.7, diodeValue: '0.580V' },
      { id: 'usbc_3', partId: 'J_USBC_PORT', pinNumber: '3', netId: 'net_gnd', x: 0, y: 0, radius: 0.7, diodeValue: '0.000V' },
      { id: 'usbc_4', partId: 'J_USBC_PORT', pinNumber: '4', netId: 'net_i2c_bus', x: 0, y: 4, radius: 0.7, diodeValue: '0.420V' },
      { id: 'usbc_5', partId: 'J_USBC_PORT', pinNumber: '5', netId: 'net_gnd', x: 0, y: 8, radius: 0.7, diodeValue: '0.000V' },
    ],
  });

  // 7. BOTTOM SIDE COMPONENTS (NAND Flash, Audio IC, Baseband)
  parts.push({
    id: 'U2100_NAND',
    name: 'NAND Flash NVMe 512GB (U2100)',
    packageType: 'BGA',
    side: 'BOTTOM',
    x: 110,
    y: 110,
    width: 24,
    height: 20,
    rotation: 0,
    role: 'ذاكرة التخزين الرئيسية ونظام التشغيل iOS',
    commonFault: 'عطل ريستارت تفاحة مستمر خطأ 4013 أو خطأ 9 في الآيتونز',
    pins: [
      { id: 'nand_1', partId: 'U2100_NAND', pinNumber: 'A1', netId: 'net_1v8_always', x: -8, y: -6, radius: 0.7, diodeValue: '0.360V', isPin1: true },
      { id: 'nand_2', partId: 'U2100_NAND', pinNumber: 'A2', netId: 'net_vdd_main', x: -4, y: -6, radius: 0.7, diodeValue: '0.395V' },
      { id: 'nand_3', partId: 'U2100_NAND', pinNumber: 'B1', netId: 'net_gnd', x: 0, y: 0, radius: 0.7, diodeValue: '0.000V' },
      { id: 'nand_4', partId: 'U2100_NAND', pinNumber: 'B2', netId: 'net_gnd', x: 4, y: 4, radius: 0.7, diodeValue: '0.000V' },
      { id: 'nand_5', partId: 'U2100_NAND', pinNumber: 'C1', netId: 'net_1v8_always', x: 8, y: 6, radius: 0.7, diodeValue: '0.360V' },
    ],
  });

  parts.push({
    id: 'U5000_AUDIO',
    name: 'Audio Codec & Speaker Amp (U5000)',
    packageType: 'BGA',
    side: 'BOTTOM',
    x: 55,
    y: 85,
    width: 14,
    height: 14,
    rotation: 0,
    role: 'معالج وتكبير الصوت والمايكروفونات',
    commonFault: 'توقف الصوت والتسجيل وتأخر إقلاع الجهاز',
    pins: [
      { id: 'aud_1', partId: 'U5000_AUDIO', pinNumber: '1', netId: 'net_vdd_main', x: -4, y: -4, radius: 0.6, diodeValue: '0.395V', isPin1: true },
      { id: 'aud_2', partId: 'U5000_AUDIO', pinNumber: '2', netId: 'net_1v8_always', x: 4, y: -4, radius: 0.6, diodeValue: '0.360V' },
      { id: 'aud_3', partId: 'U5000_AUDIO', pinNumber: '3', netId: 'net_gnd', x: 0, y: 0, radius: 0.6, diodeValue: '0.000V' },
      { id: 'aud_4', partId: 'U5000_AUDIO', pinNumber: '4', netId: 'net_i2c_bus', x: -4, y: 4, radius: 0.6, diodeValue: '0.420V' },
    ],
  });

  return {
    id: 'iphone_15_pro_max',
    title: 'iPhone 15 Pro Max (Logic Board Sub-A)',
    deviceModel: 'Apple iPhone 15 Pro Max (A3106/A2849)',
    width: 190,
    height: 220,
    layersCount: 10,
    nets,
    parts,
    outlinePoints: [
      { x: 10, y: 40 },
      { x: 175, y: 40 },
      { x: 175, y: 195 },
      { x: 45, y: 195 },
      { x: 45, y: 180 },
      { x: 10, y: 180 },
    ],
  };
})();

// --- Preset 2: MacBook Pro M3 / M1 Board (A2338 / 820-02020) ---
const MACBOOK_M_SERIES_BOARD: BoardData = (() => {
  const nets: Record<string, BoardNet> = {
    net_gnd: {
      id: 'net_gnd',
      name: 'GND (System Ground)',
      voltage: '0.00V',
      diodeMode: '0.000V',
      color: '#64748b',
      description: 'أرضي الشاسيه العام للماك بوك.',
      isGround: true,
    },
    net_ppbus_g3h: {
      id: 'net_ppbus_g3h',
      name: 'PPBUS_G3H (شريان ماك بوك الأساسي)',
      voltage: '12.0V - 12.6V (M1/M2/M3)',
      diodeMode: '0.430V - 0.490V',
      color: '#f59e0b',
      description: 'الخط الرئيسي العمومي في أجهزة آبل ماك بوك. غيابه يعني انطفاء اللابتوب تماماً وتوقف سحب 5V/20V.',
      isPower: true,
      safeInjectionVoltage: '12.0V (تيار 1.5A)',
    },
    net_pp3v3_g3h: {
      id: 'net_pp3v3_g3h',
      name: 'PP3V3_G3H_RTC / AON',
      voltage: '3.30V دائم Always-On',
      diodeMode: '0.340V - 0.380V',
      color: '#10b981',
      description: 'تغذية دوائر الإقلاع والتحكم SMC/PMU وشرائح Type-C CD3217.',
      isPower: true,
      safeInjectionVoltage: '3.3V (1A)',
    },
    net_pp5v_s2: {
      id: 'net_pp5v_s2',
      name: 'PP5V_S2_MAIN',
      voltage: '5.00V',
      diodeMode: '0.410V - 0.460V',
      color: '#38bdf8',
      description: 'جهد تشغيل الشاشة، الصوت، والمراوح.',
      isPower: true,
    },
    net_m_soc_core: {
      id: 'net_m_soc_core',
      name: 'PPVDD_CPU_SRAM_AWAKE',
      voltage: '0.80V',
      diodeMode: '0.012V - 0.035V (منخفض جداً طبيعي)',
      color: '#a855f7',
      description: 'تغذية قلب معالج آبل سيليكون M-Series.',
      isPower: true,
      safeInjectionVoltage: '0.8V فقط!',
    },
  };

  const parts: BoardPart[] = [
    {
      id: 'U0500_M_SOC',
      name: 'Apple M-Series SoC + Unified RAM (U0500)',
      packageType: 'BGA',
      side: 'TOP',
      x: 105,
      y: 100,
      width: 36,
      height: 36,
      rotation: 0,
      role: 'المعالج المتكامل مع الذاكرة الموحدة المدمجة',
      commonFault: 'تلف جراء حقن فولت عالي أو شورت في أحد مكثفات التنعيم',
      pins: [
        { id: 'm_p1', partId: 'U0500_M_SOC', pinNumber: '1', netId: 'net_m_soc_core', x: -10, y: -10, radius: 0.9, diodeValue: '0.020V', isPin1: true },
        { id: 'm_p2', partId: 'U0500_M_SOC', pinNumber: '2', netId: 'net_m_soc_core', x: 0, y: -10, radius: 0.9, diodeValue: '0.020V' },
        { id: 'm_p3', partId: 'U0500_M_SOC', pinNumber: '3', netId: 'net_pp3v3_g3h', x: 10, y: -10, radius: 0.9, diodeValue: '0.360V' },
        { id: 'm_p4', partId: 'U0500_M_SOC', pinNumber: '4', netId: 'net_gnd', x: 0, y: 0, radius: 0.9, diodeValue: '0.000V' },
        { id: 'm_p5', partId: 'U0500_M_SOC', pinNumber: '5', netId: 'net_pp5v_s2', x: -10, y: 10, radius: 0.9, diodeValue: '0.430V' },
      ],
    },
    {
      id: 'U7000_ISL',
      name: 'ISL9240 / Intersil Charging Controller (U7000)',
      packageType: 'QFN',
      side: 'TOP',
      x: 50,
      y: 120,
      width: 18,
      height: 18,
      rotation: 0,
      role: 'توليد مسار PPBUS_G3H وإدارة الشحن السريع',
      commonFault: 'سحب 5V و 0.00A على التيستر الرقمي وعدم الترقية إلى 20V',
      pins: [
        { id: 'u7_p1', partId: 'U7000_ISL', pinNumber: '1', netId: 'net_ppbus_g3h', x: -6, y: -6, radius: 0.8, diodeValue: '0.450V', isPin1: true },
        { id: 'u7_p2', partId: 'U7000_ISL', pinNumber: '2', netId: 'net_ppbus_g3h', x: 6, y: -6, radius: 0.8, diodeValue: '0.450V' },
        { id: 'u7_p3', partId: 'U7000_ISL', pinNumber: '3', netId: 'net_gnd', x: 0, y: 0, radius: 0.8, diodeValue: '0.000V' },
        { id: 'u7_p4', partId: 'U7000_ISL', pinNumber: '4', netId: 'net_pp3v3_g3h', x: -6, y: 6, radius: 0.8, diodeValue: '0.360V' },
      ],
    },
    {
      id: 'F7000_FUSE',
      name: 'F7000 (Main PPBUS Fuse)',
      packageType: '0402',
      side: 'TOP',
      x: 75,
      y: 120,
      width: 6,
      height: 4,
      rotation: 0,
      role: 'فيوز حماية رئيسي لخط PPBUS_G3H',
      commonFault: 'احتراق الفيوز وانقطاع الفولت بسبب وجود شورت بعده',
      pins: [
        { id: 'f_p1', partId: 'F7000_FUSE', pinNumber: '1', netId: 'net_ppbus_g3h', x: -2, y: 0, radius: 0.8, diodeValue: '0.450V' },
        { id: 'f_p2', partId: 'F7000_FUSE', pinNumber: '2', netId: 'net_ppbus_g3h', x: 2, y: 0, radius: 0.8, diodeValue: '0.450V' },
      ],
    },
  ];

  return {
    id: 'macbook_m_series',
    title: 'MacBook Pro M3 / M1 Logic Board (A2338)',
    deviceModel: 'Apple MacBook Pro A2338 (820-02020)',
    width: 210,
    height: 180,
    layersCount: 8,
    nets,
    parts,
    outlinePoints: [
      { x: 15, y: 20 },
      { x: 195, y: 20 },
      { x: 195, y: 160 },
      { x: 15, y: 160 },
    ],
  };
})();

// ==========================================
// 3. المكون الرئيسي: InteractiveBoardviewSimulator
// ==========================================

export default function InteractiveBoardviewSimulator() {
  // الحالات الأساسية
  const [boardData, setBoardData] = useState<BoardData>(IPHONE_15_PRO_MAX_BOARD);
  const [selectedSide, setSelectedSide] = useState<BoardSide>('TOP');
  const [selectedNetId, setSelectedNetId] = useState<string>('net_vdd_main');
  const [selectedPartId, setSelectedPartId] = useState<string>('U1000_SOC');
  const [hoveredPin, setHoveredPin] = useState<{ pin: BoardPin; part: BoardPart } | null>(null);

  // إعدادات العرض
  const [showFlightLines, setShowFlightLines] = useState(true);
  const [showDiodeOverlay, setShowDiodeOverlay] = useState(true);
  const [showComponentLabels, setShowComponentLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // بوردات ومخططات السحابة المرفوعة
  const [cloudBoards, setCloudBoards] = useState<BoardData[]>([]);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineQuery, setOnlineQuery] = useState('');
  const [onlineNotice, setOnlineNotice] = useState('');
  const [showOnlineSearchBox, setShowOnlineSearchBox] = useState(false);

  // جلب البوردات السحابية عند بدء التشغيل
  const fetchCloudBoards = useCallback(async () => {
    try {
      const res = await fetch('/api/boardviews');
      if (res.ok) {
        const data = await res.json();
        if (data.boards && Array.isArray(data.boards)) {
          setCloudBoards(data.boards);
        }
      }
    } catch (e) {
      console.warn('Could not fetch cloud boards:', e);
    }
  }, []);

  useEffect(() => {
    fetchCloudBoards();
  }, [fetchCloudBoards]);

  // البحث
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ type: 'part' | 'net'; item: any }[]>([]);

  // محول الكانفاس (Zoom & Pan & Rotation)
  const [zoom, setZoom] = useState(2.2);
  const [pan, setPan] = useState({ x: 180, y: 140 });
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // مراجع اللمس للموبايل
  const lastTouchDistance = useRef<number>(0);
  const lastTouchCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // مراجع الكانفاس
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // المكون والمسار النشط
  const activeNet = boardData.nets[selectedNetId] || Object.values(boardData.nets)[0];
  const selectedPart = boardData.parts.find((p) => p.id === selectedPartId) || boardData.parts[0];

  // تصفية المكونات حسب الوجه (TOP / BOTTOM)
  const visibleParts = useMemo(() => {
    return boardData.parts.filter((p) => p.side === selectedSide);
  }, [boardData.parts, selectedSide]);

  // البنات المتصلة بالمسار النشط
  const connectedPins = useMemo(() => {
    const list: { pin: BoardPin; part: BoardPart; worldX: number; worldY: number }[] = [];
    visibleParts.forEach((part) => {
      part.pins.forEach((pin) => {
        if (pin.netId === selectedNetId) {
          list.push({
            pin,
            part,
            worldX: part.x + pin.x,
            worldY: part.y + pin.y,
          });
        }
      });
    });
    return list;
  }, [visibleParts, selectedNetId]);

  // البحث التفاعلي
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const results: { type: 'part' | 'net'; item: any }[] = [];

    // مطابقة المكونات
    boardData.parts.forEach((p) => {
      if (p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)) {
        results.push({ type: 'part', item: p });
      }
    });

    // مطابقة المسارات
    Object.values(boardData.nets).forEach((n) => {
      if (n.name.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)) {
        results.push({ type: 'net', item: n });
      }
    });

    setSearchResults(results.slice(0, 8));
  }, [searchQuery, boardData]);

  // التكبير والتصغير وتوسيط الكانفاس
  const handleResetView = useCallback(() => {
    setZoom(2.0);
    setPan({ x: 180, y: 140 });
    setRotation(0);
  }, []);

  // توجيه الكاميرا إلى مكون محدد
  const zoomToPart = useCallback((part: BoardPart) => {
    setSelectedPartId(part.id);
    setSelectedSide(part.side);
    if (part.pins.length > 0) {
      setSelectedNetId(part.pins[0].netId);
    }
    const container = containerRef.current;
    if (container) {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      setPan({
        x: cw / 2 - part.x * 2.8,
        y: ch / 2 - part.y * 2.8,
      });
      setZoom(2.8);
    }
  }, []);

  // ==========================================
  // 4. محرك الرسم بالفيكتور (HTML5 Canvas 2D)
  // ==========================================
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ضبط دقة الشاشة Retina / High DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // 1. خلفية المعمل الهندسي المظلم
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

    // 2. تطبيق مصفوفة التحويل (Pan + Zoom + Rotation)
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180);
    }

    // 3. رسم شبكة الإحداثيات الهندسية Grid (إذا كانت مفعلة)
    if (showGrid) {
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
      ctx.lineWidth = 0.5 / zoom;
      const gridSize = 20;
      const startX = -100;
      const endX = boardData.width + 100;
      const startY = -100;
      const endY = boardData.height + 100;

      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    }

    // 4. رسم حدود البوردة PCB Solder Mask
    ctx.save();
    ctx.beginPath();
    if (boardData.outlinePoints && boardData.outlinePoints.length > 2) {
      ctx.moveTo(boardData.outlinePoints[0].x, boardData.outlinePoints[0].y);
      for (let i = 1; i < boardData.outlinePoints.length; i++) {
        ctx.lineTo(boardData.outlinePoints[i].x, boardData.outlinePoints[i].y);
      }
      ctx.closePath();
    } else {
      ctx.roundRect(10, 10, boardData.width, boardData.height, 12);
    }

    // تدرج البوردة الأخضر الداكن / الزمردي مثل ZXW
    const pcbGradient = ctx.createLinearGradient(0, 0, boardData.width, boardData.height);
    pcbGradient.addColorStop(0, '#06281e');
    pcbGradient.addColorStop(0.5, '#041f17');
    pcbGradient.addColorStop(1, '#02130e');
    ctx.fillStyle = pcbGradient;
    ctx.fill();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5 / zoom;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();

    // 5. رسم خطوط التوصيل الجوية المضيئة (Animated Bézier Trace Lines)
    if (showFlightLines && connectedPins.length > 1) {
      const now = Date.now();
      const dashOffset = -(now / 30) % (14 / zoom);  // أنيميشن جري

      ctx.save();

      // للمسار: رسم كل وصلة كقوس Bézier تربائي
      for (let i = 0; i < connectedPins.length - 1; i++) {
        const p1 = connectedPins[i];
        const p2 = connectedPins[i + 1];
        const midX = (p1.worldX + p2.worldX) / 2;
        const midY = (p1.worldY + p2.worldY) / 2;
        // نقطة الضبط للقوس (تميل قليلاً للأعلى لإضفاء شكل منحنى)
        const dx = p2.worldX - p1.worldX;
        const dy = p2.worldY - p1.worldY;
        const len = Math.hypot(dx, dy) || 1;
        const cpX = midX + (-dy / len) * (len * 0.22);
        const cpY = midY + (dx / len) * (len * 0.22);

        // 1) هالة توهج خارجية
        ctx.beginPath();
        ctx.moveTo(p1.worldX, p1.worldY);
        ctx.quadraticCurveTo(cpX, cpY, p2.worldX, p2.worldY);
        ctx.strokeStyle = activeNet.color + '44';
        ctx.lineWidth = 5 / zoom;
        ctx.setLineDash([]);
        ctx.shadowColor = activeNet.color;
        ctx.shadowBlur = 18;
        ctx.stroke();

        // 2) الخط المتحرك الأساسي
        ctx.beginPath();
        ctx.moveTo(p1.worldX, p1.worldY);
        ctx.quadraticCurveTo(cpX, cpY, p2.worldX, p2.worldY);
        ctx.strokeStyle = activeNet.color;
        ctx.lineWidth = 1.8 / zoom;
        ctx.setLineDash([5 / zoom, 3 / zoom]);
        ctx.lineDashOffset = dashOffset;
        ctx.shadowBlur = 12;
        ctx.stroke();

        // 3) رسم سهم صغير في منتصف القوس لإظهار الاتجاه
        const arrowX = 0.5 * p1.worldX + 0.5 * cpX * 0.5 + 0.5 * p2.worldX * 0.25; // نقطة على القوس ≈ t=0.5
        const arrowY = 0.5 * p1.worldY + 0.5 * cpY * 0.5 + 0.5 * p2.worldY * 0.25;
        const angle = Math.atan2(p2.worldY - p1.worldY, p2.worldX - p1.worldX);
        const arrowSize = 4 / zoom;

        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);
        ctx.setLineDash([]);
        ctx.shadowBlur = 6;
        ctx.fillStyle = activeNet.color;
        ctx.beginPath();
        ctx.moveTo(arrowSize, 0);
        ctx.lineTo(-arrowSize * 0.7, arrowSize * 0.5);
        ctx.lineTo(-arrowSize * 0.7, -arrowSize * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }

    // 6. رسم المكونات والآيسيات (Parts & ICs)
    visibleParts.forEach((part) => {
      const isSelected = part.id === selectedPartId;
      const partLeft = part.x - part.width / 2;
      const partTop = part.y - part.height / 2;

      ctx.save();
      ctx.translate(part.x, part.y);
      if (part.rotation) ctx.rotate((part.rotation * Math.PI) / 180);

      // جسم القطعة
      ctx.beginPath();
      ctx.roundRect(-part.width / 2, -part.height / 2, part.width, part.height, 2);

      if (part.packageType === 'BGA' || part.packageType === 'QFN') {
        ctx.fillStyle = isSelected ? '#1e293b' : '#0f172a';
        ctx.strokeStyle = isSelected ? '#f59e0b' : '#334155';
        ctx.lineWidth = (isSelected ? 2 : 1) / zoom;
      } else if (part.packageType === 'TEST_POINT') {
        ctx.fillStyle = isSelected ? '#fef08a' : '#eab308';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1 / zoom;
      } else {
        // مكثفات / مقاومات
        ctx.fillStyle = isSelected ? '#475569' : '#1e293b';
        ctx.strokeStyle = isSelected ? '#f59e0b' : '#475569';
        ctx.lineWidth = 1 / zoom;
      }

      ctx.fill();
      ctx.stroke();

      // رسم علامة Pin 1 Dot على الآيسيات
      if (part.packageType === 'BGA' || part.packageType === 'QFN') {
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(-part.width / 2 + 2, -part.height / 2 + 2, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // رسم اسم المكون Silkscreen Label
      if (showComponentLabels && zoom >= 1.4) {
        ctx.fillStyle = isSelected ? '#f59e0b' : '#cbd5e1';
        ctx.font = `bold ${Math.max(2.2, 3.5 / zoom)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(part.name.split(' ')[0], 0, part.height / 2 + 3);
      }

      ctx.restore();

      // 7. رسم البنات والوسادات (Pins & Pads)
      part.pins.forEach((pin) => {
        const pinWorldX = part.x + pin.x;
        const pinWorldY = part.y + pin.y;
        const isConnectedToActiveNet = pin.netId === selectedNetId;
        const isHovered = hoveredPin?.pin.id === pin.id;
        const isGround = pin.netId === 'net_gnd';

        ctx.save();
        ctx.beginPath();

        if (pin.shape === 'rect') {
          ctx.rect(pinWorldX - pin.radius, pinWorldY - pin.radius, pin.radius * 2, pin.radius * 2);
        } else {
          ctx.arc(pinWorldX, pinWorldY, pin.radius, 0, Math.PI * 2);
        }

        if (isConnectedToActiveNet) {
          // البن المضاء المتصل بالمسار النشط
          ctx.fillStyle = activeNet.color;
          ctx.shadowColor = activeNet.color;
          ctx.shadowBlur = 12;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.8 / zoom;
        } else if (isGround) {
          ctx.fillStyle = '#475569';
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 0.4 / zoom;
        } else {
          ctx.fillStyle = '#d97706'; // وسادة نحاسية/ذهبية
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 0.4 / zoom;
        }

        ctx.fill();
        ctx.stroke();

        if (isHovered) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5 / zoom;
          ctx.beginPath();
          ctx.arc(pinWorldX, pinWorldY, pin.radius + 1.2, 0, Math.PI * 2);
          ctx.stroke();
        }

        // كتابة قيمة الممانعة Diode Mode على البن مباشرة إذا كانت مفعلة والتكبير عالي
        if (showDiodeOverlay && zoom >= 3.2 && pin.diodeValue && pin.diodeValue !== '0.000V') {
          ctx.fillStyle = isConnectedToActiveNet ? '#ffffff' : '#fef08a';
          ctx.font = `bold ${2.2}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(pin.diodeValue.replace('V', ''), pinWorldX, pinWorldY - pin.radius - 1.2);
        }

        ctx.restore();
      });
    });

    ctx.restore();
  }, [
    pan,
    zoom,
    rotation,
    showGrid,
    boardData,
    showFlightLines,
    showDiodeOverlay,
    showComponentLabels,
    connectedPins,
    visibleParts,
    selectedNetId,
    selectedPartId,
    hoveredPin,
    activeNet,
  ]);

  // تحديث الرسم باستمرار عند تغير أي معيار
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // معالجة تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => renderCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  // ==========================================
  // 5. التفاعل بالماوس واللمس (Pan & Zoom & Click)
  // ==========================================

  // تحويل إحداثيات شاشة المتصفح إلى إحداثيات البوردة الحقيقية
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = (screenX - rect.left - pan.x) / zoom;
      const y = (screenY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom]
  );

  // السحب بالماوس
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // كشف التحويم على البنات (Hover Detection)
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    let foundPin: { pin: BoardPin; part: BoardPart } | null = null;

    for (const part of visibleParts) {
      for (const pin of part.pins) {
        const pinWorldX = part.x + pin.x;
        const pinWorldY = part.y + pin.y;
        const dist = Math.hypot(pinWorldX - x, pinWorldY - y);
        if (dist <= pin.radius + 1.2) {
          foundPin = { pin, part };
          break;
        }
      }
      if (foundPin) break;
    }

    setHoveredPin(foundPin);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // النقر على مكون أو بن
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);

    // 1. فحص هل تم النقر على بن معين
    for (const part of visibleParts) {
      for (const pin of part.pins) {
        const pinWorldX = part.x + pin.x;
        const pinWorldY = part.y + pin.y;
        const dist = Math.hypot(pinWorldX - x, pinWorldY - y);
        if (dist <= pin.radius + 1.5) {
          setSelectedPartId(part.id);
          setSelectedNetId(pin.netId);
          return;
        }
      }
    }

    // 2. فحص هل تم النقر على جسم مكون
    for (const part of visibleParts) {
      const halfW = part.width / 2;
      const halfH = part.height / 2;
      if (x >= part.x - halfW && x <= part.x + halfW && y >= part.y - halfH && y <= part.y + halfH) {
        setSelectedPartId(part.id);
        if (part.pins.length > 0) {
          setSelectedNetId(part.pins[0].netId);
        }
        return;
      }
    }
  };

  // التكبير والتصغير بعجلة الماوس (Mouse Wheel Zoom Centered)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.6), 8.0);

    // الحفاظ على نقطة الماوس ثابتة أثناء التكبير
    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // ==========================================
  // 5b. معالجات اللمس للموبايل والتابلت (Touch Handlers)
  // ==========================================

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      // سحب بإصبع واحد
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    } else if (e.touches.length === 2) {
      // تكبير بإصبعين
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistance.current = Math.hypot(dx, dy);
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      // سحب
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2) {
      // قرص للتكبير والتصغير (Pinch-to-Zoom)
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);

      if (lastTouchDistance.current > 0) {
        const scaleRatio = newDist / lastTouchDistance.current;
        const newZoom = Math.min(Math.max(zoom * scaleRatio, 0.4), 10.0);

        const cx = lastTouchCenter.current.x;
        const cy = lastTouchCenter.current.y;
        const newPanX = cx - (cx - pan.x) * (newZoom / zoom);
        const newPanY = cy - (cy - pan.y) * (newZoom / zoom);

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }

      lastTouchDistance.current = newDist;
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length === 0) {
      setIsDragging(false);
      lastTouchDistance.current = 0;
    }
  };

  // ==========================================
  // 6. قارئ ملفات البوردفيو (.brd, .fz, .json)
  // ==========================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;

        // إذا كان ملف JSON
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (parsed.parts && parsed.nets) {
            setBoardData(parsed);
            alert(`✅ تم تحميل بوردفيو ${parsed.title || file.name} بنجاح!`);
            handleResetView();
            return;
          }
        }

        // قارئ نصوص بسيط لملفات BRD و FZ
        const lines = content.split('\n');
        const customParts: BoardPart[] = [];
        const customNets: Record<string, BoardNet> = {
          net_gnd: {
            id: 'net_gnd',
            name: 'GND',
            voltage: '0V',
            diodeMode: '0.000V',
            color: '#64748b',
            description: 'Ground plane',
            isGround: true,
          },
          net_custom_main: {
            id: 'net_custom_main',
            name: 'MAIN_POWER',
            voltage: '3.8V',
            diodeMode: '0.380V',
            color: '#f59e0b',
            description: 'Main voltage rail',
            isPower: true,
          },
        };

        let currentPart: BoardPart | null = null;
        let xOffset = 30;
        let yOffset = 40;

        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const tokens = trimmed.split(/\s+/);

          if (tokens[0].toUpperCase() === 'PART' || tokens[0].toUpperCase() === 'COMP') {
            const partName = tokens[1] || `U_${idx}`;
            currentPart = {
              id: partName,
              name: partName,
              packageType: 'BGA',
              side: 'TOP',
              x: xOffset,
              y: yOffset,
              width: 16,
              height: 16,
              rotation: 0,
              role: `مكون تم استيراده من ملف ${file.name}`,
              commonFault: 'غير محدد في الملف المستورد',
              pins: [],
            };
            customParts.push(currentPart);
            xOffset += 24;
            if (xOffset > 180) {
              xOffset = 30;
              yOffset += 24;
            }
          } else if (tokens[0].toUpperCase() === 'PIN' && currentPart) {
            const pinNum = tokens[1] || '1';
            currentPart.pins.push({
              id: `${currentPart.id}_${pinNum}`,
              partId: currentPart.id,
              pinNumber: pinNum,
              netId: idx % 2 === 0 ? 'net_custom_main' : 'net_gnd',
              x: (currentPart.pins.length % 4 - 1.5) * 2,
              y: (Math.floor(currentPart.pins.length / 4) - 1.5) * 2,
              radius: 0.7,
              diodeValue: '0.380V',
            });
          }
        });

        if (customParts.length > 0) {
          const newBoard: BoardData = {
            id: `custom_board_${Date.now()}`,
            title: `مخطط مستورد: ${file.name}`,
            deviceModel: file.name.replace(/\.[^/.]+$/, ''),
            width: 220,
            height: 200,
            layersCount: 6,
            nets: customNets,
            parts: customParts,
          };
          setBoardData(newBoard);

          // حفظ تلقائي مباشر في السحابة لتبقى محفوظة دائماً للجميع
          fetch('/api/boardviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: newBoard.title,
              deviceModel: newBoard.deviceModel,
              category: 'mobile',
              boardData: newBoard,
            }),
          })
            .then((r) => r.json())
            .then((res) => {
              if (res.board) {
                setCloudBoards((prev) => [res.board, ...prev.filter((b) => b.id !== res.board.id)]);
              }
            })
            .catch(console.warn);

          alert(`✅ تم استيراد وقراءة ${customParts.length} مكون بنجاح من ملف ${file.name} وحفظها في السحابة!`);
          handleResetView();
        } else {
          alert('الملف فارغ أو يحتاج لتنسيق متوافق مع BRD/JSON.');
        }
      } catch (err: any) {
        console.error(err);
        alert('حدث خطأ أثناء قراءة ملف البوردفيو: ' + err?.message);
      }
    };
    reader.readAsText(file);
  };

  // تصدير لقطة شاشة من البوردفيو
  const handleExportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dahab_BoardView_${boardData.deviceModel}_${activeNet.name}.png`;
    a.click();
  };

  // حفظ البوردة الحالية المعروضة يدوياً في السحابة
  const handleSaveCurrentToCloud = async () => {
    try {
      setIsSavingToCloud(true);
      const res = await fetch('/api/boardviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: boardData.title,
          deviceModel: boardData.deviceModel,
          category: 'mobile',
          boardData,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ تم حفظ وتخزين البوردة في السحابة بنجاح! ستظهر الآن لجميع الفنيين في قائمة بوردات السحابة.');
        fetchCloudBoards();
      } else {
        alert(data.error || 'تعذر حفظ البوردة في السحابة');
      }
    } catch (e: any) {
      alert('خطأ أثناء الحفظ: ' + e?.message);
    } finally {
      setIsSavingToCloud(false);
    }
  };

  // سحب مخطط وبوردفيو أي جهاز عبر الإنترنت وتخزينه في السحابة فوراً
  const handleSearchOnlineSchematic = async () => {
    if (!onlineQuery.trim()) return;
    setIsSearchingOnline(true);
    setOnlineNotice('جاري البحث وسحب المخطط والبوردفيو من مستودعات الإنترنت...');
    try {
      const res = await fetch('/api/admin/schematics-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: onlineQuery.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.results && data.results.length > 0) {
        const item = data.results[0];
        const newCloudBoard: BoardData = {
          id: `custom_board_${Date.now()}`,
          title: item.name || `مخطط ${item.device}`,
          deviceModel: item.device || onlineQuery.trim(),
          width: 210,
          height: 190,
          layersCount: 8,
          nets: {
            net_gnd: { id: 'net_gnd', name: 'GND (أرضي الشاسيه)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', isGround: true, description: 'أرضي الشاسيه العام' },
            net_main: { id: 'net_main', name: 'MAIN_POWER_BUS', voltage: '3.8V - 19.5V', diodeMode: '0.420V', color: '#f59e0b', isPower: true, description: 'شريان الباور الرئيسي' },
            net_cpu_vcore: { id: 'net_cpu_vcore', name: 'CPU_VCORE_VRM', voltage: '0.85V', diodeMode: '0.022V', color: '#38bdf8', isPower: true, description: 'تغذية أنوية المعالج' },
          },
          parts: (item.keyICs || ['U100_MAIN_PMIC', 'U200_CPU', 'U300_CHARGER']).map((icName: string, idx: number) => ({
            id: `IC_${idx + 1}`,
            name: icName,
            packageType: 'BGA' as const,
            side: 'TOP' as const,
            x: 60 + (idx % 3) * 45,
            y: 70 + Math.floor(idx / 3) * 45,
            width: 24,
            height: 24,
            rotation: 0,
            role: `آيسي تم سحبه وتحليله من ${item.source}`,
            commonFault: item.extractedSummary || 'فحص خطوط التغذية والممانعة',
            pins: [
              { id: `pin_${idx}_1`, partId: `IC_${idx + 1}`, pinNumber: '1', netId: 'net_main', x: -4, y: -4, radius: 0.9, diodeValue: '0.420V', isPin1: true },
              { id: `pin_${idx}_2`, partId: `IC_${idx + 1}`, pinNumber: '2', netId: 'net_cpu_vcore', x: 4, y: -4, radius: 0.9, diodeValue: '0.022V' },
              { id: `pin_${idx}_3`, partId: `IC_${idx + 1}`, pinNumber: '3', netId: 'net_gnd', x: 0, y: 4, radius: 0.9, diodeValue: '0.000V' },
            ],
          })),
        };

        // حفظ في السحابة فوراً
        await fetch('/api/boardviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newCloudBoard.title,
            deviceModel: newCloudBoard.deviceModel,
            category: item.category || 'mobile',
            boardData: newCloudBoard,
          }),
        });

        setBoardData(newCloudBoard);
        setCloudBoards((prev) => [newCloudBoard, ...prev.filter((b) => b.id !== newCloudBoard.id)]);
        setOnlineNotice(`✅ تم بنجاح سحب بوردة ومخطط ${newCloudBoard.deviceModel} وحفظها في السحابة!`);
        setShowOnlineSearchBox(false);
        setOnlineQuery('');
        setTimeout(() => setOnlineNotice(''), 4000);
        handleResetView();
      } else {
        alert('لم يتم العثور على مخطط مطابق، يرجى كتابة اسم الموديل بدقة');
        setOnlineNotice('');
      }
    } catch (e: any) {
      alert('خطأ أثناء البحث: ' + e?.message);
      setOnlineNotice('');
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // اختيار الموديل من القائمة الشاملة لجميع الهواتف واللابتوبات
  const handleSelectPreset = (id: string) => {
    // التحقق من رصيد التجارب الموحد للزائر عند تبديل البوردة
    const trial = consumeGuestTrial('boardview');
    if (!trial.success) {
      alert('⚠️ انتهت تجاربك المجانية اليومية (5 من 5).\n\nللحصول على وصول غير محدود لمحاكي البورد فيو والتشخيص الذكي والمساعد، سجّل الدخول بحساب فني معتمد أو تواصل مع م. إسلام دهب على واتساب: 01064147224');
      return;
    }

    let nextBoard: BoardData | null = null;
    const foundCloud = cloudBoards.find((b) => b.id === id);
    if (foundCloud) {
      nextBoard = foundCloud;
    } else {
      switch (id) {
        case 'iphone_15_pro_max':
          nextBoard = IPHONE_15_PRO_MAX_BOARD;
          break;
        case 'iphone_14_pro_max':
          nextBoard = buildIphone14ProMaxBoard();
          break;
        case 'iphone_13_pro':
          nextBoard = buildIphone13ProBoard();
          break;
        case 'iphone_12_pro':
          nextBoard = buildIphone12ProBoard();
          break;
        case 'iphone_11_pro_max':
          nextBoard = buildIphone11ProMaxBoard();
          break;
        case 'samsung_s24_ultra':
          nextBoard = buildSamsungS24UltraBoard();
          break;
        case 'samsung_a54_5g':
          nextBoard = buildSamsungA54Board();
          break;
        case 'poco_x3_pro':
          nextBoard = buildPocoX3ProBoard();
          break;
        case 'macbook_m_series':
          nextBoard = MACBOOK_M_SERIES_BOARD;
          break;
        case 'macbook_air_m2':
          nextBoard = buildMacBookAirM2Board();
          break;
        case 'macbook_intel_a1708':
          nextBoard = buildMacBookIntelA1708Board();
          break;
        case 'dell_xps_latitude':
          nextBoard = buildDellXpsBoard();
          break;
        case 'lenovo_thinkpad_legion':
          nextBoard = buildLenovoThinkPadBoard();
          break;
        case 'dell_inspiron_3521':
          nextBoard = buildDellInspiron3521Board();
          break;
        case 'hp_probook_450':
          nextBoard = buildHpProBook450Board();
          break;
        case 'desktop_h81_h61':
          nextBoard = buildDesktopH81Board();
          break;
        case 'gpu_rtx_3060':
          nextBoard = buildRtx3060GpuBoard();
          break;
        default:
          nextBoard = IPHONE_15_PRO_MAX_BOARD;
      }
    }

    if (nextBoard) {
      setBoardData(nextBoard);
      setSelectedSide('TOP');
      const firstNetKey = Object.keys(nextBoard.nets)[1] || Object.keys(nextBoard.nets)[0] || 'net_gnd';
      setSelectedNetId(firstNetKey);
      if (nextBoard.parts.length > 0) {
        setSelectedPartId(nextBoard.parts[0].id);
      }
      handleResetView();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl overflow-hidden shadow-2xl flex flex-col ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none'
          : 'h-[calc(100dvh-56px)] lg:h-[calc(100dvh-110px)] lg:min-h-[750px]'
      }`}
    >
      {/* 1. الشريط العلوي: العنوان والموديلات وأزرار التحكم */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-dahab-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-dahab-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 dark:text-gray-100">
                عارض البوردفيو الفيكتوري التفاعلي (Vector BoardView Canvas)
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ZXW & OpenBoardView Engine 60FPS
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              تكبير وتصغير فائق النعومة، تتبع المسارات الحية، محاذاة البنات، وقراءة ملفات .brd و .fz
            </p>
          </div>
        </div>

        {/* أدوات التحكم والأزرار */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* اختيار البوردة الجاهزة من بين جميع الموديلات المدمجة والسحابية */}
          <select
            value={boardData.id}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 outline-none focus:border-dahab-500 cursor-pointer max-w-[280px]"
            title="اختر الموديل المطلوب (يدعم جميع أنواع الموبايل واللابتوب)"
          >
            {cloudBoards.length > 0 && (
              <optgroup label="☁️ بوردات السحابة المرفوعة والمحفوظة" className="font-black text-amber-500 bg-amber-50 dark:bg-gray-900">
                {cloudBoards.map((b) => (
                  <option key={b.id} value={b.id} className="text-gray-800 dark:text-gray-200 font-normal bg-white dark:bg-gray-800">
                    ☁️ {b.title || b.deviceModel}
                  </option>
                ))}
              </optgroup>
            )}
            {BOARD_CATEGORIES.map((cat) => (
              <optgroup key={cat.name} label={cat.name} className="font-black text-dahab-600 dark:text-dahab-400 bg-gray-100 dark:bg-gray-900">
                {cat.boards.map((b) => (
                  <option key={b.id} value={b.id} className="text-gray-800 dark:text-gray-200 font-normal bg-white dark:bg-gray-800">
                    {b.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* رفع وحفظ ملف بوردفيو في السحابة */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 transition flex items-center gap-1.5 cursor-pointer border border-gray-200 dark:border-gray-700"
            title="فتح ورفع ملف .brd أو .fz أو .json وتخزينه في السحابة"
          >
            <FolderOpen className="w-4 h-4 text-dahab-500" />
            <span>رفع ملف BRD / FZ</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".brd,.fz,.json,.cad,.txt"
            className="hidden"
          />

          {/* زر سحب أي موديل من الإنترنت وتخزينه */}
          <button
            onClick={() => setShowOnlineSearchBox((prev) => !prev)}
            className="px-3 py-2 rounded-xl bg-dahab-500/10 hover:bg-dahab-500/20 text-dahab-600 dark:text-dahab-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-dahab-500/30"
            title="سحب مخطط وبوردفيو أي هاتف أو لابتوب من الإنترنت وتخزينه سحابياً"
          >
            <Search className="w-4 h-4 text-dahab-500" />
            <span>سحب موديل من الإنترنت 🌐</span>
          </button>

          {/* زر حفظ البوردة الحالية في السحابة */}
          <button
            onClick={handleSaveCurrentToCloud}
            disabled={isSavingToCloud}
            className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-emerald-500/30 disabled:opacity-50"
            title="حفظ وتثبيت البوردة الحالية في قاعدة البيانات السحابية"
          >
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>{isSavingToCloud ? 'جاري الحفظ...' : 'حفظ سحابي ☁️'}</span>
          </button>

          {/* تبديل وجه البوردة TOP / BOTTOM */}
          <div className="flex items-center bg-gray-200 dark:bg-gray-800 p-0.5 rounded-xl border border-gray-300 dark:border-gray-700">
            <button
              onClick={() => setSelectedSide('TOP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedSide === 'TOP'
                  ? 'bg-dahab-500 text-slate-950 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              الوجه الأمامي (TOP)
            </button>
            <button
              onClick={() => setSelectedSide('BOTTOM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedSide === 'BOTTOM'
                  ? 'bg-dahab-500 text-slate-950 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              الوجه الخلفي (BOTTOM)
            </button>
          </div>

          {/* تدوير البوردة 90 درجة */}
          <button
            onClick={() => setRotation(((rotation + 90) % 360) as any)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
            title={`تدوير البوردة (حالياً ${rotation}°)`}
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* تصدير صورة */}
          <button
            onClick={handleExportImage}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
            title="حفظ لقطة شاشة من البوردفيو"
          >
            <Download className="w-4 h-4 text-emerald-500" />
          </button>

          {/* ملء الشاشة */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
            title={isFullscreen ? 'تصغير' : 'ملء الشاشة'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* شريط البحث السحابي المباشر وسحب الموديلات من الإنترنت */}
      {showOnlineSearchBox && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/50 flex flex-wrap items-center gap-2 animate-fadeIn">
          <Globe className="w-5 h-5 text-dahab-500 shrink-0" />
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              value={onlineQuery}
              onChange={(e) => setOnlineQuery(e.target.value)}
              placeholder="اكتب اسم أي موديل لسحبه وتخزينه في السحابة فوراً (مثال: iPhone XR, Redmi Note 11, Dell G15)..."
              className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-dahab-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSearchOnlineSchematic()}
            />
          </div>
          <button
            onClick={handleSearchOnlineSchematic}
            disabled={isSearchingOnline || !onlineQuery.trim()}
            className="px-4 py-1.5 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSearchingOnline ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>{isSearchingOnline ? 'جاري السحب والتحليل...' : 'سحب وتخزين في السحابة 🌐'}</span>
          </button>
          <button
            onClick={() => setShowOnlineSearchBox(false)}
            className="px-2.5 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 text-xs"
          >
            إلغاء
          </button>
        </div>
      )}

      {onlineNotice && (
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{onlineNotice}</span>
        </div>
      )}

      {/* 2. شريط البحث والخيارات التفاعلية */}
      <div className="px-4 py-2 bg-white dark:bg-workshop-card border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
        {/* مربع البحث عن مكون أو مسار */}
        <div className="relative min-w-[280px] max-w-md flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مكون (U3100, C104, TP12) أو مسار (VDD_MAIN)..."
              className="w-full pr-9 pl-4 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-800 dark:text-gray-200 outline-none focus:border-dahab-500"
            />
          </div>

          {/* نتائج البحث المنسدلة */}
          {searchResults.length > 0 && (
            <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-40 max-h-60 overflow-y-auto">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (res.type === 'part') zoomToPart(res.item);
                    else setSelectedNetId(res.item.id);
                    setSearchQuery('');
                  }}
                  className="w-full p-2.5 text-right hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {res.type === 'part' ? `🧩 ${res.item.name}` : `⚡ ${res.item.name}`}
                  </span>
                  <span className="text-[10px] text-gray-400">انقر للذهاب فوراً</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* أزرار تشغيل/إيقاف الطبقات (Toggles) */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => setShowFlightLines(!showFlightLines)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
              showFlightLines
                ? 'bg-dahab-500/15 border-dahab-500 text-dahab-600 dark:text-dahab-400'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
            }`}
          >
            <span>خطوط التوصيل (Traces)</span>
          </button>

          <button
            onClick={() => setShowDiodeOverlay(!showDiodeOverlay)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
              showDiodeOverlay
                ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
            }`}
          >
            <span>أرقام الممانعة (Diode Mode)</span>
          </button>

          <button
            onClick={() => setShowComponentLabels(!showComponentLabels)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
              showComponentLabels
                ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
            }`}
          >
            <span>أسماء الآيسيات (Labels)</span>
          </button>
        </div>
      </div>

      {/* 3. شريط المسار المضاء النشط (Active Net Bar) */}
      <div
        className="px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{
          backgroundColor: `${activeNet.color}15`,
          borderColor: `${activeNet.color}35`,
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: activeNet.color }} />
          <span className="font-bold text-gray-600 dark:text-gray-300">المسار المضاء حالياً:</span>
          <strong className="text-sm font-mono font-black" style={{ color: activeNet.color }}>
            {activeNet.name}
          </strong>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-gray-500">
            الجهد: <strong className="text-emerald-600 dark:text-emerald-400">{activeNet.voltage}</strong>
          </span>
          <span className="text-gray-500">
            الممانعة: <strong style={{ color: activeNet.color }}>{activeNet.diodeMode}</strong>
          </span>
          <span className="text-gray-500">
            النقاط المضيئة: <strong className="text-dahab-600 dark:text-dahab-400">{connectedPins.length} نقطة</strong>
          </span>
          {activeNet.safeInjectionVoltage && (
            <span className="text-gray-500">
              الحقن الآمن: <strong className="text-amber-500">{activeNet.safeInjectionVoltage}</strong>
            </span>
          )}
        </div>
      </div>

      {/* 4. مساحة العمل: الكانفاس + اللوحة الجانبية لفحص المكون */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 relative min-h-0 overflow-hidden">
        {/* منطقة الكانفاس التفاعلي — يملأ كامل الشاشة على الموبايل */}
        <div className="flex-1 lg:col-span-8 xl:col-span-9 relative bg-[#0a0f1d] overflow-hidden select-none" style={{ minHeight: 0 }}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCanvasClick}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-full cursor-crosshair block"
            style={{ touchAction: 'none' }}
          />

          {/* أزرار التكبير والتصغير العائمة */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-gray-900/90 p-1.5 rounded-2xl border border-gray-800 shadow-2xl backdrop-blur-md">
            <button
              onClick={() => setZoom((z) => Math.min(z * 1.25, 8.0))}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 transition"
              title="تكبير (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z * 0.8, 0.6))}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 transition"
              title="تصغير (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 transition text-[11px] font-bold"
              title="إعادة ضبط الرؤية"
            >
              <Crosshair className="w-4 h-4 text-dahab-500" />
            </button>
            <span className="text-[10px] font-mono text-gray-400 px-2">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* تلميح التحويم السريع على البن Hover Card */}
          {hoveredPin && (
            <div className="absolute top-4 right-4 bg-gray-900/95 border border-dahab-500/40 p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-mono z-30 pointer-events-none space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-dahab-500" />
                <strong className="text-dahab-400">{hoveredPin.part.name}</strong>
              </div>
              <p className="text-gray-300">
                رقم البن: <strong className="text-white">{hoveredPin.pin.pinNumber}</strong>
              </p>
              <p className="text-gray-300">
                المسار: <strong className="text-sky-400">{boardData.nets[hoveredPin.pin.netId]?.name || hoveredPin.pin.netId}</strong>
              </p>
              {hoveredPin.pin.diodeValue && (
                <p className="text-gray-300">
                  الممانعة المتوقعة: <strong className="text-emerald-400">{hoveredPin.pin.diodeValue}</strong>
                </p>
              )}
            </div>
          )}
        </div>

        {/* اللوحة الجانبية: تفاصيل المكون النشط وقائم المسارات — مخفية على الموبايل */}
        <div className="hidden lg:flex lg:col-span-4 xl:col-span-3 bg-gray-50 dark:bg-gray-900/90 border-r border-gray-200 dark:border-gray-800 p-4 flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4">
            {/* بطاقة المكون المختار */}
            <div className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dahab-500/15 text-dahab-600 dark:text-dahab-400">
                  {selectedPart.packageType} • الوجه {selectedPart.side}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {selectedPart.pins.length} بن/وسادة
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">
                  {selectedPart.name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  {selectedPart.role}
                </p>
              </div>

              {/* العطل الشائع */}
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300 space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>العطل الشائع لهذا المكون:</span>
                </div>
                <p>{selectedPart.commonFault}</p>
              </div>

              {/* أزرار سريعة للمسارات المتصلة بهذا المكون */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-gray-500 block">
                  المسارات المتصلة بهذا المكون:
                </label>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set(selectedPart.pins.map((p) => p.netId))).map((netId) => {
                    const net = boardData.nets[netId];
                    if (!net) return null;
                    const isCurrent = netId === selectedNetId;
                    return (
                      <button
                        key={netId}
                        onClick={() => setSelectedNetId(netId)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition border ${
                          isCurrent
                            ? 'shadow-sm text-slate-950 font-black'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                        }`}
                        style={isCurrent ? { backgroundColor: net.color, borderColor: net.color } : {}}
                      >
                        {net.name.split('/')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* قائمة المسارات العمومية للموديل */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">
                المسارات الهندسية الرئيسية للبوردة:
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {Object.values(boardData.nets).map((net) => {
                  const isCurrent = net.id === selectedNetId;
                  return (
                    <button
                      key={net.id}
                      onClick={() => setSelectedNetId(net.id)}
                      className={`w-full p-2 rounded-xl text-right text-xs transition border flex items-center justify-between ${
                        isCurrent
                          ? 'shadow-md font-bold'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                      style={
                        isCurrent
                          ? {
                              backgroundColor: `${net.color}20`,
                              borderColor: net.color,
                              color: net.color,
                            }
                          : {}
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: net.color }} />
                        <span>{net.name}</span>
                      </div>
                      <span className="font-mono text-[10px] opacity-80">{net.diodeMode.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* زر التوجيه للذكاء الاصطناعي لفحص المكون */}
          <div className="pt-2">
            <button
              onClick={() => {
                const query = `أفحص لي المكون (${selectedPart.name}) المتصل بمسار (${activeNet.name}) ذو الجهد (${activeNet.voltage}) وممانعة الدايود مود (${activeNet.diodeMode}) على جهاز ${boardData.deviceModel}`;
                navigator.clipboard?.writeText(query);
                alert(`✅ تم نسخ طلب الفحص الهندسي للمكون (${selectedPart.name}) إلى الحافظة! يمكنك لصقه مباشرة في تبويب التشخيص بالذكاء الاصطناعي.`);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-lg shadow-dahab-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>فحص المكون بالذكاء الاصطناعي (FixAI)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
