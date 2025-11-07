import React from 'react';
import { Text, Tooltip, makeStyles, tokens, mergeClasses } from '@fluentui/react-components';
import { CheckmarkCircle16Filled, Info16Filled } from '@fluentui/react-icons';
import { ProductInPallet } from '../../../../shared/types';
import Pallet from '@/assets/pallet.svg?react';
import { format } from 'date-fns';
import { ExpirationStatus } from './PalletTableUtils';

const useStyles = makeStyles({
  thePallet: { maxWidth: '180px', minHeight: '15px', alignSelf: 'center', justifySelf: 'center' },
  productItem: {
    maxWidth: '180px',
    minWidth: '180px',
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: `color-mix(in srgb, ${tokens.colorPaletteBrownBackground2} 24%, transparent)`,
    border: `1px solid ${tokens.colorPaletteBrownForeground2}`,
    boxSizing: 'border-box',
    padding: '4px',
    scrollMargin: '6px',
    '@media(prefers-color-scheme: dark)': {
      backgroundColor: `color-mix(in srgb, ${tokens.colorPaletteBrownBackground2} 76%, transparent)`,
    },
  },
  isPallet: {
    height: '100%',
  },
  productName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    textAlign: 'center',
  },
  productDetails: {
    fontSize: tokens.fontSizeBase400,
    textAlign: 'center',
  },
  expiredDate: {
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorPaletteBerryBackground1,
    color: tokens.colorPaletteBerryForeground1,
  },
  dangerDate: {
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorStatusDangerBackground1,
    color: tokens.colorStatusDangerForeground1,
  },
  warningDate: {
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorStatusWarningBackground1,
    color: tokens.colorStatusWarningForeground1,
  },
  highlightSearchMatch: {},
  highlightEarliestMatch: {
    outline: `6px solid ${tokens.colorPaletteGreenBackground3}`,
    outlineOffset: '-4px',
  },
});

interface PalletProductItemProps {
  product: ProductInPallet;
  expirationStatus: ExpirationStatus;
  isSearchMatch: boolean;
  isEarliestMatch: boolean;
  productRef: React.RefCallback<HTMLDivElement>;
}

export const PalletProductItem: React.FC<PalletProductItemProps> = ({
  product,
  expirationStatus,
  isSearchMatch,
  isEarliestMatch,
  productRef,
}) => {
  const styles = useStyles();
  let expirationStatusTxt = '';

  let productItemClass = mergeClasses(
    styles.productItem,
    product.pallets ? styles.isPallet : undefined,
  );

  if (expirationStatus === 'expired') {
    expirationStatusTxt = ' VDO';
    productItemClass = mergeClasses(
      styles.productItem,
      styles.expiredDate,
      product.pallets ? styles.isPallet : undefined,
    );
  } else if (expirationStatus === 'danger') {
    expirationStatusTxt = ' <3M';
    productItemClass = mergeClasses(
      styles.productItem,
      styles.dangerDate,
      product.pallets ? styles.isPallet : undefined,
    );
  } else if (expirationStatus === 'warning') {
    expirationStatusTxt = ' <5M';
    productItemClass = mergeClasses(
      styles.productItem,
      styles.warningDate,
      product.pallets ? styles.isPallet : undefined,
    );
  }

  return (
    <>
      <Pallet className={styles.thePallet} />
      <div
        ref={productRef}
        className={mergeClasses(
          productItemClass,
          isSearchMatch ? styles.highlightSearchMatch : undefined,
          isEarliestMatch ? styles.highlightEarliestMatch : undefined,
        )}
      >
        <Text className={styles.productName} block>
          {product.desArticulo} ({product.codigo})
          {product.observaciones && (
            <Tooltip content={product.observaciones} relationship="label">
              <Info16Filled color="#73c2fb" />
            </Tooltip>
          )}
        </Text>
        <Text className={styles.productDetails} block>
          {product.bultos} Bultos {product.pallets && <CheckmarkCircle16Filled color="#0e700e" />}
        </Text>
        <Text className={styles.productDetails} block>
          Vto{' '}
          {product.vencimiento
            ? format(new Date(product.vencimiento + 'T00:00:00'), 'dd/MM/yyyy') +
              expirationStatusTxt
            : 'N/A'}
        </Text>
      </div>
    </>
  );
};
