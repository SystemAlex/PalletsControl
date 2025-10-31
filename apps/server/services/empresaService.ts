import { db } from '../db';
import { empresas, pagos } from '../db/schema';
import { CreateEmpresaPayload, UpdateEmpresaPayload, EmpresaRecord, FrecuenciaPago } from '../../shared/types';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../lib/errors';
import { eq, ilike, or, sql, and, inArray } from 'drizzle-orm';
import { addMonths, addYears, parseISO, startOfDay } from 'date-fns'; // Importar funciones de date-fns
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'; // Importar funciones conscientes de zona horaria de date-fns-tz

import { getCountry } from 'countries-and-timezones';

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
  logoUrl: empresas.logoUrl, // Incluir logoUrl
  fechaAlta: sql<string>`${empresas.fechaAlta}::text`.as('fechaAlta'),
  activo: empresas.activo,
  frecuenciaPago: empresas.frecuenciaPago, // NEW
};

// Función para obtener la zona horaria de referencia
function getReferenceTimezone(countryCode: string | null): string {
  if (!countryCode) {
    return 'UTC'; // Fallback si no hay país
  }
  
  try {
    const countryData = getCountry(countryCode);
    if (countryData && countryData.timezones.length > 0) {
      // Usamos la primera zona horaria como referencia.
      return countryData.timezones[0];
    }
  } catch (e) {
    console.warn(`Could not find timezone for country code: ${countryCode}`);
  }
  
  return 'UTC'; // Fallback si el código de país no es válido o no tiene zonas horarias
}

