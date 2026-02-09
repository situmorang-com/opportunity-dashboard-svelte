import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// Lazy initialization to ensure environment is ready
let _db: BetterSQLite3Database<typeof schema> | null = null;

function getDatabase(): BetterSQLite3Database<typeof schema> {
	if (!_db) {
		// Use bracket notation to prevent Vite from inlining at build time
		const DATABASE_URL = process.env['DATABASE_URL'] || 'data/sqlite.db';
		console.log('Connecting to database:', DATABASE_URL);

		const sqlite = new Database(DATABASE_URL);
		sqlite.pragma('journal_mode = WAL');
		sqlite.pragma('foreign_keys = ON');

		_db = drizzle(sqlite, { schema });
	}
	return _db;
}

// Export a proxy that lazily initializes the database on first access
export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
	get(_, prop) {
		return (getDatabase() as any)[prop];
	}
});

export * from './schema';
