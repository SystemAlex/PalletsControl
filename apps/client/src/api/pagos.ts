import { ApiError } from '../utils/api';
import { CreatePagoPayload, PagoRecord } from '../../../shared/types';

export const createPago = async (
  payload: CreatePagoPayload,
): Promise<{ message: string; pago: PagoRecord }> => {
  const res = await fetch('/api/pagos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.message || 'Error al registrar el pago', res.status);
  }
  return data;
};