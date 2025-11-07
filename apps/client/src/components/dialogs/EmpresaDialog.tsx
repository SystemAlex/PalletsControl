import React, { useEffect, FormEvent, useRef } from 'react';
import {
  Button,
  Input,
  Switch,
  makeStyles,
  Field,
  mergeClasses,
  Combobox,
  Option,
  Divider,
  tokens,
  OptionGroup,
} from '@fluentui/react-components';
import BaseDialog from '../ui/BaseDialog';
import { useFormValidationEmpresa } from '../../hooks/useFormValidationEmpresa';
import { FrecuenciaPago } from '../../../../shared/types';
import { useCommonStyles } from '../../theme/commonStyles';
import { capitalize } from '../../utils/helper';
import { sectorOptions } from '../../utils/sectores';

const useStyles = makeStyles({
  hidden: { display: 'none' },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  divider: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  row1: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gridTemplateRows: 'auto auto auto',
    columnGap: '6px',
    rowGap: '4px',
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    '&  *': {
      minWidth: '0px',
      maxWidth: '100%',
      flexGrow: 0,
    },
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gridTemplateRows: 'auto auto auto',
    columnGap: '6px',
    rowGap: '4px',
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    '&  *': {
      minWidth: '0px',
      maxWidth: '100%',
      flexGrow: 0,
    },
  },
  row3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(calc((100% - 12px) / 3), 1fr))',
    gridTemplateRows: 'auto auto',
    columnGap: '6px',
    rowGap: '4px',
    '@media(max-width: 600px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'repeat(auto-fit)',
    },
  },
  comboBox: {
    minWidth: 0,
    '& input': { width: '100%' },
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  fantWidth: {},
  cuitWidth: {
    gridColumnStart: 2,
    gridRowStart: 2,
    '& > :nth-child(2)': {
      width: '160px',
    },
  },
  telWidth: {
    '& > :nth-child(2)': {
      width: '140px',
    },
  },
  headerSwitch: { alignItems: 'center', height: '28px' },
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
  frecuenciaPago: FrecuenciaPago;
}

interface EmpresaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (empresa: EmpresaFormData) => void;
  isSubmitting: boolean;
  empresaToEdit?: EmpresaFormData | null;
}

const frecuenciaOptions: FrecuenciaPago[] = ['mensual', 'anual', 'permanente'];

