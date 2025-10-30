export interface ProductInPallet {
  id: number;
  codigo: number;
  desArticulo: string;
  bultos: number;
  pallets: boolean;
  vencimiento: string | null; // ISO string
  observaciones: string | null;
}

export interface PalletPositionWithProducts {
  id: number;
  fila: string;
  posicion: number;
  habilitado: boolean;
  products: ProductInPallet[];
}

export interface CreateProductInPalletPayload {
  fila: string;
  posicion: number;
  codigo: number;
  bultos: number;
  pallets: boolean;
  vencimiento: string | null | undefined; // Permitir undefined
  observaciones?: string | null;
}

export interface UpdateProductInPalletPayload {
  bultos?: number;
  pallets?: boolean;
}

export interface ProductSummaryItem {
  codigo: number;
  desArticulo: string;
  bultos: {
    normal: number;
    fiveMonths: number;
    threeMonths: number;
    expired: number;
    total: number;
  };
  pallets: {
    normal: number;
    fiveMonths: number;
    threeMonths: number;
    expired: number;
    total: number;
  };
}
