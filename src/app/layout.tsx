import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://dahab-device-doctor.vercel.app'),
  title: 'Dahab Software | Dahab Device Doctor - خبير تشخيص وصيانة الإلكترونيات',
  description: 'المنظومة الهندسية الأولى في الشرق الأوسط لتشخيص وفصل أعطال الموبايل واللابتوب وكروت الباور والإلكترونيات الدقيقة.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'دهب دكتور',
  },
  openGraph: {
    title: 'دهب دكتور - خبير تشخيص الإلكترونيات',
    description: 'المنظومة الهندسية الأولى في الشرق الأوسط لتشخيص وفصل أعطال الموبايل واللابتوب وكروت الباور والإلكترونيات الدقيقة',
    url: 'https://dahab-device-doctor.vercel.app',
    siteName: 'دهب دكتور',
    images: [
      {
        url: '/logo.jpg',
        width: 512,
        height: 512,
        alt: 'دهب دكتور',
      },
    ],
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'دهب دكتور - خبير تشخيص الإلكترونيات',
    description: 'المنظومة الهندسية الأولى في الشرق الأوسط لتشخيص وفصل أعطال الموبايل واللابتوب وكروت الباور والإلكترونيات الدقيقة',
    images: ['/logo.jpg'],
  },
  keywords: ['تشخيص', 'صيانة', 'موبايل', 'لابتوب', 'إلكترونيات', 'ذكاء اصطناعي', 'صيانة هاردوير', 'صيانة سوفتوير', 'الشرق الأوسط', 'دهب دكتور'],
  authors: [{ name: 'دهب دكتور' }],
  creator: 'دهب دكتور',
  publisher: 'دهب دكتور',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f59e0b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <head>
        <meta name="theme-color" content="#f59e0b" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').then((registration) => {
                  console.log('SW registered: ', registration);
                }).catch((registrationError) => {
                  console.log('SW registration failed: ', registrationError);
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-[#0B0F17] dark:via-[#111827] dark:to-[#0B0F17] text-gray-900 dark:text-gray-100 antialiased selection:bg-dahab-500/30 selection:text-white transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
