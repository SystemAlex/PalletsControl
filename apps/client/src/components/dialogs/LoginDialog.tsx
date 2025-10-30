import React, { useState, FormEvent, useEffect, ChangeEvent } from 'react';
import {
  makeStyles,
  Input,
  Button,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  Field,
} from '@fluentui/react-components';
import { useAuth } from '../../context/AuthContext';
import BaseDialog from '../ui/BaseDialog';
import Logo from '../ui/Logo';
import { useCommonStyles } from '../../theme/commonStyles'; // Importar estilos comunes

const useStyles = makeStyles({
  // Mantener solo estilos específicos
  flexBox: { display: 'flex', alignItems: 'center', gap: '8px' },
  panel: { fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px' },
});

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const styles = useStyles();
  const commonStyles = useCommonStyles(); // Usar estilos comunes
  const { login, isLoggingIn } = useAuth();
  const { dispatchToast } = useToastController('app-toaster');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<{ username?: boolean; password?: boolean }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    document.title = 'Control Pallets → Login';
  }, []);

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

  const validateForm = () => {
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) errors.username = 'El usuario es obligatorio';
    if (!password.trim()) errors.password = 'La contraseña es obligatoria';
    return errors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const errors = validateForm();
    if (Object.keys(errors).length > 0) return;

    try {
      await login({ username, password });
      notify('¡Login exitoso!', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado';
      notify(errorMessage, 'error');
    }
  };

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) handleClose();
    else onOpenChange(true);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setTouched({});
    setSubmitAttempted(false);
  };

  const errors = validateForm();
  const disableLogin = isLoggingIn || Object.keys(errors).length > 0;

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>, field: 'username' | 'password') =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (!touched[field]) setTouched((prev) => ({ ...prev, [field]: true }));
    };

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleDialogChange}
      title={<Logo />}
      isForcedChange={true}
      actions={
        <Button appearance="primary" type="submit" form="login-form" disabled={disableLogin}>
          {isLoggingIn ? 'Cargando...' : 'Iniciar Sesión'}
        </Button>
      }
    >
      <form id="login-form" onSubmit={handleSubmit}>
        <div className={styles.flexBox}>
          <div className={commonStyles.flexBoxContent}>
            <Field
              label="Usuario"
              orientation="horizontal"
              required
              className={commonStyles.field}
              validationMessage={touched.username || submitAttempted ? errors.username : undefined}
              validationState={
                (touched.username || submitAttempted) && errors.username ? 'error' : undefined
              }
            >
              <Input
                id="username"
                type="text"
                value={username}
                onChange={handleInputChange(setUsername, 'username')}
                disabled={isLoggingIn}
              />
            </Field>
            <Field
              label="Contraseña"
              orientation="horizontal"
              required
              className={commonStyles.field}
              validationMessage={touched.password || submitAttempted ? errors.password : undefined}
              validationState={
                (touched.password || submitAttempted) && errors.password ? 'error' : undefined
              }
            >
              <Input
                id="password"
                type="password"
                value={password}
                onChange={handleInputChange(setPassword, 'password')}
                disabled={isLoggingIn}
              />
            </Field>
          </div>
        </div>
      </form>
    </BaseDialog>
  );
}
