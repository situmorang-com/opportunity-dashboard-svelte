import Database from 'better-sqlite3';

const raw = process.env.DATABASE_URL || 'data/sqlite.db';
const DATABASE_URL = raw.startsWith('file:') ? raw.replace(/^file:/, '') : raw;

const db = new Database(DATABASE_URL);

// Ensure stages exist (insert only if table is empty)
const stageCount = db.prepare('select count(*) as c from stages').get().c;
if (stageCount === 0) {
	const stages = [
		['Lead', 1, 10, '#6b7280', 'Initial contact or inquiry', 0, 0],
		['Discovery', 2, 20, '#3b82f6', 'Understanding requirements', 0, 0],
		['Solution Design', 3, 40, '#6366f1', 'Designing the Fabric solution', 0, 0],
		['Proposal', 4, 60, '#8b5cf6', 'Proposal submitted', 0, 0],
		['Negotiation', 5, 80, '#f59e0b', 'Contract negotiation', 0, 0],
		['Closed Won', 6, 100, '#22c55e', 'Deal won', 1, 0],
		['Closed Lost', 7, 0, '#ef4444', 'Deal lost', 0, 1],
	];
	const insertStage = db.prepare(
		`insert into stages (name, "order", probability, color, description, is_won, is_lost)
		 values (?, ?, ?, ?, ?, ?, ?)`
	);
	const tx = db.transaction((rows) => rows.forEach((r) => insertStage.run(r)));
	tx(stages);
}

// Ensure admin user exists
const adminEmail = 'edmundsitumorang@gmail.com';
db.prepare(
	`insert or ignore into users (id, email, name, password_hash, role, created_at, updated_at)
	 values (@id, @email, @name, null, @role, @createdAt, @updatedAt)`
).run({
	id: 'admin-001',
	email: adminEmail,
	name: 'Edmund Situmorang',
	role: 'admin',
	createdAt: Date.now(),
	updatedAt: Date.now()
});

// Keep legacy admin for compatibility
db.prepare(
	`insert or ignore into users (id, email, name, password_hash, role, created_at, updated_at)
	 values (@id, @email, @name, null, @role, @createdAt, @updatedAt)`
).run({
	id: 'admin-legacy',
	email: 'admin@example.com',
	name: 'Admin User',
	role: 'admin',
	createdAt: Date.now(),
	updatedAt: Date.now()
});

db.close();
console.log('✅ Seed (prod) complete');
