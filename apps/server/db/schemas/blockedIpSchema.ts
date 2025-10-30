import { pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const blockedIps = pgTable(
  'blocked_ips',
  {
    id: serial('id').primaryKey(),
    ipAddress: text('ip_address').notNull().unique(),
    usernameAttempt: text('username_attempt'), // Nombre de usuario que intentó el login (puede ser nulo)
    blockedAt: timestamp('blocked_at').notNull().defaultNow(),
    unblockAt: timestamp('unblock_at').notNull(), // Cuándo se espera que la IP sea desbloqueada
    reason: text('reason').notNull().default('Too many login attempts'),
  },
  (table) => {
    return {
      ipAddressIdx: uniqueIndex('blocked_ips_ip_address_idx').on(table.ipAddress),
    };
  },
);
