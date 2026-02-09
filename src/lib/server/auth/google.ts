import { Google } from 'arctic';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

const baseUrl = dev ? 'http://localhost:5173' : (env.ORIGIN || 'http://localhost:5173');

export function getGoogleProvider() {
	const clientId = env.GOOGLE_CLIENT_ID;
	const clientSecret = env.GOOGLE_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables');
	}

	return new Google(
		clientId,
		clientSecret,
		`${baseUrl}/login/google/callback`
	);
}
