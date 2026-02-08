import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['baby.webp', 'hoawa*.mp3', 'icon-512.png'],
      manifest: {
        name: '好哇！',
        short_name: '好哇',
        description: '好哇互動按鈕 - 點擊獲得驚喜',
        theme_color: '#ff8a5c',
        background_color: '#ffb6c1',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/hoawa/',  // GitHub repo 名稱
})
