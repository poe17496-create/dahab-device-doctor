'use client';

import React, { useState, useMemo } from 'react';
import QuickDiodeEvaluatorModal from '@/components/QuickDiodeEvaluatorModal';
import SilkScreenCheatSheetModal from '@/components/SilkScreenCheatSheetModal';
import TopDiodeMatrixModal from '@/components/TopDiodeMatrixModal';
import WorkshopCasesModal from '@/components/WorkshopCasesModal';
import {
  Wrench,
  Smartphone,
  Laptop,
  Zap,
  Flame,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Info,
  Calculator,
  Search,
  ArrowRightLeft,
  BatteryCharging,
  Hash,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RotateCcw,
  AlertOctagon,
  Cpu,
  FileText,
  Printer,
  Sparkles,
  ShieldAlert,
  UploadCloud,
  FileUp,
  FileCheck,
  Trash2,
} from 'lucide-react';

/* =========================================================================
   أنواع البيانات والحالات المشتركة
   ========================================================================= */

type ToolCategory = 'mobile' | 'laptop';

interface MobileRailData {
  id: string;
  name: string;
  nominal: number;
  safeInject: number;
  maxSafe: number;
  danger: number;
  suspects: string;
  notes: string;
}

interface LaptopRailData {
  id: string;
  name: string;
  nominal: number;
  safeInject: number;
  maxSafe: number;
  danger: number;
  suspects: string;
  notes: string;
}

/* =========================================================================
   قواعد البيانات الهندسية المتخصصة
   ========================================================================= */

// مسارات الموبايل
const MOBILE_RAILS: MobileRailData[] = [
  {
    id: 'mob_vdd_main',
    name: 'PP_VDD_MAIN / VPH_PWR / VBUS',
    nominal: 3.8,
    safeInject: 1.8,
    maxSafe: 3.8,
    danger: 4.5,
    suspects: 'مكثفات خط التغذية التوازي (Ceramic Caps)، آيسي الشحن، مكبرات الصوت (Audio Amp)',
    notes: 'ابدأ بالحقن عند 1.2V ثم ارفع تدريجياً لـ 1.8V مع مراقبة انصهار الرجينة أو الكاميرا الحرارية.',
  },
  {
    id: 'mob_cpu',
    name: 'PP_CPU_CORE / VCORE (فولت المعالج)',
    nominal: 0.9,
    safeInject: 0.65,
    maxSafe: 0.95,
    danger: 1.1,
    suspects: 'مكثفات تصفية المعالج، موسفيتات درايفر البك، المعالج نفسه (SoC)',
    notes: '⚠️ خط أحمر هندسي! لا تتجاوز 0.8V في الحقن أبداً. الفولت الزائد يحرق طبقات السيليكون الداخلية.',
  },
  {
    id: 'mob_gpu',
    name: 'PP_GPU / GFX (معالج الرسوميات)',
    nominal: 0.85,
    safeInject: 0.6,
    maxSafe: 0.9,
    danger: 1.05,
    suspects: 'مكثفات تصفية الرسوميات، وحدات الفازات (Phases)',
    notes: 'الممانعة على هذا المسار منخفضة جداً بطبيعتها (0.010V - 0.050V) ولا تعني شورت بالضرورة.',
  },
  {
    id: 'mob_1v8',
    name: 'PP1V8_ALWAYS / VREG_L6_1P8 (فولت 1.8V)',
    nominal: 1.8,
    safeInject: 1.2,
    maxSafe: 1.8,
    danger: 2.2,
    suspects: 'آيسي الذاكرة NAND/UFS، آيسي الباور الرئيسي PMIC، مقاومات رفع ناقل I2C',
    notes: 'مسار حيوي يغذي الذواكر ودوائر التوقيت. لا تحقن أكثر من 1.5V لتفادي حرق الذاكرة.',
  },
  {
    id: 'mob_dram',
    name: 'PP_DRAM / VDD_RAM (LPDDR4 / LPDDR5)',
    nominal: 1.1,
    safeInject: 0.8,
    maxSafe: 1.15,
    danger: 1.3,
    suspects: 'مكثفات تصفية الرامات، آيسي تنظيم رامات المعالج',
    notes: 'الرامات شديدة الحساسية للحرارة والفولت الزائد. احقن بحد أقصى 0.85V.',
  },
  {
    id: 'mob_nfc',
    name: 'PP_NFC_VDD (تغذية شريحة NFC)',
    nominal: 1.8,
    safeInject: 1.2,
    maxSafe: 1.8,
    danger: 2.0,
    suspects: 'آيسي NFC، مكثفات فلترة الهوائي، المقاومات المحيطة',
    notes: 'الشورت في هذا المسار قد يسبب سخونة عامة في أعلى البوردة بدون توقف الجهاز تماماً.',
  },
  {
    id: 'mob_touch',
    name: 'PP_TOUCH / VDD_TOUCH (تغذية اللمس)',
    nominal: 3.3,
    safeInject: 1.8,
    maxSafe: 3.3,
    danger: 3.6,
    suspects: 'آيسي اللمس (Touch IC)، ديودات الحماية، فلاتة الشاشة',
    notes: 'تأكد من فصل الشاشة أولاً قبل الحقن لتجنب إتلاف دائرة الإضاءة والتحكم بالشاشة.',
  },
  {
    id: 'mob_lcd',
    name: 'PP_LCD / DISPLAY_PWR (تغذية الشاشة والإضاءة)',
    nominal: 5.5,
    safeInject: 3.0,
    maxSafe: 5.5,
    danger: 6.0,
    suspects: 'آيسي الإضاءة (Backlight Boost IC)، ديود الإضاءة (Diode)، ملف الإضاءة (Coil)',
    notes: 'تحذير: جهد هذا المسار يرتفع في وضع التشغيل إلى 16V-22V في شاشات LCD، لكن الحقن يكون على 3.7V فقط.',
  },
];

// مسارات اللابتوب
const LAPTOP_RAILS: LaptopRailData[] = [
  {
    id: 'lap_19v',
    name: '19V DC-IN / VIN / BATT_VCC (مسار الدخل الرئيسي)',
    nominal: 19.5,
    safeInject: 12.0,
    maxSafe: 20.0,
    danger: 22.0,
    suspects: 'موسفيتات الدخل الأولى والثانية (PQ301 / PQ302)، مكثفات السيراميك، آيسي الشحن',
    notes: 'ابدأ بالحقن عند 5V بتيار 1A، ثم ارفع تدريجياً لـ 12V بتيار 2A لمراقبة العنصر الساخن.',
  },
  {
    id: 'lap_ppbus',
    name: 'PPBUS_G3H (الماك بوك MacBook Main Rail)',
    nominal: 12.56,
    safeInject: 8.0,
    maxSafe: 13.1,
    danger: 14.5,
    suspects: 'آيسي الشحن ISL9239 / ISL9240، موسفيتات التبديل، مكثفات التنتالوم والسيراميك',
    notes: 'في موديلات M1/M2/M3 يكون الجهد الطبيعي 12.0V-12.6V. احقن بحد أقصى 8.5V لتفادي حرق المعالج إذا كان هناك تسريب علوي.',
  },
  {
    id: 'lap_3v_alw',
    name: '3V3_ALW / 3V3_SUS (جهد 3.3V الدائم)',
    nominal: 3.3,
    safeInject: 2.0,
    maxSafe: 3.3,
    danger: 3.8,
    suspects: 'شريحة الـ SIO (IT8586 / MEC1633)، شريحة PCH، آيسي الباور المساعد 3V/5V',
    notes: '⚠️ إذا سخنت شريحة الـ SIO أو PCH عند الحقن فهذا يعني احتراقها الداخلي وتحتاج استبدال.',
  },
  {
    id: 'lap_5v_alw',
    name: '5V_ALW / 5V_SUS (جهد 5.0V الدائم)',
    nominal: 5.0,
    safeInject: 3.3,
    maxSafe: 5.0,
    danger: 5.5,
    suspects: 'مفاتيح طاقة منافذ الـ USB، آيسي الصوت، منظمات الـ LDO',
    notes: 'افحص سوكتات الـ USB للتأكد من عدم وجود تلامس فيزيائي بالأرجل الداخلية قبل الحقن.',
  },
  {
    id: 'lap_pp3v42',
    name: 'PP3V42_G3H (ماك بوك القديم)',
    nominal: 3.42,
    safeInject: 2.5,
    maxSafe: 3.42,
    danger: 4.0,
    suspects: 'آيسي LT3470 / ISL6259، شريحة SMC، دايود الحماية D6990',
    notes: 'هذا المسار هو المسؤول الأول عن إضاءة شاحن الماك بوك باللون الأخضر أو البرتقالي.',
  },
  {
    id: 'lap_vcore',
    name: 'VCORE_CPU (فولت المعالج للابتوب والمازربورد)',
    nominal: 0.95,
    safeInject: 0.6,
    maxSafe: 1.15,
    danger: 1.4,
    suspects: 'وحدات DrMOS، مكثفات التنتالوم أسفل السوكت، المعالج نفسه',
    notes: '⚠️ خط أحمر! ممانعة المعالج منخفضة طبيعياً جداً (أقل من 2 أوم). لا تحقن أكثر من 0.8V نهائياً!',
  },
  {
    id: 'lap_vgpu',
    name: 'VCORE_GPU / VDD_VGA (فولت كارت الشاشة المنفصل)',
    nominal: 0.9,
    safeInject: 0.6,
    maxSafe: 1.05,
    danger: 1.3,
    suspects: 'موسفيتات فازات كارت الشاشة، درايفر البك، شريحة الرسوميات NVIDIA/AMD',
    notes: 'الممانعة على هذا المسار تتراوح بين 0.2 أوم إلى 2 أوم وهي طبيعية جداً لكروت الفئات العليا.',
  },
  {
    id: 'lap_dram',
    name: 'VDD_MEM (DDR4: 1.2V / DDR5: 1.1V / DDR3L: 1.35V)',
    nominal: 1.2,
    safeInject: 0.85,
    maxSafe: 1.25,
    danger: 1.45,
    suspects: 'مكثفات مسار الرام، آيسي درايفر الرام PWM، بنوك الذاكرة المثبتة On-Board',
    notes: 'انزع بنك الرام المنفصل قبل الحقن. إذا كان الشورت مستمراً فالمكثفات أو الرام المدمج هو السبب.',
  },
];

