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
  X,
} from 'lucide-react';
import {
  BOARD_CATEGORIES,
  buildIphone14ProMaxBoard,
  buildIphone15ProBoard,
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
import { useDiagnosticContext } from '@/contexts/DiagnosticContext';
import dynamic from 'next/dynamic';

// Dynamic import for KonvaBoardview to avoid SSR issues
const KonvaBoardview = dynamic(() => import('./KonvaBoardview'), { ssr: false });

// Dynamic import for PixiBoardviewViewer to avoid SSR issues
const PixiBoardviewViewer = dynamic(() => import('./PixiBoardviewViewer'), { ssr: false });

// Dynamic import for BoardviewModal to avoid SSR issues
const BoardviewModal = dynamic(() => import('./BoardviewModal'), { ssr: false });

import { convertBoardDataToParsed } from '@/lib/boardviewParser';

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

// --- Preset 3: Samsung Galaxy S24 Ultra Logic Board ---
const SAMSUNG_S24_ULTRA_BOARD: BoardData = (() => {
  const nets: Record<string, BoardNet> = {
    net_gnd: {
      id: 'net_gnd',
      name: 'GND (System Ground)',
      voltage: '0.00V',
      diodeMode: '0.000V',
      color: '#64748b',
      description: 'أرضي الشاسيه العام للهاتف',
      isGround: true,
      safeInjectionVoltage: 'لا يحقن',
    },
    net_vbat_main: {
      id: 'net_vbat_main',
      name: 'VBAT_MAIN (Battery Main)',
      voltage: '3.7V - 4.4V',
      diodeMode: '0.380V - 0.450V',
      color: '#f59e0b',
      description: 'خط البطارية الرئيسي إلى PMIC',
      isPower: true,
      safeInjectionVoltage: '3.8V (حد أقصى 2A)',
    },
    net_vbus: {
      id: 'net_vbus',
      name: 'VBUS_USB_C (5V - 9V)',
      voltage: '5.0V / 9.0V',
      diodeMode: '0.520V - 0.580V',
      color: '#10b981',
      description: 'دخل شاحن USB-C',
      isPower: true,
      safeInjectionVoltage: '5.0V (حد أقصى 1.5A)',
    },
    net_vdd_cpu: {
      id: 'net_vdd_cpu',
      name: 'VDD_CPU (Snapdragon 8 Gen 3)',
      voltage: '0.75V - 0.95V',
      diodeMode: '0.015V - 0.035V',
      color: '#38bdf8',
      description: 'تغذية المعالج Snapdragon 8 Gen 3',
      isPower: true,
      safeInjectionVoltage: '0.8V فقط!',
    },
    net_vdd_emmc: {
      id: 'net_vdd_emmc',
      name: 'VDD_EMMC/UFS (Storage)',
      voltage: '1.80V - 2.95V',
      diodeMode: '0.320V - 0.380V',
      color: '#a855f7',
      description: 'تغذية ذاكرة UFS 4.0',
      isPower: true,
      safeInjectionVoltage: '1.8V (حد أقصى 1A)',
    },
    net_1v8: {
      id: 'net_1v8',
      name: 'PP1V8_ALWAYS',
      voltage: '1.80V',
      diodeMode: '0.340V - 0.390V',
      color: '#ec4899',
      description: 'فولت الإقلاع الدائم',
      isPower: true,
      safeInjectionVoltage: '1.8V (حد أقصى 1A)',
    },
  };

  const parts: BoardPart[] = [];

  // Snapdragon 8 Gen 3 SoC
  const cpuPins: BoardPin[] = [];
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 12; c++) {
      let netId = 'net_gnd';
      let diode = '0.000V';
      if ((r >= 3 && r <= 6) && (c >= 3 && c <= 6)) {
        netId = 'net_vdd_cpu';
        diode = '0.022V';
      } else if (r === 0 || c === 0) {
        netId = 'net_1v8';
        diode = '0.360V';
      }
      cpuPins.push({
        id: `cpu_pin_${r}_${c}`,
        partId: 'U1000_CPU',
        pinNumber: `${String.fromCharCode(65 + r)}${c + 1}`,
        netId,
        x: (c - 5.5) * 2.0,
        y: (r - 5.5) * 2.0,
        radius: 0.6,
        diodeValue: diode,
        isPin1: r === 0 && c === 0,
      });
    }
  }

  parts.push({
    id: 'U1000_CPU',
    name: 'Snapdragon 8 Gen 3 (U1000)',
    packageType: 'BGA',
    side: 'TOP',
    x: 130,
    y: 110,
    width: 32,
    height: 32,
    rotation: 0,
    role: 'المعالج الرئيسي للهاتف',
    commonFault: 'سخونة شديدة بعد تحديث النظام أو شورت على خطوط VCORE',
    pins: cpuPins,
  });

  // PMIC S2MPS51
  parts.push({
    id: 'U2000_PMIC',
    name: 'PMIC S2MPS51 (U2000)',
    packageType: 'BGA',
    side: 'TOP',
    x: 80,
    y: 110,
    width: 22,
    height: 22,
    rotation: 0,
    role: 'إدارة الطاقة الرئيسية',
    commonFault: 'سحب تيار 0.05A متجمد بعد الضغط على زر الباور',
    pins: [
      { id: 'pmic_p1', partId: 'U2000_PMIC', pinNumber: '1', netId: 'net_vbat_main', x: -6, y: -6, radius: 0.8, diodeValue: '0.410V', isPin1: true },
      { id: 'pmic_p2', partId: 'U2000_PMIC', pinNumber: '2', netId: 'net_vbus', x: 6, y: -6, radius: 0.8, diodeValue: '0.550V' },
      { id: 'pmic_p3', partId: 'U2000_PMIC', pinNumber: '3', netId: 'net_gnd', x: 0, y: 0, radius: 0.8, diodeValue: '0.000V' },
      { id: 'pmic_p4', partId: 'U2000_PMIC', pinNumber: '4', netId: 'net_vdd_cpu', x: -6, y: 6, radius: 0.8, diodeValue: '0.025V' },
      { id: 'pmic_p5', partId: 'U2000_PMIC', pinNumber: '5', netId: 'net_1v8', x: 6, y: 6, radius: 0.8, diodeValue: '0.360V' },
    ],
  });

  // UFS 4.0 Storage
  parts.push({
    id: 'U3000_UFS',
    name: 'UFS 4.0 512GB (U3000)',
    packageType: 'BGA',
    side: 'TOP',
    x: 170,
    y: 110,
    width: 20,
    height: 18,
    rotation: 0,
    role: 'ذاكرة التخزين السريعة',
    commonFault: 'تلف بسبب سقوط أو دخول سوائل - خطأ 4013',
    pins: [
      { id: 'ufs_p1', partId: 'U3000_UFS', pinNumber: '1', netId: 'net_vdd_emmc', x: -5, y: -4, radius: 0.7, diodeValue: '0.350V', isPin1: true },
      { id: 'ufs_p2', partId: 'U3000_UFS', pinNumber: '2', netId: 'net_1v8', x: 5, y: -4, radius: 0.7, diodeValue: '0.360V' },
      { id: 'ufs_p3', partId: 'U3000_UFS', pinNumber: '3', netId: 'net_gnd', x: 0, y: 0, radius: 0.7, diodeValue: '0.000V' },
    ],
  });

  // Charging IC
  parts.push({
    id: 'U4000_CHG',
    name: 'Charging IC (U4000)',
    packageType: 'QFN',
    side: 'TOP',
    x: 80,
    y: 160,
    width: 16,
    height: 16,
    rotation: 0,
    role: 'إدارة الشحن والـ USB-C',
    commonFault: 'سخونة قبل تشغيل الهاتف (Short Before Power)',
    pins: [
      { id: 'chg_p1', partId: 'U4000_CHG', pinNumber: '1', netId: 'net_vbus', x: -5, y: -5, radius: 0.8, diodeValue: '0.550V', isPin1: true },
      { id: 'chg_p2', partId: 'U4000_CHG', pinNumber: '2', netId: 'net_vbat_main', x: 5, y: -5, radius: 0.8, diodeValue: '0.410V' },
      { id: 'chg_p3', partId: 'U4000_CHG', pinNumber: '3', netId: 'net_gnd', x: 0, y: 0, radius: 0.8, diodeValue: '0.000V' },
    ],
  });

  // Capacitors (Bypass caps) - increased for more realism
  const caps = [
    { id: 'C2001', x: 95, y: 90, net: 'net_vbat_main', diode: '0.410V' },
    { id: 'C2002', x: 95, y: 100, net: 'net_vbat_main', diode: '0.410V' },
    { id: 'C2003', x: 95, y: 120, net: 'net_vdd_cpu', diode: '0.025V' },
    { id: 'C2004', x: 95, y: 130, net: 'net_1v8', diode: '0.360V' },
    { id: 'C2005', x: 145, y: 90, net: 'net_vdd_cpu', diode: '0.025V' },
    { id: 'C2006', x: 155, y: 90, net: 'net_vdd_cpu', diode: '0.025V' },
    { id: 'C2007', x: 145, y: 130, net: 'net_vdd_emmc', diode: '0.350V' },
    { id: 'C2008', x: 155, y: 130, net: 'net_vdd_emmc', diode: '0.350V' },
    { id: 'C2009', x: 65, y: 90, net: 'net_vbus', diode: '0.550V' },
    { id: 'C2010', x: 65, y: 130, net: 'net_1v8', diode: '0.360V' },
  ];

  caps.forEach((cap) => {
    parts.push({
      id: cap.id,
      name: `${cap.id} (مكثف)`,
      packageType: '0402',
      side: 'TOP',
      x: cap.x,
      y: cap.y,
      width: 4,
      height: 2.5,
      rotation: 0,
      role: `مكثف تنعيم على ${cap.net}`,
      commonFault: 'انهيار عازلية وشورت على الأرضي',
      pins: [
        { id: `${cap.id}_p1`, partId: cap.id, pinNumber: '1', netId: cap.net, x: -1.2, y: 0, radius: 0.6, shape: 'rect', diodeValue: cap.diode },
        { id: `${cap.id}_p2`, partId: cap.id, pinNumber: '2', netId: 'net_gnd', x: 1.2, y: 0, radius: 0.6, shape: 'rect', diodeValue: '0.000V' },
      ],
    });
  });

  // Test Points - increased for more realism
  const testPoints = [
    { id: 'TP_VBAT', name: 'TP_VBAT', x: 100, y: 150, net: 'net_vbat_main', diode: '0.410V' },
    { id: 'TP_VBUS', name: 'TP_VBUS', x: 50, y: 160, net: 'net_vbus', diode: '0.550V' },
    { id: 'TP_CPU', name: 'TP_CPU', x: 145, y: 95, net: 'net_vdd_cpu', diode: '0.025V' },
    { id: 'TP_1V8', name: 'TP_1V8', x: 60, y: 80, net: 'net_1v8', diode: '0.360V' },
    { id: 'TP_UFS', name: 'TP_UFS', x: 170, y: 130, net: 'net_vdd_emmc', diode: '0.350V' },
  ];

  testPoints.forEach((tp) => {
    parts.push({
      id: tp.id,
      name: tp.name,
      packageType: 'TEST_POINT',
      side: 'TOP',
      x: tp.x,
      y: tp.y,
      width: 3,
      height: 3,
      rotation: 0,
      role: 'نقطة فحص',
      commonFault: 'تآكل أو تلف',
      pins: [
        { id: `${tp.id}_pin`, partId: tp.id, pinNumber: 'TP', netId: tp.net, x: 0, y: 0, radius: 1, diodeValue: tp.diode },
      ],
    });
  });

  // Add Resistors for realism
  const resistors = [
    { id: 'R3001', x: 70, y: 140, net: 'net_vbus', diode: '0.550V', role: 'Current Sense Resistor' },
    { id: 'R3002', x: 90, y: 140, net: 'net_vbat_main', diode: '0.410V', role: 'Battery Sense Resistor' },
    { id: 'R3003', x: 75, y: 85, net: 'net_1v8', diode: '0.360V', role: 'Pull-up Resistor' },
    { id: 'R3004', x: 85, y: 85, net: 'net_1v8', diode: '0.360V', role: 'Pull-up Resistor' },
  ];

  resistors.forEach((res) => {
    parts.push({
      id: res.id,
      name: `${res.id} (مقاومة)`,
      packageType: '0402',
      side: 'TOP',
      x: res.x,
      y: res.y,
      width: 3,
      height: 1.5,
      rotation: 0,
      role: res.role,
      commonFault: 'احتراق أو تغيير قيمة',
      pins: [
        { id: `${res.id}_p1`, partId: res.id, pinNumber: '1', netId: res.net, x: -0.8, y: 0, radius: 0.5, shape: 'rect', diodeValue: res.diode },
        { id: `${res.id}_p2`, partId: res.id, pinNumber: '2', netId: 'net_gnd', x: 0.8, y: 0, radius: 0.5, shape: 'rect', diodeValue: '0.000V' },
      ],
    });
  });

  // Add Inductors for realism
  const inductors = [
    { id: 'L3001', x: 110, y: 140, net: 'net_vbat_main', diode: '0.410V', role: 'Power Inductor' },
    { id: 'L3002', x: 140, y: 110, net: 'net_vdd_cpu', diode: '0.025V', role: 'CPU Power Inductor' },
  ];

  inductors.forEach((ind) => {
    parts.push({
      id: ind.id,
      name: `${ind.id} (ملف)`,
      packageType: 'COIL',
      side: 'TOP',
      x: ind.x,
      y: ind.y,
      width: 8,
      height: 6,
      rotation: 0,
      role: ind.role,
      commonFault: 'كسر في الملف أو شورت',
      pins: [
        { id: `${ind.id}_p1`, partId: ind.id, pinNumber: '1', netId: ind.net, x: -3, y: 0, radius: 1, diodeValue: ind.diode },
        { id: `${ind.id}_p2`, partId: ind.id, pinNumber: '2', netId: ind.net, x: 3, y: 0, radius: 1, diodeValue: ind.diode },
      ],
    });
  });

  // Add USB-C Connector
  parts.push({
    id: 'J5000_USBC',
    name: 'USB-C Connector (J5000)',
    packageType: 'CONNECTOR',
    side: 'TOP',
    x: 30,
    y: 160,
    width: 12,
    height: 20,
    rotation: 0,
    role: 'منفذ الشحن USB-C',
    commonFault: 'تلف البنات بسبب شد الكابل',
    pins: [
      { id: 'usbc_1', partId: 'J5000_USBC', pinNumber: '1', netId: 'net_vbus', x: 0, y: -6, radius: 0.8, diodeValue: '0.550V' },
      { id: 'usbc_2', partId: 'J5000_USBC', pinNumber: '2', netId: 'net_vbus', x: 0, y: -3, radius: 0.8, diodeValue: '0.550V' },
      { id: 'usbc_3', partId: 'J5000_USBC', pinNumber: '3', netId: 'net_gnd', x: 0, y: 0, radius: 0.8, diodeValue: '0.000V' },
      { id: 'usbc_4', partId: 'J5000_USBC', pinNumber: '4', netId: 'net_1v8', x: 0, y: 3, radius: 0.8, diodeValue: '0.360V' },
      { id: 'usbc_5', partId: 'J5000_USBC', pinNumber: '5', netId: 'net_gnd', x: 0, y: 6, radius: 0.8, diodeValue: '0.000V' },
    ],
  });

  return {
    id: 'samsung_s24_ultra',
    title: 'Samsung Galaxy S24 Ultra Logic Board',
    deviceModel: 'Samsung Galaxy S24 Ultra (SM-S928B)',
    width: 200,
    height: 210,
    layersCount: 10,
    nets,
    parts,
    outlinePoints: [
      { x: 15, y: 35 },
      { x: 185, y: 35 },
      { x: 185, y: 180 },
      { x: 40, y: 180 },
      { x: 40, y: 165 },
      { x: 15, y: 165 },
    ],
  };
})();

