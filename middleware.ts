import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from "@supabase/ssr";

const PROTECTED_ROUTES = [
  '/profile',
  '/favorites',
  '/home',
  '/dealerships',
  '/autoclips',
];

const ADMIN_ROUTES = [
  '/admin',
];

const DEALER_ROUTES = [
  '/dealer',
];

const PUBLIC_PATHS = [
  '/.well-known/apple-app-site-association',
  '/.well-known/assetlinks.json',
];

export async function middleware(request: NextRequest) {
  // Get URL and method information
  const { pathname } = request.nextUrl;
  const requestMethod = request.method;

  // STEP 1: Handle .well-known paths for deep linking
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/.well-known/')) {
    // Allow direct access to these files without auth checks
    const response = NextResponse.next();

    // Set appropriate content type for JSON files
    if (pathname.endsWith('.json') || pathname === '/.well-known/apple-app-site-association') {
      response.headers.set('Content-Type', 'application/json');
    }

    return response;
  }

  // STEP 2: Handle car and autoclip deep links
  if ((pathname.startsWith('/cars/') && pathname.split('/').length === 3) || 
      (pathname.startsWith('/clips/') && pathname.split('/').length === 3)) {
    // These are detail pages that might be accessed via deep link
    // Allow access without auth for the redirect page
    return NextResponse.next();
  }

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

  // Check authenticated user (avoids unverified session data)
  const { data: { user } } = await supabase.auth.getUser();

  // Special case: Direct redirect from signin page with next parameter if already authenticated
  if (pathname === '/auth/signin' && user) {
    // If there's a 'next' parameter, redirect there
    const nextPath = request.nextUrl.searchParams.get('next') || '/home';
    console.log(`Middleware: Redirecting authenticated user from signin to ${nextPath}`);
    return NextResponse.redirect(new URL(nextPath, request.url));
  }

  // Prevent potential redirect loops on signin when cookies exist but session is not resolved
  // Do NOT redirect based solely on presence of auth cookies; rely on actual session above
  // (Removed cookie-based redirect that could loop between /auth/signin and protected routes)

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
  if (isProtectedRoute && !user && !isGuestMode) {
    // Redirect to sign in page
    const redirectUrl = new URL('/auth/signin', request.url);
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle admin routes
  if (isAdminRoute) {
    if (!user) {
      // If not authenticated at all, redirect to sign in
      const redirectUrl = new URL('/auth/signin', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Fetch user role from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // Verify admin role
    if (error || userData?.role !== 'admin') {
      console.log('User is not authorized to access admin routes:', user.id);
      // Redirect to home page if not admin
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  // Handle dealer routes
  if (isDealerRoute) {
    if (!user) {
      // If not authenticated at all, redirect to sign in
      const redirectUrl = new URL('/auth/signin', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Fetch user role from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // Verify dealer role
    if (error || userData?.role !== 'dealer') {
      console.log('User is not authorized to access dealer routes:', user.id);
      // Redirect to home page if not dealer
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  // Handle auth routes - redirect to home if already authenticated
  // CRITICAL FIX 3: Explicitly exclude the callback URL with more precise check
  const isAuthRoute = pathname.startsWith('/auth');
  if (isAuthRoute && user && pathname !== '/auth/callback') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Continue with the request
  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files, api routes, and _next
    '/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Explicitly match well-known paths and deep link routes
    '/.well-known/:path*',
    '/cars/:id',
    '/clips/:id'  // Add matcher for autoclip deep links
  ],
};