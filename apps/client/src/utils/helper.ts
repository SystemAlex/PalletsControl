import { CalendarStrings } from '@fluentui/react-calendar-compat';
import { defaultDatePickerStrings } from '@fluentui/react-datepicker-compat';
import { format, isValid, Locale, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns';
import { es, enUS, ptBR } from 'date-fns/locale'; // Importa los locales necesarios

// Mapeo de locales para date-fns
const locales: { [key: string]: Locale } = {
  es: es,
  'en-US': enUS,
  'pt-BR': ptBR,
};

// Helper para obtener el locale actual del navegador para date-fns
const getLocale = (): Locale => {
  const browserLocale = navigator.language; // e.g., 'es-AR', 'en-US'
  const primaryLocale = browserLocale.split('-')[0]; // e.g., 'es', 'en'

  // Intenta encontrar una coincidencia exacta (ej. 'en-US')
  if (locales[browserLocale]) {
    return locales[browserLocale];
  }
  // Si no hay coincidencia exacta, intenta con el idioma principal (ej. 'es')
  if (locales[primaryLocale]) {
    return locales[primaryLocale];
  }
  return es; // Por defecto a español si no se encuentra ninguna coincidencia
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace(/^#/, '');

  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return { r, g, b };
  }

  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return { r, g, b };
  }

  throw new Error(`Formato de color inválido: ${hex}`);
}

export function hexA(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function capitalize(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatRelativeTime(
  dateString: string | null | undefined,
  isDateOnly: boolean,
): string {
  if (!dateString) {
    return 'Nunca';
  }

  const date = new Date(dateString);
  if (!isValid(date)) {
    return 'Fecha inválida';
  }

  const locale = getLocale();
  if (isDateOnly) {
    if (isToday(date)) {
      return 'Hoy';
    }
    if (isYesterday(date)) {
      return 'Ayer';
    }
  }
  return formatDistanceToNowStrict(date, { addSuffix: true, locale });
}

export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) {
    return 'Nunca';
  }

  const date = new Date(dateString);
  if (!isValid(date)) {
    return 'Fecha inválida';
  }
  const locale = getLocale();
  // Usar un formato que date-fns pueda localizar, o mantener uno específico y aplicar el locale
  // 'P' es un formato de fecha localizado (ej. 10/27/2023 o 27.10.2023)
  // 'Pp' es fecha y hora localizada (ej. 10/27/2023, 10:30 AM)
  return format(date, 'Pp', { locale });
}

export function getDayName(dateString: string): string {
  if (!dateString) return '';

  const date = new Date(dateString + 'T00:00:00');

  if (!isValid(date)) return '';

  const locale = getLocale();
  return format(date, 'EEEE', { locale });
}

export const dateFromYmd = (s?: string): Date | undefined => {
  if (!s) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

export const formatYmd = (d: Date) => format(d, 'yyyy-MM-dd');

export const onFormatDate = (date?: Date): string => {
  if (!date) return '';
  if (!isValid(date)) return 'Fecha inválida';
  const locale = getLocale();
  // 'P' es un formato de fecha localizado (ej. 10/27/2023 o 27.10.2023)
  return format(date, 'P', { locale });
};

export const esDatePickerStrings: CalendarStrings = {
  ...defaultDatePickerStrings,
  days: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
  shortDays: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  months: [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ],
  shortMonths: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  goToToday: 'Ir a hoy',
};

export function getMedian(numbers: number[]): number {
  if (numbers.length === 0) {
    throw new Error('No se puede calcular la mediana de un arreglo vacío');
  }
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
