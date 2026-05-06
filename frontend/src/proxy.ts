import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];
const USER_PATHS = ['/dashboard', '/history', '/deposit', '/order', '/profile', '/notifications'];

function decodeJwtPayload(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

    if (typeof atob === 'function') {
      return JSON.parse(atob(padded)) as {
        role?: 'USER' | 'ADMIN';
        pinVerified?: boolean;
      };
    }

    return null;
  } catch {
    return null;
  }
}

function readSession(request: NextRequest) {
  const token = request.cookies.get('kiospay_at')?.value;

  if (!token) {
    return { authenticated: false, role: null as 'USER' | 'ADMIN' | null, pinVerified: false };
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return { authenticated: false, role: null as 'USER' | 'ADMIN' | null, pinVerified: false };
  }

  return {
    authenticated: true,
    role: payload.role ?? null,
    pinVerified: Boolean(payload.pinVerified),
  };
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/public') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const session = readSession(request);

  if (PUBLIC_PATHS.includes(pathname) || pathname === '/') {
    if (session.authenticated) {
      if (session.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }

      if (!session.pinVerified) {
        return NextResponse.redirect(new URL('/setup-pin?mode=verify', request.url));
      }

      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  }

  if (!session.authenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/admin')) {
    if (session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith('/setup-pin')) {
    return NextResponse.next();
  }

  if (!session.pinVerified && USER_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/setup-pin?mode=verify', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};