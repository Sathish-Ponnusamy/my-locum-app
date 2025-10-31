import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // This 'base' property tells Vite to prefix all asset paths
  // (like /assets/index.js) with the repository name.
  // This is the correct fix for the 404 errors on GitHub Pages.
  base: '/my-locum-app/',
  plugins: [react()],
})
