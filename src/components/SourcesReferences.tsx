'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ReferenceSource } from '@/lib/types';
import {
  ExternalLink,
  BookOpen,
  Youtube,
  Cpu,
  MessageSquare,
  Wrench,
  Search,
  Scale,
  Shield,
  Filter,
  Plus,
  X,
  Tag,
  Globe,
  FileText,
  Video,
  Zap,
  Radio,
  Share2,
  HardDrive,
  Tv,
  Car,
  BookmarkCheck,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseBrowser';

interface SourcesReferencesProps {
  sources: ReferenceSource[];
}

type ReferenceCategory = 'all' | 'telegram' | 'forums' | 'schematics' | 'videos' | 'custom';

interface CustomReference {
  id: string;
  title: string;
  url: string;
  category: ReferenceCategory;
  description: string;
  date: string;
}

interface StaticSourceItem {
  id: string;
  name: string;
  url: string;
  category: 'telegram' | 'forums' | 'schematics' | 'videos';
  badge: string;
  desc: string;
  icon: React.ReactNode;
  tags: string[];
}

// 📚 مكتبة المراجع الهندسية الشاملة وقنوات تليجرام المعتمدة عالمياً
const STATIC_DIRECTORY: StaticSourceItem[] = [
  // 1. قنوات ومجموعات تليجرام المعتمدة
  {
    id: 'tg-bios-archive-tools',
    name: 'BIOS ARCHIVE | BIOS |Laptop Firmware & Tools',
    url: 'https://t.me/biosarchive',
    category: 'telegram',
    badge: 'تليجرام • أرشيف بيوس وفيرموير',
    desc: 'المجموعة الهندسية الكبرى (BIOS ARCHIVE) لدامبات وفيرموير اللابتوب والمازربورد الأصلية والمعدلة، ملفات BIN مجربة، وأدوات تعديل وتنظيف ME Region وEC Firmware.',
    icon: <HardDrive className="w-5 h-5 text-amber-400" />,
    tags: ['BIOS ARCHIVE', 'BIOS', 'Laptop Firmware', 'Tools', 'Clear ME', 'BIN Dump', 'EC'],
  },
  {
    id: 'tg-laptop-schematic-global',
    name: 'Laptop schematic | بنك مخططات وبوردفيو اللابتوب',
    url: 'https://t.me/Laptop_Schematic',
    category: 'telegram',
    badge: 'تليجرام • مخططات لابتوب',
    desc: 'أضخم مجتمع هندسي وقناة تليجرام لمخططات اللابتوب (Laptop schematic) - آلاف المخططات الهندسية وملفات Boardview CAD وخرائط مسارات التغذية والجهود لجميع أجيال اللابتوب.',
    icon: <Radio className="w-5 h-5 text-sky-400" />,
    tags: ['Laptop schematic', 'Schematics', 'Boardview CAD', 'Power Rails', 'Signals', 'Dell', 'HP', 'Lenovo'],
  },
  // 1. قنوات ومجموعات تليجرام
  {
    id: 'tg-laptop',
    name: 'قناة تليجرام: مخططات وبيوس اللابتوب والمازربورد',
    url: 'https://t.me/laptop_schematics',
    category: 'telegram',
    badge: 'تليجرام • لابتوب',
    desc: 'المكتبة الهندسية الأكبر على تليجرام لملفات BIOS BIN وبوردفيو لجميع أجيال المازربورد (Dell, HP, Lenovo, Asus, Acer).',
    icon: <Radio className="w-5 h-5 text-sky-400" />,
    tags: ['BIOS', 'BIN', 'Boardview', 'Dell', 'HP', 'Lenovo'],
  },
  {
    id: 'tg-bios-dump',
    name: 'قناة تليجرام: دامبات البيوس المسحوبة والمختبرة',
    url: 'https://t.me/bios_dump',
    category: 'telegram',
    badge: 'تليجرام • دامبات BIN',
    desc: 'أرشيف ملفات BIOS .BIN مسحوبة بأجهزة المبرمجة RT809H و CH341A مع شروحات دمج وتعديل البيوس وتنظيف الـ ME Region.',
    icon: <HardDrive className="w-5 h-5 text-emerald-400" />,
    tags: ['Dump', 'RT809H', 'Clear ME', 'SPI Flash'],
  },
  {
    id: 'tg-mobile',
    name: 'قناة تليجرام: سيرفس ومخططات الموبايل',
    url: 'https://t.me/mobile_schematics_firmware',
    category: 'telegram',
    badge: 'تليجرام • موبايل',
    desc: 'مخططات تفصيلية وسيرفس مانوال رسمي لآيفون وسامسونج وشاومي وهواوي، مع خرائط مسارات التغذية والممانعات.',
    icon: <Radio className="w-5 h-5 text-indigo-400" />,
    tags: ['iPhone', 'Samsung', 'Xiaomi', 'Service Manual'],
  },
  {
    id: 'tg-macbook',
    name: 'قناة تليجرام: مخططات وبوردفيو الماك بوك',
    url: 'https://t.me/macbook_schematics',
    category: 'telegram',
    badge: 'تليجرام • أبل وماك',
    desc: 'مخططات بوردات أبل (820-XXXXX) وبوردفيو مفتوح لمعالجات M1 و M2 و M3 وأجهزة إنتل مع حلول مسارات PPBUS_G3H.',
    icon: <Radio className="w-5 h-5 text-purple-400" />,
    tags: ['Apple', 'MacBook', '820-XXXX', 'M1', 'M2'],
  },
  {
    id: 'tg-tv',
    name: 'قناة تليجرام: فلاشات ودامبات الشاشات والتلفزيونات',
    url: 'https://t.me/tv_dump_firmware',
    category: 'telegram',
    badge: 'تليجرام • شاشات TV',
    desc: 'فلاشات ودامبات مسحوبة لشاشات LED/LCD (Samsung, LG, Tornado, Toshiba) وكروت الباور والـ eMMC Dumps.',
    icon: <Tv className="w-5 h-5 text-amber-400" />,
    tags: ['TV', 'eMMC', 'Main Board', 'Power Board'],
  },
  {
    id: 'tg-ecu',
    name: 'قناة تليجرام: كنترول ومخططات السيارات (ECU)',
    url: 'https://t.me/ecu_firmware_schematics',
    category: 'telegram',
    badge: 'تليجرام • سيارات ECU',
    desc: 'مخططات أطراف وكنترول كمبيوتر السيارات (ECU/ECM Pinouts)، دامبات الـ EEPROM، وحلول برمجة المفاتيح والإيموبلايزر.',
    icon: <Car className="w-5 h-5 text-rose-400" />,
    tags: ['ECU', 'Pinout', 'EEPROM', 'Immo'],
  },

  // 2. المنتديات ومجتمعات الصيانة الدولية
  {
    id: 'forum-badcaps',
    name: 'منتدى Badcaps.net الدولي لملفات الـ BIN والبيوس',
    url: 'https://www.badcaps.net/forum/',
    category: 'forums',
    badge: 'منتدى دولي • بيوس',
    desc: 'المرجع العالمي الأول المجاني لمهندسي صيانة اللابتوب لتحميل وتعديل ملفات البيوس BIN، حلول الشورت، وتعديل الـ ME Region.',
    icon: <Wrench className="w-5 h-5 text-amber-500" />,
    tags: ['Badcaps', 'BIOS BIN', 'Schematics', 'Clear ME'],
  },
  {
    id: 'forum-vinafix',
    name: 'موقع ومنتدى Vinafix للمخططات وبوردفيو اللابتوب',
    url: 'https://vinafix.com/',
    category: 'forums',
    badge: 'بنك مخططات • عالمي',
    desc: 'أكبر بنك لمخططات وبوردفيو لجميع أجيال لابتوب ديل ولينوفو وإتش بي والماك بوك مع ملفات سوفتوير EC و KBC.',
    icon: <Cpu className="w-5 h-5 text-emerald-500" />,
    tags: ['Vinafix', 'Schematics', 'Boardview', 'KBC'],
  },
  {
    id: 'forum-labone',
    name: 'موقع LabOneInside لملفات Clear ME و Dump BIN',
    url: 'https://www.laboneinside.com/',
    category: 'forums',
    badge: 'تحميل مباشر • مجاني',
    desc: 'تحميل ملفات بيوس جاهزة مع تنظيف الـ ME Region مجاناً لتخطي مشاكل تأخر الإقلاع والريستارت المفاجئ.',
    icon: <Cpu className="w-5 h-5 text-purple-500" />,
    tags: ['Clear ME', 'Dump BIN', 'Free Download'],
  },
  {
    id: 'forum-gsm',
    name: 'مجتمع GSM-Forum العالمي لخبراء السوفت والهارد',
    url: 'https://forum.gsmhosting.com/vbb/',
    category: 'forums',
    badge: 'منتدى دولي • موبايل',
    desc: 'أقدم وأكبر منتدى دولي لدونجلات الصيانة، حلول السوفتوير والتفليش، مسارات الجمپر، وتخطي أخطاء الـ Kernel Panic.',
    icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
    tags: ['GSM-Forum', 'Firmware', 'Hardware Jumper', 'Unlocking'],
  },
  {
    id: 'forum-remont',
    name: 'منتدى Remont-Aud الروسي للإلكترونيات الدقيقة',
    url: 'https://remont-aud.net/',
    category: 'forums',
    badge: 'منتدى روسي • هاردوير',
    desc: 'أقوى مجتمع هندسي روسي لصيانة دوائر الباور سبلاي، كروت الشاشة، الشاشات، وتحليل دوائر الـ PWM بالتفصيل.',
    icon: <Wrench className="w-5 h-5 text-rose-500" />,
    tags: ['Russian Forum', 'Power Supply', 'PWM', 'Monitor'],
  },
  {
    id: 'forum-eevblog',
    name: 'منتدى EEVblog للفيزياء والإلكترونيات الأكاديمية',
    url: 'https://www.eevblog.com/forum/',
    category: 'forums',
    badge: 'هندسي • قياسات',
    desc: 'مرجع أكاديمي للمهندسين لتحليل إشارات الأوسيلوسكوب، فحص مكونات الدوائر التناظرية والرقمية، وقوانين أوم والطاقة.',
    icon: <Cpu className="w-5 h-5 text-teal-500" />,
    tags: ['Oscilloscope', 'EEVblog', 'Waveforms', 'Lab'],
  },

  // 3. بنوك المخططات والبوردفيو التفاعلية
  {
    id: 'schem-borneo',
    name: 'منصة Borneo Schematics التفاعلية للموبايل واللابتوب',
    url: 'https://borneoschematics.com/',
    category: 'schematics',
    badge: 'دونجل تفاعلي • ممانعات',
    desc: 'المنصة الأكثر انتشاراً في ورش الصيانة؛ مخططات تفاعلية، قياسات ممانعة الدايود لكل أرجل الآيسيهات ومسارات الباور.',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    tags: ['Borneo', 'Diode Values', 'Hardware Solutions'],
  },
  {
    id: 'schem-phoneboard',
    name: 'برنامج Phoneboard المجاني مفتوح المصدر',
    url: 'https://phoneboard.co/',
    category: 'schematics',
    badge: 'برنامج مجاني • بوردفيو',
    desc: 'برنامج خفيف وسريع مجاني 100% لعرض ملفات البوردفيو (.brd, .fz) لآيفون وسامسونج مع تتبع الأرجل المتصلة بالمسار.',
    icon: <Cpu className="w-5 h-5 text-sky-500" />,
    tags: ['Phoneboard', 'Open Source', 'BRD Viewer'],
  },
  {
    id: 'schem-alldatasheet',
    name: 'بنك داتاشيت المكونات AllDataSheet العالمي',
    url: 'https://www.alldatasheet.com/',
    category: 'schematics',
    badge: 'داتاشيت • مواصفات آيسي',
    desc: 'محرك بحث عالمي لملفات الداتاشيت الرسمية من المصنعين (TI, Maxim, Richtek, Intersil, Qualcomm) ومخطط الأرجل Pinout.',
    icon: <FileText className="w-5 h-5 text-blue-400" />,
    tags: ['Datasheet', 'Pinout', 'IC Specs', 'TI', 'Maxim'],
  },
  {
    id: 'schem-repairwiki',
    name: 'موسوعة Repair.wiki التابعة للمهندس Louis Rossmann',
    url: 'https://repair.wiki/',
    category: 'schematics',
    badge: 'موسوعة ويكي • أعطال ماك',
    desc: 'دليل مفتوح المصدر يوثق أعطال بوردات الماك بوك واللابتوب خطوة بخطوة بالقيم الممانعة ومسببات الشورت الأكثر شيوعاً.',
    icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
    tags: ['RepairWiki', 'MacBook Faults', 'PPBUS_G3H'],
  },
  {
    id: 'schem-zxw',
    name: 'منصة دونجل ZXW Tools & Micro Placement',
    url: 'https://zxwteam.cn/',
    category: 'schematics',
    badge: 'دونجل احترافي • مسارات',
    desc: 'دونجل تتبع طبقات البوردة الداخلية ومسارات الباور والشحن مع تظليل نقاط الشورت وكشف المسارات المقطوعة.',
    icon: <Cpu className="w-5 h-5 text-purple-400" />,
    tags: ['ZXW', 'Micro Placement', 'PCB Layers'],
  },
  {
    id: 'schem-ifixit',
    name: 'موقع iFixit الدولي والعربي لتفكيك وصيانة الأجهزة',
    url: 'https://www.ifixit.com/',
    category: 'schematics',
    badge: 'دلائل فك • هاردوير',
    desc: 'دلائل مصورة خطوة بخطوة لتفكيك اللابتوب والموبايل، استبدال البطاريات والشاشات، ومواصفات المسامير والأدوات.',
    icon: <Wrench className="w-5 h-5 text-gray-400" />,
    tags: ['iFixit', 'Teardown', 'Guides', 'Screws'],
  },

  // 4. قنوات التدريب واللحام المجهري الاحترافي
  {
    id: 'vid-rewa',
    name: 'قناة REWA Technology للحام المجهري والشبلنة',
    url: 'https://www.youtube.com/@RewaElectronics',
    category: 'videos',
    badge: 'يوتيوب • شبلنة ومعالجات',
    desc: 'فيديوهات احترافية عالية الدقة لعمليات حفر المعالجات، شبلنة الآيسيهات BGA، والتعامل مع تسريب مسارات التغذية.',
    icon: <Youtube className="w-5 h-5 text-red-500" />,
    tags: ['REWA', 'Microsoldering', 'Reballing', 'CNC Drill'],
  },
  {
    id: 'vid-northridge',
    name: 'قناة NorthridgeFix لصيانة اللابتوب والمازربورد',
    url: 'https://www.youtube.com/@NorthridgeFix',
    category: 'videos',
    badge: 'يوتيوب • لابتوب وشورت',
    desc: 'شروحات عملية وتطبيقية خطوة بخطوة لكشف الشورت بالحرارة والرجينة وتبديل منافذ الشحن HDMI و USB-C المتضررة.',
    icon: <Youtube className="w-5 h-5 text-red-500" />,
    tags: ['NorthridgeFix', 'Short Detection', 'USB-C', 'Thermal'],
  },
  {
    id: 'vid-rossmann',
    name: 'قناة Louis Rossmann لتحليل دوائر باور الماك بوك',
    url: 'https://www.youtube.com/@rossmanngroup',
    category: 'videos',
    badge: 'يوتيوب • ماك بوك وباور',
    desc: 'أشهر قناة عالمية لتحليل سيكونس الباور على المخططات التفصيلية، فحص آيسي الشحن ISL، وإصلاح أجهزة الماك التي لا تعمل.',
    icon: <Youtube className="w-5 h-5 text-red-500" />,
    tags: ['Rossmann', 'MacBook Power', 'ISL6259', 'PPBUS'],
  },
  {
    id: 'vid-ipadrehab',
    name: 'قناة iPad Rehab لاستعادة البيانات وتشخيص الشورت',
    url: 'https://www.youtube.com/@iPadRehab',
    category: 'videos',
    badge: 'يوتيوب • آيفون وآيباد',
    desc: 'فيديوهات متقدمة في استخراج البيانات من الأجهزة الغارقة في الماء وحل أعطال خطوط الـ VDD_MAIN و Tristar.',
    icon: <Youtube className="w-5 h-5 text-red-500" />,
    tags: ['iPad Rehab', 'Data Recovery', 'Water Damage'],
  },
];

export default function SourcesReferences({ sources }: SourcesReferencesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ReferenceCategory>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [customReferences, setCustomReferences] = useState<CustomReference[]>([]);

  // محرك البحث المباشر السريع
  const [quickSearchInput, setQuickSearchInput] = useState('');

  const [newReference, setNewReference] = useState({
    title: '',
    url: '',
    category: 'custom' as ReferenceCategory,
    description: '',
  });

  // تحميل المراجع المخصصة من Supabase
  useEffect(() => {
    const loadCustomReferences = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const token = session.access_token;
          const response = await fetch('/api/custom-references', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const { data } = await response.json();
            const customRefs = data.map((ref: any) => ({
              id: ref.id,
              title: ref.title,
              url: ref.url,
              category: 'custom',
              description: ref.description || '',
              date: new Date(ref.created_at).toLocaleDateString('ar-EG'),
            }));
            setCustomReferences(customRefs);
          }
        }
      } catch (error) {
        console.error('Failed to load custom references:', error);
      }
    };

    loadCustomReferences();
  }, []);

  // إضافة مرجع مخصص جديد
  const handleAddReference = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        alert('يجب تسجيل الدخول لإضافة مرجع مخصص');
        return;
      }

      const token = session.access_token;
      const response = await fetch('/api/custom-references', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newReference),
      });

      if (response.ok) {
        const { data } = await response.json();
        const createdRef: CustomReference = {
          id: data.id,
          title: data.title,
          url: data.url,
          category: 'custom',
          description: data.description || '',
          date: new Date(data.created_at).toLocaleDateString('ar-EG'),
        };
        setCustomReferences((prev) => [createdRef, ...prev]);
        setShowAddModal(false);
        setNewReference({
          title: '',
          url: '',
          category: 'custom',
          description: '',
        });
      }
    } catch (error) {
      console.error('Failed to add reference:', error);
      alert('حدث خطأ أثناء إضافة المرجع');
    }
  };

  // تصفية دليل المراجع الثابت
  const filteredDirectory = useMemo(() => {
    let list = STATIC_DIRECTORY;

    if (selectedCategory !== 'all' && selectedCategory !== 'custom') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedCategory, searchQuery]);

  // روابط البحث المباشر بالكلمة المكتوبة
  const quickSearchQuery = quickSearchInput.trim() || 'LA-9104P';
  const encodedQuery = encodeURIComponent(quickSearchQuery);

  return (
    <div className="space-y-6 pt-3 text-right" dir="rtl">
      
      {/* 🚀 محرك البحث الهندسي الفوري في قنوات تليجرام وبنوك المخططات */}
      <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-dahab-500/5 to-transparent border border-amber-500/30 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-black text-base md:text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-dahab-500" />
              <span>محرك البحث المباشر في قنوات تليجرام والمخططات ودامبات البيوس</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              اكتب كود البوردة (مثال: <span className="font-mono text-amber-500 font-bold">820-02098</span> أو <span className="font-mono text-amber-500 font-bold">LA-9104P</span>) أو موديل الجهاز أو رقم الآيسي للبحث المباشر:
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-dahab-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مرجع هندسي</span>
          </button>
        </div>

        {/* حقل البحث السريع */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={quickSearchInput}
            onChange={(e) => setQuickSearchInput(e.target.value)}
            placeholder="اكتب كود البوردة أو الموديل هنا (مثال: LA-9104P, 820-02384, NM-A311, ISL95855, S23 Ultra)..."
            className="w-full pr-10 pl-4 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-amber-500/40 text-xs md:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-dahab-500 shadow-sm font-mono font-bold"
          />
        </div>

        {/* أزرار البحث الفوري بنقرة واحدة */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <a
            href={`https://t.me/s/laptop_schematics?q=${encodedQuery}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>📡 بحث في تليجرام لابتوب</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={`https://t.me/s/bios_dump?q=${encodedQuery}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>💾 بحث في تليجرام بيوس BIN</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={`https://t.me/s/mobile_schematics_firmware?q=${encodedQuery}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>📱 بحث في تليجرام موبايل</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={`https://www.google.com/search?q=site:badcaps.net+bios+bin+schematic+${encodedQuery}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>🌐 بحث في Badcaps.net</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={`https://vinafix.com/search/1/?q=${encodedQuery}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>📑 بحث في Vinafix</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={`https://www.alldatasheet.com/view.jsp?Searchword=${encodedQuery}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>🔍 داتاشيت AllDataSheet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={`https://www.youtube.com/results?search_query=repair+fix+schematics+${encodedQuery}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>🎥 شروحات يوتيوب</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 📌 في حال إجراء تشخيص مسبق: إبراز مراجع الفحص الخاصة بالجهاز المشخص */}
      {sources && sources.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-dahab-500" />
            <h3 className="font-black text-sm md:text-base text-gray-900 dark:text-gray-100">
              مراجع وتجارب الفحص المقترحة لجهازك الحالي:
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-dahab-500/20 text-dahab-700 dark:text-dahab-300 font-bold">
              {sources.length} مرجع مخصص
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources.map((src, i) => (
              <a
                key={`src-${i}`}
                href={src.link}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border hover:border-dahab-500/60 hover:shadow-lg transition flex flex-col justify-between group space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/20">
                      {src.source}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-dahab-500 transition shrink-0" />
                  </div>
                  <h4 className="font-bold text-xs md:text-sm text-gray-900 dark:text-gray-100 group-hover:text-dahab-600 dark:group-hover:text-dahab-400 transition line-clamp-2">
                    {src.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {src.snippet}
                  </p>
                </div>
                <div className="text-[10px] text-dahab-600 dark:text-dahab-400 font-bold pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1">
                  <span>فتح الرابط المباشر</span>
                  <span>←</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 🧭 تبويبات وفلاتر دليل المراجع الشامل */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* أزرار الفئات */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { id: 'all' as ReferenceCategory, label: 'الكل', icon: '🌐' },
              { id: 'telegram' as ReferenceCategory, label: 'قنوات تليجرام (6)', icon: '📡' },
              { id: 'forums' as ReferenceCategory, label: 'منتديات دولية (6)', icon: '💬' },
              { id: 'schematics' as ReferenceCategory, label: 'بنوك المخططات (6)', icon: '📐' },
              { id: 'videos' as ReferenceCategory, label: 'قنوات تدريب (4)', icon: '🎥' },
              { id: 'custom' as ReferenceCategory, label: `مراجعي المضافة (${customReferences.length})`, icon: '📌' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  selectedCategory === tab.id
                    ? 'bg-gradient-to-r from-dahab-500 to-amber-600 text-slate-950 shadow-md font-black'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* تصفية بالكلمة في الدليل */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="تصفية المراجع..."
              className="w-full pr-8 pl-3 py-1.5 rounded-xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
            />
          </div>
        </div>

        {/* عرض المراجع المخصصة المضافة يدوياً */}
        {selectedCategory === 'custom' && (
          <div className="space-y-3">
            {customReferences.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-200 dark:border-gray-800 space-y-2">
                <BookOpen className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  لم تقم بإضافة مراجع مخصصة بعد. اضغط على زر "إضافة مرجع هندسي" بالأعلى لإضافة روابطك وقنواتك المفضلة.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {customReferences.map((ref) => (
                  <a
                    key={ref.id}
                    href={ref.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border hover:border-dahab-500/50 hover:shadow-md transition flex flex-col justify-between group space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                          مرجع مخصص
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{ref.date}</span>
                      </div>
                      <h4 className="font-bold text-xs md:text-sm text-gray-900 dark:text-gray-100 group-hover:text-dahab-600 dark:group-hover:text-dahab-400 transition">
                        {ref.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {ref.description}
                      </p>
                    </div>
                    <div className="text-[10px] text-dahab-600 dark:text-dahab-400 font-bold pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <span className="truncate font-mono">{ref.url}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* عرض شبكة المراجع الهندسية والتليجرام */}
        {selectedCategory !== 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredDirectory.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="p-4 md:p-5 rounded-2xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border hover:border-dahab-500/60 hover:shadow-xl transition-all flex flex-col justify-between group space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-dahab-500/20 group-hover:text-dahab-500 transition">
                      {item.icon}
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold border border-gray-200 dark:border-gray-700">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-dahab-600 dark:group-hover:text-dahab-400 transition">
                      {item.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed line-clamp-3">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 flex-wrap">
                    {item.tags.slice(0, 3).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-dahab-600 dark:text-dahab-400 group-hover:translate-x-[-2px] transition flex items-center gap-1 shrink-0">
                    <span>زيارة المصدر</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

      </div>

      {/* 📜 الوثائق الرسمية والشروط الهندسية للمنظومة */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-dahab-500" />
          <h4 className="font-bold text-xs text-gray-800 dark:text-gray-200">
            الوثائق الرسمية والشروط الهندسية للمنظومة:
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition flex items-center justify-between group shadow-sm"
          >
            <div>
              <span className="font-bold text-xs text-amber-700 dark:text-amber-400 block group-hover:underline">
                📜 شروط الاستخدام وإخلاء المسؤولية
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                قواعد حقن الفولت، التعليم الهندسي ومسؤولية الفحص
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-amber-500 shrink-0" />
          </a>

          <a
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition flex items-center justify-between group shadow-sm"
          >
            <div>
              <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 block group-hover:underline">
                🛡️ سياسة الخصوصية وسرية البيانات
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                تشفير TLS وعدم مشاركة بيانات الأجهزة
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0" />
          </a>
        </div>
      </div>

      {/* Modal إضافة مرجع مخصص */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-dahab-500" />
                <span>إضافة مرجع هندسي خاص بك</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddReference} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  اسم أو عنوان المرجع / القناة:
                </label>
                <input
                  type="text"
                  required
                  value={newReference.title}
                  onChange={(e) => setNewReference({ ...newReference, title: e.target.value })}
                  placeholder="مثال: قناة صيانة كروت الشاشة على تليجرام"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  رابط الموقع أو قناة التليجرام (URL):
                </label>
                <input
                  type="url"
                  required
                  value={newReference.url}
                  onChange={(e) => setNewReference({ ...newReference, url: e.target.value })}
                  placeholder="https://t.me/your_channel أو رابط المنتدى"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  وصف مختصر للمرجع:
                </label>
                <textarea
                  rows={2}
                  value={newReference.description}
                  onChange={(e) => setNewReference({ ...newReference, description: e.target.value })}
                  placeholder="ما الذي يوفره هذا المرجع (دامبات، بوردفيو، مناقشات أعطال)..."
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:border-dahab-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-dahab-500 hover:bg-dahab-600 text-slate-950 font-bold shadow-md shadow-dahab-500/20"
                >
                  حفظ المرجع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
