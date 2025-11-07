import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Paths that don't require authentication
const publicPaths = ['/', '/login', '/api/auth', '/api/webhooks'];

// Paths that require authentication
const protectedPaths = ['/onboarding', '/settings'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check if path requires authentication
  const isProtectedPath = protectedPaths.some((path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  );

  if (isProtectedPath) {
    // Check for our custom auth cookie first (temporary solution)
    const customUserId = request.cookies.get('pnl_user_id')?.value;

    if (customUserId) {
      // User is authenticated via custom cookie
      return NextResponse.next();
    }

    // Fallback to NextAuth token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no token, redirect to login
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
