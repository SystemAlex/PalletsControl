import { useState, useMemo } from 'react';
import { UserFormData } from '../components/dialogs/UserDialog';

export function useFormValidation(initialValues: UserFormData) {
  const [formData, setFormData] = useState<UserFormData>(initialValues);
  const [touched, setTouched] = useState<{ [K in keyof UserFormData]?: boolean }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    // Usuario: requerido y sin espacios
    if (!formData.username.trim()) {
      e.username = 'El nombre de usuario es obligatorio';
    } else if (/\s/.test(formData.username)) {
      e.username = 'No se permiten espacios en el nombre de usuario';
    }

    // Nombre y Apellido: requerido, min 3, solo letras y espacios
    const rn = (formData.realname ?? '').trim();
    if (!rn) {
      e.realname = 'El nombre y apellido es obligatorio';
    } else if (rn.length < 3) {
      e.realname = 'Debe tener al menos 3 caracteres';
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(rn)) {
      e.realname = 'Solo se permiten letras y espacios';
    }

    // Email: opcional, formato válido si se completa
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = 'Formato de email inválido';
    }

    return e;
  }, [formData]);

  const isValid = Object.keys(errors).length === 0;

  const handleChange = (name: keyof UserFormData, value: string | boolean | number | null) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }
  };

  const handleBlur = (name: keyof UserFormData) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const showError = (field: keyof UserFormData) =>
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