export default function EmpresaDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  empresaToEdit,
}: EmpresaDialogProps) {
  const styles = useStyles();
  const commonStyles = useCommonStyles();
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
    frecuenciaPago: 'mensual',
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
        frecuenciaPago: empresaToEdit.frecuenciaPago || 'mensual', // Ensure default if missing
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
    const normalize = (value: string | null | undefined) => value?.trim() || null;

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
      // Asegurar que 'frecuenciaPago' no se cambie si es la empresa base
      frecuenciaPago: isBaseCompany ? 'permanente' : formData.frecuenciaPago,
    };

    onSubmit(dataToSubmit);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && !isBusy) {
      handleSubmit(e as FormEvent);
    }
  };

  // Helper function for input change handling
  const handleInputChange =
    (name: keyof EmpresaFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      handleChange(name, e.target.value);
    };

  const handleFrecuenciaSelect = (_: unknown, data: { optionValue?: string }) => {
    if (data.optionValue) {
      handleChange('frecuenciaPago', data.optionValue as FrecuenciaPago);
    }
  };

  const [matchingSectors, setMatchingSectors] = React.useState(
    sectorOptions.flatMap((g) => g.options),
  );
  const [customSector, setCustomSector] = React.useState<string | undefined>();

  return (
    <form onSubmit={handleSubmit} className={styles.hidden}>
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
        titleActions={
          <>
            {isEditing && (
              <Switch
                label={formData.activo ? 'Activo' : 'Inactivo'}
                checked={formData.activo}
                onChange={(_, data) => handleChange('activo', data.checked)}
                disabled={isBusy || isBaseCompany}
                className={styles.headerSwitch}
              />
            )}
          </>
        }
      >
        <div className={styles.formGrid}>
          <Divider className={styles.divider} appearance="brand" alignContent="start">
            Identificación
          </Divider>
          <div className={styles.row1}>
            <Field
              label="Razón Social"
              orientation="vertical"
              required
              className={mergeClasses(commonStyles.fieldVertical, styles.fullWidth)}
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
              label="Nom. Fantasía"
              orientation="vertical"
              className={mergeClasses(commonStyles.fieldVertical, styles.fantWidth)}
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
              orientation="vertical"
              required
              className={mergeClasses(commonStyles.fieldVertical, styles.cuitWidth)}
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
            <Field label="Logo" orientation="vertical" className={styles.fullWidth}>
              <Input
                value={formData.logoUrl || ''}
                onChange={handleInputChange('logoUrl')}
                onBlur={() => handleBlur('logoUrl')}
                onKeyDown={handleKeyDown}
                disabled={isBusy}
              />
            </Field>
          </div>
          <Divider className={styles.divider} appearance="brand" alignContent="start">
            Contacto
          </Divider>
          <div className={styles.row2}>
            <Field
              label="Teléfono"
              orientation="vertical"
              required
              className={mergeClasses(commonStyles.fieldVertical, styles.telWidth)}
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
              orientation="vertical"
              required
              className={mergeClasses(commonStyles.fieldVertical, styles.fantWidth)}
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
              orientation="vertical"
              className={mergeClasses(commonStyles.fieldVertical, styles.fullWidth)}
            >
              <Input
                value={formData.sitioWeb || ''}
                onChange={handleInputChange('sitioWeb')}
                onBlur={() => handleBlur('sitioWeb')}
                onKeyDown={handleKeyDown}
                disabled={isBusy}
              />
            </Field>
          </div>
          <Divider className={styles.divider} appearance="brand" alignContent="start">
            Domicilio
          </Divider>
          <div className={styles.row3}>
            <Field
              label="País"
              orientation="vertical"
              className={mergeClasses(commonStyles.fieldVertical)}
            >
              {/* <Input
              value={formData.pais || ''}
              onChange={handleInputChange('pais')}
              onBlur={() => handleBlur('pais')}
              onKeyDown={handleKeyDown}
              disabled={isBusy}
            /> */}
              <Combobox className={styles.comboBox} />
            </Field>
            <Field
              label="Provincia"
              orientation="vertical"
              className={mergeClasses(commonStyles.fieldVertical)}
            >
              {/* <Input
              value={formData.provincia || ''}
              onChange={handleInputChange('provincia')}
              onBlur={() => handleBlur('provincia')}
              onKeyDown={handleKeyDown}
              disabled={isBusy}
            /> */}
              <Combobox className={styles.comboBox} />
            </Field>
            <Field label="Ciudad" orientation="vertical" className={commonStyles.fieldVertical}>
              {/* <Input
              value={formData.ciudad || ''}
              onChange={handleInputChange('ciudad')}
              onBlur={() => handleBlur('ciudad')}
              onKeyDown={handleKeyDown}
              disabled={isBusy}
            /> */}
              <Combobox className={styles.comboBox} />
            </Field>
            <Field
              label="Dirección"
              orientation="vertical"
              className={mergeClasses(commonStyles.fieldVertical, styles.fullWidth)}
            >
              <Input
                value={formData.direccion || ''}
                onChange={handleInputChange('direccion')}
                onBlur={() => handleBlur('direccion')}
                onKeyDown={handleKeyDown}
                disabled={isBusy}
              />
            </Field>
          </div>
          <Divider className={styles.divider} appearance="brand" alignContent="start">
            Datos comerciales
          </Divider>
          <div className={styles.row3}>
            <Field label="Sector" orientation="vertical" className={commonStyles.fieldVertical}>
              <Combobox
                freeform
                value={formData.sector || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const allOptions = sectorOptions.flatMap((g) => g.options);
                  const matches = allOptions.filter((opt) =>
                    opt.toLowerCase().includes(value.toLowerCase()),
                  );
                  setMatchingSectors(matches);
                  if (value.length && matches.length < 1) {
                    setCustomSector(value);
                  } else {
                    setCustomSector(undefined);
                  }
                  handleChange('sector', value);
                }}
                onOptionSelect={(_, data) => {
                  if (data.optionValue) {
                    handleChange('sector', data.optionValue);
                    setCustomSector(undefined);
                  } else {
                    setCustomSector(data.optionText);
                    handleChange('sector', data.optionText || '');
                  }
                }}
                disabled={isBusy}
                className={styles.comboBox}
                placeholder="Seleccione o escriba un sector"
              >
                {customSector ? (
                  <Option key="freeform" value={customSector}>
                    {`Usar "${customSector}"`}
                  </Option>
                ) : null}
                {sectorOptions.map((group) => {
                  const filtered = group.options.filter((opt) => matchingSectors.includes(opt));
                  if (filtered.length === 0) return null;
                  return (
                    <OptionGroup key={group.label} label={group.label}>
                      {filtered.map((opt) => (
                        <Option key={opt} value={opt}>
                          {opt}
                        </Option>
                      ))}
                    </OptionGroup>
                  );
                })}
              </Combobox>
            </Field>
            <Field
              label="Frecuencia Pago"
              orientation="vertical"
              className={commonStyles.fieldVertical}
            >
              <Combobox
                value={capitalize(formData.frecuenciaPago)}
                onOptionSelect={handleFrecuenciaSelect}
                disabled={isBusy || isBaseCompany}
                className={styles.comboBox}
              >
                {frecuenciaOptions.map((f) => (
                  <Option key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Option>
                ))}
              </Combobox>
            </Field>
          </div>
        </div>
      </BaseDialog>
    </form>
  );
}
