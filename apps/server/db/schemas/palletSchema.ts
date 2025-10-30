import { pgTable, serial, text, boolean, uniqueIndex, decimal } from 'drizzle-orm/pg-core';

export const palletsPosiciones = pgTable(
  'pallets_posiciones',
  {
    id: serial('id').primaryKey(), // 'id' ahora es una clave primaria serial
    fila: text('fila').notNull(),
    posicion: decimal('posicion', { precision: 10, scale: 2 }).notNull(),
    habilitado: boolean('habilitado').notNull().default(true), // Por defecto habilitado
  },
  (table) => {
    return {
      // Añadimos un índice único compuesto en (fila, posicion)
      filaPosicionUniqueIdx: uniqueIndex('pallets_posiciones_fila_posicion_unique_idx').on(
        table.fila,
        table.posicion,
      ),
    };
  },
);
