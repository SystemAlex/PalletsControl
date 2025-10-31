import React, { useState, useEffect, useCallback } from 'react';
import {
  makeStyles,
  Card,
  Text,
  CardFooter,
  Button,
  mergeClasses,
} from '@fluentui/react-components';
import { useMainLayoutContext } from '../layouts/MainLayout';
import UserDialog, { UserFormData } from '../components/dialogs/UserDialog';
import ConfirmationDialog from '../components/dialogs/ConfirmationDialog';
import ActiveUsersList from '../components/ActiveUsersList';
import LoginHistoryList from '../components/LoginHistoryList';
import { UserApiResponse } from '../../../shared/types';
import { useUserManagement } from '../hooks/useUserManagement';
import { UserTable } from '../components/user-management/UserTable';
import { UserManagementHeader } from '../components/user-management/UserManagementHeader';
import { SearchBoxChangeEvent, InputOnChangeData } from '@fluentui/react-components';
import { SpinnerCustom } from '../components/ui/SpinnerCustom'; // Import SpinnerCustom

const useStyles = makeStyles({
  root: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gridTemplateRows: 'auto auto',
    gap: '8px',
    height: '100%',
    '@media(max-width: 600px)': {
      gridTemplateColumns: 'auto',
      gridTemplateRows: 'auto auto auto',
    },
    '@media(min-width: 601px) and (max-width: 768px)': {
      gridTemplateColumns: 'auto 1fr',
    },
  },
  card: { width: '100%', padding: '0px', gap: '0px', height: '100%' }, // Restaurado aquí
  card1: {
    gridRow: 'span 2 / span 2',
    '@media(max-width: 600px)': {
      gridRow: 'auto',
      gridColumn: 'auto',
    },
    '@media(min-width: 601px) and (max-width: 768px)': {
      gridRow: 'auto',
      gridColumn: 'span 2 / span 2',
    },
  },
  // Los estilos específicos de la tabla (table, footer, tableContainer, etc.)
  // se mantienen en apps/client/src/components/user-management/UserTable.tsx
  tableContainer: { maxHeight: 'calc(100vh - 140px)', overflowY: 'auto', height: '100%' },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
  },
});

export default function UserManagementPage() {
  const styles = useStyles();
  const { setHeaderContent, setHeaderText, isMobile } = useMainLayoutContext();

  const {
    users,
    totalCount,
    totalPages,
    activeUsernames,
    isLoadingUsers,
    isFetchingUsers,
    usersError,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    sortState,
    toggleSort,
    handleUserSubmit,
    createUserIsPending,
    updateUserIsPending,
    toggleStatusMutation,
    resetPasswordMutation,
    handleApiError,
  } = useUserManagement();

  const [isUserDialogOpen, setUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserFormData | null>(null);
  const [confirmation, setConfirmation] = useState<{
    type: 'status' | 'reset';
    user: UserApiResponse;
  } | null>(null);

  const handleSearchChange = useCallback(
    (_: SearchBoxChangeEvent, data: InputOnChangeData) => {
      setSearchQuery(data.value);
      setPage(1);
    },
    [setSearchQuery, setPage],
  );

  const handleCreateUserClick = useCallback(() => {
    setUserToEdit(null);
    setUserDialogOpen(true);
  }, []);

  const handleEditUser = useCallback((user: UserApiResponse) => {
    setUserToEdit({
      id: user.id,
      username: user.username,
      realname: user.realname,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      password: '', // Password is not fetched for security reasons
    });
    setUserDialogOpen(true);
  }, []);

  const handleConfirmAction = useCallback((type: 'status' | 'reset', user: UserApiResponse) => {
    setConfirmation({ type, user });
  }, []);

  useEffect(() => {
    setHeaderText('Gestión de usuarios');
    const header = (
      <UserManagementHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onCreateUserClick={handleCreateUserClick}
        isMobile={isMobile}
      />
    );
    setHeaderContent(header);

    return () => {
      setHeaderText(null);
      setHeaderContent(null);
    };
  }, [
    setHeaderText,
    setHeaderContent,
    searchQuery,
    handleSearchChange,
    handleCreateUserClick,
    isMobile,
  ]);

  return (
    <div className={styles.root}>
      {/* Main Table - wrapped in Card with styles.card and styles.card1 */}
      <Card className={mergeClasses(styles.card, styles.card1)}>
        {isLoadingUsers ? (
          <SpinnerCustom text="Cargando usuarios" />
        ) : usersError ? (
          <Text>{(usersError as Error).message}</Text>
        ) : (
          <>
            <div className={styles.tableContainer}>
              {/* This div is now just for max-height and overflow */}
              <UserTable
                users={users}
                totalCount={totalCount}
                totalPages={totalPages}
                activeUsernames={activeUsernames}
                isLoadingUsers={isLoadingUsers} // Pass isLoadingUsers to UserTable if it needs to show its own spinner
                isFetchingUsers={isFetchingUsers}
                usersError={usersError}
                page={page}
                setPage={setPage}
                sortState={sortState}
                toggleSort={toggleSort}
                onEditUser={handleEditUser}
                onConfirmAction={handleConfirmAction}
              />
            </div>
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
          </>
        )}
      </Card>

      {/* Active Users List - direct child of root */}
      <ActiveUsersList handleApiError={handleApiError} />

      {/* Login History List - direct child of root */}
      <LoginHistoryList
        activeUsernames={activeUsernames}
        handleApiError={handleApiError}
        searchQuery={searchQuery}
      />

      <UserDialog
        open={isUserDialogOpen}
        onOpenChange={setUserDialogOpen}
        onSubmit={handleUserSubmit}
        isSubmitting={createUserIsPending || updateUserIsPending}
        userToEdit={userToEdit}
      />
      {confirmation && (
        <ConfirmationDialog
          open={!!confirmation}
          onOpenChange={() => setConfirmation(null)}
          onConfirm={() => {
            if (confirmation.type === 'status')
              toggleStatusMutation.mutate({
                id: confirmation.user.id,
                isActive: !confirmation.user.isActive,
              });
            if (confirmation.type === 'reset') resetPasswordMutation.mutate(confirmation.user.id);
          }}
          title={
            confirmation.type === 'status'
              ? 'Confirmar Cambio de Estado'
              : 'Confirmar Reseteo de Contraseña'
          }
          message={`¿Estás seguro de que quieres ${
            confirmation.type === 'status'
              ? confirmation.user.isActive
                ? 'desactivar al'
                : 'activar al'
              : 'resetear la contraseña del'
          }
           usuario "${confirmation.user.username}"?`}
          message2={`El Usuario ${
            confirmation.type === 'status'
              ? confirmation.user.isActive
                ? 'no podra ingresar.'
                : 'podra ingresar.'
              : 'deberia ingresar con "Clave123".'
          }`}
          isDestructive={confirmation.type === 'status' && confirmation.user.isActive}
        />
      )}
    </div>
  );
}