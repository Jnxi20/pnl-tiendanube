import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, createAPIClient } from '@/lib/api/tiendanube';
import { encryptToken } from '@/lib/utils/encryption';
import prisma from '@/lib/db/client';
import { createOrUpdateSettings } from '@/lib/db/queries';

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
    const tokenResponse = await exchangeCodeForToken(code);

    const { access_token, user_id } = tokenResponse;
    const storeId = user_id.toString();

    // Get store information using direct API call (not through the client)
    const storeResponse = await fetch(`https://api.tiendanube.com/v1/${storeId}/store`, {
      headers: {
        'Authentication': `bearer ${access_token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PNL-TiendaNube-App/1.0',
      },
    });

    if (!storeResponse.ok) {
      throw new Error(`Failed to fetch store info: ${storeResponse.status}`);
    }

    const storeInfo = await storeResponse.json();

    // Use the actual store ID from the response
    const actualStoreId = storeInfo.id?.toString() || storeId;

    // Extract store name (handle i18n object format)
    const storeName = typeof storeInfo.name === 'string'
      ? storeInfo.name
      : (storeInfo.name?.es || storeInfo.name?.pt || storeInfo.name?.en || 'Mi Tienda');

    // Encrypt access token for storage
    const encryptedToken = encryptToken(access_token);

    // Create or update user
    const user = await prisma.user.upsert({
      where: { storeId: actualStoreId },
      update: {
        storeName,
        email: storeInfo.email,
        name: storeName,
      },
      create: {
        storeId: actualStoreId,
        storeName,
        email: storeInfo.email,
        name: storeName,
      },
    });

    // Create or update account
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'tiendanube',
          providerAccountId: actualStoreId,
        },
      },
      update: {
        access_token: encryptedToken,
      },
      create: {
        userId: user.id,
        type: 'oauth',
        provider: 'tiendanube',
        providerAccountId: actualStoreId,
        access_token: encryptedToken,
        token_type: 'bearer',
        scope: tokenResponse.scope,
      },
    });

    // Create default settings
    await createOrUpdateSettings(user.id, {
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

      await createOrUpdateSettings(user.id, {
        webhooksRegistered: true,
      });
    } catch (webhookError) {
      console.error('Failed to register webhooks:', webhookError);
      // Continue anyway, webhooks are not critical for initial setup
    }

    // Redirect to onboarding page for initial setup
    const response = NextResponse.redirect(new URL('/onboarding', request.url));

    // Clear OAuth state cookie
    response.cookies.delete('oauth_state');

    // Set a temporary auth cookie with the user ID
    response.cookies.set('pnl_user_id', user.id, {
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

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=authentication_failed', request.url)
    );
  }
}
