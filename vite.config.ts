import { defineConfig } from 'vite'

export default defineConfig({
  // Set this to your GitHub repo name for gh-pages deployment
  // e.g. base: '/my-numgame/'
  base: './',
  build: {
    outDir: 'dist',
  },
})
