import React, { useEffect, useRef, useState } from 'react';
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
  Button,
  mergeClasses,
} from '@fluentui/react-components';
import {
  GridRegular,
  TableRegular,
  History24Regular,
  TextBulletListSquareSparkleRegular,
  SearchRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  searchBox: {
    width: '220px',
    '@media(max-width: 600px)': { display: 'none' },
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
  show: { display: 'flex !important' },
  hidden: { display: 'none' },
});

interface PalletProductsHeaderProps {
  searchQuery: string;
  onSearchChange: (event: SearchBoxChangeEvent, data: InputOnChangeData) => void;
  viewType: 'table' | 'grid' | 'summary'; // Updated type
  onViewTypeChange: (viewType: 'table' | 'grid' | 'summary') => void; // Updated type
  onOpenPalletActionLogDialog: () => void;
  canViewLogs: boolean;
  isMobile: boolean;
}

export const PalletProductsHeader: React.FC<PalletProductsHeaderProps> = ({
  searchQuery,
  onSearchChange,
  viewType,
  onViewTypeChange,
  onOpenPalletActionLogDialog,
  canViewLogs,
  isMobile,
}) => {
  const styles = useStyles();
  const [showSearch, setShowSearch] = useState<boolean>(false);

  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (showSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showSearch]);

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
        className={mergeClasses(styles.searchBox, showSearch && styles.show)}
        ref={searchRef}
        onBlur={(e) => {
          if (e.currentTarget.value === '') setShowSearch(false);
        }}
      />
      {isMobile && (
        <Tooltip content="Buscar" relationship="label">
          <Button
            aria-label="Mostrar SerahBox"
            appearance="subtle"
            icon={<SearchRegular />}
            className={mergeClasses(showSearch && styles.hidden)}
            onClick={() => setShowSearch(true)}
          />
        </Tooltip>
      )}
      {viewToolbar}
    </>
  );
};
