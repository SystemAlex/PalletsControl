import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
  Button,
  makeStyles,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  Text,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  tokens,
  Tooltip,
  Input,
  Field,
  mergeClasses,
} from '@fluentui/react-components';
import {
  Edit24Regular,
  Save24Regular,
  Dismiss24Regular,
  ArrowCircleDown24Regular,
} from '@fluentui/react-icons';
import BaseDialog from '../../ui/BaseDialog';
import { ProductInPallet, UpdateProductInPalletPayload } from '../../../../../shared/types';
import { useAuth } from '../../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProductFromPallet, updateProductInPallet } from '../../../api/palletProducts';
import { format } from 'date-fns';
import ConfirmationDialog from '../ConfirmationDialog'; // Importar el diálogo de confirmación
import { getExpirationStatus, ExpirationStatus } from '../../pallet-products/PalletTableUtils';
import { useCommonStyles } from '../../../theme/commonStyles'; // Importar commonStyles

const useStyles = makeStyles({
  tableContainer: {
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '400px', // Altura máxima para el scroll
  },
  expiredDate: {
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorPaletteBerryBackground1,
    color: tokens.colorPaletteBerryForeground1,
    '&:hover': {
      backgroundColor: tokens.colorPaletteBerryBackground2,
      color: tokens.colorPaletteBerryForeground2,
    },
  },
  dangerDate: {
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorStatusDangerBackground1,
    color: tokens.colorStatusDangerForeground1,
    '&:hover': {
      backgroundColor: tokens.colorStatusDangerBackground2,
      color: tokens.colorStatusDangerForeground2,
    },
  },
  warningDate: {
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorStatusWarningBackground1,
    color: tokens.colorStatusWarningForeground1,
    '&:hover': {
      backgroundColor: tokens.colorStatusWarningBackground2,
      color: tokens.colorStatusWarningForeground2,
    },
  },
  table: {
    tableLayout: 'auto',
    width: '100%',
  },
  tableHeaderCell: {
    fontWeight: '600',
    backgroundColor: tokens.colorNeutralBackground1,
    position: 'sticky',
    top: 0,
    zIndex: 1,
    textAlign: 'center',
  },
  productCell: {
    textAlign: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  numericCell: {
    textAlign: 'center',
  },
  actionCell: {
    textAlign: 'center',
    width: '120px', // Ancho fijo para los botones de acción
  },
  row: {
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  editField: {
    width: '100%',
    minWidth: '60px',
  },
  editSwitch: {
    justifyContent: 'center',
  },
  editActions: {
    display: 'flex',
    gap: '4px',
    justifyContent: 'center',
  },
});

interface PalletProductRemoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fila: string;
  posicion: number;
  products: ProductInPallet[];
}

export const PalletProductRemoveDialog: React.FC<PalletProductRemoveDialogProps> = ({
  open,
  onOpenChange,
  fila,
  posicion,
  products,
}) => {
  const styles = useStyles();
  const commonStyles = useCommonStyles(); // Usar commonStyles
  const queryClient = useQueryClient();
  const { handleApiError, user } = useAuth();
  const { dispatchToast } = useToastController('app-toaster');

  const [productToDelete, setProductToDelete] = useState<ProductInPallet | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editedBultos, setEditedBultos] = useState<string>('');
  const [bultosError, setBultosError] = useState<string | undefined>(undefined);

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

  const deleteProductMutation = useMutation({
    mutationFn: deleteProductFromPallet,
    onSuccess: (data) => {
      notify(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['palletProducts'] });
    },
    onError: (err: Error) => {
      notify(err.message, 'error');
      handleApiError(err);
    },
    onSettled: () => {
      setProductToDelete(null);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateProductInPalletPayload }) =>
      updateProductInPallet(id, payload),
    onSuccess: (data) => {
      notify(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['palletProducts'] });
      setEditingProductId(null); // Exit edit mode
    },
    onError: (err: Error) => {
      notify(err.message, 'error');
      handleApiError(err);
    },
  });

  const handleDeleteProduct = useCallback((product: ProductInPallet) => {
    setProductToDelete(product);
  }, []);

  const confirmDeletion = useCallback(() => {
    if (productToDelete && !deleteProductMutation.isPending) {
      deleteProductMutation.mutate(productToDelete.id);
    }
  }, [productToDelete, deleteProductMutation]);

  const handleEditClick = useCallback((product: ProductInPallet) => {
    setEditingProductId(product.id);
    setEditedBultos(String(product.bultos));
    setBultosError(undefined);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingProductId(null);
    setBultosError(undefined);
  }, []);

  const validateBultos = useCallback((value: string) => {
    const numValue = parseInt(value, 10);
    if (!value.trim()) {
      setBultosError('La cantidad de bultos es obligatoria.');
    } else if (isNaN(numValue) || numValue < 0) {
      setBultosError('La cantidad de bultos debe ser un número positivo o cero.');
    } else {
      setBultosError(undefined);
    }
  }, []);

  const handleBultosChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setEditedBultos(value);
      validateBultos(value);
    },
    [validateBultos],
  );

  const handleSaveEdit = useCallback(
    (product: ProductInPallet) => {
      validateBultos(editedBultos);

      if (bultosError || !editedBultos.trim()) {
        notify('Por favor, corrige los errores en el formulario.', 'error');
        return;
      }

      if (!user?.id) {
        notify('Usuario no autenticado. Por favor, inicia sesión de nuevo.', 'error');
        return;
      }

      const payload: UpdateProductInPalletPayload = {
        bultos: parseInt(editedBultos, 10),
      };

      updateProductMutation.mutate({ id: product.id, payload });
    },
    [editedBultos, bultosError, notify, user?.id, updateProductMutation, validateBultos],
  );

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setProductToDelete(null);
    setEditingProductId(null);
  }, [onOpenChange]);

  const positionDisplay = `${fila}${posicion}`;

  const isAnyMutationPending = useMemo(
    () => deleteProductMutation.isPending || updateProductMutation.isPending,
    [deleteProductMutation.isPending, updateProductMutation.isPending],
  );

  // Effect to update editedBultos if the product being edited changes in the 'products' prop
  useEffect(() => {
    if (editingProductId !== null && open) {
      const updatedProduct = products.find((p) => p.id === editingProductId);
      if (updatedProduct) {
        if (String(updatedProduct.bultos) !== editedBultos) {
          setEditedBultos(String(updatedProduct.bultos));
          setBultosError(undefined); // Clear any previous error
        }
      } else {
        setEditingProductId(null);
      }
    }
  }, [products, editingProductId, open]);

  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Use centralized getExpirationStatus
  const getStatus = useCallback(
    (dateString: string | null): ExpirationStatus => {
      return getExpirationStatus(dateString, todayDate);
    },
    [todayDate],
  );

  return (
    <>
      <BaseDialog
        open={open}
        onOpenChange={handleClose}
        title={`Bajar/Editar Productos de ${positionDisplay}`}
        actions={
          <Button appearance="secondary" onClick={handleClose} disabled={isAnyMutationPending}>
            Cerrar
          </Button>
        }
      >
        <Text>Selecciona el producto que deseas eliminar o editar de esta posición:</Text>
        <div className={styles.tableContainer}>
          <Table size="small" aria-label="Productos en Pallet" className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell className={styles.tableHeaderCell}>PRODUCTO</TableHeaderCell>
                <TableHeaderCell className={styles.tableHeaderCell}>BULTOS</TableHeaderCell>
                <TableHeaderCell className={styles.tableHeaderCell}>VENCIMIENTO</TableHeaderCell>
                <TableHeaderCell className={styles.tableHeaderCell}>ACCIONES</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length > 0 ? (
                products.map((product) => {
                  const expirationStatus = getStatus(product.vencimiento);
                  const rowClass = mergeClasses(
                    styles.row,
                    expirationStatus === 'expired'
                      ? styles.expiredDate
                      : expirationStatus === 'danger'
                        ? styles.dangerDate
                        : expirationStatus === 'warning'
                          ? styles.warningDate
                          : undefined,
                  );
                  return (
                    <TableRow key={product.id} className={rowClass}>
                      <TableCell className={styles.productCell}>
                        {product.desArticulo} ({product.codigo})
                      </TableCell>
                      <TableCell className={styles.numericCell}>
                        {editingProductId === product.id ? (
                          <Field
                            validationMessage={bultosError}
                            validationState={bultosError ? 'error' : undefined}
                          >
                            <Input
                              type="number"
                              value={editedBultos}
                              onChange={handleBultosChange}
                              disabled={isAnyMutationPending}
                              className={styles.editField}
                            />
                          </Field>
                        ) : (
                          product.bultos
                        )}
                      </TableCell>
                      <TableCell className={styles.numericCell}>
                        {/* Vencimiento ya no es editable */}
                        {product.vencimiento
                          ? format(new Date(product.vencimiento + 'T00:00:00'), 'dd/MM/yyyy') // Parse as local date
                          : 'N/A'}
                      </TableCell>
                      <TableCell className={styles.actionCell}>
                        {editingProductId === product.id ? (
                          <div className={styles.editActions}>
                            <Tooltip content="Guardar cambios" relationship="label">
                              <Button
                                icon={<Save24Regular />}
                                appearance="subtle"
                                className={commonStyles.successButton} // Usar commonStyles
                                onClick={() => handleSaveEdit(product)}
                                disabled={isAnyMutationPending || !!bultosError} // Simplificada la condición de deshabilitado
                              />
                            </Tooltip>
                            <Tooltip content="Cancelar edición" relationship="label">
                              <Button
                                icon={<Dismiss24Regular />}
                                appearance="subtle"
                                className={commonStyles.dangerButton} // Usar commonStyles
                                onClick={handleCancelEdit}
                                disabled={isAnyMutationPending}
                              />
                            </Tooltip>
                          </div>
                        ) : (
                          <div className={styles.editActions}>
                            <Tooltip content="Editar Bultos" relationship="label">
                              <Button
                                icon={<Edit24Regular />}
                                appearance="subtle"
                                className={commonStyles.successButton} // Usar commonStyles
                                onClick={() => handleEditClick(product)}
                                disabled={isAnyMutationPending}
                              />
                            </Tooltip>
                            <Tooltip content="Baja Producto" relationship="label">
                              <Button
                                icon={<ArrowCircleDown24Regular />}
                                appearance="subtle"
                                className={commonStyles.dangerButton} // Usar commonStyles
                                onClick={() => handleDeleteProduct(product)}
                                disabled={isAnyMutationPending}
                              />
                            </Tooltip>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Text align="center" block>
                      No hay productos en esta posición.
                    </Text>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </BaseDialog>

      {productToDelete && (
        <ConfirmationDialog
          open={!!productToDelete}
          onOpenChange={() => setProductToDelete(null)}
          onConfirm={confirmDeletion}
          title="Confirmar Bajar Producto"
          message={`¿Estás seguro de que quieres bajar "${productToDelete.desArticulo} (${productToDelete.codigo})" de la posición ${fila}${posicion}?`}
          isDestructive={true}
        />
      )}
    </>
  );
};