// أكواد أخطاء سامسونج وآبل
const MOBILE_ERROR_CODES = [
  {
    code: 'iTunes 4013',
    brand: 'Apple',
    title: 'خطأ 4013 (توقف التحديث عند شريط البداية)',
    cause: 'عطل في حساس التقارب (Proximity Flex) أو خطوط I2C أو تلف في ذاكرة NAND أو تغذية الـ Baseband.',
    solution: '1. افصل فلاتة السماعة والحساس وجرب السوفت ثانياً.\n2. افحص مكثفات خط VDD_MAIN حول آيسي الذاكرة.\n3. أعد تركيب أو استبدال فلاشة الـ NAND.',
  },
  {
    code: 'iTunes 4014',
    brand: 'Apple',
    title: 'خطأ 4014 (فشل اتصال المعالج بالرامات)',
    cause: 'فشل تواصل الـ CPU مع طبقة الرام العلوية (RAM Layer) أو انقطاع مسارات التغذية الرئيسية للمعالج.',
    solution: '1. افحص تغذيات الـ CPU والـ DRAM.\n2. استخدام كابل USB أصلي ومنفذ خلفي.\n3. قد يتطلب إعادة شبلنة الرام أو المعالج (Reballing).',
  },
  {
    code: 'iTunes 9',
    brand: 'Apple',
    title: 'خطأ 9 (فشل نقل حزم البيانات)',
    cause: 'انقطاع الاتصال بذاكرة الـ NAND فجأة، أو خلل في كابل التوصيل، أو قطع في مسارات خطوط EEPROM.',
    solution: '1. افحص مسارات ARB وخطوط البيانات للـ NAND.\n2. تغيير كابل USB أو مدخل الشحن.\n3. فحص مقاومة مسارات الـ I2C0.',
  },
  {
    code: 'iTunes 14',
    brand: 'Apple',
    title: 'خطأ 14 (فشل فك حزمة التحديث IPSW)',
    cause: 'امتلاء ذاكرة التخزين بنسبة 100% مما يمنع تثبيت النظام، أو عطل في كابل USB.',
    solution: '1. استخدم ميزة Fix Recovery عبر 3uTools.\n2. تفليش الجهاز بوضع Retain User Data مع تفريغ الكاش.\n3. في حال استمرار الخطأ، يلزم عمل Restore كامل.',
  },
  {
    code: 'iTunes 53',
    brand: 'Apple',
    title: 'خطأ 53 (فشل التحقق من مستشعر البصمة)',
    cause: 'تلف مستشعر البصمة Touch ID أو قطع في فلاتة الزر الأصلية المشفرة مع المعالج.',
    solution: 'تم إصلاح هذا الخطأ برمجياً بواسطة آبل؛ حدّث لآخر إصدار iOS لتجاوز فحص البصمة والسماح بالإقلاع.',
  },
  {
    code: 'iTunes 56',
    brand: 'Apple',
    title: 'خطأ 56 (فشل الاتصال بشريحة NFC)',
    cause: 'تلف شريحة الـ NFC أو الكاميرا الخلفية أو انقطاع خط التغذية PP_NFC_VDD.',
    solution: '1. افصل الكاميرا الخلفية وجرب التفليش.\n2. افحص دايود مسار الـ NFC وتأكد من سلامة تغذية 1.8V.',
  },
  {
    code: 'NAND Write Start FAIL',
    brand: 'Samsung',
    title: 'فشل بدء الكتابة على الذاكرة (Odin)',
    cause: 'ذاكرة التخزين eMMC / UFS في وضع القراءة فقط (Read-Only) بسبب استهلاك دورات الكتابة، أو تلف آيسي الباور.',
    solution: '1. تجربة روم 4 ملفات مع ملف PIT لإعادة تقسيم الذاكرة.\n2. فحص فولتيات تغذية الذاكرة 1.8V و 2.8V.\n3. استبدال شريحة UFS/eMMC وبرمجتها.',
  },
  {
    code: 'SW REV CHECK FAIL [boot]',
    brand: 'Samsung',
    title: 'فشل فحص الحماية الثنائية Binary',
    cause: 'محاولة تفليش روم يحمل إصدار حماية (Binary) أقل من الحماية المثبتة حالياً على الهاتف.',
    solution: 'تحميل روم رسمي يحمل نفس رقم الحماية أو أعلى (مثال: U3 لا يقبل الرجوع لـ U2).',
  },
  {
    code: 'FRP LOCK ON',
    brand: 'Samsung',
    title: 'حماية حساب جوجل مفعلة (FRP)',
    cause: 'محاولة تفليش ملفات معدلة (Root / TWRP / Custom Kernel) أثناء تفعيل حماية FRP.',
    solution: '1. تفليش روم رسمي أصلي كامل لإعادة إقلاع الجهاز.\n2. تخطي حساب جوجل بعد الفتح عبر الثغرات الرسمية أو الأدوات المعتمدة.',
  },
  {
    code: 'Complete(Write) operation failed',
    brand: 'Samsung',
    title: 'فشل استكمال عملية الكتابة في Odin',
    cause: 'انقطاع اتصال USB بسبب سوكت شحن رديء أو كابل تالف أو تعريفات Samsung USB غير متوافقة.',
    solution: '1. تنظيف سوكت الشحن أو استبدال فلاتة الشحن.\n2. استخدام كابل أصلي وتوصيله بمنفذ USB خلفي بالكمبيوتر.\n3. إعادة تثبيت Samsung USB Mobile Driver.',
  },
];

// أكواد شاشة الموت الزرقاء للكمبيوتر واللابتوب
const BSOD_CODES = [
  {
    code: '0x0000007E',
    name: 'SYSTEM_THREAD_EXCEPTION_NOT_HANDLED',
    cause: 'تعارض في تعريفات العتاد (GPU/Audio)، أو عدم استقرار مكثفات تغذية المعالج والرام.',
    hardwareFix: 'افحص مكثفات دائرة VCORE، واختبر الرامات ببرنامج MemTest86، ونظف سوكت المعالج.',
    softwareFix: 'الدخول للوضع الآمن Safe Mode وحذف آخر تعريف تم تثبيته بواسطة DDU.',
  },
  {
    code: '0x0000000A',
    name: 'IRQL_NOT_LESS_OR_EQUAL',
    cause: 'تعارض خطوط المقاطعة في العتاد، أو تلف كارت الشبكة Wi-Fi أو تلف أحد بنوك الرام.',
    hardwareFix: 'انزع كارت الواي فاي وجرب، غير بنك الرام في السلوت الثاني، تأكد من سلامة الجسور الحرارية.',
    softwareFix: 'تحديث تعريفات الـ Chipset والـ BIOS لآخر إصدار مستقر من موقع الشركة المصنعة.',
  },
  {
    code: '0x00000050',
    name: 'PAGE_FAULT_IN_NONPAGED_AREA',
    cause: 'عطل صريح في خلايا الذاكرة العشوائية RAM، أو قطاعات تالفة في الهارد SSD/NVMe.',
    hardwareFix: 'اختبر كل بنك رام منفرداً. افحص صحة الهارد ببرنامج CrystalDiskInfo للتأكد من عدم تلف الـ NAND.',
    softwareFix: 'تشغيل أمر فحص ملفات النظام: sfc /scannow و chkdsk /f /r.',
  },
  {
    code: '0x0000001A',
    name: 'MEMORY_MANAGEMENT',
    cause: 'عطل هاردوير مباشر في شريحة الرام أو انخفاض جهد تغذية الرامات (1.2V / 1.1V).',
    hardwareFix: 'قس جهد مسار VDD_MEM وتأكد من وصوله بدقة بدون ريبل (Ripple)، ونظف مسارات بنك الرام بمادة عازلة.',
    softwareFix: 'إلغاء تفعيل بروفايل كسر سرعة الرام XMP/DOCP من إعدادات الـ BIOS.',
  },
  {
    code: '0x00000124',
    name: 'WHEA_UNCORRECTABLE_ERROR',
    cause: 'عطل عتادي غير قابل للتصحيح في أنوية المعالج (CPU Core) أو انهيار الفولت أو حرارة قاتلة.',
    hardwareFix: 'تغيير المعجون الحراري وتنظيف المروحة، فحص موسفيتات الـ CPU VRM والتأكد من عدم سخونة أحد الفازات بشكل غير طبيعي.',
    softwareFix: 'إعادة ضبط إعدادات الـ BIOS للوضع الافتراضي وحذف أي برامج ضبط الفولتية (Undelvolting).',
  },
  {
    code: '0x000000F4',
    name: 'CRITICAL_OBJECT_TERMINATION',
    cause: 'انقطاع الاتصال بهارد النظام الأساسي فجأة، أو عطل في كابل SATA أو منفذ M.2 NVMe.',
    hardwareFix: 'افحص خط تغذية الهارد 3.3V و 5V، ونظف منفذ M.2، وتأكد من سلامة مسارات PCIe.',
    softwareFix: 'تحديث الفيرموير (Firmware) الخاص بهارد الـ SSD بواسطة برنامج الشركة الرسمية.',
  },
  {
    code: '0x000000EA',
    name: 'THREAD_STUCK_IN_DEVICE_DRIVER',
    cause: 'انهيار معالج كارت الشاشة المنفصل (GPU) أو كرات القصدير تحته نتيجة الإجهاد الحراري.',
    hardwareFix: 'إعادة لحام أو شبلنة شريحة الكارت (BGA Reballing)، أو تحويل اللابتوب لوضع Uma (كارت الشاشة المدمج فقط).',
    softwareFix: 'تثبيت تعريف كارت الشاشة الأصلي المعتمد من الشركة المصنعة للابتوب وليس تعريف نفيديا الأحدث.',
  },
  {
    code: '0x0000009F',
    name: 'DRIVER_POWER_STATE_FAILURE',
    cause: 'خلل في الانتقال بين حالات السكون وإشارات ACPI بين شريحة الـ SIO وآيسي الشحن.',
    hardwareFix: 'إعادة برمجة شريحة الـ SIO أو الـ BIOS، وفحص مسارات إشارات SUSP# و SLP_S3#.',
    softwareFix: 'تعطيل خاصية التشغيل السريع Fast Startup في إعدادات الباور بويندوز.',
  },
];

