import { Eye, EyeOff } from 'lucide-react';

/** Fondo de campo sobre la tarjeta clara. */
export const fieldInputClass =
  'w-full rounded-xl border border-input bg-soft px-5 py-3 pr-12 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30';

export function PasswordToggle({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
    >
      {show ? (
        <EyeOff className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Eye className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

/**
 * Acceso con Google: solo visual. Sin OAuth mientras no exista backend,
 * por eso el botón queda con aria-disabled y sin handler.
 */
export function GoogleDisabledButton() {
  return (
    <div className="w-full">
      <button
        type="button"
        aria-disabled="true"
        aria-describedby="google-auth-note"
        className="flex w-full cursor-default items-center justify-center gap-2 rounded-full border border-input bg-background px-5 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
      >
        <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
          <path
            fill="#4285F4"
            d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
          />
          <path
            fill="#34A853"
            d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
          />
          <path
            fill="#FBBC05"
            d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
          />
          <path
            fill="#EA4335"
            d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
          />
        </svg>
        Continuar con Google
      </button>
      <p id="google-auth-note" className="mt-2 text-center text-[11px] text-muted-foreground">
        Se activará cuando exista un backend de acceso.
      </p>
    </div>
  );
}

/** Prueba social honesta: avatares locales, sin métricas inventadas. */
export function SocialProof() {
  return (
    <div className="mt-10 flex flex-col items-center text-center">
      <div className="mb-2 flex" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <img
            key={n}
            src={`/showcase/avatar-${n}.svg`}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full border-2 border-background object-cover"
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Hecho para creadores de contenido</p>
    </div>
  );
}

/** Logo HookHub en la cabecera de la tarjeta (SVG local). */
export function CardLogo() {
  return (
    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-soft shadow-sm">
      <img src="/favicon.svg" alt="" className="h-6 w-6" />
    </div>
  );
}

/** Utilidad común: validación de correo. */
export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
