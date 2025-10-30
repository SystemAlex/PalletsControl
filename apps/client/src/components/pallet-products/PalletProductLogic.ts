import { format, isPast } from 'date-fns';
import {
  PalletPositionWithProducts,
  ProductInPallet,
  ProductSummaryItem,
} from '../../../../shared/types';
import {
  ExpirationFilter,
  ExpirationStatus,
  getExpirationStatus,
  normalize,
  productMatchesExpirationFilter,
} from './PalletTableUtils';

// --- Tipos de Salida ---

export interface SuggestedProductInfo {
  id: number;
  fila: string;
  posicion: number;
  descrip: string;
  vencimiento: string;
}

export interface UniqueProduct {
  codigo: number;
  desArticulo: string;
}

export interface UniqueDate {
  dateString: string; // dd/MM/yyyy format
  isoString: string; // yyyy-MM-dd format
  status: ExpirationStatus;
  text: string;
}

// --- Lógica de Filtrado ---

const positionMatchesSearch = (pos: PalletPositionWithProducts, tokens: string[]) => {
  const posText = normalize(`${pos.fila}${pos.posicion}`);
  return tokens.every((t) => posText.includes(t));
};

const productMatchesSearch = (product: ProductInPallet, tokens: string[]) => {
  const prodText = normalize(
    `${product.desArticulo ?? ''} ${product.codigo ?? ''} ${product.observaciones ?? ''}`,
  );
  return tokens.every((t) => prodText.includes(t));
};

/**
 * Aplica el filtro de búsqueda de texto.
 * Si la posición coincide, se mantiene con todos sus productos.
 * Si solo los productos coinciden, se mantiene la posición con solo esos productos.
 */
export const applySearchFilter = (
  data: PalletPositionWithProducts[] | undefined,
  searchQuery: string,
): PalletPositionWithProducts[] => {
  if (!data) return [];
  const searchTokens = normalize(searchQuery).split(/\s+/).filter(Boolean);
  if (searchTokens.length === 0) return data;

  return data
    .map((pos) => {
      const matchesPos = positionMatchesSearch(pos, searchTokens);

      // Filtrar productos que coinciden con la búsqueda de texto
      const filteredProducts = pos.products.filter((p) => productMatchesSearch(p, searchTokens));

      // Rule 1: Position matches search (e.g., "S14"). Keep the position with ALL its original products.
      if (matchesPos) {
        return pos;
      }

      // Rule 2: Position does NOT match search, but products DO match (e.g., "12345").
      if (!matchesPos && filteredProducts.length > 0) {
        // Keep the position, but only with the products that matched the search.
        return { ...pos, products: filteredProducts };
      }

      return null;
    })
    .filter((pos): pos is PalletPositionWithProducts => pos !== null);
};

/**
 * Aplica los filtros de Combobox/Expiración sobre los datos base filtrados por búsqueda.
 */
export const applyComboboxAndExpirationFilters = (
  baseFilteredData: PalletPositionWithProducts[],
  productFilterCode: number | null,
  dateFilterString: string | null,
  activeFilter: ExpirationFilter,
  today: Date,
  isComboboxFilterActive: boolean,
): PalletPositionWithProducts[] => {
  let isoDateFilter: string | null = null;
  if (dateFilterString) {
    const selectedDate = calculateUniqueOptions(baseFilteredData, today).uniqueDates.find(
      (d) => d.dateString === dateFilterString,
    );
    isoDateFilter = selectedDate?.isoString || null;
  }

  const productMatchesComboboxFilters = (product: ProductInPallet) => {
    const matchCode = productFilterCode === null || product.codigo === productFilterCode;
    const matchDate = isoDateFilter === null || product.vencimiento === isoDateFilter;
    const matchExp = productMatchesExpirationFilter(product, activeFilter, today);

    return matchCode && matchDate && matchExp;
  };

  return baseFilteredData
    .map((pos) => {
      if (pos.products.length === 0) {
        return isComboboxFilterActive ? null : pos;
      }

      const productsAfterComboboxFilter = pos.products.filter(productMatchesComboboxFilters);

      if (productsAfterComboboxFilter.length > 0) {
        return {
          ...pos,
          products: productsAfterComboboxFilter,
        };
      }
      return null;
    })
    .filter((pos): pos is PalletPositionWithProducts => pos !== null);
};

// --- Lógica de Opciones Únicas ---

