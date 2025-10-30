import { Request } from 'express';
import { UserRole } from './userTypes';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    realname: string;
    role: UserRole;
    mustChangePassword?: boolean;
    // Removed hasChessConfig and canViewOthers
  };
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  realname: string;
  role: UserRole;
  mustChangePassword?: boolean;
  expiresAt?: number;
  // Removed hasChessConfig and canViewOthers
}

export interface LoginRecord {
  id: number;
  timestamp: string;
  success: boolean;
  username: string | null;
  realname: string | null;
  role: UserRole | null;
  isActive: boolean;
}