// بدائل الآيسيهات السريعة
const QUICK_IC_ALTERNATIVES = [
  {
    category: 'شحن (Charging)',
    original: '1610A2 (Tristar)',
    alternatives: '1610A3, 610A3B (iPhone 6 up to 7 Plus)',
    notes: 'يمكن استخدام 1610A3 كبديل مباشر لـ 1610A2 بدون أي تعديل وبكفاءة أعلى.',
  },
  {
    category: 'شحن (Charging)',
    original: '1612A1 (Hydra)',
    alternatives: 'متوافق مع أجهزة iPhone 8 / X / XR / XS / 11',
    notes: 'لا يتوافق مع أجهزة Tristar القديمة؛ تأكد من التوافق قبل التركيب.',
  },
  {
    category: 'شحن (Charging)',
    original: 'BQ25890',
    alternatives: 'BQ25892, BQ25895, BQ25896',
    notes: 'تأكد من توافق إعدادات ناقل I2C وحد أقصى التيار (Max Charge Current).',
  },
  {
    category: 'باور (Power PMIC)',
    original: '338S1251 (Dialog)',
    alternatives: '338S1216, 338S00248 (iPhone 6 / 6s)',
    notes: 'يجب مطابقة البارت نمبر الدقيق لتفادي مشاكل التعرف على البطارية.',
  },
  {
    category: 'باور (Power PMIC)',
    original: 'PM8150 (Snapdragon)',
    alternatives: 'PM8150A, PM8150B, PM8150L (وظائف مكملة)',
    notes: 'تعمل كمنظومة متكاملة؛ الـ PM8150 هو الآيسي الرئيسي و L مخصص للشاشات والإضاءة.',
  },
  {
    category: 'صوت (Audio Codec)',
    original: '338S1285 (Cirrus Logic)',
    alternatives: 'CS42L71 (أجهزة أبل المتوافقة)',
    notes: 'يتطلب سحب سلك حماية (Jumper) لمسار C12 في iPhone 7 لتفادي تلفه مجدداً.',
  },
  {
    category: 'واي فاي (Wi-Fi / BT)',
    original: '339S00647',
    alternatives: '339S00551 (حسب الموديل)',
    notes: 'يتطلب فك قفل الواي فاي (Unbind Wi-Fi) عبر مبرمجة الذاكرة JC / iRepair قبل التغيير.',
  },
  {
    category: 'إضاءة (Backlight)',
    original: 'SGM3732',
    alternatives: 'AW87319, LM3532, TPS61165',
    notes: 'بدائل ممتازة لرفع جهد الإضاءة حتى 38V، مع التأكد من ترتيب الأرجل (Pinout).',
  },
];

// دليل قيم الدايود
const DIODE_MODE_DATA = {
  mobile: [
    { rail: 'PP_VDD_MAIN / VPH_PWR', normal: '0.350 - 0.500 V', short: '< 0.080 V', open: 'OL / > 0.800 V' },
    { rail: 'PP_CPU_CORE (VCORE)', normal: '0.200 - 0.400 V', short: '< 0.040 V', open: 'OL' },
    { rail: 'PP_GPU (GFX)', normal: '0.150 - 0.350 V', short: '< 0.030 V', open: 'OL' },
    { rail: 'PP1V8_ALWAYS', normal: '0.400 - 0.600 V', short: '< 0.100 V', open: 'OL' },
    { rail: 'PP_BATT_VCC', normal: '0.500 - 0.700 V', short: '< 0.150 V', open: 'OL' },
    { rail: 'PP_VBUS_USB (5V)', normal: '0.400 - 0.550 V', short: '< 0.100 V', open: 'OL' },
    { rail: 'USB Data D+ / D-', normal: '0.550 - 0.750 V', short: '< 0.200 V', open: 'OL (تلف المعالج/الشحن)' },
    { rail: 'I2C SDA / SCL', normal: '0.450 - 0.600 V', short: '< 0.150 V', open: 'OL (قطع مسار الرفع)' },
  ],
  laptop: [
    { rail: '19V Main DC-IN', normal: '0.450 - 0.650 V', short: '< 0.080 V', open: 'OL' },
    { rail: '3V3_ALW Coil', normal: '0.350 - 0.500 V', short: '< 0.050 V', open: 'OL' },
    { rail: '5V_ALW Coil', normal: '0.400 - 0.550 V', short: '< 0.080 V', open: 'OL' },
    { rail: 'VCORE CPU Coil', normal: '0.010 - 0.080 V', short: '< 0.005 V', open: 'مقاومة طبيعية منخفضة' },
    { rail: 'VCORE GPU Coil', normal: '0.015 - 0.100 V', short: '< 0.008 V', open: 'طبيعي منخفض' },
    { rail: '1.05V PCH Coil', normal: '0.150 - 0.300 V', short: '< 0.030 V', open: 'OL' },
    { rail: 'VDD_MEM (DDR4 1.2V)', normal: '0.350 - 0.500 V', short: '< 0.050 V', open: 'OL' },
    { rail: 'PPBUS_G3H (MacBook)', normal: '0.400 - 0.550 V', short: '< 0.080 V', open: 'OL' },
  ],
};

/* =========================================================================
   المكون الرئيسي لتبويب الأدوات الهندسية
   ========================================================================= */

