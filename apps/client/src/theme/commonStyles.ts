import { makeStyles, tokens } from '@fluentui/react-components';

export const useCommonStyles = makeStyles({
  // Estilos para campos de formulario horizontales (Label + Input)
  field: {
    height: '48px',
    gridTemplateColumns: '131px 1fr',
    '@media(max-width: 768px)': {
      gridTemplateColumns: '1fr',
      height: 'auto',
    },
  },
  // Estilos para contenedores flexibles (ej. para botones o paneles)
  flexBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '@media(max-width: 768px)': {
      alignItems: 'stretch',
      flexDirection: 'column',
      gap: '0px',
    },
  },
  // Estilo para el contenido principal dentro de un flexBox (con padding superior)
  flexBoxContent: {
    flex: '1 1 auto',
    paddingTop: '16px',
  },
  // Estilo para asegurar que un elemento ocupe solo el contenido necesario
  fitContent: {
    width: 'fit-content',
  },
  // Estilo para un botón o elemento con apariencia de peligro (rojo)
  dangerButton: {
    color: tokens.colorStatusDangerBackground3,

    '&:hover': {
      backgroundColor: `${tokens.colorStatusDangerBackground3Hover} !important`,
      color: `${tokens.colorNeutralForegroundOnBrand} !important`,
    },

    '&:hover .fui-Button__icon': {
      color: 'inherit !important',
    },

    '&:active': {
      backgroundColor: tokens.colorStatusDangerBackground2,
      color: tokens.colorNeutralForegroundOnBrand,
    },

    '&:disabled': {
      color: tokens.colorNeutralForegroundDisabled,
    },

    '&:hover:disabled': {
      backgroundColor: `${tokens.colorTransparentBackground} !important`,
      color: `${tokens.colorNeutralForegroundDisabled} !important`,
    },

    '&:hover:disabled *': {
      backgroundColor: `${tokens.colorTransparentBackground} !important`,
      color: `${tokens.colorNeutralForegroundDisabled} !important`,
    },
  },
  // Estilo para un botón o elemento con apariencia de éxito (verde)
  successButton: {
    color: tokens.colorStatusSuccessBackground3,

    '&:hover': {
      backgroundColor: `${tokens.colorStatusSuccessForeground1} !important`,
      color: `${tokens.colorNeutralForegroundOnBrand} !important`,
    },

    '&:hover .fui-Button__icon': {
      color: 'inherit !important',
    },

    '&:active': {
      backgroundColor: tokens.colorStatusSuccessBackground2,
      color: tokens.colorNeutralForegroundOnBrand,
    },

    '&:disabled': {
      color: tokens.colorNeutralForegroundDisabled,
    },

    '&:hover:disabled': {
      backgroundColor: `${tokens.colorTransparentBackground} !important`,
      color: `${tokens.colorNeutralForegroundDisabled} !important`,
    },

    '&:hover:disabled *': {
      backgroundColor: `${tokens.colorTransparentBackground} !important`,
      color: `${tokens.colorNeutralForegroundDisabled} !important`,
    },
  },

  // tables
  tableAuto: {
    tableLayout: 'auto',
  },
  tableHeaderSticky: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  tableHeaderCell: {
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    '& > *': {
      display: 'grid',
      gridTemplateColumns: '1fr 12px',
      width: 'calc(100%)',
      whiteSpace: 'pre',
    },
    '&:has(span)': {
      backgroundColor: tokens.colorBrandBackgroundSelected,
    },
    '&:hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      color: tokens.colorNeutralForegroundOnBrand,
    },
    '&:active': {
      backgroundColor: tokens.colorBrandBackgroundPressed,
      color: tokens.colorNeutralForegroundOnBrand,
    },
  },
  stickyHeaderCol: {
    position: 'sticky',
    left: '0px',
    zIndex: 3,
  },
  cellActions: {
    fontWeight: '600',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    '& > *': { textAlign: 'center', justifyContent: 'center' },
  },
  cellClickable: { cursor: 'pointer' },
  rowActions: { '&:hover .action-buttons': { opacity: 1, pointerEvents: 'auto' }, height: '52px' },
  actionButtons: {
    display: 'flex',
    columnGap: '8px',
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.2s ease-in-out',
  },
  cellCenter: {
    textAlign: 'center',
    '& > *': { textAlign: 'center', justifyContent: 'center' },
  },
  cellContent: {
    display: 'flex',
    alignItems: 'center',
  },
});
