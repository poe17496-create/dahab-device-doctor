import React from 'react';
import DahabEcosystem from '@/components/DahabEcosystem';
import Link from 'next/link';
import { ArrowRight, Wrench } from 'lucide-react';

export const metadata = {
  title: 'منظومة برمجيات دهب سوفت وير | Dahab Software Ecosystem',
  description: 'معرض البرمجيات والأنظمة المتكاملة للمهندس إسلام دهب: كاشير، ترافل، أسنان، بيع آجل، مكافحة فيروسات وفدية، وبوابة المكفوفين.',
};

export default function EcosystemPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-workshop-bg text-gray-900 dark:text-gray-100 p-4 md:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* شريط الرجوع إلى معمل الفحص */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-workshop-card border border-gray-200 dark:border-workshop-border text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-dahab-500 transition shadow-sm"
          >
            <ArrowRight className="w-4 h-4 text-dahab-500" />
            <span>العودة إلى شاشة الفحص والمعمل</span>
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-dahab-500 transition"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>لوحة التحكم والمشرف</span>
          </Link>
        </div>

        {/* معرض البرمجيات الشامل */}
        <DahabEcosystem />
      </div>
    </main>
  );
}
