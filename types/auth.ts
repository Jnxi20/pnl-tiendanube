import { User as PrismaUser, Account as PrismaAccount } from '@prisma/client';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      storeId?: string | null;
      storeName?: string | null;
    };
    accessToken?: string;
  }

  interface User extends PrismaUser {}
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    storeId?: string;
    storeName?: string;
    accessToken?: string;
  }
}

// OAuth State
export interface OAuthState {
  state: string;
  codeVerifier?: string;
  redirectUrl?: string;
  createdAt: number;
}

// Encrypted Token
export interface EncryptedToken {
  iv: string;
  encryptedData: string;
}

// Store Connection Status
export interface StoreConnectionStatus {
  isConnected: boolean;
  storeId?: string;
  storeName?: string;
  lastSyncAt?: Date;
  error?: string;
}

// Auth Error Types
export type AuthErrorType =
  | 'InvalidState'
  | 'TokenExchangeFailed'
  | 'InvalidToken'
  | 'StoreNotFound'
  | 'DatabaseError'
  | 'UnknownError';

export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: any;
}
