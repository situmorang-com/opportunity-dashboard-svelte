import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { stages, users } from './schema';

const raw = process.env.DATABASE_URL || 'data/sqlite.db';
const DATABASE_URL = raw.startsWith('file:') ? raw.replace(/^file:/, '') : raw;

const sqlite = new Database(DATABASE_URL);
const db = drizzle(sqlite);

async function seed() {
	console.log('🌱 Seeding database...');

	// Seed default stages
	const defaultStages = [
		{ name: 'Lead', order: 1, probability: 10, color: '#6b7280', description: 'Initial contact or inquiry' },
		{ name: 'Discovery', order: 2, probability: 20, color: '#3b82f6', description: 'Understanding requirements' },
		{ name: 'Solution Design', order: 3, probability: 40, color: '#6366f1', description: 'Designing the Fabric solution' },
		{ name: 'Proposal', order: 4, probability: 60, color: '#8b5cf6', description: 'Proposal submitted' },
		{ name: 'Negotiation', order: 5, probability: 80, color: '#f59e0b', description: 'Contract negotiation' },
		{ name: 'Closed Won', order: 6, probability: 100, color: '#22c55e', description: 'Deal won', isWon: true },
		{ name: 'Closed Lost', order: 7, probability: 0, color: '#ef4444', description: 'Deal lost', isLost: true }
	];

	console.log('  Creating stages...');
	for (const stage of defaultStages) {
		await db.insert(stages).values(stage).onConflictDoNothing();
	}

	// Create admin user (Google SSO - no password needed)
	console.log('  Creating admin user...');
	await db.insert(users).values({
		id: 'admin-001',
		email: 'edmundsitumorang@gmail.com',
		name: 'Edmund Situmorang',
		passwordHash: null,
		role: 'admin'
	}).onConflictDoNothing();

	// Keep a legacy admin for seed-data compatibility
	await db.insert(users).values({
		id: 'admin-legacy',
		email: 'admin@example.com',
		name: 'Admin User',
		passwordHash: null,
		role: 'admin'
	}).onConflictDoNothing();

	console.log('✅ Seeding complete!');
	console.log('');
	console.log('Admin user: edmundsitumorang@gmail.com (Google SSO)');

	sqlite.close();
}

seed().catch((err) => {
	console.error('❌ Seeding failed:', err);
	process.exit(1);
});
