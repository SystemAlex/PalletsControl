export type UserRole = 'admin' | 'developer' | 'deposito';

export const allAvailableRoles = ['admin', 'developer', 'deposito'] as const;

export const roleHierarchy: UserRole[] = ['admin', 'developer', 'deposito'];

export const getRoleHierarchyIndex = (role: UserRole): number => {
  const index = roleHierarchy.indexOf(role);
  return index === -1 ? Infinity : index;
};

export const canAssignRole = (requesterRole: UserRole, targetRole: UserRole): boolean => {
  const requesterIndex = roleHierarchy.indexOf(requesterRole);
  const targetIndex = roleHierarchy.indexOf(targetRole);

  if (requesterIndex === -1 || targetIndex === -1) {
    return false;
  }

  // Admin can assign anyone
  if (requesterRole === 'admin') {
    return true;
  }

  // Developer can assign developer and below
  if (requesterRole === 'developer') {
    return targetIndex >= roleHierarchy.indexOf('developer');
  }

  // Deposito cannot assign any roles
  return false;
};

export interface UserApiResponse {
  id: number;
  username: string;
  realname: string;
  email: string | null;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
  lastLoginAt: string | null;
  // Removed id_personal, des_personal, canViewOthers
}

export interface ActiveUser {
  id: number;
  username: string;
  realname: string;
  role: UserRole;
  lastActivityAt: string;
}