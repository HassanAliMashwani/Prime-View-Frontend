import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Client guards (AuthGuard, AdminPortalLayout) handle authentication and redirects.
  // The server-side token checks via cookies are no longer applicable 
  // since the token is now stored in sessionStorage/localStorage.
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/society-members/:path*'],
};


