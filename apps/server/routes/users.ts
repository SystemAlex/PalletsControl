import { Router } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { desc, and, eq, notInArray, sql, ilike, or, asc } from 'drizzle-orm';
import {
  AuthRequest,
  UserRole,
  roleHierarchy,
  allAvailableRoles,
  canAssignRole,
} from '../../shared/types'; // Import from shared types
import { renewToken } from '../middleware/session';
import { UnauthorizedError, BadRequestError, ConflictError, NotFoundError } from '../lib/errors';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../middleware/auth';

const router = Router();

const usernameRegex = /^\S+$/; // No spaces allowed

router.get('/active', verifyToken, renewToken, async (req: AuthRequest, res, next) => {
  try {
    const userRole = req.user?.role as UserRole;

    const allowedRolesForActiveUsers = ['admin', 'gerente', 'developer'];
    if (!userRole || !allowedRolesForActiveUsers.includes(userRole)) {
      throw new UnauthorizedError('No tienes permiso para ver esta información');
    }

    const rolesToExcludeFromActiveUsers: UserRole[] = [];
    if (userRole === 'developer') {
      rolesToExcludeFromActiveUsers.push('admin');
    }

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const activeUserConditions = [
      eq(users.isActive, true),
      sql`${users.lastActivityAt} IS NOT NULL AND ${users.lastActivityAt} > ${thirtyMinutesAgo.toISOString()}`,
    ];

    if (rolesToExcludeFromActiveUsers.length > 0) {
      activeUserConditions.push(notInArray(users.role, rolesToExcludeFromActiveUsers));
    }

    const activeUsers = await db
      .select({
        id: users.id,
        username: users.username,
        realname: users.realname,
        role: users.role,
        lastActivityAt: users.lastActivityAt,
      })
      .from(users)
      .where(and(...activeUserConditions))
      .orderBy(desc(users.lastActivityAt));

    res.json(activeUsers);
  } catch (error) {
    next(error);
  }
});

router.get('/', verifyToken, renewToken, async (req: AuthRequest, res, next) => {
  try {
    const requesterRole = req.user?.role as UserRole;
    if (!requesterRole) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const rolesToExclude: UserRole[] = [];
    if (requesterRole === 'developer') {
      rolesToExclude.push('admin');
    } else if (requesterRole === 'deposito') {
      rolesToExclude.push('admin', 'developer');
    }

    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const searchQuery = req.query.search as string | undefined;

    if (limit <= 0 || offset < 0) {
      throw new BadRequestError('Parámetros de paginación inválidos');
    }

    const userListConditions = [];
    if (rolesToExclude.length > 0) {
      userListConditions.push(notInArray(users.role, rolesToExclude));
    }
    if (searchQuery) {
      const searchPattern = `%${searchQuery.toLowerCase()}%`;
      userListConditions.push(
        or(
          ilike(users.username, searchPattern),
          ilike(users.realname, searchPattern),
          ilike(users.email, searchPattern), // Added email to search
          ilike(users.role, searchPattern),
        ),
      );
    }

    const roleHierarchyCase = sql`CASE ${sql.join(
      roleHierarchy.map((role, index) => sql`WHEN ${users.role} = ${role} THEN ${index}`),
      sql` `,
    )} ELSE ${roleHierarchy.length} END`;

    const query = db
      .select({
        id: users.id,
        username: users.username,
        realname: users.realname,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        // Removed id_personal, des_personal, canViewOthers
      })
      .from(users)
      .where(userListConditions.length > 0 ? and(...userListConditions) : undefined)
      .orderBy(asc(roleHierarchyCase), asc(users.realname))
      .limit(limit)
      .offset(offset);

    const userList = await query;

    const totalCountQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(userListConditions.length > 0 ? and(...userListConditions) : undefined);

    const [{ count: totalCount }] = await totalCountQuery;

    res.json({ users: userList, totalCount: totalCount ?? 0 });
  } catch (error) {
    next(error);
  }
});

const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .regex(usernameRegex, 'El nombre de usuario no puede contener espacios'),
  realname: z.string().min(3, 'El nombre real debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(allAvailableRoles), // Use allAvailableRoles from shared types directly
  email: z.string().email('Email inválido').optional().or(z.literal('')).or(z.null()),
  // Removed id_personal, canViewOthers
});

