// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Web 100% estática: las páginas se publican en Netlify y la API de cuentas
// vive en netlify/functions/api.ts (misma URL /api/auth/*).
// build.inlineStylesheets: 'never' garantiza CSS externo para una CSP estricta (style-src 'self').
// `site` se configurará cuando exista el dominio público real; no se usan URLs ficticias.
export default defineConfig({
  output: 'static',
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
