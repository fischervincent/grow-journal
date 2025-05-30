import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from "better-auth/cookies";

const GUEST_ONLY_PATHS = ['/signin', '/signup'];
const USER_ONLY_PATHS = ['/plants', '/account'];

export function middleware(request: NextRequest) {
  // Get the session cookie to determine if the user might be logged in
  // It's for UX only, because it's fast, but every api routes should fully be protected
	const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const shouldBeLoggedIn = !!sessionCookie;

  const isForGuestOnly = GUEST_ONLY_PATHS.includes(pathname);
  const isForUserOnly = USER_ONLY_PATHS.includes(pathname);

  if (shouldBeLoggedIn && !isForUserOnly) {
    return NextResponse.redirect(new URL('/plants', request.url));
  }

  if (!shouldBeLoggedIn && !isForGuestOnly) {
    const callbackURL = encodeURIComponent(request.nextUrl.pathname);
    const urlParams = callbackURL ? `?callbackURL=${callbackURL}` : '';
    return NextResponse.redirect(new URL(`/${urlParams}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/signin',
    '/signup',
    '/plants',
    '/plants/:path*',
    '/account',
  ],
};
