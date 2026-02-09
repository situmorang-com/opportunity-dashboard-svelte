import { redirect } from '@sveltejs/kit';
import { getGoogleProvider } from '$lib/server/auth/google';
import { lucia } from '$lib/server/auth';
import { db, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { decodeIdToken } from 'arctic';
import type { RequestHandler } from './$types';

interface GoogleIdToken {
	sub: string;
	email: string;
	email_verified: boolean;
	name: string;
	picture?: string;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('google_oauth_state');
	const codeVerifier = cookies.get('google_code_verifier');

	if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
		throw redirect(302, '/login?error=invalid_state');
	}

	try {
		const google = getGoogleProvider();
		const tokens = await google.validateAuthorizationCode(code, codeVerifier);
		const idToken = decodeIdToken(tokens.idToken()) as GoogleIdToken;

		const googleId = idToken.sub;
		const email = idToken.email.toLowerCase();
		const name = idToken.name;
		const avatarUrl = idToken.picture;

		// Look up user by email
		const [existingUser] = await db.select().from(users).where(eq(users.email, email));

		if (!existingUser) {
			// User not pre-registered by admin
			throw redirect(302, '/login?error=not_authorized');
		}

		// Update googleId and avatarUrl if not set
		if (!existingUser.googleId || !existingUser.avatarUrl) {
			await db
				.update(users)
				.set({
					googleId: existingUser.googleId || googleId,
					avatarUrl: existingUser.avatarUrl || avatarUrl,
					name: existingUser.name || name,
					updatedAt: new Date()
				})
				.where(eq(users.id, existingUser.id));
		}

		// Create session
		const session = await lucia.createSession(existingUser.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);

		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		// Clean up OAuth cookies
		cookies.delete('google_oauth_state', { path: '/' });
		cookies.delete('google_code_verifier', { path: '/' });

		throw redirect(302, '/dashboard');
	} catch (error) {
		if (error instanceof Response) {
			throw error;
		}
		console.error('Google OAuth error:', error);
		throw redirect(302, '/login?error=oauth_failed');
	}
};
