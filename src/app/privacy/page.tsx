import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0B0F17] dark:via-[#111827] dark:to-[#0B0F17] text-gray-900 dark:text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">سياسة الخصوصية</h1>
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl space-y-4">
          <section>
            <h2 className="text-xl font-bold mb-2">جمع البيانات</h2>
            <p>نحن نجمع فقط البيانات الضرورية لتقديم خدمة التشخيص الهندسي. لا نشارك بياناتك مع أي طرف ثالث.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2">استخدام البيانات</h2>
            <p>تستخدم البيانات فقط لتحسين دقة التشخيص وتوفير تجربة مستخدم أفضل.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2">الأمان</h2>
            <p>نحن نستخدم تشفير SSL لحماية بياناتك أثناء النقل.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2">حقوق المستخدم</h2>
            <p>لديك الحق في طلب حذف بياناتك في أي وقت.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
