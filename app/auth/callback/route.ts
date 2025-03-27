import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

// Add explicit exports for both HTTP methods
export async function GET(request: NextRequest) {
  // Handle standard OAuth code exchange (for non-Apple providers)
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // Redirect to home if no code (fallback safety)
  if (!code) {
    console.error('GET: No authentication code provided');
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  try {
    // Initialize Supabase client with cookie store
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);

    // Redirect to home after successful authentication
    return NextResponse.redirect(new URL('/home', request.url));
  } catch (error) {
    console.error('Error in callback GET handler:', error);
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}

export async function POST(request: NextRequest) {
  console.log('POST request received on /auth/callback');

  try {
    // 1. Extract form data from Apple's POST request
    const formData = await request.formData();
    console.log('Form data keys:', Array.from(formData.keys()));

    // 2. Extract critical authentication values
    const idToken = formData.get('id_token') as string;
    const code = formData.get('code') as string;
    const state = formData.get('state') as string;

    // 3. Log received data for debugging (remove in production)
    console.log('Authentication data received:', {
      hasIdToken: !!idToken,
      hasCode: !!code,
      hasState: !!state
    });

    // 4. Verify we have either id_token or code
    if (!idToken && !code) {
      console.error('POST: No id_token or code provided');
      return NextResponse.redirect(new URL('/auth/signin?error=missing_credentials', request.url));
    }

    // 5. Initialize Supabase client with cookie store
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 6. Process authentication based on available credentials
    if (idToken) {
      // 6a. Handle Apple ID token authentication
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: idToken,
      });

      if (error) {
        console.error('Error signing in with Apple ID token:', error);
        return NextResponse.redirect(new URL('/auth/signin?error=token_processing', request.url));
      }

      console.log('Successfully authenticated with Apple ID token');
    } else if (code) {
      // 6b. Handle code-based authentication
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(new URL('/auth/signin?error=code_processing', request.url));
      }

      console.log('Successfully authenticated with code');
    }

    // 7. Create direct redirect to home after successful authentication
    return NextResponse.redirect(new URL('/home', request.url));
  } catch (error) {
    // 8. Comprehensive error handling
    console.error('Error processing Apple authentication callback:', error);

    // 9. Redirect to sign-in with error parameter
    return NextResponse.redirect(new URL('/auth/signin?error=authentication_error', request.url));
  }
}