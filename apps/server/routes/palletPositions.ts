import { Router, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { palletsPosiciones, palletActionLogs, palletsProductos } from '../db/schema'; // Importar palletsProductos
import { eq, and, sql } from 'drizzle-orm';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../lib/errors';
import { verifyToken } from '../middleware/auth';
import { renewToken } from '../middleware/session';
import { AuthRequest, UserRole } from '../../shared/types';

const router = Router();

// Roles permitidos para todas las operaciones (según la solicitud del usuario)
const allowedRoles: UserRole[] = ['admin', 'developer', 'deposito'];

// Middleware para verificar roles
const checkRoles = (req: AuthRequest, next: NextFunction) => {
  if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
    throw new UnauthorizedError('No tienes permiso para realizar esta acción.');
  }
  next();
};

// Helper para obtener la condición de filtrado por empresa
const getEmpresaFilterCondition = (req: AuthRequest) => {
  const requesterRole = req.user?.role as UserRole;
  const requesterIdEmpresa = req.user?.idEmpresa;

  if (requesterRole === 'admin') {
    return undefined; // Admin ve todo
  }

  // Si no es admin, debe tener una empresa asignada y se aplica el filtro.
  if (!requesterIdEmpresa) {
    throw new UnauthorizedError('Tu cuenta no está asignada a una empresa.');
  }

  return eq(palletsPosiciones.idEmpresa, requesterIdEmpresa);
};

// Esquema de validación para crear una posición de pallet
const createPalletPositionSchema = z.object({
  fila: z
    .string()
    .min(1, 'La fila es requerida')
    .max(2, 'La fila no puede tener más de 2 caracteres'),
  posicion: z.coerce
    .number()
    .min(0, 'La posición debe ser un número positivo')
    .max(99999999.99, 'La posición excede el valor máximo permitido'),
  habilitado: z.boolean().optional().default(true),
});

// Esquema de validación para actualizar el estado de una posición de pallet
const updatePalletPositionSchema = z.object({
  habilitado: z.boolean(),
});

// Helper para seleccionar columnas y castear 'posicion' a número
// Aunque se usa CAST en SQL, node-postgres puede devolver DECIMAL como string.
// La conversión final a number se hará en la capa de aplicación.
const selectPalletPositionColumns = {
  id: palletsPosiciones.id,
  fila: palletsPosiciones.fila,
  posicion: sql<string>`${palletsPosiciones.posicion}`.as('posicion'), // Mantener como string aquí para la selección
  habilitado: palletsPosiciones.habilitado,
  idEmpresa: palletsPosiciones.idEmpresa,
};

// Función para asegurar que 'posicion' sea un número
const formatPositionForResponse = <T extends { posicion: string | number }>(
  item: T,
): T & { posicion: number } => {
  return {
    ...item,
    posicion: typeof item.posicion === 'string' ? parseFloat(item.posicion) : item.posicion,
  };
};

// Helper para formatear la posición de pallet a una cadena legible para logs
function formatPalletPositionLogString(position: {
  fila: string;
  posicion: string | number;
  habilitado: boolean;
}): string {
  const formattedPosicion =
    typeof position.posicion === 'number' ? position.posicion : parseFloat(position.posicion);
  return `Fila: ${position.fila}, Posición: ${formattedPosicion}, Habilitado: ${position.habilitado ? 'Sí' : 'No'}`;
}

// GET: Obtener todas las posiciones de pallets
router.get('/', verifyToken, renewToken, (req: AuthRequest, res, next) =>
  checkRoles(req, async () => {
    try {
      const empresaFilter = getEmpresaFilterCondition(req);

      const positions = await db
        .select(selectPalletPositionColumns)
        .from(palletsPosiciones)
        .where(empresaFilter)
        .orderBy(palletsPosiciones.fila, palletsPosiciones.posicion);

      const formattedPositions = positions.map(formatPositionForResponse);
      res.json(formattedPositions);
    } catch (error) {
      next(error);
    }
  }),
);

// POST: Crear una nueva posición de pallet
router.post('/', verifyToken, renewToken, (req: AuthRequest, res, next) =>
  checkRoles(req, async () => {
    try {
      const requesterRole = req.user?.role as UserRole;
      const requesterIdEmpresa = req.user?.idEmpresa;

      if (requesterRole !== 'admin' && !requesterIdEmpresa) {
        throw new UnauthorizedError(
          'Tu cuenta no está asignada a una empresa para crear posiciones.',
        );
      }

      // Si no es admin, usa su idEmpresa. Si es admin, usa el idEmpresa del payload si existe, o 1 por defecto.
      const idEmpresa = requesterRole === 'admin' ? (req.body.idEmpresa ?? 1) : requesterIdEmpresa!;

      const validation = createPalletPositionSchema.safeParse(req.body);
      if (!validation.success) {
        throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
      }

      const { fila, posicion, habilitado } = validation.data;

      // Verificar si ya existe una posición con la misma fila, posición Y empresa
      const existingPosition = await db.query.palletsPosiciones.findFirst({
        where: and(
          eq(palletsPosiciones.fila, fila),
          eq(palletsPosiciones.posicion, posicion.toFixed(2)), // Convertir a string con 2 decimales para la comparación
          eq(palletsPosiciones.idEmpresa, idEmpresa),
        ),
      });

      if (existingPosition) {
        throw new ConflictError(
          `La posición de pallet Fila: ${fila}, Posición: ${posicion} ya existe para esta empresa.`,
        );
      }

      const [newPositionRaw] = await db
        .insert(palletsPosiciones)
        .values({
          fila,
          posicion: posicion.toFixed(2), // Almacenar como string con 2 decimales
          habilitado,
          idEmpresa, // Asignar idEmpresa
        })
        .returning(selectPalletPositionColumns);

      if (!newPositionRaw) {
        throw new Error('Failed to create pallet position.');
      }

      const newPosition = formatPositionForResponse(newPositionRaw);

      // Log the action
      await db.insert(palletActionLogs).values({
        palletPositionId: newPosition.id,
        actionType: 'CREATE_POSITION',
        description: `Posición de pallet creada: ${newPosition.fila}${newPosition.posicion}`,
        oldValue: null,
        newValue: formatPalletPositionLogString(newPosition), // Usar la función de formato
        userId: req.user!.id,
        username: req.user!.username,
        realname: req.user!.realname,
        idEmpresa: idEmpresa,
      });

      res
        .status(201)
        .json({ message: 'Posición de pallet creada exitosamente', position: newPosition });
    } catch (error) {
      next(error);
    }
  }),
);

