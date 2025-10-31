import { useState, useMemo } from 'react';
import { EmpresaFormData } from '../components/dialogs/EmpresaDialog';

export function useFormValidationEmpresa(initialValues: EmpresaFormData) {
  const [formData, setFormData] = useState<EmpresaFormData>(initialValues);
  const [touched, setTouched] = useState<{ [K in keyof EmpresaFormData]?: boolean }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    // Razón Social: requerido, min 1
    if (!formData.razonSocial.trim()) {
      e.razonSocial = 'La Razón Social es obligatoria';
    }

    // CUIT: requerido, min 1
    if (!formData.cuit.trim()) {
      e.cuit = 'El CUIT es obligatorio';
    }

    // Email: requerido, formato válido
    const email = (formData.email ?? '').trim();
    if (!email) {
      e.email = 'El Email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Formato de email inválido';
    }

    // Teléfono: requerido, min 1
    if (!formData.telefono.trim()) {
      e.telefono = 'El Teléfono es obligatorio';
    }

    return e;
  }, [formData]);

  const isValid = Object.keys(errors).length === 0;

  const handleChange = (name: keyof EmpresaFormData, value: string | boolean | number | null) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }
  };

  const handleBlur = (name: keyof EmpresaFormData) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const showError = (field: keyof EmpresaFormData) =>
    (touched[field] || submitAttempted) && errors[field];

  const reset = () => {
    setFormData(initialValues);
    setTouched({});
    setSubmitAttempted(false);
  };

  return {
    formData,
    setFormData,
    touched,
    submitAttempted,
    setSubmitAttempted,
    errors,
    isValid,
    handleChange,
    handleBlur,
    showError,
    reset,
  };
}
