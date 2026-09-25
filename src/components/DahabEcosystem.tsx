'use client';

import React from 'react';
import {
  ShieldAlert,
  Calculator,
  Plane,
  Eye,
  Globe,
  CreditCard,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Lock,
  Layers,
  PhoneCall,
  Crown,
  Heart,
  Stethoscope,
} from 'lucide-react';

interface SoftwareItem {
  id: string;
  title: string;
  category: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  gradient: string;
  version: string;
  status: string;
}

export default function DahabEcosystem() {
  const softwareList: SoftwareItem[] = [
    {
      id: 'cashier',
      title: 'نظام المحاسبة المصري (الكاشير والمخازن)',
      category: 'أنظمة إدارة الشركات ونقاط البيع (POS & ERP)',
      badge: 'الأكثر مبيعاً ⭐',
      badgeColor: 'bg-dahab-500/20 text-dahab-700 dark:text-dahab-300 border-dahab-500/30',
      description:
        'منظومة محاسبية متطورة متوافقة مع متطلبات السوق المصري، تشمل نقاط البيع، الفواتير الإلكترونية، إدارة المخازن والأصناف المتعددة، وتقارير حركة الخزينة والأرباح لحظة بلحظة.',
      features: [
        'إصدار فواتير ضريبية وإلكترونية متطابقة مع مصلحة الضرائب',
        'جرد المخازن بباركود وتنبيهات نواقص الأصناف والصلاحية',
        'إدارة خزينة نقدية، ورديات كاشير، وحسابات البنوك',
        'تقارير أرباح وخسائر وقوائم مالية شاملة بنقرة زر',
      ],
      icon: <Calculator className="w-6 h-6 text-dahab-500" />,
      gradient: 'from-dahab-500/10 via-amber-500/5 to-transparent',
      version: 'v4.8 Pro',
      status: 'متاح للطلب والتشغيل الفوري',
    },
    {
      id: 'travel',
      title: 'دهب ترافل أوفلاين (Dahab Travel Offline)',
      category: 'أنظمة السياحة والرحلات بدون إنترنت',
      badge: 'يعمل أوفلاين 100% ✈️',
      badgeColor: 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30',
      description:
        'منظومة متكاملة لشركات السياحة والسفر وإدارة باقات الحج والعمرة والرحلات الداخلية والخارجية بكفاءة فائقة حتى في حال انقطاع خدمة الإنترنت تماماً.',
      features: [
        'قاعدة بيانات محلية سريعة ومحمية تعمل بدون الحاجة لإنترنت',
        'إدارة حجوزات الفنادق، الطيران، والانتقالات بملف واحد للعميل',
        'طباعة تذاكر وبرامج الرحلات وإيصالات السداد الاحترافية',
        'مزامنة سحابية ذكية تلقائية عند توفر اتصال بالشبكة',
      ],
      icon: <Plane className="w-6 h-6 text-sky-500" />,
      gradient: 'from-sky-500/10 via-blue-500/5 to-transparent',
      version: 'v3.2 Offline Suite',
      status: 'متاح للشركات والمكاتب السياحية',
    },
    {
      id: 'dental',
      title: 'نظام معامل الأسنان الذكي (Dental Lab)',
      category: 'إدارة المعامل الطبية والمختبرات',
      badge: 'طبي تخصصي 🦷',
      badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      description:
        'منظومة رقمية تخصصية متقدمة لإدارة معامل تركيبات الأسنان، تتبع مراحل تصنيع الزيركون، الإيماكس، والبورسلين، وتنظيم الحسابات المالية مع العيادات وأطباء الأسنان.',
      features: [
        'تتبع دورة حياة طلب التركيبات خطوة بخطوة بالباركود',
        'دفتر حسابات وفواتير مخصصة لكل عيادة وطبيب أسنان',
        'إدارة خامات الزيركون والمعادن وتكلفة فنيي المعمل',
        'أرشفة صور الأشعة وتفاصيل الألوان والمقاسات الطبية',
      ],
      icon: <Stethoscope className="w-6 h-6 text-emerald-500" />,
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      version: 'v2.6 Dental Edition',
      status: 'معتمد لمعامل التركيبات والمختبرات',
    },
    {
      id: 'installments',
      title: 'حسابات البيع الآجل والأقساط والعملاء',
      category: 'إدارة الديون والتحصيلات المالية',
      badge: 'التحصيل والأقساط 💳',
      badgeColor: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      description:
        'برنامج متخصص في ضبط البيع بالتقسيط وإدارة حسابات الديون المستحقة على العملاء، مع تنبيهات بمواعيد السداد وجداول الأقساط الشهرية وطباعة إيصالات الأمانة والعقود.',
      features: [
        'جدولة تلقائية للأقساط الشهرية والأسبوعية مع نسب الفائدة',
        'تنبيهات فورية بالعملاء المتأخرين عن السداد والديون المتعثرة',
        'طباعة عقود البيع وإيصالات السداد وكشوف الحساب المعتمدة',
        'دفاتر متكاملة لحسابات الموردين والشيكات البنكية المؤجلة',
      ],
      icon: <CreditCard className="w-6 h-6 text-indigo-500" />,
      gradient: 'from-indigo-500/10 via-purple-500/5 to-transparent',
      version: 'v3.5 Credit Guard',
      status: 'متاح للمحلات والشركات والتجار',
    },
    {
      id: 'antivirus',
      title: 'برنامج دهب لمكافحة الفيروسات وفيروسات الفدية',
      category: 'الأمن السيبراني وحماية البيانات',
      badge: 'مجاني بالكامل 🛡️',
      badgeColor: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30',
      description:
        'تطبيق أمني قوي ومجاني تم تطويره خصيصاً لمكافحة فيروسات الفدية التدميرية (Ransomware) ومنع تشفير الملفات، مع حماية المجلدات الحساسة واصطياد برمجيات التجسس والتروجان في ثوانٍ.',
      features: [
        'درع استباقي متقدم لمراقبة محاولات تشفير الملفات المشبوهة وحظرها فوراً',
        'قفل وحماية المجلدات الهامة وقواعد البيانات ضد أي تعديل خبيث',
        'محرك فحص سريع وخفيف لا يستهلك موارد المعالج أو الذاكرة',
        'أداة كشف وإبادة تروجان التعدين (Crypto-Miners) والبرمجيات الخفية',
      ],
      icon: <ShieldAlert className="w-6 h-6 text-rose-500" />,
      gradient: 'from-rose-500/10 via-red-500/5 to-transparent',
      version: 'v2.1 Ransomware Shield',
      status: 'مجاني متاح لكافة المستخدمين',
    },
    {
      id: 'portal',
      title: 'بوابة دهب سوفت وير الرسمية (Dahab Portal)',
      category: 'بوابة البرمجيات والحلول التقنية',
      badge: 'البوابة الموحدة 🌐',
      badgeColor: 'bg-dahab-500/20 text-dahab-700 dark:text-dahab-300 border-dahab-500/30',
      description:
        'الموقع الرسمي الشامل الذي يجمع كافة برمجيات وتطبيقات وخدمات دهب سوفت وير، ويتيح للعملاء استعراض المنتجات، طلب النسخ التجريبية، وتلقي الدعم الفني المباشر.',
      features: [
        'معرض حي وشامل لجميع الأنظمة والتطبيقات البرمجية',
        'قنوات دعم فني وخدمة عملاء مباشرة على مدار الساعة',
        'شروحات فيديو تفصيلية ودليل استخدام مصور لكل نظام',
        'مركز تحميل التحديثات الدورية ورخص التشغيل المعتمدة',
      ],
      icon: <Globe className="w-6 h-6 text-dahab-500" />,
      gradient: 'from-amber-500/10 via-yellow-500/5 to-transparent',
      version: 'Official Portal',
      status: 'بوابة المنظومة الرسمية',
    },
    {
      id: 'blind',
      title: 'موقع دهب سوفت وير للمكفوفين (Dahab Vision)',
      category: 'المسؤولية المجتمعية والتمكين الرقمي',
      badge: 'مبادرة مجتمعية مجانية 🤍',
      badgeColor: 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30',
      description:
        'مبادرة إنسانية ومجتمعية مجانية بالكامل من المهندس إسلام دهب، لتمكين المكفوفين وضعاف البصر من استخدام وتصفح التقنية عبر منصة مصممة بأعلى معايير الوصول الرقمي الشامل وقارئات الشاشة العالمية.',
      features: [
        'متوافق بنسبة 100% مع قارئات الشاشة (NVDA, JAWS, TalkBack)',
        'تصفح كامل عبر لوحة المفاتيح واختصارات سريعة بدون فارة',
        'واجهة عالية التباين وخطوط صوتية وإرشاد صوتي تفاعلي',
        'خدمة إنسانية مفتوحة ومجانية تماماً لجميع المكفوفين في الوطن العربي',
      ],
      icon: <Eye className="w-6 h-6 text-teal-500" />,
      gradient: 'from-teal-500/10 via-emerald-500/5 to-transparent',
      version: 'Accessibility Suite',
      status: 'مبادرة مجانية مدى الحياة',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* بطاقة تقديم المطور والمنظومة */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-white via-amber-50/20 to-white dark:from-workshop-card dark:via-dahab-500/5 dark:to-workshop-card border border-dahab-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-dahab-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-br from-dahab-400 to-amber-600 text-slate-950 font-black shadow-md shadow-dahab-500/20">
                <Crown className="w-5 h-5" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-dahab-600 dark:text-dahab-400">
                DAHAB SOFTWARE ECOSYSTEM
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-dahab-500 via-amber-600 to-yellow-500 bg-clip-text text-transparent">
              منظومة برمجيات وحلول المهندس إسلام دهب
            </h2>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
              منظومة برمجية متكاملة رائدة في مصر والشرق الأوسط، تجمع بين أحدث أنظمة الحسابات ونقاط البيع، البرمجيات السياحية والطبية التخصصية، دروع الحماية والأمن السيبراني، والمبادرات الإنسانية لتمكين المكفوفين.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href="https://dahabsoftware.com/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-dahab-500/40 text-dahab-700 dark:text-dahab-300 font-black text-xs hover:border-dahab-500 transition shadow-sm"
            >
              <Globe className="w-4 h-4 text-dahab-500" />
              <span>موقع دهب سوفت وير (dahabsoftware.com)</span>
            </a>

            <a
              href="https://wa.me/201064147224"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-dahab-500 to-amber-600 hover:from-dahab-600 hover:to-amber-700 text-slate-950 font-black text-xs transition shadow-lg shadow-dahab-500/25"
            >
              <PhoneCall className="w-4 h-4" />
              <span>تواصل مع م. إسلام دهب (01064147224)</span>
            </a>
          </div>
        </div>
      </div>

      {/* شبكة البرمجيات والأنظمة (Grid of 7 Software Systems) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {softwareList.map((item) => (
          <div
            key={item.id}
            className={`p-6 rounded-3xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border hover:border-dahab-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-5 relative overflow-hidden bg-gradient-to-br ${item.gradient}`}
          >
            <div className="space-y-4">
              {/* هيدر الكارت */}
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                  {item.icon}
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* العنوان والوصف */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 block mb-1">
                  {item.category}
                </span>
                <h3 className="text-base font-black text-gray-900 dark:text-gray-100 mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* قائمة المميزات الرئيسية */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800/80">
                <span className="text-[10px] font-black text-dahab-600 dark:text-dahab-400 block">
                  أبرز المواصفات التقنية:
                </span>
                <ul className="space-y-1.5">
                  {item.features.map((feat, idx) => (
                    <li
                      key={idx}
                      className="text-[11px] text-gray-600 dark:text-gray-400 flex items-start gap-2 leading-tight"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-dahab-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* الفوتر للكارت */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px]">
              <span className="font-mono font-bold text-gray-500 dark:text-gray-400">
                {item.version}
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{item.status}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* كارت المبادرة الإنسانية لموقع المكفوفين */}
      <div className="p-6 rounded-3xl bg-teal-500/10 border border-teal-500/30 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Heart className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-black text-gray-900 dark:text-gray-100">
              موقع دهب سوفت وير أونلاين للكفيف - خدمة مجانية لوجه الله تعالى
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              منصة رقمية مجانية ومفتوحة وموجهة لجميع المكفوفين وضعاف البصر في الوطن العربي، تتيح لهم التفاعل الصوتي الكامل والوصول السريع للمحتوى والخدمات التعليمية والتقنية.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <a
            href="https://dahabsoftware.online/"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs transition shadow-md shadow-teal-600/20 flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>زيارة موقع نور (dahabsoftware.online)</span>
          </a>

          <a
            href="https://wa.me/201064147224?text=استفسار+عن+منصة+المكفوفين+المجانية+دهب+سوفت+وير"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-bold text-xs transition"
          >
            طلب دعم المكفوفين 🤍
          </a>
        </div>
      </div>
    </div>
  );
}
