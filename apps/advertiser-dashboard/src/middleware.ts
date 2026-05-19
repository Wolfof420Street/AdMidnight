import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'admidnight_session';
const PROTECTED_PREFIX = '/campaigns';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!pathname.startsWith(PROTECTED_PREFIX)) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(AUTH_COOKIE_NAME);

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    // Include pathname and original query string so users return to the exact URL
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/campaigns/:path*'],
};
