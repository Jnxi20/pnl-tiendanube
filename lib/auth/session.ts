import { cookies } from 'next/headers';
import { decryptToken } from '@/lib/utils/encryption';
import prisma from '@/lib/db/client';

/**
 * Gets the current user ID from cookies
 */
export async function getUserIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('pnl_user_id')?.value;
  return userId || null;
}

/**
 * Gets the current user with decrypted access token
 */
export async function getCurrentUser() {
  const userId = await getUserIdFromCookies();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: true,
      settings: true,
    },
  });

  return user;
}

/**
 * Gets the decrypted access token for the current user
 */
export async function getAccessToken(): Promise<string | null> {
  const userId = await getUserIdFromCookies();

  if (!userId) {
    return null;
  }

  // Get account from database
  const account = await prisma.account.findFirst({
    where: {
      userId: userId,
      provider: 'tiendanube',
    },
  });

  if (!account?.access_token) {
    return null;
  }

  try {
    // Decrypt token
    return decryptToken(account.access_token);
  } catch (error) {
    console.error('Failed to decrypt access token:', error);
    return null;
  }
}

/**
 * Checks if user is authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Gets store ID for current user
 */
export async function getStoreId(): Promise<string | null> {
  const cookieStore = await cookies();
  const storeId = cookieStore.get('pnl_store_id')?.value;
  return storeId || null;
}
