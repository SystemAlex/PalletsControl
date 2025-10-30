import { db } from '../db';
import { empresas } from '../db/schema';
import { CreateEmpresaPayload, UpdateEmpresaPayload, EmpresaRecord } from '../../shared/types';
import { BadRequestError, ConflictError, NotFoundError } from '../lib/errors';
import { eq, ilike, or, sql, and } from 'drizzle-orm';

// Helper para seleccionar columnas y formatear la fecha
const selectEmpresaColumns = {
  idEmpresa: empresas.idEmpresa,
  razonSocial: empresas.razonSocial,
  nombreFantasia: empresas.nombreFantasia,
  cuit: empresas.cuit,
  direccion: empresas.direccion,
  ciudad: empresas.ciudad,
  provincia: empresas.provincia,
  pais: empresas.pais,
  telefono: empresas.telefono,
  email: empresas.email,
  sitioWeb: empresas.sitioWeb,
  sector: empresas.sector,
  fechaAlta: sql<string>`${empresas.fechaAlta}::text`.as('fechaAlta'),
  activo: empresas.activo,
};

export async function createEmpresa(payload: CreateEmpresaPayload): Promise<EmpresaRecord> {
  if (!payload.razonSocial || !payload.cuit || !payload.email || !payload.telefono) {
    throw new BadRequestError('Razón Social, CUIT, Email y Teléfono son obligatorios.');
  }

  // Verificar unicidad de CUIT
  const existingCuit = await db.query.empresas.findFirst({
    where: eq(empresas.cuit, payload.cuit),
  });
  if (existingCuit) {
    throw new ConflictError(`Ya existe una empresa con el CUIT ${payload.cuit}.`);
  }

  // Verificar unicidad de Email
  const existingEmail = await db.query.empresas.findFirst({
    where: eq(empresas.email, payload.email),
  });
  if (existingEmail) {
    throw new ConflictError(`Ya existe una empresa con el email ${payload.email}.`);
  }

  const [newEmpresa] = await db
    .insert(empresas)
    .values({
      razonSocial: payload.razonSocial,
      nombreFantasia: payload.nombreFantasia,
      cuit: payload.cuit,
      direccion: payload.direccion,
      ciudad: payload.ciudad,
      provincia: payload.provincia,
      pais: payload.pais,
      telefono: payload.telefono,
      email: payload.email,
      sitioWeb: payload.sitioWeb,
      sector: payload.sector,
      activo: payload.activo,
    })
    .returning(selectEmpresaColumns);

  if (!newEmpresa) {
    throw new Error('Fallo al crear la empresa.');
  }

  return newEmpresa;
}

export async function getEmpresas(
  searchQuery?: string,
  limit: number = 20,
  offset: number = 0,
): Promise<{ empresas: EmpresaRecord[]; totalCount: number }> {
  const conditions = [];

  if (searchQuery) {
    const searchPattern = `%${searchQuery.toLowerCase()}%`;
    conditions.push(
      or(
        ilike(empresas.razonSocial, searchPattern),
        ilike(empresas.nombreFantasia, searchPattern),
        ilike(empresas.cuit, searchPattern),
      ),
    );
  }

  const empresaList = await db
    .select(selectEmpresaColumns)
    .from(empresas)
    .where(conditions.length > 0 ? or(...conditions) : undefined)
    .orderBy(empresas.razonSocial)
    .limit(limit)
    .offset(offset);

  const [{ count: totalCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(empresas)
    .where(conditions.length > 0 ? or(...conditions) : undefined);

  return { empresas: empresaList, totalCount: totalCount ?? 0 };
}

export async function getEmpresaById(idEmpresa: number): Promise<EmpresaRecord> {
  const empresa = await db
    .select(selectEmpresaColumns)
    .from(empresas)
    .where(eq(empresas.idEmpresa, idEmpresa))
    .limit(1);

  if (!empresa[0]) {
    throw new NotFoundError('Empresa no encontrada.');
  }
  return empresa[0];
}

export async function updateEmpresa(
  idEmpresa: number,
  payload: UpdateEmpresaPayload,
): Promise<EmpresaRecord> {
  if (Object.keys(payload).length === 0) {
    throw new BadRequestError('No hay datos para actualizar.');
  }

  // Verificar unicidad de CUIT si se está actualizando
  if (payload.cuit) {
    const existingCuit = await db.query.empresas.findFirst({
      where: and(eq(empresas.cuit, payload.cuit), sql`${empresas.idEmpresa} != ${idEmpresa}`),
    });
    if (existingCuit) {
      throw new ConflictError(`Ya existe otra empresa con el CUIT ${payload.cuit}.`);
    }
  }

  // Verificar unicidad de Email si se proporciona
  if (payload.email) {
    const existingEmail = await db.query.empresas.findFirst({
      where: and(eq(empresas.email, payload.email), sql`${empresas.idEmpresa} != ${idEmpresa}`),
    });
    if (existingEmail) {
      throw new ConflictError(`Ya existe otra empresa con el email ${payload.email}.`);
    }
  }

  // Crear un objeto de actualización que solo contenga las propiedades definidas en payload
  // y añadir updatedAt. Esto evita pasar 'null' a campos NOT NULL si no se especifican.
  const updateData: Record<string, unknown> = {
    ...payload,
    updatedAt: new Date(),
  };

  const [updatedEmpresa] = await db
    .update(empresas)
    .set(updateData)
    .where(eq(empresas.idEmpresa, idEmpresa))
    .returning(selectEmpresaColumns);

  if (!updatedEmpresa) {
    throw new NotFoundError('Empresa no encontrada o no se pudo actualizar.');
  }

  return updatedEmpresa;
}

export async function deleteEmpresa(idEmpresa: number): Promise<EmpresaRecord> {
  const [deletedEmpresa] = await db
    .delete(empresas)
    .where(eq(empresas.idEmpresa, idEmpresa))
    .returning(selectEmpresaColumns);

  if (!deletedEmpresa) {
    throw new NotFoundError('Empresa no encontrada.');
  }

  return deletedEmpresa;
}
