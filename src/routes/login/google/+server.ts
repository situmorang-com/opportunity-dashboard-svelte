import { redirect } from '@sveltejs/kit';
import { getGoogleProvider } from '$lib/server/auth/google';
import { generateState, generateCodeVerifier } from 'arctic';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	const google = getGoogleProvider();
	const state = generateState();
	const codeVerifier = generateCodeVerifier();

	const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

	cookies.set('google_oauth_state', state, {
		path: '/',
		secure: !dev,
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: 'lax'
	});

	cookies.set('google_code_verifier', codeVerifier, {
		path: '/',
		secure: !dev,
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: 'lax'
	});

	throw redirect(302, url.toString());
};
