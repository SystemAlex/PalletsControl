import React from 'react';
import {
  Button,
  SearchBox,
  SearchBoxChangeEvent,
  InputOnChangeData,
  Tooltip,
  makeStyles,
} from '@fluentui/react-components';
import { BuildingCheckmarkRegular } from '@fluentui/react-icons';

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
});

interface EmpresaManagementHeaderProps {
  searchQuery: string;
  onSearchChange: (event: SearchBoxChangeEvent, data: InputOnChangeData) => void;
  onCreateEmpresaClick: () => void;
  isMobile: boolean;
}

export const EmpresaManagementHeader: React.FC<EmpresaManagementHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onCreateEmpresaClick,
  isMobile,
}) => {
  const styles = useStyles();

  return (
    <>
      <SearchBox
        placeholder="Buscar por razón social, CUIT o email..."
        value={searchQuery}
        onChange={onSearchChange}
        className={styles.searchBox}
      />
      {isMobile ? (
        <Tooltip relationship="label" content="Crear Empresa">
          <Button appearance="primary" onClick={onCreateEmpresaClick} icon={<BuildingCheckmarkRegular />} />
        </Tooltip>
      ) : (
        <Button appearance="primary" onClick={onCreateEmpresaClick} icon={<BuildingCheckmarkRegular />}>
          Crear Empresa
        </Button>
      )}
    </>
  );
};