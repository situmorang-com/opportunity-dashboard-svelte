# Authentication Guide

This document explains the authentication system used in the Sales Opportunity Dashboard, including Google OAuth setup, session management, and role-based access control.

## Overview

The application uses a **pre-registered user model** with **Google OAuth** for authentication:

1. **Admin creates users** via the `/admin/users` page
2. **Users can only login** if their email exists in the database
3. **Google OAuth** links the Google account on first login

This approach provides:
- Controlled access (only invited users can login)
- Seamless SSO experience
- No password management required

## Tech Stack

| Component | Technology |
|-----------|------------|
| Session Management | [Lucia Auth v3](https://lucia-auth.com/) |
| OAuth Provider | [Arctic](https://arctic.js.org/) (Google) |
| Database Adapter | `@lucia-auth/adapter-drizzle` |
| Session Storage | SQLite `sessions` table |

## Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │     │  SvelteKit  │     │   Google    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  1. Click Login   │                   │
       │──────────────────>│                   │
       │                   │                   │
       │  2. Redirect to   │  3. Auth Request  │
       │     Google        │──────────────────>│
       │<──────────────────│                   │
       │                   │                   │
       │  4. User Consents │                   │
       │──────────────────────────────────────>│
       │                   │                   │
       │  5. Callback with │                   │
       │     Auth Code     │<──────────────────│
       │──────────────────>│                   │
       │                   │                   │
       │                   │  6. Exchange Code │
       │                   │     for Tokens    │
       │                   │──────────────────>│
       │                   │<──────────────────│
       │                   │                   │
       │                   │  7. Validate User │
       │                   │     (email check) │
       │                   │                   │
       │  8. Set Session   │                   │
       │     Cookie        │                   │
       │<──────────────────│                   │
       │                   │                   │
       │  9. Redirect to   │                   │
       │     /dashboard    │                   │
       │<──────────────────│                   │
```

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** > **Credentials**

### 2. Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Select **External** user type (or Internal for Google Workspace)
3. Fill in the required fields:
   - **App name**: Sales Opportunity Dashboard
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (for development)

### 3. Create OAuth 2.0 Credentials

1. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
2. Select **Web application**
3. Configure:
   - **Name**: Sales Dashboard (Web)
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:5173/login/google/callback` (development)
     - `https://yourdomain.com/login/google/callback` (production)
4. Save the **Client ID** and **Client Secret**

### 4. Set Environment Variables

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
ORIGIN=http://localhost:5173
```

## Code Structure

### Lucia Setup (`src/lib/server/auth/index.ts`)

```typescript
import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { db, sessions, users } from '../db';
import { dev } from '$app/environment';

const adapter = new DrizzleSQLiteAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: !dev  // HTTPS only in production
    }
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      name: attributes.name,
      role: attributes.role,
      avatarUrl: attributes.avatarUrl
    };
  }
});
```

### Google Provider (`src/lib/server/auth/google.ts`)

```typescript
import { Google } from 'arctic';
import { env } from '$env/dynamic/private';

