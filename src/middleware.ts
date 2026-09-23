import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow /admin/login directly so administrators can always access the authentication portal
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Check for JWT token in Authorization header or session cookies
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

