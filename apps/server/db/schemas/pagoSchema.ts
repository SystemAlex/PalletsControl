import { pgTable, serial, integer, date, decimal, text, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { empresas } from './empresaSchema';

export const pagos = pgTable(
  'pagos',
  {
    idPago: serial('id_pago').primaryKey(),
    idEmpresa: integer('id_empresa')
      .notNull()
      .references(() => empresas.idEmpresa, { onDelete: 'cascade' }),
    fechaPago: date('fecha_pago', { mode: 'string' })
      .notNull()
      .default(sql`CURRENT_DATE`),
    monto: decimal('monto', { precision: 12, scale: 2 }).notNull(),
    metodo: text('metodo'), // ej: transferencia, tarjeta, efectivo
    observaciones: text('observaciones'),
    createdAt: date('created_at')
      .notNull()
      .default(sql`CURRENT_DATE`),
  },
  (table) => {
    return {
      idEmpresaIdx: index('idx_pagos_id_empresa').on(table.idEmpresa),
      fechaPagoIdx: index('idx_pagos_fecha_pago').on(table.fechaPago),
    };
  },
);

export const pagosRelations = relations(pagos, ({ one }) => ({
  empresa: one(empresas, {
    fields: [pagos.idEmpresa],
    references: [empresas.idEmpresa],
  }),
}));
