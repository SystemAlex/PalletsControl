import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  makeStyles,
  Field,
  Text,
  tokens,
  ProgressBar,
} from '@fluentui/react-components';
import { CheckmarkCircleRegular, DismissCircleRegular } from '@fluentui/react-icons';
import { useAuth } from '../../context/AuthContext';
import BaseDialog from '../ui/BaseDialog';
import { useCommonStyles } from '../../theme/commonStyles'; // Importar estilos comunes

const useStyles = makeStyles({
  // Mantener solo estilos específicos
  panel: { fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' },
  condition: { display: 'flex', alignItems: 'center', gap: '4px' },
  valid: { color: tokens.colorStatusSuccessForeground1 },
  invalid: { color: tokens.colorStatusDangerForeground1 },
  posTimer: {
    position: 'absolute',
    bottom: tokens.spacingVerticalXXL,
    width: '50%',
    '@media(max-width: 768px)': {
      position: 'initial',
      paddingTop: '16px',
      width: '100%',
    },
  },
});

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isForcedChange?: boolean;
}

export default function ChangePasswordDialog({
  open,
  onOpenChange,
  isForcedChange = false,
}: ChangePasswordDialogProps) {
  const styles = useStyles();
  const commonStyles = useCommonStyles(); // Usar estilos comunes
  const { changePassword, isChangingPassword } = useAuth();
  const { dispatchToast } = useToastController('app-toaster');
  const timer = 120;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorCurrent, setErrorCurrent] = useState<string | undefined>(undefined);
  const [errorConfirm, setErrorConfirm] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timer); // 2 minutos

  useEffect(() => {
    if (!isForcedChange || !open) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isForcedChange, open, onOpenChange]);

  const notify = (message: string, intent: 'success' | 'error') => {
    const timeout = intent === 'success' ? 3000 : 7000;
    dispatchToast(
      <Toast>
        <ToastTitle>{intent === 'success' ? 'Éxito' : 'Error'}</ToastTitle>
        <ToastBody>{message}</ToastBody>
      </Toast>,
      { intent, position: 'top-end', timeout },
    );
  };

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorCurrent(undefined);
    setErrorConfirm(undefined);
    setSubmitting(false);
    setTimeLeft(timer);
  };

  const handleClose = () => {
    if (isChangingPassword) return;
    resetForm();
    onOpenChange(false);
  };

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose();
    } else {
      onOpenChange(true);
    }
  };

  const validateCurrent = (value: string) => {
    if (!isForcedChange && !value.trim() && newPassword) {
      setErrorCurrent('La contraseña actual es obligatoria.');
    } else {
      setErrorCurrent(undefined);
    }
  };

  const validateConfirm = (value: string) => {
    if (!value.trim()) {
      setErrorConfirm('La confirmación es obligatoria.');
    } else if (value !== newPassword) {
      setErrorConfirm('Las contraseñas no coinciden.');
    } else {
      setErrorConfirm(undefined);
    }
  };

  const hasLength = newPassword.length >= 6;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);

  const handleSubmit = async () => {
    if (submitting || isChangingPassword) return;

    validateCurrent(currentPassword);
    validateConfirm(confirmPassword);

    if (
      (!isForcedChange && (!currentPassword || errorCurrent)) ||
      !newPassword ||
      !confirmPassword ||
      errorConfirm ||
      !hasLength ||
      !hasUppercase ||
      !hasNumber
    ) {
      return;
    }

    const params: { newPassword: string; currentPassword: string } = isForcedChange
      ? { newPassword, currentPassword: '' }
      : { newPassword, currentPassword };

    try {
      setSubmitting(true);
      await changePassword(params);
      notify('¡Contraseña actualizada exitosamente!', 'success');
      handleClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado';
      notify(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const disableUpdateButton =
    submitting ||
    isChangingPassword ||
    (!isForcedChange && !currentPassword) ||
    !newPassword ||
    !confirmPassword ||
    !!errorCurrent ||
    !!errorConfirm ||
    !hasLength ||
    !hasUppercase ||
    !hasNumber;

  const progressValue = Math.max(0, timeLeft / timer);

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleDialogChange}
      title={isForcedChange ? 'Crear Nueva Contraseña' : 'Cambiar Contraseña'}
      isForcedChange={isForcedChange}
      actions={
        <>
          {!isForcedChange && (
            <Button appearance="secondary" onClick={handleClose} disabled={isChangingPassword}>
              Cancelar
            </Button>
          )}
          <Button appearance="primary" onClick={handleSubmit} disabled={disableUpdateButton}>
            {isChangingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
        </>
      }
    >
      {isForcedChange && <Text>Por seguridad, debes establecer una nueva contraseña.</Text>}
      <div className={commonStyles.flexBox}>
        <div className={commonStyles.flexBoxContent}>
          {!isForcedChange && (
            <Field
              label="Actual"
              orientation="horizontal"
              required
              className={commonStyles.field}
              validationMessage={errorCurrent}
              validationState={errorCurrent ? 'error' : undefined}
            >
              <Input
                id="current-password-dialog"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(_, data) => {
                  setCurrentPassword(data.value);
                  validateCurrent(data.value);
                }}
                disabled={isChangingPassword}
              />
            </Field>
          )}
          <Field label="Nueva" orientation="horizontal" required className={commonStyles.field}>
            <Input
              id="new-password-dialog"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(_, data) => {
                setNewPassword(data.value);
                validateCurrent(currentPassword);
                if (confirmPassword) {
                  validateConfirm(confirmPassword);
                }
              }}
              disabled={isChangingPassword}
            />
          </Field>
          <Field
            label="Confirmar"
            orientation="horizontal"
            required
            className={commonStyles.field}
            validationMessage={errorConfirm}
            validationState={errorConfirm ? 'error' : undefined}
          >
            <Input
              id="confirm-password-dialog"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(_, data) => {
                setConfirmPassword(data.value);
                validateConfirm(data.value);
              }}
              disabled={isChangingPassword}
            />
          </Field>
        </div>
        <div className={styles.panel}>
          <Text>La contraseña debe contener:</Text>
          <div className={styles.condition}>
            {hasLength ? (
              <CheckmarkCircleRegular className={styles.valid} />
            ) : (
              <DismissCircleRegular className={styles.invalid} />
            )}
            <span className={hasLength ? styles.valid : styles.invalid}>Al menos 6 caracteres</span>
          </div>
          <div className={styles.condition}>
            {hasUppercase ? (
              <CheckmarkCircleRegular className={styles.valid} />
            ) : (
              <DismissCircleRegular className={styles.invalid} />
            )}
            <span className={hasUppercase ? styles.valid : styles.invalid}>
              Una letra mayúscula
            </span>
          </div>
          <div className={styles.condition}>
            {hasNumber ? (
              <CheckmarkCircleRegular className={styles.valid} />
            ) : (
              <DismissCircleRegular className={styles.invalid} />
            )}
            <span className={hasNumber ? styles.valid : styles.invalid}>Un número</span>
          </div>
        </div>
      </div>
      {isForcedChange && (
        <div className={styles.posTimer}>
          <Field
            validationMessage={`Tiempo restante: ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`}
            validationState={
              timeLeft < timer / 4 ? 'error' : timeLeft < timer / 2 ? 'warning' : 'success'
            }
          >
            <ProgressBar
              value={progressValue}
              color={timeLeft < timer / 4 ? 'error' : timeLeft < timer / 2 ? 'warning' : 'success'}
            />
          </Field>
        </div>
      )}
    </BaseDialog>
  );
}
