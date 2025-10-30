import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../../shared/types';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { env } from '../lib/config';

export const renewToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user) {
    // Rutas que no deben actualizar lastActivityAt
    const excludedPaths = [
      '/api/users/active',
      // Removed sync status paths
    ];

    // Verificar si la ruta actual está en la lista de excluidas
    const isExcludedPath = excludedPaths.some((path) => req.originalUrl.startsWith(path));

    // Solo actualizar lastActivityAt si el usuario no está forzado a cambiar la contraseña
    // Y si la ruta actual NO es una de las excluidas
    if (!req.user.mustChangePassword && !isExcludedPath) {
      try {
        await db.update(users).set({ lastActivityAt: new Date() }).where(eq(users.id, req.user.id));
      } catch (error) {
        console.error('Error updating last activity:', error);
      }
    }

    const tokenPayload = {
      id: req.user.id,
      username: req.user.username,
      realname: req.user.realname,
      role: req.user.role,
      mustChangePassword: req.user.mustChangePassword,
      // Removed hasChessConfig and canViewOthers
    };

    // Determine token expiration based on mustChangePassword status
    const expiresIn = req.user.mustChangePassword ? '2m' : '30m'; // 2 minutes if forced, 30 minutes otherwise
    const maxAge = req.user.mustChangePassword ? 2 * 60 * 1000 : 30 * 60 * 1000; // 2 minutes in milliseconds

    const token = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn });

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAge,
    });
  }
  next();
};