export function getGoogleProvider() {
  return new Google(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/login/google/callback`
  );
}
```

### Session Validation (`src/hooks.server.ts`)

The hooks file validates sessions on every request:

```typescript
export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get(lucia.sessionCookieName);

  if (!sessionId) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

  const { session, user } = await lucia.validateSession(sessionId);

  // Refresh session if needed
  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    });
  }

  // Clear invalid session
  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    });
  }

  event.locals.user = user;
  event.locals.session = session;

  return resolve(event);
};
```

## OAuth Endpoints

### `/login/google` - Initiate Login

Generates OAuth state and code verifier, then redirects to Google.

```typescript
export const GET: RequestHandler = async ({ cookies }) => {
  const google = getGoogleProvider();
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = google.createAuthorizationURL(state, codeVerifier, [
    'openid', 'profile', 'email'
  ]);

  // Store state for CSRF protection
  cookies.set('google_oauth_state', state, { ... });
  cookies.set('google_code_verifier', codeVerifier, { ... });

  throw redirect(302, url.toString());
};
```

### `/login/google/callback` - Handle Callback

Validates the OAuth response and creates a session:

```typescript
export const GET: RequestHandler = async ({ url, cookies }) => {
  // Validate state
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('google_oauth_state');

  if (state !== storedState) {
    throw redirect(302, '/login?error=invalid_state');
  }

  // Exchange code for tokens
  const tokens = await google.validateAuthorizationCode(code, codeVerifier);
  const idToken = decodeIdToken(tokens.idToken());

  // Check if user is pre-registered
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, idToken.email.toLowerCase()));

  if (!existingUser) {
    throw redirect(302, '/login?error=not_authorized');
  }

  // Link Google account on first login
  if (!existingUser.googleId) {
    await db.update(users).set({
      googleId: idToken.sub,
      avatarUrl: idToken.picture,
      name: idToken.name
    }).where(eq(users.id, existingUser.id));
  }

  // Create session
  const session = await lucia.createSession(existingUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies.set(sessionCookie.name, sessionCookie.value, { ... });

  throw redirect(302, '/dashboard');
};
```

## Protected Routes

### Route Groups

The application uses SvelteKit route groups:

```
src/routes/
├── (app)/              # Protected routes (require auth)
│   ├── +layout.server.ts  # Auth check
│   ├── dashboard/
│   ├── pipeline/
│   └── ...
├── (auth)/login/       # Public login page
└── login/google/       # OAuth endpoints
```

### Layout Guard (`src/routes/(app)/+layout.server.ts`)

```typescript
export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  return {
    user: locals.user
  };
};
```

## Role-Based Access Control (RBAC)

### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `admin` | System administrator | Full access, user management, stage management |
| `manager` | Sales manager | View all opportunities, manage team |
| `rep` | Sales representative | Manage own opportunities only |

### Role Checks in API Routes

```typescript
// Admin only
export const POST: RequestHandler = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return json({ error: 'Only admins can perform this action' }, { status: 401 });
  }
  // ...
};

// Admin or Manager
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'manager')) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
};
```

### UI Role Checks

```svelte
<script lang="ts">
  let { user } = $props();
</script>

{#if user.role === 'admin'}
  <a href="/admin/users">User Management</a>
  <a href="/admin/stages">Stage Management</a>
{/if}

{#if user.role === 'admin' || user.role === 'manager'}
  <a href="/reports">Reports</a>
{/if}
```

## Pre-Registered User Model

### Why Pre-Registration?

1. **Security**: Only invited users can access the system
2. **Role Assignment**: Admins assign roles before first login
3. **Organization Control**: Prevents unauthorized signups

### How It Works

1. **Admin creates user** via `/admin/users`:
   ```json
   {
     "name": "John Doe",
     "email": "john@company.com",
     "role": "rep"
   }
   ```

2. **User record created** with:
   - Generated UUID
   - Email (lowercase)
   - Name
   - Role
   - No `googleId` or `avatarUrl` yet

3. **User logs in with Google**:
   - System looks up user by email
   - If found, links Google account
   - If not found, shows "Not Authorized" error

4. **Subsequent logins**:
   - Google account already linked
   - Seamless SSO experience

## Session Management

### Session Table Schema

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
```

### Session Lifecycle

1. **Creation**: On successful OAuth callback
2. **Validation**: On every request via `hooks.server.ts`
3. **Refresh**: Automatically extended when "fresh"
4. **Invalidation**: On logout or expiration

### Logout

```typescript
// src/routes/logout/+server.ts
export const POST: RequestHandler = async ({ locals, cookies }) => {
  if (locals.session) {
    await lucia.invalidateSession(locals.session.id);
  }

  const sessionCookie = lucia.createBlankSessionCookie();
  cookies.set(sessionCookie.name, sessionCookie.value, {
    path: '.',
    ...sessionCookie.attributes
  });

  throw redirect(302, '/login');
};
```

## Error Handling

### Login Errors

| Error Code | Description |
|------------|-------------|
| `invalid_state` | CSRF validation failed |
| `not_authorized` | Email not pre-registered |
| `oauth_failed` | Google OAuth error |

### Login Page Error Display

```svelte
<script lang="ts">
  let { error } = $page.url.searchParams;
</script>

{#if error === 'not_authorized'}
  <p class="text-red-500">
    Your email is not authorized. Contact an administrator.
  </p>
{:else if error === 'invalid_state'}
  <p class="text-red-500">
    Authentication failed. Please try again.
  </p>
{/if}
```

## Security Considerations

### CSRF Protection

- OAuth state parameter validates request origin
- Code verifier prevents authorization code interception (PKCE)

### Cookie Security

```typescript
{
  path: '/',
  secure: !dev,        // HTTPS only in production
  httpOnly: true,      // No JavaScript access
  maxAge: 60 * 10,     // 10 minutes for OAuth cookies
  sameSite: 'lax'      // CSRF protection
}
```

### Session Security

- Sessions stored server-side (not in JWT)
- Session ID is random, unpredictable
- Automatic session refresh prevents fixation
- Sessions cascade delete when user is deleted

## Troubleshooting

### "Not Authorized" Error

**Cause**: User's email is not in the database.

**Solution**: Admin must create the user via `/admin/users` first.

### "Invalid State" Error

**Cause**: OAuth state mismatch (CSRF protection triggered).

**Solution**: Clear cookies and try again. Check that redirect URIs match exactly.

### OAuth Callback Fails

**Cause**: Missing or incorrect credentials.

**Checklist**:
1. `GOOGLE_CLIENT_ID` is set
2. `GOOGLE_CLIENT_SECRET` is set
3. Redirect URI matches exactly in Google Console
4. OAuth consent screen is configured

### Session Not Persisting

**Cause**: Cookie not being set properly.

**Checklist**:
1. Check `ORIGIN` environment variable
2. Verify `secure` cookie attribute matches HTTPS usage
3. Check browser cookie settings
