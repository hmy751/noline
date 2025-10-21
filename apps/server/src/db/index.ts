import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import config from '../config/index.js';
import * as schema from './schema.js';

if (!config.db.url) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// PostgreSQL connection
const connectionString = config.db.url;
const client = postgres(connectionString);

// Drizzle instance
export const db = drizzle(client, { schema });

// Export schema for queries
export * from './schema.js';
