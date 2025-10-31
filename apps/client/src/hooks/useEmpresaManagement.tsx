import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastController, Toast, ToastTitle, ToastBody } from '@fluentui/react-components';
import { useAuth } from '../context/AuthContext';
import { fetchEmpresas, createEmpresa, updateEmpresa, deleteEmpresa } from '../api/empresas';
import { EmpresaRecord, CreateEmpresaPayload, UpdateEmpresaPayload } from '../../../shared/types';
import { EmpresaFormData } from '../components/dialogs/EmpresaDialog';

export type SortColumn = 'razonSocial' | 'cuit' | 'email' | 'activo' | 'fechaAlta';
type SortDirection = 'ascending' | 'descending';

export function useEmpresaManagement() {
  const queryClient = useQueryClient();
  const { dispatchToast } = useToastController('app-toaster');
  const { handleApiError, user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [sortState, setSortState] = useState<{
    column: SortColumn;
    direction: SortDirection;
  } | null>(null);

  const canManageEmpresas = user?.role === 'admin';

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['empresas'] }),
    onError: (err: Error) => {
      notify(err.message, 'error');
      handleApiError(err);
    },
  };

  const createEmpresaMutation = useMutation({
    mutationFn: createEmpresa,
    ...mutationOptions,
    onSuccess: () => {
      notify('Empresa creada exitosamente.', 'success');
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });

  const updateEmpresaMutation = useMutation({
    mutationFn: updateEmpresa,
    ...mutationOptions,
    onSuccess: (data) => {
      // Check if the update was a status toggle
      const isStatusToggle = data.message.includes('actualizada') && (data.empresa.activo === true || data.empresa.activo === false);
      
      if (isStatusToggle) {
        notify(`Empresa ${data.empresa.activo ? 'reactivada' : 'desactivada'} exitosamente.`, 'success');
      } else {
        notify('Empresa actualizada.', 'success');
      }
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });

  // Mantengo deleteEmpresaMutation solo para la ruta DELETE, que ahora desactiva.
  // Esto es para mantener la semántica de la ruta DELETE en el backend, aunque en el frontend
  // usaremos updateEmpresaMutation para la reactivación.
  const deactivateEmpresaMutation = useMutation({
    mutationFn: deleteEmpresa,
    ...mutationOptions,
    onSuccess: (data) => {
      notify(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });

  const {
    data: empresasData,
    isLoading: isLoadingEmpresas,
    isFetching: isFetchingEmpresas,
    error: empresasError,
  } = useQuery<{ empresas: EmpresaRecord[]; totalCount: number }, Error>({
    queryKey: ['empresas', page, searchQuery],
    queryFn: async () => {
      if (!canManageEmpresas) return { empresas: [], totalCount: 0 };
      try {
        return await fetchEmpresas(page, limit, searchQuery);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: canManageEmpresas,
    refetchInterval: 30000,
  });

  const empresas = empresasData?.empresas || [];
  const totalCount = empresasData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const toggleSort = useCallback((column: SortColumn) => {
    setSortState((prev) => {
      if (!prev || prev.column !== column) return { column, direction: 'ascending' };
      if (prev.direction === 'ascending') return { column, direction: 'descending' };
      return null;
    });
  }, []);

  const comparators: Record<SortColumn, (a: EmpresaRecord, b: EmpresaRecord) => number> = {
    razonSocial: (a, b) => a.razonSocial.localeCompare(b.razonSocial),
    cuit: (a, b) => a.cuit.localeCompare(b.cuit),
    email: (a, b) => (a.email || '').localeCompare(b.email || ''),
    activo: (a, b) => Number(a.activo) - Number(b.activo),
    fechaAlta: (a, b) => new Date(a.fechaAlta).getTime() - new Date(b.fechaAlta).getTime(),
  };

  const sortedEmpresas = useMemo(() => {
    if (!sortState) return empresas;
    const base = [...empresas];
    const cmp = comparators[sortState.column];
    base.sort((a, b) => {
      const r = cmp(a, b);
      return sortState.direction === 'ascending' ? r : -r;
    });
    return base;
  }, [empresas, sortState]);

  const handleEmpresaSubmit = useCallback(
    (empresa: EmpresaFormData) => {
      const payload: CreateEmpresaPayload | UpdateEmpresaPayload = {
        razonSocial: empresa.razonSocial,
        nombreFantasia: empresa.nombreFantasia,
        cuit: empresa.cuit,
        direccion: empresa.direccion,
        ciudad: empresa.ciudad,
        provincia: empresa.provincia,
        pais: empresa.pais,
        telefono: empresa.telefono,
        email: empresa.email,
        sitioWeb: empresa.sitioWeb,
        sector: empresa.sector,
        logoUrl: empresa.logoUrl,
        activo: empresa.activo,
      };

      if (empresa.idEmpresa) {
        // Update
        updateEmpresaMutation.mutate({
          idEmpresa: empresa.idEmpresa,
          payload: payload as UpdateEmpresaPayload,
        });
      } else {
        // Create
        createEmpresaMutation.mutate(payload as CreateEmpresaPayload);
      }
    },
    [createEmpresaMutation, updateEmpresaMutation],
  );

  return {
    empresas: sortedEmpresas,
    totalCount,
    totalPages,
    isLoadingEmpresas,
    isFetchingEmpresas,
    empresasError,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    sortState,
    toggleSort,
    handleEmpresaSubmit,
    updateEmpresaMutation, // Usamos esta mutación para el toggle de estado
    deactivateEmpresaMutation, // Mantengo esta mutación para la ruta DELETE (desactivación)
    isAnyMutationPending:
      createEmpresaMutation.isPending ||
      updateEmpresaMutation.isPending ||
      deactivateEmpresaMutation.isPending,
    canManageEmpresas,
    handleApiError,
  };
}