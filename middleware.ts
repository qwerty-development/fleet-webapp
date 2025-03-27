import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from "@supabase/ssr";

const PROTECTED_ROUTES = [
  '/profile',
  '/favorites',
  '/home',
  '/dealerships',
  '/cars',
  '/autoclips',
];

const ADMIN_ROUTES = [
  '/admin',
];

const DEALER_ROUTES = [
  '/dealer',
];

export async function middleware(request: NextRequest) {
  // Get URL and method information
  const { pathname } = request.nextUrl;
  const requestMethod = request.method;

  // CRITICAL FIX 1: Enhanced handling for Apple callback route
  if (pathname === '/auth/callback') {
    // Always add CORS headers for the callback route
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { headers: corsHeaders, status: 200 });
    }

    // Handle POST requests from Apple Auth - skip remaining middleware
    if (request.method === 'POST') {
      console.log('Middleware: Allowing POST to /auth/callback');

      // Add CORS headers but otherwise let the route handler process it
      const response = NextResponse.next();
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    // For GET requests to callback, add CORS headers
    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // Create a response object for other routes
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase client directly
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check for auth session
  const { data: { session } } = await supabase.auth.getSession();

  // Special case: Direct redirect from signin page with next parameter if already authenticated
  if (pathname === '/auth/signin' && session) {
    // If there's a 'next' parameter, redirect there
    const nextPath = request.nextUrl.searchParams.get('next') || '/home';
    console.log(`Middleware: Redirecting authenticated user from signin to ${nextPath}`);
    return NextResponse.redirect(new URL(nextPath, request.url));
  }

  // CRITICAL FIX 2: Handle the edge case where user lands on signin page with auth cookies
  // This specifically addresses the Apple Auth 405 issue
  if (pathname === '/auth/signin' && request.nextUrl.searchParams.has('next')) {
    // Check for auth cookies directly from the request
    const hasSbCookie = request.cookies.getAll().some(cookie =>
      cookie.name.startsWith('sb-') || cookie.name.includes('supabase')
    );

    if (hasSbCookie) {
      console.log('Middleware: Detected auth cookies on signin page, redirecting to destination');
      const destination = request.nextUrl.searchParams.get('next') || '/home';
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  // Check for guest mode in various ways (cookie or header)
  let isGuestMode = false;

  // Check cookie
  const guestModeCookie = request.cookies.get('isGuestUser');
  if (guestModeCookie?.value === 'true') {
    isGuestMode = true;
  }

  // Check custom header (will be added by client-side code)
  const guestModeHeader = request.headers.get('x-guest-mode');
  if (guestModeHeader === 'true') {
    isGuestMode = true;
  }

  // Check URL parameter (temporary solution)
  const url = new URL(request.url);
  if (url.searchParams.get('guest') === 'true') {
    isGuestMode = true;

    // Remove the parameter and redirect to clean URL
    if (pathname !== '/auth/signin') { // Avoid redirect loop on signin page
      url.searchParams.delete('guest');
      return NextResponse.redirect(url);
    }
  }

  // Check if current route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAdminRoute = ADMIN_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isDealerRoute = DEALER_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Handle protected routes
  if (isProtectedRoute && !session && !isGuestMode) {
    // Redirect to sign in page
    const redirectUrl = new URL('/auth/signin', request.url);
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle admin routes
  if (isAdminRoute) {
    if (!session) {
      // If not authenticated at all, redirect to sign in
      const redirectUrl = new URL('/auth/signin', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Fetch user role from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Verify admin role
    if (error || userData?.role !== 'admin') {
      console.log('User is not authorized to access admin routes:', session.user.id);
      // Redirect to home page if not admin
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  // Handle dealer routes
  if (isDealerRoute) {
    if (!session) {
      // If not authenticated at all, redirect to sign in
      const redirectUrl = new URL('/auth/signin', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Fetch user role from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Verify dealer role
    if (error || userData?.role !== 'dealer') {
      console.log('User is not authorized to access dealer routes:', session.user.id);
      // Redirect to home page if not dealer
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  // Handle auth routes - redirect to home if already authenticated
  // CRITICAL FIX 3: Explicitly exclude the callback URL with more precise check
  const isAuthRoute = pathname.startsWith('/auth');
  if (isAuthRoute && session && pathname !== '/auth/callback') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Continue with the request
  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files, api routes, and _next
    '/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};