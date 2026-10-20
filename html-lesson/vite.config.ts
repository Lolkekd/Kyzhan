import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base: './' + singlefile: собранный dist/index.html открывается даже двойным кликом (без сервера).
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
});
