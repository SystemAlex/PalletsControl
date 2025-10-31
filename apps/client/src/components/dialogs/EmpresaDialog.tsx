import React, { useEffect, FormEvent, useRef } from 'react';
import {
  Button,
  Input,
  Switch,
  makeStyles,
  Field,
  mergeClasses,
} from '@fluentui/react-components';
import BaseDialog from '../ui/BaseDialog';
import { useFormValidationEmpresa } from '../../hooks/useFormValidationEmpresa';
import { useCommonStyles } from '../../theme/commonStyles';

const useStyles = makeStyles({
  // Estilos específicos para el layout del formulario
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    paddingTop: '12px',
    '@media(max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  fullWidth: {
    gridColumn: 'span 2 / span 2',
    '@media(max-width: 768px)': {
      gridColumn: 'span 1 / span 1',
    },
  },
  field: {
    height: '48px',
    gridTemplateColumns: '131px 1fr',
    '@media(max-width: 768px)': {
      gridTemplateColumns: '1fr',
      height: 'auto',
    },
  },
  switchField: {
    gridTemplateColumns: '131px 1fr',
    alignItems: 'center',
    '@media(max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export interface EmpresaFormData {
  idEmpresa?: number;
  razonSocial: string;
  nombreFantasia: string | null;
  cuit: string;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
  pais: string | null;
  telefono: string;
  email: string;
  sitioWeb: string | null;
  sector: string | null;
  logoUrl: string | null;
  activo: boolean;
}

interface EmpresaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (empresa: EmpresaFormData) => void;
  isSubmitting: boolean;
  empresaToEdit?: EmpresaFormData | null;
}

