import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/_next', '/favicon.ico', '/api'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internal paths and static assets
  if (
    publicRoutes.some(route => pathname.startsWith(route)) &&
    pathname !== '/login'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('accessToken')?.value;
  const isAuthRoute = pathname === '/login';

  if (!token && !isAuthRoute) {
    // Unauthenticated user trying to access protected route -> redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isAuthRoute) {
    // Authenticated user trying to access login -> redirect to dashboard
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
