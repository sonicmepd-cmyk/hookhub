// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// Web con prerender por defecto + API dinámica /api/auth/* vía adaptador Node.
// build.inlineStylesheets: 'never' garantiza CSS externo para una CSP estricta (style-src 'self').
// `site` se configurará cuando exista el dominio público real; no se usan URLs ficticias.
export default defineConfig({
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  build: {
    inlineStylesheets: 'never',
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // 0 = nunca inlinear chunks de script: todos salen como archivos externos,
      // necesario para una CSP estricta con script-src 'self'.
      assetsInlineLimit: 0,
    },
  },
});
