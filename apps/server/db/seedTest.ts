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
    // 1. Limpiar datos de usuarios existentes y reiniciar secuencia
    console.log('🗑️ Clearing old user data...');
    await db.delete(schema.users);
    await db.execute(sql`ALTER SEQUENCE users_id_seq RESTART WITH 1;`);
    console.log('✅ Old user data cleared.');

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
        idEmpresa: 1, // Asignado a Empresa 1
      },
      {
        username: 'Programador',
        realname: 'Programador',
        email: 'programador@test.com',
        passwordHash: await bcrypt.hash('ControlPallets2025', 10),
        role: 'developer',
        mustChangePassword: false,
        isActive: true,
        idEmpresa: 1, // Asignado a Empresa 1
      },
      {
        username: 'DemoUser',
        realname: 'Usuario Gerente',
        email: 'gerente@test.com',
        passwordHash: await bcrypt.hash('Clave123', 10),
        role: 'gerente',
        mustChangePassword: true,
        isActive: true,
        idEmpresa: 1, // Asignado a Empresa 1
      },
      {
        username: 'deposito_test',
        realname: 'Usuario Depósito',
        email: 'deposito@test.com',
        passwordHash: await bcrypt.hash('Clave123', 10),
        role: 'deposito',
        mustChangePassword: true,
        isActive: true,
        idEmpresa: 1, // Asignado a Empresa 1
      },
    ];

    // 4. Insertar usuarios
    console.log('➕ Inserting new users...');
    await db.insert(schema.users).values(usersToInsert);
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