export const calculateUniqueOptions = (
  data: PalletPositionWithProducts[] | undefined,
  today: Date,
): { uniqueProducts: UniqueProduct[]; uniqueDates: UniqueDate[] } => {
  if (!data) {
    return { uniqueProducts: [], uniqueDates: [] };
  }

  const uniqueProductsMap = new Map<number, { desArticulo: string; codigo: number }>();
  const uniqueDatesSet = new Set<string>();

  data.forEach((position) => {
    position.products.forEach((product) => {
      // 1. Products
      if (product.codigo && !uniqueProductsMap.has(product.codigo)) {
        uniqueProductsMap.set(product.codigo, {
          desArticulo: product.desArticulo || 'Artículo Desconocido',
          codigo: product.codigo,
        });
      }

      // 2. Dates (using ISO string for uniqueness)
      if (product.vencimiento) {
        uniqueDatesSet.add(product.vencimiento);
      }
    });
  });

  const sortedUniqueProducts: UniqueProduct[] = Array.from(uniqueProductsMap.values()).sort(
    (a, b) => (a.desArticulo || '').localeCompare(b.desArticulo || ''),
  );

  const sortedUniqueDates: UniqueDate[] = Array.from(uniqueDatesSet)
    .map((isoString) => {
      const dateObj = new Date(isoString + 'T00:00:00');
      if (!format(dateObj, 'yyyy-MM-dd')) return null;

      const dateString = format(dateObj, 'dd/MM/yyyy');
      const status = getExpirationStatus(isoString, today);
      let statusText = '';

      if (status === 'expired') statusText = ' VDO';
      else if (status === 'danger') statusText = ' <3M';
      else if (status === 'warning') statusText = ' <5M';

      return {
        dateString,
        isoString,
        status,
        text: dateString + statusText,
      };
    })
    .filter((d): d is UniqueDate => d !== null)
    .sort((a, b) => {
      const dateA = new Date(a.isoString).getTime();
      const dateB = new Date(b.isoString).getTime();
      return dateA - dateB;
    });

  return {
    uniqueProducts: sortedUniqueProducts,
    uniqueDates: sortedUniqueDates,
  };
};

// --- Lógica de Resumen ---

export const calculateProductSummary = (
  filteredPalletProducts: PalletPositionWithProducts[],
  today: Date,
): ProductSummaryItem[] => {
  const summaryMap = new Map<number, ProductSummaryItem>();

  filteredPalletProducts.forEach((position) => {
    position.products.forEach((product) => {
      const status = getExpirationStatus(product.vencimiento, today);
      const key = product.codigo;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          codigo: product.codigo,
          desArticulo: product.desArticulo || 'Desconocido',
          bultos: { normal: 0, fiveMonths: 0, threeMonths: 0, expired: 0, total: 0 },
          pallets: { normal: 0, fiveMonths: 0, threeMonths: 0, expired: 0, total: 0 },
        });
      }

      const item = summaryMap.get(key)!;

      // Update bultos
      if (status === 'normal') item.bultos.normal += product.bultos;
      else if (status === 'warning')
        item.bultos.fiveMonths += product.bultos; // <5M
      else if (status === 'danger')
        item.bultos.threeMonths += product.bultos; // <3M
      else if (status === 'expired') item.bultos.expired += product.bultos;
      item.bultos.total += product.bultos;

      // Update pallets
      if (product.pallets) {
        if (status === 'normal') item.pallets.normal += 1;
        else if (status === 'warning') item.pallets.fiveMonths += 1;
        else if (status === 'danger') item.pallets.threeMonths += 1;
        else if (status === 'expired') item.pallets.expired += 1;
        item.pallets.total += 1;
      }
    });
  });

  return Array.from(summaryMap.values()).sort((a, b) =>
    (a.desArticulo || '').localeCompare(b.desArticulo || ''),
  );
};

// --- Lógica de Sugerencia ---

export const findEarliestProductToSuggest = (
  filteredPalletProducts: PalletPositionWithProducts[],
  debouncedSearchQuery: string,
): SuggestedProductInfo | null => {
  const isSearchActive = debouncedSearchQuery.trim().length > 0;
  if (!filteredPalletProducts.length && !isSearchActive) return null;

  let earliestDate: Date | null = null;
  let suggested: SuggestedProductInfo | null = null;

  for (const pos of filteredPalletProducts) {
    for (const p of pos.products) {
      if (p.vencimiento) {
        const vDate = new Date(p.vencimiento + 'T00:00:00');

        if (format(vDate, 'yyyy-MM-dd') && !isPast(vDate)) {
          if (!earliestDate || vDate.getTime() < earliestDate.getTime()) {
            earliestDate = vDate;
            suggested = {
              id: p.id,
              fila: pos.fila,
              posicion: pos.posicion,
              descrip: p.desArticulo || 'Artículo',
              vencimiento: p.vencimiento,
            };
          }
        }
      }
    }
  }
  return suggested;
};
