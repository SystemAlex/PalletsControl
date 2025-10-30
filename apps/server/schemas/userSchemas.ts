import { z } from 'zod';
import { allAvailableRoles } from '../../shared/types';

export const usernameRegex = /^\S+$/; // No spaces allowed

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .regex(usernameRegex, 'El nombre de usuario no puede contener espacios'),
  realname: z.string().min(3, 'El nombre real debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(allAvailableRoles),
  email: z.string().email('Email inválido').optional().or(z.literal('')).or(z.null()),
  idEmpresa: z.coerce.number().min(1, 'ID de Empresa inválido').optional(),
});

export const updateUserSchema = z.object({
  realname: z.string().min(3, 'El nombre real debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')).or(z.null()),
  role: z.enum(allAvailableRoles),
  isActive: z.boolean(),
  idEmpresa: z.coerce.number().min(1, 'ID de Empresa inválido').optional(),
});

export const toggleStatusSchema = z.object({
  isActive: z.boolean(),
});

export const getUsersQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
});
