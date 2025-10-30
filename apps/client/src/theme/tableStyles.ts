import { makeStyles, tokens } from '@fluentui/react-components';

export const useTableStyles = makeStyles({
  // Contenedor para manejar el scroll de la tabla
  tableContainer: {
    margin: '0px !important',
    overflow: 'auto',
    height: '100%',
    maxHeight: '100%',
  },
  // Estilo base para la tabla
  table: {
    tableLayout: 'auto',
    minWidth: '100%',
    width: 'max-content',
  },
  // Estilo para las celdas de encabezado (sticky top)
  tableHeaderCell: {
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorNeutralBackground1,
    position: 'sticky',
    top: 0,
    zIndex: 1,
    textAlign: 'center',
  },
  // Alineación de texto a la izquierda
  cellLeft: {
    textAlign: 'left',
  },
  // Alineación de texto al centro
  cellCenter: {
    textAlign: 'center',
  },
  // Alineación de texto a la derecha
  cellRight: {
    textAlign: 'right',
  },
});
