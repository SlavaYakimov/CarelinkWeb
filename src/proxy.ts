import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeNextParam } from '@/server/security/next-param';

function sessionCookieName(): string {
  const prefix = process.env.COOKIE_PREFIX ?? '__Host-';
  return `${prefix}cl_sid`;
}

const PROTECTED_PREFIXES = ['/families', '/invites', '/profile', '/devices', '/notifications'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const { pathname } = request.nextUrl;
  let response: NextResponse;

  if (pathname.startsWith('/dev') && process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }

  if (isProtectedPath(pathname)) {
    const sidCookie = request.cookies.get(sessionCookieName());
    if (!sidCookie?.value) {
      const next = sanitizeNextParam(pathname);
      const login = new URL('/login', request.url);
      login.searchParams.set('next', next);
      response = NextResponse.redirect(login);
    } else {
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  const isDev = process.env.NODE_ENV === 'development';
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'none'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('x-nonce', nonce);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
