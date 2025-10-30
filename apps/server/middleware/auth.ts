import { Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { UnauthorizedError } from '../lib/errors';
import { env } from '../lib/config';
import { AuthRequest } from '../../shared/types'; // Removed UserRole

export const verifyToken = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = req.cookies.authToken;
  if (!token) {
    return next(new UnauthorizedError('No se proporcionó un token'));
  }

  let decoded: string | JwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    return next(new UnauthorizedError('Token inválido'));
  }

  if (typeof decoded === 'string') {
    return next(new UnauthorizedError('Payload de token inesperado'));
  }

  // Cast decoded payload to the expected user structure from AuthRequest
  const payload = decoded as AuthRequest['user'];

  // Ensure payload has the required properties before assigning to req.user
  if (
    !payload ||
    typeof payload.id === 'undefined' ||
    !payload.username ||
    !payload.realname ||
    !payload.role
  ) {
    return next(new UnauthorizedError('Payload de token incompleto o inválido'));
  }

  req.user = {
    id: payload.id,
    username: payload.username,
    realname: payload.realname,
    role: payload.role,
    mustChangePassword: payload.mustChangePassword,
    // Removed hasChessConfig and canViewOthers
  };

  next();
};