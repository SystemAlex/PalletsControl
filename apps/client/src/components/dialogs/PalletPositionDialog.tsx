import React, { useState, useCallback } from 'react';
import {
  Button,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  Text,
} from '@fluentui/react-components';
import BaseDialog from '../ui/BaseDialog';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPalletPositions,
  createPalletPosition,
  updatePalletPositionStatus,
  deletePalletPosition,
} from '../../api/palletPositions';
import { PalletPositionRecord, CreatePalletPositionPayload } from '../../../../shared/types';
import { SpinnerCustom } from '../ui/SpinnerCustom';
import ConfirmationDialog from './ConfirmationDialog';
import { PalletPositionList } from './pallet-positions/PalletPositionList';

interface PalletPositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
}

export default function PalletPositionDialog({
  open,
  onOpenChange,
  isMobile,
}: PalletPositionDialogProps) {
  const queryClient = useQueryClient();
  const { handleApiError } = useAuth();
  const { dispatchToast } = useToastController('app-toaster');

  const [confirmation, setConfirmation] = useState<{
    type: 'delete' | 'status';
    position: PalletPositionRecord;
  } | null>(null);

  const notify = useCallback(
    (message: string, intent: 'success' | 'error') => {
      dispatchToast(
        <Toast>
          <ToastTitle>{intent === 'success' ? 'Éxito' : 'Error'}</ToastTitle>
          <ToastBody>{message}</ToastBody>
        </Toast>,
        { intent, position: 'top-end' },
      );
    },
    [dispatchToast],
  );

  const {
    data: positions,
    isLoading,
    error,
  } = useQuery<PalletPositionRecord[], Error>({
    queryKey: ['palletPositions'],
    queryFn: async () => {
      try {
        return await fetchPalletPositions();
      } catch (err) {
        handleApiError(err);
        throw err;
      }
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: createPalletPosition,
    onSuccess: (data) => {
      notify(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['palletPositions'] });
      queryClient.invalidateQueries({ queryKey: ['palletProducts'] });
    },
    onError: (err: Error) => {
      notify(err.message, 'error');
      handleApiError(err);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, habilitado }: { id: number; habilitado: boolean }) =>
      updatePalletPositionStatus(id, { habilitado }),
    onSuccess: (data) => {
      notify(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['palletPositions'] });
      queryClient.invalidateQueries({ queryKey: ['palletProducts'] });
    },
    onError: (err: Error) => {
      notify(err.message, 'error');
      handleApiError(err);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePalletPosition,
    onSuccess: (data) => {
      notify(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['palletPositions'] });
      queryClient.invalidateQueries({ queryKey: ['palletProducts'] });
    },
    onError: (err: Error) => {
      notify(err.message, 'error');
      handleApiError(err);
    },
    onSettled: () => setConfirmation(null),
  });

  const handleCreateNextPosition = useCallback(
    (fila: string, nextPosicion: number) => {
      const payload: CreatePalletPositionPayload = {
        fila,
        posicion: nextPosicion,
      };
      createMutation.mutate(payload);
    },
    [createMutation],
  );

  const handleToggleStatus = useCallback((position: PalletPositionRecord) => {
    setConfirmation({ type: 'status', position });
  }, []);

  const handleDelete = useCallback((position: PalletPositionRecord) => {
    setConfirmation({ type: 'delete', position });
  }, []);

  const confirmAction = useCallback(() => {
    if (!confirmation) return;

    if (confirmation.type === 'status') {
      updateStatusMutation.mutate({
        id: confirmation.position.id,
        habilitado: !confirmation.position.habilitado,
      });
    } else if (confirmation.type === 'delete') {
      deleteMutation.mutate(confirmation.position.id);
    }
  }, [confirmation, updateStatusMutation, deleteMutation]);

  const isAnyMutationPending =
    createMutation.isPending || updateStatusMutation.isPending || deleteMutation.isPending;

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Gestión de Posiciones de Pallets"
      actions={
        <Button
          appearance="secondary"
          onClick={() => onOpenChange(false)}
          disabled={isAnyMutationPending}
        >
          Cerrar
        </Button>
      }
    >
      {isLoading ? (
        <SpinnerCustom text="Cargando posiciones..." />
      ) : error ? (
        <Text color="danger">Error: {(error as Error).message}</Text>
      ) : (
        <PalletPositionList
          positions={positions}
          isLoading={isLoading}
          error={error}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
          isAnyMutationPending={isAnyMutationPending}
          onCreateNextPosition={handleCreateNextPosition}
          isMobile={isMobile} // Pasar la prop isMobile
        />
      )}

      {confirmation && (
        <ConfirmationDialog
          open={!!confirmation}
          onOpenChange={() => setConfirmation(null)}
          onConfirm={confirmAction}
          title={
            confirmation.type === 'delete' ? 'Confirmar Eliminación' : 'Confirmar Cambio de Estado'
          }
          message={`¿Estás seguro de que quieres ${
            confirmation.type === 'delete'
              ? 'eliminar la posición'
              : confirmation.position.habilitado
                ? 'deshabilitar la posición'
                : 'habilitar la posición'
          } "${confirmation.position.fila}${confirmation.position.posicion}"?`}
          isDestructive={confirmation.type === 'delete' || confirmation.position.habilitado}
        />
      )}
    </BaseDialog>
  );
}
