import { Request } from 'express';
import { UserRole } from './userTypes';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    realname: string;
    role: UserRole;
    mustChangePassword?: boolean;
    idEmpresa: number; // CAMBIO: Ahora es number
  };
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  realname: string;
  role: UserRole;
  mustChangePassword?: boolean;
  expiresAt?: number;
  idEmpresa: number; // CAMBIO: Ahora es number
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