// --- Preset 4: Dell Latitude 5420 Logic Board ---
const DELL_LATITUDE_5420_BOARD: BoardData = (() => {
  const nets: Record<string, BoardNet> = {
    net_gnd: {
      id: 'net_gnd',
      name: 'GND (System Ground)',
      voltage: '0.00V',
      diodeMode: '0.000V',
      color: '#64748b',
      description: 'أرضي الشاسيه العام لللابتوب',
      isGround: true,
      safeInjectionVoltage: 'لا يحقن',
    },
    net_ppdcin: {
      id: 'net_ppdcin',
      name: 'PPDCIN_CHARGING (19.5V)',
      voltage: '19.0V - 19.5V',
      diodeMode: '0.420V - 0.480V',
      color: '#f59e0b',
      description: 'دخل الشاحن 19.5V من كونكتور DC-IN',
      isPower: true,
      safeInjectionVoltage: '19.0V (حد أقصى 3A)',
    },
    net_ppvccsa: {
      id: 'net_ppvccsa',
      name: 'PPVCCSA_CPU (System Agent)',
      voltage: '0.95V - 1.05V',
      diodeMode: '0.015V - 0.030V',
      color: '#38bdf8',
      description: 'تغذية System Agent للمعالج Intel',
      isPower: true,
      safeInjectionVoltage: '1.0V فقط!',
    },
    net_pp3v3_s5: {
      id: 'net_pp3v3_s5',
      name: 'PP3V3_S5 (Always On)',
      voltage: '3.30V',
      diodeMode: '0.340V - 0.380V',
      color: '#10b981',
      description: 'فولت الإقلاع الدائم 3.3V',
      isPower: true,
      safeInjectionVoltage: '3.3V (حد أقصى 1A)',
    },
    net_pp5v_s5: {
      id: 'net_pp5v_s5',
      name: 'PP5V_S5 (Always On)',
      voltage: '5.00V',
      diodeMode: '0.410V - 0.460V',
      color: '#a855f7',
      description: 'فولت الإقلاع الدائم 5V',
      isPower: true,
      safeInjectionVoltage: '5.0V (حد أقصى 1A)',
    },
    net_ppvccio: {
      id: 'net_ppvccio',
      name: 'PPVCCIO_CPU (IO)',
      voltage: '0.95V - 1.05V',
      diodeMode: '0.018V - 0.035V',
      color: '#ec4899',
      description: 'تغذية IO للمعالج',
      isPower: true,
      safeInjectionVoltage: '1.0V فقط!',
    },
  };

  const parts: BoardPart[] = [];

  // Intel CPU (i5/i7 11th Gen)
  const cpuPins: BoardPin[] = [];
  for (let r = 0; r < 14; r++) {
    for (let c = 0; c < 14; c++) {
      let netId = 'net_gnd';
      let diode = '0.000V';
      if ((r >= 4 && r <= 8) && (c >= 4 && c <= 8)) {
        netId = 'net_ppvccsa';
        diode = '0.022V';
      } else if ((r >= 9 && r <= 11) && (c >= 4 && c <= 8)) {
        netId = 'net_ppvccio';
        diode = '0.025V';
      } else if (r === 0 || c === 0) {
        netId = 'net_pp3v3_s5';
        diode = '0.360V';
      }
      cpuPins.push({
        id: `cpu_pin_${r}_${c}`,
        partId: 'U1000_CPU',
        pinNumber: `${String.fromCharCode(65 + r)}${c + 1}`,
        netId,
        x: (c - 6.5) * 1.8,
        y: (r - 6.5) * 1.8,
        radius: 0.55,
        diodeValue: diode,
        isPin1: r === 0 && c === 0,
      });
    }
  }

  parts.push({
    id: 'U1000_CPU',
    name: 'Intel Core i5/i7 11th Gen (U1000)',
    packageType: 'BGA',
    side: 'TOP',
    x: 120,
    y: 100,
    width: 40,
    height: 40,
    rotation: 0,
    role: 'المعالج الرئيسي لللابتوب',
    commonFault: 'سخونة شديدة أو شورت على خطوط VCORE',
    pins: cpuPins,
  });

  // PCH (Platform Controller Hub)
  parts.push({
    id: 'U2000_PCH',
    name: 'Intel PCH (U2000)',
    packageType: 'BGA',
    side: 'TOP',
    x: 80,
    y: 100,
    width: 24,
    height: 24,
    rotation: 0,
    role: 'وحدة التحكم المنصة',
    commonFault: 'تلف بسبب دخول سوائل أو ارتفاع حرارة',
    pins: [
      { id: 'pch_p1', partId: 'U2000_PCH', pinNumber: '1', netId: 'net_pp3v3_s5', x: -8, y: -8, radius: 0.7, diodeValue: '0.360V', isPin1: true },
      { id: 'pch_p2', partId: 'U2000_PCH', pinNumber: '2', netId: 'net_pp5v_s5', x: 8, y: -8, radius: 0.7, diodeValue: '0.430V' },
      { id: 'pch_p3', partId: 'U2000_PCH', pinNumber: '3', netId: 'net_gnd', x: 0, y: 0, radius: 0.7, diodeValue: '0.000V' },
    ],
  });

  // Charging IC (BQ24780)
  parts.push({
    id: 'U3000_CHG',
    name: 'Charging IC BQ24780 (U3000)',
    packageType: 'QFN',
    side: 'TOP',
    x: 60,
    y: 150,
    width: 18,
    height: 18,
    rotation: 0,
    role: 'إدارة الشحن وتوليد 19.5V',
    commonFault: 'عدم الشحن أو شحن بطيء جداً',
    pins: [
      { id: 'chg_p1', partId: 'U3000_CHG', pinNumber: '1', netId: 'net_ppdcin', x: -6, y: -6, radius: 0.8, diodeValue: '0.450V', isPin1: true },
      { id: 'chg_p2', partId: 'U3000_CHG', pinNumber: '2', netId: 'net_gnd', x: 6, y: -6, radius: 0.8, diodeValue: '0.000V' },
      { id: 'chg_p3', partId: 'U3000_CHG', pinNumber: '3', netId: 'net_pp5v_s5', x: -6, y: 6, radius: 0.8, diodeValue: '0.430V' },
      { id: 'chg_p4', partId: 'U3000_CHG', pinNumber: '4', netId: 'net_pp3v3_s5', x: 6, y: 6, radius: 0.8, diodeValue: '0.360V' },
    ],
  });

  // VRM Controllers for CPU
  parts.push({
    id: 'U4000_VRM',
    name: 'CPU VRM Controller (U4000)',
    packageType: 'QFN',
    side: 'TOP',
    x: 160,
    y: 80,
    width: 16,
    height: 16,
    rotation: 0,
    role: 'تحكم في فولت المعالج',
    commonFault: 'سخونة شديدة وفشل في التشغيل',
    pins: [
      { id: 'vrm_p1', partId: 'U4000_VRM', pinNumber: '1', netId: 'net_ppdcin', x: -5, y: -5, radius: 0.8, diodeValue: '0.450V', isPin1: true },
      { id: 'vrm_p2', partId: 'U4000_VRM', pinNumber: '2', netId: 'net_ppvccsa', x: 5, y: -5, radius: 0.8, diodeValue: '0.022V' },
      { id: 'vrm_p3', partId: 'U4000_VRM', pinNumber: '3', netId: 'net_gnd', x: 0, y: 0, radius: 0.8, diodeValue: '0.000V' },
    ],
  });

  // DC-IN Connector
  parts.push({
    id: 'J5000_DCIN',
    name: 'DC-IN Jack (J5000)',
    packageType: 'CONNECTOR',
    side: 'TOP',
    x: 30,
    y: 150,
    width: 12,
    height: 20,
    rotation: 0,
    role: 'كونكتور الشاحن 19.5V',
    commonFault: 'تلف البنات بسبب شد الكابل أو دخول سوائل',
    pins: [
      { id: 'dcin_1', partId: 'J5000_DCIN', pinNumber: '1', netId: 'net_ppdcin', x: 0, y: -6, radius: 0.8, diodeValue: '0.450V' },
      { id: 'dcin_2', partId: 'J5000_DCIN', pinNumber: '2', netId: 'net_gnd', x: 0, y: 0, radius: 0.8, diodeValue: '0.000V' },
      { id: 'dcin_3', partId: 'J5000_DCIN', pinNumber: '3', netId: 'net_gnd', x: 0, y: 6, radius: 0.8, diodeValue: '0.000V' },
    ],
  });

  // Capacitors - increased for more realism
  const caps = [
    { id: 'C3001', x: 75, y: 130, net: 'net_ppdcin', diode: '0.450V' },
    { id: 'C3002', x: 75, y: 140, net: 'net_ppdcin', diode: '0.450V' },
    { id: 'C3003', x: 70, y: 130, net: 'net_pp3v3_s5', diode: '0.360V' },
    { id: 'C3004', x: 70, y: 140, net: 'net_pp5v_s5', diode: '0.430V' },
    { id: 'C4001', x: 145, y: 70, net: 'net_ppvccsa', diode: '0.022V' },
    { id: 'C4002', x: 175, y: 70, net: 'net_ppvccsa', diode: '0.022V' },
    { id: 'C4003', x: 145, y: 90, net: 'net_ppvccio', diode: '0.025V' },
    { id: 'C4004', x: 175, y: 90, net: 'net_ppvccio', diode: '0.025V' },
    { id: 'C4005', x: 160, y: 100, net: 'net_ppvccsa', diode: '0.022V' },
    { id: 'C4006', x: 170, y: 100, net: 'net_ppvccio', diode: '0.025V' },
  ];

  caps.forEach((cap) => {
    parts.push({
      id: cap.id,
      name: `${cap.id} (مكثف)`,
      packageType: '0402',
      side: 'TOP',
      x: cap.x,
      y: cap.y,
      width: 5,
      height: 3,
      rotation: 0,
      role: `مكثف تنعيم على ${cap.net}`,
      commonFault: 'انهيار عازلية وشورت',
      pins: [
        { id: `${cap.id}_p1`, partId: cap.id, pinNumber: '1', netId: cap.net, x: -1.5, y: 0, radius: 0.6, shape: 'rect', diodeValue: cap.diode },
        { id: `${cap.id}_p2`, partId: cap.id, pinNumber: '2', netId: 'net_gnd', x: 1.5, y: 0, radius: 0.6, shape: 'rect', diodeValue: '0.000V' },
      ],
    });
  });

  // Test Points - increased for more realism
  const testPoints = [
    { id: 'TP_DCIN', name: 'TP_DCIN', x: 45, y: 150, net: 'net_ppdcin', diode: '0.450V' },
    { id: 'TP_3V3', name: 'TP_3V3', x: 90, y: 80, net: 'net_pp3v3_s5', diode: '0.360V' },
    { id: 'TP_VCCSA', name: 'TP_VCCSA', x: 145, y: 75, net: 'net_ppvccsa', diode: '0.022V' },
    { id: 'TP_5V', name: 'TP_5V', x: 85, y: 90, net: 'net_pp5v_s5', diode: '0.430V' },
    { id: 'TP_VCCIO', name: 'TP_VCCIO', x: 150, y: 95, net: 'net_ppvccio', diode: '0.025V' },
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
      role: 'نقطة فحص',
      commonFault: 'تآكل',
      pins: [
        { id: `${tp.id}_pin`, partId: tp.id, pinNumber: 'TP', netId: tp.net, x: 0, y: 0, radius: 1.1, diodeValue: tp.diode },
      ],
    });
  });

  // Add Resistors for realism
  const resistors = [
    { id: 'R5001', x: 50, y: 140, net: 'net_ppdcin', diode: '0.450V', role: 'Current Sense Resistor' },
    { id: 'R5002', x: 55, y: 130, net: 'net_pp3v3_s5', diode: '0.360V', role: 'Pull-up Resistor' },
    { id: 'R5003', x: 75, y: 85, net: 'net_pp5v_s5', diode: '0.430V', role: 'Pull-up Resistor' },
    { id: 'R5004', x: 85, y: 85, net: 'net_pp3v3_s5', diode: '0.360V', role: 'Pull-up Resistor' },
  ];

  resistors.forEach((res) => {
    parts.push({
      id: res.id,
      name: `${res.id} (مقاومة)`,
      packageType: '0402',
      side: 'TOP',
      x: res.x,
      y: res.y,
      width: 3,
      height: 1.5,
      rotation: 0,
      role: res.role,
      commonFault: 'احتراق أو تغيير قيمة',
      pins: [
        { id: `${res.id}_p1`, partId: res.id, pinNumber: '1', netId: res.net, x: -0.8, y: 0, radius: 0.5, shape: 'rect', diodeValue: res.diode },
        { id: `${res.id}_p2`, partId: res.id, pinNumber: '2', netId: 'net_gnd', x: 0.8, y: 0, radius: 0.5, shape: 'rect', diodeValue: '0.000V' },
      ],
    });
  });

  // Add Inductors for realism
  const inductors = [
    { id: 'L6001', x: 70, y: 110, net: 'net_ppdcin', diode: '0.450V', role: 'Main Power Inductor' },
    { id: 'L6002', x: 155, y: 75, net: 'net_ppvccsa', diode: '0.022V', role: 'CPU Power Inductor' },
    { id: 'L6003', x: 165, y: 95, net: 'net_ppvccio', diode: '0.025V', role: 'CPU IO Power Inductor' },
  ];

  inductors.forEach((ind) => {
    parts.push({
      id: ind.id,
      name: `${ind.id} (ملف)`,
      packageType: 'COIL',
      side: 'TOP',
      x: ind.x,
      y: ind.y,
      width: 10,
      height: 7,
      rotation: 0,
      role: ind.role,
      commonFault: 'كسر في الملف أو شورت',
      pins: [
        { id: `${ind.id}_p1`, partId: ind.id, pinNumber: '1', netId: ind.net, x: -4, y: 0, radius: 1.2, diodeValue: ind.diode },
        { id: `${ind.id}_p2`, partId: ind.id, pinNumber: '2', netId: ind.net, x: 4, y: 0, radius: 1.2, diodeValue: ind.diode },
      ],
    });
  });

  return {
    id: 'dell_latitude_5420',
    title: 'Dell Latitude 5420 Logic Board',
    deviceModel: 'Dell Latitude 5420 (11th Gen)',
    width: 220,
    height: 200,
    layersCount: 8,
    nets,
    parts,
    outlinePoints: [
      { x: 20, y: 25 },
      { x: 200, y: 25 },
      { x: 200, y: 180 },
      { x: 20, y: 180 },
    ],
  };
})();

