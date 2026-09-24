'use client';

import React, { useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { localStorageTickets } from '@/lib/localStorage';

export default function SupportPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // محاكاة إنشاء تذكرة (في الواقع تحتاج معرف المستخدم)
    localStorageTickets.addTicket({
      userId: 'guest_user',
      title,
      description,
      status: 'open',
      priority,
    });

    setSubmitted(true);
    setTitle('');
    setDescription('');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0B0F17] dark:via-[#111827] dark:to-[#0B0F17] text-gray-900 dark:text-gray-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-8 shadow-xl text-center">
            <MessageCircle className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">تم إرسال التذكرة بنجاح</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              سنقوم بالرد عليك في أقرب وقت ممكن
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="bg-dahab-500 hover:bg-dahab-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              إرسال تذكرة جديدة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0B0F17] dark:via-[#111827] dark:to-[#0B0F17] text-gray-900 dark:text-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">الدعم الفني</h1>
        
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                العنوان
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-gray-100 dark:bg-[#1F2937] border border-gray-200 dark:border-[#374151] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-dahab-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الأولوية
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-100 dark:bg-[#1F2937] border border-gray-200 dark:border-[#374151] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-dahab-500"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="urgent">عاجلة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الوصف
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                className="w-full p-3 rounded-xl bg-gray-100 dark:bg-[#1F2937] border border-gray-200 dark:border-[#374151] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-dahab-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-dahab-500 hover:bg-dahab-600 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              إرسال التذكرة
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
