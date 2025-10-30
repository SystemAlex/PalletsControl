export interface PalletPositionRecord {
  id: number;
  fila: string;
  posicion: number;
  habilitado: boolean;
}

export interface CreatePalletPositionPayload {
  fila: string;
  posicion: number;
  habilitado?: boolean;
}

export interface UpdatePalletPositionPayload {
  habilitado: boolean;
}
