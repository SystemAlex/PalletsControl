import { pgTable, text, timestamp, index, integer, decimal, boolean } from 'drizzle-orm/pg-core';

export const articulos = pgTable(
  'articulos',
  {
    idArticulo: integer('id_articulo').primaryKey(),
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      articuloIdIdx: index('articulo_id_idx').on(table.idArticulo),
      articuloDesIdx: index('articulo_des_idx').on(table.desArticulo),
      articuloCategoriaIdx: index('articulo_categoria_idx').on(table.categoria),
      articuloSubCategoriaIdx: index('articulo_sub_categoria_idx').on(table.subCategoria),
      articuloMarcaIdx: index('articulo_marca_idx').on(table.marca),
    };
  },
);