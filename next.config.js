/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'momhdxlmwzdikxmwittx.supabase.co',
      'www.carlogos.org',
      'cdn.freebiesupply.com',
      'upload.wikimedia.org',
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com;
              style-src 'self' 'unsafe-inline';
              connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://apis.google.com http://localhost:* http://127.0.0.1:*;
              img-src 'self' data: https: blob:;
              media-src 'self' https://*.supabase.co blob: data:;
              font-src 'self' data:;
              frame-src 'self' https://accounts.google.com;
              object-src 'self' https://*.supabase.co;
              worker-src 'self' blob: 'unsafe-inline';
            `.replace(/\s+/g, ' ').trim(),
          },
        ],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;