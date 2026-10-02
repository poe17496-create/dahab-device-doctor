'use client';

import React, { useState, useEffect } from 'react';
import { DeviceSpecialty, PowerSupplyReadings } from '@/lib/types';
import {
  Smartphone,
  Laptop,
  Zap,
  Car,
  Tv,
  Monitor,
  X,
  Send,
  Gauge,
  Sliders,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
} from 'lucide-react';

interface DiagnosticFormProps {
  specialty: DeviceSpecialty;
  setSpecialty: (s: DeviceSpecialty) => void;
  deviceModel: string;
  setDeviceModel: (m: string) => void;
  prompt: string;
  setPrompt: (p: string) => void;
  imageBase64: string | null;
  setImageBase64: (img: string | null) => void;
  readings: PowerSupplyReadings;
  setReadings: React.Dispatch<React.SetStateAction<PowerSupplyReadings>>;
  loading: boolean;
  onDiagnose: () => void;
  guestUsageRemaining?: number;
  loadingMessage?: string | null;
  validationError?: string | null;
}

const SPECIALTY_OPTIONS: { id: DeviceSpecialty; label: string; icon: any; hint: string }[] = [
  {
    id: 'mobile-repair',
    label: '📱 صيانة الموبايل (iOS & Android)',
    icon: Smartphone,
    hint: 'آيفون، سامسونج، شاومي، هواوي - دوائر الشحن والباور والمودم',
  },
  {
    id: 'laptop-motherboard',
    label: '💻 لابتوب ومادربورد وماك بوك',
    icon: Laptop,
    hint: 'MacBook, Dell, HP, ThinkPad - دوائر 19V, 3.3V/5V, VCORE',
  },
  {
    id: 'tv-power-boards',
    label: '⚡ كروت باور وإنفرتر وشاشات',
    icon: Tv,
    hint: 'SMPS Power Supplies, Inverters, T-Con, LED Drivers',
  },
  {
    id: 'automotive-ecu',
    label: '🚗 كنترول وإلكترونيات السيارات',
    icon: Car,
    hint: 'ECU, BCM, Cluster, كروت حقن وبلوف ومتحكمات CAN-Bus',
  },
  {
    id: 'general-electronics',
    label: '🔌 إلكترونيات عامة ودوائر تحكم',
    icon: Zap,
    hint: 'أجهزة صناعية، ميكروكنترولر، كروت أجهزة منزلية ذكية',
  },
];

type CategoryId = 'mobile' | 'laptop' | 'desktop' | 'other';

