import { Router, NextFunction, Response } from 'express';
import { z } from 'zod';
import { UnauthorizedError, BadRequestError } from '../lib/errors';
import { verifyToken } from '../middleware/auth';
import { renewToken } from '../middleware/session';
import { AuthRequest, UserRole } from '../../shared/types';
import * as empresaService from '../services/empresaService';

const router = Router();

const allowedRoles: UserRole[] = ['admin'];

// Middleware para verificar roles (solo admin)
const checkAdminRole = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
    throw new UnauthorizedError('Acceso denegado. Solo administradores pueden gestionar empresas.');
  }
  next();
};

// Esquemas de validación
const frecuenciaPagoEnum = z.enum(['mensual', 'anual', 'permanente']); // Define enum

const createEmpresaSchema = z.object({
  razonSocial: z.string().min(1, 'Razón Social es obligatoria'),
  nombreFantasia: z.string().nullable().optional(),
  cuit: z.string().min(1, 'CUIT es obligatorio'),
  direccion: z.string().nullable().optional(),
  ciudad: z.string().nullable().optional(),
  provincia: z.string().nullable().optional(),
  pais: z.string().nullable().optional(),
  telefono: z.string().min(1, 'Teléfono es obligatorio'), // Requerido
  email: z.string().email('Email inválido').min(1, 'Email es obligatorio'), // Requerido
  sitioWeb: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(), // Nuevo campo
  activo: z.boolean().optional(),
  frecuenciaPago: frecuenciaPagoEnum.optional(), // NEW
});

const updateEmpresaSchema = z.object({
  razonSocial: z.string().min(1, 'Razón Social es obligatoria').optional(),
  nombreFantasia: z.string().nullable().optional(),
  cuit: z.string().min(1, 'CUIT es obligatorio').optional(),
  direccion: z.string().nullable().optional(),
  ciudad: z.string().nullable().optional(),
  provincia: z.string().nullable().optional(),
  pais: z.string().nullable().optional(),
  telefono: z.string().min(1, 'Teléfono es obligatorio').optional(), // Requerido (si se proporciona)
  email: z.string().email('Email inválido').min(1, 'Email es obligatorio').optional(), // Requerido (si se proporciona)
  sitioWeb: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(), // Nuevo campo
  activo: z.boolean().optional(),
  frecuenciaPago: frecuenciaPagoEnum.optional(), // NEW
});

const getEmpresasSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
});

// GET: Obtener lista de empresas
router.get('/', verifyToken, renewToken, checkAdminRole, async (req: AuthRequest, res, next) => {
  try {
    const validation = getEmpresasSchema.safeParse(req.query);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }

    const { limit, offset, search } = validation.data;
    const result = await empresaService.getEmpresas(search, limit, offset);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET: Obtener empresa por ID
router.get('/:id', verifyToken, renewToken, checkAdminRole, async (req: AuthRequest, res, next) => {
  try {
    const idEmpresa = parseInt(req.params.id, 10);
    if (isNaN(idEmpresa)) {
      throw new BadRequestError('ID de empresa inválido.');
    }
    const empresa = await empresaService.getEmpresaById(idEmpresa);
    res.json(empresa);
  } catch (error) {
    next(error);
  }
});

// POST: Crear nueva empresa
router.post('/', verifyToken, renewToken, checkAdminRole, async (req: AuthRequest, res, next) => {
  try {
    const validation = createEmpresaSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }
    const newEmpresa = await empresaService.createEmpresa(validation.data);
    res.status(201).json({ message: 'Empresa creada exitosamente', empresa: newEmpresa });
  } catch (error) {
    next(error);
  }
});

// PUT: Actualizar empresa por ID
router.put('/:id', verifyToken, renewToken, checkAdminRole, async (req: AuthRequest, res, next) => {
  try {
    const idEmpresa = parseInt(req.params.id, 10);
    if (isNaN(idEmpresa)) {
      throw new BadRequestError('ID de empresa inválido.');
    }

    const validation = updateEmpresaSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }

    const updatedEmpresa = await empresaService.updateEmpresa(idEmpresa, validation.data);
    res.json({ message: 'Empresa actualizada exitosamente', empresa: updatedEmpresa });
  } catch (error) {
    next(error);
  }
});

// DELETE: Eliminar (Desactivar Lógicamente) empresa por ID
router.delete(
  '/:id',
  verifyToken,
  renewToken,
  checkAdminRole,
  async (req: AuthRequest, res, next) => {
    try {
      const idEmpresa = parseInt(req.params.id, 10);
      if (isNaN(idEmpresa)) {
        throw new BadRequestError('ID de empresa inválido.');
      }
      const deactivatedEmpresa = await empresaService.deleteEmpresa(idEmpresa);
      // Respuesta 200 OK ya que es una actualización de estado (borrado lógico)
      res.status(200).json({
        message: 'Empresa desactivada exitosamente (Borrado Lógico)',
        empresa: deactivatedEmpresa,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;