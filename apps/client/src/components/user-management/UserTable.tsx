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
  mergeClasses,
} from '@fluentui/react-components';
import { Edit24Regular, KeyReset24Regular, ToggleLeft24Regular } from '@fluentui/react-icons';
import { UserApiResponse, UserRole } from '../../../../shared/types';
import { capitalize, formatDateTime } from '../../utils/helper';
import { DateToolTip } from '../ui/DateToolTip';
import { SortColumn } from '../../hooks/useUserManagement'; // Import SortColumn
import { useCommonStyles } from '../../theme/commonStyles';

const useStyles = makeStyles({
  tableOver: {
    overflowY: 'auto',
  },
  roleRow: {
    paddingTop: '8px',
    backgroundColor: tokens.colorBrandBackground2,
    position: 'sticky',
    top: '31px',
    zIndex: 1,
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
  const commonStyles = useCommonStyles();

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
    <Table
      size="small"
      aria-label="Lista de usuarios"
      className={mergeClasses(styles.tableOver, commonStyles.tableAuto)}
    >
      <TableHeader className={commonStyles.tableHeaderSticky}>
        <TableRow>
          <TableHeaderCell
            className={mergeClasses(
              commonStyles.tableHeaderSticky,
              commonStyles.tableHeaderCell,
              commonStyles.cellClickable,
            )}
            sortDirection={sortState?.column === 'username' ? sortState.direction : undefined}
            onClick={() => toggleSort('username')}
          >
            {`\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0`}Usuario
          </TableHeaderCell>
          <TableHeaderCell
            className={mergeClasses(
              commonStyles.tableHeaderSticky,
              commonStyles.tableHeaderCell,
              commonStyles.cellClickable,
            )}
            sortDirection={sortState?.column === 'realname' ? sortState.direction : undefined}
            onClick={() => toggleSort('realname')}
          >
            {`\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0`}Nombre
          </TableHeaderCell>
          <TableHeaderCell
            className={mergeClasses(
              commonStyles.tableHeaderSticky,
              commonStyles.tableHeaderCell,
              commonStyles.cellClickable,
            )}
            sortDirection={sortState?.column === 'email' ? sortState.direction : undefined}
            onClick={() => toggleSort('email')}
          >
            {`\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0`}Email
          </TableHeaderCell>
          <TableHeaderCell
            className={mergeClasses(
              commonStyles.tableHeaderSticky,
              commonStyles.tableHeaderCell,
              commonStyles.cellClickable,
            )}
            sortDirection={sortState?.column === 'isActive' ? sortState.direction : undefined}
            onClick={() => toggleSort('isActive')}
          >
            {`\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0`}Estado
          </TableHeaderCell>
          <TableHeaderCell
            className={mergeClasses(
              commonStyles.tableHeaderSticky,
              commonStyles.tableHeaderCell,
              commonStyles.cellClickable,
            )}
            sortDirection={sortState?.column === 'lastLoginAt' ? sortState.direction : undefined}
            onClick={() => toggleSort('lastLoginAt')}
          >
            {`\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0`}Último Acceso
          </TableHeaderCell>
          <TableHeaderCell
            className={mergeClasses(commonStyles.tableHeaderSticky, commonStyles.cellActions)}
          >
            Acciones
          </TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(({ role, users: usersInRole }) => (
          <React.Fragment key={role}>
            <TableRow className={styles.roleRow}>
              <TableCell colSpan={6}>
                <Title3>
                  {capitalize(role)} ({usersInRole.length})
                </Title3>
              </TableCell>
            </TableRow>
            {usersInRole.map((user) => (
              <TableRow
                key={user.id}
                className={commonStyles.rowActions}
                onDoubleClick={() => onEditUser(user)}
              >
                <TableCell>
                  <div className={commonStyles.cellContent}>
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
                <TableCell className={commonStyles.cellCenter}>
                  <Badge shape="rounded" color={user.isActive ? 'success' : 'danger'}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className={commonStyles.cellCenter}>
                  {user.lastLoginAt ? (
                    <DateToolTip text={user.lastLoginAt} />
                  ) : (
                    <Badge shape="rounded" color="danger">
                      Nunca
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className={`${commonStyles.actionButtons} action-buttons`}>
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
