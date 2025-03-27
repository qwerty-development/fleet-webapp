import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function GET(request: NextRequest) {
  // Create a CSP header that explicitly allows Apple's CDN
  return NextResponse.json(
    { success: true },
    {
      headers: {
        'Content-Security-Policy':
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' https://appleid.cdn-apple.com; " +
          "connect-src 'self' https://appleid.apple.com; " +
          "frame-src 'self' https://appleid.apple.com;"
      }
    }
  );
}