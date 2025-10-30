import React from 'react';
import {
  TableRow,
  TableCell,
  Text,
  Tooltip,
  Button,
  mergeClasses,
} from '@fluentui/react-components';
import {
  ArrowCircleDownFilled,
  ArrowCircleUpFilled,
  CheckmarkCircle16Filled,
  Info16Filled,
} from '@fluentui/react-icons';
import { format } from 'date-fns';
import { PositionGroup, ExpirationStatus } from './PalletTableUtils';
import { PalletProductTableStyles } from './PalletProductTable';
import { ProductInPallet } from '../../../../shared/types';
import { useCommonStyles } from '../../theme/commonStyles'; // Importar useCommonStyles para el tipo

interface PalletTableRowProps {
  positionGroup: PositionGroup;
  styles: PalletProductTableStyles;
  commonStyles: ReturnType<typeof useCommonStyles>; // Nuevo prop para commonStyles
  today: Date;
  canModify: boolean;
  onAddProduct: (fila: string, posicion: number) => void;
  onRemoveProduct: (fila: string, posicion: number, products: ProductInPallet[]) => void;
  highlightedProductId: number | null;
  searchQuery: string;
  doesProductMatchSearch: (product: ProductInPallet, query: string) => boolean;
  getExpirationStatus: (dateString: string | null, today: Date) => ExpirationStatus;
  isFirstFilaRow: boolean;
  columnsLength: number;
  productRowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement | null>>;
}

export const PalletTableRow: React.FC<PalletTableRowProps> = ({
  positionGroup,
  styles,
  commonStyles, // Desestructurar commonStyles
  today,
  canModify,
  onAddProduct,
  onRemoveProduct,
  highlightedProductId,
  searchQuery,
  doesProductMatchSearch,
  getExpirationStatus,
  isFirstFilaRow,
  productRowRefs,
}) => {
  const { products, originalPositionData } = positionGroup;
  const position = products[0];
  const positionDisplay = position.positionDisplay;
  const hasPalletProduct = originalPositionData.products.some((p) => p.pallets === true);

  // Use original products for removal dialog, as they contain the full list before filtering/sorting
  const productsInOriginalPosition = originalPositionData.products || [];
  const isPositionEmpty = productsInOriginalPosition.length === 0;

  return (
    <React.Fragment key={positionGroup.positionKey}>
      {products.map((product, index) => {
        const isFirstProductInPosition = index === 0;

        const selectProductRowClass = isFirstProductInPosition
          ? styles.productRow
          : styles.productRow2;
        let productRowClass = selectProductRowClass;
        const expirationStatus = getExpirationStatus(product.vencimiento, today);
        let expirationStatusTxt = '';

        if (expirationStatus === 'expired') {
          expirationStatusTxt = ' VDO';
          productRowClass = mergeClasses(selectProductRowClass, styles.expiredDate);
        } else if (expirationStatus === 'danger') {
          expirationStatusTxt = ' <3M';
          productRowClass = mergeClasses(selectProductRowClass, styles.dangerDate);
        } else if (expirationStatus === 'warning') {
          expirationStatusTxt = ' <5M';
          productRowClass = mergeClasses(selectProductRowClass, styles.warningDate);
        }

        return (
          <TableRow
            key={product.id}
            ref={(el) => {
              const pkey = `${position.fila}-${position.posicion}-${product.id}`;
              if (el) {
                (el as HTMLTableRowElement).id = `product-${pkey}`;
                productRowRefs.current.set(pkey, el as HTMLTableRowElement);
              } else {
                productRowRefs.current.delete(pkey);
              }
            }}
            className={mergeClasses(
              productRowClass,
              doesProductMatchSearch(product, searchQuery)
                ? styles.highlightSearchMatch
                : undefined,
              String(product.id) === String(highlightedProductId)
                ? styles.highlightEarliestMatch
                : undefined,
            )}
          >
            {/* POSICION CELL (Column 0) - Only render for the first row in the group */}
            {isFirstProductInPosition && (
              <TableCell
                rowSpan={products.length}
                className={mergeClasses(styles.positionCell, styles.filaLabel)}
                {...(isFirstFilaRow ? { id: `fila-${position.fila}` } : {})}
              >
                <div className={styles.positionButtonContent}>
                  {canModify && (
                    <Tooltip
                      content={
                        hasPalletProduct ? 'Posición Completa' : `Subir en ${positionDisplay}`
                      }
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
                        onClick={() =>
                          onRemoveProduct(
                            position.fila,
                            position.posicion,
                            productsInOriginalPosition,
                          )
                        }
                        disabled={isPositionEmpty}
                      />
                    </Tooltip>
                  )}
                </div>
              </TableCell>
            )}

            {/* PRODUCTO CELL (Column 1) */}
            <TableCell className={styles.productCell}>
              {product.desArticulo} ({product.codigo})
            </TableCell>

            {/* BULTOS CELL (Column 2) */}
            <TableCell className={styles.numericCell}>{product.bultos}</TableCell>

            {/* PALET CELL (Column 3) */}
            <TableCell className={styles.checkboxCell}>
              {product.pallets && <CheckmarkCircle16Filled color="#0e700e" />}
            </TableCell>

            {/* VENCIMIENTO CELL (Column 4) */}
            <TableCell className={styles.numericCell}>
              {product.vencimiento
                ? format(product.vencimientoDate!, 'dd/MM/yyyy') + expirationStatusTxt
                : ''}
            </TableCell>

            {/* OBS CELL (Column 5) */}
            <TableCell className={styles.checkboxCell}>
              {product.observaciones && (
                <Tooltip content={product.observaciones} relationship="label">
                  <Info16Filled color="#73c2fb" />
                </Tooltip>
              )}
            </TableCell>
          </TableRow>
        );
      })}
    </React.Fragment>
  );
};
