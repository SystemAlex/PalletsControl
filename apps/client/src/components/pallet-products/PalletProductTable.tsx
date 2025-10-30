import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import {
  makeStyles,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  Text,
  tokens,
  mergeClasses,
  Title3,
  useTableFeatures,
  useTableSort,
  createTableColumn,
  TableColumnDefinition,
  Tooltip,
  TableCell,
  Button,
} from '@fluentui/react-components';
import { PalletPositionWithProducts, ProductInPallet } from '../../../../shared/types';
import { format } from 'date-fns';
import { useMainLayoutContext } from '../../layouts/MainLayout';
import {
  flattenData,
  getExpirationStatus,
  FlatPalletProductRow,
  groupFlatRowsByFila,
  normalize,
} from './PalletTableUtils';
import { PalletTableRow } from './PalletTableRow';
import {
  CheckmarkCircle16Filled,
  Info16Filled,
  ArrowCircleUpFilled,
  ArrowCircleDownFilled,
} from '@fluentui/react-icons';
import { useCommonStyles } from '../../theme/commonStyles'; // Importar commonStyles

// Define a type for the styles object to pass it down to children
export type PalletProductTableStyles = ReturnType<typeof useStyles>;

const useStyles = makeStyles({
  table: {
    tableLayout: 'auto',
    minWidth: '100%',
  },
  stickyHeaderCol: {
    position: 'sticky',
    left: '0px',
    zIndex: 3,
  },
  tableHeaderCell: {
    fontWeight: '600',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    position: 'sticky',
    top: '0px',
    zIndex: 2,
    textAlign: 'center',
    '& *': {
      display: 'grid',
      gridTemplateColumns: '1fr 12px',
    },
    '&:has(span)': {
      backgroundColor: tokens.colorBrandBackgroundSelected,
    },
  },
  positionCell: {
    scrollMarginTop: '67px',
    textAlign: 'center',
    verticalAlign: 'top',
    gap: '4px',
    position: 'sticky',
    left: '0px',
    zIndex: 1,
  },
  filaLabel: {},
  positionButtonContent: {
    display: 'grid',
    alignItems: 'center',
    gridTemplateColumns: 'auto 1fr auto',
    justifyContent: 'center',
    height: '100%',
  },
  positionText: {
    gridColumnStart: 2,
    fontWeight: 'inherit',
  },
  productCell: {
    textAlign: 'left',
  },
  numericCell: {
    textAlign: 'center',
  },
  checkboxCell: {
    textAlign: 'center',
  },
  expiredDate: {
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorPaletteBerryBackground1,
    color: tokens.colorPaletteBerryForeground1,
    '&:hover': {
      backgroundColor: tokens.colorPaletteBerryBackground2,
      color: tokens.colorPaletteBerryForeground2,
    },
  },
  dangerDate: {
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorStatusDangerBackground1,
    color: tokens.colorStatusDangerForeground1,
    '&:hover': {
      backgroundColor: tokens.colorStatusDangerBackground2,
      color: tokens.colorStatusDangerForeground2,
    },
  },
  warningDate: {
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorStatusWarningBackground1,
    color: tokens.colorStatusWarningForeground1,
    '&:hover': {
      backgroundColor: tokens.colorStatusWarningBackground2,
      color: tokens.colorStatusWarningForeground2,
    },
  },
  emptyRow: { scrollMarginTop: '67px' },
  productRow: {
    borderBottomColor: tokens.colorBrandStroke2,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground3,
      '& > *:first-child': {
        backgroundColor: 'inherit',
      },
    },
    '& > *:first-child': {
      backgroundColor: tokens.colorNeutralBackground1,
    },
  },
  productRow2: {
    borderBottomColor: tokens.colorBrandStroke2,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  actionButtonsContainer: {
    display: 'flex',
    gap: '4px',
    marginBottom: '4px',
    justifyContent: 'center',
  },
  fileHeader: {
    borderBottom: 'none',
  },
  filaHeaderRow: {
    backgroundColor: tokens.colorBrandBackground3Static,
    color: tokens.colorNeutralForegroundOnBrand,
    position: 'sticky',
    top: '32px',
    zIndex: 2,
    height: '32px',
    '& > td': {
      padding: '0px 12px',
    },
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground3Static,
      color: tokens.colorNeutralForegroundOnBrand,
    },
  },
  filaHeaderRowSticky: {
    backgroundColor: tokens.colorBrandBackground3Static,
    color: tokens.colorNeutralForegroundOnBrand,
    position: 'sticky',
    left: '0px',
    zIndex: 2,
    height: '32px',
    '& > td': {
      padding: '0px 12px',
    },
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground3Static,
      color: tokens.colorNeutralForegroundOnBrand,
    },
  },
  filaHeaderText: {
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase400,
    lineHeight: '32px',
  },
  highlightSearchMatch: {},
  highlightEarliestMatch: {
    outline: `4px solid ${tokens.colorPaletteGreenBackground3}`,
    outlineOffset: '-4px',
    scrollMarginTop: '66px',
    '& > *:first-child': {
      outline: `4px solid ${tokens.colorPaletteGreenBackground3}`,
      outlineOffset: '-4px',
    },
  },
});

