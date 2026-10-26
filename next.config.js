/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow uploading images up to 10MB in base64 payloads + optimize icons/packages tree-shaking
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    optimizePackageImports: [
      'lucide-react',
    ],
  },
  // Extreme Bandwidth Optimization: unoptimized prevents Vercel image optimization transformations/costs
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self)'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https: res.cloudinary.com https: *.cloudinary.com; font-src 'self' data: https:; media-src 'self' data: blob: https:; connect-src 'self' https: wss:; object-src 'none'; base-uri 'self'; frame-ancestors 'self';"
          },
        ],
      },
      {
        // Immutable cache for Next.js compiled static chunks (JS/CSS)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      },
      {
        // Long-term aggressive browser caching for static media and assets
        source: '/:all*(svg|jpg|jpeg|png|webp|ico|woff|woff2|ttf|otf|mp3|wav|ogg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      },
      {
        // PWA Manifest and Service Worker caching control
        source: '/(manifest.json|manifest.webmanifest|sw.js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          },
        ],
      },
      {
        // إعدادات خاصة لـ API routes لتعطيل caching على Vercel Edge وضمان دقة البيانات
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          },
        ],
      },
      {
        // إعدادات خاصة لصفحة boardview للسماح بالتحميل في iframe
        source: '/boardview',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https: res.cloudinary.com https: *.cloudinary.com; font-src 'self' data: https:; media-src 'self' data: blob: https:; connect-src 'self' https: wss:; object-src 'none'; base-uri 'self'; frame-ancestors 'self';"
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
