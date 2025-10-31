import { Router } from 'express';
import { z } from 'zod'; // Se eliminó ZodIssue
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users, loginHistory } from '../db/schema';
import { eq } from 'drizzle-orm';
import { BadRequestError, ConflictError, UnauthorizedError } from '../lib/errors';
import { AuthRequest, allAvailableRoles } from '../../shared/types';
import { renewToken } from '../middleware/session';
import { loginRateLimiter } from '../middleware/rateLimit';
import { env } from '../lib/config';
import { verifyToken } from '../middleware/auth';

const router = Router();

const usernameRegex = /^\S+$/; // No se permiten espacios

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .regex(usernameRegex, 'El nombre de usuario no puede contener espacios'),
  realname: z.string().min(3, 'El nombre real debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(allAvailableRoles),
  email: z.string().email('Email inválido').optional(),
  idEmpresa: z.coerce.number().min(1, 'ID de Empresa inválido').optional(), // Permitir opcional en el registro
});

// Definir loginSchema
const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'El nombre de usuario es requerido')
    .regex(usernameRegex, 'El nombre de usuario no puede contener espacios'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

router.post('/register', async (req, res, next) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', ')); // Tipar explícitamente 'e'
    }

    const { username, realname, password, role, email, idEmpresa } = validation.data;

    // Lógica de asignación de idEmpresa: 1 para admin/developer, requerido para otros
    let finalIdEmpresa = idEmpresa;
    if (role === 'admin' || role === 'developer') {
      finalIdEmpresa = 1; // Asignar a la empresa 1 por defecto
    } else if (!finalIdEmpresa) {
      throw new BadRequestError(
        'Los usuarios con rol de depósito o gerente deben tener una empresa asignada.',
      );
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
        idEmpresa: finalIdEmpresa, // Usar el idEmpresa final
      })
      .returning({
        id: users.id,
        username: users.username,
        realname: users.realname,
        role: users.role,
        idEmpresa: users.idEmpresa,
      });

    res.status(201).json({ message: 'Usuario creado exitosamente', user: newUser });
  } catch (error) {
    next(error);
  }
});

router.post('/login', loginRateLimiter, async (req, res, next) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', ')); // Tipar explícitamente 'e'
    }

    const { username, password } = validation.data;

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) {
      throw new UnauthorizedError('Usuario o contraseña inválidos');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    const loginSuccess = passwordMatch && user.isActive;

    // Siempre insertar el registro de historial de inicio de sesión
    await db.insert(loginHistory).values({
      userId: user.id,
      success: loginSuccess,
    });

    if (!passwordMatch) {
      throw new UnauthorizedError('Usuario o contraseña inválidos');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('La cuenta del usuario está inactiva');
    }

    // Ya no es necesario validar idEmpresa === null, ya que es NOT NULL en la DB.
    // Si el usuario existe, tiene un idEmpresa.

    // Solo actualizar lastLoginAt y lastActivityAt si el usuario no está forzado a cambiar la contraseña
    if (!user.mustChangePassword) {
      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          lastActivityAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    // Determinar la expiración del token basándose en el estado mustChangePassword
    const expiresIn = user.mustChangePassword ? '2m' : '30m'; // 2 minutos si es forzado, 30 minutos en caso contrario
    const maxAge = user.mustChangePassword ? 2 * 60 * 1000 : 30 * 60 * 1000; // 2 minutos en milisegundos

    // Usar la estructura de AuthRequest['user'] para el payload del token
    const tokenPayload: AuthRequest['user'] = {
      id: user.id,
      username: user.username,
      realname: user.realname,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      idEmpresa: user.idEmpresa, // Incluir idEmpresa (ahora siempre es number)
    };
    const token = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn });

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAge,
    });

    const decoded = jwt.decode(token) as { exp: number };
    res.json({
      message: 'Login exitoso',
      user: { ...tokenPayload, expiresAt: decoded.exp * 1000 },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', verifyToken, async (req: AuthRequest, res, next) => {
  try {
    if (req.user?.id) {
      await db
        .update(users)
        .set({ lastActivityAt: null }) // Establecer lastActivityAt a NULL al cerrar sesión
        .where(eq(users.id, req.user.id));
    }
    res.clearCookie('authToken');
    res.status(200).json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    console.error('Error durante el cierre de sesión:', error);
    next(error);
  }
});

const changePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
    .regex(/[A-Z]/, 'La nueva contraseña debe contener al menos una letra mayúscula')
    .regex(/\d/, 'La nueva contraseña debe contener al menos un número'),
  currentPassword: z.string().optional(),
});

router.post('/change-password', verifyToken, renewToken, async (req: AuthRequest, res, next) => {
  try {
    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }

    const { newPassword, currentPassword } = validation.data;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado');
    }

    if (!user.mustChangePassword) {
      if (!currentPassword) {
        throw new BadRequestError('Se requiere la contraseña actual');
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedError('La contraseña actual es incorrecta');
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar usuario en la DB
    await db
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: false,
        updatedAt: new Date(),
        lastLoginAt: new Date(), // Actualizar lastLoginAt y lastActivityAt al cambiar la contraseña con éxito
        lastActivityAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Obtener datos de usuario actualizados para incluir en el nuevo token
    const updatedUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!updatedUser) {
      throw new Error(
        'Error al recuperar el usuario actualizado después del cambio de contraseña.',
      );
    }

    // Crear un nuevo token con el estado mustChangePassword actualizado
    const newTokenPayload: AuthRequest['user'] = {
      id: updatedUser.id,
      username: updatedUser.username,
      realname: updatedUser.realname,
      role: updatedUser.role,
      mustChangePassword: updatedUser.mustChangePassword, // Esto ahora será falso
      idEmpresa: updatedUser.idEmpresa, // Incluir idEmpresa
    };
    const newToken = jwt.sign(newTokenPayload, env.JWT_SECRET, { expiresIn: '30m' }); // Después de cambiar la contraseña, establecer la expiración normal

    // Limpiar la cookie antigua y establecer la nueva
    res.clearCookie('authToken');
    res.cookie('authToken', newToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000,
    });

    const decodedNewToken = jwt.decode(newToken) as { exp: number };

    res.json({
      message: 'Contraseña actualizada exitosamente',
      user: { ...newTokenPayload, expiresAt: decodedNewToken.exp * 1000 },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', verifyToken, renewToken, async (req: AuthRequest, res) => {
  const token = req.cookies.authToken;

  // Comprobación defensiva: el token debería existir si verifyToken pasó, pero seamos cautelosos.
  if (!token) {
    console.error(
      '[/api/auth/me] El token es inesperadamente nulo/indefinido después de verifyToken.',
    );
    return res.status(401).json({ message: 'Falta el token de autenticación.' });
  }

  const decoded = jwt.decode(token);

  // Comprobación robusta del payload decodificado
  if (!decoded || typeof decoded === 'string' || !('exp' in decoded)) {
    console.error(
      '[/api/auth/me] El payload del token decodificado es inválido o le falta la expiración:',
      decoded,
    );
    return res.status(401).json({ message: 'Payload de token inválido o falta la expiración.' });
  }

  const expiresAt = (decoded as { exp: number }).exp * 1000;

  res.json({
    id: req.user?.id,
    username: req.user?.username,
    realname: req.user?.realname,
    role: req.user?.role,
    mustChangePassword: req.user?.mustChangePassword,
    idEmpresa: req.user?.idEmpresa, // Incluir idEmpresa
    expiresAt: expiresAt,
  });
});

export default router;
