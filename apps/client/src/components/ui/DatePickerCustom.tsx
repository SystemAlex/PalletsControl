import React from 'react';
import { DatePicker, DatePickerProps } from '@fluentui/react-datepicker-compat';
import { useEffect } from 'react';

export const DatePickerCustom = (props: DatePickerProps) => {
  useEffect(() => {
    const input = document.querySelector("input[role='combobox']") as HTMLInputElement;
    if (input) {
      input.readOnly = true;
      input.setAttribute('inputmode', 'none');
    }
  }, []);

  return <DatePicker type={undefined} {...props} />;
};
