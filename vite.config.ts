import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Burger Master Pro',
          short_name: 'BurgerMaster',
          description: 'Calculadora Técnica de Blends Profissionais',
          theme_color: '#1c1917',
          icons: [
            {
              src: 'https://cdn-icons-png.flaticon.com/512/5787/5787016.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://cdn-icons-png.flaticon.com/512/5787/5787016.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
