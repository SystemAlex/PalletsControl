import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  date,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const empresas = pgTable(
  'empresas',
  {
    idEmpresa: serial('id_empresa').primaryKey(),
    razonSocial: text('razon_social').notNull(),
    nombreFantasia: text('nombre_fantasia'),
    cuit: text('cuit').notNull().unique(),
    direccion: text('direccion'),
    ciudad: text('ciudad'),
    provincia: text('provincia'),
    pais: text('pais'),
    telefono: text('telefono').notNull(), // Ahora es NOT NULL
    email: text('email').notNull().unique(), // Ahora es NOT NULL y UNIQUE
    sitioWeb: text('sitio_web'),
    sector: text('sector'),
    fechaAlta: date('fecha_alta', { mode: 'string' })
      .notNull()
      .default(sql`CURRENT_DATE`),
    activo: boolean('activo').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      sectorIdx: index('idx_empresas_sector').on(table.sector),
      ciudadIdx: index('idx_empresas_ciudad').on(table.ciudad),
      cuitUniqueIdx: uniqueIndex('idx_empresas_cuit').on(table.cuit),
      // Índice trigram para búsqueda de texto completo en razon_social
      razonSocialTrgmIdx: sql`CREATE INDEX idx_empresas_razon_social_trgm ON ${table} USING gin (${table.razonSocial} gin_trgm_ops)`,
    };
  },
);
