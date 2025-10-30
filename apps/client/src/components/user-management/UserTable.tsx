import React, { useCallback } from 'react';
import {
  makeStyles,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Button,
  Persona,
  Badge,
  PresenceBadgeStatus,
  tokens,
  Title3,
  Tooltip,
} from '@fluentui/react-components';
import { Edit24Regular, KeyReset24Regular, ToggleLeft24Regular } from '@fluentui/react-icons';
import { UserApiResponse, UserRole } from '../../../../shared/types';
import { capitalize, formatDateTime } from '../../utils/helper';
import { DateToolTip } from '../ui/DateToolTip';
import { SortColumn } from '../../hooks/useUserManagement'; // Import SortColumn

const useStyles = makeStyles({
  card: { width: '100%', padding: '0px', gap: '0px', height: '100%' }, // This card is for the internal structure of UserTable
  table: {
    tableLayout: 'auto',
    overflowY: 'auto',
  },
  // Removed footer and tableContainer from here as they are now managed by the parent Card in UserManagementPage.tsx
  // The parent component (UserManagementPage) now handles the Card and its footer/container.
  // This component's Card will simply ensure its content fills the space given by the parent.
  tableHeaderSticky: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  row: { '&:hover .action-buttons': { opacity: 1, pointerEvents: 'auto' }, height: '52px' },
  rowTitle: { fontWeight: 'bolder', fontSize: tokens.fontSizeBase400, whiteSpace: 'nowrap' },
  actionButtons: {
    display: 'flex',
    columnGap: '8px',
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.2s ease-in-out',
  },
  roleRow: {
    paddingTop: '8px',
    backgroundColor: tokens.colorBrandBackground2,
    position: 'sticky',
    top: '31px',
    zIndex: 1,
  },
  cellContent: {
    display: 'flex',
    alignItems: 'center',
  },
});

interface UserTableProps {
  users: { role: UserRole; users: UserApiResponse[] }[];
  totalCount: number;
  totalPages: number;
  activeUsernames: Set<string>;
  isLoadingUsers: boolean; // This prop is now used to control the spinner in the parent
  isFetchingUsers: boolean;
  usersError: Error | null;
  page: number;
  setPage: (page: number) => void;
  sortState: { column: SortColumn; direction: 'ascending' | 'descending' } | null;
  toggleSort: (column: SortColumn) => void;
  onEditUser: (user: UserApiResponse) => void;
  onConfirmAction: (type: 'status' | 'reset', user: UserApiResponse) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  activeUsernames,
  sortState,
  toggleSort,
  onEditUser,
  onConfirmAction,
}) => {
  const styles = useStyles();
  // The spinner logic is now handled by the parent component (UserManagementPage)
  // const showUsersSpinner = useDelayedLoading(isLoadingUsers, 300);

  const getUserPresence = useCallback(
    (user: UserApiResponse) => {
      if (!user.isActive) return { status: 'offline' as PresenceBadgeStatus, outOfOffice: true };
      if (activeUsernames.has(user.username)) return { status: 'available' as PresenceBadgeStatus };
      return { status: 'offline' as PresenceBadgeStatus, outOfOffice: true };
    },
    [activeUsernames],
  );

  return (
    // Removed the outer Card and its footer from here.
    // The parent component (UserManagementPage) now wraps this content in its own Card.
    // This component now only renders the table content directly.
    <Table size="small" aria-label="Lista de usuarios" className={styles.table}>
      <TableHeader className={styles.tableHeaderSticky}>
        <TableRow>
          <TableHeaderCell
            className={styles.rowTitle}
            sortDirection={sortState?.column === 'username' ? sortState.direction : undefined}
            onClick={() => toggleSort('username')}
          >
            Usuario
          </TableHeaderCell>
          <TableHeaderCell
            className={styles.rowTitle}
            sortDirection={sortState?.column === 'realname' ? sortState.direction : undefined}
            onClick={() => toggleSort('realname')}
          >
            Nombre
          </TableHeaderCell>
          <TableHeaderCell
            className={styles.rowTitle}
            sortDirection={sortState?.column === 'email' ? sortState.direction : undefined}
            onClick={() => toggleSort('email')}
          >
            Email
          </TableHeaderCell>
          <TableHeaderCell
            className={styles.rowTitle}
            // Removed sort for 'des_personal'
          >
            Rol
          </TableHeaderCell>
          <TableHeaderCell
            className={styles.rowTitle}
            sortDirection={sortState?.column === 'isActive' ? sortState.direction : undefined}
            onClick={() => toggleSort('isActive')}
          >
            Estado
          </TableHeaderCell>
          <TableHeaderCell
            className={styles.rowTitle}
            sortDirection={sortState?.column === 'lastLoginAt' ? sortState.direction : undefined}
            onClick={() => toggleSort('lastLoginAt')}
          >
            Último Acceso
          </TableHeaderCell>
          <TableHeaderCell className={styles.rowTitle}>Acciones</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(({ role, users: usersInRole }) => (
          <React.Fragment key={role}>
            <TableRow className={styles.roleRow}>
              <TableCell colSpan={7}>
                <Title3>
                  {capitalize(role)} ({usersInRole.length})
                </Title3>
              </TableCell>
            </TableRow>
            {usersInRole.map((user) => (
              <TableRow key={user.id} className={styles.row} onDoubleClick={() => onEditUser(user)}>
                <TableCell>
                  <div className={styles.cellContent}>
                    <Persona
                      name={user.username}
                      secondaryText={formatDateTime(user.createdAt)}
                      presence={getUserPresence(user)}
                      avatar={{ color: 'colorful', name: user.realname || undefined }}
                    />
                  </div>
                </TableCell>
                <TableCell>{user.realname}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge shape="rounded" color="brand">
                    {capitalize(user.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge shape="rounded" color={user.isActive ? 'success' : 'danger'}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.lastLoginAt ? (
                    <DateToolTip text={user.lastLoginAt} />
                  ) : (
                    <Badge shape="rounded" color="danger">
                      Nunca
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className={`${styles.actionButtons} action-buttons`}>
                    <Tooltip content="Editar" relationship="label">
                      <Button
                        icon={<Edit24Regular />}
                        aria-label="Editar"
                        onClick={() => onEditUser(user)}
                      />
                    </Tooltip>
                    <Tooltip
                      content={user.isActive ? 'Desactivar' : 'Activar'}
                      relationship="label"
                    >
                      <Button
                        icon={<ToggleLeft24Regular />}
                        aria-label="Activar/Desactivar"
                        onClick={() => onConfirmAction('status', user)}
                      />
                    </Tooltip>
                    <Tooltip content="Resetear contraseña" relationship="label">
                      <Button
                        icon={<KeyReset24Regular />}
                        aria-label="Resetear contraseña"
                        onClick={() => onConfirmAction('reset', user)}
                      />
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
};
