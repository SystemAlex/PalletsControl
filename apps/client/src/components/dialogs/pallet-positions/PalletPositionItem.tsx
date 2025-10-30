import React from 'react';
import {
  Button,
  Text,
  Tooltip,
  makeStyles,
  tokens,
  mergeClasses,
  Card, // Importar Card
  CardFooter, // Importar CardFooter
} from '@fluentui/react-components';
import {
  AddSquareFilled,
  AddSquareRegular,
  bundleIcon,
  Delete24Regular,
  ToggleLeft24Regular,
  ToggleRight24Regular,
} from '@fluentui/react-icons';
import { PalletPositionRecord } from '../../../../../shared/types';
import { useCommonStyles } from '../../../theme/commonStyles'; // Importar commonStyles

const useStyles = makeStyles({
  positionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between', // Para empujar el footer hacia abajo
    padding: '0px',
    color: tokens.colorNeutralForeground1,
    position: 'relative',
    boxShadow: tokens.shadow2,
    borderInlineWidth: '6px',
    borderInlineStyle: 'solid',
    borderInlineColor: '#1200FB',
    borderRadius: 0,
    gap: '0px',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground4,
    },
  },
  positionText: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    marginBottom: '4px',
    flexGrow: 1, // Permite que el texto ocupe el espacio restante
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  cardFooter: {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 'auto', // Empuja el footer hacia abajo
    padding: '0', // Eliminar padding por defecto del CardFooter si no se necesita
    backgroundColor: '#FF8000',
  },
  disabledPosition: {
    backgroundColor: tokens.colorNeutralBackgroundDisabled,
    color: tokens.colorNeutralForegroundDisabled,
    opacity: 0.7,
  },
  icon: {
    width: '20px',
    marginInline: '2px',
    color: tokens.colorNeutralForegroundDisabled,
  },
  addButton: {
    minWidth: '100%',
    minHeight: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  iconButton: {
    minWidth: '24px',
    height: '24px',
    padding: '0',
  },
  enabledIcon: {
    color: tokens.colorStatusSuccessForeground1,
  },
  disabledIcon: {
    color: tokens.colorStatusDangerForeground1,
  },
});

type PalletPositionItemProps =
  | {
      new?: false;
      position: PalletPositionRecord;
      onToggleStatus: (position: PalletPositionRecord) => void;
      onDelete: (position: PalletPositionRecord) => void;
      isAnyMutationPending: boolean;
    }
  | {
      new: true;
      nextPosicion: number;
      currentFila: string | null;
      onCreateNext: () => void;
      isAnyMutationPending: boolean;
    };

const AddNew = bundleIcon(AddSquareFilled, AddSquareRegular);

export const PalletPositionItem: React.FC<PalletPositionItemProps> = (props) => {
  const styles = useStyles();
  const commonStyles = useCommonStyles();

  if (props.new) {
    const { currentFila, onCreateNext, isAnyMutationPending } = props;

    // 🔹 Render para el caso "nuevo"
    return (
      <Card className={styles.positionCard}>
        <Text className={styles.positionText}>
          <Tooltip
            content={currentFila ? `Agregar Posición` : 'Selecciona una Fila'}
            relationship="label"
          >
            <Button
              appearance="transparent"
              icon={<AddNew />}
              onClick={onCreateNext}
              disabled={isAnyMutationPending || !currentFila}
              className={styles.addButton}
            />
          </Tooltip>
        </Text>
        <CardFooter className={styles.cardFooter}>
          <ToggleLeft24Regular className={styles.icon} />
          <Delete24Regular className={styles.icon} />
        </CardFooter>
      </Card>
    );
  }

  // 🔹 Render para el caso "existente"
  const { position, onToggleStatus, onDelete, isAnyMutationPending } = props;

  return (
    <Card
      key={position.id}
      className={mergeClasses(styles.positionCard, !position.habilitado && styles.disabledPosition)}
    >
      <Text className={styles.positionText}>
        {position.fila}
        {position.posicion}
      </Text>
      <CardFooter className={styles.cardFooter}>
        <Tooltip content={position.habilitado ? 'Deshabilitar' : 'Habilitar'} relationship="label">
          <Button
            icon={position.habilitado ? <ToggleLeft24Regular /> : <ToggleRight24Regular />}
            size="small"
            appearance="subtle"
            className={mergeClasses(
              styles.iconButton,
              commonStyles.successButton,
              position.habilitado ? styles.enabledIcon : styles.disabledIcon,
            )}
            onClick={() => onToggleStatus(position)}
            disabled={isAnyMutationPending}
          />
        </Tooltip>
        <Tooltip content="Eliminar" relationship="label">
          <Button
            icon={<Delete24Regular />}
            size="small"
            appearance="subtle"
            className={mergeClasses(styles.iconButton, commonStyles.dangerButton)} // Usar commonStyles
            onClick={() => onDelete(position)}
            disabled={isAnyMutationPending}
          />
        </Tooltip>
      </CardFooter>
    </Card>
  );
};