const CATEGORIES = [
  {
    id: 'mobile' as CategoryId,
    label: 'موبايل (Mobile)',
    desc: 'iPhone, Samsung, Xiaomi, Huawei, etc.',
    icon: Smartphone,
    specialties: ['mobile-repair'],
    chips: [
      'iPhone 15 Pro Max',
      'iPhone 14 Pro',
      'iPhone 13 Pro',
      'iPhone 12',
      'iPhone 11',
      'iPhone XR',
      'Samsung S24 Ultra',
      'Samsung S23 Ultra',
      'Samsung S22 Ultra',
      'Samsung A54',
      'Samsung A34',
      'Xiaomi 14 Ultra',
      'Xiaomi 13 Pro',
      'Redmi Note 13',
      'Redmi Note 12',
      'Realme GT 3',
      'Realme 11 Pro',
      'Oppo Find X7',
      'Oppo Reno 10',
      'Huawei P60 Pro',
      'Huawei Mate 60',
      'Pixel 8 Pro',
      'Pixel 7 Pro'
    ],
    prompts: [
      'شورت صريح مع سخونة وسحب أمبير عالي قبل الضغط على الباور',
      'سحب 0.08A والتوقف عند الضغط على الباور (Freezing Boot)',
      'ريستارت متكرر على اللوجو (Bootloop) مع سحب باور طبيعي',
      'شحن وهمي ونزول نسبة البطارية مع التعرف على الكمبيوتر',
      'فاصل إضاءة وبيانات مع وجود رنين واستجابة للمس',
      'لا يوجد شبكة و IMEI null مع سحب 0.12A',
      'البطارية تفقد نسبة الشحن بسرعة غير طبيعية',
      'الجهاز ساخن جداً على PMIC أو المعالج',
      'لا يوجد صوت في المكالمات ولا يعمل المايكروفون',
      'الشاشة سوداء أو خطوط أفقية مع اهتزاز الصورة',
      'لمسة الـ Touch ID لا تعمل وخطأ 40 في iTunes',
      'الجهاز لا يتعرف على الكمبيوتر ولا يدخل DFU',
      'موت كامل مع سحب 0.00A وعدم استجابة للشاحن',
      'سحب متذبذب بين 0.15A و 0.40A بشكل غير مستقر',
      'الجهاز يعمل لكن يفرق باور عند التحميل'
    ]
  },
  {
    id: 'laptop' as CategoryId,
    label: 'لابتوب (Laptop)',
    desc: 'MacBook, Dell, HP, Lenovo, etc.',
    icon: Laptop,
    specialties: ['laptop-motherboard'],
    chips: [
      'MacBook Pro M3 Max',
      'MacBook Pro M2',
      'MacBook Air M2',
      'MacBook Pro 16" M1',
      'MacBook Air M1',
      'Dell XPS 15',
      'Dell XPS 13',
      'Dell Latitude 7000',
      'Dell Inspiron 16',
      'ThinkPad X1 Carbon',
      'ThinkPad T14',
      'ThinkPad E16',
      'Lenovo Legion 9i',
      'HP EliteBook 860',
      'HP Spectre x360',
      'HP Pavilion Gaming',
      'HP ZBook Studio',
      'ASUS ROG Zephyrus',
      'ASUS ZenBook Pro',
      'Acer Swift 14',
      'Acer Predator Helios',
      'MSI Raider GE78',
      'Microsoft Surface Laptop 5'
    ],
    prompts: [
      'لابتوب قاطع باور تماماً، لا يوجد سحب للأمبير',
      'يضيء لمبة الباور لثوانٍ ثم ينطفئ (ريستارت متكرر)',
      'شورت على مسار الـ 19V الرئيسي (VIN)',
      'اللابتوب يعمل باور ولكن لا توجد بيانات على الشاشة (No Display)',
      'غياب فولتية VCORE على ملفات المعالج مع وجود 3.3V و 5V',
      'شورت على مسار الـ 3.3V أو 5V بعد دائرة الموسفتات',
      'اللابتوب يعمل لكن لا يشحن والـ LED برتقالي',
      'سخونة شديدة على معالج الرسوميات (GPU) مع ريستارت',
      'الذاكرة RAM لا يتم التعرف عليها وصفارة مستمرة',
      'لوحة المفاتيح والـ Touchpad لا يعملان مع باور طبيعي',
      'اللابتوب يفرق باور عند فتح برنامج معين فقط',
      'معجب المعالج يعمل بأقصى سرعة بدون تحميل',
      'اللابتوب لا يظهر في BIOS ولا يتم الإقلاع',
      'فصل تام عند ربط الشاحن 20V',
      'الشاشة تظهر ألوان مشوهة أو خطوط عمودية'
    ]
  },
  { 
    id: 'desktop' as CategoryId, 
    label: 'كمبيوتر (Desktop/PC)', 
    desc: 'Motherboards, GPUs, PSUs',
    icon: Monitor,
    specialties: ['general-electronics', 'tv-power-boards'],
    chips: ['RTX 4090', 'Intel i9-14900K', 'ASUS ROG Z790', 'Corsair RM1000x'],
    prompts: [
      'اللوحة الأم قاطعة داتا ومروحة المعالج تعمل بأقصى سرعة',
      'كارت الشاشة لا يعطي صورة مع وجود شورت على خط الـ 12V',
      'الباور سبلاي يفصل عند التحميل (حماية من الشورت)',
      'صفارة رام مستمرة ولا يوجد إقلاع',
      'اللوحة الأم لا تظهر صورة مع وجود 3.3V و 5V',
      'المعالج سخن جداً واللابتوب يغلق فوراً',
      'كارت الشاشة يعمل لكن تظهر خطوط على الشاشة',
      'اللوحة الأم لا تتعرف على الـ SSD أو الـ HDD',
      'الـ USB Ports لا تعمل نهائياً على اللوحة الأم',
      'شورت على خط 12V أو 5V على اللوحة الأم',
      'المعالج لا يعمل مع وجود فولتية VCORE',
      'الذاكرة لا تعمل مع صفارات متعددة',
      'اللوحة الأم لا تتعرف على المكونات الجديدة',
      'الشاشة بيضاء مع إضاءة الـ LED',
      'كارت الشاشة يفرق باور عند التحميل الثقيل'
    ]
  },
  {
    id: 'other' as CategoryId,
    label: 'أخرى (Other)',
    desc: 'سيارات، شاشات، وإلكترونيات عامة',
    icon: Zap,
    specialties: ['automotive-ecu', 'tv-power-boards', 'general-electronics'],
    chips: ['ECU Bosch EDC17', 'Samsung TV 55"', 'LG Inverter Board'],
    prompts: [
      'تلف في موسفتات الإنفرتر (Inverter)',
      'كنترول السيارة لا يتواصل عبر الـ CAN-Bus',
      'دائرة الباور قاطعة تماما ولا يوجد خرج 5V/12V',
      'شاشة التلفاز سوداء مع صوت صفارة من الـ Power Board',
      'الشاشة تظهر صورة طبيعية ثم تنطفئ فجأة',
      'الألوان على الشاشة مشوهة وخطوط أفقية',
      'إنفرتر التلفاز ساخن جداً مع رائحة احتراق',
      'كنترول السيارة يعطي خطأ في الـ OBD',
      'كارت الإشعال في السيارة لا يعمل',
      'دائرة الشحن في البطارية السيارة لا تشحن',
      'الـ T-Con Board يعطي صورة معلقة ومشوهة',
      'شورت على خط 24V في شاشة التلفاز',
      'الشاشة تظهر ألوان مختلفة عن الطبيعي',
      'السيارة لا تشغل مع كل مفاتيح الإشعال متوفرة',
      'دائرة الأمان في السيارة مفعلة دائماً'
    ]
  }
];

