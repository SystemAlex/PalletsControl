import React, { useEffect, useState } from 'react';
import {
  FluentProvider,
  teamsDarkTheme,
  teamsLightTheme,
  Toaster,
  tokens,
  useThemeClassName,
  makeResetStyles,
} from '@fluentui/react-components';
import { customTheme } from './customTheme';

// Estilos globales para scrollbar
const useGlobalScrollbarStyles = makeResetStyles({
  ':global(*)': {
    scrollbarWidth: 'thin',
    scrollbarColor: `${tokens.colorBrandBackground} ${tokens.colorBrandBackground2}`,
  },
});

export const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const base = prefersDark ? teamsDarkTheme : teamsLightTheme;
    return customTheme(base);
  });

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const newBase = media.matches ? teamsDarkTheme : teamsLightTheme;
      setTheme(customTheme(newBase));
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const ApplyThemeToBody: React.FC = () => {
    const themeClass = useThemeClassName();
    useEffect(() => {
      const classes = themeClass.split(' ');
      document.body.classList.add(...classes);
      return () => {
        document.body.classList.remove(...classes);
      };
    }, [themeClass]);
    return null;
  };

  const globalScrollbar = useGlobalScrollbarStyles();

  return (
    <FluentProvider theme={theme} applyStylesToPortals className={globalScrollbar}>
      <ApplyThemeToBody />
      <Toaster toasterId="app-toaster" />
      {children}
    </FluentProvider>
  );
};
