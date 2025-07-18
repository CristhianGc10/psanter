import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'tone': ['tone'],
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['framer-motion', 'zustand']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['tone', 'zustand', 'framer-motion']
  }
})