router.post('/', verifyToken, renewToken, async (req: AuthRequest, res, next) => {
  try {
    const requesterRole = req.user?.role as UserRole;
    if (!requesterRole) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }

    const { username, realname, password, role, email } = validation.data;

    if (!canAssignRole(requesterRole, role)) {
      // Use imported canAssignRole
      throw new UnauthorizedError('No tienes permiso para crear usuarios con este rol');
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (existingUser) {
      throw new ConflictError('El nombre de usuario ya existe');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        realname,
        passwordHash,
        role,
        email: email || null,
        mustChangePassword: true,
        // Removed idPersonal and canViewOthers
      })
      .returning({
        id: users.id,
        username: users.username,
        realname: users.realname,
        role: users.role,
        isActive: users.isActive,
      });

    res.status(201).json({ message: 'Usuario creado exitosamente', user: newUser });
  } catch (error) {
    next(error);
  }
});

const updateUserSchema = z.object({
  realname: z.string().min(3, 'El nombre real debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')).or(z.null()),
  role: z.enum(allAvailableRoles), // Use allAvailableRoles from shared types directly
  isActive: z.boolean(),
  // Removed id_personal, canViewOthers
});

router.put('/:id', verifyToken, renewToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new BadRequestError('ID de usuario inválido');
    }

    const requesterId = req.user?.id;
    const requesterRole = req.user?.role as UserRole;
    if (!requesterId || !requesterRole) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const validation = updateUserSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }

    const { realname, email, role, isActive } = validation.data;

    const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!targetUser) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (requesterId === userId) {
      if (targetUser.role !== role) {
        throw new UnauthorizedError('No puedes modificar tu propio rol');
      }
      if (targetUser.isActive !== isActive) {
        throw new UnauthorizedError('No puedes modificar tu propio estado de actividad');
      }
    }

    if (
      !canAssignRole(requesterRole, targetUser.role as UserRole) ||
      !canAssignRole(requesterRole, role)
    ) {
      throw new UnauthorizedError(
        'No tienes permiso para modificar este usuario o asignarle este rol',
      );
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        realname,
        email: email || null,
        role, // This should now be correctly typed as UserRole
        isActive,
        updatedAt: new Date(),
        // Removed idPersonal and canViewOthers
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        realname: users.realname,
        role: users.role,
        isActive: users.isActive,
      });

    if (!updatedUser) {
      throw new NotFoundError('Usuario no encontrado o no se pudo actualizar');
    }

    res.json({ message: 'Usuario actualizado exitosamente', user: updatedUser });
  } catch (error) {
    next(error);
  }
});

const toggleStatusSchema = z.object({
  isActive: z.boolean(),
});

router.patch('/:id/status', verifyToken, renewToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new BadRequestError('ID de usuario inválido');
    }

    const requesterId = req.user?.id;
    const requesterRole = req.user?.role as UserRole;
    if (!requesterId || !requesterRole) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const validation = toggleStatusSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }

    const { isActive } = validation.data;

    const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!targetUser) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (requesterId === userId) {
      throw new UnauthorizedError('No puedes cambiar tu propio estado de actividad');
    }

    if (!canAssignRole(requesterRole, targetUser.role as UserRole)) {
      // Use imported canAssignRole
      throw new UnauthorizedError('No tienes permiso para cambiar el estado de este usuario');
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        isActive: users.isActive,
      });

    if (!updatedUser) {
      throw new NotFoundError('Usuario no encontrado o no se pudo actualizar el estado');
    }

    res.json({ message: 'Estado del usuario actualizado exitosamente', user: updatedUser });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reset-password', verifyToken, renewToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new BadRequestError('ID de usuario inválido');
    }

    const requesterId = req.user?.id;
    const requesterRole = req.user?.role as UserRole;
    if (!requesterId || !requesterRole) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!targetUser) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (requesterId === userId) {
      throw new UnauthorizedError(
        'No puedes resetear tu propia contraseña desde aquí. Usa la opción "Cambiar Contraseña".',
      );
    }

    if (!canAssignRole(requesterRole, targetUser.role as UserRole)) {
      // Use imported canAssignRole
      throw new UnauthorizedError('No tienes permiso para resetear la contraseña de este usuario');
    }

    const defaultPasswordHash = await bcrypt.hash('Clave123', 10);

    const [updatedUser] = await db
      .update(users)
      .set({
        passwordHash: defaultPasswordHash,
        mustChangePassword: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        mustChangePassword: users.mustChangePassword,
      });

    if (!updatedUser) {
      throw new NotFoundError('Usuario no encontrado o no se pudo resetear la contraseña');
    }

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