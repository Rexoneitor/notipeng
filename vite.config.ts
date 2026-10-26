import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
    manifest: {
      name: 'Notipeng',
      short_name: 'Notipeng',
      description: 'Captura, organiza, planifica y ejecuta. Tu espacio personal en el hielo.',
      lang: 'es',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'any',
      background_color: '#F2F6FA',
      theme_color: '#F2F6FA',
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      shortcuts: [
        { name: 'Capturar', short_name: 'Capturar', url: '/?capturar=1', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        { name: 'Escribir en el diario', short_name: 'Diario', url: '/diario?hoy=1', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        { name: 'Tareas de hoy', short_name: 'Hoy', url: '/tareas', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
      ],
      // Android: "Compartir → Notipeng" envía texto/enlaces a la Bandeja.
      share_target: {
        action: '/capturar',
        method: 'GET',
        params: { title: 'title', text: 'text', url: 'url' },
      },
    } as any,
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}', '**/*-latin-*.woff2'],
      navigateFallback: '/index.html',
      importScripts: ['sw-notify.js'],
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname.endsWith('.woff2'),
          handler: 'CacheFirst',
          options: { cacheName: 'fonts', expiration: { maxEntries: 60 } },
        },
      ],
    },
    devOptions: { enabled: false },
  }),
  ],
});