import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { palletActionLogs } from './schema';
import { eq } from 'drizzle-orm';
import { env } from '../lib/config';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const db = drizzle(pool, { schema: { palletActionLogs } });

async function seedUpdatePalletLogs() {
  console.log('⏳ Iniciando la actualización de registros en pallet_action_logs...');
  try {
    const oldUserId = 1;
    const newUserId = 7;
    const newUsername = 'SystemAlexSuper';
    const newRealname = 'Francisco Beese';

    console.log(`🔄 Actualizando registros de usuario ${oldUserId} a ${newUserId}...`);

    const result = await db
      .update(palletActionLogs)
      .set({
        userId: newUserId,
        username: newUsername,
        realname: newRealname,
      })
      .where(eq(palletActionLogs.userId, oldUserId))
      .returning({ id: palletActionLogs.id });

    console.log(`✅ Se actualizaron ${result.length} registros en pallet_action_logs.`);
    console.log('🎉 Actualización de pallet_action_logs completada exitosamente!');
  } catch (error) {
    console.error('❌ Error al actualizar pallet_action_logs:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('👋 Conexión a la base de datos cerrada.');
  }
}

seedUpdatePalletLogs();
