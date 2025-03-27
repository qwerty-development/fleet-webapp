import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Parse form data from Apple response
    const formData = await request.formData();

    // Extract critical values
    const idToken = formData.get('id_token') as string;
    const state = formData.get('state') as string;
    const code = formData.get('code') as string;

    if (!idToken) {
      throw new Error('No ID token received from Apple');
    }

    // Get cookies for authentication
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Use the token to sign in with Supabase
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: idToken,
    });

    if (error) {
      console.error('Error signing in with Apple ID token:', error);
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent('Authentication failed')}`, request.url)
      );
    }

    // Successful authentication
    return NextResponse.redirect(new URL('/home', request.url));
  } catch (error) {
    console.error('Apple callback error:', error);
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent('Authentication process failed')}`, request.url)
    );
  }
}