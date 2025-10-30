import React from 'react';
import {
  Button,
  SearchBox,
  SearchBoxChangeEvent,
  InputOnChangeData,
  Tooltip,
  makeStyles, // Import makeStyles
} from '@fluentui/react-components';
import { PersonAddRegular } from '@fluentui/react-icons';

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

interface UserManagementHeaderProps {
  searchQuery: string;
  onSearchChange: (event: SearchBoxChangeEvent, data: InputOnChangeData) => void;
  onCreateUserClick: () => void;
  isMobile: boolean;
}

export const UserManagementHeader: React.FC<UserManagementHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onCreateUserClick,
  isMobile,
}) => {
  const styles = useStyles(); // Use the styles

  return (
    <>
      <SearchBox
        placeholder="Buscar por nombre, usuario o rol..."
        value={searchQuery}
        onChange={onSearchChange}
        className={styles.searchBox} // Apply the style
      />
      {isMobile ? (
        <Tooltip relationship="label" content="Crear Usuario">
          <Button appearance="primary" onClick={onCreateUserClick} icon={<PersonAddRegular />} />
        </Tooltip>
      ) : (
        <Button appearance="primary" onClick={onCreateUserClick} icon={<PersonAddRegular />}>
          Crear Usuario
        </Button>
      )}
    </>
  );
};
