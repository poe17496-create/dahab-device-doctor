import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dahab Device Doctor | منظومة دهب لتشخيص وصيانة الإلكترونيات',
  description: 'المنظومة الهندسية الأولى في الشرق الأوسط لتشخيص وفصل أعطال الهاردوير والسوفتوير مع نظام الذاكرة الدائمة في ملفات JSON.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-workshop-bg text-gray-100 antialiased selection:bg-dahab-500/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
