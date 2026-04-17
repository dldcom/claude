import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
  server: {
    port: 5173,
    host: true,
  },
  assetsInclude: ['**/*.yaml'],
});
