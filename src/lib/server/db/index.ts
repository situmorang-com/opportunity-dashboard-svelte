import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Use DATABASE_URL from environment (runtime), or default to data/sqlite.db for local development
const DATABASE_URL = env.DATABASE_URL || 'data/sqlite.db';

const sqlite = new Database(DATABASE_URL);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

export * from './schema';
