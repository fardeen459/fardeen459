import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// three/R3F are only pulled in by the lazily-loaded hero scene, so they land in their own async chunk.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1200 },
})
