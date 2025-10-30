import React, { createContext, useContext, useEffect, ReactNode, useCallback, useRef } from 'react';
import {
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  Button,
  Toaster,
} from '@fluentui/react-components';
import { useQuery, useMutation, useQueryClient, QueryObserverResult } from '@tanstack/react-query';
import { AuthenticatedUser } from '../../../shared/types';
import { ApiError } from '../utils/api';

interface AuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (vars: { username: string; password: string }) => Promise<{ user: AuthenticatedUser }>;
  logout: () => Promise<void>;
  changePassword: (vars: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<{ message: string; user: AuthenticatedUser }>;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  isChangingPassword: boolean;
  renewSession: () => Promise<QueryObserverResult<AuthenticatedUser | null, Error>>;
  handleApiError: (error: unknown) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchMe = async (): Promise<AuthenticatedUser | null> => {
  const res = await fetch('/api/auth/me');
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Error al verificar la sesión');
  return res.json();
};

const loginUser = async (credentials: {
  username: string;
  password: string;
}): Promise<{ user: AuthenticatedUser }> => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error al iniciar sesión');
  }
  return data;
};

const logoutUser = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
};

const changeUserPassword = async (passwords: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string; user: AuthenticatedUser }> => {
  const response = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(passwords),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error al cambiar la contraseña');
  }
  return data;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { dispatchToast, dismissToast, dismissAllToasts } = useToastController('session-toaster');
  const persistentToastVisibleRef = useRef(false);

  const {
    data: user,
    isLoading,
    refetch: renewSession,
  } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    retry: false,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && 'query' in event && event.query.state.status === 'success') {
        if (persistentToastVisibleRef.current) {
          dismissToast('network-error');
          persistentToastVisibleRef.current = false;
          dispatchToast(
            <Toast>
              <ToastTitle>Conexión Restablecida</ToastTitle>
              <ToastBody>La conexión con el servidor ha sido recuperada.</ToastBody>
            </Toast>,
            { intent: 'success', position: 'top-end', timeout: 3000 },
          );
        }
      }
    });

    return () => unsubscribe();
  }, [queryClient, dispatchToast, dismissToast]);

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      queryClient.setQueryData(['me'], data.user);
      await renewSession();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(['me'], null);
      queryClient.removeQueries();
      dismissToast('network-error');
      persistentToastVisibleRef.current = false;
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changeUserPassword,
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data.user);
    },
  });

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    dismissAllToasts();
    dismissToast('network-error');
    persistentToastVisibleRef.current = false;
  }, [dismissAllToasts, dismissToast]);

  useEffect(() => {
    if (!user?.expiresAt) return;

    let isWarningShown = false;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const expiresIn = user.expiresAt! - now;

      if (expiresIn <= 60 * 1000 && !isWarningShown) {
        isWarningShown = true;
        dispatchToast(
          <Toast>
            <ToastTitle
              action={
                <Button appearance="transparent" onClick={() => renewSession()}>
                  Extender Sesión
                </Button>
              }
            >
              La sesión está por expirar
            </ToastTitle>
            <ToastBody>Tu sesión se cerrará pronto.</ToastBody>
          </Toast>,
          { intent: 'warning', position: 'top-end', timeout: -1 },
        );
      }

      if (expiresIn <= 0) {
        logoutMutation.mutate();
      }
    }, 1000);

    return cleanup;
  }, [user, cleanup, dispatchToast, renewSession, logoutMutation]);

  const handleApiError = useCallback(
    (error: unknown) => {
      const isNetworkError =
        (error instanceof TypeError && error.message === 'Failed to fetch') ||
        (error instanceof Error &&
          (error.message.includes('NetworkError') ||
            error.message.includes('ERR_CONNECTION_REFUSED')));

      if (isNetworkError) {
        if (!persistentToastVisibleRef.current) {
          dispatchToast(
            <Toast>
              <ToastTitle>Error de Conexión</ToastTitle>
              <ToastBody>No se pudo conectar con el servidor. Reintentando...</ToastBody>
            </Toast>,
            { intent: 'error', position: 'top-end', timeout: -1, toastId: 'network-error' },
          );
          persistentToastVisibleRef.current = true;
        }
        return;
      }

      if (error instanceof ApiError && error.status === 401) {
        if (user) {
          // Usuario autenticado pero sin permiso
        } else {
          dispatchToast(
            <Toast>
              <ToastTitle>Sesión expirada</ToastTitle>
              <ToastBody>Por favor, inicia sesión nuevamente.</ToastBody>
            </Toast>,
            { intent: 'error', position: 'top-end', timeout: 5000 },
          );
          logoutMutation.mutate();
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado';
        dispatchToast(
          <Toast>
            <ToastTitle>Error</ToastTitle>
            <ToastBody>{errorMessage}</ToastBody>
          </Toast>,
          { intent: 'error', position: 'top-end', timeout: 5000 },
        );
      }
    },
    [dispatchToast, logoutMutation, user],
  );

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        login: loginMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        changePassword: changePasswordMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
        isChangingPassword: changePasswordMutation.isPending,
        renewSession,
        handleApiError,
      }}
    >
      <Toaster toasterId="session-toaster" />
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};