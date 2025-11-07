import type { NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/db/client';
import { encryptToken } from '@/lib/utils/encryption';

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    {
      id: 'tiendanube',
      name: 'Tienda Nube',
      type: 'oauth',

      authorization: {
        url: 'https://www.tiendanube.com/apps/authorize/token',
        params: {
          scope: 'read_orders read_products write_products',
        },
      },

      token: {
        url: 'https://www.tiendanube.com/apps/authorize/token',
      },

      userinfo: {
        url: 'https://api.tiendanube.com/v1/store',
      },

      clientId: process.env.TIENDANUBE_CLIENT_ID,
      clientSecret: process.env.TIENDANUBE_CLIENT_SECRET,

      profile(profile: any) {
        return {
          id: profile.id?.toString() || profile.user_id?.toString(),
          email: profile.email ?? null,
          name: profile.name ?? null,
          image: null,
        } as any;
      },
    },
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async jwt(params: any) {
      const { token, account, profile } = params;

      // Initial sign in
      if (account && profile) {
        token.userId = profile.id || account.providerAccountId;
        token.storeId = account.providerAccountId;

        // Encrypt and store access token
        if (account.access_token) {
          const encryptedToken = encryptToken(account.access_token);
          token.accessToken = encryptedToken;

          // Store encrypted token in database
          try {
            await prisma.account.update({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
              data: {
                access_token: encryptedToken,
              },
            });
          } catch (error) {
            console.error('Failed to store encrypted token:', error);
          }
        }

        // Get store name from profile
        if (profile && typeof profile === 'object' && 'name' in profile) {
          token.storeName = profile.name as string;
        }
      }

      return token;
    },

    async session(params: any) {
      const { session, token } = params;

      if (session.user) {
        session.user.id = token.userId as string;
        session.user.storeId = token.storeId as string;
        session.user.storeName = token.storeName as string;
      }

      // Pass encrypted access token to session (will decrypt in API routes)
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }

      return session;
    },
  },

  events: {
    async signIn(params: any) {
      const { user, account, profile } = params;
      console.log('User signed in:', user.email);

      // Update user with store information
      if (account && user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              storeId: account.providerAccountId,
              storeName: (profile as any)?.name || null,
            },
          });

          // Create default settings
          await prisma.settings.upsert({
            where: { userId: user.id },
            update: {},
            create: {
              userId: user.id,
              tiendaNubeFeePercentage: 3.0,
              defaultAdvertisingCost: 0,
              syncEnabled: true,
            },
          });
        } catch (error) {
          console.error('Failed to update user:', error);
        }
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
