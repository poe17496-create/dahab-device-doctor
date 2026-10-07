/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow uploading images up to 10MB in base64 payloads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Cloudinary CDN for image optimization
  images: {
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
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https: res.cloudinary.com https: *.cloudinary.com; font-src 'self' data: https:; connect-src 'self' https: wss:; object-src 'none'; base-uri 'self'; frame-ancestors 'self';"
          },
        ],
      },
      {
        // إعدادات خاصة لـ API routes لتعطيل caching على Vercel Edge
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
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https: res.cloudinary.com https: *.cloudinary.com; font-src 'self' data: https:; connect-src 'self' https: wss:; object-src 'none'; base-uri 'self'; frame-ancestors 'self';"
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
