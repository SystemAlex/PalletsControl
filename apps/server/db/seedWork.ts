import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { env } from '../lib/config';
import { seedEmpresas } from './seedEmpresas'; // Importar seedEmpresas

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log('⏳ Seeding database...');
  try {
    // 1. Limpiar datos existentes
    console.log('🗑️ Clearing old user data...');
    await db.delete(schema.pagos); // Clear payments first
    await db.delete(schema.users);
    await db.execute(sql`ALTER SEQUENCE users_id_seq RESTART WITH 1;`);
    await db.execute(sql`ALTER SEQUENCE pagos_id_pago_seq RESTART WITH 1;`); // Reset payment sequence
    console.log('✅ Old data cleared.');

    // 2. Seed Empresas (debe ir primero)
    await seedEmpresas();

    // 3. Preparar nuevos usuarios
    console.log('👤 Preparing new users...');
    const usersToInsert: (typeof schema.users.$inferInsert)[] = [
      {
        username: 'SystemAlex',
        realname: 'Alexandro Beese',
        email: 'alexandrobeese@hotmail.com',
        passwordHash: await bcrypt.hash('Alex.1975', 10),
        role: 'admin',
        mustChangePassword: false,
        isActive: true,
        idEmpresa: 1, // CAMBIO: Asignado a Empresa 1
      },
      {
        username: 'Programador',
        realname: 'Programador',
        email: 'programador@test.com',
        passwordHash: await bcrypt.hash('ControlPallets2025', 10),
        role: 'developer',
        mustChangePassword: false,
        isActive: true,
        idEmpresa: 1, // CAMBIO: Asignado a Empresa 1
      },
      {
        username: 'DemoUser',
        realname: 'Usuario Demo',
        email: 'demo@test.com',
        passwordHash: await bcrypt.hash('Clave123', 10),
        role: 'gerente',
        mustChangePassword: true,
        isActive: true,
        idEmpresa: 1, // Asignado a Empresa 1
      },
    ];

    // 4. Insertar usuarios
    console.log('➕ Inserting new users...');
    await db.insert(schema.users).values(usersToInsert);

    // 5. Insertar pago base para Empresa 1 (Permanente)
    console.log('💰 Inserting base payment for Empresa 1...');
    await db.insert(schema.pagos).values({
      idEmpresa: 1,
      fechaPago: new Date().toISOString().split('T')[0], // Today's date
      monto: '0.00',
      metodo: 'Permanente',
      observaciones: 'Pago inicial de la empresa base (Permanente).',
    });

    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('👋 Seeding complete. Connection closed.');
  }
}

seed();
