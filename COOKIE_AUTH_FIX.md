# Cookie-Based Authentication Fix

## Problem Identified

The disconnect button and OAuth improvements were not visible in the browser because the authentication status API was failing with a **500 error**.

**Root Cause:** The `/api/auth/status` endpoint was trying to import Prisma Client, but Prisma couldn't initialize in the offline environment:
```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
```

Attempting to run `prisma generate` failed because the environment couldn't download Prisma's binary engines (403 Forbidden).

## Solution Implemented

Rewrote the authentication system to use **cookie-based state** instead of database queries. This eliminates the Prisma dependency for authentication checks.

### Changes Made

#### 1. `/app/api/auth/status/route.ts` - Complete Rewrite
**Before:** Tried to query database with Prisma (failed)
**After:** Reads authentication state directly from cookies

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
```

#### 2. `/app/api/auth/logout/route.ts` - Updated Cookie List
Added deletion of `pnl_store_name` cookie to ensure complete logout:

```typescript
response.cookies.delete('pnl_user_id');
response.cookies.delete('pnl_store_id');
response.cookies.delete('pnl_store_name'); // ADDED
response.cookies.delete('oauth_state');
```

#### 3. `/app/api/auth/callback/route.ts` - Added Store Name Cookie
Modified OAuth callback to set the store name in a cookie so the status endpoint can read it:

```typescript
response.cookies.set('pnl_store_name', storeName, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
});
```

## Authentication Flow (Cookie-Based)

### After OAuth Success:
1. `/api/auth/callback` receives the OAuth code
2. Exchanges code for access token
3. Fetches store information from Tienda Nube API
4. Saves data to database (still uses Prisma here)
5. **Sets authentication cookies:**
   - `pnl_user_id` - User ID from database
   - `pnl_store_id` - Tienda Nube store ID
   - `pnl_store_name` - Store name for display
6. Redirects to onboarding

### Dashboard Load:
1. Frontend calls `/api/auth/status`
2. Status endpoint **reads cookies** (no Prisma needed)
3. Returns authentication state and user info
4. Dashboard shows:
   - "Conectado: [Store Name]" with green indicator
   - "Desconectar Tienda" button

### Logout:
1. User clicks "Desconectar Tienda"
2. Frontend calls `/api/auth/logout` (POST)
3. Logout endpoint **deletes all auth cookies**
4. Dashboard updates to show "Conectar Tienda Nube" button

## Testing Results

### Before Fix:
```bash
$ curl http://localhost:3000/api/auth/status
Error 500: @prisma/client did not initialize yet
```

### After Fix:
```bash
$ curl http://localhost:3000/api/auth/status
{"authenticated":false,"user":null}

# Server logs:
GET /api/auth/status 200 in 459ms
```

## Important Notes

1. **Prisma Still Used:** The OAuth callback, orders sync, and other endpoints still use Prisma for database operations. Only the authentication **status check** was changed to use cookies.

2. **CRITICAL - Offline Environment Limitation:**
   - Prisma client **CANNOT** be generated in this offline environment (403 Forbidden when downloading binaries)
   - This means **OAuth will NOT work** because the callback requires Prisma to save user data
   - The `/api/auth/callback` endpoint will fail with `authentication_failed` error
   - To use OAuth, you need an environment with internet access to download Prisma binaries

3. **Security:** Cookies are HTTP-only, secure in production, and have a 30-day expiration.

4. **Session Persistence:** User stays logged in across page refreshes as long as cookies are valid.

## What Works ✅

1. **Dashboard loads correctly** - No more infinite redirect to /login
2. **Mock data displays** - Can see example PNL calculations
3. **UI is responsive** - All buttons and components render
4. **Auth status endpoint works** - Returns proper JSON (200 OK)
5. **Login error page** - Shows OAuth errors gracefully

## What Doesn't Work ❌ (Offline Environment Only)

1. **OAuth Connection** - Fails because Prisma can't initialize
2. **Real data sync** - Requires database which needs Prisma
3. **User persistence** - Can't save users without database

## Testing the Fixes

### Test 1: Homepage Loads
```bash
curl -s http://localhost:3000 | grep "Conectar Tienda Nube"
# Should return: <button class="btn-primary">Conectar Tienda Nube</button>
```

### Test 2: Auth Status Works
```bash
curl -s http://localhost:3000/api/auth/status
# Should return: {"authenticated":false,"user":null}
```

### Test 3: Dashboard in Browser
1. Open http://localhost:3000
2. Should see dashboard with mock data
3. Should see "Conectar Tienda Nube" button in header
4. No errors in browser console

## To Make OAuth Work

You need an environment where Prisma can download binaries:

1. **Production deployment** (Vercel, Railway, etc.) - Has internet access
2. **Local development with internet** - Can run `npx prisma generate`
3. **Docker container with pre-built Prisma** - Binaries included in image

Current offline development environment can only show the **UI and mock data**.
