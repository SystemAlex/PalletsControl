import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPalletProducts } from '../api/palletProducts';
import {
  PalletPositionWithProducts,
  ProductInPallet,
  ProductSummaryItem,
} from '../../../shared/types';
import { useDebounce } from './useDebounce';
import { useAuth } from '../context/AuthContext';
import { SearchBoxChangeEvent, InputOnChangeData } from '@fluentui/react-components';
import {
  ExpirationFilter,
  ExpirationStatus,
  getExpirationStatus,
} from '../components/pallet-products/PalletTableUtils';
import {
  applySearchFilter,
  applyComboboxAndExpirationFilters,
  calculateUniqueOptions,
  calculateProductSummary,
  findEarliestProductToSuggest,
  UniqueDate,
  UniqueProduct,
} from '../components/pallet-products/PalletProductLogic';

type ViewType = 'table' | 'grid' | 'summary';
export type { ExpirationStatus, UniqueDate, UniqueProduct };
type SummaryDisplayType = 'bultos' | 'pallets';

interface PalletPositionSelection {
  fila: string;
  posicion: number;
  existingProducts: ProductInPallet[];
}

interface PalletRemovalSelection {
  fila: string;
  posicion: number;
  products: ProductInPallet[];
}

export function usePalletProducts() {
  const { user, handleApiError } = useAuth();

  const [viewType, setViewType] = useState<ViewType>('grid');
  const [summaryDisplayType, setSummaryDisplayType] = useState<SummaryDisplayType>('bultos');
  const [immediateSearchQuery, setImmediateSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(immediateSearchQuery, 300);
  const [activeFilter, setActiveFilter] = useState<ExpirationFilter>(null);
  const [productFilterCode, setProductFilterCode] = useState<number | null>(null);
  const [dateFilterString, setDateFilterString] = useState<string | null>(null);

  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [selectedPalletPosition, setSelectedPalletPosition] =
    useState<PalletPositionSelection | null>(null);
  const [isRemoveProductDialogOpen, setIsRemoveProductDialogOpen] = useState(false);
  const [selectedPalletPositionForRemoval, setSelectedPalletPositionForRemoval] =
    useState<PalletRemovalSelection | null>(null);
  const [isPalletActionLogDialogOpen, setIsPalletActionLogDialogOpen] = useState(false);
  const [selectedFila, setSelectedFila] = useState<string | null>(null);

  const {
    data: palletProductsData,
    isLoading,
    error,
  } = useQuery<PalletPositionWithProducts[], Error>({
    queryKey: ['palletProducts'],
    queryFn: async () => {
      try {
        return await fetchPalletProducts();
      } catch (err) {
        handleApiError(err);
        throw err;
      }
    },
    enabled: true,
  });

  const allowedRolesToManage = useMemo(() => ['admin', 'developer', 'deposito'], []);

  const canModifyPallets = useMemo(() => {
    if (!user || !allowedRolesToManage.includes(user.role)) return false;
    return true;
  }, [user, allowedRolesToManage]);

  const allowedRolesForLogs = useMemo(() => ['admin', 'developer'], []);
  const canViewLogs = !!user && allowedRolesForLogs.includes(user.role);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isComboboxFilterActive = useMemo(
    () => activeFilter !== null || productFilterCode !== null || dateFilterString !== null,
    [activeFilter, productFilterCode, dateFilterString],
  );

  const isAnyFilterActive = useMemo(
    () => isComboboxFilterActive || debouncedSearchQuery.trim().length > 0,
    [isComboboxFilterActive, debouncedSearchQuery],
  );

  // --- STEP 1: Apply Search Filter (Base Filter) ---
  const baseFilteredData = useMemo(() => {
    return applySearchFilter(palletProductsData, debouncedSearchQuery);
  }, [palletProductsData, debouncedSearchQuery]);

  // --- STEP 2: Calculate Options for Product Filter (depends on search, date, and expiration filters) ---
  const productOptionsData = useMemo(() => {
    // Calculate product options based on search, date, and expiration filters
    const dataForProductOptions = applyComboboxAndExpirationFilters(
      baseFilteredData,
      null, // Ignore productFilterCode
      dateFilterString,
      activeFilter,
      today,
      dateFilterString !== null || activeFilter !== null, // Only consider date/exp filters active
    );
    return calculateUniqueOptions(dataForProductOptions, today);
  }, [baseFilteredData, dateFilterString, activeFilter, today]);

  const uniqueProducts = productOptionsData.uniqueProducts;

  // --- STEP 3: Calculate Options for Date Filter (depends on search and product filters) ---
  const dateOptionsData = useMemo(() => {
    // Calculate date options based on search and product filters
    const dataForDateOptions = applyComboboxAndExpirationFilters(
      baseFilteredData,
      productFilterCode,
      null, // Ignore dateFilterString
      activeFilter,
      today,
      productFilterCode !== null || activeFilter !== null, // Only consider product/exp filters active
    );
    return calculateUniqueOptions(dataForDateOptions, today);
  }, [baseFilteredData, productFilterCode, activeFilter, today]);

  const uniqueDates = dateOptionsData.uniqueDates;

  // --- STEP 4: Apply ALL Filters (Final Filter) ---
  const filteredPalletProducts = useMemo(() => {
    return applyComboboxAndExpirationFilters(
      baseFilteredData,
      productFilterCode,
      dateFilterString,
      activeFilter,
      today,
      isComboboxFilterActive,
    );
  }, [
    baseFilteredData,
    productFilterCode,
    dateFilterString,
    activeFilter,
    today,
    isComboboxFilterActive,
  ]);

  // --- Calculate Product Summary (based on filteredPalletProducts) ---
  const productSummary: ProductSummaryItem[] = useMemo(() => {
    return calculateProductSummary(filteredPalletProducts, today);
  }, [filteredPalletProducts, today]);

  // --- Earliest Product Suggestion (based on filteredPalletProducts) ---
  const earliestProductToSuggest = useMemo(() => {
    return findEarliestProductToSuggest(filteredPalletProducts, debouncedSearchQuery);
  }, [filteredPalletProducts, debouncedSearchQuery]);

  // --- ALL Unique Filas (from original data) ---
  const allUniqueFilas = useMemo(() => {
    const filas = new Set<string>();
    palletProductsData?.forEach((p) => filas.add(p.fila));
    return Array.from(filas).sort();
  }, [palletProductsData]);

  const uniqueFilas = allUniqueFilas;

  const handleSearchChange = useCallback((_: SearchBoxChangeEvent, data: InputOnChangeData) => {
    setImmediateSearchQuery(data.value);
  }, []);

  const handleViewTypeChange = useCallback((v: ViewType) => setViewType(v), []);

  const handleSummaryDisplayTypeChange = useCallback((type: SummaryDisplayType) => {
    setSummaryDisplayType(type);
  }, []);

  const handleOpenPalletActionLogDialog = useCallback(() => {
    setIsPalletActionLogDialogOpen(true);
  }, []);

  const handleFilterClick = useCallback((f: ExpirationFilter) => {
    setActiveFilter((prev) => (prev === f ? null : f));
  }, []);

  const handleProductFilterChange = useCallback((codigo: number | null) => {
    setProductFilterCode(codigo);
  }, []);

  const handleDateFilterChange = useCallback((dateString: string | null) => {
    setDateFilterString(dateString);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setImmediateSearchQuery('');
    setActiveFilter(null);
    setProductFilterCode(null);
    setDateFilterString(null);
  }, []);

  const handleCloseAddProductDialog = useCallback(() => {
    setIsAddProductDialogOpen(false);
    setSelectedPalletPosition(null);
  }, []);

  const handleCloseRemoveProductDialog = useCallback(() => {
    setIsRemoveProductDialogOpen(false);
    setSelectedPalletPositionForRemoval(null);
  }, []);

  const handleOpenAddProductDialog = useCallback(
    (fila: string, posicion: number) => {
      if (!canModifyPallets) return;
      const positionData = palletProductsData?.find(
        (p) => p.fila === fila && p.posicion === posicion,
      );
      setSelectedPalletPosition({
        fila,
        posicion,
        existingProducts: positionData?.products || [],
      });
      setIsAddProductDialogOpen(true);
    },
    [palletProductsData, canModifyPallets],
  );

  const handleOpenRemoveProductDialog = useCallback(
    (fila: string, posicion: number, products: ProductInPallet[]) => {
      if (!canModifyPallets) return;
      setSelectedPalletPositionForRemoval({ fila, posicion, products });
      setIsRemoveProductDialogOpen(true);
    },
    [canModifyPallets],
  );

  useEffect(() => {
    if (isRemoveProductDialogOpen && selectedPalletPositionForRemoval && palletProductsData) {
      const updated = palletProductsData.find(
        (p) =>
          p.fila === selectedPalletPositionForRemoval.fila &&
          p.posicion === selectedPalletPositionForRemoval.posicion,
      );
      if (updated) {
        const prevProds = selectedPalletPositionForRemoval.products;
        const newProds = updated.products;
        if (
          prevProds.length !== newProds.length ||
          prevProds.some((p, i) => p.id !== newProds[i]?.id || p.bultos !== newProds[i]?.bultos)
        ) {
          setSelectedPalletPositionForRemoval((prev) => ({
            ...prev!,
            products: newProds,
          }));
        }
        if (newProds.length === 0) handleCloseRemoveProductDialog();
      } else handleCloseRemoveProductDialog();
    }
  }, [
    palletProductsData,
    isRemoveProductDialogOpen,
    selectedPalletPositionForRemoval,
    handleCloseRemoveProductDialog,
  ]);

  useEffect(() => {
    if (allUniqueFilas.length > 0 && !selectedFila) setSelectedFila(allUniqueFilas[0]);
    else if (allUniqueFilas.length === 0 && selectedFila) setSelectedFila(null);
  }, [allUniqueFilas, selectedFila]);

  return {
    palletProductsData,
    searchFilteredData: baseFilteredData,
    filteredPalletProducts,
    isLoading,
    error,
    immediateSearchQuery,
    debouncedSearchQuery,
    activeFilter,
    productFilterCode,
    dateFilterString,
    earliestProductToSuggest,
    uniqueFilas,
    uniqueProducts,
    uniqueDates,
    isAnyFilterActive,
    viewType,
    summaryDisplayType,
    productSummary,
    selectedFila,
    isAddProductDialogOpen,
    selectedPalletPosition,
    isRemoveProductDialogOpen,
    selectedPalletPositionForRemoval,
    isPalletActionLogDialogOpen,
    canModifyPallets,
    canViewLogs,
    handleSearchChange,
    handleViewTypeChange,
    handleSummaryDisplayTypeChange,
    handleFilterClick,
    handleProductFilterChange,
    handleDateFilterChange,
    handleClearAllFilters,
    handleOpenPalletActionLogDialog,
    handleOpenAddProductDialog,
    handleOpenRemoveProductDialog,
    handleCloseAddProductDialog,
    handleCloseRemoveProductDialog,
    setIsPalletActionLogDialogOpen,
    getExpirationStatus,
    today,
  };
}
