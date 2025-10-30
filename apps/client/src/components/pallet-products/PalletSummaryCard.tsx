import React, { useMemo } from 'react';
import { makeStyles, Card, Text, tokens, mergeClasses } from '@fluentui/react-components';
import { PalletPositionWithProducts } from '../../../../shared/types';
import { CheckmarkCircle24Color, DismissCircle24Color } from '@fluentui/react-icons';
import { getExpirationStatus } from './PalletTableUtils';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0px',
    maxHeight: 'fit-content',
    overflowX: 'hidden',
    overflowY: 'auto',
    '@media(max-width: 600px)': {
      gridColumn: 'span 2 / span 2',
      gridColumnStart: 1,
      gridRowStart: 1,
    },
  },
  card: {
    width: '100%',
    paddingInline: '9px',
    paddingTop: '4px',
    paddingBottom: '9px',
    gap: '9px',
    display: 'grid',
    overflowY: 'auto',
    boxShadow: 'none',
    minWidth: 'fit-content',
    backgroundColor: tokens.colorTransparentBackground,
    gridAutoFlow: 'row',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    '&:empty': { display: 'none' },
    '@media(max-width: 600px)': {
      gridAutoFlow: 'column',
      overflowX: 'auto',
      minWidth: 'initial',
    },
  },
  filters: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingInline: '9px',
    marginBottom: '8px',
    '@media(max-width: 600px)': {
      flexDirection: 'row',
    },
    '& > *': {
      minWidth: '189px',
    },
  },
  filterField: {},
  summaryItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    minHeight: '60px',
    minWidth: '140px',
    padding: '8px',
    cursor: 'pointer',
    position: 'relative',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground4,
    },
  },
  label: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
  },
  applied: { position: 'absolute', bottom: '4px', right: '4px' },
  value: { fontSize: tokens.fontSizeBase500, fontWeight: tokens.fontWeightSemibold },
  danger: {
    backgroundColor: tokens.colorStatusDangerBackground1,
    color: tokens.colorStatusDangerForeground1,
    '&:hover': {
      backgroundColor: tokens.colorStatusDangerBackground2,
      color: tokens.colorStatusDangerForeground2,
    },
  },
  warning: {
    backgroundColor: tokens.colorStatusWarningBackground1,
    color: tokens.colorStatusWarningForeground1,
    '&:hover': {
      backgroundColor: tokens.colorStatusWarningBackground2,
      color: tokens.colorStatusWarningForeground2,
    },
  },
  expired: {
    backgroundColor: tokens.colorPaletteBerryBackground1,
    color: tokens.colorPaletteBerryForeground1,
    '&:hover': {
      backgroundColor: tokens.colorPaletteBerryBackground2,
      color: tokens.colorPaletteBerryForeground2,
    },
  },
  selected: {
    boxShadow: tokens.shadow8,
  },
  clearButton: {
    minWidth: '140px',
    height: '60px',
    padding: '8px',
    alignSelf: 'center',
    justifySelf: 'center',
  },
});

interface PalletSummaryCardProps {
  data: PalletPositionWithProducts[];
  onFilterClick: (filterType: 'expired' | '3months' | '5months' | 'normal' | null) => void;
  activeFilter: 'expired' | '3months' | '5months' | 'normal' | null;
  isAnyFilterActive: boolean;
  onClearAllFilters: () => void;
}

