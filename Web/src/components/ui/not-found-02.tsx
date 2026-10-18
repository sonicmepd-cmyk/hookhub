import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const suggestions = [
  { label: 'Portada', href: '/' },
  { label: 'Características', href: '/#caracteristicas' },
  { label: 'Descargas', href: '/#descargas' },
  { label: 'Novedades', href: '/#novedades' },
  { label: 'Comunidad', href: '/#comunidad' },
];

/**
 * Página 404 (adaptada de not-found-02).
 * Sin Next.js: los enlaces son anclas reales de esta web, sin href="#".
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16">
      <p className="select-none text-[8rem] font-semibold leading-none tracking-tight text-muted-foreground/50">
        404
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Página no encontrada</h1>
      <p className="mt-3 max-w-sm text-center text-muted-foreground">
        La página que buscas no existe o se ha movido.
      </p>

      <div className="mt-10 w-full max-w-xs">
        <p className="mb-3 text-center text-sm text-muted-foreground">
          A lo mejor buscabas esto:
        </p>
        <ul className="divide-y rounded-xl border border-border">
          {suggestions.map((s) => (
            <li key={s.href} className="group">
              <a
                className="flex items-center justify-between rounded-md px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                href={s.href}
              >
                {s.label}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <a href="/">Volver al inicio</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/#descargas">Ver descargas</a>
        </Button>
      </div>
    </div>
  );
}
