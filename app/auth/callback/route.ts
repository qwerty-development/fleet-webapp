import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

// Handle standard OAuth code exchange (for non-Apple providers)
export async function GET(request: NextRequest) {
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
  try {
    // 1. Extract form data from Apple's POST request
    const formData = await request.formData();
    // 2. Extract critical authentication values
    const idToken = formData.get('id_token') as string;
    const code = formData.get('code') as string;
    const state = formData.get('state') as string;

    // 3. Add logic to extract redirect path from state
    let redirectPath = '/home'; // Default fallback
    
    if (state) {
      try {
        // Decode the state parameter
        const decodedState = JSON.parse(atob(state));
        
        // Extract the redirect path if it exists
        if (decodedState && decodedState.redirectPath) {
          redirectPath = decodedState.redirectPath;
          console.log('Found redirect path in state:', redirectPath);
        }
      } catch (stateError) {
        console.error('Error parsing state parameter:', stateError);
        // Continue with default redirect if state parsing fails
      }
    }

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
    
    // 7. CRITICAL FIX: Return HTML with JavaScript redirect
    // Now using the dynamically extracted redirectPath
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authentication Successful</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background-color: #000;
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
            flex-direction: column;
          }
          .loader {
            border: 5px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 5px solid #fff;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <p>Authentication successful. Redirecting...</p>
        <script>
          // Using the dynamically extracted redirectPath instead of hardcoded '/home'
          window.location.href = '${redirectPath}';
        </script>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    // 8. Comprehensive error handling
    console.error('Error processing Apple authentication callback:', error);

    // 9. Redirect to sign-in with error parameter
    return NextResponse.redirect(new URL('/auth/signin?error=authentication_error', request.url));
  }
}