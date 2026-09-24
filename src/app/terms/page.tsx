import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0B0F17] dark:via-[#111827] dark:to-[#0B0F17] text-gray-900 dark:text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">شروط الاستخدام</h1>
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl space-y-4">
          <section>
            <h2 className="text-xl font-bold mb-2">القبول بالشروط</h2>
            <p>باستخدامك لهذا التطبيق، أنت توافق على هذه الشروط.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2">الاستخدام المسموح</h2>
            <p>يُسمح باستخدام التطبيق لأغراض تشخيص وصيانة الإلكترونيات فقط.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-2">المسؤولية</h2>
            <p>التطبيق يقدم توجيهاً هندسياً فقط ولا يتحمل مسؤولية أي أضرار ناتجة عن الاستخدام.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
