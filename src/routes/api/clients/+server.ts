import { json } from '@sveltejs/kit';
import { db, clients } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const formData = await request.formData();

		const name = formData.get('name') as string;
		const industry = formData.get('industry') as string;
		const size = formData.get('size') as 'smb' | 'mid-market' | 'enterprise' | null;
		const region = formData.get('region') as string;
		const website = formData.get('website') as string;
		const primaryContact = formData.get('primaryContact') as string;
		const contactEmail = formData.get('contactEmail') as string;
		const contactPhone = formData.get('contactPhone') as string;
		const address = formData.get('address') as string;
		const notes = formData.get('notes') as string;

		if (!name) {
			return json({ error: 'Name is required' }, { status: 400 });
		}

		const [newClient] = await db
			.insert(clients)
			.values({
				name,
				industry: industry || null,
				size: size || null,
				region: region || null,
				website: website || null,
				primaryContact: primaryContact || null,
				contactEmail: contactEmail || null,
				contactPhone: contactPhone || null,
				address: address || null,
				notes: notes || null,
				createdById: locals.user.id
			})
			.returning();

		return json(newClient, { status: 201 });
	} catch (error) {
		console.error('Error creating client:', error);
		return json({ error: 'Failed to create client' }, { status: 500 });
	}
};
