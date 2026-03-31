import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/global-exam/',
  server: {
    port: 5173,
  },
});
