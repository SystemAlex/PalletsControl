import { makeStyles, tokens } from '@fluentui/react-components';

export const useReportTableStyles = makeStyles({
  // ÚNICO contenedor scrollable
  tableContainer: {
    overflowX: 'auto',
    overflowY: 'auto',
    height: '100%',
  },
  // Estilos de la tabla
  table: {
    tableLayout: 'auto',
    width: 'max-content',
    minWidth: '100%',
  },
  // Header sticky arriba
  tableHeaderSticky: {
    position: 'sticky',
    top: 0,
    zIndex: 6,
    '& > *': {
      borderBottom: 'none',
    },
  },
  // Primera columna sticky (BODY)
  stickyCol: {
    position: 'sticky',
    left: '-1px',
    zIndex: 2,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  // Primera columna sticky (HEADER)
  stickyHeaderCol: {
    position: 'sticky',
    left: '-1px',
    zIndex: 8,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorBrandBackground2,
  },
  // Fila “supervisor” sticky debajo del header
  tableHeaderSuper: {
    position: 'sticky',
    top: '39px', // asegura que quede bajo el header
    zIndex: 4,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground,
      color: tokens.colorBrandBackground2,
    },
  },
  // Primera columna sticky para la fila “supervisor”
  stickyGroupCol: {
    position: 'sticky',
    maxWidth: '21vw',
    left: '-1px',
    zIndex: 5,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorBrandBackground2,
  },
  // Fila total inferior sticky
  tableHeaderTot: {
    position: 'sticky',
    bottom: '0px',
    zIndex: 6,
    backgroundColor: tokens.colorBrandBackgroundHover,
    color: tokens.colorBrandBackground2,
    borderBottom: 'none',
    ':hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      color: tokens.colorBrandBackground2,
    },
    ':focus': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      color: tokens.colorBrandBackground2,
    },
    ':focus-visible': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      color: tokens.colorBrandBackground2,
    },
    ':focus-within': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      color: tokens.colorBrandBackground2,
    },
    ':active': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      color: tokens.colorBrandBackground2,
    },
    '&[aria-selected="true"]': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      color: tokens.colorBrandBackground2,
    },
    '& button': {
      fontSize: tokens.fontSizeBase600,
      color: tokens.colorBrandBackground2,
      paddingBlock: '4px',
      minWidth: 'auto',
    },
  },
  // Primera columna sticky para la fila total inferior
  stickyTotalCol: {
    position: 'sticky',
    left: '-1px',
    zIndex: 3,
    backgroundColor: tokens.colorBrandBackgroundHover,
    color: tokens.colorBrandBackground2,
  },
  totalRow: {
    fontWeight: tokens.fontWeightBold,
    height: 'auto',
    ':hover': {
      backgroundColor: tokens.colorBrandBackground,
      color: tokens.colorBrandBackground2,
    },
    '& button': {
      fontSize: tokens.fontSizeBase400,
      color: tokens.colorBrandBackground2,
      paddingBlock: '2px',
      minWidth: 'auto',
    },
  },
  tableRow: {
    ':hover > *': { backgroundColor: 'inherit !important', color: 'inherit !important' },
    ':focus > *': { backgroundColor: 'inherit !important', color: 'inherit !important' },
    ':focus-visible': { backgroundColor: 'inherit !important', color: 'inherit !important' },
    ':focus-within': { backgroundColor: 'inherit !important', color: 'inherit !important' },
    ':active': {
      backgroundColor: 'inherit !important',
      color: 'inherit !important',
    },
    '&[aria-selected="true"]': {
      backgroundColor: 'inherit !important',
      color: 'inherit !important',
    },
    '& button': {
      fontSize: tokens.fontSizeBase300,
      color: tokens.colorNeutralForeground1,
      paddingBlock: '2px',
      minWidth: 'auto',
      fontWeight: `${tokens.fontWeightRegular} !important`,
      ':hover': {
        background: tokens.colorBrandBackground2,
        fontWeight: `${tokens.fontWeightSemibold} !important`,
      },
    },
  },
  brandBack: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorBrandBackground2,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground,
      color: tokens.colorBrandBackground2,
    },
    ':focus': {
      backgroundColor: tokens.colorBrandBackground,
      color: tokens.colorBrandBackground2,
    },
    ':focus-visible': {
      backgroundColor: tokens.colorBrandBackground,
      color: tokens.colorBrandBackground2,
    },
    ':focus-within': {
      backgroundColor: tokens.colorBrandBackground,
      color: tokens.colorBrandBackground2,
    },
    ':active': {
      backgroundColor: tokens.colorBrandBackground,
      color: tokens.colorBrandBackground2,
    },
    '&[aria-selected="true"]': {
      backgroundColor: tokens.colorBrandBackground,
      color: tokens.colorBrandBackground2,
    },
  },
  dangerBack: {
    backgroundColor: tokens.colorStatusDangerBackground1,
    color: tokens.colorStatusDangerForeground1,
    ':hover': {
      backgroundColor: tokens.colorStatusDangerBackground3Hover,
      color: tokens.colorStatusDangerBackground1,
      '& button': {
        backgroundColor: tokens.colorStatusDangerBackground3Hover,
        color: tokens.colorStatusDangerBackground1,
      },
    },
    ':focus': {
      outline: `${tokens.strokeWidthThick} solid ${tokens.colorStatusDangerForeground1}`,
      outlineOffset: '-2px',
    },
    ':focus-visible': {
      outline: `${tokens.strokeWidthThick} solid ${tokens.colorStatusDangerForeground1}`,
      outlineOffset: '-2px',
    },
    ':focus-within': {
      outline: `${tokens.strokeWidthThick} solid ${tokens.colorStatusDangerForeground1}`,
      outlineOffset: '-2px',
    },
    ':active': {
      backgroundColor: tokens.colorStatusDangerBackground2,
      color: tokens.colorStatusDangerForeground1,
    },
    '&[aria-selected="true"]': {
      backgroundColor: tokens.colorStatusDangerBackground2,
      color: tokens.colorNeutralForegroundOnBrand,
    },
    '& button': {
      fontSize: tokens.fontSizeBase300,
      color: tokens.colorStatusDangerForeground1,
      paddingBlock: '2px',
      minWidth: 'auto',
      fontWeight: `${tokens.fontWeightRegular}`,
      ':hover': {
        backgroundColor: `${tokens.colorStatusDangerBackground1} !important`,
        color: `${tokens.colorStatusDangerBackground3} !important`,
        fontWeight: `${tokens.fontWeightSemibold} !important`,
        '& span': {
          color: `${tokens.colorStatusDangerBackground3} !important`,
        },
      },
    },
  },
  brandBackNoText: {
    color: `${tokens.colorBrandBackground} !important`,
    borderTopColor: tokens.colorBrandBackground2,
  },
  brandBack1: {
    backgroundColor: tokens.colorNeutralBackground1,
  },
  titleWraper: {
    width: `calc(100% - ${tokens.spacingHorizontalS} * 2)`,
    display: 'flex',
    paddingInline: tokens.spacingHorizontalS,
    height: '-webkit-fill-available',
    borderTop: '1px solid',
  },
  rowBackground: { paddingInline: '0px !important' },
  rowTitle: {
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase400,
    whiteSpace: 'nowrap',
    color: tokens.colorBrandBackground2,
    textAlign: 'center',
    '> *': {
      justifyContent: 'center',
    },
  },
  clickedCell: { textAlign: 'center', cursor: 'pointer' },
  totalCell: { padding: '6px' },
  fadingTableBody: {
    opacity: 0.7,
    transition: 'opacity 0.2s ease-in-out',
  },
  colEllipsis: {
    display: 'flex !important',
    alignItems: 'center',
    gap: '4px',
    minWidth: 'calc(100% - 16px)',
  },
  cellEllipsis: {
    display: 'block',
    minWidth: 0,
    maxWidth: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rowIsExpanded: {
    backgroundColor: tokens.colorBrandBackground2,
    fontWeight: tokens.fontWeightBold,
    '& > *': {
      fontWeight: tokens.fontWeightBold,
    },
  },
  toolbarInCell: {
    width: 'auto',
    padding: 0,
    '& button': {
      fontSize: tokens.fontSizeBase300,
      color: tokens.colorNeutralForeground1,
      paddingBlock: '2px',
      minWidth: 'auto',
      fontWeight: `${tokens.fontWeightRegular} !important`,
      ':hover': {
        background: tokens.colorBrandBackground2,
        fontWeight: `${tokens.fontWeightSemibold} !important`,
      },
    },
  },
  toolbarContainer: {
    [`& [role="toolbar"] button`]: {
      opacity: 0,
      pointerEvents: 'none',
      transition: 'opacity 0.2s ease-in-out',
    },
    '&:hover': {
      [`& [role="toolbar"] button`]: {
        opacity: 1,
        pointerEvents: 'auto',
      },
    },
    '@media(max-width: 600px)': {
      [`& [role="toolbar"] button`]: {
        opacity: 1,
        pointerEvents: 'auto',
      },
    },
  },
});

export type ReportTableStyles = ReturnType<typeof useReportTableStyles>;
