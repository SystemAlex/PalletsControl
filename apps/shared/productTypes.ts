export interface ArticuloRecord {
  idArticulo: number;
  desArticulo: string;
  unidadesBulto: number;
  anulado: boolean;
  esCombo: boolean;
  idPresentacionBulto: string;
  idPresentacionUnidad: string;
  codBarraBulto: string;
  bultosPallet: number; // Keep this for reference, but we might not use it for auto-fill
  pesoBulto: number;
  categoria: string | null;
  subCategoria: string | null;
  marca: string | null;
}
// Removed AgrupacionRecord
