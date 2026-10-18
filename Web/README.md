# HookHub — Web oficial

Sitio público de presentación y descarga de HookHub. Las páginas son **estáticas** (pre-renderizadas) y se sirven con un servidor Node que además expone la **API de cuentas** (`/api/auth/*`): registro con nombre de usuario y código de verificación por correo, inicio de sesión (con opción de código en cada acceso), ajustes de cuenta y eliminación de cuenta. No incluye la aplicación ni las funciones internas de HookHub AI.

## Requisitos

- Node.js 22.12 o superior (probado con Node 22.14)
- npm 10 o superior

## Instalación y desarrollo

```bash
cd Web
npm install
npm run dev        # servidor de desarrollo con API (http://localhost:4321)
```

## Verificación y compilación

```bash
npx tsc --noEmit   # comprobación de tipos
npm run build      # compilación a dist/ (páginas en dist/client, servidor en dist/server)
npm start          # sirve dist/ + API con el servidor Node (por defecto en el puerto 4321)
npm run preview    # alternativa de revisión del adaptador Node
```

Variables opcionales en `.env` (hay una plantilla en `.env.example`):

- `MAIL_MODE=console` (por defecto): los códigos de verificación se imprimen en la consola del servidor.
- `MAIL_MODE=smtp` con `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` y `MAIL_FROM`: correos reales vía nodemailer.
- `DB_PATH`: ruta del archivo SQLite (por defecto `Web/data/hookhub.sqlite`).

## Cuentas y autenticación

Flujos reales (nada de éxitos simulados):

1. **Registro**: nombre de usuario + correo + contraseña → se crea la cuenta pendiente y se envía un código de 6 dígitos (caduca en 15 minutos) → al verificarlo se activa la cuenta y se inicia la sesión.
2. **Inicio de sesión**: con correo o usuario + contraseña. Si la cuenta tiene activada la opción de seguridad, además se pide el código que llega al correo.
3. **Ajustes (`/cuenta`)**: cambiar la opción «pedir código en cada inicio», cerrar sesión y eliminar la cuenta (pidiendo la contraseña).
4. La navbar muestra el icono de ajustes con `@usuario` cuando hay sesión; sin sesión muestra «Iniciar sesión».
5. «Continuar con Google» sigue deshabilitado a propósito: no hay OAuth configurado.

Medidas de seguridad incluidas: contraseñas con scrypt, sesiones en cookie httpOnly (30 días), códigos guardados solo como hash, límite de intentos por IP e identificador, comprobación de origen (CSRF) y cabeceras de seguridad. La base de datos (`data/`) está fuera de git.

## Cómo configurar enlaces, descargas y novedades

Toda la información variable vive en **`src/config/site.ts`**. No hace falta tocar componentes.

### Activar el botón de GitHub / comunidad

En `site.ts`, cada entrada de `links` tiene `url: null`. Cambia `null` por la URL real cuando exista:

```ts
repository: {
  url: 'https://github.com/TU_USUARIO/TU_REPO',
  label: 'Ver en GitHub',
},
```

Los controles con `url: null` se renderizan como botones deshabilitados (`aria-disabled`), sin ningún `href`, por lo que no navegan a ningún sitio.

### Publicar una descarga

En el array `platforms`, cambia el estado de la plataforma y añade `version` y `url` reales (por ejemplo, el enlace al asset de una GitHub Release):

```ts
{
  id: 'windows',
  name: 'Windows',
  status: 'available',
  version: '0.1.0',
  url: 'https://github.com/TU_USUARIO/TU_REPO/releases/download/v0.1.0/HookHub-Setup.exe',
  // ...
}
```

Estados posibles: `'available'` (Disponible), `'coming_soon'` (Próximamente), `'in_development'` (En desarrollo). **No inventes versiones ni URLs**: el botón de descarga solo se activa si `status === 'available'` y `url` no es `null`.

### Añadir novedades

En el array `news`, añade entradas (se muestran de más reciente a menos reciente si las ordenas así al escribirlas):

