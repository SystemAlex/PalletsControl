import React, { useEffect, useState } from 'react';
import {
  makeStyles,
  Spinner,
  mergeClasses,
  tokens,
  SpinnerProps,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  spinnerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '-webkit-fill-available',
    width: '-webkit-fill-available',
    paddingInline: tokens.spacingHorizontalL,
    paddingBlock: tokens.spacingVerticalL,
  },
});

export const SpinnerCustom = ({
  text,
  className,
  size = 'medium',
}: {
  text?: string;
  className?: string;
  size?: SpinnerProps['size'];
}) => {
  const styles = useStyles();
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev < 3 ? prev + 1 : 1));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const dots = '.'.repeat(dotCount);
  const label = text ? `${text}${dots}` : undefined;

  return (
    <div className={mergeClasses(styles.spinnerContainer, className)}>
      <Spinner label={label} size={size} />
    </div>
  );
};