// Helper para calcular la próxima fecha de pago y el estado de bloqueo
function calculatePaymentStatus(
  frecuenciaPago: FrecuenciaPago,
  lastPaymentDate: string | null,
  countryCode: string | null, // Nuevo parámetro
): { lastPaymentDate: string | null; nextPaymentDate: string | null; isBlocked: boolean } {
  
  if (!lastPaymentDate) {
    return {
      lastPaymentDate: null,
      nextPaymentDate: null,
      isBlocked: true,
    };
  }

  if (frecuenciaPago === 'permanente') {
    return {
      lastPaymentDate: lastPaymentDate,
      nextPaymentDate: null,
      isBlocked: false,
    };
  }

  const timezone = getReferenceTimezone(countryCode);

  // 1. Parsear la cadena YYYY-MM-DD en un objeto Date UTC.
  const parsedLastPaymentDateUtc = parseISO(lastPaymentDate);

  // 2. Convertir esta fecha UTC a la zona horaria de la empresa.
  // `toZonedTime` ajusta los componentes locales del objeto Date para que representen la fecha/hora en la zona horaria de destino.
  const lastDateInCompanyTimezone = toZonedTime(parsedLastPaymentDateUtc, timezone);

  // 3. Obtener el inicio del día para esta fecha en la zona horaria de la empresa.
  // `startOfDay` de date-fns opera sobre los componentes locales del objeto Date.
  const startOfLastDateInCompanyTimezone = startOfDay(lastDateInCompanyTimezone);

  let nextDateInCompanyTimezone: Date;

  if (frecuenciaPago === 'mensual') {
    nextDateInCompanyTimezone = addMonths(startOfLastDateInCompanyTimezone, 1);
  } else if (frecuenciaPago === 'anual') {
    nextDateInCompanyTimezone = addYears(startOfLastDateInCompanyTimezone, 1);
  } else {
    return { lastPaymentDate, nextPaymentDate: null, isBlocked: true };
  }

  // 4. Formatear la próxima fecha de pago a YYYY-MM-DD en la zona horaria de la empresa.
  const nextPaymentDateStr = formatInTimeZone(nextDateInCompanyTimezone, timezone, 'yyyy-MM-dd');
  
  // 5. Determinar el momento de bloqueo: inicio del próximo día de pago en UTC.
  // Obtener el inicio del día de `nextDateInCompanyTimezone` en su propia zona horaria.
  const startOfNextDateInCompanyTimezone = startOfDay(nextDateInCompanyTimezone);

  // Formatear esta fecha a una cadena ISO con el offset de la zona horaria,
  // y luego parsearla para obtener el instante UTC exacto.
  const blockingMomentIsoString = formatInTimeZone(startOfNextDateInCompanyTimezone, timezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
  const blockingMomentUtc = parseISO(blockingMomentIsoString);
  
  const nowUtc = new Date();
  
  const isBlocked = blockingMomentUtc.getTime() <= nowUtc.getTime();

  return {
    lastPaymentDate,
    nextPaymentDate: nextPaymentDateStr,
    isBlocked,
  };
}

// Función para obtener datos de pago y fusionarlos con los datos de la empresa
async function fetchEmpresasWithPaymentStatus(
  conditions: any[],
  limit: number,
  offset: number,
  orderBy: any,
): Promise<{ empresas: EmpresaRecord[]; totalCount: number }> {
  
  // 1. Fetch companies
  const empresaListRaw = await db
    .select(selectEmpresaColumns)
    .from(empresas)
    .where(conditions.length > 0 ? or(...conditions) : undefined)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  // 2. Fetch latest payment date for all fetched companies
  const empresaIds = empresaListRaw.map(e => e.idEmpresa);
  
  let paymentMap = new Map<number, string>();

  if (empresaIds.length > 0) {
    const latestPayments = await db
      .select({
        idEmpresa: pagos.idEmpresa,
        lastPaymentDate: sql<string>`MAX(${pagos.fechaPago})`.as('lastPaymentDate'),
      })
      .from(pagos)
      .where(inArray(pagos.idEmpresa, empresaIds))
      .groupBy(pagos.idEmpresa);

    latestPayments.forEach(p => {
      if (p.lastPaymentDate) {
        paymentMap.set(p.idEmpresa, p.lastPaymentDate);
      }
    });
  }

  // 3. Calculate status and merge
  const empresaList: EmpresaRecord[] = empresaListRaw.map(e => {
    const lastPaymentDate = paymentMap.get(e.idEmpresa) || null;
    const status = calculatePaymentStatus(e.frecuenciaPago, lastPaymentDate, e.pais); // Pasar e.pais
    
    return {
      ...e,
      lastPaymentDate: status.lastPaymentDate,
      nextPaymentDate: status.nextPaymentDate,
      isBlocked: status.isBlocked,
    } as EmpresaRecord;
  });

  // 4. Count total
  const [{ count: totalCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(empresas)
    .where(conditions.length > 0 ? or(...conditions) : undefined);

  return { empresas: empresaList, totalCount: totalCount ?? 0 };
}

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
  if (payload.email) {
    const existingEmail = await db.query.empresas.findFirst({
      where: eq(empresas.email, payload.email),
    });
    if (existingEmail) {
      throw new ConflictError(`Ya existe otra empresa con el email ${payload.email}.`);
    }
  }

  const [newEmpresaRaw] = await db
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
      logoUrl: payload.logoUrl, // Incluir logoUrl
      activo: payload.activo,
      frecuenciaPago: payload.frecuenciaPago, // NEW
    })
    .returning(selectEmpresaColumns);

  if (!newEmpresaRaw) {
    throw new Error('Fallo al crear la empresa.');
  }
  
  // Calculate payment status for the newly created company (which has no payments yet)
  const status = calculatePaymentStatus(newEmpresaRaw.frecuenciaPago, null, newEmpresaRaw.pais); // Pasar newEmpresaRaw.pais

  return {
    ...newEmpresaRaw,
    lastPaymentDate: status.lastPaymentDate,
    nextPaymentDate: status.nextPaymentDate,
    isBlocked: status.isBlocked,
  } as EmpresaRecord;
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

  return fetchEmpresasWithPaymentStatus(conditions, limit, offset, empresas.razonSocial);
}