```ts
news: [
  {
    title: 'HookHub v0.1.0',
    date: '2027-01-15',          // formato YYYY-MM-DD
    summary: 'Primera versión pública.',
    changes: ['Analytics básico', 'Soporte de Windows'],
    url: 'https://github.com/TU_USUARIO/TU_REPO/releases/tag/v0.1.0',
  },
],
```

Con el array vacío (estado actual) la sección muestra un estado vacío honesto.

### Configurar el dominio y la licencia

- `site.url` en `site.ts`: pon la URL de producción cuando exista (habilita las URLs canónicas y Open Graph absolutas).
- `site.license`: rellena `name` y `url` solo cuando se haya publicado una licencia real. Mientras tanto, la web muestra «Licencia pendiente de definición».
- `astro.config.ts`: actualiza `site` con el mismo dominio cuando exista.

## Cabeceras de seguridad y despliegue

El servidor Node aplica las cabeceras de seguridad por middleware (`src/middleware.ts`), incluida la CSP en producción. El archivo `public/_headers` las duplica para proveedores estáticos que lo apliquen (Netlify, Cloudflare Pages).

- **GitHub Pages no aplica `_headers` ni ejecuta el servidor**: la web perdería la API de cuentas si se despliega ahí. Para desplegar con cuentas hace falta un host que ejecute Node (un VPS, Render, Railway, etc.).
- Tras desplegar, verifica las cabeceras con: `curl -I https://tu-dominio/`.

La CSP está diseñada para la salida real de este proyecto (CSS y JS externos, fuentes e imágenes locales, sin recursos de terceros). Si añades scripts o estilos externos, deberás ampliar la CSP en `src/middleware.ts` y `_headers`.

## Privacidad

Sin analítica ni telemetría de terceros. Con cuentas sí hay: una cookie de sesión (`hh_session`, httpOnly, 30 días) y un archivo local SQLite (`data/hookhub.sqlite`) con usuario, correo, hash de contraseña y sesiones. No se envían datos a terceros salvo el correo transaccional de verificación cuando `MAIL_MODE=smtp`. La telemetría anónima de Astro se desactiva en desarrollo (`npx astro telemetry disable`).

## Componentes React (shadcn / Tailwind)

La sección de cierre usa el componente React `AnimatedMarqueeHero` (`src/components/ui/hero-3.tsx`, estilo shadcn) con framer-motion. Para eso el proyecto incluye:

- `@astrojs/react` + `react`/`react-dom` (hidratación con `client:visible` / `client:load`)
- `tailwindcss` + `@tailwindcss/vite` (v4) con los tokens de marca en `src/styles/tailwind.css` (`@theme`)
- `@/*` → `src/*` en `tsconfig.json` (alias shadcn)
- `src/lib/utils.ts` con la utilidad `cn` (clsx + tailwind-merge)
- Primitivas shadcn en `src/components/ui/`: `button`, `input`, `label`, `sheet`, `navigation-menu` (Radix + class-variance-authority) e iconos con `lucide-react`

Componentes del sitio:

