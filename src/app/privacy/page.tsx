import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, ArrowRight, Database, EyeOff, Server } from 'lucide-react';

export default function PrivacyPolicy() {
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
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black">سياسة الخصوصية وسرية بيانات الأجهزة</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                منظومة "ذهب دكتور" (Dahab Device Doctor) - التزام كامل بأمن وسرية الورش والفنيين
              </p>
            </div>
          </div>
        </div>

        {/* بنود سياسة الخصوصية */}
        <div className="bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border rounded-3xl p-6 md:p-8 shadow-xl space-y-6 text-xs md:text-sm leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-base font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Database className="w-4 h-4" />
              <span>1. البيانات التي يتم التعامل معها</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              تتعامل المنصة حصراً مع البيانات التقنية اللازمة لإجراء التشخيص الهندسي: مثل موديل الجهاز، قراءات الباور سبلاي، وصف العطل، وصور المخططات أو الدوائر المرفوعة. لا نطلب ولا نخزن أي بيانات شخصية تخص عملاء الورش (كالصور الخاصة أو الأسماء أو أرقام الهواتف الشخصية).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Server className="w-4 h-4" />
              <span>2. أمان التخزين السحابي والتشفير</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              يتم تشفير كافة الاتصالات بين المتصفح والخادم باستخدام بروتوكول TLS 1.3 / SSL المعتمد عالمياً. تُحفظ سجلات الفحص والتقارير في خوادم مشفرة مع تطبيق سياسات أمان صارمة على مستوى السجلات (Row Level Security - RLS) لمنع أي وصول غير مصرح به.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <EyeOff className="w-4 h-4" />
              <span>3. عدم مشاركة البيانات مع أطراف ثالثة</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              تلتزم المنصة بعدم بيع، تأجير، أو مشاركة بيانات الفنيين أو تقارير الفحص أو سجلات الأجهزة مع أي شركات إعلانية أو جهات تجارية خارجية. البيانات تُستخدم حصرياً لتحسين دقة خوارزميات التشخيص وتوفير نسخة احتياطية لحساب الفني.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>4. حق الفني في إدارة وحذف السجلات</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              يمتلك الفني كامل الصلاحية في أي وقت لحذف أي جلسة فحص أو محادثة من سجله السحابي والمحلي بضغطة زر واحدة. عند تأكيد الحذف، يتم إزالة السجل نهائياً وفورياً من كافة السيرفرات وقواعد البيانات.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
