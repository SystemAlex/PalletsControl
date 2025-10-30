import { pgTable, serial, text, boolean, timestamp, index, integer } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    username: text('username').notNull().unique(),
    realname: text('realname').notNull(),
    email: text('email').unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', {
      enum: ['admin', 'gerente', 'developer', 'deposito'],
    }).notNull(),
    mustChangePassword: boolean('must_change_password').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at'),
    lastActivityAt: timestamp('last_activity_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    // Removed idPersonal
    // Removed canViewOthers
  },
  (table) => {
    return {
      userUsernameIdx: index('user_username_idx').on(table.username),
      // Removed userIdPersonalIdx
    };
  },
);

export const loginHistory = pgTable(
  'login_history',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    success: boolean('success').notNull(),
  },
  (table) => {
    return {
      historyUserIdIdx: index('login_history_user_id_idx').on(table.userId),
      historyTimestampIdx: index('login_history_timestamp_idx').on(table.timestamp),
    };
  },
);