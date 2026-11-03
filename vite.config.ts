import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import { createPhoneAuthMiddleware } from './src/server/phoneAuthMiddleware.ts';

function phoneAuthApiPlugin(): Plugin {
  return {
    name: 'phone-auth-api-plugin',
    configureServer(server) {
      server.middlewares.use(createPhoneAuthMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createPhoneAuthMiddleware());
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), phoneAuthApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio.
      hmr: false,
      watch: null,
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
  };
});
