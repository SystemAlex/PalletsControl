import React from 'react';
import { Badge, BadgeProps, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import {
  CheckmarkCircleColor,
  DismissCircleColor,
  ClockColor,
  ErrorCircleColor,
  ArrowUpFilled,
  ArrowBidirectionalLeftRightFilled,
  ArrowDownFilled,
  AddCircleColor,
} from '@fluentui/react-icons';
import { getMedian } from '../../utils/helper';

const useStyles = makeStyles({
  container: {
    width: '100%',
    height: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    alignContent: 'center',
    alignItems: 'center',
    justifyItems: 'center',
    columnGap: '4px',
  },
  alignSelf: { alignSelf: 'center' },
  brandBack: { background: tokens.colorNeutralBackground1 },
  addPaddingR: { paddingRight: '8px' },
  addPaddingL: { paddingLeft: '8px' },
  lineHeight: { lineHeight: 0 },
});

type IconStatusProps =
  | {
      perc: number;
      num?: never;
      news?: never;
      total: number;
      size: BadgeProps['size'];
      icon?: never;
      value?: never;
      label?: string;
      addPadding?: boolean;
    }
  | {
      num: { antes: number; ahora: number };
      perc?: never;
      news?: never;
      total: number;
      size: BadgeProps['size'];
      icon?: never;
      value?: never;
      label?: never;
      addPadding?: boolean;
    }
  | {
      num?: never;
      perc?: never;
      news: number;
      total: number;
      size: BadgeProps['size'];
      icon?: never;
      value?: never;
      label?: never;
      addPadding?: boolean;
    }
  | {
      num?: never;
      perc?: never;
      news?: never;
      total?: never;
      size?: never;
      icon: React.JSX.Element;
      value: number;
      label?: never;
      addPadding?: boolean;
    };

export const IconStatus = (props: IconStatusProps) => {
  const styles = useStyles();
  const { size, total } = props;
  const showSize = size === 'medium' ? 22 : 32;
  const addPadding = props.addPadding || false;
  // let color: BadgeProps['color'] = 'danger';
  let iconShow = <DismissCircleColor fontSize={showSize} />;
  let value = 0;
  let valueShow = '';

  if (total === 0) {
    // color = 'brand';
    iconShow = <ClockColor fontSize={showSize} />;
  } else if ('perc' in props) {
    value = props.perc || 0;
    if ('label' in props) {
      const currLabel = props.label || '';
      const canalesObjs: Record<string, number> = {
        AUTOSERVICIO: 30.8452544584599,
        'KIOSCO VENTANA': 8.06140269513507,
        'MAXI KIOSCO': 14.9095380047078,
        TRADICIONALES: 10.5862787270917,
      };
      const objLabel =
        canalesObjs[currLabel.toUpperCase()] ?? getMedian(Object.values(canalesObjs));

      const normalized = currLabel.trim().toUpperCase();
      if (['OTROS', 'TERCEROS'].includes(normalized)) {
        iconShow = <></>;
        valueShow = '';
      } else {
        if (value >= objLabel) {
          // color = 'success';
          iconShow = <CheckmarkCircleColor fontSize={showSize} />;
        } else if (value >= objLabel * 0.5) {
          // color = 'warning';
          iconShow = <ErrorCircleColor fontSize={showSize} />;
        }
        valueShow = value.toFixed(2);
      }
    } else {
      if (value >= 0.8) {
        // color = 'success';
        iconShow = <CheckmarkCircleColor fontSize={showSize} />;
      } else if (value >= 0.25) {
        // color = 'warning';
        iconShow = <ErrorCircleColor fontSize={showSize} />;
      }
      valueShow = Math.round(value * 100) + '%';
    }
  } else if ('num' in props) {
    const { antes, ahora } = props.num || { antes: 0, ahora: 0 };
    if (ahora > antes) {
      iconShow = <Badge appearance="filled" color="success" size={size} icon={<ArrowUpFilled />} />;
    } else if (ahora < antes) {
      iconShow = (
        <Badge appearance="filled" color="severe" size={size} icon={<ArrowDownFilled />} />
      );
    } else {
      iconShow = (
        <Badge
          appearance="filled"
          color="warning"
          size={size}
          icon={<ArrowBidirectionalLeftRightFilled />}
        />
      );
    }
    valueShow = ahora > 0 ? ahora + '' : '';
  } else if ('news' in props) {
    value = props.news || 0;
    iconShow = <></>;
    if (value > 0) {
      iconShow = <AddCircleColor fontSize={showSize} />;
      valueShow = value + '';
    }
  } else if ('icon' in props) {
    valueShow = props.value + '' || '';
    iconShow = props.icon || <></>;
  }

  return (
    <div className={styles.container}>
      <span className={mergeClasses(styles.alignSelf, addPadding && styles.addPaddingL)}>
        {valueShow && valueShow}
      </span>
      <span className={mergeClasses(addPadding && styles.addPaddingR, styles.lineHeight)}>
        {iconShow}
      </span>
      {/* <Badge className={styles.alignSelf} icon={icon} color="informative" size={size} /> */}
    </div>
  );
};
