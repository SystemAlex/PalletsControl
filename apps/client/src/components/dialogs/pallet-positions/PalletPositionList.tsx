import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Text,
  makeStyles,
  tokens,
  TabList,
  Tab,
  Button,
  Tooltip,
  Field,
  Input,
} from '@fluentui/react-components';
import { PalletPositionRecord } from '../../../../../shared/types';
import { SpinnerCustom } from '../../ui/SpinnerCustom';
import { PalletPositionItem } from './PalletPositionItem';
import { SelectTabEvent, SelectTabData } from '@fluentui/react-components';
import {
  AddSquareFilled,
  AddSquareRegular,
  bundleIcon,
  SaveFilled,
  SaveRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    gap: '8px',
    height: '52vh',
    maxHeight: '52vh',
    minWidth: '100%',
    '@media(max-width: 768px)': {
      flexDirection: 'column',
    },
  },
  tabListContainer: {
    overflowY: 'auto',
    overflowX: 'hidden',
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    '@media(max-width: 768px)': {
      width: '100%',
      borderRight: 'none',
      borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
      overflowX: 'auto',
      overflowY: 'hidden',
    },
  },
  tabList: {},
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', // Centrar texto horizontalmente
    justifyContent: 'center', // Centrar texto verticalmente
    height: '48px',
    width: '42px',
    padding: '0 4px', // Ajustar padding según sea necesario
  },
  addButton: { minWidth: '74px', maxWidth: '74px', minHeight: '60px' },
  saveButton: { minWidth: '100%', padding: '0px' },
  fieldContent: { gridAutoColumns: '74px', height: '60px', maxWidth: '74px' },
  center: { '& *': { textAlign: 'center' } },
  positionsGrid: {
    flexGrow: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 84px)',
    gridAutoRows: '120px',
    gap: '3px',
    overflowY: 'auto',
    padding: '4px',
    '@media(max-width: 768px)': {
      height: '295px',
    },
  },
});

interface PalletPositionListProps {
  positions: PalletPositionRecord[] | undefined;
  isLoading: boolean;
  error: Error | null | undefined;
  onToggleStatus: (position: PalletPositionRecord) => void;
  onDelete: (position: PalletPositionRecord) => void;
  isAnyMutationPending: boolean;
  onCreateNextPosition: (fila: string, nextPosicion: number) => void;
  isMobile: boolean; // Nueva prop
}

