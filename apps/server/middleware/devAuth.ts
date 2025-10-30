import { Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../lib/config';
import { AuthRequest, UserRole } from '../../shared/types'; // Import AuthRequest and UserRole from shared types

export const devAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.redirect('/');
  }

  let decoded: string | JwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    console.log('Invalid token:', err);
    res.clearCookie('authToken');
    return res.redirect('/');
  }

  if (typeof decoded === 'string') {
    res.clearCookie('authToken');
    return res.redirect('/');
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
    res.clearCookie('authToken');
    return res.redirect('/');
  }

  req.user = {
    id: payload.id,
    username: payload.username,
    realname: payload.realname,
    role: payload.role,
    mustChangePassword: payload.mustChangePassword,
    // Removed hasChessConfig and canViewOthers
  };

  const allowedRoles: UserRole[] = ['admin', 'developer'];
  if (!allowedRoles.includes(req.user.role as UserRole)) {
    return res.redirect('/');
  }

  next();
};