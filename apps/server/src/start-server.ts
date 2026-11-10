import { once } from 'node:events';
import { sql } from 'drizzle-orm';
import app from './app.js';
import config from './config/index.js';
import { db } from './db/index.js';

export async function startServer(): Promise<void> {
  await db.execute(sql`SELECT 1`);

  const server = app.listen(config.server.port, config.server.host);
  await once(server, 'listening');

  console.log(`API listening at http://${config.server.host}:${config.server.port} (${config.env})`);
}
