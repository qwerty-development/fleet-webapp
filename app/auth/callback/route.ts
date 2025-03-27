import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

// Handle both GET and POST methods
export async function GET(request: NextRequest) {
  return handleAuthCallback(request);
}

export async function POST(request: NextRequest) {
  return handleAuthCallback(request);
}

// Unified callback handler logic
async function handleAuthCallback(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);

    // Extract authentication parameters from either query params or form data
    let idToken = null;
    let code = null;
    let state = null;

    // Handle POST requests (Apple Sign In uses form submission)
    if (request.method === 'POST') {
      const formData = await request.formData();
      idToken = formData.get('id_token') as string;
      code = formData.get('code') as string;
      state = formData.get('state') as string;
    }

    // Handle GET requests (Supabase OAuth typically uses query params)
    else {
      code = requestUrl.searchParams.get('code');
      state = requestUrl.searchParams.get('state');
    }

    // Get destination path from next parameter or default to /home
    const next = requestUrl.searchParams.get('next') || '/home';

    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Handle Apple ID Token authentication
    if (idToken) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: idToken,
      });

      if (error) {
        console.error('Apple ID token authentication error:', error);
        return NextResponse.redirect(
          new URL('/auth/signin?error=authentication_failed', requestUrl.origin)
        );
      }

      // Successful Apple authentication - redirect directly to home
      return NextResponse.redirect(new URL('/home', requestUrl.origin));
    }

    // Handle code-based authentication
    else if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    }

    // Failed authentication - no token or code
    else {
      console.error('No authentication parameters found');
      return NextResponse.redirect(
        new URL('/auth/signin?error=missing_credentials', requestUrl.origin)
      );
    }

    // Successful authentication with code - redirect to original destination
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (error) {
    console.error('Authentication callback error:', error);

    // Ensure error parameter is properly encoded
    const errorMessage = encodeURIComponent('Authentication failed');
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${errorMessage}`, request.url)
    );
  }
}