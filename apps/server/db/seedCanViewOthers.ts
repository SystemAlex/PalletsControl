import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './schema';
import { inArray } from 'drizzle-orm';
import { env } from '../lib/config';
import { UserRole } from '../../shared/types'; // Import UserRole

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const db = drizzle(pool, { schema: { users } });

async function seedCanViewOthers() {
  console.log('⏳ Actualizando el campo canViewOthers para los usuarios...');
  try {
    // Roles que deberían tener canViewOthers = true
    const rolesWithTrue: UserRole[] = ['admin', 'gerente', 'developer', 'analista', 'mondelez'];
    await db.update(users).set({ canViewOthers: true }).where(inArray(users.role, rolesWithTrue));
    console.log(
      `✅ canViewOthers establecido a 'true' para los roles: ${rolesWithTrue.join(', ')}`,
    );

    // Roles que deberían tener canViewOthers = false
    const rolesWithFalse: UserRole[] = ['supervisor', 'vendedor', 'deposito'];
    await db.update(users).set({ canViewOthers: false }).where(inArray(users.role, rolesWithFalse));
    console.log(
      `✅ canViewOthers establecido a 'false' para los roles: ${rolesWithFalse.join(', ')}`,
    );

    console.log('🎉 Actualización de canViewOthers completada exitosamente!');
  } catch (error) {
    console.error('❌ Error al actualizar canViewOthers:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('👋 Conexión a la base de datos cerrada.');
  }
}

seedCanViewOthers();
