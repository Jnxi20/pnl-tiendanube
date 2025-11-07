import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

/**
 * Checks authentication status
 * GET /api/auth/status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.storeId) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        storeId: user.storeId,
        storeName: user.storeName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({
      authenticated: false,
      user: null,
      error: 'Status check failed',
    });
  }
}
