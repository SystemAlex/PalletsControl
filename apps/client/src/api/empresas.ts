import { ApiError, fetchJson } from '../utils/api';
import { EmpresaRecord, CreateEmpresaPayload, UpdateEmpresaPayload } from '../../../shared/types';

export const fetchEmpresas = async (
  page: number,
  limit: number,
  searchQuery: string,
): Promise<{ empresas: EmpresaRecord[]; totalCount: number }> => {
  const offset = (page - 1) * limit;
  let url = `/api/empresas?limit=${limit}&offset=${offset}`;
  if (searchQuery) {
    url += `&search=${encodeURIComponent(searchQuery)}`;
  }
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Error al obtener empresas', res.status);
  }
  return data;
};

export const createEmpresa = async (
  payload: CreateEmpresaPayload,
): Promise<{ message: string; empresa: EmpresaRecord }> => {
  const res = await fetch('/api/empresas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Error al crear la empresa', res.status);
  }
  return data;
};

export const updateEmpresa = async (data: {
  idEmpresa: number;
  payload: UpdateEmpresaPayload;
}): Promise<{ message: string; empresa: EmpresaRecord }> => {
  const { idEmpresa, payload } = data;
  const res = await fetch(`/api/empresas/${idEmpresa}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const dataRes = await res.json();
  if (!res.ok) {
    throw new ApiError(dataRes.message || 'Error al actualizar la empresa', res.status);
  }
  return dataRes;
};

export const deleteEmpresa = async (
  idEmpresa: number,
): Promise<{ message: string; empresa: EmpresaRecord }> => {
  const res = await fetch(`/api/empresas/${idEmpresa}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Error al eliminar la empresa', res.status);
  }
  return data;
};