export default function DiagnosticForm({
  specialty,
  setSpecialty,
  deviceModel,
  setDeviceModel,
  prompt,
  setPrompt,
  imageBase64,
  setImageBase64,
  readings,
  setReadings,
  loading,
  onDiagnose,
  guestUsageRemaining,
  loadingMessage,
  validationError,
}: DiagnosticFormProps) {
  const [showAdvancedReadings, setShowAdvancedReadings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('mobile');
  const [localValidationError, setLocalValidationError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // رسائل التحميل الخطوة بخطوة
  const loadingMessages = [
    'جاري قراءة المعطيات والقياسات...',
    'جاري مطابقة الأعطال الشائعة ومسارات التغذية...',
    'جاري استخراج تقرير التشخيص ونسبة الثقة...',
  ];

  // التأثير التلقائي لرسائل التحميل
  useEffect(() => {
    if (loading && loadingStep < loadingMessages.length) {
      const timer = setTimeout(() => {
        setLoadingStep((prev) => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, loadingStep]);

  // Initialize correct category based on default specialty, or handle category changes
  useEffect(() => {
    const currentCat = CATEGORIES.find(c => c.id === selectedCategory);
    if (currentCat && !currentCat.specialties.includes(specialty)) {
      setSpecialty(currentCat.specialties[0] as DeviceSpecialty);
    }
  }, [selectedCategory, specialty, setSpecialty]);

  const handleCategorySelect = (catId: CategoryId) => {
    setSelectedCategory(catId);
  };

  const activeCategoryData = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];
  const filteredSpecialties = SPECIALTY_OPTIONS.filter(opt => activeCategoryData.specialties.includes(opt.id));

  // تفعيل المساعد الصوتي للورشة (Hands-Free Voice Assistant)
  const toggleVoiceRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('المتصفح الحالي لا يدعم التعرف الصوتي المباشر. يرجى استخدام متصفح Chrome أو Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const speechText = event.results[0][0].transcript;
        setPrompt(prompt ? `${prompt} ${speechText}` : speechText);
        setIsListening(false);
      };

      recognition.onerror = (err: any) => {
        console.error('Speech error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 8 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // فحص الإدخال قبل التشخيص
  const validateInputs = (): boolean => {
    if (!deviceModel.trim()) {
      setLocalValidationError('برجاء كتابة موديل الجهاز أولاً');
      return false;
    }
    if (!prompt.trim() && !imageBase64) {
      setLocalValidationError('برجاء كتابة وصف العطل أو رفع صورة');
      return false;
    }
    setLocalValidationError(null);
    return true;
  };

  // معالجة النقر على زر التشخيص
  const handleDiagnoseClick = () => {
    if (!validateInputs()) {
      return;
    }
    onDiagnose();
  };

  // أمثلة الاختبار السريع (Presets)
  const presets = [
    {
      name: 'آيفون 11 - شورت صريح في VCC_MAIN',
      category: 'mobile' as CategoryId,
      model: 'iPhone 11',
      prompt: 'شورت صريح على خط VCC_MAIN مع سخونة على PMIC',
      readings: {
        currentBeforePower: 0.12,
        currentAfterPower: 'متوقف عند 0.00A',
        voltageInput: 4.2,
        shortDetected: true,
      },
    },
    {
      name: 'سامسونج S21 - سحب أمبير ضعيف / فاصل باور',
      category: 'mobile' as CategoryId,
      model: 'Samsung Galaxy S21',
      prompt: 'سحب أمبير ضعيف 0.15A فقط، اللابتوب يفرق شورت على الباور سبلاي',
      readings: {
        currentBeforePower: 0.15,
        currentAfterPower: '0.15A ثابت',
        voltageInput: 19.5,
        shortDetected: false,
      },
    },
    {
      name: 'ماك بوك - فاصل إشارة الشحن ISL9240',
      category: 'laptop' as CategoryId,
      model: 'MacBook Pro 2021',
      prompt: 'ماك بوك لا يفرق باور 20V، فاصل إشارة الشحن ISL9240 لا يعمل',
      readings: {
        currentBeforePower: 0.05,
        currentAfterPower: '0.05A',
        voltageInput: 0.00,
        shortDetected: false,
      },
    },
    {
      name: 'آيفون 13 - شحن وهمي Tristar',
      category: 'mobile' as CategoryId,
      model: 'iPhone 13',
      prompt: 'شحن وهمي ونزول نسبة البطارية مع التعرف على الكمبيوتر',
      readings: {
        currentBeforePower: 0.20,
        currentAfterPower: '0.45A ثابت',
        voltageInput: 5.0,
        shortDetected: false,
      },
    },
    {
      name: 'Dell XPS - غياب VCORE',
      category: 'laptop' as CategoryId,
      model: 'Dell XPS 15',
      prompt: 'غياب فولتية VCORE على ملفات المعالج مع وجود 3.3V و 5V',
      readings: {
        currentBeforePower: 0.08,
        currentAfterPower: '0.12A',
        voltageInput: 19.5,
        shortDetected: false,
      },
    },
    {
      name: 'شاشة Samsung - إنفرتر تالف',
      category: 'other' as CategoryId,
      model: 'Samsung TV 55"',
      prompt: 'تلف في موسفتات الإنفرتر مع صفارة من الـ Power Board',
      readings: {
        currentBeforePower: 0.05,
        currentAfterPower: '0.15A',
        voltageInput: 24.0,
        shortDetected: true,
      },
    },
    {
      name: 'آيفون 12 - لا شبكة Baseband',
      category: 'mobile' as CategoryId,
      model: 'iPhone 12',
      prompt: 'لا يوجد شبكة و IMEI null مع سحب 0.12A',
      readings: {
        currentBeforePower: 0.12,
        currentAfterPower: '0.15A',
        voltageInput: 4.2,
        shortDetected: false,
      },
    },
    {
      name: 'MacBook Pro - شورت 3.3V',
      category: 'laptop' as CategoryId,
      model: 'MacBook Pro 2019',
      prompt: 'شورت على مسار الـ 3.3V بعد دائرة الموسفتات',
      readings: {
        currentBeforePower: 0.15,
        currentAfterPower: '0.25A',
        voltageInput: 20.0,
        shortDetected: true,
      },
    },
    {
      name: 'Xiaomi Mi 14 - PMIC ساخن',
      category: 'mobile' as CategoryId,
      model: 'Xiaomi Mi 14',
      prompt: 'الجهاز ساخن جداً على PMIC مع سحب 0.30A',
      readings: {
        currentBeforePower: 0.30,
        currentAfterPower: '0.35A',
        voltageInput: 4.2,
        shortDetected: false,
      },
    },
    {
      name: 'ThinkPad - لا شحن',
      category: 'laptop' as CategoryId,
      model: 'ThinkPad X1 Carbon',
      prompt: 'اللابتوب يعمل لكن لا يشحن والـ LED برتقالي',
      readings: {
        currentBeforePower: 0.10,
        currentAfterPower: '0.45A',
        voltageInput: 20.0,
        shortDetected: false,
      },
    },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setSelectedCategory(preset.category);
    setDeviceModel(preset.model);
    setPrompt(preset.prompt);
    setReadings(preset.readings);
    setLocalValidationError(null);
  };

  return (
    <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl p-5 md:p-6 shadow-xl space-y-6 transition-colors">
      
      {/* 0. فئة الجهاز الأساسية (Category Selector) */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-dahab-500" />
          <span>اختر فئة الجهاز (Device Category):</span>
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`p-4 rounded-2xl border text-right transition-all flex flex-col gap-2 relative overflow-hidden group ${
                  isSelected
                    ? 'bg-gradient-to-br from-dahab-500/10 to-amber-500/5 border-dahab-500 shadow-md shadow-dahab-500/10'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200 dark:bg-gray-900/60 dark:border-gray-800 dark:hover:bg-gray-850'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-dahab-500/10 rounded-bl-full -z-10" />
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${
                  isSelected ? 'bg-dahab-500 text-slate-900 shadow-inner' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:text-dahab-500 shadow-sm'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className={`font-bold text-sm mb-1 ${isSelected ? 'text-dahab-700 dark:text-dahab-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {cat.label}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    {cat.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. اختيار التخصص الدقيق (يفلتر بناءً على الفئة) */}
      <div className="space-y-2 animate-fadeIn">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-dahab-500" />
          <span>حدد تخصص الدائرة الإلكترونية بدقة:</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredSpecialties.map((item) => {
            const isSelected = specialty === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSpecialty(item.id)}
                className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-dahab-500/15 border-dahab-500 text-dahab-800 dark:text-dahab-300 shadow-sm'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 dark:bg-gray-900/60 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-850 dark:hover:text-gray-200'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-dahab-600 dark:text-dahab-400' : 'text-gray-400'}`} />
                  <span className={isSelected ? 'text-dahab-600 dark:text-dahab-400' : ''}>
                    {item.label}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1 line-clamp-1">{item.hint}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. طراز الجهاز وحقل القياسات المتقدم */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
          طراز الجهاز أو رقم البوردة (Model / Board ID):
        </label>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={deviceModel}
            onChange={(e) => setDeviceModel(e.target.value)}
            placeholder={`مثلاً: ${activeCategoryData.chips[0]}...`}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-dahab-500 focus:ring-1 focus:ring-dahab-500 outline-none transition shadow-inner"
          />
          {/* شرائح الاختيار السريع للموديل */}
          <div className="flex flex-wrap gap-2">
            {activeCategoryData.chips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setDeviceModel(chip)}
                className="text-[11px] px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 border border-transparent hover:border-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* زر إظهار لوحة أجهزة المعمل */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvancedReadings(!showAdvancedReadings)}
            className={`w-full py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition ${
              showAdvancedReadings
                ? 'bg-amber-500/20 text-dahab-700 dark:text-dahab-400 border-dahab-500/50'
                : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-850'
            }`}
          >
            <Gauge className="w-5 h-5 text-dahab-500" />
            <span>قراءات الباور والملتيميتر المتقدمة (اختياري)</span>
            {showAdvancedReadings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* لوحة قراءات أجهزة المعمل (DC Power Supply & Diode Mode) */}
      {showAdvancedReadings && (
        <div className="p-4 bg-gray-50 dark:bg-gray-950/90 border border-dahab-500/30 rounded-2xl space-y-3 animate-fadeIn">
          <div className="text-xs font-bold text-dahab-700 dark:text-dahab-400 flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-800 pb-2">
            <Gauge className="w-4 h-4" />
            <span>تسجيل قراءات أدوات الفحص المخبرية (لزيادة دقة فرز الهاردوير والسوفتوير):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-gray-600 dark:text-gray-400 block mb-1">
                سحب الباور قبل التشغيل (أمبير):
              </label>
              <input
                type="number"
                step="0.01"
                value={readings.currentBeforePower ?? ''}
                onChange={(e) =>
                  setReadings((prev) => ({
                    ...prev,
                    currentBeforePower: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                placeholder="مثلاً: 0.00A أو 0.45A"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-600 dark:text-gray-400 block mb-1">
                سلوك السحب بعد زر الباور:
              </label>
              <input
                type="text"
                value={readings.currentAfterPower ?? ''}
                onChange={(e) =>
                  setReadings((prev) => ({ ...prev, currentAfterPower: e.target.value }))
                }
                placeholder="مثلاً: متوقف عند 0.08A / تذبذب ريستارت"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-600 dark:text-gray-400 block mb-1">
                فولت التغذية المدخل (V):
              </label>
              <input
                type="number"
                step="0.1"
                value={readings.voltageInput ?? ''}
                onChange={(e) =>
                  setReadings((prev) => ({
                    ...prev,
                    voltageInput: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                placeholder="مثلاً: 4.2V أو 19.5V"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="shortCheck"
              checked={readings.shortDetected || false}
              onChange={(e) =>
                setReadings((prev) => ({ ...prev, shortDetected: e.target.checked }))
              }
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-dahab-500 focus:ring-dahab-500 bg-white dark:bg-gray-900"
            />
            <label htmlFor="shortCheck" className="text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer">
              ⚠️ تم رصد شورت مباشر للأرضي (Short to GND) على أحد المسارات الرئيسية
            </label>
          </div>
        </div>
      )}

      {/* 3. أمثلة الاختبار السريع (Presets) */}
      <div className="space-y-3 animate-fadeIn">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <span>🧪 أمثلة اختبار سريع (اضغط للتجربة فوراً):</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-[11px] px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 text-blue-700 dark:from-blue-900/30 dark:to-indigo-900/30 dark:border-blue-800 dark:text-blue-300 transition-all text-right font-medium"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4. صندوق وصف العطل والبرومبت السريع */}
      <div className="space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <label className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <span>وصف العطل بالتفصيل أو قراءة الممانعات:</span>
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                isListening
                  ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500 animate-pulse'
                  : 'bg-dahab-500/15 text-dahab-700 dark:text-dahab-300 border-dahab-500/30 hover:bg-dahab-500/25'
              }`}
              title="المساعد الصوتي للورشة: تحدث بصوتك دون لمس لوحة المفاتيح أثناء العمل"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 animate-bounce" />
                  <span>جاري الاستماع لصوتك... (تحدث الآن)</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-dahab-500" />
                  <span>🎙️ تحدث بصوتك (Hands-Free)</span>
                </>
              )}
            </button>
          </label>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            (يمكنك كتابة اسم الآيسي، رمز الخط، أو التحدث بالصوت)
          </span>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="اكتب وصف العطل بوضوح للحصول على تشخيص دقيق..."
          className={`w-full p-4 border rounded-2xl text-sm font-sans leading-relaxed transition shadow-inner resize-none h-32 ${
            localValidationError && !prompt.trim()
              ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500'
              : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-dahab-500/50 focus:border-dahab-500'
          }`}
        />

        {/* رسالة خطأ التحقق */}
        {localValidationError && (
          <div className="text-xs font-bold text-rose-600 dark:text-rose-400 animate-fadeIn">
            ⚠️ {localValidationError}
          </div>
        )}

        {/* أزرار سريعة للأعطال الشائعة */}
        <div className="flex flex-wrap gap-2 pt-1 items-center">
          <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 py-1">أعطال سريعة:</span>
          {activeCategoryData.prompts.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(q)}
              className="text-[11px] px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-800 dark:text-gray-400 dark:hover:text-dahab-300 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 4. رفع الصور وزر التشخيص الأساسي */}
      <div className="flex flex-col lg:flex-row gap-4 pt-4 border-t border-gray-100 dark:border-workshop-border">
        {/* رفع صورة الجهاز */}
        <div className="flex-1 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937] rounded-2xl p-4 transition">
          <label className="block text-xs font-bold text-gray-800 dark:text-gray-100 mb-2">
            📷 صورة للبوردة أو قياس الحرارة (اختياري)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full text-xs text-gray-600 dark:text-gray-400 file:mr-4 file:rounded-xl file:border-0 file:bg-gray-200 dark:file:bg-[#1F2937] file:text-gray-900 dark:file:text-gray-100 cursor-pointer file:px-4 file:py-2 hover:file:bg-gray-300 dark:hover:file:bg-gray-700 transition"
          />
          {imageBase64 && (
            <div className="mt-3 relative inline-block">
              <img
                src={imageBase64}
                alt="Device"
                className="w-32 h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
              />
              <button
                onClick={() => setImageBase64(null)}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* مؤشر محاولات الزائر إن وجد وزر التشخيص */}
        <div className="flex-1 flex flex-col justify-end gap-3">
          {guestUsageRemaining !== undefined && (
            <div className="text-[11px] font-bold px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-dahab-400 text-center">
              🎁 تجربة زائر: متبقي لك <strong>{guestUsageRemaining}</strong> من 5 محاولات اليوم
            </div>
          )}

          {/* زر بدء الفحص الهندسي الكبير */}
          <button
            onClick={handleDiagnoseClick}
            disabled={loading || (!prompt.trim() && !imageBase64)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-dahab-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>{loadingMessages[loadingStep] || 'جاري التشخيص...'}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>تشغيل الفحص الهندسي الذكي 🚀</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
