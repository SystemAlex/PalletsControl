import {
  integer,
  text,
  boolean,
  date,
  decimal,
  pgTable,
  serial,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { palletsPosiciones } from './palletSchema';
import { users } from './userSchema';
import { empresas } from './empresaSchema';

export const palletsProductos = pgTable(
  'pallets_productos',
  {
    id: serial('id').primaryKey(), // Cambiado de 'integer' a 'serial'
    fila: text('fila').notNull(),
    posicion: decimal('posicion', { precision: 10, scale: 2 }).notNull(), // Cambiado a decimal
    codigo: integer('codigo').notNull(),
    bultos: integer('bultos').notNull(),
    pallets: boolean('pallets').notNull(),
    vencimiento: date('vencimiento', { mode: 'date' }), // Eliminado .notNull()
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    idEmpresa: integer('id_empresa')
      .notNull()
      .references(() => empresas.idEmpresa), // Requerido
    observaciones: text('observaciones'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(), // Nueva columna
  },
  (table) => {
    return {
      idEmpresaIdx: index('pallets_productos_id_empresa_idx').on(table.idEmpresa),
    };
  },
);

export const palletsProductosRelations = relations(palletsProductos, ({ one }) => ({
  posicionPallet: one(palletsPosiciones, {
    fields: [palletsProductos.fila, palletsProductos.posicion, palletsProductos.idEmpresa],
    references: [palletsPosiciones.fila, palletsPosiciones.posicion, palletsPosiciones.idEmpresa],
  }),
  user: one(users, {
    fields: [palletsProductos.userId],
    references: [users.id],
  }),
  empresa: one(empresas, {
    fields: [palletsProductos.idEmpresa],
    references: [empresas.idEmpresa],
  }),
}));
