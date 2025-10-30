import { db } from '../db';
import { pagos, empresas } from '../db/schema';
import { CreatePagoPayload, UpdatePagoPayload, PagoRecord } from '../../shared/types';
import { BadRequestError, NotFoundError } from '../lib/errors';
import { eq, ilike, or, sql, and, desc } from 'drizzle-orm';

// Helper para seleccionar columnas y castear monto a number
const selectPagoColumns = {
  idPago: pagos.idPago,
  idEmpresa: pagos.idEmpresa,
  fechaPago: sql<string>`${pagos.fechaPago}::text`.as('fechaPago'),
  monto: sql<number>`CAST(${pagos.monto} AS NUMERIC(12, 2))`.as('monto'),
  metodo: pagos.metodo,
  observaciones: pagos.observaciones,
};

export async function createPago(payload: CreatePagoPayload): Promise<PagoRecord> {
  if (!payload.idEmpresa || payload.monto === undefined || payload.monto === null) {
    throw new BadRequestError('ID de Empresa y Monto son obligatorios.');
  }

  // Verificar que la empresa exista
  const existingEmpresa = await db.query.empresas.findFirst({
    where: eq(empresas.idEmpresa, payload.idEmpresa),
  });
  if (!existingEmpresa) {
    throw new NotFoundError(`Empresa con ID ${payload.idEmpresa} no encontrada.`);
  }

  const [newPago] = await db
    .insert(pagos)
    .values({
      idEmpresa: payload.idEmpresa,
      fechaPago: payload.fechaPago,
      monto: payload.monto.toFixed(2), // Almacenar como string con 2 decimales
      metodo: payload.metodo,
      observaciones: payload.observaciones,
    })
    .returning(selectPagoColumns);

  if (!newPago) {
    throw new Error('Fallo al registrar el pago.');
  }

  return newPago;
}

export async function getPagos(
  searchQuery?: string,
  idEmpresaFilter?: number,
  limit: number = 20,
  offset: number = 0,
): Promise<{ pagos: PagoRecord[]; totalCount: number }> {
  const conditions = [];

  if (idEmpresaFilter) {
    conditions.push(eq(pagos.idEmpresa, idEmpresaFilter));
  }

  if (searchQuery) {
    const searchPattern = `%${searchQuery.toLowerCase()}%`;
    conditions.push(
      or(
        ilike(pagos.observaciones, searchPattern),
        ilike(pagos.metodo, searchPattern),
      ),
    );
  }

  const pagoList = await db
    .select(selectPagoColumns)
    .from(pagos)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(pagos.fechaPago), desc(pagos.idPago))
    .limit(limit)
    .offset(offset);

  const [{ count: totalCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pagos)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return { pagos: pagoList, totalCount: totalCount ?? 0 };
}

export async function getPagoById(idPago: number): Promise<PagoRecord> {
  const pago = await db
    .select(selectPagoColumns)
    .from(pagos)
    .where(eq(pagos.idPago, idPago))
    .limit(1);

  if (!pago[0]) {
    throw new NotFoundError('Pago no encontrado.');
  }
  return pago[0];
}

export async function updatePago(
  idPago: number,
  payload: UpdatePagoPayload,
): Promise<PagoRecord> {
  if (Object.keys(payload).length === 0) {
    throw new BadRequestError('No hay datos para actualizar.');
  }

  const updateData: Record<string, unknown> = { ...payload };

  // Asegurar que el monto se formatee correctamente si se proporciona
  if (payload.monto !== undefined) {
    updateData.monto = payload.monto.toFixed(2);
  }

  const [updatedPago] = await db
    .update(pagos)
    .set(updateData)
    .where(eq(pagos.idPago, idPago))
    .returning(selectPagoColumns);

  if (!updatedPago) {
    throw new NotFoundError('Pago no encontrado o no se pudo actualizar.');
  }

  return updatedPago;
}

export async function deletePago(idPago: number): Promise<PagoRecord> {
  const [deletedPago] = await db
    .delete(pagos)
    .where(eq(pagos.idPago, idPago))
    .returning(selectPagoColumns);

  if (!deletedPago) {
    throw new NotFoundError('Pago no encontrado.');
  }

  return deletedPago;
}