import { Menu, Settings } from 'lucide-react';

import { site } from '@/config/site';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Logo } from './logo';
import type { SessionUser } from '../navbar-02';

const navLinks = [
  { href: '/#caracteristicas', label: 'Características' },
  { href: '/#descargas', label: 'Descargas' },
  { href: '/#novedades', label: 'Novedades' },
  { href: '/#comunidad', label: 'Comunidad' },
];

/** Menú móvil (Radix Sheet) con las acciones del sitio, en español. */
export function NavigationSheet({ user }: { user: SessionUser | null }) {
  const repo = site.links.repository;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Abrir menú de navegación">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" aria-label="Menú de navegación">
        <SheetHeader>
          <SheetTitle>
            <Logo size={24} />
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Navegación móvil">
          <ul className="mt-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <SheetClose asChild>
                  <a
                    href={link.href}
                    className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {link.label}
                  </a>
                </SheetClose>
              </li>
            ))}
            <li>
              {repo.url ? (
                <a
                  href={repo.url}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  GitHub
                </a>
              ) : (
                <span
                  aria-disabled="true"
                  aria-describedby="sheet-github-note"
                  className="block rounded-md border border-dashed border-border px-3 py-2.5 text-sm font-medium text-muted-foreground"
                >
                  GitHub
                  <span className="block text-xs font-normal">({repo.unavailableReason})</span>
                </span>
              )}
            </li>
          </ul>
        </nav>
        <div className="mt-6 flex flex-col gap-2">
          {user ? (
            <SheetClose asChild>
              <Button variant="outline" className="text-foreground" asChild>
                <a
                  href="/cuenta"
                  aria-label={`Ajustes de cuenta de ${user.username}`}
                  className="inline-flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Ajustes · @{user.username}
                </a>
              </Button>
            </SheetClose>
          ) : (
            <SheetClose asChild>
              <Button variant="outline" className="text-foreground" asChild>
                <a href="/login">Iniciar sesión</a>
              </Button>
            </SheetClose>
          )}
          <SheetClose asChild>
            <Button asChild>
              <a href="/#descargas">Descargar HookHub</a>
            </Button>
          </SheetClose>
        </div>
        <p id="sheet-github-note" className="sr-only">
          {repo.unavailableReason}
        </p>
      </SheetContent>
    </Sheet>
  );
}

export default NavigationSheet;
