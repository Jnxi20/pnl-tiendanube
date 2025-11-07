import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, createAPIClient } from '@/lib/api/tiendanube';
import { encryptToken } from '@/lib/utils/encryption';
import { getDB } from '@/lib/db/sqlite-fallback';

/**
 * Handles OAuth callback from Tienda Nube
 * GET /api/auth/callback?code=xxx&state=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Check for OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error)}`,
        request.url
      )
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/login?error=missing_parameters', request.url)
    );
  }

  // Verify state (CSRF protection)
  const storedState = request.cookies.get('oauth_state')?.value;
  if (!storedState || storedState !== state) {
    console.error('State mismatch:', { stored: storedState, received: state });
    return NextResponse.redirect(
      new URL('/login?error=invalid_state', request.url)
    );
  }

  try {
    // Exchange authorization code for access token
    console.log('[OAuth Callback] Exchanging code for token...');
    const tokenResponse = await exchangeCodeForToken(code);
    console.log('[OAuth Callback] Token exchange successful');

    const { access_token, user_id } = tokenResponse;
    const storeId = user_id.toString();
    console.log('[OAuth Callback] Store ID:', storeId);

    // Get store information using direct API call (not through the client)
    console.log('[OAuth Callback] Fetching store information...');
    const storeResponse = await fetch(`https://api.tiendanube.com/v1/${storeId}/store`, {
      headers: {
        'Authentication': `bearer ${access_token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PNL-TiendaNube-App/1.0',
      },
    });

    if (!storeResponse.ok) {
      const errorText = await storeResponse.text();
      console.error('[OAuth Callback] Store info fetch failed:', storeResponse.status, errorText);
      throw new Error(`Failed to fetch store info: ${storeResponse.status} - ${errorText}`);
    }

    const storeInfo = await storeResponse.json();
    console.log('[OAuth Callback] Store info retrieved:', storeInfo.name);

    // Use the actual store ID from the response
    const actualStoreId = storeInfo.id?.toString() || storeId;

    // Extract store name (handle i18n object format)
    const storeName = typeof storeInfo.name === 'string'
      ? storeInfo.name
      : (storeInfo.name?.es || storeInfo.name?.pt || storeInfo.name?.en || 'Mi Tienda');

    // Encrypt access token for storage
    const encryptedToken = encryptToken(access_token);

    // Create or update user using SQLite fallback
    console.log('[OAuth Callback] Creating/updating user in database...');
    const db = getDB();
    const userId = await db.createOrUpdateUser({
      storeId: actualStoreId,
      storeName,
      email: storeInfo.email,
      name: storeName,
    });
    console.log('[OAuth Callback] User created/updated:', userId);

    // Create or update account
    await db.createOrUpdateAccount({
      userId,
      provider: 'tiendanube',
      providerAccountId: actualStoreId,
      accessToken: encryptedToken,
      tokenType: 'bearer',
      scope: tokenResponse.scope,
    });

    // Create default settings
    await db.createOrUpdateSettings(userId, {
      tiendaNubeFeePercentage: 3.0,
      defaultAdvertisingCost: 0,
      syncEnabled: true,
    });

    // Register webhooks
    try {
      const apiClient = createAPIClient(actualStoreId, access_token);
      const webhooks = await apiClient.getWebhooks();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      const webhookEvents = ['order/paid', 'order/updated', 'order/cancelled'];
      const existingEvents = webhooks.map((w) => w.event);

      for (const event of webhookEvents) {
        if (!existingEvents.includes(event)) {
          await apiClient.createWebhook(
            event,
            `${appUrl}/api/webhooks/orders`
          );
        }
      }

      await db.createOrUpdateSettings(userId, {
        webhooksRegistered: true,
      });
    } catch (webhookError) {
      console.error('Failed to register webhooks:', webhookError);
      // Continue anyway, webhooks are not critical for initial setup
    }

    // Redirect to onboarding page for initial setup
    console.log('[OAuth Callback] OAuth flow complete, redirecting to onboarding');
    const response = NextResponse.redirect(new URL('/onboarding', request.url));

    // Clear OAuth state cookie
    response.cookies.delete('oauth_state');

    // Set a temporary auth cookie with the user ID
    response.cookies.set('pnl_user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    response.cookies.set('pnl_store_id', actualStoreId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    response.cookies.set('pnl_store_name', storeName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    console.log('[OAuth Callback] Cookies set successfully');
    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=authentication_failed', request.url)
    );
  }
}
