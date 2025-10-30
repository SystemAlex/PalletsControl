import { pgTable, serial, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { users } from './userSchema';
import { palletsProductos } from './palletProductSchema';
import { palletsPosiciones } from './palletSchema';

export const palletActionLogs = pgTable(
  'pallet_action_logs',
  {
    id: serial('id').primaryKey(),
    palletProductId: integer('pallet_product_id').references(() => palletsProductos.id, {
      onDelete: 'set null',
    }),
    palletPositionId: integer('pallet_position_id').references(() => palletsPosiciones.id, {
      onDelete: 'set null',
    }),
    actionType: text('action_type').notNull(), // e.g., 'CREATE_POSITION', 'UPDATE_POSITION_STATUS', 'ADD_PRODUCT'
    description: text('description').notNull(),
    oldValue: text('old_value'), // JSON string of the old state
    newValue: text('new_value'), // JSON string of the new state
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    username: text('username').notNull(), // Denormalized for historical accuracy
    realname: text('realname').notNull(), // Denormalized for historical accuracy
    timestamp: timestamp('timestamp').notNull().defaultNow(),
  },
  (table) => {
    return {
      palletProductIdIdx: index('pallet_action_logs_pallet_product_id_idx').on(
        table.palletProductId,
      ),
      palletPositionIdIdx: index('pallet_action_logs_pallet_position_id_idx').on(
        table.palletPositionId,
      ),
      userIdIdx: index('pallet_action_logs_user_id_idx').on(table.userId),
      timestampIdx: index('pallet_action_logs_timestamp_idx').on(table.timestamp),
    };
  },
);