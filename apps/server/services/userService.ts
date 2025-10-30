import { db } from '../db';
import { users, empresas } from '../db/schema';
import {
  UserRole,
  UserApiResponse,
  ActiveUser,
  roleHierarchy,
  canAssignRole,
} from '../../shared/types';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../lib/errors';
import { desc, and, eq, notInArray, sql, ilike, or, asc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Helper para determinar qué roles el solicitante puede ver/gestionar
const getRolesToExclude = (requesterRole: UserRole): UserRole[] => {
  const rolesToExclude: UserRole[] = [];
  if (requesterRole === 'developer') {
    rolesToExclude.push('admin', 'gerente');
  } else if (requesterRole === 'deposito') {
    rolesToExclude.push('admin', 'gerente', 'developer');
  }
  return rolesToExclude;
};

// Helper para construir la cláusula WHERE base para filtrar por empresa y excluir roles
const getBaseUserConditions = (
  requesterRole: UserRole,
  requesterIdEmpresa: number | undefined,
  rolesToExclude: UserRole[],
) => {
  const conditions = [];

  if (rolesToExclude.length > 0) {
    conditions.push(notInArray(users.role, rolesToExclude));
  }

  // Aplicar filtro de empresa si no es admin
  if (requesterRole !== 'admin') {
    if (!requesterIdEmpresa) {
      throw new UnauthorizedError('Tu cuenta no está asignada a una empresa.');
    }
    conditions.push(eq(users.idEmpresa, requesterIdEmpresa));
  }

  return conditions;
};

// --- Fetch Active Users ---
export async function getActiveUsers(
  requesterRole: UserRole,
  requesterIdEmpresa: number | undefined,
): Promise<ActiveUser[]> {
  const allowedRolesForActiveUsers = ['admin', 'gerente', 'developer'];
  if (!allowedRolesForActiveUsers.includes(requesterRole)) {
    return []; // Retornar vacío si el rol no está permitido
  }

  const rolesToExcludeFromActiveUsers: UserRole[] = [];
  if (requesterRole === 'developer') {
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

  // Aplicar filtro de empresa si no es admin
  if (requesterRole !== 'admin') {
    if (!requesterIdEmpresa) {
      throw new UnauthorizedError('Tu cuenta no está asignada a una empresa.');
    }
    activeUserConditions.push(eq(users.idEmpresa, requesterIdEmpresa));
  }

  const activeUsers = await db
    .select({
      id: users.id,
      username: users.username,
      realname: users.realname,
      role: users.role,
      lastActivityAt: sql<string>`${users.lastActivityAt}::text`.as('lastActivityAt'), // Convertir a string
      idEmpresa: users.idEmpresa,
    })
    .from(users)
    .where(and(...activeUserConditions))
    .orderBy(desc(users.lastActivityAt));

  return activeUsers as ActiveUser[]; // Error 1 corregido por la conversión SQL
}

// --- Fetch Users (Paginated List) ---
export async function getUsers(
  requesterRole: UserRole,
  requesterIdEmpresa: number | undefined,
  limit: number,
  offset: number,
  searchQuery?: string,
): Promise<{ users: UserApiResponse[]; totalCount: number }> {
  const rolesToExclude = getRolesToExclude(requesterRole);
  const baseConditions = getBaseUserConditions(requesterRole, requesterIdEmpresa, rolesToExclude);

  const userListConditions = [...baseConditions];

  if (searchQuery) {
    const searchPattern = `%${searchQuery.toLowerCase()}%`;
    userListConditions.push(
      or(
        ilike(users.username, searchPattern),
        ilike(users.realname, searchPattern),
        ilike(users.email, searchPattern),
        ilike(users.role, searchPattern),
      )!, // Error 2: Añadir ! para asegurar que or no sea undefined
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
      lastLoginAt: sql<string | null>`${users.lastLoginAt}::text`.as('lastLoginAt'), // Convertir a string
      createdAt: sql<string>`${users.createdAt}::text`.as('createdAt'), // Convertir a string
      idEmpresa: users.idEmpresa,
      mustChangePassword: users.mustChangePassword, // Incluir mustChangePassword
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

  return { users: userList as UserApiResponse[], totalCount: totalCount ?? 0 }; // Error 3 corregido por la conversión SQL
}

// --- Create User ---
export async function createUser(
  payload: {
    username: string;
    realname: string;
    password: string;
    role: UserRole;
    email?: string | null;
    idEmpresa?: number;
  },
  requesterRole: UserRole,
  requesterIdEmpresa: number | undefined,
): Promise<UserApiResponse> {
  const { username, realname, password, role, email, idEmpresa } = payload;

  if (!canAssignRole(requesterRole, role)) {
    throw new UnauthorizedError('No tienes permiso para crear usuarios con este rol');
  }

  let finalIdEmpresa: number;

  if (requesterRole === 'admin') {
    finalIdEmpresa = idEmpresa ?? 1;
  } else {
    if (!requesterIdEmpresa) {
      throw new UnauthorizedError('Tu cuenta no está asignada a una empresa.');
    }
    if (idEmpresa && idEmpresa !== requesterIdEmpresa) {
      throw new UnauthorizedError('Solo puedes crear usuarios para tu propia empresa.');
    }
    finalIdEmpresa = requesterIdEmpresa;
  }

  if (role === 'admin' || role === 'developer') {
    finalIdEmpresa = 1;
  } else {
    if (!finalIdEmpresa) {
      throw new BadRequestError(
        'Los usuarios con rol de depósito o gerente deben tener una empresa asignada.',
      );
    }
  }

  const existingEmpresa = await db.query.empresas.findFirst({
    where: eq(empresas.idEmpresa, finalIdEmpresa),
  });
  if (!existingEmpresa) {
    throw new NotFoundError(`Empresa con ID ${finalIdEmpresa} no encontrada.`);
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
      idEmpresa: finalIdEmpresa,
    })
    .returning({
      id: users.id,
      username: users.username,
      realname: users.realname,
      role: users.role,
      isActive: users.isActive,
      idEmpresa: users.idEmpresa,
      mustChangePassword: users.mustChangePassword,
      createdAt: sql<string>`${users.createdAt}::text`.as('createdAt'),
      lastLoginAt: sql<string | null>`${users.lastLoginAt}::text`.as('lastLoginAt'),
    });

  return newUser as UserApiResponse;
}

// --- Update User ---
export async function updateUser(
  userId: number,
  payload: {
    realname: string;
    email?: string | null;
    role: UserRole;
    isActive: boolean;
    idEmpresa?: number;
  },
  requesterId: number,
  requesterRole: UserRole,
  requesterIdEmpresa: number | undefined,
): Promise<Omit<UserApiResponse, 'createdAt' | 'lastLoginAt'>> {
  const { realname, email, role, isActive, idEmpresa } = payload;

  const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!targetUser) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // 1. Validación de permisos de rol
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

  // 2. Lógica de asignación de empresa
  let finalIdEmpresa: number;

  if (requesterRole === 'admin') {
    finalIdEmpresa = idEmpresa ?? targetUser.idEmpresa;
  } else {
    if (!requesterIdEmpresa) {
      throw new UnauthorizedError('Tu cuenta no está asignada a una empresa.');
    }
    if (targetUser.idEmpresa !== requesterIdEmpresa) {
      throw new UnauthorizedError('No tienes permiso para modificar usuarios fuera de tu empresa.');
    }
    if (idEmpresa !== undefined && idEmpresa !== requesterIdEmpresa) {
      throw new UnauthorizedError('No puedes cambiar la empresa asignada a este usuario.');
    }
    finalIdEmpresa = requesterIdEmpresa;
  }

  // 3. Validación de empresa para roles admin/developer
  if (role === 'admin' || role === 'developer') {
    finalIdEmpresa = 1;
  } else {
    if (!finalIdEmpresa) {
      throw new BadRequestError(
        'Los usuarios con rol de depósito o gerente deben tener una empresa asignada.',
      );
    }
  }

  const existingEmpresa = await db.query.empresas.findFirst({
    where: eq(empresas.idEmpresa, finalIdEmpresa),
  });
  if (!existingEmpresa) {
    throw new NotFoundError(`Empresa con ID ${finalIdEmpresa} no encontrada.`);
  }

  // Aplicar filtro de empresa para solicitantes no administradores
  const companyFilter =
    requesterRole !== 'admin' ? eq(users.idEmpresa, requesterIdEmpresa!) : undefined;

  const [updatedUser] = await db
    .update(users)
    .set({
      realname,
      email: email || null,
      role,
      isActive,
      idEmpresa: finalIdEmpresa,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, userId), companyFilter))
    .returning({
      id: users.id,
      username: users.username,
      realname: users.realname,
      role: users.role,
      isActive: users.isActive,
      idEmpresa: users.idEmpresa,
      mustChangePassword: users.mustChangePassword,
    });

  if (!updatedUser) {
    throw new NotFoundError('Usuario no encontrado o no se pudo actualizar');
  }

  return updatedUser as Omit<UserApiResponse, 'createdAt' | 'lastLoginAt'>;
}

// --- Toggle User Status ---
export async function toggleUserStatus(
  userId: number,
  isActive: boolean,
  requesterId: number,
  requesterRole: UserRole,
  requesterIdEmpresa: number | undefined,
): Promise<Pick<UserApiResponse, 'id' | 'username' | 'isActive'>> {
  const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!targetUser) {
    throw new NotFoundError('Usuario no encontrado');
  }

  if (requesterId === userId) {
    throw new UnauthorizedError('No puedes cambiar tu propio estado de actividad');
  }

  if (!canAssignRole(requesterRole, targetUser.role as UserRole)) {
    throw new UnauthorizedError('No tienes permiso para cambiar el estado de este usuario');
  }

  // Aplicar filtro de empresa para solicitantes no administradores
  const companyFilter =
    requesterRole !== 'admin' ? eq(users.idEmpresa, requesterIdEmpresa!) : undefined;

  const [updatedUser] = await db
    .update(users)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, userId), companyFilter))
    .returning({
      id: users.id,
      username: users.username,
      isActive: users.isActive,
    });

  if (!updatedUser) {
    throw new NotFoundError('Usuario no encontrado o no se pudo actualizar el estado');
  }

  return updatedUser;
}

// --- Reset User Password ---
export async function resetUserPassword(
  userId: number,
  requesterId: number,
  requesterRole: UserRole,
  requesterIdEmpresa: number | undefined,
): Promise<Pick<UserApiResponse, 'id' | 'username' | 'mustChangePassword'>> {
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
    throw new UnauthorizedError('No tienes permiso para resetear la contraseña de este usuario');
  }

  const defaultPasswordHash = await bcrypt.hash('Clave123', 10);

  // Aplicar filtro de empresa para solicitantes no administradores
  const companyFilter =
    requesterRole !== 'admin' ? eq(users.idEmpresa, requesterIdEmpresa!) : undefined;

  const [updatedUser] = await db
    .update(users)
    .set({
      passwordHash: defaultPasswordHash,
      mustChangePassword: true,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, userId), companyFilter))
    .returning({
      id: users.id,
      username: users.username,
      mustChangePassword: users.mustChangePassword,
    });

  if (!updatedUser) {
    throw new NotFoundError('Usuario no encontrado o no se pudo resetear la contraseña');
  }

  return updatedUser as Pick<UserApiResponse, 'id' | 'username' | 'mustChangePassword'>; // Error 4 corregido
}
