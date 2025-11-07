export type FrecuenciaPago = 'mensual' | 'anual' | 'permanente';

export interface EmpresaRecord {
  idEmpresa: number;
  razonSocial: string;
  nombreFantasia: string | null;
  cuit: string;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
  pais: string | null;
  telefono: string | null;
  email: string | null;
  sitioWeb: string | null;
  sector: string | null;
  logoUrl: string | null;
  fechaAlta: string; // YYYY-MM-DD
  activo: boolean;
  frecuenciaPago: FrecuenciaPago;
  // Payment Status Fields
  lastPaymentDate: string | null; // YYYY-MM-DD
  nextPaymentDate: string | null; // YYYY-MM-DD
  isBlocked: boolean;
}

export interface CreateEmpresaPayload {
  razonSocial: string;
  nombreFantasia?: string | null;
  cuit: string;
  direccion?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
  pais?: string | null;
  telefono?: string | null;
  email?: string | null;
  sitioWeb?: string | null;
  sector?: string | null;
  logoUrl?: string | null;
  activo?: boolean;
  frecuenciaPago?: FrecuenciaPago;
}

export interface UpdateEmpresaPayload {
  razonSocial?: string;
  nombreFantasia?: string | null;
  cuit?: string;
  direccion?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
  pais?: string | null;
  telefono?: string | null;
  email?: string | null;
  sitioWeb?: string | null;
  sector?: string | null;
  logoUrl?: string | null;
  activo?: boolean;
  frecuenciaPago?: FrecuenciaPago;
}