export const PalletSummaryCard: React.FC<PalletSummaryCardProps> = ({
  data,
  onFilterClick,
  activeFilter,
  isAnyFilterActive,
  onClearAllFilters,
}) => {
  const styles = useStyles();

  const summary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalPositions = data.length;
    let occupiedPositions = 0;
    let totalBultos = 0;
    let totalPallets = 0;

    let bultosExpired = 0;
    let palletsExpired = 0;
    let bultos3Months = 0;
    let pallets3Months = 0;
    let bultos5Months = 0;
    let pallets5Months = 0;
    let bultosNormal = 0;
    let palletsNormal = 0;

    data.forEach((position) => {
      if (position.products.length > 0) {
        occupiedPositions++;
        position.products.forEach((product) => {
          totalBultos += product.bultos;
          if (product.pallets) {
            totalPallets++;
          }

          // Calculate expiration summary
          if (product.vencimiento) {
            try {
              const status = getExpirationStatus(product.vencimiento, today);

              if (status === 'expired') {
                bultosExpired += product.bultos;
                if (product.pallets) palletsExpired++;
              } else if (status === 'danger') {
                bultos3Months += product.bultos;
                if (product.pallets) pallets3Months++;
              } else if (status === 'warning') {
                bultos5Months += product.bultos;
                if (product.pallets) pallets5Months++;
              } else {
                bultosNormal += product.bultos;
                if (product.pallets) palletsNormal++;
              }
            } catch (e) {
              console.error('Invalid date format:', product.vencimiento, e);
            }
          } else {
            bultosNormal += product.bultos;
            if (product.pallets) palletsNormal++;
          }
        });
      }
    });

    return {
      totalPositions,
      occupiedPositions,
      totalBultos,
      totalPallets,
      bultosExpired,
      palletsExpired,
      bultos3Months,
      pallets3Months,
      bultos5Months,
      pallets5Months,
      bultosNormal,
      palletsNormal,
    };
  }, [data]);

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        {(summary.bultosNormal !== 0 || summary.palletsNormal !== 0) && (
          <Card
            className={mergeClasses(
              styles.summaryItem,
              activeFilter === 'normal' && styles.selected,
            )}
            onClick={() => onFilterClick('normal')}
            appearance="filled"
          >
            <Text className={styles.label}>Bultos / Pallets Normal</Text>
            <Text className={styles.value}>
              {summary.bultosNormal.toLocaleString()} / {summary.palletsNormal.toLocaleString()}
            </Text>
            {activeFilter === 'normal' && <CheckmarkCircle24Color className={styles.applied} />}
          </Card>
        )}
        {(summary.bultos5Months !== 0 || summary.pallets5Months !== 0) && (
          <Card
            className={mergeClasses(
              styles.summaryItem,
              styles.warning,
              activeFilter === '5months' && styles.selected,
            )}
            onClick={() => onFilterClick('5months')}
            appearance="filled"
          >
            <Text className={styles.label}>Bultos / Pallets &lt; 5 Meses</Text>
            <Text className={styles.value}>
              {summary.bultos5Months.toLocaleString()} / {summary.pallets5Months.toLocaleString()}
            </Text>
            {activeFilter === '5months' && <CheckmarkCircle24Color className={styles.applied} />}
          </Card>
        )}
        {(summary.bultos3Months !== 0 || summary.pallets3Months !== 0) && (
          <Card
            className={mergeClasses(
              styles.summaryItem,
              styles.danger,
              activeFilter === '3months' && styles.selected,
            )}
            onClick={() => onFilterClick('3months')}
            appearance="filled"
          >
            <Text className={styles.label}>Bultos / Pallets &lt; 3 Meses</Text>
            <Text className={styles.value}>
              {summary.bultos3Months.toLocaleString()} / {summary.pallets3Months.toLocaleString()}
            </Text>
            {activeFilter === '3months' && <CheckmarkCircle24Color className={styles.applied} />}
          </Card>
        )}
        {(summary.bultosExpired !== 0 || summary.palletsExpired !== 0) && (
          <Card
            className={mergeClasses(
              styles.summaryItem,
              styles.expired,
              activeFilter === 'expired' && styles.selected,
            )}
            onClick={() => onFilterClick('expired')}
            appearance="filled"
          >
            <Text className={styles.label}>Bultos / Pallets Vencidos</Text>
            <Text className={styles.value}>
              {summary.bultosExpired.toLocaleString()} / {summary.palletsExpired.toLocaleString()}
            </Text>
            {activeFilter === 'expired' && <CheckmarkCircle24Color className={styles.applied} />}
          </Card>
        )}
        {(summary.totalBultos !== 0 || summary.totalPallets !== 0) && (
          <Card className={styles.summaryItem} onClick={onClearAllFilters} appearance="filled">
            <Text className={styles.label}>Total Bultos / Pallets</Text>
            <Text className={styles.value}>
              {summary.totalBultos.toLocaleString()} / {summary.totalPallets.toLocaleString()}
            </Text>
            {isAnyFilterActive && <DismissCircle24Color className={styles.applied} />}
          </Card>
        )}
        {summary.occupiedPositions !== 0 && (
          <Card className={styles.summaryItem} onClick={onClearAllFilters} appearance="filled">
            <Text className={styles.label}>Posiciones Ocupadas</Text>
            <Text className={styles.value}>{summary.occupiedPositions.toLocaleString()}</Text>
            {isAnyFilterActive && <DismissCircle24Color className={styles.applied} />}
          </Card>
        )}
        {summary.totalPositions !== 0 && (
          <Card className={styles.summaryItem} onClick={onClearAllFilters} appearance="filled">
            <Text className={styles.label}>Total Posiciones</Text>
            <Text className={styles.value}>{summary.totalPositions.toLocaleString()}</Text>
            {isAnyFilterActive && <DismissCircle24Color className={styles.applied} />}
          </Card>
        )}
      </Card>
    </div>
  );
};
