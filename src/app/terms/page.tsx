import React from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, ArrowRight, BookOpen, Scale, FileText } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0B0F17] dark:via-[#111827] dark:to-[#0B0F17] text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* رابط العودة للرئيسية */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-dahab-600 dark:text-dahab-400 hover:underline"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمنظومة الرئيسية</span>
          </Link>
          <span className="text-[11px] text-gray-400 font-mono">آخر تحديث: سبتمبر 2026</span>
        </div>

        {/* الهيدر */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-dahab-500 border border-amber-500/20">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black">شروط الاستخدام وإخلاء المسؤولية القانونية</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                منظومة "ذهب دكتور" (Dahab Device Doctor) - الشروط المنظمة للاستخدام الهندسي
              </p>
            </div>
          </div>
        </div>

        {/* تنبيه هندسي رئيسي */}
        <div className="p-4 md:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs md:text-sm leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>تنبيه هندسي وإخلاء مسؤولية أساسي:</span>
          </div>
          <p>
            منظومة "ذهب دكتور" هي <strong>أداة تعليمية واستشارية ومحاكاة هندسية مساعدة لمهندسي وفنيي الصيانة</strong>. كافة التشخيصات والمخرجات الصادرة عن الذكاء الاصطناعي والمخططات هي أدوات استرشادية مبنية على الاحتمالات وخوارزميات تحليل المخططات، وليست بديلاً عن الفحص الفيزيائي والمختبري اليدوي.
          </p>
        </div>

        {/* بنود الاتفاقية */}
        <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl p-6 md:p-8 shadow-xl space-y-6 text-xs md:text-sm leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-base font-bold flex items-center gap-2 text-dahab-600 dark:text-dahab-400">
              <BookOpen className="w-4 h-4" />
              <span>1. طبيعة المنصة والغرض التعليمي</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              تُقدّم المنصة لمهندسي وفنيي الإلكترونيات بغرض توفير مرجع تقني استرشادي يسهّل قراءة مسارات الطاقة وسيكونس الإقلاع (Power Sequence). لا تتحمل المنصة أو إدارتها أو مطوروها أي مسؤولية مباشرة أو غير مباشرة عن أي أضرار مادية، تلف للدوائر المتكاملة، احتراق للمعالجات، أو فقدان لبيانات الأجهزة أثناء محاولات الإصلاح.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold flex items-center gap-2 text-dahab-600 dark:text-dahab-400">
              <AlertTriangle className="w-4 h-4" />
              <span>2. قواعد حقن الفولت والسلامة المهنية</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              يتحمل المستخدم وحده المسؤولية الكاملة عن ضبط قيم الجهد والتيار على جهاز الباور سبلاي أثناء فحص الشورت. تمنع المنصة هندسياً حقن أي فولت يتجاوز الحدود القصوى للخطوط، ويُلزم الفني بمراجعة الممانعة بوضع الدايود (Diode Mode) قبل توصيل أي تيار باللوحة الأم.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold flex items-center gap-2 text-dahab-600 dark:text-dahab-400">
              <FileText className="w-4 h-4" />
              <span>3. حقوق الملكية الفكرية ومحتوى المجتمع</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              جميع المخططات، ملفات البوردفيو، والروابط المنشورة أو المرفوعة من قِبل أعضاء المجتمع أو المستخدمين تقع تحت المسؤولية القانونية الكاملة للناشر. تلتزم المنصة بحماية حقوق الملكية الفكرية وتوفر آليات إبلاغ فورية لإزالة أي محتوى مخالف بناءً على طلب المالك الشرعي.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold flex items-center gap-2 text-dahab-600 dark:text-dahab-400">
              <ShieldCheck className="w-4 h-4" />
              <span>4. سياسة الحسابات والجلسات الأحادية</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              حسابات الفنيين المعتمدين شخصية وغير قابلة للمشاركة. تعمل الجلسة على جهاز واحد فقط في نفس الوقت. يحق لإدارة المنصة تعليق أو حظر أي حساب في حالة رصد مشاركة غير مصرح بها لبيانات الدخول أو محاولات الاستغلال التجاري غير المشروع.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
