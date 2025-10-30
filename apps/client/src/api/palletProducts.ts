import { ApiError, fetchJson } from '../utils/api';
import {
  PalletPositionWithProducts,
  CreateProductInPalletPayload,
  ProductInPallet,
  UpdateProductInPalletPayload,
} from '../../../shared/types';

export const fetchPalletProducts = async (): Promise<PalletPositionWithProducts[]> => {
  const result = await fetchJson<PalletPositionWithProducts[]>('/api/pallet-products');
  if (typeof result === 'string') {
    throw new ApiError(result, 500);
  }
  return result;
};

export const createProductInPallet = async (
  payload: CreateProductInPalletPayload,
): Promise<{ message: string; product: ProductInPallet }> => {
  const res = await fetch('/api/pallet-products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Error al añadir el producto al pallet', res.status);
  }
  return data;
};

export const updateProductInPallet = async (
  id: number,
  payload: UpdateProductInPalletPayload,
): Promise<{ message: string; product: ProductInPallet }> => {
  const res = await fetch(`/api/pallet-products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Error al actualizar el producto en el pallet', res.status);
  }
  return data;
};

export const deleteProductFromPallet = async (
  id: number,
): Promise<{ message: string; product: ProductInPallet }> => {
  const res = await fetch(`/api/pallet-products/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Error al eliminar el producto del pallet', res.status);
  }
  return data;
};
