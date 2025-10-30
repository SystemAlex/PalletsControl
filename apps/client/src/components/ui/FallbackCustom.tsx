import React from 'react';
import { makeStyles, Spinner } from '@fluentui/react-components';

const useStyles = makeStyles({
  fallbackContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
});

export const FallbackCustom = ({ text }: { text?: string }) => {
  const styles = useStyles();

  return (
    <div className={styles.fallbackContainer}>
      <Spinner label={text && `${text}...`} />
    </div>
  );
};