export default function EmpresaDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  empresaToEdit,
}: EmpresaDialogProps) {
  const styles = useStyles();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const initialValues: EmpresaFormData = {
    razonSocial: '',
    nombreFantasia: null,
    cuit: '',
    direccion: null,
    ciudad: null,
    provincia: null,
    pais: null,
    telefono: '',
    email: '',
    sitioWeb: null,
    sector: null,
    logoUrl: null,
    activo: true,
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
  } = useFormValidationEmpresa(initialValues);

  const isEditing = !!empresaToEdit;
  const isBusy = isSubmitting;
  const isBaseCompany = isEditing && formData.idEmpresa === 1; // Determinar si es la empresa base

  useEffect(() => {
    if (empresaToEdit) {
      // Normalize null/undefined fields to empty string for controlled inputs
      setFormData({
        ...empresaToEdit,
        nombreFantasia: empresaToEdit.nombreFantasia || '',
        direccion: empresaToEdit.direccion || '',
        ciudad: empresaToEdit.ciudad || '',
        provincia: empresaToEdit.provincia || '',
        pais: empresaToEdit.pais || '',
        telefono: empresaToEdit.telefono || '',
        email: empresaToEdit.email || '',
        sitioWeb: empresaToEdit.sitioWeb || '',
        sector: empresaToEdit.sector || '',
        logoUrl: empresaToEdit.logoUrl || '',
      });
    } else {
      reset();
    }
  }, [empresaToEdit, open]);

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

    // Normalize empty strings back to null for API payload
    const normalize = (value: string | null | undefined) => (value?.trim() || null);

    const dataToSubmit: EmpresaFormData = {
      ...formData,
      razonSocial: formData.razonSocial.trim(),
      cuit: formData.cuit.trim(),
      telefono: formData.telefono.trim(),
      email: formData.email.trim(),
      nombreFantasia: normalize(formData.nombreFantasia),
      direccion: normalize(formData.direccion),
      ciudad: normalize(formData.ciudad),
      provincia: normalize(formData.provincia),
      pais: normalize(formData.pais),
      sitioWeb: normalize(formData.sitioWeb),
      sector: normalize(formData.sector),
      logoUrl: normalize(formData.logoUrl),
      // Asegurar que 'activo' no se cambie si es la empresa base
      activo: isBaseCompany ? true : formData.activo,
    };

    onSubmit(dataToSubmit);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && !isBusy) {
      handleSubmit(e as FormEvent);
    }
  };

  // Helper function for input change handling
  const handleInputChange = (name: keyof EmpresaFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleChange(name, e.target.value);
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleDialogChange}
      title={isEditing ? 'Editar Empresa' : 'Crear Nueva Empresa'}
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
            {isBusy ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Empresa'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.formGrid}>
        {/* Columna 1 */}
        <Field
          label="Razón Social"
          orientation="horizontal"
          required
          className={styles.field}
          validationMessage={showError('razonSocial') as string | undefined}
          validationState={showError('razonSocial') ? 'error' : undefined}
        >
          <Input
            ref={firstInputRef}
            value={formData.razonSocial}
            onChange={handleInputChange('razonSocial')}
            onBlur={() => handleBlur('razonSocial')}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />
        </Field>
        <Field
          label="Nombre Fantasía"
          orientation="horizontal"
          className={styles.field}
        >
          <Input
            value={formData.nombreFantasia || ''}
            onChange={handleInputChange('nombreFantasia')}
            onBlur={() => handleBlur('nombreFantasia')}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />
        </Field>
        <Field
          label="CUIT"
          orientation="horizontal"
          required
          className={styles.field}
          validationMessage={showError('cuit') as string | undefined}
          validationState={showError('cuit') ? 'error' : undefined}
        >
          <Input
            value={formData.cuit}
            onChange={handleInputChange('cuit')}
            onBlur={() => handleBlur('cuit')}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />
        </Field>
        <Field
          label="Teléfono"
          orientation="horizontal"
          required
          className={styles.field}
          validationMessage={showError('telefono') as string | undefined}
          validationState={showError('telefono') ? 'error' : undefined}
        >
          <Input
            value={formData.telefono}
            onChange={handleInputChange('telefono')}
            onBlur={() => handleBlur('telefono')}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />
        </Field>
        <Field
          label="Email"
          orientation="horizontal"
          required
          className={styles.field}
          validationMessage={showError('email') as string | undefined}
          validationState={showError('email') ? 'error' : undefined}
        >
          <Input
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            onBlur={() => handleBlur('email')}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />
        </Field>
        <Field
          label="Sitio Web"
          orientation="horizontal"
          className={styles.field}
        >
          <Input
            value={formData.sitioWeb || ''}
            onChange={handleInputChange('sitioWeb')}
            onBlur={() => handleBlur('sitioWeb')}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />
        </Field>

        {/* Columna 2 */}
        <Field
          label="Dirección"
          orientation="horizontal"
          className={styles.field}
        >
          <Input
            value={formData.direccion || ''}
            onChange={handleInputChange('direccion')}
            onBlur={() => handleBlur('direccion')}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />
        </Field>
        <Field
          label="Ciudad"
          orientation="horizontal"
          className={styles.field}
        >
          <Input
            value={formData.ciudad || ''}
            onChange={handleInputChange('ciudad')}
            onBlur={() => handleBlur('ciudad')}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />
        </Field>
        <Field
          label="Provincia"
          orientation="horizontal"
          className={styles.field}
        >
          <Input
            value={formData.provincia || ''}
            onChange={handleInputChange('provincia')}
            onBlur={() => handleBlur('provincia')}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />
        </Field>
        <Field
          label="País"
          orientation="horizontal"
          className={styles.field}
        >
          <Input
            value={formData.pais || ''}
            onChange={handleInputChange('pais')}
            onBlur={() => handleBlur('pais')}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />
        </Field>
        <Field
          label="Sector"
          orientation="horizontal"
          className={styles.field}
        >
          <Input
            value={formData.sector || ''}
            onChange={handleInputChange('sector')}
            onBlur={() => handleBlur('sector')}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />
        </Field>
        <Field
          label="Logo URL"
          orientation="horizontal"
          className={styles.field}
        >
          <Input
            value={formData.logoUrl || ''}
            onChange={handleInputChange('logoUrl')}
            onBlur={() => handleBlur('logoUrl')}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
          />
        </Field>

        {/* Fila completa para Activo */}
        {isEditing && (
          <Field
            label="Estado"
            orientation="horizontal"
            className={mergeClasses(styles.switchField, styles.fullWidth)}
          >
            <Switch
              label={formData.activo ? 'Activo' : 'Inactivo'}
              checked={formData.activo}
              onChange={(_, data) => handleChange('activo', data.checked)}
              disabled={isBusy || isBaseCompany} // Deshabilitar si es la empresa base
            />
          </Field>
        )}
      </form>
    </BaseDialog>
  );
}