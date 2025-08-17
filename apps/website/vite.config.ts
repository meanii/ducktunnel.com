import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'ducktunnel.com 🦆',
        short_name: 'A simple, private, and secure P2P voice chat application for friends and family. 🦆',
        description: 'A simple, private, and secure P2P voice chat application for friends and family. 🦆',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: !isProduction
    ? {
      https: {
        key: fs.readFileSync(path.resolve((process.env.CERTS_DIR ?? __dirname), 'localhost-key.pem')),
        cert: fs.readFileSync(path.resolve((process.env.CERTS_DIR ?? __dirname), 'localhost.pem')),
      },
      host: '0.0.0.0',
    }
    : undefined,
})