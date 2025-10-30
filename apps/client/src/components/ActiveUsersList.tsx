import React from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Persona,
  PresenceBadgeStatus,
  CardPreview,
  tokens,
  TableColumnDefinition,
  createTableColumn,
  useTableFeatures,
  useTableSort,
  DialogTitle,
} from '@fluentui/react-components';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { fetchActiveUsers } from '../api/users';
import { capitalize } from '../utils/helper';
import { SpinnerCustom } from './ui/SpinnerCustom';
import { DateToolTip } from './ui/DateToolTip';
import { ActiveUser } from '../../../shared/types';

const useStyles = makeStyles({
  card: {
    width: 'fit-content',
    padding: '12px 0px 0px 0px',
    height: '100%',
    gap: '8px',
    placeSelf: 'anchor-center',
    textWrap: 'nowrap',
  },
  header: {
    paddingLeft: '12px',
    paddingRight: '36px',
  },
  tableContainer: {
    margin: '0px !important',
    overflow: 'hidden',
  },
  table: {
    tableLayout: 'auto',
    overflowY: 'auto',
    height: 'calc(100% + 1px) !important',
  },
  tableHeaderCell: {
    fontWeight: '600',
    backgroundColor: tokens.colorNeutralBackground1,
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  cellFlex: {
    display: 'flex',
    paddingBlock: '2px',
  },
  padX: {
    paddingInline: '12px',
    paddingBottom: '12px',
    whiteSpace: 'nowrap',
  },
});

interface ActiveUsersListProps {
  handleApiError: (error: unknown) => void;
}

export default function ActiveUsersList({ handleApiError }: ActiveUsersListProps) {
  const styles = useStyles();
  const { user: currentUser } = useAuth();

  const allowedRolesForActiveUsers = ['admin', 'developer'];
  const canViewActiveUsers = !!currentUser && allowedRolesForActiveUsers.includes(currentUser.role);

  const {
    data: activeUsersData,
    isLoading: isLoadingActiveUsers,
    error: activeUsersError,
  } = useQuery<ActiveUser[], Error>({
    queryKey: ['activeUsers'],
    queryFn: async () => {
      try {
        return await fetchActiveUsers(); // No longer passing excludeUserId
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    refetchInterval: 5000,
    enabled: canViewActiveUsers,
  });

  // Filter out the current user from the list for display in this component
  const otherActiveUsers = activeUsersData?.filter((u) => u.id !== currentUser?.id) || [];

  // Corrected getUserPresence logic
  const getUserPresence = (): { status: PresenceBadgeStatus } => {
    // For ActiveUsersList, all users in `otherActiveUsers` are by definition active.
    return { status: 'available' };
  };

  // Definición de columnas
  const columns: TableColumnDefinition<ActiveUser>[] = [
    createTableColumn<ActiveUser>({
      columnId: 'username',
      compare: (a, b) => a.username.localeCompare(b.username),
      renderHeaderCell: () => 'Usuario',
      renderCell: (item) => (
        <Persona
          size="extra-large"
          presenceOnly
          textAlignment="center"
          name={item.username}
          secondaryText={capitalize(item.role)}
          presence={getUserPresence()} // Pasa el item a getUserPresence
          avatar={{ color: 'colorful', name: item.realname }}
        />
      ),
    }),
    createTableColumn<ActiveUser>({
      columnId: 'lastActivityAt',
      compare: (a, b) =>
        new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime(),
      renderHeaderCell: () => 'Activo',
      renderCell: (item) => <DateToolTip text={item.lastActivityAt} />,
    }),
  ];

  // Configuración de la tabla, sin defaultSortState para respetar el orden inicial
  const {
    getRows,
    sort: { getSortDirection, toggleColumnSort, sort },
  } = useTableFeatures<ActiveUser>(
    {
      columns,
      items: otherActiveUsers, // Use the filtered list here
      getRowId: (item) => String(item.id),
    },
    [
      useTableSort({
        defaultSortState: {
          sortColumn: 'lastActivityAt',
          sortDirection: 'descending',
        },
      }),
    ],
  );

  // Mantiene el orden original (ya descendente) y marca el encabezado como descendente
  const rows = sort(getRows());

  return (
    <Card className={styles.card}>
      <CardHeader className={styles.header} header={<DialogTitle>Usuarios Activos</DialogTitle>} />
      {isLoadingActiveUsers ? (
        <SpinnerCustom text="Cargando" className={styles.padX} />
      ) : activeUsersError ? (
        <Text className={styles.padX}>{(activeUsersError as Error).message}</Text>
      ) : !canViewActiveUsers ? (
        <Text className={styles.padX}>No tienes permisos para ver los usuarios activos.</Text>
      ) : !otherActiveUsers || otherActiveUsers.length === 0 ? ( // Check filtered list
        <Text className={styles.padX}>No hay usuarios activos en este momento.</Text>
      ) : (
        <CardPreview className={styles.tableContainer}>
          <Table size="small" aria-label="Usuarios activos" className={styles.table}>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHeaderCell
                    key={String(column.columnId)}
                    className={styles.tableHeaderCell}
                    sortDirection={getSortDirection(column.columnId)}
                    onClick={(e) => toggleColumnSort(e, column.columnId)}
                  >
                    {column.renderHeaderCell()}
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.rowId}>
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.columnId)}
                      className={column.columnId === 'username' ? styles.cellFlex : undefined}
                    >
                      {column.renderCell(row.item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardPreview>
      )}
    </Card>
  );
}