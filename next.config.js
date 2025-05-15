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
        source: '/((?!.well-known).*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://*.googleapis.com;
              style-src 'self' 'unsafe-inline';
              connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://apis.google.com http://localhost:* http://127.0.0.1:*;
              img-src 'self' data: https: blob:;
              media-src 'self' https://*.supabase.co blob: data:;
              font-src 'self' data:;
              frame-src 'self' https://accounts.google.com https://*.google.com https://*.googleapis.com https://*.gstatic.com;
              object-src 'self' https://*.supabase.co;
              worker-src 'self' blob: 'unsafe-inline';
            `.replace(/\s+/g, ' ').trim(),
          },
          {
            key: 'Accept',
            value: 'application/json, application/x-www-form-urlencoded, text/html, */*',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },

      // 2. APPLE APP SITE ASSOCIATION HEADERS
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },

      // 3. ANDROID ASSET LINKS HEADERS
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },

  // 4. ADD REWRITES CONFIGURATION
  async rewrites() {
    return [
      {
        source: '/.well-known/:path*',
        destination: '/.well-known/:path*',
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