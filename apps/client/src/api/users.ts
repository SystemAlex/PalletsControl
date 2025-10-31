import { ApiError, fetchJson } from '../utils/api';
import { UserFormData } from '../components/dialogs/UserDialog';
import { ActiveUser } from '../../../shared/types'; // Removed UserRole, UserApiResponse

export const fetchUsers = async (page: number, limit: number, searchQuery: string) => {
  const offset = (page - 1) * limit;
  let url = `/api/users?limit=${limit}&offset=${offset}`;
  if (searchQuery) {
    url += `&search=${encodeURIComponent(searchQuery)}`;
  }
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Error al obtener usuarios', res.status);
  }
  return data;
};

export const fetchActiveUsers = async (): Promise<ActiveUser[]> => {
  // Removed excludeUserId parameter
  const url = '/api/users/active'; // Always fetch all active users
  const result = await fetchJson<ActiveUser[]>(url);
  if (typeof result === 'string') {
    throw new ApiError(result, 500);
  }
  return result;
};

export const createUser = async (
  payload: Pick<
    UserFormData,
    'username' | 'realname' | 'email' | 'role' | 'isActive' | 'password'
  >,
) => {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Error al crear el usuario', res.status);
  }
  return data;
};

export const updateUser = async (data: {
  id: number;
  payload: Pick<
    UserFormData,
    'realname' | 'email' | 'role' | 'isActive'
  >;
}) => {
  const { id, payload } = data;
  const res = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const dataRes = await res.json();
  if (!res.ok) {
    throw new ApiError(dataRes.message || 'Error al actualizar el usuario', res.status);
  }
  return dataRes;
};

export const toggleUserStatus = async ({ id, isActive }: { id: number; isActive: boolean }) => {
  const res = await fetch(`/api/users/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Error al cambiar el estado del usuario', res.status);
  }
  return data;
};

export const resetPassword = async (id: number) => {
  const res = await fetch(`/api/users/${id}/reset-password`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Error al resetear la contraseña', res.status);
  }
  return data;
};
