import React from 'react';
import { makeStyles } from '@fluentui/react-components';
import LogoSvg from '@/assets/logo.svg?react';

const useStyles = makeStyles({
  root: {
    height: '32px',
    width: 'auto',
    display: 'inline-block',
    fill: 'currentColor',
  },
});

interface LogoProps {
  className?: string;
  color?: string;
  size?: number;
}

export default function Logo({ className, color = 'inherit', size = 32 }: LogoProps) {
  const styles = useStyles();

  return (
    <LogoSvg
      className={className ?? styles.root}
      style={{ height: size, fill: color }}
      role="img"
      aria-label="Logo"
    />
  );
}
