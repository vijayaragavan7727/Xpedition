import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Exclude static files, images, auth callbacks, and signout routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/auth/signout') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // TEMPORARY REVIEW MODE: Directly route / and /arena to /home without requiring login
  if (pathname === '/' || pathname === '/arena' || pathname.startsWith('/arena/')) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // 3. Allow public published passport URLs (e.g. /passport/pub-123)
  if (pathname.startsWith('/passport/') && pathname !== '/passport') {
    return NextResponse.next();
  }

  // 4. Create base response object for cookie mutation
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase keys are missing, allow request to proceed in Local Mode
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  // 5. Instantiate @supabase/ssr server client with getAll and setAll handlers
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // 6. Refresh user session via getUser()
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (err) {
    console.warn('[Middleware Auth Warning] getUser fetch failed:', err);
  }

  // 7. Protected route check (COMMENTED OUT TEMPORARILY FOR REVIEW MODE)
  /*
  const protectedRoutes = ['/home', '/history', '/passport', '/profile', '/quest', '/calibrate'];
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !user) {
    // Check if auth token cookie exists in request before bouncing
    const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
    if (!hasAuthCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('next', pathname);
      const redirectResp = NextResponse.redirect(url);
      response.cookies.getAll().forEach((c) => redirectResp.cookies.set(c.name, c.value));
      return redirectResp;
    }
  }
  */

  // Return mutated response object with updated cookies
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (e.g. .svg, .png, .jpg, .jpeg, .webp, .gif)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
