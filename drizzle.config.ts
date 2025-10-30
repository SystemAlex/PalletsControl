import { defineConfig } from 'drizzle-kit';
import { env } from './apps/server/lib/config';

export default defineConfig({
  dialect: 'postgresql',
  schema: './apps/server/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
