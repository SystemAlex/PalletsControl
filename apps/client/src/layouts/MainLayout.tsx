import React, { useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { Link, Outlet, useOutletContext, useLocation } from 'react-router-dom';
import {
  makeStyles,
  useRestoreFocusTarget,
  Hamburger,
  tokens,
  Title2,
} from '@fluentui/react-components';
import Navigation from '../components/Navigation';
import ChangePasswordDialog from '../components/dialogs/ChangePasswordDialog';
import PalletPositionDialog from '../components/dialogs/PalletPositionDialog';
import Logo from '../components/ui/Logo';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0px 24px',
    minHeight: '60px',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    position: 'sticky',
    zIndex: 10,
    overflow: 'hidden',
    columnGap: tokens.spacingVerticalL,
    '@media(max-width: 768px)': {
      columnGap: tokens.spacingVerticalS,
      padding: '8px',
      minHeight: '32px',
    },
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingVerticalL,
    '@media(max-width: 768px)': {
      columnGap: tokens.spacingVerticalS,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
    },
  },
  headerTitle: {
    lineHeight: '1',
    alignSelf: 'flex-end',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    minWidth: 0,
    maxWidth: '100%',
    '@media(max-width: 768px)': {
      alignSelf: 'center',
    },
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    textWrap: 'nowrap',
    columnGap: tokens.spacingVerticalL,
    '@media(max-width: 768px)': {
      columnGap: tokens.spacingVerticalS,
    },
  },
  main: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '12px',
    '@media(max-width: 600px)': {},
  },
  logoHiddenMobile: {
    '@media(max-width: 768px)': {
      display: 'none',
    },
  },
});

interface MainLayoutContext {
  openChangePasswordDialog: () => void;
  onOpenPalletPositionDialog: () => void;
  setHeaderContent: (content: ReactNode | null) => void;
  setHeaderText: (text: string | null) => void;
  isMobile: boolean;
}

export function useMainLayoutContext() {
  return useOutletContext<MainLayoutContext>();
}

export default function MainLayout() {
  const styles = useStyles();
  const location = useLocation();

  const [isNavOpen, setNavOpen] = useState(false);
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isPalletPositionDialogOpen, setIsPalletPositionDialogOpen] = useState(false);
  const [headerContent, setHeaderContent] = useState<ReactNode | null>(null);
  const [headerText, setHeaderText] = useState<string | null>(null);
  const restoreFocusTargetAttributes = useRestoreFocusTarget();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  const openChangePasswordDialog = useCallback(() => {
    setChangePasswordOpen(true);
  }, []);

  const onOpenPalletPositionDialog = useCallback(() => {
    setIsPalletPositionDialogOpen(true);
  }, []);

  const setHeaderContentCallback = useCallback((content: ReactNode | null) => {
    setHeaderContent(content);
  }, []);

  const setHeaderTextCallback = useCallback((text: string | null) => {
    setHeaderText(text);
    const title = text ? ` → ${text}` : '';
    document.title = `Alquimia Web${title}`;
  }, []);

  const contextValue = useMemo(
    () => ({
      openChangePasswordDialog,
      onOpenPalletPositionDialog,
      setHeaderContent: setHeaderContentCallback,
      setHeaderText: setHeaderTextCallback,
      isMobile,
    }),
    [
      openChangePasswordDialog,
      onOpenPalletPositionDialog,
      setHeaderContentCallback,
      setHeaderTextCallback,
      isMobile,
    ],
  );

  return (
    <div className={styles.root}>
      <Navigation
        isOpen={isNavOpen}
        setIsOpen={setNavOpen}
        onOpenChangePassword={openChangePasswordDialog}
        onOpenPalletPositionDialog={onOpenPalletPositionDialog}
      />

      <ChangePasswordDialog open={isChangePasswordOpen} onOpenChange={setChangePasswordOpen} />
      {/* Removed ChessAccessDialog */}
      <PalletPositionDialog
        open={isPalletPositionDialogOpen}
        onOpenChange={setIsPalletPositionDialogOpen}
        isMobile={isMobile} // Pasa isMobile directamente
      />

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Hamburger
            onClick={() => setNavOpen(true)}
            aria-label="Abrir menú de navegación"
            {...restoreFocusTargetAttributes}
          />
          <Link to="/" className={styles.logoHiddenMobile}>
            <Logo />
          </Link>
          {headerText && <Title2 className={styles.headerTitle}>{headerText}</Title2>}
        </div>
        <div className={styles.headerActions}>{headerContent}</div>
      </header>

      <main className={styles.main}>
        <Outlet context={contextValue} />
      </main>
    </div>
  );
}