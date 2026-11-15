import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// Installable PWA: parents and drivers "Add to Home Screen" from the browser. No app store needed for the pilot.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { importScripts: ['push-handler.js'] },
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Ashwa',
        short_name: 'Ashwa',
        description: 'Know where your child’s school van is.',
        theme_color: '#0f766e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
