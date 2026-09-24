import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dahab Software | Dahab Device Doctor - خبير تشخيص وصيانة الإلكترونيات',
  description: 'المنظومة الهندسية الأولى في الشرق الأوسط لتشخيص وفصل أعطال الموبايل واللابتوب وكروت الباور والإلكترونيات الدقيقة.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="min-h-screen bg-gray-50 dark:bg-workshop-bg text-gray-900 dark:text-gray-100 antialiased selection:bg-dahab-500/30 selection:text-white transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
