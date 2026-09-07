import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  // Allow all /admin routes through - client-side AdminPortalLayout verifies active session
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
