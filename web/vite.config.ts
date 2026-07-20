import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const forElectron = Boolean(process.env.ELECTRON);

export default defineConfig({
  plugins: [react()],
  base: forElectron ? './' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