interface PalletProductTableProps {
  data: PalletPositionWithProducts[]; // Datos filtrados por Combobox/Tarjetas
  originalData: PalletPositionWithProducts[]; // Datos originales (sin filtrar)
  onAddProduct: (fila: string, posicion: number) => void;
  onRemoveProduct: (fila: string, posicion: number, products: ProductInPallet[]) => void;
  searchQuery: string;
  highlightedProductId: number | null;
  canModify: boolean;
  hasActiveFilters: boolean; // isAnyFilterActive
}

export const PalletProductTable: React.FC<PalletProductTableProps> = ({
  data: filteredData, // Datos filtrados por Combobox/Tarjetas
  onAddProduct,
  onRemoveProduct,
  searchQuery,
  highlightedProductId,
  canModify,
}) => {
  const styles = useStyles();
  const commonStyles = useCommonStyles(); // Usar commonStyles
  const { isMobile } = useMainLayoutContext();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const productRowRefs = useRef(new Map<string, HTMLTableRowElement | null>());

  const doesProductMatchSearch = useCallback((product: ProductInPallet, query: string): boolean => {
    if (!query) return false;
    const lowercasedQuery = normalize(query);
    const productText = normalize(
      `${product.desArticulo ?? ''} ${product.codigo ?? ''} ${product.observaciones ?? ''}`,
    );
    return productText.includes(lowercasedQuery);
  }, []);

  // 1. Flatten the data (solo productos que pasaron los filtros de Combobox/Tarjetas)
  const flatData = useMemo(() => flattenData(filteredData), [filteredData]);

  // 2. Define columns and comparators (omitted for brevity, assumed correct)
  const columns: TableColumnDefinition<FlatPalletProductRow>[] = [
    createTableColumn<FlatPalletProductRow>({
      columnId: 'positionDisplay',
      compare: (a, b) => {
        if (a.fila !== b.fila) return a.fila.localeCompare(b.fila);
        return a.posicion - b.posicion;
      },
      renderHeaderCell: () => 'POSICION',
      renderCell: (item) => item.positionDisplay,
    }),
    createTableColumn<FlatPalletProductRow>({
      columnId: 'desArticulo',
      compare: (a, b) => (a.desArticulo || '').localeCompare(b.desArticulo || ''),
      renderHeaderCell: () => 'PRODUCTO',
      renderCell: (item) => (
        <Text>
          {item.desArticulo} ({item.codigo})
        </Text>
      ),
    }),
    createTableColumn<FlatPalletProductRow>({
      columnId: 'bultos',
      compare: (a, b) => a.bultos - b.bultos,
      renderHeaderCell: () => 'BULTOS',
      renderCell: (item) => <Text className={styles.numericCell}>{item.bultos}</Text>,
    }),
    createTableColumn<FlatPalletProductRow>({
      columnId: 'pallets',
      compare: (a, b) => Number(a.pallets) - Number(b.pallets),
      renderHeaderCell: () => 'PALET',
      renderCell: (item) => (
        <div className={styles.checkboxCell}>
          {item.pallets && <CheckmarkCircle16Filled color="#0e700e" />}
        </div>
      ),
    }),
    createTableColumn<FlatPalletProductRow>({
      columnId: 'vencimiento',
      compare: (a, b) => {
        const dateA = a.vencimientoDate ? a.vencimientoDate.getTime() : Infinity;
        const dateB = b.vencimientoDate ? b.vencimientoDate.getTime() : Infinity;
        return dateA - dateB;
      },
      renderHeaderCell: () => 'VENCIMIENTO',
      renderCell: (item) => {
        const status = getExpirationStatus(item.vencimiento, today);
        let expirationStatusTxt = '';
        if (status === 'expired') expirationStatusTxt = ' VDO';
        else if (status === 'danger') expirationStatusTxt = ' <3M';
        else if (status === 'warning') expirationStatusTxt = ' <5M';

        return (
          <Text className={styles.numericCell}>
            {item.vencimiento
              ? format(item.vencimientoDate!, 'dd/MM/yyyy') + expirationStatusTxt
              : ''}
          </Text>
        );
      },
    }),
    createTableColumn<FlatPalletProductRow>({
      columnId: 'observaciones',
      compare: (a, b) => (a.observaciones || '').localeCompare(b.observaciones || ''),
      renderHeaderCell: () => 'OBS',
      renderCell: (item) => (
        <div className={styles.checkboxCell}>
          {item.observaciones && (
            <Tooltip content={item.observaciones} relationship="label">
              <Info16Filled color="#73c2fb" />
            </Tooltip>
          )}
        </div>
      ),
    }),
  ];

  // 3. Use useTableFeatures
  const {
    getRows,
    sort: { getSortDirection, toggleColumnSort, sort },
  } = useTableFeatures(
    {
      columns,
      items: flatData,
      getRowId: (item) => String(item.id),
    },
    [
      useTableSort({
        defaultSortState: { sortColumn: 'positionDisplay', sortDirection: 'ascending' },
      }),
    ],
  );

  // 4. Get sorted rows and active sort column
  const sortedRows = useMemo(() => sort(getRows()), [getRows, sort]);

  const activeSortColumn = useMemo(() => {
    return (columns.find((c) => getSortDirection(c.columnId))?.columnId ||
      'positionDisplay') as string;
  }, [columns, getSortDirection]);

  // 5. Group sorted rows by Fila and Position for rendering (to handle rowSpan)
  const groupedRowsByFila = useMemo(() => {
    return groupFlatRowsByFila(sortedRows, filteredData, activeSortColumn);
  }, [sortedRows, filteredData, activeSortColumn]);

  // 6. Effect to scroll to the highlighted product row
  useEffect(() => {
    if (isMobile) return;

    if (highlightedProductId !== null) {
      let targetProductKey: string | null = null;
      for (const row of sortedRows) {
        if (String(row.item.id) === String(highlightedProductId)) {
          targetProductKey = `${row.item.fila}-${row.item.posicion}-${row.item.id}`;
          break;
        }
      }

      if (targetProductKey !== null) {
        const targetElement = productRowRefs.current.get(targetProductKey);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          const dom = document.getElementById(`product-${targetProductKey}`);
          if (dom) dom.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [highlightedProductId, sortedRows, isMobile]);

  return (
    <Table size="small" aria-label="Control Pallets" className={styles.table}>
      <TableHeader>
        <TableRow className={styles.fileHeader}>
          {columns.map((column, id) => (
            <TableHeaderCell
              key={column.columnId}
              className={mergeClasses(
                styles.tableHeaderCell,
                id === 0 ? styles.stickyHeaderCol : undefined,
              )}
              sortDirection={getSortDirection(column.columnId)}
              onClick={(e) => toggleColumnSort(e, column.columnId)}
            >
              {column.renderHeaderCell()}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {groupedRowsByFila.map(([fila, positionsInFila]) => {
          let filaIdAssigned = false;
          return (
            <React.Fragment key={fila}>
              <TableRow className={mergeClasses(styles.filaHeaderRow)}>
                <TableCell colSpan={2} className={styles.filaHeaderRowSticky}>
                  <Title3 className={styles.filaHeaderText}>FILA {fila}</Title3>
                </TableCell>
                <TableCell colSpan={columns.length - 2}></TableCell>
              </TableRow>
              {positionsInFila.map((positionGroup) => {
                const isFirstFilaRow = !filaIdAssigned;
                if (isFirstFilaRow) filaIdAssigned = true;

                // Determinar si la posición está vacía en los datos filtrados/ordenados
                const isFilteredPositionEmpty = positionGroup.products.length === 0;

                // Si la posición está vacía en los datos filtrados, la renderizamos como fila vacía.
                if (isFilteredPositionEmpty) {
                  const originalPosition = positionGroup.originalPositionData;
                  const positionDisplay = `${originalPosition.fila}${originalPosition.posicion.toString()}`;
                  const isPositionEmpty = originalPosition.products.length === 0; // Si está vacía en los datos originales

                  return (
                    <TableRow key={positionGroup.positionKey} className={styles.emptyRow}>
                      <TableCell
                        rowSpan={1}
                        className={mergeClasses(styles.positionCell, styles.filaLabel)}
                        {...(isFirstFilaRow ? { id: `fila-${originalPosition.fila}` } : {})}
                      >
                        <div className={styles.positionButtonContent}>
                          {canModify && (
                            <Tooltip content={`Subir en ${positionDisplay}`} relationship="label">
                              <Button
                                icon={<ArrowCircleUpFilled />}
                                className={commonStyles.successButton} // Usar commonStyles
                                shape="circular"
                                appearance="subtle"
                                onClick={() =>
                                  onAddProduct(originalPosition.fila, originalPosition.posicion)
                                }
                                disabled={false}
                              />
                            </Tooltip>
                          )}
                          <Text className={styles.positionText} align="center">
                            {positionDisplay}
                          </Text>
                          {canModify && (
                            <Tooltip content={'Nada para Bajar'} relationship="label">
                              <Button
                                icon={<ArrowCircleDownFilled />}
                                className={commonStyles.dangerButton} // Usar commonStyles
                                shape="circular"
                                appearance="subtle"
                                onClick={() =>
                                  onRemoveProduct(
                                    originalPosition.fila,
                                    originalPosition.posicion,
                                    originalPosition.products,
                                  )
                                }
                                disabled={isPositionEmpty}
                              />
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell colSpan={columns.length - 1}></TableCell>
                    </TableRow>
                  );
                }

                // Si la posición tiene productos filtrados, renderizamos las filas de productos
                return (
                  <PalletTableRow
                    key={positionGroup.positionKey}
                    positionGroup={positionGroup}
                    styles={styles}
                    commonStyles={commonStyles} // Pasar commonStyles
                    today={today}
                    canModify={canModify}
                    onAddProduct={onAddProduct}
                    onRemoveProduct={onRemoveProduct}
                    highlightedProductId={highlightedProductId}
                    searchQuery={searchQuery}
                    doesProductMatchSearch={doesProductMatchSearch}
                    getExpirationStatus={getExpirationStatus}
                    isFirstFilaRow={isFirstFilaRow}
                    columnsLength={columns.length}
                    productRowRefs={productRowRefs}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
};
