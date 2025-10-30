import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { env } from '../lib/config';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// Configurar cada nueva conexión para que interprete los timestamps sin zona horaria como UTC
pool.on('connect', (client) => {
  client.query("SET timezone = 'UTC'");
});

export const db = drizzle(pool, { schema });
