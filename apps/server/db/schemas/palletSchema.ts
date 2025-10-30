import {
  pgTable,
  serial,
  text,
  boolean,
  uniqueIndex,
  decimal,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { empresas } from './empresaSchema';

export const palletsPosiciones = pgTable(
  'pallets_posiciones',
  {
    id: serial('id').primaryKey(), // 'id' ahora es una clave primaria serial
    fila: text('fila').notNull(),
    posicion: decimal('posicion', { precision: 10, scale: 2 }).notNull(),
    habilitado: boolean('habilitado').notNull().default(true), // Por defecto habilitado
    idEmpresa: integer('id_empresa')
      .notNull()
      .references(() => empresas.idEmpresa), // Requerido
  },
  (table) => {
    return {
      // Añadimos un índice único compuesto en (fila, posicion, idEmpresa)
      filaPosicionUniqueIdx: uniqueIndex('pallets_posiciones_fila_posicion_unique_idx').on(
        table.fila,
        table.posicion,
        table.idEmpresa,
      ),
      idEmpresaIdx: index('pallets_posiciones_id_empresa_idx').on(table.idEmpresa),
    };
  },
);

export const palletsPosicionesRelations = relations(palletsPosiciones, ({ one }) => ({
  empresa: one(empresas, {
    fields: [palletsPosiciones.idEmpresa],
    references: [empresas.idEmpresa],
  }),
}));
