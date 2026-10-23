'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Smartphone,
  Laptop,
  Copy,
  Check,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RailDiodeInfo {
  rail: string;
  nominalVoltage: string;
  diodeRange: string;
  minDiode: number;
  maxDiode: number;
  testComponent: string;
  notes: string;
}

interface DeviceDiodeData {
  id: string;
  brand: string;
  model: string;
  boardCode: string;
  category: 'mobile' | 'laptop';
  socOrCpu: string;
  rails: RailDiodeInfo[];
}

const TOP_MODELS_DIODE_MATRIX: DeviceDiodeData[] = [
  // 1. iPhone 15 Pro Max
  {
    id: 'ip15pm',
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    boardCode: '820-03290',
    category: 'mobile',
    socOrCpu: 'Apple A17 Pro (3nm)',
    rails: [
      { rail: 'PP_VDD_MAIN', nominalVoltage: '3.8V - 4.3V', diodeRange: '0.365V - 0.440V', minDiode: 0.365, maxDiode: 0.440, testComponent: 'C3301 / C3302', notes: 'خط التغذية الأساسي للسيستم بعد التيجريس' },
      { rail: 'PP_BATT_VCC', nominalVoltage: '3.7V - 4.2V', diodeRange: '0.410V - 0.520V', minDiode: 0.410, maxDiode: 0.520, testComponent: 'J2500 ريش البطارية', notes: 'خط البطارية المباشر' },
      { rail: 'PP_CPU_CORE', nominalVoltage: '0.65V - 1.05V', diodeRange: '0.015V - 0.045V', minDiode: 0.015, maxDiode: 0.045, testComponent: 'L1001 - L1004', notes: 'ممانعة منخفضة جداً طبيعية لنواة A17' },
      { rail: 'PP1V8_ALWAYS', nominalVoltage: '1.8V', diodeRange: '0.420V - 0.510V', minDiode: 0.420, maxDiode: 0.510, testComponent: 'C2001', notes: 'جهد 1.8V المستمر للتزامن والـ I2C' },
      { rail: 'PP_VDD_BOOST', nominalVoltage: '3.8V - 4.5V', diodeRange: '0.380V - 0.460V', minDiode: 0.380, maxDiode: 0.460, testComponent: 'L3301 / D3301', notes: 'خط البوست المغذي لمضخمات الصوت والفلاش' },
      { rail: 'I2C0_SDA / SCL', nominalVoltage: '1.8V', diodeRange: '0.510V - 0.580V', minDiode: 0.510, maxDiode: 0.580, testComponent: 'R4001 / R4002', notes: 'ناقل بيانات الشحن، أي هبوط يسبب ريستارت' },
    ],
  },
  // 2. iPhone 14 Pro Max
  {
    id: 'ip14pm',
    brand: 'Apple',
    model: 'iPhone 14 Pro Max',
    boardCode: '820-02857',
    category: 'mobile',
    socOrCpu: 'Apple A16 Bionic',
    rails: [
      { rail: 'PP_VDD_MAIN', nominalVoltage: '3.8V - 4.2V', diodeRange: '0.355V - 0.435V', minDiode: 0.355, maxDiode: 0.435, testComponent: 'C3102 / C3104', notes: 'مسار التغذية العام' },
      { rail: 'PP_BATT_VCC', nominalVoltage: '3.8V', diodeRange: '0.400V - 0.510V', minDiode: 0.400, maxDiode: 0.510, testComponent: 'J2500 Pin 1,2', notes: 'موجب البطارية' },
      { rail: 'PP_CPU_CORE', nominalVoltage: '0.70V - 1.10V', diodeRange: '0.018V - 0.050V', minDiode: 0.018, maxDiode: 0.050, testComponent: 'L1101', notes: 'جهد معالج A16' },
      { rail: 'PP1V8_S2', nominalVoltage: '1.8V', diodeRange: '0.440V - 0.520V', minDiode: 0.440, maxDiode: 0.520, testComponent: 'C2105', notes: 'تغذية دوائر الإقلاع المبكر' },
      { rail: 'PP_DISPLAY_BOOST', nominalVoltage: '4.2V', diodeRange: '0.370V - 0.450V', minDiode: 0.370, maxDiode: 0.450, testComponent: 'L5700', notes: 'تغذية درايفر شاشة 120Hz' },
    ],
  },
  // 3. iPhone 13 Pro Max
  {
    id: 'ip13pm',
    brand: 'Apple',
    model: 'iPhone 13 Pro Max',
    boardCode: '820-02384',
    category: 'mobile',
    socOrCpu: 'Apple A15 Bionic',
    rails: [
      { rail: 'PP_VDD_MAIN', nominalVoltage: '3.8V - 4.2V', diodeRange: '0.350V - 0.440V', minDiode: 0.350, maxDiode: 0.440, testComponent: 'C3302 قرب PMIC', notes: 'أهم خط فحص لحالات الفاصل باور' },
      { rail: 'PP_BATT_VCC', nominalVoltage: '3.8V', diodeRange: '0.410V - 0.520V', minDiode: 0.410, maxDiode: 0.520, testComponent: 'J2500 Pin 1', notes: 'تغذية البطارية' },
      { rail: 'PP_CPU_CORE', nominalVoltage: '0.75V - 1.10V', diodeRange: '0.020V - 0.055V', minDiode: 0.020, maxDiode: 0.055, testComponent: 'L1200', notes: 'نواة المعالج الرئيسي' },
      { rail: 'PP_GPU_CORE', nominalVoltage: '0.70V - 0.95V', diodeRange: '0.025V - 0.065V', minDiode: 0.025, maxDiode: 0.065, testComponent: 'L1300', notes: 'معالج الرسوميات' },
      { rail: 'PP1V8_ALWAYS', nominalVoltage: '1.8V', diodeRange: '0.420V - 0.500V', minDiode: 0.420, maxDiode: 0.500, testComponent: 'C2100', notes: 'مسار التزامن والريست' },
      { rail: 'I2C_SDA / SCL', nominalVoltage: '1.8V', diodeRange: '0.510V - 0.570V', minDiode: 0.510, maxDiode: 0.570, testComponent: 'R4001', notes: 'حساسات البانيك وفلاتة الشحن' },
    ],
  },
  // 4. iPhone 12 / 12 Pro
  {
    id: 'ip12',
    brand: 'Apple',
    model: 'iPhone 12 / 12 Pro',
    boardCode: '820-01990',
    category: 'mobile',
    socOrCpu: 'Apple A14 Bionic',
    rails: [
      { rail: 'PP_VDD_MAIN', nominalVoltage: '3.8V - 4.2V', diodeRange: '0.340V - 0.430V', minDiode: 0.340, maxDiode: 0.430, testComponent: 'C3300', notes: 'المسار الأساسي بعد التيجريس' },
      { rail: 'PP_CPU_CORE', nominalVoltage: '0.75V - 1.10V', diodeRange: '0.022V - 0.060V', minDiode: 0.022, maxDiode: 0.060, testComponent: 'L1000', notes: 'قلب المعالج A14' },
      { rail: 'PP1V8_S2', nominalVoltage: '1.8V', diodeRange: '0.410V - 0.490V', minDiode: 0.410, maxDiode: 0.490, testComponent: 'C2003', notes: 'خط الإقلاع السريع' },
      { rail: 'PP0V85_S2', nominalVoltage: '0.85V', diodeRange: '0.280V - 0.360V', minDiode: 0.280, maxDiode: 0.360, testComponent: 'C2010', notes: 'ذاكرة الرام LPDDR4X' },
    ],
  },
  // 5. iPhone 11
  {
    id: 'ip11',
    brand: 'Apple',
    model: 'iPhone 11',
    boardCode: '820-01535',
    category: 'mobile',
    socOrCpu: 'Apple A13 Bionic',
    rails: [
      { rail: 'PP_VDD_MAIN', nominalVoltage: '3.8V - 4.2V', diodeRange: '0.330V - 0.420V', minDiode: 0.330, maxDiode: 0.420, testComponent: 'C3302 / C3304', notes: 'أكثر خط شائع فيه شورت صريح' },
      { rail: 'PP_BATT_VCC', nominalVoltage: '3.8V', diodeRange: '0.420V - 0.530V', minDiode: 0.420, maxDiode: 0.530, testComponent: 'J3200 Pin 1', notes: 'موجب ريش البطارية' },
      { rail: 'PP_CPU_CORE', nominalVoltage: '0.80V - 1.15V', diodeRange: '0.025V - 0.070V', minDiode: 0.025, maxDiode: 0.070, testComponent: 'L1001', notes: 'تغذية A13' },
      { rail: 'PP1V8_ALWAYS', nominalVoltage: '1.8V', diodeRange: '0.400V - 0.490V', minDiode: 0.400, maxDiode: 0.490, testComponent: 'C2005', notes: 'خط دائم 1.8V' },
    ],
  },
  // 6. iPhone X
  {
    id: 'ipx',
    brand: 'Apple',
    model: 'iPhone X',
    boardCode: '820-00858',
    category: 'mobile',
    socOrCpu: 'Apple A11 Bionic',
    rails: [
      { rail: 'PP_VDD_MAIN', nominalVoltage: '3.8V - 4.2V', diodeRange: '0.320V - 0.410V', minDiode: 0.320, maxDiode: 0.410, testComponent: 'C3302', notes: 'مسار التغذية بين الطبقتين' },
      { rail: 'PP_BATT_VCC', nominalVoltage: '3.8V', diodeRange: '0.420V - 0.540V', minDiode: 0.420, maxDiode: 0.540, testComponent: 'J3200', notes: 'مدخل بطارية الآيفون X' },
      { rail: 'PP_CPU_CORE', nominalVoltage: '0.85V - 1.20V', diodeRange: '0.030V - 0.080V', minDiode: 0.030, maxDiode: 0.080, testComponent: 'L1000', notes: 'معالج A11' },
      { rail: 'PP1V8_ALWAYS', nominalVoltage: '1.8V', diodeRange: '0.410V - 0.500V', minDiode: 0.410, maxDiode: 0.500, testComponent: 'C2000', notes: 'تغذية التزامن' },
    ],
  },
  // 7. Samsung Galaxy S24 Ultra
  {
    id: 's24u',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    boardCode: 'SM-S928B',
    category: 'mobile',
    socOrCpu: 'Snapdragon 8 Gen 3 for Galaxy',
    rails: [
      { rail: 'VBAT / VPH_PWR', nominalVoltage: '3.8V - 4.3V', diodeRange: '0.360V - 0.440V', minDiode: 0.360, maxDiode: 0.440, testComponent: 'L3001 / C3010', notes: 'الخط الرئيسي الشبيه بـ VDD_MAIN' },
      { rail: 'VDD_CPU_BIG', nominalVoltage: '0.70V - 1.10V', diodeRange: '0.015V - 0.040V', minDiode: 0.015, maxDiode: 0.040, testComponent: 'L1002 (Cortex-X4)', notes: 'نواة الأداء العالي للمعالج' },
      { rail: 'VDD_LPDDR5X', nominalVoltage: '1.05V / 0.55V', diodeRange: '0.220V - 0.310V', minDiode: 0.220, maxDiode: 0.310, testComponent: 'C2201', notes: 'تغذية ذاكرة الرام السريعة' },
      { rail: 'VREG_L5A_1P8', nominalVoltage: '1.8V', diodeRange: '0.450V - 0.530V', minDiode: 0.450, maxDiode: 0.530, testComponent: 'C2050', notes: 'خط إشارات الحساسات و I2C' },
    ],
  },
  // 8. Samsung Galaxy S23 Ultra
  {
    id: 's23u',
    brand: 'Samsung',
    model: 'Galaxy S23 Ultra',
    boardCode: 'SM-S918B',
    category: 'mobile',
    socOrCpu: 'Snapdragon 8 Gen 2 for Galaxy',
    rails: [
      { rail: 'VPH_PWR', nominalVoltage: '3.8V - 4.2V', diodeRange: '0.350V - 0.430V', minDiode: 0.350, maxDiode: 0.430, testComponent: 'L3000 / PMIC', notes: 'تغذية النظام العامة' },
      { rail: 'VDD_CPU_CORE', nominalVoltage: '0.75V - 1.15V', diodeRange: '0.018V - 0.045V', minDiode: 0.018, maxDiode: 0.045, testComponent: 'L1005', notes: 'أنوية المعالج' },
      { rail: 'VDD_RAM_1P05', nominalVoltage: '1.05V', diodeRange: '0.240V - 0.320V', minDiode: 0.240, maxDiode: 0.320, testComponent: 'C2101', notes: 'رام الجهاز' },
      { rail: 'VREG_1P8_ALW', nominalVoltage: '1.8V', diodeRange: '0.430V - 0.510V', minDiode: 0.430, maxDiode: 0.510, testComponent: 'C2003', notes: 'إشارات الإقلاع والـ Power On' },
    ],
  },
  // 9. Samsung Galaxy S22 Ultra
  {
    id: 's22u',
    brand: 'Samsung',
    model: 'Galaxy S22 Ultra',
    boardCode: 'SM-S908B',
    category: 'mobile',
    socOrCpu: 'Snapdragon 8 Gen 1 / Exynos 2200',
    rails: [
      { rail: 'VPH_PWR', nominalVoltage: '3.8V - 4.2V', diodeRange: '0.340V - 0.420V', minDiode: 0.340, maxDiode: 0.420, testComponent: 'L3001', notes: 'خط التغذية الأساسي' },
      { rail: 'VDD_CPU_BIG', nominalVoltage: '0.80V - 1.10V', diodeRange: '0.020V - 0.050V', minDiode: 0.020, maxDiode: 0.050, testComponent: 'L1002', notes: 'معالج كوالكوم / إكسينوس' },
      { rail: 'VREG_1P8_S2', nominalVoltage: '1.8V', diodeRange: '0.420V - 0.500V', minDiode: 0.420, maxDiode: 0.500, testComponent: 'C2015', notes: 'تغذية الحساسات' },
    ],
  },
  // 10. Samsung Galaxy S21 Ultra
  {
    id: 's21u',
    brand: 'Samsung',
    model: 'Galaxy S21 Ultra',
    boardCode: 'SM-G998B',
    category: 'mobile',
    socOrCpu: 'Exynos 2100 / Snapdragon 888',
    rails: [
      { rail: 'VPH_PWR', nominalVoltage: '3.8V', diodeRange: '0.330V - 0.415V', minDiode: 0.330, maxDiode: 0.415, testComponent: 'L3000', notes: 'خط التوزيع العام' },
      { rail: 'VDD_CPU_CORE', nominalVoltage: '0.85V', diodeRange: '0.022V - 0.055V', minDiode: 0.022, maxDiode: 0.055, testComponent: 'L1000', notes: 'معالج السامسونج' },
      { rail: 'VDD_RAM_1P2', nominalVoltage: '1.2V', diodeRange: '0.260V - 0.340V', minDiode: 0.260, maxDiode: 0.340, testComponent: 'C2100', notes: 'تغذية الرام LPDDR5' },
    ],
  },
  // 11. MacBook Air M1 A2337
  {
    id: 'mba_m1',
    brand: 'Apple',
    model: 'MacBook Air M1 (A2337)',
    boardCode: '820-02020',
    category: 'laptop',
    socOrCpu: 'Apple M1 Silicon (8-Core)',
    rails: [
      { rail: 'PPBUS_AON', nominalVoltage: '12.0V - 12.6V', diodeRange: '0.440V - 0.520V', minDiode: 0.440, maxDiode: 0.520, testComponent: 'F5200 / C5201', notes: 'أهم خط بالماك بوك؛ شورت عليه يثبت التيستر على 5V' },
      { rail: 'PP3V3_G3H', nominalVoltage: '3.3V', diodeRange: '0.360V - 0.440V', minDiode: 0.360, maxDiode: 0.440, testComponent: 'L5800', notes: 'جهد 3.3V الدائم لتشغيل آيسيهات التايب سي' },
      { rail: 'PP1V8_G3S', nominalVoltage: '1.8V', diodeRange: '0.410V - 0.490V', minDiode: 0.410, maxDiode: 0.490, testComponent: 'C5805', notes: 'خط الاستعداد وتغذية الرام' },
      { rail: 'PPVDD_CPU_SRAM', nominalVoltage: '0.80V', diodeRange: '0.015V - 0.035V', minDiode: 0.015, maxDiode: 0.035, testComponent: 'L7700', notes: 'ذاكرة كاش المعالج M1' },
      { rail: 'PP1V25_S2', nominalVoltage: '1.25V', diodeRange: '0.280V - 0.360V', minDiode: 0.280, maxDiode: 0.360, testComponent: 'C7800', notes: 'الذاكرة الموحدة UMA' },
    ],
  },
  // 12. MacBook Pro 14" M1 Pro A2442
  {
    id: 'mbp_m1pro',
    brand: 'Apple',
    model: 'MacBook Pro 14" M1 Pro (A2442)',
    boardCode: '820-02098',
    category: 'laptop',
    socOrCpu: 'Apple M1 Pro',
    rails: [
      { rail: 'PPBUS_AON', nominalVoltage: '12.0V - 12.8V', diodeRange: '0.430V - 0.510V', minDiode: 0.430, maxDiode: 0.510, testComponent: 'F5200', notes: 'خط التغذية العمومي' },
      { rail: 'PP3V3_AON', nominalVoltage: '3.3V', diodeRange: '0.370V - 0.450V', minDiode: 0.370, maxDiode: 0.450, testComponent: 'L5820', notes: 'تغذية دوائر الإقلاع' },
      { rail: 'PP5V_AON', nominalVoltage: '5.0V', diodeRange: '0.400V - 0.480V', minDiode: 0.400, maxDiode: 0.480, testComponent: 'L5840', notes: 'تغذية مخارج الـ Type-C' },
      { rail: 'PP_VDD_SOC', nominalVoltage: '0.85V', diodeRange: '0.012V - 0.030V', minDiode: 0.012, maxDiode: 0.030, testComponent: 'L7200', notes: 'معالج M1 Pro' },
    ],
  },
  // 13. Dell Latitude 5400
  {
    id: 'dell_5400',
    brand: 'Dell',
    model: 'Latitude 5400',
    boardCode: 'EDC51 LA-G891P',
    category: 'laptop',
    socOrCpu: 'Intel Core 8th/9th Gen (Whiskey Lake)',
    rails: [
      { rail: '+19V_DC_IN / +PWR_SRC', nominalVoltage: '19.5V', diodeRange: '0.460V - 0.560V', minDiode: 0.460, maxDiode: 0.560, testComponent: 'PQ301 / PR301', notes: 'خط الدخل الرئيسي بعد موسفيتي الحماية' },
      { rail: '+3.3VALW', nominalVoltage: '3.3V', diodeRange: '0.340V - 0.420V', minDiode: 0.340, maxDiode: 0.420, testComponent: 'PL301', notes: 'كويل 3.3V الستاندباي المستمر' },
      { rail: '+5VALW', nominalVoltage: '5.0V', diodeRange: '0.380V - 0.470V', minDiode: 0.380, maxDiode: 0.470, testComponent: 'PL302', notes: 'كويل 5.0V الستاندباي' },
      { rail: '+1.2V_DDR4', nominalVoltage: '1.2V', diodeRange: '0.270V - 0.350V', minDiode: 0.270, maxDiode: 0.350, testComponent: 'PL501', notes: 'تغذية بنك الرام DDR4' },
      { rail: '+VCC_CORE', nominalVoltage: '0.80V - 1.05V', diodeRange: '0.012V - 0.032V', minDiode: 0.012, maxDiode: 0.032, testComponent: 'PL601 - PL603', notes: 'تغذية أنوية إنتل' },
      { rail: '+VCCGT (Graphics)', nominalVoltage: '0.85V', diodeRange: '0.015V - 0.038V', minDiode: 0.015, maxDiode: 0.038, testComponent: 'PL604', notes: 'كرت الشاشة الداخلي' },
    ],
  },
  // 14. Dell Inspiron 5521 / 3521
  {
    id: 'dell_5521',
    brand: 'Dell',
    model: 'Inspiron 5521 / 3521',
    boardCode: 'LA-9104P',
    category: 'laptop',
    socOrCpu: 'Intel Core 3rd Gen (Ivy Bridge)',
    rails: [
      { rail: '+19V_VIN', nominalVoltage: '19.5V', diodeRange: '0.450V - 0.550V', minDiode: 0.450, maxDiode: 0.550, testComponent: 'PQ301 / PQ302', notes: 'موسفيتات الدخل؛ شورت شهير على PC308' },
      { rail: '+3.3VALW', nominalVoltage: '3.3V', diodeRange: '0.350V - 0.430V', minDiode: 0.350, maxDiode: 0.430, testComponent: 'PL100', notes: 'كويل 3.3V ستاندباي' },
      { rail: '+5VALW', nominalVoltage: '5.0V', diodeRange: '0.390V - 0.480V', minDiode: 0.390, maxDiode: 0.480, testComponent: 'PL101', notes: 'كويل 5.0V ستاندباي' },
      { rail: '+1.5V_DDR3', nominalVoltage: '1.5V', diodeRange: '0.290V - 0.370V', minDiode: 0.290, maxDiode: 0.370, testComponent: 'PL200', notes: 'تغذية رام DDR3L' },
      { rail: '+VCORE', nominalVoltage: '0.90V - 1.15V', diodeRange: '0.015V - 0.040V', minDiode: 0.015, maxDiode: 0.040, testComponent: 'PL700', notes: 'أنوية معالج إنتل' },
    ],
  },
  // 15. Lenovo ThinkPad T480
  {
    id: 't480',
    brand: 'Lenovo',
    model: 'ThinkPad T480',
    boardCode: 'NM-B501',
    category: 'laptop',
    socOrCpu: 'Intel Core 8th Gen (Kaby Lake R)',
    rails: [
      { rail: '+20V_VIN (Type-C)', nominalVoltage: '20.0V', diodeRange: '0.470V - 0.570V', minDiode: 0.470, maxDiode: 0.570, testComponent: 'PQ301 / PR301', notes: 'دخل شاحن التايب سي' },
      { rail: '+3.3VALW', nominalVoltage: '3.3V', diodeRange: '0.340V - 0.420V', minDiode: 0.340, maxDiode: 0.420, testComponent: 'PL301', notes: '3.3V الستاندباي' },
      { rail: '+5VALW', nominalVoltage: '5.0V', diodeRange: '0.380V - 0.470V', minDiode: 0.380, maxDiode: 0.470, testComponent: 'PL302', notes: '5.0V الستاندباي' },
      { rail: '+1.2V_DDR4', nominalVoltage: '1.2V', diodeRange: '0.270V - 0.350V', minDiode: 0.270, maxDiode: 0.350, testComponent: 'PL401', notes: 'رام DDR4' },
      { rail: '+VCORE', nominalVoltage: '0.80V - 1.05V', diodeRange: '0.012V - 0.035V', minDiode: 0.012, maxDiode: 0.035, testComponent: 'PL601', notes: 'أنوية المعالج' },
    ],
  },
  // 16. HP EliteBook 840 G5
  {
    id: 'hp840g5',
    brand: 'HP',
    model: 'EliteBook 840 G5',
    boardCode: '6050A2945601-MB-A01',
    category: 'laptop',
    socOrCpu: 'Intel Core 8th Gen',
    rails: [
      { rail: '+19.5V_VIN', nominalVoltage: '19.5V', diodeRange: '0.460V - 0.560V', minDiode: 0.460, maxDiode: 0.560, testComponent: 'Q6001 / R6000', notes: 'مسار الشاحن الأساسي' },
      { rail: '+3.3V_ALW', nominalVoltage: '3.3V', diodeRange: '0.350V - 0.430V', minDiode: 0.350, maxDiode: 0.430, testComponent: 'L6100', notes: 'كويل 3.3V ستاندباي' },
      { rail: '+5.0V_ALW', nominalVoltage: '5.0V', diodeRange: '0.390V - 0.480V', minDiode: 0.390, maxDiode: 0.480, testComponent: 'L6150', notes: 'كويل 5.0V ستاندباي' },
      { rail: '+1.2V_RAM', nominalVoltage: '1.2V', diodeRange: '0.280V - 0.360V', minDiode: 0.280, maxDiode: 0.360, testComponent: 'L6200', notes: 'جهد بنوك الرام DDR4' },
    ],
  },
];

