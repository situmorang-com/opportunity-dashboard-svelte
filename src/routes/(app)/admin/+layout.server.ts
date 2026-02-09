import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Only admin and manager can access admin pages
	if (locals.user.role !== 'admin' && locals.user.role !== 'manager') {
		throw redirect(302, '/dashboard');
	}

	return {
		user: locals.user
	};
};
