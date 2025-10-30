import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { env } from '../lib/config';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log('⏳ Seeding database...');
  try {
    // 1. Limpiar datos existentes
    console.log('🗑️ Clearing old user data...');
    await db.delete(schema.users);
    await db.execute(sql`ALTER SEQUENCE users_id_seq RESTART WITH 1;`);
    console.log('✅ Old data cleared.');

    // 2. Preparar nuevos usuarios
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
      },
      {
        username: 'Programador',
        realname: 'Programador',
        email: 'programador@test.com',
        passwordHash: await bcrypt.hash('ControlPallets2025', 10),
        role: 'developer',
        mustChangePassword: false,
        isActive: true,
      },
      {
        username: 'Mauro',
        realname: 'Mauro Sanabria',
        email: 'marioruben.mrs@gmail.com',
        passwordHash: await bcrypt.hash('Clave123', 10),
        role: 'gerente',
        mustChangePassword: true,
        isActive: true,
      },
      {
        username: 'supervisor_test_1',
        realname: 'Supervisor de Prueba 1',
        email: 'supervisor1@test.com',
        passwordHash: await bcrypt.hash('Clave123', 10),
        role: 'supervisor',
        mustChangePassword: true,
        isActive: true,
      },
      {
        username: 'supervisor_test_2',
        realname: 'Supervisor de Prueba 2',
        email: 'supervisor2@test.com',
        passwordHash: await bcrypt.hash('Clave123', 10),
        role: 'supervisor',
        mustChangePassword: true,
        isActive: true,
      },
      {
        username: 'supervisor_test_3',
        realname: 'Supervisor de Prueba 3',
        email: 'supervisor3@test.com',
        passwordHash: await bcrypt.hash('Clave123', 10),
        role: 'supervisor',
        mustChangePassword: true,
        isActive: true,
      },
      {
        username: 'analista_test',
        realname: 'Analista de Prueba',
        email: 'analista@test.com',
        passwordHash: await bcrypt.hash('Clave123', 10),
        role: 'analista',
        mustChangePassword: true,
        isActive: true,
      },
      {
        username: 'mondelez_test',
        realname: 'Usuario Mondelez',
        email: 'mondelez@test.com',
        passwordHash: await bcrypt.hash('Clave123', 10),
        role: 'mondelez',
        mustChangePassword: true,
        isActive: true,
      },
      {
        username: 'deposito_test',
        realname: 'Usuario Depósito',
        email: 'deposito@test.com',
        passwordHash: await bcrypt.hash('Clave123', 10),
        role: 'deposito',
        mustChangePassword: true,
        isActive: true,
      },
    ];

    // Agregar 18 vendedores
    for (let i = 1; i <= 18; i++) {
      usersToInsert.push({
        username: `vendedor_test_${i}`,
        realname: `Vendedor de Prueba ${i}`,
        email: `vendedor${i}@test.com`,
        passwordHash: await bcrypt.hash('Clave123', 10),
        role: 'vendedor',
        mustChangePassword: true,
        isActive: true,
      });
    }

    // 3. Insertar usuarios
    console.log('➕ Inserting new users...');
    await db.insert(schema.users).values(usersToInsert);
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('👋 Seeding complete. Connection closed.');
  }
}

seed();