export const PalletPositionList: React.FC<PalletPositionListProps> = ({
  positions,
  isLoading,
  error,
  onToggleStatus,
  onDelete,
  isAnyMutationPending,
  onCreateNextPosition,
  isMobile, // Desestructurar nueva prop
}) => {
  const styles = useStyles();
  const AddNew = bundleIcon(AddSquareFilled, AddSquareRegular);
  const Save = bundleIcon(SaveFilled, SaveRegular);
  const [add, setAdd] = useState(false);
  const [newFilaInput, setNewFilaInput] = useState('');
  const [newFilaError, setNewFilaError] = useState<string | undefined>(undefined);
  const inputRef = React.useRef<HTMLInputElement>(null); // Ref para el input

  const groupedPositions = useMemo(() => {
    const map = new Map<string, PalletPositionRecord[]>();
    positions?.forEach((pos) => {
      if (!map.has(pos.fila)) {
        map.set(pos.fila, []);
      }
      map.get(pos.fila)?.push(pos);
    });
    map.forEach((posArray) => {
      posArray.sort((a, b) => a.posicion - b.posicion);
    });
    return Array.from(map.entries()).sort(([filaA], [filaB]) => filaA.localeCompare(filaB));
  }, [positions]);

  const tabs = useMemo(() => {
    return groupedPositions.map(([fila]) => ({ id: fila, name: `FILA ${fila}` }));
  }, [groupedPositions]);

  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);

  useEffect(() => {
    if (tabs.length > 0 && !selectedTabId) {
      setSelectedTabId(tabs[0].id);
    } else if (tabs.length === 0) {
      setSelectedTabId(null);
    }
  }, [tabs, selectedTabId]);

  const currentFilaPositions = useMemo(() => {
    if (!selectedTabId) return [];
    return groupedPositions.find(([fila]) => fila === selectedTabId)?.[1] || [];
  }, [selectedTabId, groupedPositions]);

  const nextPosicion = useMemo(() => {
    if (!currentFilaPositions.length) return 1;

    const maxPosicion = currentFilaPositions.reduce((max, pos) => Math.max(max, pos.posicion), 0);

    // Increment by 1.00 and ensure it's rounded to 2 decimals
    const next = maxPosicion + 1;
    return parseFloat(next.toFixed(2));
  }, [currentFilaPositions]);

  const handleCreateNext = useCallback(() => {
    if (selectedTabId) {
      onCreateNextPosition(selectedTabId, nextPosicion);
    }
  }, [selectedTabId, nextPosicion, onCreateNextPosition]);

  const onTabSelect = useCallback((event: SelectTabEvent, data: SelectTabData) => {
    setSelectedTabId(data.value as string);
  }, []);

  const validateNewFila = useCallback(
    (value: string) => {
      const trimmedValue = value.trim().toUpperCase();
      if (!trimmedValue) {
        setNewFilaError('La fila es obligatoria.');
        return false;
      }
      if (trimmedValue.length > 2) {
        setNewFilaError('La fila no puede tener más de 2 caracteres.');
        return false;
      }
      if (groupedPositions.some(([fila]) => fila === trimmedValue)) {
        setNewFilaError(`La fila ${trimmedValue} ya existe.`);
        return false;
      }
      setNewFilaError(undefined);
      return true;
    },
    [groupedPositions],
  );

  const handleSaveNewFila = useCallback(() => {
    const fila = newFilaInput.trim().toUpperCase();
    if (validateNewFila(fila)) {
      // When adding a new fila, the position must be 1
      onCreateNextPosition(fila, 1);
      setNewFilaInput('');
      setNewFilaError(undefined);
      setAdd(false); // Close the input field
    }
  }, [newFilaInput, validateNewFila, onCreateNextPosition]);

  const handleNewFilaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setNewFilaInput(value);
    if (newFilaError) {
      validateNewFila(value); // Re-validate on change if an error is already visible
    }
  };

  const handleAddButtonClick = () => {
    setAdd((prev) => !prev);
    setNewFilaInput('');
    setNewFilaError(undefined);
    // Enfocar el input si se abre
    if (!add) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleInputBlur = () => {
    // Si el input pierde el foco y no está vacío, no hacemos nada (esperamos a que el usuario guarde o haga clic en otro lado)
    // Si el input está vacío, o si hay un error, o si simplemente queremos que se cierre al perder el foco:
    if (newFilaInput.trim() === '' || newFilaError) {
      setAdd(false);
      setNewFilaInput('');
      setNewFilaError(undefined);
    }
  };

  if (isLoading) {
    return <SpinnerCustom text="Cargando posiciones..." />;
  }
  if (error) {
    return <Text color="danger">Error: {(error as Error).message}</Text>;
  }

  return (
    <div className={styles.dialogContent}>
      <div className={styles.tabListContainer}>
        <TabList
          vertical={!isMobile}
          selectedValue={selectedTabId}
          onTabSelect={onTabSelect}
          appearance="subtle"
          className={styles.tabList}
        >
          {!add ? (
            <Tooltip content={'Agregar Fila'} relationship="label">
              <Button
                appearance="subtle"
                icon={<AddNew />}
                className={styles.addButton}
                onClick={handleAddButtonClick}
              />
            </Tooltip>
          ) : (
            <Field
              label={
                <Tooltip content={'Grabar Fila'} relationship="label">
                  <Button
                    appearance="primary"
                    icon={<Save />}
                    iconPosition="after"
                    className={styles.saveButton}
                    onClick={handleSaveNewFila}
                    disabled={isAnyMutationPending || !!newFilaError || !newFilaInput.trim()}
                  >
                    FILA
                  </Button>
                </Tooltip>
              }
              className={styles.fieldContent}
              validationMessage={newFilaError}
              validationState={newFilaError ? 'error' : undefined}
            >
              <Input
                ref={inputRef}
                maxLength={2}
                className={styles.center}
                value={newFilaInput}
                onChange={handleNewFilaInputChange}
                onBlur={handleInputBlur}
                disabled={isAnyMutationPending}
              />
            </Field>
          )}
          {tabs.map((tab) => (
            <Tab key={tab.id} value={tab.id}>
              <div className={styles.tabContent}>
                <Text>FILA</Text>
                <Text>{tab.id}</Text>
              </div>
            </Tab>
          ))}
        </TabList>
      </div>

      <div className={styles.positionsGrid}>
        {currentFilaPositions.length > 0 && (
          <>
            {currentFilaPositions.map((pos) => (
              <PalletPositionItem
                key={pos.id}
                position={pos}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
                isAnyMutationPending={isAnyMutationPending}
                new={false}
              />
            ))}
            <PalletPositionItem
              key="new-position-card"
              new={true}
              nextPosicion={nextPosicion}
              currentFila={selectedTabId}
              onCreateNext={handleCreateNext}
              isAnyMutationPending={isAnyMutationPending}
            />
          </>
        )}
      </div>
    </div>
  );
};
