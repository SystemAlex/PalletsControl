import React, { useState, FormEvent, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Button,
  Input,
  makeStyles,
  Field,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  Switch,
  Combobox,
  Option,
  useId,
} from '@fluentui/react-components';
import type { ComboboxProps, OptionOnSelectData } from '@fluentui/react-components';
import BaseDialog from '../../ui/BaseDialog';
import { DatePicker } from '@fluentui/react-datepicker-compat'; // Importar DatePicker
import {
  CreateProductInPalletPayload,
  ArticuloRecord,
  ProductInPallet,
} from '../../../../../shared/types';
import { useAuth } from '../../../context/AuthContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createProductInPallet } from '../../../api/palletProducts';
import { fetchProductsList } from '../../../api/products'; // Importar fetchProductsList
import { format } from 'date-fns';
import { dateFromYmd, esDatePickerStrings, formatYmd, onFormatDate } from '../../../utils/helper';

const useStyles = makeStyles({
  form: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
    paddingTop: '12px',
  },
  field: {
    height: '48px',
    gridTemplateColumns: '100px 1fr',
  },
  switchField: {
    gridTemplateColumns: '100px 1fr',
    alignItems: 'center',
  },
  dateInput: {
    width: '100%',
  },
  combobox: {
    width: '100%',
  },
});

interface PalletProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFila: string;
  initialPosicion: number;
  existingProductsInPosition: ProductInPallet[]; // Nueva prop
}

