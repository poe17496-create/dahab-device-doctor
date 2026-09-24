import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0B0F17] dark:via-[#111827] dark:to-[#0B0F17] text-gray-900 dark:text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">تواصل معنا</h1>
        
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-xl space-y-6">
          <section className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-dahab-500/20 text-dahab-600 dark:text-dahab-400 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">البريد الإلكتروني</h2>
              <p>dahab@doctor.com</p>
            </div>
          </section>

          <section className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">الهاتف</h2>
              <p>+966 XX XXX XXXX</p>
            </div>
          </section>

          <section className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">الموقع</h2>
              <p>الشرق الأوسط</p>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold mb-4">أرسل لنا رسالة</h2>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="الاسم"
                className="w-full p-3 rounded-xl bg-gray-100 dark:bg-[#1F2937] border border-gray-200 dark:border-[#374151]"
              />
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                className="w-full p-3 rounded-xl bg-gray-100 dark:bg-[#1F2937] border border-gray-200 dark:border-[#374151]"
              />
              <textarea
                placeholder="الرسالة"
                rows={4}
                className="w-full p-3 rounded-xl bg-gray-100 dark:bg-[#1F2937] border border-gray-200 dark:border-[#374151]"
              />
              <button
                type="submit"
                className="bg-dahab-500 hover:bg-dahab-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                إرسال
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
