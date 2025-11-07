import { NextRequest, NextResponse } from 'next/server';

/**
 * Handles logout/disconnect from Tienda Nube
 * POST /api/auth/logout
 */
export async function POST(request: NextRequest) {
  try {
    // Create response with redirect to home
    const response = NextResponse.json({ success: true });

    // Clear all authentication cookies
    response.cookies.delete('pnl_user_id');
    response.cookies.delete('pnl_store_id');
    response.cookies.delete('pnl_store_name');
    response.cookies.delete('oauth_state');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
