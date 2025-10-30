import React, { useLayoutEffect, useRef, useCallback } from 'react';
import { makeStyles, Text, tokens, Button, Tooltip, Card } from '@fluentui/react-components';
import { ArrowCircleUpFilled, ArrowCircleDownFilled } from '@fluentui/react-icons';
import { PalletPositionWithProducts, ProductInPallet } from '../../../../shared/types';
import { PalletProductItem } from './PalletProductItem';
import { ExpirationStatus } from './PalletTableUtils';
import { useCommonStyles } from '../../theme/commonStyles'; // Importar commonStyles

const useStyles = makeStyles({
  positionCard: {
    display: 'flex',
    alignItems: 'stretch',
    justifyItems: 'stretch',
    padding: '0px',
    boxShadow: 'none',
    borderRadius: '0px',
    minWidth: '210px',
    height: '270px',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column-reverse',
    width: '-webkit-fill-available',
    height: '-webkit-fill-available',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  palletContent: {
    display: 'grid',
    gridTemplateRows: '238px 32px',
    boxSizing: 'border-box',
    width: '-webkit-fill-available',
  },
  palletPos: {
    paddingTop: '8px',
  },
  cardFooter: {
    backgroundColor: '#FF8000',
    color: tokens.colorNeutralForegroundOnBrand,
    padding: '0px',
    paddingInline: '6px',
    display: 'grid',
    alignItems: 'center',
    gridTemplateColumns: 'auto 1fr auto',
    justifyContent: 'center',
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase500,
    borderBottomLeftRadius: '0px',
    borderBottomRightRadius: '0px',
  },
  positionText: {
    gridColumnStart: 2,
  },
});

interface PalletPositionCardProps {
  position: PalletPositionWithProducts;
  onAddProduct: (fila: string, posicion: number) => void;
  onRemoveProduct: (fila: string, posicion: number, products: ProductInPallet[]) => void;
  searchQuery: string;
  highlightedProductId: number | null;
  canModify: boolean;
  getExpirationStatus: (dateString: string | null) => ExpirationStatus;
  doesProductMatchSearch: (product: ProductInPallet, query: string) => boolean;
  positionRef: React.RefCallback<HTMLDivElement>;
  productRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>;
  isMobile: boolean;
}

export const PalletPositionCard: React.FC<PalletPositionCardProps> = ({
  position,
  onAddProduct,
  onRemoveProduct,
  searchQuery,
  highlightedProductId,
  canModify,
  getExpirationStatus,
  doesProductMatchSearch,
  positionRef,
  productRefs,
  isMobile,
}) => {
  const styles = useStyles();
  const commonStyles = useCommonStyles(); // Usar commonStyles
  const positionDisplay = `${position.fila}${position.posicion}`;
  const hasPalletProduct = position.products.some((p) => p.pallets === true);
  const isPositionEmpty = position.products.length === 0;

  const localPositionRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const setCombinedPositionRef = useCallback(
    (node: HTMLDivElement | null) => {
      localPositionRef.current = node;
      positionRef(node); // Pass to parent's ref callback

      if (node && !isMobile) {
        node.scrollTop = node.scrollHeight; // Initial scroll

        if (typeof ResizeObserver !== 'undefined' && !observerRef.current) {
          const ro = new ResizeObserver(() => {
            if (localPositionRef.current) {
              localPositionRef.current.scrollTop = localPositionRef.current.scrollHeight;
            }
          });
          ro.observe(node);
          observerRef.current = ro;
        }
      } else {
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      }
    },
    [position.id, position.fila, position.posicion, isMobile, positionRef],
  );

  useLayoutEffect(() => {
    // Cleanup observer on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  return (
    <Card key={position.id} className={styles.positionCard}>
      <div className={styles.palletContent}>
        <div className={styles.palletPos}>
          <div ref={setCombinedPositionRef} className={styles.cardContent}>
            {position.products.length > 0
              ? position.products.map((product, index) => {
                  const isSearchMatch = doesProductMatchSearch(product, searchQuery);
                  const isEarliestMatch = String(product.id) === String(highlightedProductId);
                  const expirationStatus = getExpirationStatus(product.vencimiento);

                  return (
                    <PalletProductItem
                      key={product.id ?? index}
                      product={product}
                      expirationStatus={expirationStatus}
                      isSearchMatch={isSearchMatch}
                      isEarliestMatch={isEarliestMatch}
                      productRef={(el) => {
                        const pkey = `${position.fila}-${position.posicion}-${product.id ?? index}`;
                        if (el) {
                          (el as HTMLDivElement).id = `product-${pkey}`;
                          productRefs.current.set(pkey, el);
                        } else {
                          productRefs.current.delete(pkey);
                        }
                      }}
                    />
                  );
                })
              : undefined}
          </div>
        </div>
        <div className={styles.cardFooter}>
          {canModify && (
            <Tooltip
              content={hasPalletProduct ? 'Posición Completa' : `Subir en ${positionDisplay}`}
              relationship="label"
            >
              <Button
                icon={<ArrowCircleUpFilled />}
                className={commonStyles.successButton}
                shape="circular"
                appearance="subtle"
                onClick={() => onAddProduct(position.fila, position.posicion)}
                disabled={hasPalletProduct}
              />
            </Tooltip>
          )}
          <Text className={styles.positionText} align="center">
            {positionDisplay}
          </Text>
          {canModify && (
            <Tooltip
              content={isPositionEmpty ? 'Nada para Bajar' : `Bajar de ${positionDisplay}`}
              relationship="label"
            >
              <Button
                icon={<ArrowCircleDownFilled />}
                className={commonStyles.dangerButton}
                shape="circular"
                appearance="subtle"
                onClick={() => onRemoveProduct(position.fila, position.posicion, position.products)}
                disabled={isPositionEmpty}
              />
            </Tooltip>
          )}
        </div>
      </div>
    </Card>
  );
};
