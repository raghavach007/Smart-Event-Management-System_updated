// File: suh/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    host: true,
    proxy: {
      // This catches any request starting with /api and routes it to your backend
      '/api': {
        target: 'http://192.168.29.223:5000', 
        changeOrigin: true,
        secure: false // This ignores the fact that your backend isn't HTTPS
      }
    }
  }
})