interface TopDiodeMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TopDiodeMatrixModal({ isOpen, onClose }: TopDiodeMatrixModalProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'mobile' | 'laptop'>('all');
  const [selectedDevice, setSelectedDevice] = useState<DeviceDiodeData>(TOP_MODELS_DIODE_MATRIX[0]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // إدخال القياس الحي للفني للمقارنة
  const [userReadingInput, setUserReadingInput] = useState<string>('');
  const [selectedRailForCheck, setSelectedRailForCheck] = useState<RailDiodeInfo | null>(null);

  const filteredDevices = useMemo(() => {
    return TOP_MODELS_DIODE_MATRIX.filter((d) => {
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        d.model.toLowerCase().includes(q) ||
        d.boardCode.toLowerCase().includes(q) ||
        d.brand.toLowerCase().includes(q) ||
        d.socOrCpu.toLowerCase().includes(q) ||
        d.rails.some((r) => r.rail.toLowerCase().includes(q))
      );
    });
  }, [search, categoryFilter]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  // تقييم ممانعة الفني الحية
  const evaluateUserReading = (userVal: number, rail: RailDiodeInfo) => {
    if (isNaN(userVal)) return null;
    if (userVal <= 0.050) {
      return { status: 'SHORT', text: 'شورت صريح (Short Circuit) - قصر للأرضي!', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' };
    }
    if (userVal >= 1.5 || userVal === 0) {
      return { status: 'OPEN', text: 'مسار مقطوع (OL / Open Line) أو انقطاع في المكون!', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
    }
    if (userVal >= rail.minDiode * 0.85 && userVal <= rail.maxDiode * 1.15) {
      return { status: 'NORMAL', text: 'ممانعة سليمة ومطابقة للقيم القياسية الهندسية ✅', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' };
    }
    if (userVal < rail.minDiode * 0.85) {
      return { status: 'LEAK', text: 'تسريب جزئي (Partial Leak) - مكثف أو آيسي يسرب للأرضي!', color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' };
    }
    return { status: 'HIGH', text: 'ممانعة مرتفعة عن الطبيعي - راجع مقاومات الرفع!', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' };
  };

  const parsedUserVal = parseFloat(userReadingInput);
  const evaluationResult = selectedRailForCheck && !isNaN(parsedUserVal)
    ? evaluateUserReading(parsedUserVal, selectedRailForCheck)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-amber-500/40 shadow-2xl overflow-hidden text-right">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                  مرجع قياسات الورشة 🏆
                </span>
                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                  جدول ممانعات ومسارات أهم 20 موديلاً (Diode Matrix)
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                قيم ممانعات وضع الدايود الحقيقية (بالموجب على الأرضي والسالب على المسار) لأشهر هواتف وحواسيب الوطن العربي
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-xl shrink-0">
              ⚡
            </div>
          </div>
        </div>

        {/* Toolbar: Category Filters + Search */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-gray-200 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                categoryFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              الكل ({TOP_MODELS_DIODE_MATRIX.length})
            </button>
            <button
              onClick={() => setCategoryFilter('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                categoryFilter === 'mobile'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              موبايل (10)
            </button>
            <button
              onClick={() => setCategoryFilter('laptop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                categoryFilter === 'laptop'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              لابتوب & ماك (6)
            </button>
          </div>

          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالموديل، رقم البوردة (مثلاً 820-02384)، أو اسم المسار..."
              className="w-full pr-9 pl-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Content Body: Split View (Device Picker List on Right, Details Table on Left) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Device Selector Sidebar (Cols 4) */}
          <div className="md:col-span-4 border-l border-gray-200 dark:border-slate-800 overflow-y-auto max-h-[35vh] md:max-h-none p-2 space-y-1.5 bg-gray-50/50 dark:bg-slate-950/40">
            {filteredDevices.map((d) => {
              const isSelected = selectedDevice.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDevice(d);
                    setSelectedRailForCheck(d.rails[0]);
                    setUserReadingInput('');
                  }}
                  className={`w-full text-right p-3 rounded-2xl transition-all border flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-md text-amber-500'
                      : 'bg-white dark:bg-slate-800/60 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">
                        {d.category === 'mobile' ? '📱' : '💻'}
                      </span>
                      <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                        {d.model}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                      {d.boardCode} • {d.socOrCpu}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold shrink-0">
                    {d.rails.length} مسارات
                  </span>
                </button>
              );
            })}
          </div>

          {/* Details & Live Evaluator (Cols 8) */}
          <div className="md:col-span-8 flex flex-col overflow-y-auto p-4 space-y-4">
            {/* Device Header Info */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-800/10 to-transparent border border-amber-500/20 flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedDevice.category === 'mobile' ? '📱' : '💻'}</span>
                  <h3 className="font-black text-sm sm:text-base text-gray-900 dark:text-white">
                    {selectedDevice.brand} {selectedDevice.model}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 text-[10px] font-mono font-bold">
                    {selectedDevice.boardCode}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  المعالج الرئيسي: <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedDevice.socOrCpu}</span>
                </p>
              </div>

              <div className="text-left text-[11px] text-gray-500 dark:text-gray-400">
                طريقة الفحص: وضع الدايود (الأحمر على الأرضي GND)
              </div>
            </div>

            {/* Live Diode Comparison Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  مقارنة قياسك الميداني فوراً (Live Evaluator)
                </span>
                <span className="text-[10px] text-gray-400">
                  المسار المحدد: {selectedRailForCheck?.rail || 'اختر مساراً بالأسفل'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.001"
                  value={userReadingInput}
                  onChange={(e) => setUserReadingInput(e.target.value)}
                  placeholder="أدخل قراءة الآفوميتر (مثلاً 0.385 أو 0.002)..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono text-center"
                />
                {userReadingInput && (
                  <button
                    onClick={() => setUserReadingInput('')}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-gray-400 hover:text-white text-xs font-bold"
                  >
                    مسح
                  </button>
                )}
              </div>

              {evaluationResult && (
                <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${evaluationResult.color}`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{evaluationResult.text}</span>
                </div>
              )}
            </div>

            {/* Rails Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-gray-900 dark:text-gray-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-500" />
                المسارات الحيوية وقيم الممانعة القياسية:
              </h4>

              <div className="space-y-2">
                {selectedDevice.rails.map((rail, idx) => {
                  const isChecked = selectedRailForCheck?.rail === rail.rail;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedRailForCheck(rail)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                          : 'bg-white dark:bg-slate-800/40 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-gray-900 dark:text-white">
                            {rail.rail}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-mono font-bold">
                            {rail.nominalVoltage}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-mono font-black text-xs">
                            {rail.diodeRange}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(`${rail.rail} (${rail.diodeRange})`, rail.rail);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-white"
                            title="نسخ المسار والممانعة"
                          >
                            {copiedKey === rail.rail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between flex-wrap gap-1">
                        <span>نقطة الفحص / المكون: <strong className="text-amber-500 font-mono">{rail.testComponent}</strong></span>
                        <span className="text-gray-400">{rail.notes}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>💡 نصيحة مهندس: الممانعة تُقاس دائماً بدون توصيل الشاحن أو البطارية، مع تفريغ أي مكثفات مشحونة.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 font-bold transition text-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
