import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  NavDrawer,
  NavDrawerHeader,
  NavDrawerBody,
  NavItem,
  NavDivider,
  Persona,
  tokens,
  makeStyles,
  NavSectionHeader,
  Tooltip,
} from '@fluentui/react-components';
import {
  PeopleTeam24Regular,
  PeopleTeam24Filled,
  Key24Regular,
  SignOut24Regular,
  BoxMultiple24Regular,
  BoxMultiple24Filled,
  BoxMultipleCheckmark24Regular,
  BoxMultipleCheckmark24Filled,
  BuildingMultiple24Regular,
  BuildingMultiple24Filled,
  bundleIcon,
} from '@fluentui/react-icons';
import { useAuth } from '../context/AuthContext';
import IconLogo from '/src/assets/LogoIcon.png';

interface NavigationProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onOpenChangePassword: () => void;
  onOpenPalletPositionDialog: () => void;
}

const Peoples = bundleIcon(PeopleTeam24Filled, PeopleTeam24Regular);
const BoxMultiple = bundleIcon(BoxMultiple24Filled, BoxMultiple24Regular);
const BoxMultipleCheckmark = bundleIcon(
  BoxMultipleCheckmark24Filled,
  BoxMultipleCheckmark24Regular,
);
const BuildingMultiple = bundleIcon(BuildingMultiple24Filled, BuildingMultiple24Regular);

const useStyles = makeStyles({
  navigationDrawer: {
    margin: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusXLarge,
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '600',
  },
  pushDown: {
    marginTop: 'auto',
  },
  flexBox: {
    display: 'grid',
    alignItems: 'center',
    gridTemplateColumns: '143px 44px 44px',
    gridTemplateRows: 'repeat(1, 1fr)',
    gap: tokens.spacingHorizontalXS,
    marginRight: '10px',
  },
  flexUsers: {
    marginBlock: '0px',
  },
  headerBox: {
    padding: '0px !important',
    margin: '10px 8px !important',
    width: '-webkit-fill-available',
  },
  primaryText: {
    display: 'block',
    minWidth: 0,
    maxWidth: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  pngIcon: {
    width: '24px',
    height: '24px',
    filter: 'grayscale(100%)',
  },
});

export default function Navigation({
  isOpen,
  setIsOpen,
  onOpenChangePassword,
  onOpenPalletPositionDialog,
}: NavigationProps) {
  const styles = useStyles();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedValue = location.pathname.startsWith('/users')
    ? 'users'
    : location.pathname.startsWith('/pallets')
      ? 'pallet-products'
      : location.pathname.startsWith('/empresas')
        ? 'empresas'
        : location.pathname === '/'
          ? 'pallet-products' // Default to pallets
          : location.pathname.substring(1);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleChangePassword = () => {
    onOpenChangePassword();
    setIsOpen(false);
  };

  const handleOpenPalletPositions = () => {
    onOpenPalletPositionDialog();
    setIsOpen(false);
  };

  const canManageUsers = user && ['admin', 'developer'].includes(user.role);
  const canManagePalletPositions = user && ['admin', 'developer'].includes(user.role);
  const canViewPalletProducts = user && ['admin', 'developer', 'deposito'].includes(user.role);
  const canManageEmpresas = user && user.role === 'admin';

  const hasAccessControlItems = canManageUsers || canManagePalletPositions || canManageEmpresas;

  const empresa = 'Empresa S.A.';
  const empresaDesc = 'Control de Pallets';

  return (
    <NavDrawer
      open={isOpen}
      onOpenChange={(_, data) => setIsOpen(data.open)}
      type="overlay"
      className={styles.navigationDrawer}
      selectedValue={selectedValue}
    >
      <NavDrawerHeader className={styles.headerBox}>
        <Persona
          name={empresa}
          secondaryText={empresaDesc}
          avatar={{
            image: { src: IconLogo },
            shape: 'square',
            name: '',
          }}
        />
      </NavDrawerHeader>
      <NavDivider />
      <NavDrawerBody>
        {canViewPalletProducts && (
          <NavItem
            icon={<BoxMultiple />}
            onClick={() => handleNavigate('/pallets')}
            value="pallet-products"
          >
            Control Pallets
          </NavItem>
        )}
      </NavDrawerBody>
      {hasAccessControlItems && (
        <>
          <NavDivider />
          <NavSectionHeader>Administración</NavSectionHeader>
          <NavSectionHeader className={styles.flexUsers}>
            {canManageUsers && (
              <NavItem icon={<Peoples />} onClick={() => handleNavigate('/users')} value="users">
                Gestión de Usuarios
              </NavItem>
            )}
            {canManageEmpresas && (
              <NavItem
                icon={<BuildingMultiple />}
                onClick={() => handleNavigate('/empresas')}
                value="empresas"
              >
                Gestión de Empresas
              </NavItem>
            )}
            {canManagePalletPositions && (
              <NavItem
                icon={<BoxMultipleCheckmark />}
                onClick={handleOpenPalletPositions}
                value="pallet-positions"
              >
                Gestión de Pallets
              </NavItem>
            )}
          </NavSectionHeader>
        </>
      )}
      {user && (
        <>
          <NavDivider />
          <NavSectionHeader className={styles.flexBox}>
            <Persona
              primaryText={{ children: user.realname, className: styles.primaryText }}
              secondaryText={user.username}
              avatar={{ color: 'colorful', name: user.realname }}
            />
            <Tooltip content="Cambiar Contraseña" relationship="label">
              <NavItem
                icon={<Key24Regular />}
                onClick={handleChangePassword}
                value="change-password"
              />
            </Tooltip>
            <Tooltip content="Cerrar sesión" relationship="label">
              <NavItem icon={<SignOut24Regular />} onClick={handleLogout} value="logout" />
            </Tooltip>
          </NavSectionHeader>
        </>
      )}
    </NavDrawer>
  );
}
