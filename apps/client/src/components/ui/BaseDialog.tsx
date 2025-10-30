import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  createPresenceComponent,
  motionTokens,
  makeStyles,
  mergeClasses,
  Button,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';

interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  isForcedChange?: boolean;
  fitContent?: boolean;
}

const SlideDialogMotion = createPresenceComponent(() => {
  const keyframes = [
    {
      opacity: 0,
      transform: 'translateX(-100%)',
    },
    { opacity: 1, transform: 'translateX(0)' },
  ];

  return {
    enter: {
      keyframes,
      easing: motionTokens.curveDecelerateMax,
      duration: motionTokens.durationGentle,
    },
    exit: {
      keyframes: [...keyframes].reverse(),
      easing: motionTokens.curveAccelerateMid,
      duration: motionTokens.durationGentle,
    },
  };
});

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: 'fit-content',
    '@media(max-width: 1024px)': {
      maxWidth: 'auto',
    },
  },
  dialogSurfaceMov: {
    '@media(max-width: 768px)': {
      // marginInline: '12px !important',
      maxWidth: '90vw',
      padding: '8px !important',
    },
  },
  dialogBodyMov: {
    maxHeight: 'calc(100dvh - 84px)',
  },
  dialogHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
  },
});

export default function BaseDialog({
  open,
  onOpenChange,
  title,
  children,
  actions,
  isForcedChange = false,
  fitContent,
}: BaseDialogProps) {
  const styles = useStyles();
  const handleOpenChange = (_: unknown, data: { open: boolean }) => {
    if (!isForcedChange) {
      onOpenChange(data.open);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      modalType={isForcedChange ? 'alert' : 'modal'}
      surfaceMotion={{
        children: (_, props) => <SlideDialogMotion {...props}>{props.children}</SlideDialogMotion>,
      }}
    >
      <DialogSurface
        className={mergeClasses(
          styles.dialogSurfaceMov,
          fitContent ? styles.dialogSurface : undefined,
        )}
      >
        <DialogBody className={styles.dialogBodyMov}>
          <DialogTitle>
            <div className={styles.dialogHeader}>
              <span>{title}</span>
              {!actions && (
                <Button
                  appearance="subtle"
                  icon={<Dismiss24Regular />}
                  aria-label="Close"
                  onClick={() => onOpenChange(false)}
                />
              )}
            </div>
          </DialogTitle>
          <DialogContent>{children}</DialogContent>
          {actions && <DialogActions>{actions}</DialogActions>}
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
