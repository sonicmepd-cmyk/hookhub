import { useEffect, useState, type ComponentProps } from 'react';
import { Settings } from 'lucide-react';

import { site } from '@/config/site';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Logo } from '@/components/ui/navbar-02-utils/logo';
import { NavigationSheet } from '@/components/ui/navbar-02-utils/navigation-sheet';

const navLinks = [
  { href: '/#caracteristicas', label: 'Características' },
  { href: '/#descargas', label: 'Descargas' },
  { href: '/#novedades', label: 'Novedades' },
  { href: '/#comunidad', label: 'Comunidad' },
];

export interface SessionUser {
  id: number;
  username: string;
  email: string;
  otpOnLogin: boolean;
}

export const NavMenu = (props: ComponentProps<typeof NavigationMenu>) => (
  <NavigationMenu {...props}>
    <NavigationMenuList className="data-[orientation=vertical]:-ms-2 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start">
      {navLinks.map((link) => (
        <NavigationMenuItem key={link.href}>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <a href={link.href}>{link.label}</a>
          </NavigationMenuLink>
        </NavigationMenuItem>
      ))}
    </NavigationMenuList>
  </NavigationMenu>
);

/**
 * Consulta la sesión real de forma silenciosa: si la API no está disponible
 * (por ejemplo, sirviendo solo archivos estáticos), se queda como invitado.
 */
export function useSessionUser(): SessionUser | null {
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: SessionUser | null } | null) => {
        if (active) setUser(data?.user ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return user;
}

/**
 * Navbar del sitio (adaptada de navbar-02 a HookHub):
 * enlaces reales a las secciones, sesión real (icono de ajustes con el
 * usuario) y estados honestos para los controles sin URL.
 */
const Navbar = () => {
  const repo = site.links.repository;
  const user = useSessionUser();

  return (
    <nav
      className="sticky top-0 z-50 h-16 border-b bg-background"
      aria-label="Navegación principal"
    >
      <div className="container flex h-full items-center justify-between">
        <div className="flex items-center gap-12">
          <a href="/" aria-label="HookHub — ir al inicio" className="transition-opacity hover:opacity-80">
            <Logo />
          </a>

          {/* Menú de escritorio */}
          <NavMenu className="hidden lg:block" />
        </div>

        <div className="flex items-center gap-3">
          {repo.url ? (
            <Button className="hidden xl:inline-flex" variant="outline" asChild>
              <a href={repo.url} rel="noopener noreferrer" target="_blank">
                {repo.label}
              </a>
            </Button>
          ) : (
            <Button
              className="hidden xl:inline-flex cursor-default border-dashed bg-muted/50 text-muted-foreground hover:bg-muted/50 hover:text-muted-foreground"
              variant="outline"
              aria-disabled="true"
              aria-describedby="nav-cta-note"
            >
              {repo.label}
            </Button>
          )}
          {user ? (
            <Button className="hidden text-foreground sm:inline-flex" variant="ghost" asChild>
              <a
                href="/cuenta"
                aria-label={`Ajustes de cuenta de ${user.username}`}
                className="inline-flex items-center gap-2"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span aria-hidden="true">@{user.username}</span>
              </a>
            </Button>
          ) : (
            <Button className="hidden text-foreground sm:inline-flex" variant="ghost" asChild>
              <a href="/login">Iniciar sesión</a>
            </Button>
          )}
          <Button asChild>
            <a href="/#descargas">Descargar</a>
          </Button>

          {/* Menú móvil */}
          <div className="lg:hidden">
            <NavigationSheet user={user} />
          </div>
        </div>
      </div>
      <p id="nav-cta-note" className="sr-only">
        {repo.unavailableReason}
      </p>
    </nav>
  );
};

export default Navbar;
