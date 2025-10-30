import { Router, NextFunction, Response } from 'express';
import { z } from 'zod';
import { UnauthorizedError, BadRequestError } from '../lib/errors';
import { verifyToken } from '../middleware/auth';
import { renewToken } from '../middleware/session';
import { AuthRequest, UserRole } from '../../shared/types';
import * as pagoService from '../services/pagoService';

const router = Router();

const allowedRoles: UserRole[] = ['admin'];

// Middleware para verificar roles (solo admin)
const checkAdminRole = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
    throw new UnauthorizedError('Acceso denegado. Solo administradores pueden gestionar pagos.');
  }
  next();
};

// Esquemas de validación
const createPagoSchema = z.object({
  idEmpresa: z.coerce.number().min(1, 'ID de Empresa es obligatorio'),
  fechaPago: z.string().nullable().optional(),
  monto: z.coerce.number().min(0.01, 'El monto debe ser mayor a cero'),
  metodo: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
});

const updatePagoSchema = z.object({
  fechaPago: z.string().nullable().optional(),
  monto: z.coerce.number().min(0.01, 'El monto debe ser mayor a cero').optional(),
  metodo: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
});

const getPagosSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  idEmpresa: z.coerce.number().min(1).optional(),
});

// GET: Obtener lista de pagos
router.get('/', verifyToken, renewToken, checkAdminRole, async (req: AuthRequest, res, next) => {
  try {
    const validation = getPagosSchema.safeParse(req.query);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }

    const { limit, offset, search, idEmpresa } = validation.data;
    const result = await pagoService.getPagos(search, idEmpresa, limit, offset);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET: Obtener pago por ID
router.get('/:id', verifyToken, renewToken, checkAdminRole, async (req: AuthRequest, res, next) => {
  try {
    const idPago = parseInt(req.params.id, 10);
    if (isNaN(idPago)) {
      throw new BadRequestError('ID de pago inválido.');
    }
    const pago = await pagoService.getPagoById(idPago);
    res.json(pago);
  } catch (error) {
    next(error);
  }
});

// POST: Registrar nuevo pago
router.post('/', verifyToken, renewToken, checkAdminRole, async (req: AuthRequest, res, next) => {
  try {
    const validation = createPagoSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }
    const newPago = await pagoService.createPago(validation.data);
    res.status(201).json({ message: 'Pago registrado exitosamente', pago: newPago });
  } catch (error) {
    next(error);
  }
});

// PUT: Actualizar pago por ID
router.put('/:id', verifyToken, renewToken, checkAdminRole, async (req: AuthRequest, res, next) => {
  try {
    const idPago = parseInt(req.params.id, 10);
    if (isNaN(idPago)) {
      throw new BadRequestError('ID de pago inválido.');
    }

    const validation = updatePagoSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }

    const updatedPago = await pagoService.updatePago(idPago, validation.data);
    res.json({ message: 'Pago actualizado exitosamente', pago: updatedPago });
  } catch (error) {
    next(error);
  }
});

// DELETE: Eliminar pago por ID
router.delete('/:id', verifyToken, renewToken, checkAdminRole, async (req: AuthRequest, res, next) => {
  try {
    const idPago = parseInt(req.params.id, 10);
    if (isNaN(idPago)) {
      throw new BadRequestError('ID de pago inválido.');
    }
    const deletedPago = await pagoService.deletePago(idPago);
    res.json({ message: 'Pago eliminado exitosamente', pago: deletedPago });
  } catch (error) {
    next(error);
  }
});

export default router;