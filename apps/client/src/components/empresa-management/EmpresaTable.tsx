import React from 'react';
import {
  makeStyles,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Button,
  Badge,
  tokens,
  Tooltip,
  mergeClasses,
  useTableFeatures,
  useTableSort,
  createTableColumn,
  TableColumnDefinition,
  Persona,
} from '@fluentui/react-components';
import { Edit24Regular, ToggleLeft24Regular, ToggleRight24Regular } from '@fluentui/react-icons';
import { EmpresaRecord } from '../../../../shared/types';
import { useCommonStyles } from '../../theme/commonStyles';
import { SortColumn } from '../../hooks/useEmpresaManagement';
import { DateToolTip } from '../ui/DateToolTip';

const useStyles = makeStyles({
  table: {
    tableLayout: 'auto',
    minWidth: '100%',
  },
  tableHeaderSticky: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  tableHeaderCell: {
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    '& > *': {
      display: 'grid',
      gridTemplateColumns: '1fr 12px',
      width: 'calc(100%)',
      whiteSpace: 'pre',
    },
    '&:has(span)': {
      backgroundColor: tokens.colorBrandBackgroundSelected,
    },
    '&:hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
    '&:active': {
      backgroundColor: tokens.colorBrandBackgroundPressed,
    },
  },
  row: { '&:hover .action-buttons': { opacity: 1, pointerEvents: 'auto' }, height: '52px' },
  actionButtons: {
    display: 'flex',
    columnGap: '8px',
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.2s ease-in-out',
  },
  cellActions: {
    fontWeight: '600',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    '& > *': { textAlign: 'center', justifyContent: 'center' },
  },
  cellCenter: {
    textAlign: 'center',
    '& > *': { textAlign: 'center', justifyContent: 'center' },
  },
  cellContent: {
    display: 'flex',
    alignItems: 'center',
  },
});

interface EmpresaTableProps {
  empresas: EmpresaRecord[];
  onEditEmpresa: (empresa: EmpresaRecord) => void;
  onConfirmDelete: (empresa: EmpresaRecord) => void;
  isAnyMutationPending: boolean;
}

