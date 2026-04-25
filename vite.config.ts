import { defineConfig } from 'vite'

export default defineConfig({
  // force rebuild
  base: './',
  build: {
    outDir: 'dist',
  },
})