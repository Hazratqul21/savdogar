import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for authentication and route protection
 * 
 * NOTE: In Next.js 16, middleware is deprecated in favor of route handlers,
 * but it still works and is appropriate for simple auth checks like this.
 */
export function middleware(request: NextRequest) {
  // Token ni cookie dan olish
  const token = request.cookies.get('access_token')?.value;

  // Protected routes
  const protectedRoutes = ['/dashboard', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Agar protected route va token yo'q - login sahifasiga
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Agar login sahifasida va token bor - dashboard ga
  if (request.nextUrl.pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Note: Role-based redirects (seller -> /pos) are handled in page components
  // because we need to fetch user data from API, which requires client-side code

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
};








