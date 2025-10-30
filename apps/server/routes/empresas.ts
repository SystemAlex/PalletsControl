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
const createEmpresaSchema = z.object({
  razonSocial: z.string().min(1, 'Razón Social es obligatoria'),
  nombreFantasia: z.string().nullable().optional(),
  cuit: z.string().min(1, 'CUIT es obligatorio'),
  direccion: z.string().nullable().optional(),
  ciudad: z.string().nullable().optional(),
  provincia: z.string().nullable().optional(),
  pais: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  email: z.string().email('Email inválido').nullable().optional(),
  sitioWeb: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  activo: z.boolean().optional(),
});

const updateEmpresaSchema = z.object({
  razonSocial: z.string().min(1, 'Razón Social es obligatoria').optional(),
  nombreFantasia: z.string().nullable().optional(),
  cuit: z.string().min(1, 'CUIT es obligatorio').optional(),
  direccion: z.string().nullable().optional(),
  ciudad: z.string().nullable().optional(),
  provincia: z.string().nullable().optional(),
  pais: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
  email: z.string().email('Email inválido').nullable().optional(),
  sitioWeb: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  activo: z.boolean().optional(),
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

// DELETE: Eliminar empresa por ID
router.delete('/:id', verifyToken, renewToken, checkAdminRole, async (req: AuthRequest, res, next) => {
  try {
    const idEmpresa = parseInt(req.params.id, 10);
    if (isNaN(idEmpresa)) {
      throw new BadRequestError('ID de empresa inválido.');
    }
    const deletedEmpresa = await empresaService.deleteEmpresa(idEmpresa);
    res.json({ message: 'Empresa eliminada exitosamente', empresa: deletedEmpresa });
  } catch (error) {
    next(error);
  }
});

export default router;