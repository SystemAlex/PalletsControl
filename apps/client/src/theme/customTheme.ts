import {
  Theme,
  BrandVariants,
  createLightTheme,
  createDarkTheme,
} from '@fluentui/react-components';
import { hexA } from '../utils/helper';

// Paleta base, color base #22B42B
export const palletsTheme: BrandVariants = {
  10: '#020401',
  20: '#111C0D',
  30: '#162F14',
  40: '#1A3C17',
  50: '#1D4B1A',
  60: '#1F591D',
  70: '#216920',
  80: '#237822',
  90: '#248825',
  100: '#249827',
  110: '#23A929',
  120: '#36B837',
  130: '#62C45A',
  140: '#84D07A',
  150: '#A3DC99',
  160: '#C0E7B8',
};

// Tema claro base
const baseLight = createLightTheme(palletsTheme);

// Tema oscuro base
const baseDark = createDarkTheme(palletsTheme);

// Customizador genérico
export const customTheme = (base: Theme): Theme => ({
  ...base,
  colorNeutralBackground6: 'transparent',
  colorBackgroundOverlay: hexA(base.colorBrandBackground, 0.4),
  fontFamilyBase: "Aptos Display, 'Segoe UI', sans-serif",
  fontFamilyMonospace: "Aptos Display, 'Courier New', monospace",
  fontFamilyNumeric: "Aptos Display, 'Segoe UI', sans-serif",
});

// Temas finales exportables
export const palletsLightTheme: Theme = customTheme({
  ...baseLight,
});

export const palletsDarkTheme: Theme = customTheme({
  ...baseDark,
  colorBrandForeground1: palletsTheme[110],
  colorBrandForeground2: palletsTheme[120],
});
