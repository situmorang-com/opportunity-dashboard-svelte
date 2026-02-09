import { json } from '@sveltejs/kit';
import { db, clients } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const clientId = Number(params.id);
	if (!Number.isFinite(clientId)) {
		return json({ error: 'Invalid client id' }, { status: 400 });
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

		const [updatedClient] = await db
			.update(clients)
			.set({
				name,
				industry: industry || null,
				size: size || null,
				region: region || null,
				website: website || null,
				primaryContact: primaryContact || null,
				contactEmail: contactEmail || null,
				contactPhone: contactPhone || null,
				address: address || null,
				notes: notes || null
			})
			.where(eq(clients.id, clientId))
			.returning();

		if (!updatedClient) {
			return json({ error: 'Client not found' }, { status: 404 });
		}

		return json(updatedClient);
	} catch (error) {
		console.error('Error updating client:', error);
		return json({ error: 'Failed to update client' }, { status: 500 });
	}
};
