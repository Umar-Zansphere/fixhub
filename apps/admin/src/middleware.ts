import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/_next', '/favicon.ico', '/api'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internal paths and static assets
  if (
    publicRoutes.some(route => pathname.startsWith(route)) &&
    pathname !== '/login'
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const isAuthRoute = pathname === '/login';

  const hasToken = !!accessToken || !!refreshToken;

  if (!hasToken && !isAuthRoute) {
    // Unauthenticated user trying to access protected route -> redirect to login
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    return response;
  }

  if (hasToken && isAuthRoute) {
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
