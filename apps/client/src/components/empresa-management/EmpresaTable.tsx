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
  Tooltip,
  mergeClasses,
  useTableFeatures,
  useTableSort,
  createTableColumn,
  TableColumnDefinition,
  Persona,
  tokens,
} from '@fluentui/react-components';
import {
  EditRegular,
  ToggleLeftRegular,
  ToggleRightRegular,
  MoneyRegular,
  DismissCircleFilled,
  CheckmarkCircleFilled,
  CheckmarkCircle24Filled,
  DismissCircle24Filled,
} from '@fluentui/react-icons';
import { EmpresaRecord } from '../../../../shared/types';
import { useCommonStyles } from '../../theme/commonStyles';
import { SortColumn } from '../../hooks/useEmpresaManagement';
import { DateToolTip } from '../ui/DateToolTip';
import { capitalize } from '../../utils/helper';

const useStyles = makeStyles({
  tableWidth: {
    minWidth: '100%',
  },
});

interface EmpresaTableProps {
  empresas: EmpresaRecord[];
  onEditEmpresa: (empresa: EmpresaRecord) => void;
  onConfirmDelete: (empresa: EmpresaRecord) => void;
  onRegisterPayment: (empresa: EmpresaRecord) => void;
  isAnyMutationPending: boolean;
}

export const EmpresaTable: React.FC<EmpresaTableProps> = ({
  empresas,
  onEditEmpresa,
  onConfirmDelete,
  onRegisterPayment,
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
          <div className={commonStyles.cellContent}>
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
        <TableCell key="cuit" className={commonStyles.cellCenter}>
          {item.cuit}
        </TableCell>
      ),
    }),
    createTableColumn<EmpresaRecord>({
      columnId: 'telefono',
      compare: (a, b) => (a.telefono || '').localeCompare(b.telefono || ''),
      renderHeaderCell: () => '      Teléfono',
      renderCell: (item) => (
        <TableCell key="telefono" className={commonStyles.cellCenter}>
          {item.telefono}
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
      columnId: 'fechaAlta',
      compare: (a, b) => new Date(a.fechaAlta).getTime() - new Date(b.fechaAlta).getTime(),
      renderHeaderCell: () => '      Fecha Alta',
      renderCell: (item) => (
        <TableCell key="fechaAlta" className={commonStyles.cellCenter}>
          <DateToolTip text={item.fechaAlta} isDateOnly />
        </TableCell>
      ),
    }),
    createTableColumn<EmpresaRecord>({
      columnId: 'activo',
      compare: (a, b) => Number(a.activo) - Number(b.activo),
      renderHeaderCell: () => '      Estado',
      renderCell: (item) => (
        <TableCell key="activo" className={commonStyles.cellCenter}>
          <Badge shape="rounded" color={item.activo ? 'success' : 'danger'}>
            {item.activo ? 'Activa' : 'Inactiva'}
          </Badge>
        </TableCell>
      ),
    }),
    createTableColumn<EmpresaRecord>({
      columnId: 'frecuenciaPago',
      compare: (a, b) => a.frecuenciaPago.localeCompare(b.frecuenciaPago),
      renderHeaderCell: () => '      Frecuencia',
      renderCell: (item) => (
        <TableCell key="frecuenciaPago" className={commonStyles.cellCenter}>
          {capitalize(item.frecuenciaPago)}
        </TableCell>
      ),
    }),
    createTableColumn<EmpresaRecord>({
      columnId: 'lastPaymentDate',
      compare: (a, b) => {
        const dateA = a.lastPaymentDate ? new Date(a.lastPaymentDate).getTime() : -Infinity;
        const dateB = b.lastPaymentDate ? new Date(b.lastPaymentDate).getTime() : -Infinity;
        return dateA - dateB;
      },
      renderHeaderCell: () => '      Último Pago',
      renderCell: (item) => (
        <TableCell key="lastPaymentDate" className={commonStyles.cellCenter}>
          {item.lastPaymentDate ? (
            <DateToolTip text={item.lastPaymentDate} isDateOnly />
          ) : (
            <Badge shape="rounded" color="danger">
              N/A
            </Badge>
          )}
        </TableCell>
      ),
    }),
    createTableColumn<EmpresaRecord>({
      columnId: 'nextPaymentDate',
      compare: (a, b) => {
        const dateA = a.nextPaymentDate ? new Date(a.nextPaymentDate).getTime() : Infinity;
        const dateB = b.nextPaymentDate ? new Date(b.nextPaymentDate).getTime() : Infinity;
        return dateA - dateB;
      },
      renderHeaderCell: () => '      Próximo Pago',
      renderCell: (item) => (
        <TableCell key="nextPaymentDate" className={commonStyles.cellCenter}>
          {item.frecuenciaPago !== 'permanente' ? (
            item.nextPaymentDate ? (
              <DateToolTip text={item.nextPaymentDate} isDateOnly />
            ) : (
              <Badge shape="rounded" color="danger">
                N/A
              </Badge>
            )
          ) : (
            <Badge shape="rounded" color="success">
              Permanente
            </Badge>
          )}
        </TableCell>
      ),
    }),
    createTableColumn<EmpresaRecord>({
      columnId: 'isBlocked',
      compare: (a, b) => Number(a.isBlocked) - Number(b.isBlocked),
      renderHeaderCell: () => '      Acceso',
      renderCell: (item) => (
        <TableCell key="isBlocked" className={mergeClasses(commonStyles.cellCenter)}>
          {item.isBlocked ? (
            <Tooltip content="Bloqueada por falta de pago" relationship="label">
              <DismissCircle24Filled color={tokens.colorStatusDangerForeground1} />
            </Tooltip>
          ) : (
            <CheckmarkCircle24Filled color={tokens.colorStatusSuccessForeground1} />
          )}
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
        const actionIcon = isDeactivating ? <ToggleLeftRegular /> : <ToggleRightRegular />;
        const actionTooltip = isDeactivating ? 'Desactivar Empresa' : 'Reactivar Empresa';
        const actionClass = isDeactivating ? commonStyles.dangerButton : commonStyles.successButton;

        return (
          <TableCell key="actions" className={commonStyles.cellCenter}>
            <div className={`${commonStyles.actionButtons} action-buttons`}>
              <Tooltip content="Registrar Pago" relationship="label">
                <Button
                  icon={<MoneyRegular />}
                  aria-label="Registrar Pago"
                  className={commonStyles.successButton}
                  onClick={() => onRegisterPayment(item)}
                  disabled={isAnyMutationPending || isBaseCompany}
                />
              </Tooltip>
              <Tooltip content="Editar" relationship="label">
                <Button
                  icon={<EditRegular />}
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
    <Table
      size="small"
      aria-label="Lista de Empresas"
      className={mergeClasses(styles.tableWidth, commonStyles.tableAuto)}
      sortable
    >
      <TableHeader className={commonStyles.tableHeaderSticky}>
        <TableRow>
          {columns.map((column) => (
            <TableHeaderCell
              key={column.columnId} // Usar columnId como key para el encabezado
              className={mergeClasses(
                commonStyles.tableHeaderSticky,
                column.columnId === 'actions'
                  ? commonStyles.cellActions
                  : commonStyles.tableHeaderCell,
              )}
              sortable={column.columnId !== 'actions'}
              sortDirection={
                column.columnId !== 'actions'
                  ? getSortDirection(column.columnId as SortColumn)
                  : undefined
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
              className={commonStyles.rowActions}
              onDoubleClick={() => onEditEmpresa(row.item)}
            >
              {columns.map((column) => column.renderCell(row.item))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className={commonStyles.cellCenter}>
              No se encontraron empresas.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
