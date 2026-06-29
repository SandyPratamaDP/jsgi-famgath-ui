import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't need auth
  if (pathname === '/login' || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;
  const role  = request.cookies.get('user_role')?.value;

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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
