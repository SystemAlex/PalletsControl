import { ApiError } from '../utils/api';
import { LoginRecord } from '../../../shared/types'; // Import LoginRecord from shared types

export const fetchLoginHistory = async (
  page: number,
  limit: number,
  searchQuery: string,
): Promise<{ history: LoginRecord[]; totalCount: number }> => {
  const offset = (page - 1) * limit;
  let url = `/api/history/login?limit=${limit}&offset=${offset}`;
  if (searchQuery) {
    url += `&search=${encodeURIComponent(searchQuery)}`;
  }
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Error al obtener historial', res.status);
  }
  return data;
};