import React from 'react';
import {
  Toolbar,
  ToolbarRadioButton,
  ToolbarRadioGroup,
  Tooltip,
  SearchBox,
  SearchBoxChangeEvent,
  InputOnChangeData,
  ToolbarButton,
  makeStyles,
} from '@fluentui/react-components';
import {
  GridRegular,
  TableRegular,
  History24Regular,
  TextBulletListSquareSparkleRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  searchBox: {
    width: '220px',
    '@media(max-width: 600px)': {
      width: '150px',
    },
    '&:focus-within': {
      '@media(max-width: 600px)': {
        width: '100%',
        minWidth: '81%',
      },
    },
  },
  toolbar: {
    padding: '0px',
    flexDirection: 'row',
    '@media(max-width: 600px)': {},
  },
});

interface PalletProductsHeaderProps {
  searchQuery: string;
  onSearchChange: (event: SearchBoxChangeEvent, data: InputOnChangeData) => void;
  viewType: 'table' | 'grid' | 'summary'; // Updated type
  onViewTypeChange: (viewType: 'table' | 'grid' | 'summary') => void; // Updated type
  onOpenPalletActionLogDialog: () => void;
  canViewLogs: boolean;
}

export const PalletProductsHeader: React.FC<PalletProductsHeaderProps> = ({
  searchQuery,
  onSearchChange,
  viewType,
  onViewTypeChange,
  onOpenPalletActionLogDialog,
  canViewLogs,
}) => {
  const styles = useStyles();

  const viewToolbar = (
    <Toolbar
      aria-label="Seleccionar vista"
      checkedValues={{ view: [viewType] }}
      onCheckedValueChange={(_, data) =>
        onViewTypeChange(data.checkedItems[0] as 'table' | 'grid' | 'summary')
      }
      size="small"
      className={styles.toolbar}
    >
      <ToolbarRadioGroup>
        <Tooltip content="Vista de Pallets" relationship="label">
          <ToolbarRadioButton
            aria-label="Vista de Pallets"
            appearance="subtle"
            name="view"
            icon={<GridRegular />}
            value="grid"
            size="medium"
          />
        </Tooltip>
        <Tooltip content="Vista de Tabla" relationship="label">
          <ToolbarRadioButton
            aria-label="Vista de Tabla"
            appearance="subtle"
            name="view"
            icon={<TableRegular />}
            value="table"
            size="medium"
          />
        </Tooltip>
        <Tooltip content="Vista de Resumen" relationship="label">
          <ToolbarRadioButton
            aria-label="Vista de Resumen"
            appearance="subtle"
            name="view"
            icon={<TextBulletListSquareSparkleRegular />}
            value="summary"
            size="medium"
          />
        </Tooltip>
      </ToolbarRadioGroup>
      {canViewLogs && (
        <Tooltip content="Ver Registro de Acciones" relationship="label">
          <ToolbarButton
            aria-label="Ver Registro de Acciones"
            appearance="subtle"
            icon={<History24Regular />}
            onClick={onOpenPalletActionLogDialog}
          />
        </Tooltip>
      )}
    </Toolbar>
  );

  return (
    <>
      <SearchBox
        placeholder="Buscar por código, artículo, fila..."
        value={searchQuery}
        onChange={onSearchChange}
        className={styles.searchBox}
      />
      {viewToolbar}
    </>
  );
};