export const PalletProductFormDialog: React.FC<PalletProductFormDialogProps> = ({
  open,
  onOpenChange,
  initialFila,
  initialPosicion,
  existingProductsInPosition, // Desestructurar nueva prop
}) => {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const { handleApiError, user } = useAuth();
  const { dispatchToast } = useToastController('app-toaster');

  const [codigo, setCodigo] = useState<string>(''); // Stores the numeric ID of the selected product
  const [bultos, setBultos] = useState<string>('');
  const [pallets, setPallets] = useState<boolean>(false);
  const [vencimiento, setVencimiento] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [observaciones, setObservaciones] = useState<string>('');

  const [codigoError, setCodigoError] = useState<string | undefined>(undefined);
  const [bultosError, setBultosError] = useState<string | undefined>(undefined);
  const [vencimientoError, setVencimientoError] = useState<string | undefined>(undefined);
  const [palletRuleError, setPalletRuleError] = useState<string | undefined>(undefined);

  // Combobox states
  const comboId = useId('product-combo');
  const [comboboxInputValue, setComboboxInputValue] = useState<string>(''); // This will be the value of the combobox input

  const firstInputRef = useRef<HTMLInputElement>(null);

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

  // Query para buscar artículos para el Combobox (uses comboboxInputValue)
  const { data: searchResults, isLoading: isLoadingSearchResults } = useQuery<
    ArticuloRecord[],
    Error
  >({
    queryKey: ['productsList', comboboxInputValue],
    queryFn: async () => {
      try {
        return await fetchProductsList(comboboxInputValue); // Pass comboboxInputValue as search query
      } catch (err) {
        handleApiError(err);
        throw err;
      }
    },
    enabled: open, // Always enabled when dialog is open
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const createProductMutation = useMutation<
    { message: string; product: ProductInPallet }, // Explicitly type data
    Error,
    CreateProductInPalletPayload
  >({
    mutationFn: createProductInPallet,
    onSuccess: (data) => {
      notify(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['palletProducts'] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      notify(err.message, 'error');
      handleApiError(err);
    },
  });

  const validateCodigo = useCallback(() => {
    if (!codigo.trim()) {
      setCodigoError('Debe seleccionar un artículo de la lista.');
    } else {
      setCodigoError(undefined);
    }
  }, [codigo]);

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

  const validateVencimiento = useCallback((value: string) => {
    if (!value.trim()) {
      setVencimientoError('La fecha de vencimiento es obligatoria.');
    } else {
      setVencimientoError(undefined);
    }
  }, []);

  const validatePalletRule = useCallback(() => {
    if (pallets && existingProductsInPosition.length > 0) {
      setPalletRuleError(
        `La posición ${initialFila}${initialPosicion} ya contiene productos. No se puede añadir un pallet completo a una posición que no está vacía.`,
      );
    } else {
      setPalletRuleError(undefined);
    }
  }, [pallets, existingProductsInPosition, initialFila, initialPosicion]);

  useEffect(() => {
    validatePalletRule();
  }, [pallets, existingProductsInPosition, validatePalletRule]);

  const handleBultosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBultos(value);
    validateBultos(value);
  };

  const handleVencimientoChange = (date: Date | null | undefined) => {
    const value = date ? formatYmd(date) : '';
    setVencimiento(value);
    validateVencimiento(value);
  };

  const handleObservacionesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setObservaciones(e.target.value);
  };

  // Combobox handlers
  const onComboboxChange: ComboboxProps['onChange'] = (event) => {
    const value = event.target.value;
    setComboboxInputValue(value); // Always update the input text

    // If the input value changes, and it no longer matches the selected item, clear `codigo`
    const selectedProduct = searchResults?.find((p) => String(p.idArticulo) === codigo);
    if (
      selectedProduct &&
      `${selectedProduct.desArticulo} (${selectedProduct.idArticulo})` !== value
    ) {
      setCodigo('');
      // Also clear auto-filled fields if the selection is no longer valid
      setBultos('');
      setPallets(false);
    }
    // Clear error if user starts typing again
    if (value.trim() !== '') {
      setCodigoError(undefined);
    }
  };

  const onComboboxOptionSelect: ComboboxProps['onOptionSelect'] = (_, data: OptionOnSelectData) => {
    if (data.optionValue) {
      const selectedId = parseInt(data.optionValue, 10);
      if (!isNaN(selectedId)) {
        setCodigo(String(selectedId)); // Set the definitive ID
        setComboboxInputValue(data.optionText || ''); // Update input to show full selected text
        setCodigoError(undefined); // Clear any error, as a valid option was selected

        // NEW LOGIC: Auto-fill bultos and set pallets if bultosPallet > 0
        const selectedArticulo = searchResults?.find((p) => p.idArticulo === selectedId);
        if (selectedArticulo && selectedArticulo.bultosPallet > 0) {
          setBultos(String(selectedArticulo.bultosPallet));
          setPallets(true);
          validateBultos(String(selectedArticulo.bultosPallet)); // Validate auto-filled bultos
        } else {
          setBultos('');
          setPallets(false);
          setBultosError(undefined); // Clear bultos error if no auto-fill
        }
      }
    } else {
      // This branch handles clearable if it sends null/undefined optionValue
      setCodigo('');
      setComboboxInputValue(''); // Explicitly clear the input text
      setCodigoError(undefined);
      setBultos(''); // Clear auto-filled fields on clear
      setPallets(false);
      setBultosError(undefined);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    validateCodigo(); // Validate if an item is selected
    validateBultos(bultos);
    validateVencimiento(vencimiento);
    validatePalletRule();

    if (
      codigoError ||
      bultosError ||
      vencimientoError ||
      palletRuleError ||
      !codigo.trim() ||
      !bultos.trim() ||
      !vencimiento.trim()
    ) {
      notify('Por favor, corrige los errores en el formulario.', 'error');
      return;
    }

    if (!user?.id) {
      notify('Usuario no autenticado. Por favor, inicia sesión de nuevo.', 'error');
      return;
    }

    const payload: CreateProductInPalletPayload = {
      fila: initialFila,
      posicion: initialPosicion,
      codigo: parseInt(codigo, 10),
      bultos: parseInt(bultos, 10),
      pallets: pallets,
      vencimiento: vencimiento || null,
      observaciones: observaciones || null,
    };

    createProductMutation.mutate(payload);
  };

  const handleClose = useCallback(() => {
    setCodigo('');
    setBultos('');
    setPallets(false);
    setVencimiento(format(new Date(), 'yyyy-MM-dd'));
    setObservaciones('');
    setCodigoError(undefined);
    setBultosError(undefined);
    setVencimientoError(undefined);
    setPalletRuleError(undefined);
    setComboboxInputValue(''); // Clear combobox input value
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open]);

  const isFormValid = useMemo(() => {
    return (
      !codigoError &&
      !bultosError &&
      !vencimientoError &&
      !palletRuleError &&
      !!codigo.trim() && // Check if a code is actually selected
      !!bultos.trim() &&
      !!vencimiento.trim()
    );
  }, [codigoError, bultosError, vencimientoError, palletRuleError, codigo, bultos, vencimiento]);

  const isSubmitting = createProductMutation.isPending;

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleClose}
      title={`Añadir Producto a ${initialFila}${initialPosicion}`}
      actions={
        <>
          <Button appearance="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            appearance="primary"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Añadiendo...' : 'Añadir Producto'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <Field
          label="Código Artículo"
          orientation="horizontal"
          required
          className={styles.field}
          validationMessage={codigoError}
          validationState={codigoError ? 'error' : undefined}
        >
          <Combobox
            ref={firstInputRef}
            id={comboId}
            aria-labelledby={comboId}
            placeholder="Buscar por código o descripción"
            value={comboboxInputValue} // Use comboboxInputValue here
            onChange={onComboboxChange}
            onOptionSelect={onComboboxOptionSelect}
            disabled={isSubmitting}
            freeform
            clearable
            className={styles.combobox}
          >
            {isLoadingSearchResults && <Option disabled>Cargando...</Option>}
            {(searchResults || []).length === 0 &&
              comboboxInputValue.length > 0 &&
              !isLoadingSearchResults && <Option disabled>No se encontraron resultados</Option>}
            {(searchResults || []).map((product: ArticuloRecord) => (
              <Option
                key={product.idArticulo}
                value={String(product.idArticulo)}
                text={`${product.desArticulo} (${product.idArticulo})`}
              >
                {product.desArticulo} ({product.idArticulo})
              </Option>
            ))}
          </Combobox>
        </Field>
        <Field
          label="Bultos"
          orientation="horizontal"
          required
          className={styles.field}
          validationMessage={bultosError}
          validationState={bultosError ? 'error' : undefined}
        >
          <Input
            type="number"
            value={bultos}
            onChange={handleBultosChange}
            disabled={isSubmitting}
          />
        </Field>
        <Field
          label="Pallets"
          orientation="horizontal"
          className={styles.switchField}
          validationMessage={palletRuleError}
          validationState={palletRuleError ? 'error' : undefined}
        >
          <Switch
            checked={pallets}
            onChange={(_, data) => setPallets(data.checked)}
            disabled={isSubmitting}
          />
        </Field>
        <Field
          label="Vencimiento"
          orientation="horizontal"
          required
          className={styles.field}
          validationMessage={vencimientoError}
          validationState={vencimientoError ? 'error' : undefined}
        >
          <DatePicker
            allowTextInput={false}
            value={dateFromYmd(vencimiento)}
            onSelectDate={handleVencimientoChange}
            disabled={isSubmitting}
            strings={esDatePickerStrings}
            formatDate={onFormatDate}
            placeholder="Selecciona una fecha"
            className={styles.dateInput}
          />
        </Field>
        <Field label="Observaciones" orientation="horizontal" className={styles.field}>
          <Input
            value={observaciones}
            onChange={handleObservacionesChange}
            disabled={isSubmitting}
          />
        </Field>
      </form>
    </BaseDialog>
  );
};
