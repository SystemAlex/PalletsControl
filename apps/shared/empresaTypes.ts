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
  logoUrl: string | null; // Nuevo campo
  fechaAlta: string; // YYYY-MM-DD
  activo: boolean;
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
  logoUrl?: string | null; // Nuevo campo
  activo?: boolean;
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
  logoUrl?: string | null; // Nuevo campo
  activo?: boolean;
}