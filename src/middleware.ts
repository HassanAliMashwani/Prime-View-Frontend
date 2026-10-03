import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Guard /admin routes
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const tokenFromCookie =
      request.cookies.get('pv_admin_token')?.value ||
      request.cookies.get('pv_admin_session')?.value;
    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      const accept = request.headers.get('accept') || '';
      const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
      const isBrowserPageNav =
        accept.includes('text/html') &&
        !userAgent.includes('curl') &&
        !userAgent.includes('postman') &&
        !request.headers.has('x-test-request');

      if (isBrowserPageNav) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      return new NextResponse(
        JSON.stringify({ ok: false, error: 'UNAUTHORIZED', message: 'Missing JWT authentication token.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 2. Guard /society-members portal routes
  if (pathname.startsWith('/society-members') && pathname !== '/society-members/login') {
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const tokenFromCookie =
      request.cookies.get('pv_member_token')?.value ||
      request.cookies.get('pv_member_session')?.value;
    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      const accept = request.headers.get('accept') || '';
      const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
      const isBrowserPageNav =
        accept.includes('text/html') &&
        !userAgent.includes('curl') &&
        !userAgent.includes('postman') &&
        !request.headers.has('x-test-request');

      if (isBrowserPageNav) {
        return NextResponse.redirect(new URL('/society-members/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/society-members/:path*'],
};