export const EmpresaTable: React.FC<EmpresaTableProps> = ({
  empresas,
  onEditEmpresa,
  onConfirmDelete,
  isAnyMutationPending,
}) => {
  const styles = useStyles();
  const commonStyles = useCommonStyles();

  const columns: TableColumnDefinition<EmpresaRecord>[] = [
    createTableColumn<EmpresaRecord>({
      columnId: 'razonSocial',
      compare: (a, b) => a.razonSocial.localeCompare(b.razonSocial),
      renderHeaderCell: () => '      Razón Social',
      renderCell: (item) => (
        <TableCell key="razonSocial">
          <div className={styles.cellContent}>
            <Persona
              name={item.razonSocial}
              secondaryText={item.nombreFantasia ? item.nombreFantasia : undefined}
              presence={
                item.activo ? { status: 'available' } : { status: 'offline', outOfOffice: true }
              }
              avatar={{
                color: 'colorful',
                name: item.nombreFantasia ? item.nombreFantasia : item.razonSocial,
              }}
            />
          </div>
        </TableCell>
      ),
    }),
    createTableColumn<EmpresaRecord>({
      columnId: 'cuit',
      compare: (a, b) => a.cuit.localeCompare(b.cuit),
      renderHeaderCell: () => '      CUIT',
      renderCell: (item) => (
        <TableCell key="cuit" className={styles.cellCenter}>
          {item.cuit}
        </TableCell>
      ),
    }),
    createTableColumn<EmpresaRecord>({
      columnId: 'email',
      compare: (a, b) => (a.email || '').localeCompare(b.email || ''),
      renderHeaderCell: () => '      Email',
      renderCell: (item) => <TableCell key="email">{item.email}</TableCell>,
    }),
    createTableColumn<EmpresaRecord>({
      columnId: 'telefono',
      compare: (a, b) => (a.telefono || '').localeCompare(b.telefono || ''),
      renderHeaderCell: () => '      Teléfono',
      renderCell: (item) => (
        <TableCell key="telefono" className={styles.cellCenter}>
          {item.telefono}
        </TableCell>
      ),
    }),
    createTableColumn<EmpresaRecord>({
      columnId: 'fechaAlta',
      compare: (a, b) => new Date(a.fechaAlta).getTime() - new Date(b.fechaAlta).getTime(),
      renderHeaderCell: () => '      Fecha Alta',
      renderCell: (item) => (
        <TableCell key="fechaAlta" className={styles.cellCenter}>
          <DateToolTip text={item.fechaAlta} isDateOnly />
        </TableCell>
      ),
    }),
    createTableColumn<EmpresaRecord>({
      columnId: 'activo',
      compare: (a, b) => Number(a.activo) - Number(b.activo),
      renderHeaderCell: () => '      Estado',
      renderCell: (item) => (
        <TableCell key="activo" className={styles.cellCenter}>
          <Badge shape="rounded" color={item.activo ? 'success' : 'danger'}>
            {item.activo ? 'Activa' : 'Inactiva'}
          </Badge>
        </TableCell>
      ),
    }),
    createTableColumn<EmpresaRecord>({
      columnId: 'actions',
      compare: undefined,
      renderHeaderCell: () => '      Acciones',
      renderCell: (item) => {
        const isBaseCompany = item.idEmpresa === 1;
        const isDeactivating = item.activo;
        const actionIcon = isDeactivating ? <ToggleLeft24Regular /> : <ToggleRight24Regular />;
        const actionTooltip = isDeactivating ? 'Desactivar Empresa' : 'Reactivar Empresa';
        const actionClass = isDeactivating ? commonStyles.dangerButton : commonStyles.successButton;

        return (
          <TableCell key="actions" className={styles.cellCenter}>
            <div className={`${styles.actionButtons} action-buttons`}>
              <Tooltip content="Editar" relationship="label">
                <Button
                  icon={<Edit24Regular />}
                  aria-label="Editar"
                  onClick={() => onEditEmpresa(item)}
                  disabled={isAnyMutationPending}
                />
              </Tooltip>
              <Tooltip content={actionTooltip} relationship="label">
                <Button
                  icon={actionIcon}
                  aria-label={actionTooltip}
                  className={actionClass}
                  onClick={() => onConfirmDelete(item)} // Usamos onConfirmDelete para la desactivación
                  disabled={isAnyMutationPending || isBaseCompany}
                />
              </Tooltip>
            </div>
          </TableCell>
        );
      },
    }),
  ];

  const {
    getRows,
    sort: { getSortDirection, toggleColumnSort, sort },
  } = useTableFeatures(
    {
      columns,
      items: empresas,
      getRowId: (item) => String(item.idEmpresa),
    },
    [
      useTableSort({
        defaultSortState: { sortColumn: 'razonSocial', sortDirection: 'ascending' },
      }),
    ],
  );

  const rows = sort(getRows());

  return (
    <Table size="small" aria-label="Lista de Empresas" className={styles.table} sortable>
      <TableHeader className={styles.tableHeaderSticky}>
        <TableRow>
          {columns.map((column, index) => (
            <TableHeaderCell
              key={column.columnId} // Usar columnId como key para el encabezado
              className={mergeClasses(
                styles.tableHeaderSticky,
                column.columnId === 'actions' ? styles.cellActions : styles.tableHeaderCell,
              )}
              sortable={column.columnId !== 'actions'}
              sortDirection={
                column.columnId !== 'actions' ? getSortDirection(column.columnId) : undefined
              }
              onClick={
                column.columnId !== 'actions'
                  ? (e) => toggleColumnSort(e, column.columnId as SortColumn)
                  : undefined
              }
            >
              {column.renderHeaderCell()}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length > 0 ? (
          rows.map((row) => (
            <TableRow
              key={row.rowId}
              className={styles.row}
              onDoubleClick={() => onEditEmpresa(row.item)}
            >
              {columns.map((column) => column.renderCell(row.item))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className={styles.cellCenter}>
              No se encontraron empresas.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
