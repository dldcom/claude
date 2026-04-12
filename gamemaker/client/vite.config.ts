import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true,
    // Pixel-art friendly: disable image optimization that could blur pixel art
    assetsInlineLimit: 0,
  },
  // Pixel-art: prevent CSS from blurring scaled images
  css: {
    devSourcemap: true,
  },
})
