import React, { useEffect, FormEvent, useMemo, useRef } from 'react';
import {
  Button,
  Input,
  Switch,
  makeStyles,
  Field,
  Combobox,
  Option,
} from '@fluentui/react-components';
import { useAuth } from '../../context/AuthContext';
import { UserRole, allAvailableRoles, canAssignRole } from '../../../../shared/types';
import { capitalize } from '../../utils/helper';
import BaseDialog from '../ui/BaseDialog';
import { useFormValidationUser } from '../../hooks/useFormValidationUser';
import { useCommonStyles } from '../../theme/commonStyles'; // Importar estilos comunes

const useStyles = makeStyles({
  // Mantener solo estilos específicos o variantes
  field2: { height: '48px', gridTemplateColumns: '131px 1fr 159px' },
});

export interface UserFormData {
  id?: number;
  username: string;
  realname: string;
  email: string | null;
  role: string;
  isActive: boolean;
  password: string;
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (user: UserFormData) => void;
  isSubmitting: boolean;
  userToEdit?: UserFormData | null;
}

export default function UserDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  userToEdit,
}: UserDialogProps) {
  const styles = useStyles();
  const commonStyles = useCommonStyles(); // Usar estilos comunes
  const { user: currentUser } = useAuth();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const initialValues: UserFormData = {
    username: '',
    realname: '',
    email: '',
    role: 'deposito',
    isActive: true,
    password: 'Clave123',
  };

  const {
    formData,
    setFormData,
    setSubmitAttempted,
    isValid,
    handleChange,
    handleBlur,
    showError,
    reset,
  } = useFormValidationUser(initialValues);

  const isEditing = !!userToEdit;
  const isBusy = isSubmitting;

  const assignableRoles = useMemo(() => {
    if (!currentUser) return [];
    return allAvailableRoles.filter((role) => canAssignRole(currentUser.role as UserRole, role));
  }, [currentUser]);

  useEffect(() => {
    if (userToEdit) {
      setFormData({ ...userToEdit, email: userToEdit.email || '' });
    } else {
      reset();
    }
  }, [userToEdit, open, assignableRoles]);

  useEffect(() => {
    if (open && !isEditing) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open, isEditing]);

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!isValid) return;

    const dataToSubmit: UserFormData = {
      ...formData,
      username: formData.username.trim(),
      realname: formData.realname.trim(),
      email: formData.email?.trim() || null,
    };

    onSubmit(dataToSubmit);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && !isBusy) {
      handleSubmit(e as FormEvent);
    }
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleDialogChange}
      title={isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
      actions={
        <>
          <Button
            appearance="secondary"
            onClick={() => handleDialogChange(false)}
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button appearance="primary" onClick={handleSubmit} disabled={isBusy || !isValid}>
            {isBusy ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
        </>
      }
    >
      <>
        <Field
          itemID="userInput"
          label="Nombre de Usuario"
          orientation="horizontal"
          required
          className={commonStyles.field}
          validationMessage={showError('username') as string | undefined}
          validationState={showError('username') ? 'error' : undefined}
        >
          <Input
            ref={firstInputRef}
            id="username"
            name="username"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            onBlur={() => handleBlur('username')}
            onKeyDown={handleKeyDown}
            disabled={isBusy || isEditing}
          />
        </Field>

        <Field
          label="Nombre y Apellido"
          orientation="horizontal"
          required
          className={commonStyles.field}
          validationMessage={showError('realname') as string | undefined}
          validationState={showError('realname') ? 'error' : undefined}
        >
          <Input
            id="realname"
            name="realname"
            value={formData.realname}
            onChange={(e) => handleChange('realname', e.target.value)}
            onBlur={() => handleBlur('realname')}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />
        </Field>

        <Field
          label="Email"
          orientation="horizontal"
          className={commonStyles.field}
          validationMessage={showError('email') as string | undefined}
          validationState={showError('email') ? 'error' : undefined}
        >
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />
        </Field>
        <Field
          label="Rol"
          orientation="horizontal"
          className={isEditing ? styles.field2 : commonStyles.field}
        >
          <Combobox
            id="role"
            value={capitalize(formData.role)}
            onOptionSelect={(_, data) =>
              handleChange('role', data.optionValue?.toLowerCase() || 'deposito')
            }
            disabled={isBusy}
          >
            {assignableRoles.map((role) => (
              <Option key={role} value={capitalize(role)}>
                {capitalize(role)}
              </Option>
            ))}
          </Combobox>
          {isEditing && (
            <Switch
              className={commonStyles.fitContent}
              label={formData.isActive ? 'Activo' : 'Inactivo'}
              checked={formData.isActive}
              onChange={(_, data) => handleChange('isActive', data.checked)}
              disabled={isBusy}
            />
          )}
        </Field>
      </>
    </BaseDialog>
  );
}
