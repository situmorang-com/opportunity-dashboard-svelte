import { json } from '@sveltejs/kit';
import { db, opportunityDocuments } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  const opportunityId = parseInt(params.id);
  if (isNaN(opportunityId)) return json({ error: 'Invalid ID' }, { status: 400 });
  const docs = await db.select().from(opportunityDocuments)
    .where(eq(opportunityDocuments.opportunityId, opportunityId))
    .orderBy(opportunityDocuments.createdAt);
  return json(docs);
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  const opportunityId = parseInt(params.id);
  if (isNaN(opportunityId)) return json({ error: 'Invalid ID' }, { status: 400 });
  const { title, url, documentType, notes } = await request.json();
  if (!title || !url) return json({ error: 'Title and URL required' }, { status: 400 });
  const [doc] = await db.insert(opportunityDocuments).values({
    opportunityId, title, url, documentType: documentType || 'Other', notes: notes || null,
    addedBy: locals.user.id,
  }).returning();
  return json(doc, { status: 201 });
};

export const DELETE: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
  const opportunityId = parseInt(params.id);
  const { id } = await request.json();
  await db.delete(opportunityDocuments)
    .where(and(eq(opportunityDocuments.id, id), eq(opportunityDocuments.opportunityId, opportunityId)));
  return json({ success: true });
};
