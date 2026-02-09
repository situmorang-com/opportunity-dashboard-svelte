import { Google } from 'arctic';
import { env } from '$env/dynamic/private';

export function getGoogleProvider() {
	const clientId = env.GOOGLE_CLIENT_ID;
	const clientSecret = env.GOOGLE_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables');
	}

	// Use ORIGIN from environment, fallback to localhost for development
	const baseUrl = env.ORIGIN || 'http://localhost:5173';
	console.log('OAuth baseUrl:', baseUrl, 'ORIGIN env:', env.ORIGIN);

	return new Google(
		clientId,
		clientSecret,
		`${baseUrl}/login/google/callback`
	);
}
