import { defineMiddleware } from 'astro:middleware';

/**
 * Cabeceras de seguridad en todas las respuestas del servidor Node
 * (el archivo _headers solo lo aplican Netlify/Cloudflare Pages).
 * La CSP completa se aplica solo en producción: en dev, Astro inyecta
 * estilos inline que la romperían.
 */
const CSP =
  "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; img-src 'self'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'";

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  if (import.meta.env.PROD) {
    response.headers.set('Content-Security-Policy', CSP);
  }
  return response;
});
