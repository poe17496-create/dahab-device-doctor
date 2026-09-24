import React from 'react';
import { Cpu, Award, Globe } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0B0F17] dark:via-[#111827] dark:to-[#0B0F17] text-gray-900 dark:text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">عن دهب دكتور</h1>
        
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl space-y-6">
          <section className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-dahab-500/20 text-dahab-600 dark:text-dahab-400 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">المنظومة الهندسية الأولى في الشرق الأوسط</h2>
              <p>دهب دكتور هو منصة متقدمة لتشخيص وصيانة الإلكترونيات باستخدام الذكاء الاصطناعي المتعدد المحركات.</p>
            </div>
          </section>

          <section className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">الميزات الرئيسية</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>تشخيص ذكي باستخدام OpenAI و OpenRouter و Gemini</li>
                <li>معمل البوردفيو التفاعلي</li>
                <li>موسوعة الآيسيهات الشاملة</li>
                <li>حاسبة حقن الفولت والحرارة</li>
                <li>تحليل سجلات البانيك</li>
              </ul>
            </div>
          </section>

          <section className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">الرؤية</h2>
              <p>أن نكون المنصة الرائدة في تشخيص وصيانة الإلكترونيات في الشرق الأوسط والعالم.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
