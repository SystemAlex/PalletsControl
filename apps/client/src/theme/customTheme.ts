import { Theme } from '@fluentui/react-components';
import { hexA } from '../utils/helper';

export const customTheme = (base: Theme): Theme => ({
  ...base,
  colorNeutralBackground6: 'transparent',
  colorBackgroundOverlay: hexA(base.colorBrandBackground, 0.4),
  fontFamilyBase: "Aptos Display, 'Segoe UI', sans-serif",
  fontFamilyMonospace: "Aptos Display, 'Courier New', monospace",
  fontFamilyNumeric: "Aptos Display, 'Segoe UI', sans-serif",
});
