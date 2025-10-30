import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  DialogContent,
  makeStyles,
  tokens,
  mergeClasses,
} from '@fluentui/react-components';
import React from 'react';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  message: string;
  message2?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const useStyles = makeStyles({
  dialogSurfaceMov: {
    '@media(max-width: 768px)': {
      // marginInline: '12px !important',
      maxWidth: '85vw',
    },
  },
  dangerButton: {
    backgroundColor: tokens.colorStatusDangerBackground3,
    color: tokens.colorNeutralForegroundOnBrand,

    '&:hover': {
      backgroundColor: `${tokens.colorStatusDangerBackground3Hover} !important`,
    },

    '&:active': {
      backgroundColor: tokens.colorStatusDangerBackground2,
      color: tokens.colorNeutralForegroundOnBrand,
    },

    '&:disabled': {
      backgroundColor: tokens.colorNeutralBackgroundDisabled,
      color: tokens.colorNeutralForegroundDisabled,
    },
  },
});

export default function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  message,
  message2,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
}: ConfirmationDialogProps) {
  const styles = useStyles();
  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.dialogSurfaceMov}>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            {message}
            {message2 ? (
              <>
                <br />
                <br />
                {message2}
              </>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button appearance="outline" onClick={() => onOpenChange(false)}>
              {cancelText}
            </Button>
            <Button
              appearance="primary"
              className={mergeClasses(isDestructive && styles.dangerButton)}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmText}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
