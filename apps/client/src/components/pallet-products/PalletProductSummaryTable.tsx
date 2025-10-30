import React from 'react';
import {
  makeStyles,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  tokens,
  mergeClasses,
  useTableFeatures, // Added
  useTableSort, // Added
  createTableColumn, // Added
  TableColumnDefinition, // Added
} from '@fluentui/react-components';
import { ProductSummaryItem } from '../../../../shared/types';
import { SpinnerCustom } from '../ui/SpinnerCustom';
import { ExpirationStatus } from './PalletTableUtils';

const useStyles = makeStyles({
  card: {
    width: '100%',
    padding: '0px',
    gap: '0px',
    height: '100%',
  },
  tableContainer: {
    overflowX: 'auto',
    overflowY: 'auto',
  },
  table: {
    tableLayout: 'auto',
    minWidth: '600px',
  },
  tableRow: {
    '&:hover > *, &:hover > * > *': {
      fontWeight: tokens.fontWeightSemibold,
      backgroundColor: 'inherit',
    },
    '&:hover > :nth-child(3) > *': {
      backgroundColor: tokens.colorStatusWarningBackground2,
      color: tokens.colorStatusWarningForeground2,
    },
    '&:hover > :nth-child(4) > *': {
      backgroundColor: tokens.colorStatusDangerBackground2,
      color: tokens.colorStatusDangerForeground2,
    },
    '&:hover > :nth-child(5) > *': {
      backgroundColor: tokens.colorPaletteBerryBackground2,
      color: tokens.colorPaletteBerryForeground2,
    },
  },
  tableHeaderCell: {
    fontWeight: '600',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    position: 'sticky',
    top: '0px',
    zIndex: 1,
    textAlign: 'center',
    padding: '0px',
    '&:has(span)': {
      backgroundColor: tokens.colorBrandBackgroundSelected,
    },
    '& > *': {
      display: 'grid',
      gridTemplateColumns: '1fr 12px',
      paddingInline: '8px',
      width: 'calc(100% - 16px)',
      whiteSpace: 'pre',
    },
    '&:nth-child(3)': {
      '& > *': {
        backgroundColor: tokens.colorStatusWarningBackground1,
        color: tokens.colorStatusWarningForeground1,
        opacity: 0.8,
      },
      '&:has(span) > *': {
        opacity: 0.7,
      },
    },
    '&:nth-child(4) > *': {
      backgroundColor: tokens.colorStatusDangerBackground1,
      color: tokens.colorStatusDangerForeground1,
      opacity: 0.8,
    },
    '&:nth-child(5) > *': {
      backgroundColor: tokens.colorPaletteBerryBackground1,
      color: tokens.colorPaletteBerryForeground1,
      opacity: 0.8,
    },
  },
  productNameCell: {
    textAlign: 'left',
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  stickyCol: {
    position: 'sticky',
    left: '0px',
    maxWidth: '300px',
    zIndex: 3,
  },
  stickyHeaderCol: {
    position: 'sticky',
    left: '0px',
    maxWidth: '300px',
    zIndex: 4,
  },
  numericCell: {
    textAlign: 'center',
    padding: '0px',
    '& *': {
      display: 'grid',
      gridTemplateColumns: '1fr',
    },
  },
  totalRow: { borderBottom: 'none' },
  totalCell: {
    fontWeight: tokens.fontWeightBold,
    position: 'sticky',
    bottom: '0px',
    zIndex: 2,
    backgroundColor: tokens.colorBrandBackgroundHover,
    color: tokens.colorBrandBackground2,
    '& *': {
      display: 'grid',
      gridTemplateColumns: '1fr',
      opacity: 0.8,
    },
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
  },
  expiredRow: {
    '& *': {
      backgroundColor: tokens.colorPaletteBerryBackground1,
      color: tokens.colorPaletteBerryForeground1,
      lineHeight: '34px',
      minHeight: '100%',
      alignContent: 'center',
    },
  },
  dangerRow: {
    '& *': {
      backgroundColor: tokens.colorStatusDangerBackground1,
      color: tokens.colorStatusDangerForeground1,
      lineHeight: '34px',
      minHeight: '100%',
      alignContent: 'center',
    },
  },
  warningRow: {
    '& *': {
      backgroundColor: tokens.colorStatusWarningBackground1,
      color: tokens.colorStatusWarningForeground1,
      lineHeight: '34px',
      minHeight: '100%',
      alignContent: 'center',
    },
  },
});

interface PalletProductSummaryTableProps {
  summaryData: ProductSummaryItem[];
  currentSummaryDisplayType: 'bultos' | 'pallets';
  isLoading: boolean;
  error: Error | null;
  today: Date;
  getExpirationStatus: (dateString: string | null, today: Date) => ExpirationStatus;
}

export const PalletProductSummaryTable: React.FC<PalletProductSummaryTableProps> = ({
  summaryData,
  currentSummaryDisplayType,
  isLoading,
  error,
}) => {
  const styles = useStyles();

  // Define columns for the table
  const columns: TableColumnDefinition<ProductSummaryItem>[] = [
    createTableColumn<ProductSummaryItem>({
      columnId: 'product',
      compare: (a, b) => (a.desArticulo || '').localeCompare(b.desArticulo || ''),
      renderHeaderCell: () => '      Producto',
      renderCell: (item) => (
        <TableCell className={mergeClasses(styles.productNameCell, styles.stickyCol)}>
          {item.desArticulo} ({item.codigo})
        </TableCell>
      ),
    }),
    createTableColumn<ProductSummaryItem>({
      columnId: 'normal',
      compare: (a, b) => {
        const valA = currentSummaryDisplayType === 'bultos' ? a.bultos.normal : a.pallets.normal;
        const valB = currentSummaryDisplayType === 'bultos' ? b.bultos.normal : b.pallets.normal;
        return valA - valB;
      },
      renderHeaderCell: () => '      Normal',
      renderCell: (item) => {
        const value =
          currentSummaryDisplayType === 'bultos' ? item.bultos.normal : item.pallets.normal;
        return (
          <TableCell className={styles.numericCell}>
            {value > 0 ? value.toLocaleString() : ''}
          </TableCell>
        );
      },
    }),
    createTableColumn<ProductSummaryItem>({
      columnId: 'fiveMonths',
      compare: (a, b) => {
        const valA =
          currentSummaryDisplayType === 'bultos' ? a.bultos.fiveMonths : a.pallets.fiveMonths;
        const valB =
          currentSummaryDisplayType === 'bultos' ? b.bultos.fiveMonths : b.pallets.fiveMonths;
        return valA - valB;
      },
      renderHeaderCell: () => '      <5M',
      renderCell: (item) => {
        const value =
          currentSummaryDisplayType === 'bultos' ? item.bultos.fiveMonths : item.pallets.fiveMonths;
        return (
          <TableCell className={mergeClasses(styles.numericCell, styles.warningRow)}>
            <div>{value > 0 ? value.toLocaleString() : ''}</div>
          </TableCell>
        );
      },
    }),
    createTableColumn<ProductSummaryItem>({
      columnId: 'threeMonths',
      compare: (a, b) => {
        const valA =
          currentSummaryDisplayType === 'bultos' ? a.bultos.threeMonths : a.pallets.threeMonths;
        const valB =
          currentSummaryDisplayType === 'bultos' ? b.bultos.threeMonths : b.pallets.threeMonths;
        return valA - valB;
      },
      renderHeaderCell: () => '      <3M',
      renderCell: (item) => {
        const value =
          currentSummaryDisplayType === 'bultos'
            ? item.bultos.threeMonths
            : item.pallets.threeMonths;
        return (
          <TableCell className={mergeClasses(styles.numericCell, styles.dangerRow)}>
            <div>{value > 0 ? value.toLocaleString() : ''}</div>
          </TableCell>
        );
      },
    }),
    createTableColumn<ProductSummaryItem>({
      columnId: 'expired',
      compare: (a, b) => {
        const valA = currentSummaryDisplayType === 'bultos' ? a.bultos.expired : a.pallets.expired;
        const valB = currentSummaryDisplayType === 'bultos' ? b.bultos.expired : b.pallets.expired;
        return valA - valB;
      },
      renderHeaderCell: () => '      VDO',
      renderCell: (item) => {
        const value =
          currentSummaryDisplayType === 'bultos' ? item.bultos.expired : item.pallets.expired;
        return (
          <TableCell className={mergeClasses(styles.numericCell, styles.expiredRow)}>
            <div>{value > 0 ? value.toLocaleString() : ''}</div>
          </TableCell>
        );
      },
    }),
    createTableColumn<ProductSummaryItem>({
      columnId: 'total',
      compare: (a, b) => {
        const valA = currentSummaryDisplayType === 'bultos' ? a.bultos.total : a.pallets.total;
        const valB = currentSummaryDisplayType === 'bultos' ? b.bultos.total : b.pallets.total;
        return valA - valB;
      },
      renderHeaderCell: () => '      Total',
      renderCell: (item) => {
        const value =
          currentSummaryDisplayType === 'bultos' ? item.bultos.total : item.pallets.total;
        return (
          <TableCell className={styles.numericCell}>
            {value > 0 ? value.toLocaleString() : ''}
          </TableCell>
        );
      },
    }),
  ];

  // Use useTableFeatures hook
  const {
    getRows,
    sort: { getSortDirection, toggleColumnSort, sort },
  } = useTableFeatures(
    {
      columns,
      items: summaryData,
      getRowId: (item) => String(item.codigo),
    },
    [
      useTableSort({
        defaultSortState: { sortColumn: 'product', sortDirection: 'ascending' },
      }),
    ],
  );

  const rows = sort(getRows());

  if (isLoading) {
    return <SpinnerCustom text="Cargando resumen de productos..." />;
  }

  if (error) {
    return <Text color="danger">Error: {(error as Error).message}</Text>;
  }

  const totalSummary = summaryData.reduce(
    (acc, item) => {
      acc.bultos.normal += item.bultos.normal;
      acc.bultos.fiveMonths += item.bultos.fiveMonths;
      acc.bultos.threeMonths += item.bultos.threeMonths;
      acc.bultos.expired += item.bultos.expired;
      acc.bultos.total += item.bultos.total;

      acc.pallets.normal += item.pallets.normal;
      acc.pallets.fiveMonths += item.pallets.fiveMonths;
      acc.pallets.threeMonths += item.pallets.threeMonths;
      acc.pallets.expired += item.pallets.expired;
      acc.pallets.total += item.pallets.total;
      return acc;
    },
    {
      bultos: { normal: 0, fiveMonths: 0, threeMonths: 0, expired: 0, total: 0 },
      pallets: { normal: 0, fiveMonths: 0, threeMonths: 0, expired: 0, total: 0 },
    },
  );

  return (
    <Table size="small" aria-label="Resumen de Pallets por Producto" className={styles.table}>
      <TableHeader>
        <TableRow>
          {columns.map((column, id) => (
            <TableHeaderCell
              key={column.columnId}
              className={mergeClasses(
                styles.tableHeaderCell,
                id === 0 ? styles.stickyHeaderCol : '',
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
        {rows.map((row) => {
          const item = row.item;
          return (
            <TableRow key={item.codigo} className={styles.tableRow}>
              {columns.map((column) => column.renderCell(item))}
            </TableRow>
          );
        })}
        <TableRow className={styles.totalRow}>
          <TableCell
            className={mergeClasses(styles.productNameCell, styles.totalCell, styles.stickyCol)}
          >
            Total
          </TableCell>
          <TableCell className={mergeClasses(styles.numericCell, styles.totalCell)}>
            {currentSummaryDisplayType === 'bultos'
              ? totalSummary.bultos.normal > 0
                ? totalSummary.bultos.normal.toLocaleString()
                : ''
              : totalSummary.pallets.normal > 0
                ? totalSummary.pallets.normal.toLocaleString()
                : ''}
          </TableCell>
          <TableCell
            className={mergeClasses(styles.numericCell, styles.totalCell, styles.warningRow)}
          >
            <div>
              {currentSummaryDisplayType === 'bultos'
                ? totalSummary.bultos.fiveMonths > 0
                  ? totalSummary.bultos.fiveMonths.toLocaleString()
                  : ''
                : totalSummary.pallets.fiveMonths > 0
                  ? totalSummary.pallets.fiveMonths.toLocaleString()
                  : ''}
            </div>
          </TableCell>
          <TableCell
            className={mergeClasses(styles.numericCell, styles.totalCell, styles.dangerRow)}
          >
            <div>
              {currentSummaryDisplayType === 'bultos'
                ? totalSummary.bultos.threeMonths > 0
                  ? totalSummary.bultos.threeMonths.toLocaleString()
                  : ''
                : totalSummary.pallets.threeMonths > 0
                  ? totalSummary.pallets.threeMonths.toLocaleString()
                  : ''}
            </div>
          </TableCell>
          <TableCell
            className={mergeClasses(styles.numericCell, styles.totalCell, styles.expiredRow)}
          >
            <div>
              {currentSummaryDisplayType === 'bultos'
                ? totalSummary.bultos.expired > 0
                  ? totalSummary.bultos.expired.toLocaleString()
                  : ''
                : totalSummary.pallets.expired > 0
                  ? totalSummary.pallets.expired.toLocaleString()
                  : ''}
            </div>
          </TableCell>
          <TableCell className={mergeClasses(styles.numericCell, styles.totalCell)}>
            {currentSummaryDisplayType === 'bultos'
              ? totalSummary.bultos.total > 0
                ? totalSummary.bultos.total.toLocaleString()
                : ''
              : totalSummary.pallets.total > 0
                ? totalSummary.pallets.total.toLocaleString()
                : ''}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
