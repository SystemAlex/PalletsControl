import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  makeStyles,
  Tooltip,
  Text,
  Card,
  MessageBar,
  MessageBarBody,
  Link,
  Toolbar,
  ToolbarButton,
  tokens,
  CardHeader,
  Combobox,
  useId,
  Option,
  OptionOnSelectData,
  ComboboxProps,
  mergeClasses,
  Body1Stronger,
  Label,
  Switch,
} from '@fluentui/react-components';
import { useMainLayoutContext } from '../layouts/MainLayout';
import { SpinnerCustom } from '../components/ui/SpinnerCustom';
import { PalletProductTable } from '../components/pallet-products/PalletProductTable';
import { PalletProductGrid } from '../components/pallet-products/PalletProductGrid';
import { PalletProductFormDialog } from '../components/dialogs/pallet-products/PalletProductFormDialog';
import { PalletProductRemoveDialog } from '../components/dialogs/pallet-products/PalletProductRemoveDialog';
import { PalletActionLogDialog } from '../components/dialogs/PalletActionLogDialog';
import { format } from 'date-fns';
import { PalletProductsHeader } from '../components/pallet-products/PalletProductsHeader';
import { PalletSummaryCard } from '../components/pallet-products/PalletSummaryCard';
import { PalletProductSummaryTable } from '../components/pallet-products/PalletProductSummaryTable';
import { usePalletProducts, ExpirationStatus, UniqueDate } from '../hooks/usePalletProducts';
import {
  Box20Filled,
  Box20Regular,
  BoxMultiple20Filled,
  BoxMultiple20Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '0px',
    height: '100%',
    width: '100%',
    '@media(max-width: 600px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto 1fr',
      columnGap: '0px',
    },
  },
  toolbarContainer: {
    display: 'flex',
    justifyContent: 'center',
    '@media(max-width: 600px)': {
      gridColumn: 'span 2 / span 2',
      gridColumnStart: 1,
      gridRowStart: 2,
      overflowX: 'auto',
    },
  },
  middleContainer: {
    padding: '0px',
    gap: '0px',
    '&:not(:has(.fui-MessageBar))': {
      gap: '6px',
    },
  },
  cardHeader: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'auto auto 1fr auto',
    gap: '8px',
    '@media(min-width: 601px) and (max-width: 768px)': {
      gap: '6px',
      gridTemplateColumns: '1fr 1fr',
      ':has(.fui-Switch)': {
        gridTemplateColumns: '1fr 1fr auto',
      },
      ':has(.fui-Switch) > .fui-Combobox': {
        minWidth: '200px',
      },
    },
    '@media(max-width: 600px)': {
      gap: '4px',
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto auto auto',
      ':has(.fui-Switch)': {
        gridTemplateColumns: '1fr auto',
        gridTemplateRows: 'auto auto',
      },
      ':has(.fui-Switch) > :nth-child(1)': {
        gridColumn: 'span 2 / span 2',
        minWidth: '200px',
      },
      ':has(.fui-Switch) > :nth-child(2)': {
        gridRowStart: 2,
        minWidth: '200px',
      },
      ':has(.fui-Switch) > :nth-child(3)': {
        gridRowStart: 2,
        gridColumnStart: 2,
      },
    },
  },
  contentContainer: {
    overflowX: 'auto',
    overflowY: 'auto',
    padding: '0px',
    gap: '6px',
    '&:only-child': { margin: '6px', padding: '6px', paddingBottom: '0px' },
    '& > *:last-child:not(table)': { marginBottom: '6px' },
  },
  messageBar: {
    margin: '4px',
    minHeight: 'fit-content',
  },
  wrap: {
    whiteSpace: 'normal',
  },
  toolBar: {
    padding: '0px',
    flexDirection: 'row',
    justifySelf: 'center',
    gridColumnStart: 4,
    '@media(min-width: 601px) and (max-width: 768px)': { gridColumn: 'span 2 / span 2' },
    '@media(max-width: 600px)': { gridColumnStart: 1 },
  },
  switchContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0px',
    gridColumnStart: 4,
    paddingRight: '8px',
    '& > :nth-child(2)': { height: '32px', alignItems: 'center' },
    '@media(max-width: 600px)': { gridColumnStart: 1 },
  },
  labelIcon: {
    display: 'flex',
    whiteSpace: 'pre',
    alignItems: 'center',
  },
  searchBox: {
    width: '220px',
    '@media(max-width: 600px)': {
      width: '150px',
    },
    '&:focus-within': {
      '@media(max-width: 600px)': {
        width: '100%',
        minWidth: '81%',
      },
    },
  },
  boldLink: {
    fontWeight: tokens.fontWeightBold,
  },
  // Nuevas clases para las opciones del Combobox de fecha
  expiredOption: {
    backgroundColor: tokens.colorPaletteBerryBackground1,
    color: tokens.colorPaletteBerryForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  dangerOption: {
    backgroundColor: tokens.colorStatusDangerBackground1,
    color: tokens.colorStatusDangerForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  warningOption: {
    backgroundColor: tokens.colorStatusWarningBackground1,
    color: tokens.colorStatusWarningForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
});

export default function PalletProductsPage() {
  const styles = useStyles();
  const { setHeaderContent, setHeaderText, isMobile } = useMainLayoutContext();
  const productComboId = useId('product-combo');
  const dateComboId = useId('date-combo');

  const {
    isLoading,
    error,
    palletProductsData,
    filteredPalletProducts,
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
    viewType: viewTypeHook,
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
  } = usePalletProducts();

  // --- Local Combobox State and Handlers (moved from PalletSummaryCard) ---
  const [productInputValue, setProductInputValue] = useState<string>('');
  const [dateInputValue, setDateInputValue] = useState<string>('');

  // Effect to reset local state when external filters are cleared
  useEffect(() => {
    if (!isAnyFilterActive) {
      setProductInputValue('');
      setDateInputValue('');
    }
  }, [isAnyFilterActive]);

  // --- Product Combobox Logic ---
  const productOptions = useMemo(() => {
    return uniqueProducts.map((p) => ({
      value: String(p.codigo),
      text: `${p.desArticulo} (${p.codigo})`,
    }));
  }, [uniqueProducts]);

  const filteredProductOptions = useMemo(() => {
    if (!productInputValue) return productOptions;
    const lowercasedQuery = productInputValue.toLowerCase();
    return productOptions.filter(
      (option: { text: string; value: string }) =>
        option.text.toLowerCase().includes(lowercasedQuery) ||
        option.value.includes(lowercasedQuery),
    );
  }, [productOptions, productInputValue]);

  const handleProductChangeLocal: ComboboxProps['onChange'] = (event) => {
    const value = event.target.value;
    setProductInputValue(value);

    // Si el usuario borra el texto, forzamos la deselección del código
    if (value === '') {
      handleProductFilterChange(null);
    }
  };

  const handleProductSelect = useCallback(
    (_: unknown, data: OptionOnSelectData) => {
      const selectedId = data.optionValue ? parseInt(data.optionValue, 10) : null;
      setProductInputValue(data.optionText || '');
      handleProductFilterChange(selectedId);
    },
    [handleProductFilterChange],
  );

  // Determinar las opciones seleccionadas para el Combobox de Producto
  const selectedProductOptions = useMemo(() => {
    if (productFilterCode === null) return [];
    const selectedOption = productOptions.find(
      (p: { value: string }) => p.value === String(productFilterCode),
    );
    if (selectedOption) {
      // Ensure input value matches selected text when filter is active
      if (productInputValue !== selectedOption.text) {
        setProductInputValue(selectedOption.text);
      }
      return [selectedOption.value];
    }
    return [];
  }, [productFilterCode, productOptions, productInputValue]);

  // --- Date Combobox Logic ---
  const dateOptions = useMemo(() => {
    return uniqueDates.map((d: UniqueDate) => ({
      value: d.dateString, // dd/MM/yyyy
      text: d.text, // dd/MM/yyyy + status suffix
      status: d.status,
    }));
  }, [uniqueDates]);

  const filteredDateOptions = useMemo(() => {
    if (!dateInputValue) return dateOptions;
    const lowercasedQuery = dateInputValue.toLowerCase();
    return dateOptions.filter((option: { text: string }) =>
      option.text.toLowerCase().includes(lowercasedQuery),
    );
  }, [dateOptions, dateInputValue]);

  const handleDateChangeLocal: ComboboxProps['onChange'] = (event) => {
    const value = event.target.value;
    setDateInputValue(value);

    // Si el usuario borra el texto, forzamos la deselección de la fecha
    if (value === '') {
      handleDateFilterChange(null);
    }
  };

  const handleDateSelect = useCallback(
    (_: unknown, data: OptionOnSelectData) => {
      // data.optionValue is the dateString (dd/MM/yyyy)
      const selectedDate = data.optionValue || null;
      setDateInputValue(data.optionText || '');
      handleDateFilterChange(selectedDate);
    },
    [handleDateFilterChange],
  );

  // Determinar las opciones seleccionadas para el Combobox de Fecha
  const selectedDateOptions = useMemo(() => {
    if (dateFilterString === null) return [];
    const selectedOption = dateOptions.find((d: { value: string }) => d.value === dateFilterString);
    if (selectedOption) {
      // Ensure input value matches selected text when filter is active
      if (dateInputValue !== selectedOption.text) {
        setDateInputValue(selectedOption.text);
      }
      return [selectedOption.value];
    }
    return [];
  }, [dateFilterString, dateOptions, dateInputValue]);

  // --- Helper para obtener la clase de estilo de la opción ---
  const getOptionClass = useCallback(
    (status: ExpirationStatus) => {
      switch (status) {
        case 'expired':
          return styles.expiredOption;
        case 'danger':
          return styles.dangerOption;
        case 'warning':
          return styles.warningOption;
        default:
          return undefined;
      }
    },
    [styles],
  );

  // --- DOM Manipulation / Scrolling Logic (kept in component layer) ---
  const scrollToFila = useCallback(
    (fila: string) => {
      if (isMobile) return;

      const targetElement = document.getElementById(`fila-${fila}`);
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 50);
      }
    },
    [isMobile],
  );

  // Effect to scroll when selectedFila changes
  useEffect(() => {
    if (selectedFila) {
      scrollToFila(selectedFila);
    }
  }, [selectedFila, scrollToFila]);

  // --- Header Content Setup ---
  const headerContent = useMemo(() => {
    return (
      <PalletProductsHeader
        searchQuery={immediateSearchQuery}
        onSearchChange={handleSearchChange}
        viewType={viewTypeHook}
        onViewTypeChange={handleViewTypeChange}
        onOpenPalletActionLogDialog={handleOpenPalletActionLogDialog}
        canViewLogs={canViewLogs}
      />
    );
  }, [
    immediateSearchQuery,
    handleSearchChange,
    viewTypeHook,
    handleViewTypeChange,
    handleOpenPalletActionLogDialog,
    canViewLogs,
  ]);

  useEffect(() => {
    setHeaderText('Control Pallets');
    setHeaderContent(headerContent);

    return () => {
      setHeaderText(null);
      setHeaderContent(null);
    };
  }, [setHeaderText, setHeaderContent, headerContent]);

  // --- Highlight Logic ---
  // Solo resaltar si hay filtros activos O búsqueda activa
  const shouldHighlightEarliest = isAnyFilterActive || debouncedSearchQuery.trim().length > 0;
  const highlightedProductId = shouldHighlightEarliest
    ? earliestProductToSuggest?.id || null
    : null;

  // --- Loading and Error States ---
  if (isLoading) {
    return <SpinnerCustom text="Cargando Control Pallets..." />;
  }

  if (error) {
    return <Text color="danger">Error: {(error as Error).message}</Text>;
  }

  return (
    <div className={styles.root}>
      <Card className={styles.middleContainer}>
        {filteredPalletProducts.length !== 0 && (
          <CardHeader
            header={
              <div className={styles.cardHeader}>
                <Combobox
                  id={productComboId}
                  placeholder="Filtro por producto"
                  value={productInputValue}
                  selectedOptions={selectedProductOptions}
                  onChange={handleProductChangeLocal}
                  onOptionSelect={handleProductSelect}
                  clearable
                  freeform
                  aria-label="Filtro por producto"
                >
                  {filteredProductOptions.map((p) => (
                    <Option key={p.value} value={p.value} text={p.text}>
                      {p.text}
                    </Option>
                  ))}
                </Combobox>
                <Combobox
                  id={dateComboId}
                  placeholder="Filtro por fecha"
                  value={dateInputValue}
                  selectedOptions={selectedDateOptions}
                  onChange={handleDateChangeLocal}
                  onOptionSelect={handleDateSelect}
                  clearable
                  freeform
                  aria-label="Filtro por fecha de vencimiento"
                >
                  {filteredDateOptions.map((d) => (
                    <Option
                      key={d.value}
                      value={d.value}
                      text={d.text}
                      className={mergeClasses(getOptionClass(d.status))} // Apply status class
                    >
                      {d.text}
                    </Option>
                  ))}
                </Combobox>
                {viewTypeHook !== 'summary' && (
                  <Toolbar aria-label="Seleccionar fila" size="small" className={styles.toolBar}>
                    {uniqueFilas.map((fila) => (
                      <Tooltip content={`Ir a Fila ${fila}`} relationship="label" key={fila}>
                        <ToolbarButton
                          aria-label={`Fila ${fila}`}
                          appearance="subtle"
                          icon={<div>{fila}</div>}
                          aria-pressed={selectedFila === fila}
                          href={`#fila-${fila}`}
                          as="a"
                        />
                      </Tooltip>
                    ))}
                  </Toolbar>
                )}
                {viewTypeHook === 'summary' && (
                  <div className={styles.switchContainer}>
                    <Label
                      htmlFor="summary-type-switch"
                      size="small"
                      weight={summaryDisplayType === 'bultos' ? 'semibold' : 'regular'}
                    >
                      <div className={styles.labelIcon}>
                        Bultos{' '}
                        {summaryDisplayType === 'bultos' ? <Box20Filled /> : <Box20Regular />}
                      </div>
                    </Label>
                    <Switch
                      id="summary-type-switch"
                      checked={summaryDisplayType === 'pallets'}
                      onChange={() =>
                        handleSummaryDisplayTypeChange(
                          summaryDisplayType === 'bultos' ? 'pallets' : 'bultos',
                        )
                      }
                      aria-label="Toggle between Bultos and Pallets summary"
                    />
                    <Label
                      htmlFor="summary-type-switch"
                      size="small"
                      weight={summaryDisplayType === 'pallets' ? 'semibold' : 'regular'}
                    >
                      <div className={styles.labelIcon}>
                        {summaryDisplayType === 'pallets' ? (
                          <BoxMultiple20Filled />
                        ) : (
                          <BoxMultiple20Regular />
                        )}{' '}
                        Pallets
                      </div>
                    </Label>
                  </div>
                )}
              </div>
            }
          />
        )}
        {shouldHighlightEarliest && earliestProductToSuggest && viewTypeHook !== 'summary' && (
          <MessageBar shape="rounded" intent="success" className={styles.messageBar}>
            <MessageBarBody className={styles.wrap}>
              Bajar <Text weight="bold">{earliestProductToSuggest.descrip}</Text> de la posición{' '}
              <Link
                className={styles.boldLink}
                href={`#product-${earliestProductToSuggest.fila}-${earliestProductToSuggest.posicion}-${earliestProductToSuggest.id}`}
              >
                {earliestProductToSuggest.fila}
                {earliestProductToSuggest.posicion}
              </Link>{' '}
              con vencimiento{' '}
              <Text weight="bold">
                {format(new Date(earliestProductToSuggest.vencimiento + 'T00:00:00'), 'dd/MM/yyyy')}
              </Text>
            </MessageBarBody>
          </MessageBar>
        )}
        <Card className={styles.contentContainer}>
          {filteredPalletProducts.length === 0 &&
          (isAnyFilterActive || debouncedSearchQuery.trim().length > 0) ? (
            <Body1Stronger align="center">
              No hay posiciones de pallet que coincidan con los filtros activos.
            </Body1Stronger>
          ) : viewTypeHook === 'table' ? (
            <PalletProductTable
              data={filteredPalletProducts}
              originalData={palletProductsData || []}
              onAddProduct={handleOpenAddProductDialog}
              onRemoveProduct={handleOpenRemoveProductDialog}
              searchQuery={debouncedSearchQuery}
              highlightedProductId={highlightedProductId}
              canModify={canModifyPallets}
              hasActiveFilters={isAnyFilterActive}
            />
          ) : viewTypeHook === 'grid' ? (
            <PalletProductGrid
              data={filteredPalletProducts}
              onAddProduct={handleOpenAddProductDialog}
              onRemoveProduct={handleOpenRemoveProductDialog}
              searchQuery={debouncedSearchQuery}
              highlightedProductId={highlightedProductId}
              canModify={canModifyPallets}
            />
          ) : (
            <PalletProductSummaryTable
              summaryData={productSummary}
              currentSummaryDisplayType={summaryDisplayType}
              isLoading={isLoading}
              error={error}
              today={today}
              getExpirationStatus={getExpirationStatus}
            />
          )}
        </Card>
      </Card>

      <PalletSummaryCard
        data={filteredPalletProducts || []}
        onFilterClick={handleFilterClick}
        activeFilter={activeFilter}
        isAnyFilterActive={isAnyFilterActive}
        onClearAllFilters={handleClearAllFilters}
      />

      {selectedPalletPosition && (
        <PalletProductFormDialog
          open={isAddProductDialogOpen}
          onOpenChange={handleCloseAddProductDialog}
          initialFila={selectedPalletPosition.fila}
          initialPosicion={selectedPalletPosition.posicion}
          existingProductsInPosition={selectedPalletPosition.existingProducts}
        />
      )}

      {selectedPalletPositionForRemoval && (
        <PalletProductRemoveDialog
          open={isRemoveProductDialogOpen}
          onOpenChange={handleCloseRemoveProductDialog}
          fila={selectedPalletPositionForRemoval.fila}
          posicion={selectedPalletPositionForRemoval.posicion}
          products={selectedPalletPositionForRemoval.products}
        />
      )}

      <PalletActionLogDialog
        open={isPalletActionLogDialogOpen}
        onOpenChange={setIsPalletActionLogDialogOpen}
      />
    </div>
  );
}
