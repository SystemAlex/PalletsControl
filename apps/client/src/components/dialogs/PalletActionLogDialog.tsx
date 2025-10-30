import React, { useState, useCallback, useMemo } from 'react';
import {
  Button,
  makeStyles,
  Text,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  tokens,
  CardFooter,
  SearchBox,
  InputOnChangeData,
  SearchBoxChangeEvent,
  Combobox,
  Option,
  useId,
  mergeClasses,
} from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat'; // Importar DatePicker
import BaseDialog from '../ui/BaseDialog';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchPalletActionLogs, FetchPalletActionLogsParams } from '../../api/palletActionLogs';
import { PalletActionLogRecord } from '../../../../shared/types';
import { SpinnerCustom } from '../ui/SpinnerCustom';
import { DateToolTip } from '../ui/DateToolTip';
import { dateFromYmd, formatYmd, esDatePickerStrings, onFormatDate } from '../../utils/helper'; // Importar helpers de fecha
import { subDays } from 'date-fns'; // Import subDays
import { useTableStyles } from '../../theme/tableStyles'; // Importar estilos de tabla comunes

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: '800px',
    maxHeight: '80vh',
    '@media(max-width: 768px)': {
      minWidth: 'auto',
      maxHeight: 'calc(100dvh - 100px)',
    },
  },
  filtersContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '8px',
    '@media(max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  tableContainer: {
    overflowX: 'auto',
    overflowY: 'auto',
    flexGrow: 1,
  },
  table: {
    tableLayout: 'auto',
    minWidth: '100%',
  },
  tableHeaderCell: {
    fontWeight: '600',
    backgroundColor: tokens.colorNeutralBackground1,
    position: 'sticky',
    top: 0,
    zIndex: 1,
    textAlign: 'center',
  },
  cellLeft: {
    textAlign: 'left',
  },
  cellCenter: {
    textAlign: 'center',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0px',
  },
  jsonPre: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackground3,
    padding: '4px',
    borderRadius: tokens.borderRadiusMedium,
    maxHeight: '150px',
    overflow: 'auto',
  },
  expandableCell: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground4,
    },
  },
  datePickerField: {
    // Estilo para el Field que envuelve el DatePicker
    width: '100%',
  },
});

interface PalletActionLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actionTypes = [
  { value: 'CREATE_POSITION', text: 'Crear Posición' },
  { value: 'UPDATE_POSITION_STATUS', text: 'Actualizar Estado Posición' },
  { value: 'DELETE_POSITION', text: 'Eliminar Posición' },
  { value: 'ADD_PRODUCT', text: 'Subir Producto' },
  { value: 'UPDATE_PRODUCT', text: 'Actualizar Bultos' },
  { value: 'DELETE_PRODUCT', text: 'Bajar Producto' },
];