// PATCH: Habilitar/deshabilitar una posición de pallet por ID
router.patch('/:id', verifyToken, renewToken, (req: AuthRequest, res, next) =>
  checkRoles(req, async () => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new BadRequestError('ID de posición de pallet inválido.');
      }

      const validation = updatePalletPositionSchema.safeParse(req.body);
      if (!validation.success) {
        throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
      }

      const { habilitado } = validation.data;
      const empresaFilter = getEmpresaFilterCondition(req);

      const existingPosition = await db.query.palletsPosiciones.findFirst({
        where: and(eq(palletsPosiciones.id, id), empresaFilter),
      });

      if (!existingPosition) {
        throw new NotFoundError('Posición de pallet no encontrada.');
      }

      const [updatedPositionRaw] = await db
        .update(palletsPosiciones)
        .set({ habilitado })
        .where(and(eq(palletsPosiciones.id, id), empresaFilter))
        .returning(selectPalletPositionColumns);

      if (!updatedPositionRaw) {
        throw new NotFoundError('Posición de pallet no encontrada.');
      }

      const updatedPosition = formatPositionForResponse(updatedPositionRaw);

      // Log the action
      await db.insert(palletActionLogs).values({
        palletPositionId: updatedPosition.id,
        actionType: 'UPDATE_POSITION_STATUS',
        description: `Estado de posición de pallet actualizado a ${habilitado ? 'habilitado' : 'deshabilitado'}: ${updatedPosition.fila}${updatedPosition.posicion}`,
        oldValue: formatPalletPositionLogString(existingPosition), // Usar la función de formato
        newValue: formatPalletPositionLogString(updatedPosition), // Usar la función de formato
        userId: req.user!.id,
        username: req.user!.username,
        realname: req.user!.realname,
        idEmpresa: updatedPosition.idEmpresa,
      });

      res.status(200).json({
        message: 'Estado de posición de pallet actualizado exitosamente',
        position: updatedPosition,
      });
    } catch (error) {
      next(error);
    }
  }),
);

// DELETE: Eliminar una posición de pallet por ID
router.delete('/:id', verifyToken, renewToken, (req: AuthRequest, res, next) =>
  checkRoles(req, async () => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new BadRequestError('ID de posición de pallet inválido.');
      }

      const empresaFilter = getEmpresaFilterCondition(req);

      // 1. Obtener el registro antes de eliminarlo para el log
      const existingPosition = await db.query.palletsPosiciones.findFirst({
        where: and(eq(palletsPosiciones.id, id), empresaFilter),
      });

      if (!existingPosition) {
        throw new NotFoundError('Posición de pallet no encontrada.');
      }

      // 2. VERIFICAR SI TIENE PRODUCTOS (filtrando por empresa)
      const productsInPosition = await db.query.palletsProductos.findFirst({
        where: and(
          eq(palletsProductos.fila, existingPosition.fila),
          eq(palletsProductos.posicion, existingPosition.posicion),
          eq(palletsProductos.idEmpresa, existingPosition.idEmpresa),
        ),
      });

      if (productsInPosition) {
        throw new ConflictError(
          `No se puede eliminar la posición ${existingPosition.fila}${parseFloat(existingPosition.posicion).toString()} porque contiene productos.`,
        );
      }

      const [deletedPositionRaw] = await db
        .delete(palletsPosiciones)
        .where(and(eq(palletsPosiciones.id, id), empresaFilter))
        .returning(selectPalletPositionColumns);

      if (!deletedPositionRaw) {
        throw new NotFoundError('Posición de pallet no encontrada.');
      }

      const deletedPosition = formatPositionForResponse(deletedPositionRaw);

      // Log the action
      await db.insert(palletActionLogs).values({
        palletPositionId: null, // Establecer a NULL ya que la posición ya no existe
        actionType: 'DELETE_POSITION',
        description: `Posición de pallet eliminada: ${deletedPosition.fila}${deletedPosition.posicion}`,
        oldValue: formatPalletPositionLogString(deletedPosition), // Usar la función de formato
        newValue: null,
        userId: req.user!.id,
        username: req.user!.username,
        realname: req.user!.realname,
        idEmpresa: deletedPosition.idEmpresa,
      });

      res
        .status(200)
        .json({ message: 'Posición de pallet eliminada exitosamente', position: deletedPosition });
    } catch (error) {
      next(error);
    }
  }),
);

export default router;
