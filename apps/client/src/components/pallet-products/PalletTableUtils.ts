import { PalletPositionWithProducts, ProductInPallet } from '../../../../shared/types';
import { addMonths, isValid, isPast } from 'date-fns';

export type ExpirationStatus = 'danger' | 'warning' | 'normal' | 'expired';
export type ExpirationFilter = 'expired' | '3months' | '5months' | 'normal' | null;

export interface FlatPalletProductRow extends ProductInPallet {
  fila: string;
  posicion: number;
  positionId: number; // ID of the pallet position
  vencimientoDate: Date | null;
  positionDisplay: string;
}

export interface PositionGroup {
  positionKey: string;
  products: FlatPalletProductRow[];
  originalPositionData: PalletPositionWithProducts;
}

// Utility function to normalize strings for search
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export function flattenData(data: PalletPositionWithProducts[]): FlatPalletProductRow[] {
  const flatData: FlatPalletProductRow[] = [];
  data.forEach((position) => {
    position.products.forEach((product) => {
      flatData.push({
        ...product,
        fila: position.fila,
        posicion: position.posicion,
        positionId: position.id,
        vencimientoDate: product.vencimiento ? new Date(product.vencimiento + 'T00:00:00') : null,
        positionDisplay: `${position.fila}${position.posicion}`,
      });
    });
  });
  return flatData;
}

// Centralized function for expiration status
export function getExpirationStatus(dateString: string | null, today: Date): ExpirationStatus {
  if (!dateString) return 'normal';

  const vtoDate = new Date(dateString + 'T00:00:00');

  if (!isValid(vtoDate)) return 'normal';

  if (isPast(vtoDate)) {
    return 'expired';
  }

  const threeMonthsFromNow = addMonths(today, 3);
  const fiveMonthsFromNow = addMonths(today, 5);

  if (vtoDate <= threeMonthsFromNow) {
    return 'danger';
  } else if (vtoDate <= fiveMonthsFromNow) {
    return 'warning';
  } else {
    return 'normal';
  }
}

// Centralized function for expiration filtering logic
export const productMatchesExpirationFilter = (
  product: ProductInPallet,
  filter: ExpirationFilter,
  today: Date,
): boolean => {
  if (filter === null) return true;
  if (!product.vencimiento) return filter === 'normal';

  const status = getExpirationStatus(product.vencimiento, today);

  if (filter === 'expired') return status === 'expired';
  if (filter === '3months') return status === 'danger';
  if (filter === '5months') return status === 'warning';
  if (filter === 'normal') return status === 'normal';

  return false;
};

// Utility to group sorted flat rows by Fila and Position
export function groupFlatRowsByFila(
  sortedRows: { item: FlatPalletProductRow }[],
  filteredData: PalletPositionWithProducts[], // Datos ya filtrados por hook (incluye vacíos si la búsqueda coincidió)
  activeSortColumn: string,
): [string, PositionGroup[]][] {
  const map = new Map<string, PositionGroup[]>();

  // 1. Crear un mapa de productos ordenados por su clave de posición (solo productos que pasaron los filtros)
  const sortedProductsByPosition = new Map<string, FlatPalletProductRow[]>();
  sortedRows.forEach((row) => {
    const key = `${row.item.fila}-${row.item.posicion}`;
    if (!sortedProductsByPosition.has(key)) sortedProductsByPosition.set(key, []);
    sortedProductsByPosition.get(key)!.push(row.item);
  });

  let orderedPositionGroups: PositionGroup[] = [];
  const processedKeys = new Set<string>();

  // 2. Iterar sobre los datos filtrados (filteredData) para obtener el orden de Fila/Posición.
  // Estos datos ya contienen las posiciones vacías si la búsqueda coincidió.

  if (activeSortColumn === 'positionDisplay') {
    // Si ordenamos por posición, el orden de filteredData es el correcto.
    filteredData.forEach((pos) => {
      const positionKey = `${pos.fila}-${pos.posicion}`;
      const products = sortedProductsByPosition.get(positionKey) || [];

      orderedPositionGroups.push({
        positionKey,
        products: products,
        originalPositionData: pos,
      });
      processedKeys.add(positionKey);
    });
  } else {
    // Si ordenamos por producto, necesitamos que los grupos ocupados (que están en sortedRows)
    // aparezcan primero, seguidos por los grupos vacíos (que están en filteredData pero no en sortedRows).

    const occupiedGroups: PositionGroup[] = [];
    const emptyGroups: PositionGroup[] = [];

    // a) Procesar grupos ocupados en el orden del sort de producto
    sortedProductsByPosition.forEach((products, positionKey) => {
      const originalPosData = filteredData.find((p) => `${p.fila}-${p.posicion}` === positionKey);
      if (originalPosData) {
        occupiedGroups.push({
          positionKey,
          products: products,
          originalPositionData: originalPosData,
        });
        processedKeys.add(positionKey);
      }
    });

    // b) Procesar grupos vacíos (que pasaron el filtro/búsqueda en el hook)
    // Iteramos sobre filteredData para encontrar las posiciones que no tienen productos
    // pero que fueron incluidas por la búsqueda de Fila/Posición.
    filteredData.forEach((pos) => {
      const positionKey = `${pos.fila}-${pos.posicion}`;
      if (!processedKeys.has(positionKey) && pos.products.length === 0) {
        emptyGroups.push({
          positionKey,
          products: [],
          originalPositionData: pos,
        });
        processedKeys.add(positionKey);
      }
    });

    // Combinar: Ocupados (ordenados por producto) + Vacíos (ordenados por posición)
    orderedPositionGroups = [...occupiedGroups, ...emptyGroups];
  }

  // 3. Group the ordered PositionGroups by Fila
  orderedPositionGroups.forEach((group) => {
    const filaKey = group.originalPositionData.fila;
    if (!map.has(filaKey)) map.set(filaKey, []);
    map.get(filaKey)!.push(group);
  });

  // 4. Return the result
  return Array.from(map.entries());
}
