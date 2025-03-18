// middleware.ts
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

export async function middleware(request: NextRequest) {
  // Create a response object
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

  // Get URL information
  const { pathname } = request.nextUrl;

  // Check if current route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAdminRoute = ADMIN_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check for auth session
  const { data: { session } } = await supabase.auth.getSession();

  // ===== MODIFIED SECTION: IMPROVED GUEST MODE DETECTION =====
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
  // ===== END MODIFIED SECTION =====

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

  // Handle auth routes - redirect to home if already authenticated
  const isAuthRoute = pathname.startsWith('/auth');
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Continue with the request
  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files, api routes, and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};