export default function EngineeringToolsTab() {
  const [showDiodeEvaluatorModal, setShowDiodeEvaluatorModal] = useState(false);
  const [showSilkScreenModal, setShowSilkScreenModal] = useState(false);
  const [showTopDiodeModal, setShowTopDiodeModal] = useState(false);
  const [showWorkshopCasesModal, setShowWorkshopCasesModal] = useState(false);
  const [category, setCategory] = useState<ToolCategory>('mobile');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // أدوات الموبايل المفتوحة
  const [expandedMobileTools, setExpandedMobileTools] = useState<Record<string, boolean>>({
    voltage: true,
    panic: false,
    unit: false,
    current: false,
    diode: false,
    errors: false,
    imei: false,
    battery: false,
    alternatives: false,
  });

  // أدوات اللابتوب المفتوحة
  const [expandedLaptopTools, setExpandedLaptopTools] = useState<Record<string, boolean>>({
    lap_voltage: true,
    lap_unit: false,
    lap_current: false,
    bsod: false,
    lap_diode: false,
    current_draw: false,
  });

  const toggleMobileTool = (id: string) => {
    setExpandedMobileTools((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleLaptopTool = (id: string) => {
    setExpandedLaptopTools((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* رأس الصفحة ومحول الفئات */}
      <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dahab-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Wrench className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span>الأدوات الهندسية المتقدمة</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                  ورشة دهب المتكاملة
                </span>
              </h2>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                حاسبات الفولت الآمن، محلل البانيك، محول الوحدات، قيم الدايود، وأكواد الأخطاء بدقة مهنية عالية
              </p>
            </div>
          </div>

          {/* أزرار التبديل الكبرى بين الموبايل واللابتوب */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-900/80 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-800 w-full md:w-auto">
            <button
              onClick={() => setCategory('mobile')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
                category === 'mobile'
                  ? 'bg-gradient-to-r from-dahab-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>📱 أدوات الموبايل (9)</span>
            </button>
            <button
              onClick={() => setCategory('laptop')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
                category === 'laptop'
                  ? 'bg-gradient-to-r from-dahab-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>💻 كمبيوتر / لابتوب (6)</span>
            </button>
          </div>
        </div>

        {/* شريط البحث السريع عن أداة أو كود */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن أداة، كود خطأ (4013, BSOD)، مسار (VDD_MAIN)، أو آيسي..."
              className="w-full pr-10 pl-4 py-2 text-xs md:text-sm rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                مسح
              </button>
            )}
          </div>
          <button
            onClick={() => {
              if (category === 'mobile') {
                const allOpen = Object.values(expandedMobileTools).every(Boolean);
                const nextState: any = {};
                Object.keys(expandedMobileTools).forEach((k) => (nextState[k] = !allOpen));
                setExpandedMobileTools(nextState);
              } else {
                const allOpen = Object.values(expandedLaptopTools).every(Boolean);
                const nextState: any = {};
                Object.keys(expandedLaptopTools).forEach((k) => (nextState[k] = !allOpen));
                setExpandedLaptopTools(nextState);
              }
            }}
            className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            طي / فتح الكل
          </button>
        </div>
      </div>

      {/* أدوات سريعة منبثقة بنقرة واحدة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setShowDiodeEvaluatorModal(true)}
          className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/15 text-right transition-all group shadow-sm flex items-center justify-between"
        >
          <div className="space-y-1 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <span className="font-black text-sm text-gray-900 dark:text-gray-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                مقيم الممانعة السريع (Diode Mode Evaluator)
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              أدخل قيمة الفولت أو الممانعة واعرف فوراً هل الخط سليم أم شورت أم تسريب أم مقطوع OL.
            </p>
          </div>
          <span className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shrink-0 shadow-sm">
            فتح الأداة
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowSilkScreenModal(true)}
          className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent border border-sky-500/30 hover:border-sky-500/60 hover:bg-sky-500/15 text-right transition-all group shadow-sm flex items-center justify-between"
        >
          <div className="space-y-1 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏷️</span>
              <span className="font-black text-sm text-gray-900 dark:text-gray-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">
                دليل رموز السلك سكرين (Silk Screen Cheat Sheet)
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              دليل شامل لرموز المخططات (PU, PQ, PL, PC, PR...) وطريقة قياس كل عنصر وأعطاله الشائعة.
            </p>
          </div>
          <span className="px-3.5 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs shrink-0 shadow-sm">
            فتح الدليل
          </span>
        </button>

        {/* 3. جدول ممانعات أهم 20 موديلاً */}
        <button
          type="button"
          onClick={() => setShowTopDiodeModal(true)}
          className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/15 text-right transition-all group shadow-sm flex items-center justify-between"
        >
          <div className="space-y-1 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <span className="font-black text-sm text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                جدول ممانعات أهم 20 موديلاً (Top 20 Diode Matrix)
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              مرجع قياسات الدايود القياسية لأجهزة iPhone 11-15، سامسونج S21-S24، وماك بوك ولابتوبات Dell و Lenovo.
            </p>
          </div>
          <span className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shrink-0 shadow-sm">
            عرض الممانعات
          </span>
        </button>

        {/* 4. سجل حالات الورشة المؤكدة (تعلّم بوزن النجاح) */}
        <button
          type="button"
          onClick={() => setShowWorkshopCasesModal(true)}
          className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/15 text-right transition-all group shadow-sm flex items-center justify-between"
        >
          <div className="space-y-1 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <span className="font-black text-sm text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                سجل حالات الورشة المؤكدة (تعلّم بوزن النجاح)
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              استعراض الحالات المحلولة بنجاح بالورشة، والتصويت على الحلول، وتوثيق أعطال جديدة لترقية الذكاء الاصطناعي.
            </p>
          </div>
          <span className="px-3.5 py-2 rounded-xl bg-purple-500 text-white font-bold text-xs shrink-0 shadow-sm">
            سجل الورشة
          </span>
        </button>
      </div>

      {/* عرض أدوات الموبايل */}
      {category === 'mobile' && (
        <div className="space-y-4">
          {/* 1. حاسبة الفولت الآمن للموبايل */}
          <ToolCard
            id="voltage"
            title="حاسبة الفولت الآمن للحقن (Mobile Safe Voltage Injection)"
            badge="موبايل"
            icon={Zap}
            color="text-amber-500"
            isOpen={expandedMobileTools.voltage}
            onToggle={() => toggleMobileTool('voltage')}
          >
            <MobileSafeVoltageCalculator />
          </ToolCard>

          {/* 2. محلل البانيك السريع */}
          <ToolCard
            id="panic"
            title="محلل ملفات البانيك السريع (Panic Log Analyzer)"
            badge="آبل وأندرويد"
            icon={AlertOctagon}
            color="text-purple-500"
            isOpen={expandedMobileTools.panic}
            onToggle={() => toggleMobileTool('panic')}
          >
            <QuickPanicAnalyzer />
          </ToolCard>

          {/* 3. محول الوحدات الهندسي */}
          <ToolCard
            id="unit"
            title="محول الوحدات الإلكترونية (Unit Converter)"
            badge="شامل"
            icon={ArrowRightLeft}
            color="text-blue-500"
            isOpen={expandedMobileTools.unit}
            onToggle={() => toggleMobileTool('unit')}
          >
            <UniversalUnitConverter />
          </ToolCard>

          {/* 4. حاسبة التيار الآمن */}
          <ToolCard
            id="current"
            title="حاسبة التيار والقدرة الآمنة (Safe Current & Ohm's Law)"
            badge="حسابات"
            icon={Flame}
            color="text-rose-500"
            isOpen={expandedMobileTools.current}
            onToggle={() => toggleMobileTool('current')}
          >
            <SafeCurrentCalculator />
          </ToolCard>

          {/* 5. دليل قيم الدايود */}
          <ToolCard
            id="diode"
            title="دليل قيم ممانعة الدايود (Diode Mode Reference)"
            badge="قياسات"
            icon={Activity}
            color="text-emerald-500"
            isOpen={expandedMobileTools.diode}
            onToggle={() => toggleMobileTool('diode')}
          >
            <DiodeModeGuide category="mobile" />
          </ToolCard>

          {/* 6. محول أكواد الأخطاء */}
          <ToolCard
            id="errors"
            title="محول أكواد أخطاء السوفت والتفليش (سامسونج وآبل)"
            badge="سوفت وهارد"
            icon={AlertTriangle}
            color="text-orange-500"
            isOpen={expandedMobileTools.errors}
            onToggle={() => toggleMobileTool('errors')}
          >
            <ErrorCodeDecoder initialSearch={searchQuery} />
          </ToolCard>

          {/* 7. فحص IMEI */}
          <ToolCard
            id="imei"
            title="فحص وصحة رقم الـ IMEI (Luhn Algorithm & TAC)"
            badge="أمني وتصنيع"
            icon={Hash}
            color="text-teal-500"
            isOpen={expandedMobileTools.imei}
            onToggle={() => toggleMobileTool('imei')}
          >
            <ImeiInspector />
          </ToolCard>

          {/* 8. حاسبة صحة البطارية */}
          <ToolCard
            id="battery"
            title="حاسبة صحة ودورات شحن البطارية (Battery Health & Life)"
            badge="بطاريات"
            icon={BatteryCharging}
            color="text-green-500"
            isOpen={expandedMobileTools.battery}
            onToggle={() => toggleMobileTool('battery')}
          >
            <BatteryHealthCalculator />
          </ToolCard>

          {/* 9. دليل البدائل السريع */}
          <ToolCard
            id="alternatives"
            title="دليل بدائل الآيسيهات المتوافقة (Quick IC Cross-Reference)"
            badge="قطع غيار"
            icon={Layers}
            color="text-indigo-500"
            isOpen={expandedMobileTools.alternatives}
            onToggle={() => toggleMobileTool('alternatives')}
          >
            <QuickICAlternatives initialSearch={searchQuery} />
          </ToolCard>
        </div>
      )}

      {/* عرض أدوات الكمبيوتر واللابتوب */}
      {category === 'laptop' && (
        <div className="space-y-4">
          {/* 1. حاسبة الفولت لمسارات اللابتوب */}
          <ToolCard
            id="lap_voltage"
            title="حاسبة الفولت الآمن لمسارات اللابتوب والمازربورد"
            badge="لابتوب وماك"
            icon={Zap}
            color="text-amber-500"
            isOpen={expandedLaptopTools.lap_voltage}
            onToggle={() => toggleLaptopTool('lap_voltage')}
          >
            <LaptopSafeVoltageCalculator />
          </ToolCard>

          {/* 2. محول الوحدات (مشترك) */}
          <ToolCard
            id="lap_unit"
            title="محول الوحدات الإلكترونية (Unit Converter)"
            badge="شامل"
            icon={ArrowRightLeft}
            color="text-blue-500"
            isOpen={expandedLaptopTools.lap_unit}
            onToggle={() => toggleLaptopTool('lap_unit')}
          >
            <UniversalUnitConverter />
          </ToolCard>

          {/* 3. حاسبة التيار الآمن (مشترك) */}
          <ToolCard
            id="lap_current"
            title="حاسبة التيار والقدرة الآمنة لمكونات المازربورد"
            badge="حسابات"
            icon={Flame}
            color="text-rose-500"
            isOpen={expandedLaptopTools.lap_current}
            onToggle={() => toggleLaptopTool('lap_current')}
          >
            <SafeCurrentCalculator />
          </ToolCard>

          {/* 4. محول أكواد الشاشة الزرقاء BSOD */}
          <ToolCard
            id="bsod"
            title="محول أكواد شاشة الموت الزرقاء وأخطاء ويندوز (BSOD Stop Codes)"
            badge="ويندوز وعتاد"
            icon={ShieldAlert}
            color="text-sky-500"
            isOpen={expandedLaptopTools.bsod}
            onToggle={() => toggleLaptopTool('bsod')}
          >
            <BsodDecoder initialSearch={searchQuery} />
          </ToolCard>

          {/* 5. دليل قيم الدايود للمازربورد */}
          <ToolCard
            id="lap_diode"
            title="دليل قيم ممانعة مسارات المازربورد واللابتوب"
            badge="قياسات بوردة"
            icon={Activity}
            color="text-emerald-500"
            isOpen={expandedLaptopTools.lap_diode}
            onToggle={() => toggleLaptopTool('lap_diode')}
          >
            <DiodeModeGuide category="laptop" />
          </ToolCard>

          {/* 6. مقارنة وتحليل سحب التيار */}
          <ToolCard
            id="current_draw"
            title="مقارنة وتحليل مراحل سحب تيار الباور سبلاي (Current Draw Stages)"
            badge="تشخيص باور"
            icon={Activity}
            color="text-purple-500"
            isOpen={expandedLaptopTools.current_draw}
            onToggle={() => toggleLaptopTool('current_draw')}
          >
            <CurrentDrawComparator />
          </ToolCard>
        </div>
      )}

      {/* نافذة مقيم ممانعة الدايود السريع */}
      <QuickDiodeEvaluatorModal
        isOpen={showDiodeEvaluatorModal}
        onClose={() => setShowDiodeEvaluatorModal(false)}
      />

      {/* نافذة دليل رموز السلك سكرين بالمخططات */}
      <SilkScreenCheatSheetModal
        isOpen={showSilkScreenModal}
        onClose={() => setShowSilkScreenModal(false)}
      />

      {/* نافذة جدول ممانعات أهم 20 موديلاً */}
      <TopDiodeMatrixModal
        isOpen={showTopDiodeModal}
        onClose={() => setShowTopDiodeModal(false)}
      />

      {/* نافذة سجل حالات الورشة المؤكدة (تعلّم بوزن النجاح) */}
      <WorkshopCasesModal
        isOpen={showWorkshopCasesModal}
        onClose={() => setShowWorkshopCasesModal(false)}
        defaultCategory={category === 'laptop' ? 'laptop' : 'mobile'}
      />
    </div>
  );
}

/* =========================================================================
   مكون كارت الأداة القابل للطي والتمدد (Collapsible Tool Card)
   ========================================================================= */

interface ToolCardProps {
  id: string;
  title: string;
  badge: string;
  icon: any;
  color: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ToolCard({ title, badge, icon: Icon, color, isOpen, onToggle, children }: ToolCardProps) {
  return (
    <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-2xl overflow-hidden transition-all shadow-sm">
      <button
        onClick={onToggle}
        className="w-full p-4 md:p-5 flex items-center justify-between gap-3 text-right hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800/80 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-gray-100 truncate">
              {title}
            </h3>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              انقر لفتح أدوات وحسابات هذا القسم
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold border border-gray-200 dark:border-gray-700">
            {badge}
          </span>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isOpen && <div className="p-4 md:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/20">{children}</div>}
    </div>
  );
}

/* =========================================================================
   1. حاسبة الفولت الآمن للموبايل
   ========================================================================= */

function MobileSafeVoltageCalculator() {
  const [selectedRailId, setSelectedRailId] = useState(MOBILE_RAILS[0].id);
  const [injectedV, setInjectedV] = useState(MOBILE_RAILS[0].safeInject);

  const selectedRail = useMemo(
    () => MOBILE_RAILS.find((r) => r.id === selectedRailId) || MOBILE_RAILS[0],
    [selectedRailId]
  );

  const handleRailChange = (id: string) => {
    setSelectedRailId(id);
    const rail = MOBILE_RAILS.find((r) => r.id === id);
    if (rail) setInjectedV(rail.safeInject);
  };

  // حالة الأمان
  const status = useMemo(() => {
    if (injectedV <= selectedRail.safeInject) return { label: 'آمن تماماً (Safe Zone)', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' };
    if (injectedV <= selectedRail.maxSafe) return { label: 'منطقة حذر (Caution Zone)', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
    return { label: 'خطر احتراق فوري! (Danger Zone)', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' };
  }, [injectedV, selectedRail]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* اختيار المسار */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
            اختر المسار المراد فحصه وحقنه:
          </label>
          <select
            value={selectedRailId}
            onChange={(e) => handleRailChange(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-amber-500 font-semibold"
          >
            {MOBILE_RAILS.map((rail) => (
              <option key={rail.id} value={rail.id}>
                {rail.name} (اسمي: {rail.nominal}V)
              </option>
            ))}
          </select>
        </div>

        {/* مؤشر الفولت المراد حقنه */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              الفولت المطلوب حقنه بالباور سبلاي:
            </label>
            <span className="text-base font-black text-amber-500">{injectedV.toFixed(2)} V</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={selectedRail.danger + 0.5}
            step={0.05}
            value={injectedV}
            onChange={(e) => setInjectedV(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
            <span>0.1V</span>
            <span className="text-emerald-500 font-bold">بدء آمن: {selectedRail.safeInject}V</span>
            <span className="text-amber-500 font-bold">أقصى حد: {selectedRail.maxSafe}V</span>
            <span className="text-rose-500 font-bold">خطر: {selectedRail.danger}V</span>
          </div>
        </div>
      </div>

      {/* شارة حالة الأمان */}
      <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${status.color}`}>
        <div className="flex items-center gap-2">
          {injectedV <= selectedRail.safeInject ? (
            <ShieldCheck className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-xs md:text-sm font-bold">{status.label}</span>
        </div>
        <span className="text-xs font-bold font-mono">
          {((injectedV / selectedRail.nominal) * 100).toFixed(0)}% من الجهد الاسمي
        </span>
      </div>

      {/* كروت المعلومات الهندسية */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-medium">الجهد الاسمي الطبيعي</span>
          <span className="text-sm font-black text-gray-900 dark:text-gray-100 font-mono">{selectedRail.nominal} V</span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">الفولت المقترح للبدء</span>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">{selectedRail.safeInject} V</span>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-medium">أقصى فولت مسموح</span>
          <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">{selectedRail.maxSafe} V</span>
        </div>
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
          <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-medium">منطقة حرق المكونات</span>
          <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">&gt; {selectedRail.danger} V</span>
        </div>
      </div>

      {/* المكونات المشتبه بها والملاحظات */}
      <div className="p-3.5 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2 text-xs">
        <div>
          <span className="font-bold text-gray-900 dark:text-gray-100">المكونات الأكثر اشتباهاً عند وجود شورت: </span>
          <span className="text-gray-700 dark:text-gray-300">{selectedRail.suspects}</span>
        </div>
        <div>
          <span className="font-bold text-amber-600 dark:text-amber-400">💡 نصيحة مهندس الورشة: </span>
          <span className="text-gray-700 dark:text-gray-300">{selectedRail.notes}</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. محلل البانيك السريع والمطور لرفع الملفات (Advanced Panic Log Analyzer)
   ========================================================================= */

function QuickPanicAnalyzer() {
  const [logText, setLogText] = useState('');
  const [detectedIssue, setDetectedIssue] = useState<any>(null);
  const [extractedMeta, setExtractedMeta] = useState<any>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // تحليل المحتوى الفوري
  const processAndAnalyze = (content: string, name?: string) => {
    if (!content.trim()) return;

    if (name) setFileName(name);
    setLogText(content);

    // 1. استخراج الميتاداتا الهندسية من ملف البانيك
    const meta: any = {};

    // bug_type
    const bugTypeMatch = content.match(/"bug_type"\s*:\s*"(\d+)"/i) || content.match(/bug_type\s*[:=]\s*(\d+)/i);
    if (bugTypeMatch) meta.bugType = bugTypeMatch[1];

    // Hardware Model
    const modelMatch = content.match(/"product"\s*:\s*"([^"]+)"/i) || content.match(/Hardware Model\s*[:=]\s*([^\r\n]+)/i);
    if (modelMatch) meta.model = modelMatch[1].trim();

    // Incident ID
    const incidentMatch = content.match(/"incident_id"\s*:\s*"([^"]+)"/i) || content.match(/Incident Identifier\s*[:=]\s*([^\r\n]+)/i);
    if (incidentMatch) meta.incidentId = incidentMatch[1].trim();

    // Timestamp
    const timeMatch = content.match(/"timestamp"\s*:\s*"([^"]+)"/i) || content.match(/Date\/Time\s*[:=]\s*([^\r\n]+)/i);
    if (timeMatch) meta.timestamp = timeMatch[1].trim();

    // panicString extract
    let panicString = '';
    const panicStrMatch = content.match(/"panicString"\s*:\s*"([^"]+)"/i) || content.match(/panic\(cpu[^\)]+\):\s*([^\r\n]+)/i);
    if (panicStrMatch) panicString = panicStrMatch[1];

    setExtractedMeta(Object.keys(meta).length > 0 ? meta : null);

    // 2. محرك الكشف عن الأعطال الدقيق
    const lower = content.toLowerCase();
    const results: any[] = [];

    // حساسات الحرارة وفلاتة الشحن / البطارية (90% من أعطال الريستارت كل 3 دقائق)
    if (
      lower.includes('mic1') ||
      lower.includes('mic2') ||
      lower.includes('prc0') ||
      lower.includes('prc1') ||
      lower.includes('thermal') ||
      lower.includes('gasgauge') ||
      lower.includes('smc_thermal') ||
      lower.includes('wdt') ||
      lower.includes('watchdog') ||
      meta.bugType === '210'
    ) {
      results.push({
        title: 'ريستارت متكرر كل 3 دقائق بسبب حساس الحرارة (Thermal Sensor / NTC)',
        component: 'فلاتة مدخل الشحن السفلية (Mic1)، أو حساس فلاتة السماعة العلوية (Sensor Flex)',
        severity: 'عالي (90% احتمال عطل فلاتة)',
        diagnosisReason: 'النظام يفقد إشارة حساس الحرارة فيقوم معالج الـ Watchdog بعمل إعادة تشغيل إجبارية كل 180 ثانية.',
        action: '1. استبدل فلاتة الشحن السفلية بقطعة أصلية موثوقة للتجربة.\n2. افصل فلاتة الحساسات العلوية وجرب الإقلاع بدونها.\n3. تأكد من سلامة ريش البطارية وخط BSI.',
      });
    }

    if (lower.includes('sep') || lower.includes('secureenclave')) {
      results.push({
        title: 'عطل في معالج الحماية الموثوق (SEP / Secure Enclave)',
        component: 'مستشعر البصمة Touch ID، أو بصمة الوجه Face ID، أو شريحة المعالج',
        severity: 'حرج (Critical)',
        diagnosisReason: 'فشل في تهيئة معالج الأمان المشفر عند الإقلاع.',
        action: 'افصل فلاتة الحساسات العلوية والكاميرا الأمامية أولاً للتأكد من عدم وجود شورت بخط I2C.',
      });
    }

    if (lower.includes('pmu') || lower.includes('pmic') || lower.includes('pmic_reset')) {
      results.push({
        title: 'فشل في دائرة تنظيم الطاقة والباور (PMIC Failure)',
        component: 'آيسي الباور الرئيسي (Dialog / Qualcomm PMIC)، أو مكثفات ملفات البك المحيطة',
        severity: 'حرج (Critical)',
        diagnosisReason: 'انهيار أحد خطوط التغذية الرئيسية أو سخونة مفرطة بآيسي الباور.',
        action: 'افحص جهود الخرج LDO وملفات البك حول آيسي الباور، وتأكد من عدم وجود شورت صريح.',
      });
    }

    if (lower.includes('nand') || lower.includes('ans2') || lower.includes('nvme') || lower.includes('sdev')) {
      results.push({
        title: 'خلل في ذاكرة التخزين الداخلية (NAND / NVMe Storage)',
        component: 'شريحة الذاكرة NAND / UFS أو خطوط التغذية 2.8V / 1.8V أو مسارات PCIe',
        severity: 'عالي (High)',
        diagnosisReason: 'فشل الاتصال بذاكرة النظام مما يسبب تعليق على التفاحة أو انهيار فوري.',
        action: 'قس ممانعات خطوط الـ PCIe للذاكرة، وتأكد من سلامة جهود التغذية قبل إعادة الشبلنة.',
      });
    }

    if (lower.includes('baseband') || lower.includes('modem') || lower.includes('bb_') || lower.includes('rffe')) {
      results.push({
        title: 'فشل في دائرة الشبكة والمودم (Baseband System)',
        component: 'معالج الإشارة Baseband أو آيسي باور الشبكة BB-PMU أو دوائر التردد RF',
        severity: 'حرج (Critical)',
        diagnosisReason: 'فشل استجابة مودم الاتصال مع معالج التطبيقات.',
        action: 'تأكد من عدم ظهور مثلث أصفر أو فقدان IMEI، وافحص خطوط VDD_RFFE ومكثفات تغذية البيسباند.',
      });
    }

    if (lower.includes('wlan') || lower.includes('wifi') || lower.includes('bluetooth')) {
      results.push({
        title: 'عطل في شريحة الواي فاي والبلوتوث (Wi-Fi Module)',
        component: 'آيسي الواي فاي (Murata / Broadcom / WCN)',
        severity: 'متوسط (Medium)',
        diagnosisReason: 'انهيار ناقل الاتصال بين المعالج وموديول الاتصال اللاسلكي.',
        action: 'تأكد من وصول جهد 3.3V و 1.8V للواي فاي، وقم بإعادة التسخين أو فك الارتباط واستبدال الشريحة.',
      });
    }

    if (lower.includes('audio') || lower.includes('codec') || lower.includes('i2s')) {
      results.push({
        title: 'عطل في دائرة معالجة الصوت (Audio Codec)',
        component: 'آيسي الصوت الكبير (Audio Codec IC)، أو مكبرات الصوت (Speaker Amp)',
        severity: 'متوسط (Medium)',
        diagnosisReason: 'توقف مسار الساعة الصوتي I2S_CLK أو قطع في خط تغذية آيسي الصوت.',
        action: 'أعد لحام أو استبدال آيسي الصوت مع سحب أسلاك التعويض في الموديلات المعرضة لانفصال المسارات.',
      });
    }

    if (lower.includes('i2c') || lower.includes('spi')) {
      results.push({
        title: 'انقطاع ناقل البيانات التواصلي (I2C / SPI Bus Failure)',
        component: 'مقاومات رفع الناقل (Pull-up Resistors 2.2k)، أو أحد الآيسيهات المتصلة بالناقل',
        severity: 'عالي (High)',
        diagnosisReason: 'سحب أرضي على أحد خطوط SDA / SCL يمنع المعالج من التواصل مع ملحقات البوردة.',
        action: 'قس ممانعات خطوط SDA و SCL على كونكتورات الفلاتات لتحديد أي فلاتة بها الشورت.',
      });
    }

    if (results.length === 0) {
      setDetectedIssue({
        title: 'تم قراءة الملف - لم يتم رصد عطل نمطي معروف في هذا المقطع',
        component: 'فحص يدوي للـ panicString مطلوب',
        severity: 'تنبيه',
        diagnosisReason: panicString ? `سطر الانهيار: ${panicString.slice(0, 120)}...` : 'لم يتم العثور على سطر panicString صريح.',
        action: 'تأكد من رفع ملف البانيك الكامل بصيغة .ips أو .panic لتحليل كافة استدعاءات الكيرنل بدقة.',
      });
    } else {
      setDetectedIssue(results[0]);
    }
  };

  // معالجة اختيار ملف بالزر
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processAndAnalyze(text, file.name);
    };
    reader.readAsText(file);
  };

  // معالجة السحب والإفلات (Drag & Drop)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processAndAnalyze(text, file.name);
    };
    reader.readAsText(file);
  };

  // عينة تجريبية حقيقية بنقرة واحدة
  const handleLoadSample = () => {
    const sample = `{"bug_type":"210","timestamp":"2023-10-14 18:22:45 +0300","os_version":"iPhone OS 16.6 (20G75)","incident_id":"A93BC712-45E1","product":"iPhone12,1","panicString":"panic(cpu 1 caller 0xfffffff01bf89abc): [thermal monitor] Missing sensor: 'mic1' on I2C3 bus failed to report temperature within 180 seconds. Thermal Watchdog Timeout expired! Rebooting device."}`;
    processAndAnalyze(sample, 'panic-full-sample-iPhone11.ips');
  };

  const handleReset = () => {
    setLogText('');
    setDetectedIssue(null);
    setExtractedMeta(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {/* إدخال الملف عبر السحب والإفلات أو الزر */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".ips,.panic,.log,.txt,.json"
        className="hidden"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-5 md:p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
            : 'border-gray-300 dark:border-gray-700 hover:border-amber-500/60 bg-white/50 dark:bg-gray-800/40'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-amber-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100">
              {fileName ? (
                <span className="text-emerald-500 flex items-center justify-center gap-1.5">
                  <FileCheck className="w-4 h-4" /> تم رفع: {fileName}
                </span>
              ) : (
                'اسحب وأفلت ملف البانيك (.ips / .panic) هنا أو اضغط للاختيار'
              )}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              يدعم كافة امتدادات ملفات السجلات: .ips, .panic, .log, .txt, .json
            </p>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold text-xs border border-purple-500/20">
              📂 تصفح الملفات من الهاتف أو الكمبيوتر
            </span>
          </div>
        </div>
      </div>

      {/* منطقة النص اليدوي وزر العينة */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
            أو الصق نص البانيك يدوياً:
          </label>
          <button
            onClick={handleLoadSample}
            type="button"
            className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>🧪 تجربة عينة بانيك حقيقية</span>
          </button>
        </div>

        <textarea
          rows={3}
          value={logText}
          onChange={(e) => processAndAnalyze(e.target.value)}
          placeholder='{"bug_type":"210","timestamp":"...","panicString":"panic(cpu 0 caller...): [thermal monitor]...'
          className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500 leading-relaxed"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => processAndAnalyze(logText)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-dahab-500 to-amber-600 text-slate-950 text-xs font-bold hover:shadow-md transition flex items-center gap-1.5"
            >
              <span>تحليل فوري ⚡</span>
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              مسح وإعادة تعيين
            </button>
          </div>

          {logText && (
            <span className="text-[10px] text-gray-400 font-mono">
              طول النص: {logText.length.toLocaleString()} حرف
            </span>
          )}
        </div>
      </div>

      {/* الميتاداتا المستخرجة من الملف إن وجدت */}
      {extractedMeta && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
          {extractedMeta.model && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <span className="text-[10px] text-gray-400 block font-sans">الموديل المكتشف</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{extractedMeta.model}</span>
            </div>
          )}
          {extractedMeta.bugType && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <span className="text-[10px] text-gray-400 block font-sans">نوع الانهيار (Bug Type)</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{extractedMeta.bugType}</span>
            </div>
          )}
          {extractedMeta.incidentId && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <span className="text-[10px] text-gray-400 block font-sans">كود الحادثة</span>
              <span className="font-bold text-gray-700 dark:text-gray-300 truncate block">{extractedMeta.incidentId}</span>
            </div>
          )}
          {extractedMeta.timestamp && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <span className="text-[10px] text-gray-400 block font-sans">توقيت الانهيار</span>
              <span className="font-bold text-gray-700 dark:text-gray-300 text-[11px] truncate block">{extractedMeta.timestamp}</span>
            </div>
          )}
        </div>
      )}

      {/* كارت نتيجة التحخيص الفورية */}
      {detectedIssue && (
        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-800/80 shadow-lg shadow-purple-500/5 space-y-3 text-xs animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-bold text-sm md:text-base text-purple-700 dark:text-purple-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              <span>{detectedIssue.title}</span>
            </h4>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {detectedIssue.severity}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 space-y-1.5">
            <p className="text-gray-800 dark:text-gray-200">
              <span className="font-bold text-gray-900 dark:text-white">المكون المتهم بالعطل: </span>
              {detectedIssue.component}
            </p>
            {detectedIssue.diagnosisReason && (
              <p className="text-gray-600 dark:text-gray-400 text-[11px]">
                <span className="font-bold">التفسير الفني: </span>
                {detectedIssue.diagnosisReason}
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-purple-800 dark:text-purple-300 leading-relaxed whitespace-pre-line font-medium">
            <span className="font-bold block mb-1">🛠️ خطوات الإصلاح الموصى بها على البوردة:</span>
            {detectedIssue.action}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   3. محول الوحدات الإلكترونية (Universal Unit Converter)
   ========================================================================= */

function UniversalUnitConverter() {
  const [unitType, setUnitType] = useState<'voltage' | 'current' | 'resistance' | 'capacitance' | 'frequency' | 'power'>('voltage');
  const [val, setVal] = useState<number>(1);

  const conversions = useMemo(() => {
    switch (unitType) {
      case 'voltage':
        return [
          { label: 'فولت (V)', value: val.toFixed(4) },
          { label: 'ميلي فولت (mV)', value: (val * 1000).toLocaleString() },
          { label: 'ميكرو فولت (µV)', value: (val * 1000000).toLocaleString() },
          { label: 'كيلو فولت (kV)', value: (val / 1000).toFixed(6) },
        ];
      case 'current':
        return [
          { label: 'أمبير (A)', value: val.toFixed(4) },
          { label: 'ميلي أمبير (mA)', value: (val * 1000).toLocaleString() },
          { label: 'ميكرو أمبير (µA)', value: (val * 1000000).toLocaleString() },
        ];
      case 'resistance':
        return [
          { label: 'أوم (Ω)', value: val.toLocaleString() },
          { label: 'كيلو أوم (kΩ)', value: (val / 1000).toFixed(4) },
          { label: 'ميجا أوم (MΩ)', value: (val / 1000000).toFixed(6) },
          { label: 'ميلي أوم (mΩ)', value: (val * 1000).toLocaleString() },
        ];
      case 'capacitance':
        return [
          { label: 'فاراد (F)', value: val.toFixed(8) },
          { label: 'ميكرو فاراد (µF)', value: (val * 1000000).toLocaleString() },
          { label: 'نانو فاراد (nF)', value: (val * 1000000000).toLocaleString() },
          { label: 'بيكو فاراد (pF)', value: (val * 1000000000000).toLocaleString() },
        ];
      case 'frequency':
        return [
          { label: 'هيرتز (Hz)', value: val.toLocaleString() },
          { label: 'كيلو هيرتز (kHz)', value: (val / 1000).toFixed(4) },
          { label: 'ميجا هيرتز (MHz)', value: (val / 1000000).toFixed(6) },
          { label: 'جيجا هيرتز (GHz)', value: (val / 1000000000).toFixed(8) },
        ];
      case 'power':
        return [
          { label: 'واط (W)', value: val.toFixed(4) },
          { label: 'ميلي واط (mW)', value: (val * 1000).toLocaleString() },
          { label: 'ميكرو واط (µW)', value: (val * 1000000).toLocaleString() },
        ];
    }
  }, [unitType, val]);

  return (
    <div className="space-y-4">
      {/* اختيار نوع الوحدة */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {[
          { id: 'voltage', label: 'الجهد (V)' },
          { id: 'current', label: 'التيار (A)' },
          { id: 'resistance', label: 'المقاومة (Ω)' },
          { id: 'capacitance', label: 'المكثف (F)' },
          { id: 'frequency', label: 'التردد (Hz)' },
          { id: 'power', label: 'القدرة (W)' },
        ].map((u) => (
          <button
            key={u.id}
            onClick={() => setUnitType(u.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              unitType === u.id
                ? 'bg-white dark:bg-gray-700 text-amber-500 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            {u.label}
          </button>
        ))}
      </div>

      {/* حقل الإدخال */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 shrink-0">
          القيمة المدخلة بالوحدة الأساسية:
        </label>
        <input
          type="number"
          step="any"
          value={val}
          onChange={(e) => setVal(parseFloat(e.target.value) || 0)}
          className="w-40 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500 text-left font-mono"
        />
      </div>

      {/* عرض نتائج التحويل اللحظية */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {conversions.map((conv, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-medium">{conv.label}</span>
            <span className="text-xs md:text-sm font-black text-gray-900 dark:text-gray-100 font-mono break-all">
              {conv.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   4. حاسبة التيار الآمن وقانون أوم (Safe Current & Ohm's Law)
   ========================================================================= */

function SafeCurrentCalculator() {
  const [component, setComponent] = useState('ic');
  const [voltage, setVoltage] = useState(1.8);
  const [resistance, setResistance] = useState(10);

  // حدود التيار الآمن
  const limits: Record<string, { maxI: number; label: string; desc: string }> = {
    ic: { maxI: 0.5, label: 'آيسي إلكتروني دقيق', desc: 'أقصى تيار مستمر موصى به 500mA' },
    capacitor: { maxI: 2.0, label: 'مكثف سيراميك SMD', desc: 'أقصى تيار شحن وتحمل 2.0A' },
    res_0201: { maxI: 0.05, label: 'مقاومة 0201 فائقة الصغر', desc: 'أقصى تيار تبديد 50mA' },
    res_0402: { maxI: 0.1, label: 'مقاومة 0402', desc: 'أقصى تيار تبديد 100mA' },
    res_0603: { maxI: 0.15, label: 'مقاومة 0603', desc: 'أقصى تيار تبديد 150mA' },
    res_0805: { maxI: 0.25, label: 'مقاومة 0805', desc: 'أقصى تيار تبديد 250mA' },
    led: { maxI: 0.03, label: 'دايود إضاءة LED', desc: 'أقصى تيار 30mA (النمطي 20mA)' },
    coil: { maxI: 2.5, label: 'ملف طاقة Buck Coil', desc: 'يتحمل حتى 2.5A - 3.5A' },
  };

  const currentLimit = limits[component] || limits.ic;

  // الحسابات: I = V / R
  const calculatedI = useMemo(() => {
    if (resistance <= 0) return 0;
    return voltage / resistance;
  }, [voltage, resistance]);

  // القدرة: P = V * I
  const powerW = useMemo(() => voltage * calculatedI, [voltage, calculatedI]);

  const isSafe = calculatedI <= currentLimit.maxI;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">نوع المكون المفحوص:</label>
          <select
            value={component}
            onChange={(e) => setComponent(e.target.value)}
            className="w-full p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-gray-100"
          >
            {Object.entries(limits).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">الجهد المطبق (V):</label>
          <input
            type="number"
            step="0.1"
            value={voltage}
            onChange={(e) => setVoltage(parseFloat(e.target.value) || 0)}
            className="w-full p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-gray-100 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">المقاومة المقاسة (Ω):</label>
          <input
            type="number"
            step="0.1"
            value={resistance}
            onChange={(e) => setResistance(parseFloat(e.target.value) || 0)}
            className="w-full p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-gray-100 font-mono"
          />
        </div>
      </div>

      {/* بطاقات النتائج */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <span className="text-[10px] text-gray-500 block">التيار الناتج (Current)</span>
          <span className="text-sm md:text-base font-black text-gray-900 dark:text-gray-100 font-mono">
            {calculatedI.toFixed(3)} A ({ (calculatedI * 1000).toFixed(0) } mA)
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <span className="text-[10px] text-gray-500 block">القدرة المبددة (Power)</span>
          <span className="text-sm md:text-base font-black text-amber-500 font-mono">
            {powerW.toFixed(3)} W ({ (powerW * 1000).toFixed(0) } mW)
          </span>
        </div>

        <div
          className={`p-3 rounded-xl border col-span-2 sm:col-span-1 ${
            isSafe
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 text-emerald-600'
              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 text-rose-600'
          }`}
        >
          <span className="text-[10px] block font-bold">حالة الأمان</span>
          <span className="text-xs md:text-sm font-black flex items-center gap-1.5">
            {isSafe ? '✅ آمن للاختبار' : '⚠️ خطر احتراق المكون!'}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 dark:text-gray-400">
        💡 {currentLimit.desc} — تم الحساب وفق معادلة أوم <code className="font-mono">I = V / R</code> والقدرة <code className="font-mono">P = V × I</code>.
      </p>
    </div>
  );
}

/* =========================================================================
   5. دليل قيم الدايود (Diode Mode Reference Guide)
   ========================================================================= */

function DiodeModeGuide({ category }: { category: 'mobile' | 'laptop' }) {
  const [measuredVal, setMeasuredVal] = useState<string>('');
  const data = DIODE_MODE_DATA[category] || DIODE_MODE_DATA.mobile;

  const numericVal = parseFloat(measuredVal);

  return (
    <div className="space-y-4">
      {/* فاحص سريع للقيمة المقاسة */}
      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 shrink-0">
            أدخل قراءة الملتيميتر بالفولت (V):
          </label>
          <input
            type="number"
            step="0.01"
            value={measuredVal}
            onChange={(e) => setMeasuredVal(e.target.value)}
            placeholder="مثال: 0.420"
            className="w-32 p-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-mono font-bold text-gray-900 dark:text-gray-100"
          />
        </div>

        {!isNaN(numericVal) && (
          <div className="text-xs font-bold">
            {numericVal < 0.05 ? (
              <span className="text-rose-500">🔴 شورت صريح (Short to GND)</span>
            ) : numericVal < 0.25 ? (
              <span className="text-amber-500">🟡 ممانعة منخفضة / تسريب محتمل (Leakage)</span>
            ) : numericVal < 0.75 ? (
              <span className="text-emerald-500">🟢 ممانعة سليمة في النطاق الطبيعي</span>
            ) : (
              <span className="text-purple-500">🟣 ممانعة مرتفعة أو خط مقطوع (OL / Open)</span>
            )}
          </div>
        )}
      </div>

      {/* جدول القيم المرجعية */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-xs text-right">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="p-2.5">المسار / الخط</th>
              <th className="p-2.5">الممانعة الطبيعية (Normal)</th>
              <th className="p-2.5">حد الشورت (Short)</th>
              <th className="p-2.5">حالة القطع (Open / High)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900/50 font-mono">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                <td className="p-2.5 font-sans font-bold text-gray-900 dark:text-gray-100">{row.rail}</td>
                <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-bold">{row.normal}</td>
                <td className="p-2.5 text-rose-600 dark:text-rose-400 font-bold">{row.short}</td>
                <td className="p-2.5 text-gray-500 dark:text-gray-400">{row.open}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-gray-500 dark:text-gray-400">
        📌 ملاحظة: ضع الملتيميتر على وضع الدايود (Diode Mode)، والطرف الأحمر على الأرضي (GND) والطرف الأسود على النقطة المراد قياسها (Reverse Diode Mode).
      </p>
    </div>
  );
}

/* =========================================================================
   6. محول أكواد الأخطاء (Samsung & Apple Error Decoder)
   ========================================================================= */

function ErrorCodeDecoder({ initialSearch = '' }: { initialSearch?: string }) {
  const [filter, setFilter] = useState<'all' | 'Apple' | 'Samsung'>('all');
  const [search, setSearch] = useState(initialSearch);

  const filtered = useMemo(() => {
    return MOBILE_ERROR_CODES.filter((item) => {
      const matchBrand = filter === 'all' || item.brand === filter;
      const matchSearch =
        !search ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.cause.toLowerCase().includes(search.toLowerCase());
      return matchBrand && matchSearch;
    });
  }, [filter, search]);

  return (
    <div className="space-y-3">
      {/* فلتر البحث والماركة */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث برقم الكود مثل: 4013, 9, NAND, Binary..."
          className="flex-1 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-gray-100"
        />

        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shrink-0">
          {(['all', 'Apple', 'Samsung'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setFilter(b)}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                filter === b ? 'bg-white dark:bg-gray-700 text-amber-500 shadow-sm' : 'text-gray-500'
              }`}
            >
              {b === 'all' ? 'الكل' : b}
            </button>
          ))}
        </div>
      </div>

      {/* قائمة الأكواد */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-1.5 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-amber-500 text-sm">{item.code}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  item.brand === 'Apple'
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                }`}
              >
                {item.brand}
              </span>
            </div>

            <h4 className="font-bold text-gray-900 dark:text-gray-100">{item.title}</h4>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-bold text-gray-800 dark:text-gray-200">السبب الهندسي: </span>
              {item.cause}
            </p>
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-emerald-700 dark:text-emerald-400 font-medium whitespace-pre-line">
              <span className="font-bold">خطوات الحل بالورشة: </span>
              {item.solution}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   7. فاحص IMEI وصحة التشفير (Luhn Algorithm)
   ========================================================================= */

function ImeiInspector() {
  const [imei, setImei] = useState('');

  // خوارزمية لوهن للتحقق من صحة الرقم (Luhn Formula)
  const validation = useMemo(() => {
    const clean = imei.replace(/\D/g, '');
    if (clean.length !== 15) return null;

    let sum = 0;
    for (let i = 0; i < 15; i++) {
      let digit = parseInt(clean[i], 10);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }

    const isValid = sum % 10 === 0;
    const tac = clean.slice(0, 8);
    const snr = clean.slice(8, 14);
    const cd = clean.slice(14);

    // كشف العلامة التجارية من TAC
    let brand = 'غير محدد بدقة (Generic GSM)';
    if (tac.startsWith('35')) brand = 'Apple / Samsung / Global Standard';
    else if (tac.startsWith('86')) brand = 'Xiaomi / Oppo / Vivo / Huawei (China)';
    else if (tac.startsWith('01')) brand = 'Apple iPhone (North America)';

    return { isValid, tac, snr, cd, brand };
  }, [imei]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600 dark:text-gray-400">
        أدخل رقم الـ IMEI المكون من 15 رقماً للتحقق من صحته عبر خوارزمية Luhn وفك كود الاعتماد TAC:
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          maxLength={15}
          value={imei}
          onChange={(e) => setImei(e.target.value)}
          placeholder="أدخل 15 رقماً..."
          className="flex-1 p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono font-bold tracking-widest text-gray-900 dark:text-gray-100"
        />
        <button
          onClick={() => setImei('352099112345678')}
          className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-[11px] font-bold text-gray-600 dark:text-gray-300"
        >
          رقم تجريبي
        </button>
      </div>

      {validation && (
        <div
          className={`p-3.5 rounded-xl border space-y-2 text-xs ${
            validation.isValid
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-sm">
            <span>{validation.isValid ? '✅ رقم الـ IMEI صالح رياضياً (Valid Luhn)' : '❌ رقم الـ IMEI غير صالح أو مزور!'}</span>
            <span className="font-mono text-xs">CD: {validation.cd}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800 font-mono">
            <div>
              <span className="text-[10px] block opacity-75">كود الطراز (TAC)</span>
              <span className="font-bold">{validation.tac}</span>
            </div>
            <div>
              <span className="text-[10px] block opacity-75">الرقم التسلسلي (SNR)</span>
              <span className="font-bold">{validation.snr}</span>
            </div>
          </div>

          <p className="text-[11px] font-sans">
            <span className="font-bold">التصنيف المحتمل: </span>
            {validation.brand}
          </p>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   8. حاسبة صحة واستهلاك البطارية (Battery Health Calculator)
   ========================================================================= */

function BatteryHealthCalculator() {
  const [designCap, setDesignCap] = useState(3349); // iPhone 14
  const [actualCap, setActualCap] = useState(2850);
  const [cycles, setCycles] = useState(380);

  const healthPct = useMemo(() => {
    if (designCap <= 0) return 0;
    return Math.min(100, Math.max(0, (actualCap / designCap) * 100));
  }, [designCap, actualCap]);

  // تقدير العمر المتبقي
  const estimatedLeftCycles = Math.max(0, 500 - cycles);

  const status = useMemo(() => {
    if (healthPct >= 90) return { label: 'ممتازة جداً (Excellent)', color: 'text-emerald-500' };
    if (healthPct >= 80) return { label: 'جيدة وطبيعية (Good)', color: 'text-green-500' };
    if (healthPct >= 70) return { label: 'متوسطة - تحتاج فحص (Fair)', color: 'text-amber-500' };
    if (healthPct >= 60) return { label: 'ضعيفة - ينصح بالاستبدال (Degraded)', color: 'text-orange-500' };
    return { label: 'تالفة وخطرة - استبدال فوري (Replace)', color: 'text-rose-500' };
  }, [healthPct]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">السعة المصنعية (mAh):</label>
          <input
            type="number"
            value={designCap}
            onChange={(e) => setDesignCap(parseInt(e.target.value, 10) || 0)}
            className="w-full p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold font-mono text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">السعة الفعلية المقاسة (mAh):</label>
          <input
            type="number"
            value={actualCap}
            onChange={(e) => setActualCap(parseInt(e.target.value, 10) || 0)}
            className="w-full p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold font-mono text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">عدد دورات الشحن (Cycles):</label>
          <input
            type="number"
            value={cycles}
            onChange={(e) => setCycles(parseInt(e.target.value, 10) || 0)}
            className="w-full p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold font-mono text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* شريط نسبة الصحة الرسومي */}
      <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">نسبة كفاءة البطارية (Health):</span>
          <span className={`text-xl font-black font-mono ${status.color}`}>{healthPct.toFixed(1)}%</span>
        </div>

        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              healthPct >= 80 ? 'bg-emerald-500' : healthPct >= 70 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${healthPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-gray-500 dark:text-gray-400">الحالة الهندسية: <b className={status.color}>{status.label}</b></span>
          <span className="text-gray-500 dark:text-gray-400">دورات متبقية حتى 80%: <b className="font-mono text-amber-500">~{estimatedLeftCycles}</b></span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   9. دليل بدائل الآيسيهات السريع (Quick IC Cross-Reference)
   ========================================================================= */

function QuickICAlternatives({ initialSearch = '' }: { initialSearch?: string }) {
  const [query, setQuery] = useState(initialSearch);

  const filtered = useMemo(() => {
    if (!query.trim()) return QUICK_IC_ALTERNATIVES;
    const q = query.toLowerCase();
    return QUICK_IC_ALTERNATIVES.filter(
      (ic) =>
        ic.original.toLowerCase().includes(q) ||
        ic.alternatives.toLowerCase().includes(q) ||
        ic.category.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث برقم الآيسي مثل: 1610A2, BQ25890, PM8150..."
        className="w-full p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-gray-100"
      />

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100 font-mono">
                {item.original}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold">
                {item.category}
              </span>
            </div>

            <p className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              البدائل المتوافقة: {item.alternatives}
            </p>

            <p className="text-gray-500 dark:text-gray-400 text-[11px]">
              {item.notes}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   10. حاسبة الفولت الآمن لمسارات اللابتوب (Laptop Safe Voltage)
   ========================================================================= */

function LaptopSafeVoltageCalculator() {
  const [selectedRailId, setSelectedRailId] = useState(LAPTOP_RAILS[0].id);
  const [injectedV, setInjectedV] = useState(LAPTOP_RAILS[0].safeInject);

  const selectedRail = useMemo(
    () => LAPTOP_RAILS.find((r) => r.id === selectedRailId) || LAPTOP_RAILS[0],
    [selectedRailId]
  );

  const handleRailChange = (id: string) => {
    setSelectedRailId(id);
    const rail = LAPTOP_RAILS.find((r) => r.id === id);
    if (rail) setInjectedV(rail.safeInject);
  };

  const status = useMemo(() => {
    if (injectedV <= selectedRail.safeInject) return { label: 'آمن تماماً (Safe Zone)', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' };
    if (injectedV <= selectedRail.maxSafe) return { label: 'منطقة حذر (Caution Zone)', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
    return { label: 'خطر احتراق فوري للمازربورد! (Danger Zone)', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' };
  }, [injectedV, selectedRail]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
            اختر مسار اللابتوب / الماك بوك:
          </label>
          <select
            value={selectedRailId}
            onChange={(e) => handleRailChange(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm font-semibold"
          >
            {LAPTOP_RAILS.map((rail) => (
              <option key={rail.id} value={rail.id}>
                {rail.name} ({rail.nominal}V)
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              فولت الحقن المضبوط على الباور سبلاي:
            </label>
            <span className="text-base font-black text-amber-500 font-mono">{injectedV.toFixed(2)} V</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={selectedRail.danger + 1.0}
            step={0.1}
            value={injectedV}
            onChange={(e) => setInjectedV(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
            <span>0.5V</span>
            <span className="text-emerald-500 font-bold">بدء: {selectedRail.safeInject}V</span>
            <span className="text-amber-500 font-bold">أقصى حد: {selectedRail.maxSafe}V</span>
            <span className="text-rose-500 font-bold">خطر: {selectedRail.danger}V</span>
          </div>
        </div>
      </div>

      <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${status.color}`}>
        <div className="flex items-center gap-2">
          {injectedV <= selectedRail.safeInject ? (
            <ShieldCheck className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-xs md:text-sm font-bold">{status.label}</span>
        </div>
        <span className="text-xs font-bold font-mono">
          {((injectedV / selectedRail.nominal) * 100).toFixed(0)}% من الجهد الاسمي
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <span className="text-[10px] text-gray-500 block">الجهد الاسمي</span>
          <span className="text-sm font-black text-gray-900 dark:text-gray-100 font-mono">{selectedRail.nominal} V</span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
          <span className="text-[10px] text-emerald-600 block">بدء الحقن الآمن</span>
          <span className="text-sm font-black text-emerald-600 font-mono">{selectedRail.safeInject} V</span>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <span className="text-[10px] text-amber-600 block">أقصى حد مسموح</span>
          <span className="text-sm font-black text-amber-600 font-mono">{selectedRail.maxSafe} V</span>
        </div>
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
          <span className="text-[10px] text-rose-600 block">منطقة الخطر</span>
          <span className="text-sm font-black text-rose-600 font-mono">&gt; {selectedRail.danger} V</span>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2 text-xs">
        <div>
          <span className="font-bold text-gray-900 dark:text-gray-100">المكونات الأكثر اشتباهاً: </span>
          <span className="text-gray-700 dark:text-gray-300">{selectedRail.suspects}</span>
        </div>
        <div>
          <span className="font-bold text-amber-600 dark:text-amber-400">💡 توجيه هندسي: </span>
          <span className="text-gray-700 dark:text-gray-300">{selectedRail.notes}</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   11. محول أكواد الشاشة الزرقاء BSOD
   ========================================================================= */

function BsodDecoder({ initialSearch = '' }: { initialSearch?: string }) {
  const [query, setQuery] = useState(initialSearch);

  const filtered = useMemo(() => {
    if (!query.trim()) return BSOD_CODES;
    const q = query.toLowerCase();
    return BSOD_CODES.filter(
      (b) =>
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.cause.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث بكود الـ Hex مثل 0x0000007E أو الاسم مثل MEMORY_MANAGEMENT..."
        className="w-full p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-900 dark:text-gray-100"
      />

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {filtered.map((b, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-sky-100 dark:border-sky-900/40 space-y-2 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-sm">{b.code}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-500">
                Stop Code
              </span>
            </div>

            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 font-mono">{b.name}</h4>

            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-bold text-gray-900 dark:text-gray-100">السبب العتادي: </span>
              {b.cause}
            </p>

            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
              <span className="font-bold">فحص وإصلاح الهاردوير بالورشة: </span>
              {b.hardwareFix}
            </div>

            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400">
              <span className="font-bold">الإصلاح البرمجي (ويندوز): </span>
              {b.softwareFix}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   12. مقارنة وتحليل مراحل سحب التيار (Current Draw Comparator)
   ========================================================================= */

function CurrentDrawComparator() {
  const [currentA, setCurrentA] = useState(0.45);

  const diagnosis = useMemo(() => {
    if (currentA === 0) {
      return {
        stage: 'قطع صريح في دائرة الدخل (Dead / 0.000A)',
        meaning: 'الجهاز لا يسحب أي تيار نهائياً من الشاحن.',
        suspect: 'فيوز الدخل محترق، موسفيت أول PQ301 مقطوع، مقاومة القياس R010 محروقة، أو تكسر في سوكت الشحن DC-IN.',
        statusColor: 'text-gray-500 bg-gray-500/10 border-gray-500/30',
      };
    }
    if (currentA > 0 && currentA <= 0.025) {
      return {
        stage: 'حالة الاستعداد الطبيعية (S5 Standby State)',
        meaning: 'سحب طبيعي جداً لوضع السكون وتغذية شريحة الـ SIO وجهود 3.3V/5V ALW.',
        suspect: 'إذا ضغطت زر الباور ولم يرتفع السحب: تلف زر الباور، غياب إشارة NBSWON#، أو تلف ملف الـ BIOS.',
        statusColor: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
      };
    }
    if (currentA > 0.025 && currentA <= 0.08) {
      return {
        stage: 'تسريب في وضع الـ Standby (Partial Leakage)',
        meaning: 'سحب أعلى من الطبيعي قبل الضغط على زر التشغيل.',
        suspect: 'سخونة في شريحة الـ SIO، أو مكثف سيراميك يسرب على خط الـ 3.3V الدائم، أو تلف آيسي الشبكة LAN.',
        statusColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
      };
    }
    if (currentA > 0.08 && currentA <= 0.35) {
      return {
        stage: 'توقف في مرحلة الإقلاع المبكر (Stuck at Early S0)',
        meaning: 'البوردة أخذت أمر التشغيل لكنها تجمدت قبل قراءة الرام والمعالج.',
        suspect: 'غياب جهد الـ VCORE، تلف آيسي درايفر الرام، أو تلف شريحة البايوس وعدم إرسال إشارة PLTRST#.',
        statusColor: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
      };
    }
    if (currentA > 0.35 && currentA <= 1.2) {
      return {
        stage: 'مرحلة القراءة والفحص الذاتي (POST State)',
        meaning: 'المعالج والرامات يقرأون؛ إذا لم تظهر شاشة، افحص إشارة إضاءة الشاشة ومسارات الـ eDP.',
        suspect: 'تلف فلاتة الشاشة، غياب جهد الـ LCD_VDD، أو تعليق في كود الرام.',
        statusColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
      };
    }
    return {
      stage: 'شورت صريح أو سحب فائق (Short Circuit / High Drain)',
      meaning: 'سحب تيار عالي جداً ينذر باحتراق مكون أو قفل الباور سبلاي (OCP).',
      suspect: 'شورت مباشر بين خط الـ 19V والأرضي، أو انهيار موسفيت علوي (High-side MOSFET) يمرر 19V للمعالج مباشرة!',
      statusColor: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
    };
  }, [currentA]);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
            القراءة الظاهرة على شاشة الباور سبلاي بالأمبير (A):
          </label>
          <span className="text-lg font-black text-amber-500 font-mono">{currentA.toFixed(3)} A</span>
        </div>
        <input
          type="range"
          min={0}
          max={3.0}
          step={0.005}
          value={currentA}
          onChange={(e) => setCurrentA(parseFloat(e.target.value))}
          className="w-full accent-amber-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
          <span>0.000A</span>
          <span>0.020A (S5)</span>
          <span>0.150A (S3)</span>
          <span>0.600A (POST)</span>
          <span>1.500A+ (Full)</span>
        </div>
      </div>

      {/* التشخيص المباشر لحالة السحب */}
      <div className={`p-4 rounded-xl border space-y-2 ${diagnosis.statusColor}`}>
        <h4 className="font-bold text-sm">{diagnosis.stage}</h4>
        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{diagnosis.meaning}</p>
        <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/50 text-xs">
          <span className="font-bold text-gray-900 dark:text-gray-100">الأعطال والمكونات الأكثر ترجيحاً: </span>
          <span className="text-gray-800 dark:text-gray-200">{diagnosis.suspect}</span>
        </div>
      </div>
    </div>
  );
}
