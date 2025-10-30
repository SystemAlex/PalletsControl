export interface PagoRecord {
  idPago: number;
  idEmpresa: number;
  fechaPago: string; // YYYY-MM-DD
  monto: number;
  metodo: string | null;
  observaciones: string | null;
}

export interface CreatePagoPayload {
  idEmpresa: number;
  fechaPago?: string | null; // YYYY-MM-DD
  monto: number;
  metodo?: string | null;
  observaciones?: string | null;
}

export interface UpdatePagoPayload {
  fechaPago?: string | null; // YYYY-MM-DD
  monto?: number;
  metodo?: string | null;
  observaciones?: string | null;
}
