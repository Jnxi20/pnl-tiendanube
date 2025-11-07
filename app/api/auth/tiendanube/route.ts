import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/api/tiendanube';
import { generateState } from '@/lib/utils/encryption';

/**
 * Initiates OAuth flow with Tienda Nube
 * GET /api/auth/tiendanube
 */
export async function GET(request: NextRequest) {
  try {
    // Generate random state for CSRF protection
    const state = generateState();

    // Store state in cookie for verification in callback
    const response = NextResponse.redirect(getAuthorizationUrl(state));

    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.redirect(
      new URL('/login?error=oauth_init_failed', request.url)
    );
  }
}
