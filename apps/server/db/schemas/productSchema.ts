import {
  pgTable,
  text,
  timestamp,
  index,
  integer,
  decimal,
  boolean,
  serial,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { empresas } from './empresaSchema';

export const articulos = pgTable(
  'articulos',
  {
    id: serial('id').primaryKey(), // Nueva clave primaria serial
    idArticulo: integer('id_articulo').notNull(), // Ya no es PK, pero sigue siendo NOT NULL
    desArticulo: text('des_articulo').notNull(),
    unidadesBulto: integer('unidades_bulto').notNull(),
    anulado: boolean('anulado').notNull(),
    esCombo: boolean('es_combo').notNull(),
    idPresentacionBulto: text('id_presentacion_bulto').notNull(),
    idPresentacionUnidad: text('id_presentacion_unidad').notNull(),
    codBarraBulto: text('cod_barra_bulto').notNull(),
    bultosPallet: integer('bultos_pallet').notNull(),
    pesoBulto: decimal('peso_bulto', { precision: 10, scale: 4 }).notNull(),
    categoria: text('categoria'),
    subCategoria: text('sub_categoria'),
    marca: text('marca'),
    idEmpresa: integer('id_empresa')
      .notNull()
      .references(() => empresas.idEmpresa), // Requerido
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      // Índice único compuesto para asegurar que idArticulo sea único por idEmpresa
      articuloUniqueIdx: uniqueIndex('articulo_id_articulo_id_empresa_unique_idx').on(
        table.idArticulo,
        table.idEmpresa,
      ),
      articuloIdIdx: index('articulo_id_idx').on(table.idArticulo),
      articuloDesIdx: index('articulo_des_idx').on(table.desArticulo),
      articuloCategoriaIdx: index('articulo_categoria_idx').on(table.categoria),
      articuloSubCategoriaIdx: index('articulo_sub_categoria_idx').on(table.subCategoria),
      articuloMarcaIdx: index('articulo_marca_idx').on(table.marca),
      articuloIdEmpresaIdx: index('articulo_id_empresa_idx').on(table.idEmpresa),
    };
  },
);

export const articulosRelations = relations(articulos, ({ one }) => ({
  empresa: one(empresas, {
    fields: [articulos.idEmpresa],
    references: [empresas.idEmpresa],
  }),
}));
