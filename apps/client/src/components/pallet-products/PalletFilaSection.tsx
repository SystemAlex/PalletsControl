import React, { useMemo } from 'react';
import { makeStyles, Title3, mergeClasses, Card, tokens } from '@fluentui/react-components';
import { PalletPositionWithProducts, ProductInPallet } from '../../../../shared/types';
import { PalletPositionCard } from './PalletPositionCard';
import { useMainLayoutContext } from '../../layouts/MainLayout';

const useStyles = makeStyles({
  gridFilaHeader: {
    backgroundColor: tokens.colorBrandBackground3Static,
    color: tokens.colorNeutralForegroundOnBrand,
    padding: '8px 16px',
    borderRadius: '0px',
    position: 'sticky',
    top: '0px',
    zIndex: 1,
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase400,
    lineHeight: '32px',
  },
  gridFilaContainer: {
    flexDirection: 'column',
    gap: '0px',
    scrollMarginTop: '54px',
    minHeight: '550px',
    overflowX: 'auto',
    marginInline: '6px',
    padding: '0px',
    borderTopRightRadius: '0px',
    borderTopLeftRadius: '0px',
    boxShadow: tokens.shadow2,
  },
  columns: {
    display: 'flex',
    '& > *:nth-child(even)': {
      borderRightWidth: '2px',
      borderRightStyle: 'solid',
      borderRightColor: '#1200FB',
      '& > *:first-child': {
        '& > *:first-child': {
          borderRightWidth: '4px',
          borderRightStyle: 'solid',
          borderRightColor: '#1200FB',
        },
      },
    },
    '& > *:nth-child(odd)': {
      borderLeftWidth: '2px',
      borderLeftStyle: 'solid',
      borderLeftColor: '#1200FB',
      '& > *:first-child': {
        '& > *:first-child': {
          borderLeftWidth: '4px',
          borderLeftStyle: 'solid',
          borderLeftColor: '#1200FB',
        },
      },
    },
    '& > *:first-child': {
      borderLeftWidth: '6px',
      borderLeftStyle: 'solid',
      borderLeftColor: '#1200FB',
    },
    '& > *:last-child': {
      borderRightWidth: '6px',
      borderRightStyle: 'solid',
      borderRightColor: '#1200FB',
      '& > *:first-child': {
        '& > *:first-child': {
          borderRightWidth: '4px',
          borderRightStyle: 'solid',
          borderRightColor: '#1200FB',
        },
      },
    },
  },
});

interface PalletFilaSectionProps {
  fila: string;
  positionsInFila: PalletPositionWithProducts[];
  onAddProduct: (fila: string, posicion: number) => void;
  onRemoveProduct: (fila: string, posicion: number, products: ProductInPallet[]) => void;
  searchQuery: string;
  highlightedProductId: number | null;
  canModify: boolean;
  getExpirationStatus: (dateString: string | null) => 'danger' | 'warning' | 'normal' | 'expired';
  doesProductMatchSearch: (product: ProductInPallet, query: string) => boolean;
  positionRefs: React.MutableRefObject<Map<string | number, HTMLDivElement | null>>;
  productRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>;
}

export const PalletFilaSection: React.FC<PalletFilaSectionProps> = ({
  fila,
  positionsInFila,
  onAddProduct,
  onRemoveProduct,
  searchQuery,
  highlightedProductId,
  canModify,
  getExpirationStatus,
  doesProductMatchSearch,
  positionRefs,
  productRefs,
}) => {
  const styles = useStyles();
  const { isMobile } = useMainLayoutContext();

  const sortedPositions = useMemo(() => {
    return [...positionsInFila].sort((a, b) => a.posicion - b.posicion);
  }, [positionsInFila]);

  const column1Positions: PalletPositionWithProducts[] = [];
  const column2Positions: PalletPositionWithProducts[] = [];
  sortedPositions.forEach((position, index) => {
    if (index % 2 === 0) {
      column1Positions.push(position);
    } else {
      column2Positions.push(position);
    }
  });

  return (
    <>
      <Title3 className={mergeClasses(styles.gridFilaHeader)}>FILA {fila}</Title3>
      <Card className={styles.gridFilaContainer} id={`fila-${fila}`}>
        <div className={styles.columns}>
          {column1Positions.map((position) => (
            <PalletPositionCard
              key={position.id}
              position={position}
              onAddProduct={onAddProduct}
              onRemoveProduct={onRemoveProduct}
              searchQuery={searchQuery}
              highlightedProductId={highlightedProductId}
              canModify={canModify}
              getExpirationStatus={getExpirationStatus}
              doesProductMatchSearch={doesProductMatchSearch}
              positionRef={(node) => {
                const key = position.id ?? `${position.fila}-${position.posicion}`;
                positionRefs.current.set(key, node);
              }}
              productRefs={productRefs}
              isMobile={isMobile}
            />
          ))}
        </div>
        <div className={styles.columns}>
          {column2Positions.map((position) => (
            <PalletPositionCard
              key={position.id}
              position={position}
              onAddProduct={onAddProduct}
              onRemoveProduct={onRemoveProduct}
              searchQuery={searchQuery}
              highlightedProductId={highlightedProductId}
              canModify={canModify}
              getExpirationStatus={getExpirationStatus}
              doesProductMatchSearch={doesProductMatchSearch}
              positionRef={(node) => {
                const key = position.id ?? `${position.fila}-${position.posicion}`;
                positionRefs.current.set(key, node);
              }}
              productRefs={productRefs}
              isMobile={isMobile}
            />
          ))}
        </div>
      </Card>
    </>
  );
};
