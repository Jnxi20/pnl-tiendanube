import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Checks authentication status
 * GET /api/auth/status
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('pnl_user_id')?.value;
    const storeId = cookieStore.get('pnl_store_id')?.value;

    if (!userId || !storeId) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    // Get store name from the store_name cookie if it exists
    const storeName = request.cookies.get('pnl_store_name')?.value;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: userId,
        storeId,
        storeName: storeName || `Store ${storeId}`,
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
