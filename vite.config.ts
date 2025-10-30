import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [svgr(), react()],
  root: path.resolve(__dirname, 'apps/client'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/client/src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/apps/client'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react';
            }
            if (id.includes('@fluentui')) {
              return 'fluentui';
            }
            if (id.includes('date-fns')) {
              return 'date-fns';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            if (id.includes('zod')) {
              return 'zod';
            }
            // fallback: resto de dependencias
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    allowedHosts: ['palletsweb.serveo.net'],
  },
});