export const PalletActionLogDialog: React.FC<PalletActionLogDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const styles = useStyles();
  const tableStyles = useTableStyles(); // Usar estilos de tabla comunes
  const { handleApiError } = useAuth();
  const actionTypeComboId = useId('action-type-combo');

  // Calculate default dates for the last 30 days
  const getInitialDates = useCallback(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    return {
      startDate: formatYmd(thirtyDaysAgo),
      endDate: formatYmd(today),
    };
  }, []);

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(getInitialDates().startDate);
  const [endDate, setEndDate] = useState(getInitialDates().endDate);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const limit = 20;

  const queryParams: FetchPalletActionLogsParams = useMemo(
    () => ({
      limit,
      offset: (page - 1) * limit,
      search: searchQuery || undefined,
      actionType: selectedActionType || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [page, searchQuery, selectedActionType, startDate, endDate],
  );

  const {
    data: logData,
    isLoading,
    error,
  } = useQuery<{ logs: PalletActionLogRecord[]; totalCount: number }, Error>({
    queryKey: ['palletActionLogs', queryParams],
    queryFn: async () => {
      try {
        return await fetchPalletActionLogs(queryParams);
      } catch (err) {
        handleApiError(err);
        throw err;
      }
    },
    enabled: open,
  });

  const logs = logData?.logs || [];
  const totalCount = logData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const handleSearchChange = useCallback((_: SearchBoxChangeEvent, data: InputOnChangeData) => {
    setSearchQuery(data.value);
    setPage(1);
  }, []);

  const handleActionTypeSelect = useCallback((_: unknown, data: { optionValue?: string }) => {
    setSelectedActionType(data.optionValue || null);
    setPage(1);
  }, []);

  const handleStartDateChange = useCallback((date: Date | null | undefined) => {
    setStartDate(date ? formatYmd(date) : '');
    setPage(1);
  }, []);

  const handleEndDateChange = useCallback((date: Date | null | undefined) => {
    setEndDate(date ? formatYmd(date) : '');
    setPage(1);
  }, []);

  const handleToggleExpand = useCallback((id: number) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setPage(1);
    setSearchQuery('');
    setSelectedActionType(null);
    // Reset dates to default when closing
    const { startDate: defaultStartDate, endDate: defaultEndDate } = getInitialDates();
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setExpandedLogId(null);
  }, [onOpenChange, getInitialDates]);

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleClose}
      title="Registro de Acciones de Pallets"
      fitContent
    >
      <div className={styles.dialogContent}>
        <div className={styles.filtersContainer}>
          <SearchBox
            placeholder="Buscar por descripción, usuario..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <Combobox
            id={actionTypeComboId}
            aria-labelledby={actionTypeComboId}
            placeholder="Filtrar por tipo de acción"
            value={actionTypes.find((t) => t.value === selectedActionType)?.text || ''}
            onOptionSelect={handleActionTypeSelect}
            clearable
          >
            {actionTypes.map((type) => (
              <Option key={type.value} value={type.value}>
                {type.text}
              </Option>
            ))}
          </Combobox>
          <div className={styles.filtersContainer}>
            <DatePicker
              allowTextInput={false}
              value={dateFromYmd(startDate)}
              onSelectDate={handleStartDateChange}
              strings={esDatePickerStrings}
              formatDate={onFormatDate}
              placeholder="Selecciona una fecha"
            />
            <DatePicker
              allowTextInput={false}
              value={dateFromYmd(endDate)}
              onSelectDate={handleEndDateChange}
              strings={esDatePickerStrings}
              formatDate={onFormatDate}
              placeholder="Selecciona una fecha"
            />
          </div>
        </div>

        {isLoading ? (
          <SpinnerCustom text="Cargando registro de acciones..." />
        ) : error ? (
          <Text color="danger">Error: {(error as Error).message}</Text>
        ) : (
          <div className={tableStyles.tableContainer}>
            <Table
              size="small"
              aria-label="Registro de Acciones de Pallets"
              className={tableStyles.table}
            >
              <TableHeader>
                <TableRow>
                  <TableHeaderCell className={styles.tableHeaderCell}>Fecha</TableHeaderCell>
                  <TableHeaderCell className={styles.tableHeaderCell}>Usuario</TableHeaderCell>
                  <TableHeaderCell className={styles.tableHeaderCell}>
                    Tipo de Acción
                  </TableHeaderCell>
                  <TableHeaderCell className={styles.tableHeaderCell}>Descripción</TableHeaderCell>
                  <TableHeaderCell className={styles.tableHeaderCell}>Detalles</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <TableRow>
                        <TableCell className={tableStyles.cellCenter}>
                          <DateToolTip text={log.timestamp} />
                        </TableCell>
                        <TableCell className={tableStyles.cellLeft}>
                          <Text>{log.realname}</Text>{' '}
                          <Text size={200} color="subtle">
                            ({log.username})
                          </Text>
                        </TableCell>
                        <TableCell className={tableStyles.cellCenter}>
                          {actionTypes.find((type) => type.value === log.actionType)?.text ||
                            log.actionType}
                        </TableCell>
                        <TableCell className={tableStyles.cellLeft}>{log.description}</TableCell>
                        <TableCell
                          className={mergeClasses(tableStyles.cellCenter, styles.expandableCell)}
                          onClick={() => handleToggleExpand(log.id)}
                        >
                          {log.oldValue || log.newValue ? (
                            <Button appearance="subtle" size="small">
                              {expandedLogId === log.id ? 'Ocultar' : 'Ver'}
                            </Button>
                          ) : (
                            <Text color="subtle">N/A</Text>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedLogId === log.id && (
                        <TableRow>
                          <TableCell colSpan={5}>
                            {log.oldValue && (
                              <>
                                <Text weight="semibold">Antes:</Text>
                                <pre className={styles.jsonPre}>{log.oldValue}</pre>
                              </>
                            )}
                            {log.newValue && (
                              <>
                                <Text weight="semibold">Despues:</Text>
                                <pre className={styles.jsonPre}>{log.newValue}</pre>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Text align="center" block>
                        No hay registros de acciones para mostrar.
                      </Text>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <CardFooter className={styles.footer}>
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <Text>
            Página {page} de {totalPages}
          </Text>
          <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Siguiente
          </Button>
        </CardFooter>
      </div>
    </BaseDialog>
  );
};
