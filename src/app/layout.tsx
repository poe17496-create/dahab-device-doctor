import type { Metadata, Viewport } from 'next';
import './globals.css';
import ErrorBoundary from '@/components/ErrorBoundary';
import { DiagnosticProvider } from '@/contexts/DiagnosticContext';

export const metadata: Metadata = {
  metadataBase: new URL('https://dahabsoftware.site'),
  title: 'Dahab Software | Dahab Device Doctor - خبير تشخيص وصيانة الإلكترونيات',
  description: 'المنظومة الهندسية الأولى في الشرق الأوسط لتشخيص وفصل أعطال الموبايل واللابتوب وكروت الباور والإلكترونيات الدقيقة باستخدام الذكاء الاصطناعي.',
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
    title: 'دهب دكتور - خبير تشخيص الإلكترونيات بالذكاء الاصطناعي',
    description: 'المنظومة الهندسية الأولى في الشرق الأوسط لتشخيص وفصل أعطال الموبايل واللابتوب وكروت الباور والإلكترونيات الدقيقة باستخدام الذكاء الاصطناعي المتقدم.',
    url: 'https://dahabsoftware.site',
    siteName: 'دهب دكتور',
    images: [
      {
        url: '/logo.jpg',
        width: 512,
        height: 512,
        alt: 'دهب دكتور - تشخيص الإلكترونيات',
      },
    ],
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'دهب دكتور - خبير تشخيص الإلكترونيات',
    description: 'المنظومة الهندسية الأولى في الشرق الأوسط لتشخيص وفصل أعطال الموبايل واللابتوب وكروت الباور والإلكترونيات الدقيقة.',
    images: ['/logo.jpg'],
  },
  keywords: [
    'تشخيص أعطال الموبايل',
    'صيانة iPhone',
    'صيانة Samsung',
    'صيانة MacBook',
    'إصلاح شاشات',
    'صيانة كروت باور',
    'ذكاء اصطناعي للصيانة',
    'تشخيص هاردوير',
    'تشخيص سوفتوير',
    'فحص البورد',
    'تحليل سجلات البانيك',
    'حاسبة فولت',
    'صيانة إلكترونيات',
    'Middle East electronics repair',
    '手机维修',
    '电脑维修',
    'صيانة الشرق الأوسط',
    'دهب دكتور',
    'Dahab Device Doctor'
  ],
  authors: [{ name: 'دهب دكتور' }],
  creator: 'دهب دكتور',
  publisher: 'دهب دكتور',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#f59e0b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="theme-color" content="#f59e0b" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <link rel="canonical" href="https://dahabsoftware.site" />
        
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
              `,
              }}
            />
          </>
        )}
        
        {/* Facebook Pixel */}
        {process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        )}
        
        {/* Google Search Console Verification */}
        {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
          <meta
            name="google-site-verification"
            content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
          />
        )}
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "دهب دكتور - خبير تشخيص الإلكترونيات",
              "url": "https://dahabsoftware.site",
              "description": "المنظومة الهندسية الأولى في الشرق الأوسط لتشخيص وفصل أعطال الموبايل واللابتوب وكروت الباور والإلكترونيات الدقيقة باستخدام الذكاء الاصطناعي",
              "applicationCategory": "UtilitiesApplication",
              "operatingSystem": "Web, Android, iOS",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EGP"
              },
              "author": {
                "@type": "Organization",
                "name": "دهب دكتور",
                "url": "https://dahabsoftware.site"
              }
            })
          }}
        />
        <script
          type="text/javascript"
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
      <body className="min-h-screen bg-gradient-to-br from-dahab-50 via-amber-50 to-orange-50 dark:from-[#0B0F17] dark:via-[#111827] dark:to-[#0B0F17] text-gray-900 dark:text-gray-100 antialiased selection:bg-dahab-500/30 selection:text-white transition-colors duration-300">
        <DiagnosticProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </DiagnosticProvider>
      </body>
    </html>
  );
}
