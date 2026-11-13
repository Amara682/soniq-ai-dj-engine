
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  preview: {
    allowedHosts: [
      'melodious-victory-production-4b561865.up.railway.app'
    ],
    host: '0.0.0.0'
  }
});
