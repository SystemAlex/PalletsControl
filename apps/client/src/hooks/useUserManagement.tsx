import React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastController, Toast, ToastTitle, ToastBody } from '@fluentui/react-components';
import { useAuth } from '../context/AuthContext';
import {
  fetchUsers,
  fetchActiveUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  resetPassword,
} from '../api/users';
import { UserApiResponse, ActiveUser, UserRole } from '../../../shared/types';
import { UserFormData } from '../components/dialogs/UserDialog'; // Assuming this import path is correct

export type SortColumn = 'username' | 'realname' | 'email' | 'isActive' | 'lastLoginAt';
type SortDirection = 'ascending' | 'descending';

export function useUserManagement() {
  const queryClient = useQueryClient();
  const { dispatchToast } = useToastController('app-toaster');
  const { handleApiError } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [sortState, setSortState] = useState<{
    column: SortColumn;
    direction: SortDirection;
  } | null>(null);

  const notify = useCallback(
    (msg: string, type: 'success' | 'error') => {
      const toastContent = (
        <Toast>
          <ToastTitle>{type === 'success' ? 'Éxito' : 'Error'}</ToastTitle>
          <ToastBody>{msg}</ToastBody>
        </Toast>
      );
      dispatchToast(toastContent, { intent: type, position: 'top-end' });
    },
    [dispatchToast],
  );

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: (err: Error) => {
      notify(err.message, 'error');
      handleApiError(err);
    },
  };

  const createUserMutation = useMutation({
    mutationFn: createUser,
    ...mutationOptions,
    onSuccess: () => {
      notify('Usuario creado exitosamente.', 'success');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
  const updateUserMutation = useMutation({
    mutationFn: updateUser,
    ...mutationOptions,
    onSuccess: () => {
      notify('Usuario actualizado.', 'success');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
  const toggleStatusMutation = useMutation({
    mutationFn: toggleUserStatus,
    ...mutationOptions,
    onSuccess: () => {
      notify('Estado del usuario actualizado.', 'success');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    ...mutationOptions,
    onSuccess: () => {
      notify('Contraseña reseteada a "Clave123".', 'success');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
    error: usersError,
  } = useQuery<{ users: UserApiResponse[]; totalCount: number }, Error>({
    queryKey: ['users', page, searchQuery],
    queryFn: async () => {
      try {
        return await fetchUsers(page, limit, searchQuery);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: activeUsersData } = useQuery<ActiveUser[], Error>({
    queryKey: ['activeUsers'],
    queryFn: async () => {
      try {
        return await fetchActiveUsers(); // No longer passing excludeUserId
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    refetchInterval: 5000, // Reduced interval for active users
  });

  const users = usersData?.users || [];
  const totalCount = usersData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);
  const activeUsers: ActiveUser[] = activeUsersData || [];
  const activeUsernames = useMemo(
    () => new Set(activeUsers.map((u: ActiveUser) => u.username)),
    [activeUsers],
  );

  const toggleSort = useCallback((column: SortColumn) => {
    setSortState((prev) => {
      if (!prev || prev.column !== column) return { column, direction: 'ascending' };
      if (prev.direction === 'ascending') return { column, direction: 'descending' };
      return null; // cycle: none → asc → desc → none
    });
  }, []);

  const comparators: Record<SortColumn, (a: UserApiResponse, b: UserApiResponse) => number> = {
    username: (a, b) => a.username.localeCompare(b.username),
    realname: (a, b) => b.realname.localeCompare(a.realname),
    email: (a, b) => {
      if (!a.email && !b.email) return 0;
      if (!a.email) return 1;
      if (!b.email) return -1;
      return a.email.localeCompare(b.email);
    },
    isActive: (a, b) => Number(a.isActive) - Number(b.isActive),
    lastLoginAt: (a, b) => {
      const at = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : -Infinity;
      const bt = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : -Infinity;
      return at - bt;
    },
  };

  const groupedAndSortedUsers = useMemo(() => {
    const grouped = new Map<string, UserApiResponse[]>();
    users.forEach((user: UserApiResponse) => {
      if (!grouped.has(user.role)) grouped.set(user.role, []);
      grouped.get(user.role)!.push(user);
    });

    return Array.from(grouped.entries()).map(([role, usersInRole]) => {
      if (!sortState) {
        return { role: role as UserRole, users: usersInRole };
      }
      const base = [...usersInRole];
      const cmp = comparators[sortState.column];
      base.sort((a, b) => {
        const r = cmp(a, b);
        return sortState.direction === 'ascending' ? r : -r;
      });
      return { role: role as UserRole, users: base };
    });
  }, [users, sortState]);

  const handleUserSubmit = useCallback(
    (user: UserFormData) => {
      if (user.id) {
        const { id, realname, email, role, isActive } = user;
        updateUserMutation.mutate({
          id,
          payload: {
            realname,
            email,
            role,
            isActive: isActive ?? false,
          },
        });
      } else {
        const { username, realname, email, role } = user;
        createUserMutation.mutate({
          username,
          realname,
          email,
          role,
          isActive: true,
          password: user.password || 'Clave123',
        });
      }
    },
    [createUserMutation, updateUserMutation],
  );

  return {
    users: groupedAndSortedUsers,
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
    createUserIsPending: createUserMutation.isPending,
    updateUserIsPending: updateUserMutation.isPending,
    toggleStatusMutation,
    resetPasswordMutation,
    handleApiError,
  };
}