- `navbar-02.tsx` — nav sticky con menú de escritorio (Radix NavigationMenu) y menú móvil (Sheet). Consulta la sesión real (`/api/auth/me`, de forma silenciosa): con sesión muestra el icono de ajustes con `@usuario` (enlace a `/cuenta`); sin sesión, «Iniciar sesión». GitHub solo es botón real si `site.links.repository.url` existe.
- `hero-01.tsx` (+ `hero-01-utils/hero.tsx` y `brand-slider.tsx`) — inicio de la portada: h1 con el tagline de `site.ts`, estado honesto del proyecto, CTA a `#descargas`/`#caracteristicas`, avatares locales y slider CSS de plataformas previstas (marquesina `animate-marquee` con keyframes en `tailwind.css`). El `Header` del componente original se omitió: duplicaba `navbar-02` y usaba enlaces `#` ficticios. Avatares y marcas son SVG locales en `public/showcase/` (la CSP `img-src 'self'` no permite CDNs).
- `features-card.tsx` — bento interactivo de características (React, `client:visible`) que sustituye al antiguo `Features.astro`. Mantiene `id="caracteristicas"`, el mismo copy honesto de las 6 funciones con sus estados reales de `site.ts`, y sustituye las métricas del original por datos verificables del proyecto (estados de plataforma, repositorio sin publicar, 0 versiones/novedades, licencia pendiente). La «terminal» está etiquetada como simulación conceptual.
- `auth-section.tsx` (+ `auth-shared.tsx`) — flujo real de acceso en `/login`: inicio de sesión (correo o usuario), registro con nombre de usuario y pantalla de código de 6 dígitos con reenvío. Llama a la API `/api/auth/*`; en desarrollo avisa de que el código aparece en la consola del servidor. Botón «Continuar con Google» **solo visual** (aria-disabled, G oficial inline, sin OAuth) y prueba social con avatares locales. No se usa `localStorage`.
- `account-panel.tsx` — panel de `/cuenta`: identidad (@usuario y correo), interruptor «pedir código en cada inicio», cerrar sesión y eliminación de cuenta con contraseña.
- `not-found-02.tsx` — página 404 (adaptación de un diseño de 21st.dev): número gigante, lista de destinos reales de esta web (sin `href="#"`) y botones con la primitiva `button` de shadcn. Se renderiza estático desde `404.astro`.
- `hero-3.tsx` — sección de cierre con marquesina (estilo shadcn) con framer-motion. Las imágenes de la marquesina son **placeholders abstractos locales** en `public/showcase/` (sin CDNs externos; la CSP `img-src 'self'` se mantiene intacta). Sustitúyelas por capturas reales cuando existan, actualizando el array `showcaseImages` en `src/pages/index.astro`.

Backend de cuentas (TypeScript, adaptador Node):

- `src/lib/db.ts` — SQLite (`node:sqlite`) con tablas `users`, `sessions`, `codes` y `rate_limits`.
- `src/lib/auth.ts` — scrypt, sesiones, códigos OTP, límites de intentos y validaciones.
- `src/lib/mail.ts` — envío de códigos por consola o SMTP.
- `src/lib/api.ts` — utilidades comunes de la API (JSON, cookies de sesión, origen, límites).
- `src/pages/api/auth/*` — `register`, `register/verify`, `resend`, `login`, `login/verify`, `logout`, `me`, `settings` y `account`.

Páginas: `/` (portada), `/login` (acceso y registro reales) y `/cuenta` (ajustes de la cuenta).

Notas importantes:

- Las reglas de elementos de `global.css` van dentro de `@layer base` para que las utilidades de Tailwind (capa `utilities`) puedan sobrescribirlas.
- Para añadir más componentes shadcn: cópialos en `src/components/ui/`, usa `cn` de `@/lib/utils` y los tokens `--color-*` definidos en `tailwind.css`.

## Estructura

```
src/
├── components/       Downloads, News, Community, Footer, StatusBadge, Logo
│   └── ui/           navbar-02 (+ navbar-02-utils/), hero-01 (+ hero-01-utils/),
│                     features-card, auth-section (+ auth-shared), account-panel,
│                     not-found-02, hero-3 (React) + primitivas shadcn:
│                     button, input, label, sheet, navigation-menu
├── config/           site.ts  ← único punto de configuración del contenido
├── lib/              utils.ts (cn) + db.ts, auth.ts, mail.ts, api.ts (cuentas)
├── layouts/          BaseLayout.astro (SEO, fuentes, skip-link)
├── pages/            index.astro, login.astro, cuenta.astro, 404.astro
│   └── api/auth/     register, register/verify, resend, login, login/verify,
│                     logout, me, settings, account
├── middleware.ts     cabeceras de seguridad (CSP en producción)
└── styles/           tokens.css, global.css, tailwind.css (tokens Tailwind @theme)
data/                 hookhub.sqlite (BD de cuentas; ignorada por git)
public/               favicon.svg, og-cover.png, _headers,
                      showcase/ (marquesina + avatares/marcas del hero, SVG locales)
```

## Licencia del código

Pendiente de definición.