// ==========================================
// 3. المكون الرئيسي: InteractiveBoardviewSimulator
// ==========================================

export default function InteractiveBoardviewSimulator() {
  const { setBoardData: ctxSetBoardData } = useDiagnosticContext();

  // الحالات الأساسية
  const [boardData, setBoardData] = useState<BoardData>(IPHONE_15_PRO_MAX_BOARD);
  const [selectedSide, setSelectedSide] = useState<BoardSide>('TOP');
  const [selectedNetId, setSelectedNetId] = useState<string>('net_vdd_main');
  const [selectedPartId, setSelectedPartId] = useState<string>('U1000_SOC');

  // Wrapper function to update both local state and context
  const updateBoardData = (newData: BoardData) => {
    setBoardData(newData);
    ctxSetBoardData(newData);
  };

  const [hoveredPin, setHoveredPin] = useState<{ pin: BoardPin; part: BoardPart } | null>(null);

  // إعدادات العرض
  const [showFlightLines, setShowFlightLines] = useState(true);
  const [showDiodeOverlay, setShowDiodeOverlay] = useState(true);
  const [showComponentLabels, setShowComponentLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPartLabels, setShowPartLabels] = useState(true);
  const [showPinNumbers, setShowPinNumbers] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [usePixiRenderer, setUsePixiRenderer] = useState(false); // react-konva افتراضياً (أخف وأسرع)
  const [showModal, setShowModal] = useState(false);

  // بوردات ومخططات السحابة المرفوعة
  const [cloudBoards, setCloudBoards] = useState<BoardData[]>([]);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineQuery, setOnlineQuery] = useState('');
  const [onlineNotice, setOnlineNotice] = useState('');
  const [showOnlineSearchBox, setShowOnlineSearchBox] = useState(false);
  const [showUrlUploadBox, setShowUrlUploadBox] = useState(false);
  const [urlUploadUrl, setUrlUploadUrl] = useState('');
  const [isUploadingFromUrl, setIsUploadingFromUrl] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(false);

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

  // كشف الموبايل تلقائياً
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileView(isMobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ضبط العرض الأولي لتوسيط البوردة
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (container && boardData) {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scaleX = cw / boardData.width;
      const scaleY = ch / boardData.height;
      const initialZoom = Math.min(scaleX, scaleY) * 0.8; // 80% من المساحة المتاحة
      const centeredPan = {
        x: (cw - boardData.width * initialZoom) / 2,
        y: (ch - boardData.height * initialZoom) / 2,
      };
      setZoom(initialZoom);
      setPan(centeredPan);
    }
  }, [boardData.id]); // فقط عند تغيير البوردة

  // البحث
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ type: 'part' | 'net'; item: any }[]>([]);

  // محول الكانفاس (Zoom & Pan & Rotation)
  const [zoom, setZoom] = useState(2.2);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // مراجع اللمس للموبايل
  const lastTouchDistance = useRef<number>(0);
  const lastTouchCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // مراجع الـ container
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug: Log board data changes
  useEffect(() => {
    console.log('Board data changed:', boardData);
    console.log('Parts count:', boardData.parts.length);
    console.log('Nets count:', Object.keys(boardData.nets).length);
  }, [boardData.id]);

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

  // Convert board data for Pixi renderer (memoized to avoid unnecessary conversions)
  const parsedBoardData = useMemo(() => {
    return convertBoardDataToParsed(boardData);
  }, [boardData.id]); // Only reconvert when board ID changes

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
    const container = canvasContainerRef.current;
    if (container && boardData) {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scaleX = cw / boardData.width;
      const scaleY = ch / boardData.height;
      const newZoom = Math.min(scaleX, scaleY) * 0.8;
      const centeredPan = {
        x: (cw - boardData.width * newZoom) / 2,
        y: (ch - boardData.height * newZoom) / 2,
      };
      setZoom(newZoom);
      setPan(centeredPan);
      setRotation(0);
    }
  }, [boardData]);

  // توجيه الكاميرا إلى مكون محدد
  const zoomToPart = useCallback((part: BoardPart) => {
    setSelectedPartId(part.id);
    setSelectedSide(part.side);
    if (part.pins.length > 0) {
      setSelectedNetId(part.pins[0].netId);
    }
    const container = canvasContainerRef.current;
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
  // 5. التفاعل بالماوس واللمس (Pan & Zoom & Click)
  // ==========================================

  // معالجة عجلة الماوس للتكبير والتصغير
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();

    const zoomFactor = e.evt.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.6), 8.0);

    // الحفاظ على نقطة الماوس ثابتة أثناء التكبير
    const pointer = e.target.getPointerPosition();
    if (pointer) {
      const newPanX = pointer.x - (pointer.x - pan.x) * (newZoom / zoom);
      const newPanY = pointer.y - (pointer.y - pan.y) * (newZoom / zoom);
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  }, [zoom, pan]);

  // ==========================================
  // 5b. معالجات اللمس للموبايل والتابلت (Touch Handlers)
  // ==========================================

  const handleTouchStart = (e: any) => {
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

  const handleTouchMove = (e: any) => {
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
            updateBoardData(parsed);
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
          updateBoardData(newBoard);

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

  // تصدير لقطة شاشة من البوردفيو (مؤقت - تحتاج تطبيق)
  const handleExportImage = () => {
    alert('ميزة تصدير الصورة قيد التطوير حالياً');
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
        // Generate more realistic board data based on device type
        const isMobile = onlineQuery.toLowerCase().includes('iphone') || onlineQuery.toLowerCase().includes('samsung') || onlineQuery.toLowerCase().includes('xiaomi') || onlineQuery.toLowerCase().includes('phone');
        const isLaptop = onlineQuery.toLowerCase().includes('dell') || onlineQuery.toLowerCase().includes('hp') || onlineQuery.toLowerCase().includes('lenovo') || onlineQuery.toLowerCase().includes('macbook');
        const isDesktop = onlineQuery.toLowerCase().includes('desktop') || onlineQuery.toLowerCase().includes('motherboard') || onlineQuery.toLowerCase().includes('z790') || onlineQuery.toLowerCase().includes('b760');

        const boardWidth = isMobile ? 190 : isLaptop ? 220 : 240;
        const boardHeight = isMobile ? 210 : isLaptop ? 200 : 200;

        // Generate realistic nets based on device type
        const realisticNets: Record<string, BoardNet> = {
          net_gnd: { id: 'net_gnd', name: 'GND (أرضي الشاسيه)', voltage: '0.00V', diodeMode: '0.000V', color: '#64748b', isGround: true, description: 'أرضي الشاسيه العام' },
        };

        if (isMobile) {
          realisticNets.net_vdd_main = { id: 'net_vdd_main', name: 'PP_VDD_MAIN (3.8V)', voltage: '3.7V - 4.2V', diodeMode: '0.395V', color: '#f59e0b', isPower: true, description: 'شريان الباور الرئيسي للهاتف', safeInjectionVoltage: '3.8V' };
          realisticNets.net_vbus = { id: 'net_vbus', name: 'VBUS_USB-C (5V)', voltage: '5.0V', diodeMode: '0.580V', color: '#10b981', isPower: true, description: 'دخل الشاحن' };
          realisticNets.net_cpu_vcore = { id: 'net_cpu_vcore', name: 'CPU_VCORE (0.85V)', voltage: '0.82V', diodeMode: '0.022V', color: '#38bdf8', isPower: true, description: 'تغذية المعالج', safeInjectionVoltage: '0.8V' };
          realisticNets.net_1v8 = { id: 'net_1v8', name: 'PP1V8_ALWAYS', voltage: '1.80V', diodeMode: '0.360V', color: '#a855f7', isPower: true, description: 'فولت الإقلاع' };
        } else if (isLaptop) {
          realisticNets.net_ppdcin = { id: 'net_ppdcin', name: 'PPDCIN (19.5V)', voltage: '19.0V - 19.5V', diodeMode: '0.450V', color: '#f59e0b', isPower: true, description: 'دخل الشاحن 19.5V', safeInjectionVoltage: '19.0V' };
          realisticNets.net_pp3v3 = { id: 'net_pp3v3', name: 'PP3V3_S5 (3.3V)', voltage: '3.30V', diodeMode: '0.360V', color: '#10b981', isPower: true, description: 'فولت الإقلاع 3.3V', safeInjectionVoltage: '3.3V' };
          realisticNets.net_cpu_vcore = { id: 'net_cpu_vcore', name: 'CPU_VCORE (0.95V)', voltage: '0.95V', diodeMode: '0.025V', color: '#38bdf8', isPower: true, description: 'تغذية المعالج', safeInjectionVoltage: '1.0V' };
          realisticNets.net_pp5v = { id: 'net_pp5v', name: 'PP5V_S5 (5V)', voltage: '5.00V', diodeMode: '0.430V', color: '#a855f7', isPower: true, description: 'فولت الإقلاع 5V', safeInjectionVoltage: '5.0V' };
        } else {
          realisticNets.net_12v = { id: 'net_12v', name: '12V_ATX (12V)', voltage: '12.0V', diodeMode: '0.520V', color: '#f59e0b', isPower: true, description: 'فولت ATX 12V', safeInjectionVoltage: '12.0V' };
          realisticNets.net_5v = { id: 'net_5v', name: '5V_ATX (5V)', voltage: '5.00V', diodeMode: '0.430V', color: '#10b981', isPower: true, description: 'فولت ATX 5V', safeInjectionVoltage: '5.0V' };
          realisticNets.net_3v3 = { id: 'net_3v3', name: '3.3V_ATX (3.3V)', voltage: '3.30V', diodeMode: '0.360V', color: '#38bdf8', isPower: true, description: 'فولت ATX 3.3V', safeInjectionVoltage: '3.3V' };
          realisticNets.net_cpu_vcore = { id: 'net_cpu_vcore', name: 'CPU_VCORE (1.1V)', voltage: '1.10V', diodeMode: '0.035V', color: '#a855f7', isPower: true, description: 'تغذية المعالج', safeInjectionVoltage: '1.1V' };
        }

        // Generate more realistic parts
        const realisticParts: BoardPart[] = [];
        const keyICs = item.keyICs || (isMobile ? ['Main CPU', 'PMIC', 'Charging IC', 'Storage'] : isLaptop ? ['CPU', 'PCH', 'Charging IC', 'VRM'] : ['CPU', 'VRM', ' chipset']);

        keyICs.forEach((icName: string, idx: number) => {
          const partX = 60 + (idx % 3) * 50;
          const partY = 70 + Math.floor(idx / 3) * 50;
          const isCPU = idx === 0;

          let partPins: BoardPin[] = [];
          if (isCPU) {
            // Generate more pins for CPU
            for (let i = 0; i < 8; i++) {
              partPins.push({
                id: `cpu_pin_${i}`,
                partId: `IC_${idx + 1}`,
                pinNumber: `${i + 1}`,
                netId: i < 3 ? 'net_cpu_vcore' : i < 5 ? (isMobile ? 'net_1v8' : 'net_pp3v3') : 'net_gnd',
                x: (i - 3.5) * 3,
                y: (i - 3.5) * 3,
                radius: 0.7,
                diodeValue: i < 3 ? '0.022V' : i < 5 ? (isMobile ? '0.360V' : '0.360V') : '0.000V',
                isPin1: i === 0,
              });
            }
          } else {
            partPins = [
              { id: `pin_${idx}_1`, partId: `IC_${idx + 1}`, pinNumber: '1', netId: isMobile ? 'net_vdd_main' : isLaptop ? 'net_ppdcin' : 'net_12v', x: -4, y: -4, radius: 0.9, diodeValue: isMobile ? '0.395V' : isLaptop ? '0.450V' : '0.520V', isPin1: true },
              { id: `pin_${idx}_2`, partId: `IC_${idx + 1}`, pinNumber: '2', netId: 'net_cpu_vcore', x: 4, y: -4, radius: 0.9, diodeValue: '0.022V' },
              { id: `pin_${idx}_3`, partId: `IC_${idx + 1}`, pinNumber: '3', netId: 'net_gnd', x: 0, y: 4, radius: 0.9, diodeValue: '0.000V' },
            ];
          }

          realisticParts.push({
            id: `IC_${idx + 1}`,
            name: icName,
            packageType: isCPU ? 'BGA' : 'QFN',
            side: 'TOP',
            x: partX,
            y: partY,
            width: isCPU ? 28 : 18,
            height: isCPU ? 28 : 18,
            rotation: 0,
            role: `آيسي ${icName} - تم سحبه من ${item.source}`,
            commonFault: item.extractedSummary || 'فحص خطوط التغذية والممانعة',
            pins: partPins,
          });
        });

        // Add some capacitors for realism
        for (let i = 0; i < 6; i++) {
          const capX = 85 + (i % 3) * 25;
          const capY = 120 + Math.floor(i / 3) * 25;
          realisticParts.push({
            id: `C${100 + i}`,
            name: `C${100 + i} (مكثف)`,
            packageType: '0402',
            side: 'TOP',
            x: capX,
            y: capY,
            width: 4,
            height: 2.5,
            rotation: 0,
            role: 'مكثف تنعيم',
            commonFault: 'انهيار عازلية وشورت',
            pins: [
              { id: `c${i}_p1`, partId: `C${100 + i}`, pinNumber: '1', netId: isMobile ? 'net_vdd_main' : isLaptop ? 'net_ppdcin' : 'net_12v', x: -1.2, y: 0, radius: 0.6, shape: 'rect', diodeValue: isMobile ? '0.395V' : isLaptop ? '0.450V' : '0.520V' },
              { id: `c${i}_p2`, partId: `C${100 + i}`, pinNumber: '2', netId: 'net_gnd', x: 1.2, y: 0, radius: 0.6, shape: 'rect', diodeValue: '0.000V' },
            ],
          });
        }

        const newCloudBoard: BoardData = {
          id: `online_${item.device.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
          title: `مخطط وبوردفيو أصلي مستخرج لـ ${item.device}`,
          deviceModel: item.device || onlineQuery.trim(),
          width: boardWidth,
          height: boardHeight,
          layersCount: isMobile ? 10 : isLaptop ? 8 : 6,
          nets: realisticNets,
          parts: realisticParts,
          outlinePoints: [
            { x: 10, y: 30 },
            { x: boardWidth - 10, y: 30 },
            { x: boardWidth - 10, y: boardHeight - 20 },
            { x: 10, y: boardHeight - 20 },
          ],
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

        updateBoardData(newCloudBoard);
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

  // رفع ملف Boardview من رابط URL مباشر
  const handleUploadFromUrl = async () => {
    if (!urlUploadUrl.trim()) return;
    setIsUploadingFromUrl(true);
    try {
      // استخدام API endpoint لتحميل الملف من URL
      const res = await fetch('/api/boardviews/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlUploadUrl.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.boardData) {
        updateBoardData(data.boardData);
        setCloudBoards((prev) => [data.boardData, ...prev.filter((b) => b.id !== data.boardData.id)]);
        alert(`✅ تم تحميل الملف من الرابط بنجاح!\n\nالجهاز: ${data.boardData.deviceModel}`);
        setShowUrlUploadBox(false);
        setUrlUploadUrl('');
        handleResetView();
      } else {
        alert(data.error || 'تعذر تحميل الملف من الرابط المحدد');
      }
    } catch (e: any) {
      alert('خطأ أثناء التحميل: ' + e?.message);
    } finally {
      setIsUploadingFromUrl(false);
    }
  };

  // اختيار الموديل من القائمة الشاملة لجميع الهواتف واللابتوبات
  const handleSelectPreset = async (id: string) => {
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
          // If not found in presets, try to fetch from online API
          try {
            const res = await fetch('/api/admin/schematics-search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: id }),
            });
            const data = await res.json();
            if (res.ok && data.results && data.results.length > 0) {
              const item = data.results[0];
              nextBoard = {
                id: `online_${id}`,
                title: item.name || `Online: ${id}`,
                deviceModel: item.device || id,
                width: 210,
                height: 190,
                layersCount: 8,
                nets: {
                  net_gnd: { id: 'net_gnd', name: 'GND', voltage: '0V', diodeMode: '0.000V', color: '#64748b', isGround: true, description: 'Ground' },
                  net_main: { id: 'net_main', name: 'MAIN_POWER', voltage: '3.8V', diodeMode: '0.380V', color: '#f59e0b', isPower: true, description: 'Main power' },
                },
                parts: (item.keyICs || ['U100_MAIN', 'U200_CPU']).map((icName: string, idx: number) => ({
                  id: `IC_${idx + 1}`,
                  name: icName,
                  packageType: 'BGA' as const,
                  side: 'TOP' as const,
                  x: 60 + (idx % 3) * 45,
                  y: 70 + Math.floor(idx / 3) * 45,
                  width: 24,
                  height: 24,
                  rotation: 0,
                  role: 'IC from online source',
                  commonFault: 'Check power rails',
                  pins: [
                    { id: `pin_${idx}_1`, partId: `IC_${idx + 1}`, pinNumber: '1', netId: 'net_main', x: -4, y: -4, radius: 0.9, diodeValue: '0.380V', isPin1: true },
                    { id: `pin_${idx}_2`, partId: `IC_${idx + 1}`, pinNumber: '2', netId: 'net_gnd', x: 4, y: -4, radius: 0.9, diodeValue: '0.000V' },
                    { id: `pin_${idx}_3`, partId: `IC_${idx + 1}`, pinNumber: '3', netId: 'net_gnd', x: 0, y: 4, radius: 0.9, diodeValue: '0.000V' },
                  ],
                })),
              };
            } else {
              nextBoard = IPHONE_15_PRO_MAX_BOARD;
            }
          } catch (error) {
            console.error('Failed to fetch from online API:', error);
            nextBoard = IPHONE_15_PRO_MAX_BOARD;
          }
      }
    }

    if (nextBoard) {
      updateBoardData(nextBoard);
      setSelectedSide('TOP');
      const firstNetKey = Object.keys(nextBoard.nets)[1] || Object.keys(nextBoard.nets)[0] || 'net_gnd';
      setSelectedNetId(firstNetKey);
      if (nextBoard.parts.length > 0) {
        setSelectedPartId(nextBoard.parts[0].id);
      }
      // لا تغيير محرك العرض - احتفظ باختيار المستخدم
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
      <div className="p-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-900/90 dark:via-gray-900 dark:to-gray-900/90 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dahab-500 via-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-xl shadow-dahab-500/30 animate-pulse-slow">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black bg-gradient-to-r from-dahab-600 to-amber-600 bg-clip-text text-transparent">
                محاكي البوردفيو الاحترافي
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                60FPS Engine
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI-Powered
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {boardData.title} - {boardData.deviceModel}
            </p>
          </div>
        </div>

        {/* أدوات التحكم والأزرار */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* اختيار البوردة الجاهزة من بين جميع الموديلات المدمجة والسحابية */}
          <select
            value={boardData.id}
            onChange={(e) => {
              console.log('Selected board ID:', e.target.value);
              handleSelectPreset(e.target.value);
            }}
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
            {BOARD_CATEGORIES
              .filter((cat) => {
                if (selectedCategory === 'all') return true;
                if (selectedCategory === 'iphone' && cat.name.includes('آبل')) return true;
                if (selectedCategory === 'samsung' && cat.name.includes('سامسونج')) return true;
                if (selectedCategory === 'xiaomi' && cat.name.includes('شاومي')) return true;
                if (selectedCategory === 'macbook' && cat.name.includes('ماك بوك')) return true;
                if (selectedCategory === 'laptop' && cat.name.includes('لابتوب')) return true;
                if (selectedCategory === 'desktop' && cat.name.includes('كمبيوتر')) return true;
                if (selectedCategory === 'gpu' && cat.name.includes('كروت')) return true;
                return false;
              })
              .map((cat) => (
                <optgroup key={cat.name} label={cat.name} className="font-black text-dahab-600 dark:text-dahab-400 bg-gray-100 dark:bg-gray-900">
                  {cat.boards
                    .filter((b) => {
                      if (!modelSearchQuery) return true;
                      const query = modelSearchQuery.toLowerCase();
                      return b.title.toLowerCase().includes(query) || b.id.toLowerCase().includes(query);
                    })
                    .map((b) => (
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

          {/* زر رفع ملف من URL */}
          <button
            onClick={() => setShowUrlUploadBox((prev) => !prev)}
            className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-blue-500/30"
            title="رفع ملف Boardview من رابط URL مباشر"
          >
            <Globe className="w-4 h-4 text-blue-500" />
            <span>رفع من رابط 🔗</span>
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

          {/* زر فتح في وضع ملء الشاشة */}
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-blue-500/30"
            title="فتح البوردة في وضع ملء الشاشة"
          >
            <Maximize2 className="w-4 h-4 text-blue-500" />
            <span>ملء الشاشة</span>
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
              TOP
            </button>
            <button
              onClick={() => setSelectedSide('BOTTOM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedSide === 'BOTTOM'
                  ? 'bg-dahab-500 text-slate-950 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              BOTTOM
            </button>
          </div>

          {/* تبديل محرك العرض react-konva / PixiJS WebGL */}
          <button
            onClick={() => setUsePixiRenderer(!usePixiRenderer)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              usePixiRenderer
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
            }`}
            title={usePixiRenderer ? 'تبديل إلى react-konva (أخف وأسرع)' : 'تبديل إلى PixiJS WebGL (أداء أعلى)'}
          >
            <Sparkles className="w-4 h-4" />
            <span>{usePixiRenderer ? 'WebGL (PixiJS)' : 'Konva'}</span>
          </button>

          {/* ميزات العرض */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPartLabels(!showPartLabels)}
              className={`p-2 rounded-lg text-xs font-bold transition border ${
                showPartLabels
                  ? 'bg-dahab-500/10 text-dahab-600 dark:text-dahab-400 border-dahab-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
              }`}
              title="إظهار/إخفاء أسماء المكونات"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowPinNumbers(!showPinNumbers)}
              className={`p-2 rounded-lg text-xs font-bold transition border ${
                showPinNumbers
                  ? 'bg-dahab-500/10 text-dahab-600 dark:text-dahab-400 border-dahab-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
              }`}
              title="إظهار/إخفاء أرقام البنات"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg text-xs font-bold transition border ${
                showGrid
                  ? 'bg-dahab-500/10 text-dahab-600 dark:text-dahab-400 border-dahab-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
              }`}
              title="إظهار/إخفاء الشبكة"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setHighContrastMode(!highContrastMode)}
              className={`p-2 rounded-lg text-xs font-bold transition border ${
                highContrastMode
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
              }`}
              title="وضع التباين العالي"
            >
              <Sliders className="w-4 h-4" />
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

      {/* شريط رفع الملف من URL */}
      {showUrlUploadBox && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800/50 flex flex-wrap items-center gap-2 animate-fadeIn">
          <Globe className="w-5 h-5 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              value={urlUploadUrl}
              onChange={(e) => setUrlUploadUrl(e.target.value)}
              placeholder="أدخل رابط URL للملف (.brd, .bvr, .cad, .json)..."
              className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleUploadFromUrl()}
            />
          </div>
          <button
            onClick={handleUploadFromUrl}
            disabled={isUploadingFromUrl || !urlUploadUrl.trim()}
            className="px-4 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isUploadingFromUrl ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isUploadingFromUrl ? 'جاري التحميل...' : 'تحميل الملف 🔗'}</span>
          </button>
          <button
            onClick={() => setShowUrlUploadBox(false)}
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
            <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-[9999] max-h-60 overflow-y-auto">
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

        {/* فلتر الموديلات */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-800 dark:text-gray-200 outline-none focus:border-dahab-500"
          >
            <option value="all">📱 جميع الأجهزة</option>
            <option value="iphone">🍎 iPhone</option>
            <option value="samsung">📱 Samsung</option>
            <option value="xiaomi">📱 Xiaomi</option>
            <option value="macbook">💻 MacBook</option>
            <option value="laptop">💻 لابتوبات أخرى</option>
            <option value="desktop">🖥️ كمبيوتر</option>
            <option value="gpu">🎮 كروت شاشة</option>
          </select>

          <input
            type="text"
            value={modelSearchQuery}
            onChange={(e) => setModelSearchQuery(e.target.value)}
            placeholder="ابحث عن موديل..."
            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-800 dark:text-gray-200 outline-none focus:border-dahab-500 w-40"
          />
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

          <button
            onClick={() => setShowCoordinates(!showCoordinates)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
              showCoordinates
                ? 'bg-green-500/15 border-green-500 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
            }`}
          >
            <span>الإحداثيات (Coords)</span>
          </button>

          <button
            onClick={() => setShowMeasurements(!showMeasurements)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 ${
              showMeasurements
                ? 'bg-red-500/15 border-red-500 text-red-600 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
            }`}
          >
            <span>الأبعاد (Size)</span>
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
        <div
          ref={canvasContainerRef}
          className="flex-1 lg:col-span-8 xl:col-span-9 relative bg-[#0a0f1d] overflow-hidden select-none"
          style={{ minHeight: 0 }}
        >
          {usePixiRenderer ? (
            <PixiBoardviewViewer
              width={canvasContainerRef.current?.clientWidth || 1000}
              height={canvasContainerRef.current?.clientHeight || 800}
              initialBoardData={parsedBoardData}
              selectedNetId={selectedNetId}
              selectedSide={selectedSide}
              showGrid={showGrid}
              showLabels={showComponentLabels}
              showPinNumbers={showPinNumbers}
              showDiodeOverlay={showDiodeOverlay}
              showCoordinates={showCoordinates}
              showMeasurements={showMeasurements}
              onPartClick={(part) => {
                // تحويل من ParsedBoardPart إلى BoardPart إذا لزم الأمر
                console.log('Part clicked in Pixi:', part);
                const boardPart = boardData.parts.find((p) => p.id === part.id);
                if (boardPart) {
                  zoomToPart(boardPart);
                }
              }}
              onPinClick={(pin) => {
                console.log('Pin clicked in Pixi:', pin);
                const boardPart = boardData.parts.find((p) => p.id === pin.partId);
                if (boardPart) {
                  setSelectedPartId(boardPart.id);
                  setSelectedNetId(pin.netId);
                }
              }}
            />
          ) : (
            <KonvaBoardview
              boardData={boardData}
              scale={zoom}
              position={pan}
              selectedNetId={selectedNetId}
              selectedPartId={selectedPartId}
              selectedSide={selectedSide}
              showGrid={showGrid}
              showFlightLines={showFlightLines}
              showComponentLabels={showComponentLabels}
              showPinNumbers={showPinNumbers}
              showDiodeOverlay={showDiodeOverlay}
              showCoordinates={showCoordinates}
              showMeasurements={showMeasurements}
              onWheel={handleWheel}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={(e) => {
                setIsDragging(false);
                setPan({ x: e.target.x(), y: e.target.y() });
              }}
              containerWidth={canvasContainerRef.current?.clientWidth || 1000}
              containerHeight={canvasContainerRef.current?.clientHeight || 800}
              onPartClick={zoomToPart}
              onPinHover={(pin, part) => {
                if (pin && part) {
                  setHoveredPin({ pin, part });
                } else {
                  setHoveredPin(null);
                }
              }}
            />
          )}

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

          {/* زر فتح اللوحة الجانبية للموبايل */}
          {isMobileView && (
            <button
              onClick={() => setShowMobileControls(true)}
              className="absolute bottom-4 right-4 p-3 rounded-2xl bg-dahab-500/20 border border-dahab-500/40 text-dahab-400 shadow-2xl backdrop-blur-md transition hover:bg-dahab-500/30"
              title="إعدادات وتفاصيل"
            >
              <Sliders className="w-5 h-5" />
            </button>
          )}

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

      {/* مودال التحكمات للموبايل */}
      {isMobileView && showMobileControls && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-dahab-500" />
                <span>إعدادات وتفاصيل البوردفيو</span>
              </h3>
              <button
                onClick={() => setShowMobileControls(false)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {/* بطاقة المكون المختار */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dahab-500/15 text-dahab-600 dark:text-dahab-400">
                    {selectedPart.packageType}
                  </span>
                  <span className="text-[10px] text-gray-500">{selectedPart.side}</span>
                </div>
                <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">{selectedPart.name}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">{selectedPart.role}</p>
                {selectedPart.commonFault && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    ⚠️ {selectedPart.commonFault}
                  </p>
                )}
              </div>

              {/* المسارات المتصلة */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">المسارات المتصلة:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPart.pins.slice(0, 8).map((pin) => {
                    const net = boardData.nets[pin.netId];
                    const isCurrent = pin.netId === selectedNetId;
                    return (
                      <button
                        key={pin.id}
                        onClick={() => setSelectedNetId(pin.netId)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition border ${
                          isCurrent
                            ? 'shadow-sm text-slate-950 font-black'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                        }`}
                        style={isCurrent ? { backgroundColor: net?.color, borderColor: net?.color } : {}}
                      >
                        {net?.name.split('/')[0] || pin.netId}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* جميع المسارات */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">جميع المسارات:</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
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

              {/* زر AI */}
              <button
                onClick={() => {
                  const query = `أفحص لي المكون (${selectedPart.name}) المتصل بمسار (${activeNet.name}) ذو الجهد (${activeNet.voltage}) وممانعة الدايود مود (${activeNet.diodeMode}) على جهاز ${boardData.deviceModel}`;
                  navigator.clipboard?.writeText(query);
                  setShowMobileControls(false);
                  alert(`✅ تم نسخ طلب الفحص الهندسي للمكون (${selectedPart.name}) إلى الحافظة!`);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-lg shadow-dahab-500/20 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>فحص المكون بالذكاء الاصطناعي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال عرض البوردة في وضع ملء الشاشة */}
      {showModal && (
        <BoardviewModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          boardData={convertBoardDataToParsed(boardData)}
          title={boardData.title}
        />
      )}
    </div>
  );
}
