/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow uploading images up to 10MB in base64 payloads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
