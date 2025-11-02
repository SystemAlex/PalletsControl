import React, { createContext, useContext } from 'react';
import { Theme } from '@fluentui/react-components';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
}

export const AppThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useAppTheme = () => {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme debe usarse dentro de ThemeWrapper');
  return ctx;
};
