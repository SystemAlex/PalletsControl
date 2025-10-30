/// <reference types="vite-plugin-svgr/client" />

declare module '*.svg?react' {
  import * as React from 'react';

  const SVG: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}

declare module '*.png' {
  const value: string;
  export default value;
}
