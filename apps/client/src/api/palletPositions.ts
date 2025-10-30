import { ApiError, fetchJson } from '../utils/api';
import {
  PalletPositionRecord,
  CreatePalletPositionPayload,
  UpdatePalletPositionPayload,
} from '../../../shared/types';

export const fetchPalletPositions = async (): Promise<PalletPositionRecord[]> => {
  const result = await fetchJson<PalletPositionRecord[]>('/api/pallet-positions');
  if (typeof result === 'string') {
    throw new ApiError(result, 500);
  }
  return result;
};

export const createPalletPosition = async (
  payload: CreatePalletPositionPayload,
): Promise<{ message: string; position: PalletPositionRecord }> => {
  const res = await fetch('/api/pallet-positions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Error al crear la posición de pallet', res.status);
  }
  return data;
};

export const updatePalletPositionStatus = async (
  id: number,
  payload: UpdatePalletPositionPayload,
): Promise<{ message: string; position: PalletPositionRecord }> => {
  const res = await fetch(`/api/pallet-positions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(
      data.message || 'Error al actualizar el estado de la posición de pallet',
      res.status,
    );
  }
  return data;
};

export const deletePalletPosition = async (
  id: number,
): Promise<{ message: string; position: PalletPositionRecord }> => {
  const res = await fetch(`/api/pallet-positions/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Error al eliminar la posición de pallet', res.status);
  }
  return data;
};
