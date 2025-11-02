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
  DialogTrigger,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';

interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  titleActions?: React.ReactNode;
  isForcedChange?: boolean;
  fitContent?: boolean;
  halfWidth?: boolean;
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
  dialogHalf: {
    maxWidth: '50%',
    '@media(max-width: 1024px)': {
      maxWidth: 'auto',
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
  titleActions,
  isForcedChange = false,
  fitContent,
  halfWidth,
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
          halfWidth ? styles.dialogHalf : undefined,
        )}
      >
        <DialogBody className={styles.dialogBodyMov}>
          <DialogTitle
            action={
              <>
                {!actions && !titleActions && (
                  <DialogTrigger action="close">
                    <Button appearance="subtle" aria-label="close" icon={<Dismiss24Regular />} />
                  </DialogTrigger>
                )}
                {titleActions && titleActions}
              </>
            }
          >
            {title}
          </DialogTitle>
          <DialogContent>{children}</DialogContent>
          {actions && <DialogActions>{actions}</DialogActions>}
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
