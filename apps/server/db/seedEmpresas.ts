import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { empresas } from './schema';
import { sql } from 'drizzle-orm';
import { env } from '../lib/config';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const db = drizzle(pool, { schema: { empresas } });

export async function seedEmpresas() {
  console.log('⏳ Seeding base company...');
  try {
    // 1. Limpiar datos existentes y reiniciar secuencia (opcional, pero seguro)
    // Nota: No borramos todas las empresas si ya existen, solo aseguramos que la ID 1 exista.
    // Para un seed completo, borramos y recreamos.
    console.log('🗑️ Clearing old company data...');
    await db.delete(empresas);
    await db.execute(sql`ALTER SEQUENCE empresas_id_empresa_seq RESTART WITH 1;`);
    console.log('✅ Old company data cleared.');

    // 2. Preparar la empresa base
    const baseEmpresa: (typeof empresas.$inferInsert)[] = [
      {
        idEmpresa: 1,
        razonSocial: 'Empresa Demo S.A.',
        nombreFantasia: 'Demo Distribuciones',
        cuit: '30-70000000-0',
        telefono: '11-5555-5555',
        email: 'contacto@demo.com',
        activo: true,
        logoUrl: '/logos/alquimia.png',
        frecuenciaPago: 'permanente', // NEW: Set to permanente
      },
    ];

    // 3. Insertar empresa
    console.log('➕ Inserting base company (ID 1)...');
    await db.insert(empresas).values(baseEmpresa);
    await db.execute(
      sql`SELECT setval('empresas_id_empresa_seq', (SELECT MAX(id_empresa) FROM empresas));`,
    );
    console.log('✅ Base company seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding base company:', error);
    throw error;
  }
}

// Si se ejecuta directamente, cierra la conexión
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedEmpresas().finally(async () => {
    await pool.end();
    console.log('👋 Seeding connection closed.');
  });
}