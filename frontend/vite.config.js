import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Node 16 polyfill for crypto.getRandomValues
if (typeof crypto === 'undefined' && typeof process !== 'undefined') {
  try {
    const { webcrypto } = await import('node:crypto')
    global.crypto = webcrypto
  } catch (e) {
    console.warn('Failed to load webcrypto polyfill')
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        ws: true
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
