import {
  Theme,
  BrandVariants,
  createLightTheme,
  createDarkTheme,
} from '@fluentui/react-components';
import { hexA } from '../utils/helper';

// Paleta base, color base #22B42B
/* export const palletsTheme: BrandVariants = {
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
}; */

// Paleta base, color base #7B2CBF
const palletsTheme: BrandVariants = {
  10: '#040206',
  20: '#1E1128',
  30: '#331848',
  40: '#441E64',
  50: '#552380',
  60: '#67279E',
  70: '#7A2BBD',
  80: '#873FC5',
  90: '#9452CB',
  100: '#A064D1',
  110: '#AC76D6',
  120: '#B887DC',
  130: '#C399E2',
  140: '#CEABE7',
  150: '#D9BDED',
  160: '#E4CFF2',
};

// Logo Colors
// On Dark: "colorBrandForeground2": "#b887dc",
// On Ligth: "colorBrandBackground": "#873fc5",

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
