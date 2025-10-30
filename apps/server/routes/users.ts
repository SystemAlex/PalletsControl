import { Router } from 'express';
import { AuthRequest, UserRole } from '../../shared/types';
import { renewToken } from '../middleware/session';
import { UnauthorizedError, BadRequestError } from '../lib/errors';
import { verifyToken } from '../middleware/auth';
import * as userService from '../services/userService';
import {
  createUserSchema,
  updateUserSchema,
  toggleStatusSchema,
  getUsersQuerySchema,
} from '../schemas/userSchemas';
import { z } from 'zod';

const router = Router();

// GET: Obtener usuarios activos
router.get('/active', verifyToken, renewToken, async (req: AuthRequest, res, next) => {
  try {
    const requesterRole = req.user?.role as UserRole;
    const requesterIdEmpresa = req.user?.idEmpresa;

    if (!requesterRole) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const activeUsers = await userService.getActiveUsers(requesterRole, requesterIdEmpresa);

    res.json(activeUsers);
  } catch (error) {
    next(error);
  }
});

// GET: Obtener lista de usuarios con paginación
router.get('/', verifyToken, renewToken, async (req: AuthRequest, res, next) => {
  try {
    const requesterRole = req.user?.role as UserRole;
    const requesterIdEmpresa = req.user?.idEmpresa;

    if (!requesterRole) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const validation = getUsersQuerySchema.safeParse(req.query);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }

    const { limit, offset, search } = validation.data;

    const result = await userService.getUsers(
      requesterRole,
      requesterIdEmpresa,
      limit,
      offset,
      search,
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST: Crear un nuevo usuario
router.post('/', verifyToken, renewToken, async (req: AuthRequest, res, next) => {
  try {
    const requesterRole = req.user?.role as UserRole;
    const requesterIdEmpresa = req.user?.idEmpresa;
    if (!requesterRole) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }

    const newUser = await userService.createUser(
      validation.data as z.infer<typeof createUserSchema>,
      requesterRole,
      requesterIdEmpresa,
    );

    res.status(201).json({ message: 'Usuario creado exitosamente', user: newUser });
  } catch (error) {
    next(error);
  }
});

// PUT: Actualizar un usuario por ID
router.put('/:id', verifyToken, renewToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new BadRequestError('ID de usuario inválido');
    }

    const requesterId = req.user?.id;
    const requesterRole = req.user?.role as UserRole;
    const requesterIdEmpresa = req.user?.idEmpresa;
    if (!requesterId || !requesterRole) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }

    const updatedUser = await userService.updateUser(
      userId,
      validation.data as z.infer<typeof updateUserSchema>,
      requesterId,
      requesterRole,
      requesterIdEmpresa,
    );

    res.json({ message: 'Usuario actualizado exitosamente', user: updatedUser });
  } catch (error) {
    next(error);
  }
});

// PATCH: Cambiar estado de activo/inactivo de un usuario
router.patch('/:id/status', verifyToken, renewToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new BadRequestError('ID de usuario inválido');
    }

    const requesterId = req.user?.id;
    const requesterRole = req.user?.role as UserRole;
    const requesterIdEmpresa = req.user?.idEmpresa;

    if (!requesterId || !requesterRole) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const validation = toggleStatusSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }

    const { isActive } = validation.data;

    const updatedUser = await userService.toggleUserStatus(
      userId,
      isActive,
      requesterId,
      requesterRole,
      requesterIdEmpresa,
    );

    res.json({ message: 'Estado del usuario actualizado exitosamente', user: updatedUser });
  } catch (error) {
    next(error);
  }
});

// POST: Resetear contraseña de un usuario
router.post('/:id/reset-password', verifyToken, renewToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new BadRequestError('ID de usuario inválido');
    }

    const requesterId = req.user?.id;
    const requesterRole = req.user?.role as UserRole;
    const requesterIdEmpresa = req.user?.idEmpresa;

    if (!requesterId || !requesterRole) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const updatedUser = await userService.resetUserPassword(
      userId,
      requesterId,
      requesterRole,
      requesterIdEmpresa,
    );

    res.json({
      message:
        'Contraseña reseteada a "Clave123". El usuario deberá cambiarla en el próximo inicio de sesión.',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