export async function getEmpresaById(idEmpresa: number): Promise<EmpresaRecord> {
  const empresaRaw = await db
    .select(selectEmpresaColumns)
    .from(empresas)
    .where(eq(empresas.idEmpresa, idEmpresa))
    .limit(1);

  if (!empresaRaw[0]) {
    throw new NotFoundError('Empresa no encontrada.');
  }
  
  // Fetch latest payment date
  const latestPayment = await db
    .select({
      lastPaymentDate: sql<string>`MAX(${pagos.fechaPago})`.as('lastPaymentDate'),
    })
    .from(pagos)
    .where(eq(pagos.idEmpresa, idEmpresa))
    .limit(1);
    
  const lastPaymentDate = latestPayment[0]?.lastPaymentDate || null;
  const status = calculatePaymentStatus(empresaRaw[0].frecuenciaPago, lastPaymentDate, empresaRaw[0].pais); // Pasar empresaRaw[0].pais

  return {
    ...empresaRaw[0],
    lastPaymentDate: status.lastPaymentDate,
    nextPaymentDate: status.nextPaymentDate,
    isBlocked: status.isBlocked,
  } as EmpresaRecord;
}

export async function updateEmpresa(
  idEmpresa: number,
  payload: UpdateEmpresaPayload,
): Promise<EmpresaRecord> {
  if (Object.keys(payload).length === 0) {
    throw new BadRequestError('No hay datos para actualizar.');
  }

  // Restricción: La empresa ID 1 no puede ser desactivada
  if (idEmpresa === 1 && payload.activo === false) {
    throw new UnauthorizedError('La empresa base (ID 1) no puede ser desactivada.');
  }
  
  // Restricción: La empresa ID 1 debe ser permanente
  if (idEmpresa === 1 && payload.frecuenciaPago && payload.frecuenciaPago !== 'permanente') {
    throw new UnauthorizedError('La empresa base (ID 1) debe tener frecuencia de pago permanente.');
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
  const updateData: Record<string, unknown> = {
    ...payload,
    updatedAt: new Date(),
  };

  const [updatedEmpresaRaw] = await db
    .update(empresas)
    .set(updateData)
    .where(eq(empresas.idEmpresa, idEmpresa))
    .returning(selectEmpresaColumns);

  if (!updatedEmpresaRaw) {
    throw new NotFoundError('Empresa no encontrada o no se pudo actualizar.');
  }
  
  // Recalcular el estado de pago después de la actualización
  const latestPayment = await db
    .select({
      lastPaymentDate: sql<string>`MAX(${pagos.fechaPago})`.as('lastPaymentDate'),
    })
    .from(pagos)
    .where(eq(pagos.idEmpresa, idEmpresa))
    .limit(1);
    
  const lastPaymentDate = latestPayment[0]?.lastPaymentDate || null;
  const status = calculatePaymentStatus(updatedEmpresaRaw.frecuenciaPago, lastPaymentDate, updatedEmpresaRaw.pais); // Pasar updatedEmpresaRaw.pais

  return {
    ...updatedEmpresaRaw,
    lastPaymentDate: status.lastPaymentDate,
    nextPaymentDate: status.nextPaymentDate,
    isBlocked: status.isBlocked,
  } as EmpresaRecord;
}

export async function deleteEmpresa(idEmpresa: number): Promise<EmpresaRecord> {
  if (idEmpresa === 1) {
    throw new UnauthorizedError('La empresa base (ID 1) no puede ser eliminada ni desactivada.');
  }

  const [updatedEmpresaRaw] = await db
    .update(empresas)
    .set({ activo: false, updatedAt: new Date() })
    .where(eq(empresas.idEmpresa, idEmpresa))
    .returning(selectEmpresaColumns);

  if (!updatedEmpresaRaw) {
    throw new NotFoundError('Empresa no encontrada o no se pudo desactivar.');
  }
  
  // Recalcular el estado de pago después de la desactivación
  const latestPayment = await db
    .select({
      lastPaymentDate: sql<string>`MAX(${pagos.fechaPago})`.as('lastPaymentDate'),
    })
    .from(pagos)
    .where(eq(pagos.idEmpresa, idEmpresa))
    .limit(1);
    
  const lastPaymentDate = latestPayment[0]?.lastPaymentDate || null;
  const status = calculatePaymentStatus(updatedEmpresaRaw.frecuenciaPago, lastPaymentDate, updatedEmpresaRaw.pais); // Pasar updatedEmpresaRaw.pais

  return {
    ...updatedEmpresaRaw,
    lastPaymentDate: status.lastPaymentDate,
    nextPaymentDate: status.nextPaymentDate,
    isBlocked: status.isBlocked,
  } as EmpresaRecord;
}