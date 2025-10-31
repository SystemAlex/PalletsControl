import React, { useState, FormEvent, useCallback, useEffect, useRef } from 'react';
import {
  Button,
  Input,
  makeStyles,
  Field,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  Textarea,
  Combobox,
  Option,
} from '@fluentui/react-components';
import BaseDialog from '../ui/BaseDialog';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import { CreatePagoPayload, FrecuenciaPago } from '../../../../shared/types';
import { useAuth } from '../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPago } from '../../api/pagos';
import { format } from 'date-fns';
import { dateFromYmd, esDatePickerStrings, formatYmd, onFormatDate } from '../../utils/helper';
import { useCommonStyles } from '../../theme/commonStyles';

const useStyles = makeStyles({
  form: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
    paddingTop: '12px',
  },
  field: {
    height: '48px',
    gridTemplateColumns: '131px 1fr',
    '@media(max-width: 768px)': {
      gridTemplateColumns: '1fr',
      height: 'auto',
    },
  },
  dateInput: {
    width: '100%',
  },
});

interface PagoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idEmpresa: number;
  razonSocial: string;
  frecuenciaPago: FrecuenciaPago;
}

const metodosPago = ['Transferencia', 'Efectivo', 'Tarjeta', 'Cheque', 'Otro'];

export const PagoDialog: React.FC<PagoDialogProps> = ({
  open,
  onOpenChange,
  idEmpresa,
  razonSocial,
  frecuenciaPago,
}) => {
  const styles = useStyles();
  const commonStyles = useCommonStyles();
  const queryClient = useQueryClient();
  const { handleApiError } = useAuth();
  const { dispatchToast } = useToastController('app-toaster');

  const [fechaPago, setFechaPago] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [monto, setMonto] = useState<string>('');
  const [metodo, setMetodo] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');

  const [montoError, setMontoError] = useState<string | undefined>(undefined);
  const [fechaError, setFechaError] = useState<string | undefined>(undefined);

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

  const createPagoMutation = useMutation({
    mutationFn: createPago,
    onSuccess: (data) => {
      notify(data.message, 'success');
      // Invalidate both pagos and empresas queries to refresh the table status
      queryClient.invalidateQueries({ queryKey: ['pagos'] });
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      handleClose();
    },
    onError: (err: Error) => {
      notify(err.message, 'error');
      handleApiError(err);
    },
  });

  const validateMonto = useCallback((value: string) => {
    const numValue = parseFloat(value);
    if (!value.trim()) {
      setMontoError('El monto es obligatorio.');
    } else if (isNaN(numValue) || numValue <= 0) {
      setMontoError('El monto debe ser un número positivo.');
    } else {
      setMontoError(undefined);
    }
  }, []);

  const validateFecha = useCallback((value: string) => {
    if (!value.trim()) {
      setFechaError('La fecha de pago es obligatoria.');
    } else {
      setFechaError(undefined);
    }
  }, []);

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMonto(value);
    validateMonto(value);
  };

  const handleFechaChange = (date: Date | null | undefined) => {
    const value = date ? formatYmd(date) : '';
    setFechaPago(value);
    validateFecha(value);
  };

  const handleMetodoSelect = useCallback((_: unknown, data: { optionValue?: string }) => {
    setMetodo(data.optionValue || '');
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    validateMonto(monto);
    validateFecha(fechaPago);

    if (montoError || fechaError || !monto.trim() || !fechaPago.trim()) {
      notify('Por favor, corrige los errores en el formulario.', 'error');
      return;
    }

    const payload: CreatePagoPayload = {
      idEmpresa: idEmpresa,
      fechaPago: fechaPago,
      monto: parseFloat(monto),
      metodo: metodo || null,
      observaciones: observaciones || null,
    };

    createPagoMutation.mutate(payload);
  };

  const handleClose = useCallback(() => {
    setFechaPago(format(new Date(), 'yyyy-MM-dd'));
    setMonto('');
    setMetodo('');
    setObservaciones('');
    setMontoError(undefined);
    setFechaError(undefined);
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open]);

  const isFormValid = !montoError && !fechaError && !!monto.trim() && !!fechaPago.trim();
  const isSubmitting = createPagoMutation.isPending;

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleClose}
      title={`Registrar Pago para ${razonSocial}`}
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
            {isSubmitting ? 'Registrando...' : 'Registrar Pago'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <Field
          label="Monto ($)"
          orientation="horizontal"
          required
          className={commonStyles.field}
          validationMessage={montoError}
          validationState={montoError ? 'error' : undefined}
        >
          <Input
            ref={firstInputRef}
            type="number"
            step="0.01"
            value={monto}
            onChange={handleMontoChange}
            disabled={isSubmitting}
          />
        </Field>
        <Field
          label="Fecha de Pago"
          orientation="horizontal"
          required
          className={commonStyles.field}
          validationMessage={fechaError}
          validationState={fechaError ? 'error' : undefined}
        >
          <DatePicker
            allowTextInput={false}
            value={dateFromYmd(fechaPago)}
            onSelectDate={handleFechaChange}
            disabled={isSubmitting}
            strings={esDatePickerStrings}
            formatDate={onFormatDate}
            placeholder="Selecciona una fecha"
            className={styles.dateInput}
          />
        </Field>
        <Field label="Frecuencia" orientation="horizontal" className={commonStyles.field}>
          <Input value={frecuenciaPago.charAt(0).toUpperCase() + frecuenciaPago.slice(1)} disabled />
        </Field>
        <Field label="Método" orientation="horizontal" className={commonStyles.field}>
          <Combobox
            placeholder="Selecciona método de pago"
            value={metodo}
            onOptionSelect={handleMetodoSelect}
            disabled={isSubmitting}
            clearable
          >
            {metodosPago.map((m) => (
              <Option key={m} value={m}>
                {m}
              </Option>
            ))}
          </Combobox>
        </Field>
        <Field label="Observaciones" orientation="horizontal" className={commonStyles.field}>
          <Textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            disabled={isSubmitting}
          />
        </Field>
      </form>
    </BaseDialog>
  );
};