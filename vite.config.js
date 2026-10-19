import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // relative assets so the build works under any GitHub Pages sub-path
  base: './',
  plugins: [
    react(),
    tailwindcss()
  ],
})
