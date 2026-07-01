import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('auth_token')?.value;
  const role  = request.cookies.get('user_role')?.value;

  // Already logged in → redirect away from login page
  if (pathname === '/login' && token) {
    const dest = request.nextUrl.clone();
    dest.pathname = role === 'eo' ? '/gate-scanner' : '/';
    return NextResponse.redirect(dest);
  }

  // Public paths that don't need auth
  if (pathname === '/login' || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Not authenticated → login
  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // EO can only access gate-scanner
  if (role === 'eo' && !pathname.startsWith('/gate-scanner')) {
    const scannerUrl = request.nextUrl.clone();
    scannerUrl.pathname = '/gate-scanner';
    return NextResponse.redirect(scannerUrl);
  }

  return NextResponse.next();
}

export const config = {
  // '/' is needed separately: with basePath set, Next.js prepends it to these
  // patterns, and '/((?!...).*)' alone never matches the bare basePath root.
  matcher: ['/', '/((?!api|_next/static|_next/image|favicon.ico|images/).*)'],
};
