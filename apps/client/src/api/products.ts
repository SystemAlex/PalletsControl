import { ApiError, fetchJson } from '../utils/api';
import { ArticuloRecord } from '../../../shared/types';

export const fetchProductById = async (id: number): Promise<ArticuloRecord> => {
  const result = await fetchJson<ArticuloRecord>(`/api/products/${id}`);
  if (typeof result === 'string') {
    throw new ApiError(result, 500);
  }
  return result;
};

export const fetchProductsList = async (searchQuery: string): Promise<ArticuloRecord[]> => {
  const url = `/api/products?search=${encodeURIComponent(searchQuery)}&limit=50`; // Limitar a 50 resultados
  const result = await fetchJson<ArticuloRecord[]>(url);
  if (typeof result === 'string') {
    throw new ApiError(result, 500);
  }
  return result;
};
