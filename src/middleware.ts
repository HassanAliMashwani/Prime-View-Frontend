import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'pv_admin_gate';

export function middleware(request: NextRequest) {
  // Only guard /admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow /admin/login directly so administrators can always access the authentication portal
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Automatically redirect /admin or /admin/ to /admin/login
  if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname === '/admin/') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // In local development or on localhost, allow direct access with no key required
  if (process.env.NODE_ENV !== 'production' || request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1') {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_ACCESS_SECRET;

  // If secret is not configured in production, allow standard authentication flow instead of breaking with 404
  if (!secret) {
    return NextResponse.next();
  }

  // 1. Check for valid HTTP-only gate cookie
  const gateCookie = request.cookies.get(COOKIE_NAME)?.value;
  if (gateCookie === secret) {
    return NextResponse.next();
  }

  // 2. Check for ?key= query parameter matching the secret
  const keyParam = request.nextUrl.searchParams.get('key');
  if (keyParam === secret) {
    // Clone URL and strip ?key= so it is never exposed in browser address bar or history
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete('key');

    const response = NextResponse.redirect(cleanUrl);

    // Set secure HTTP-only cookie valid for 30 days
    response.cookies.set({
      name: COOKIE_NAME,
      value: secret,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  }

  // 3. Unauthorized access: Return 404 so the route appears non-existent to unauthorized visitors
  return new NextResponse(null, { status: 404, statusText: 'Not Found' });
}

export const config = {
  matcher: ['/admin/:path*'],
};
