'use client';

import { useEffect, useState } from 'react';
import { LogOut, ShieldCheck, Trash2 } from 'lucide-react';

import { fieldInputClass } from '@/components/ui/auth-shared';
import type { SessionUser } from '@/components/ui/navbar-02';

/**
 * Ajustes de cuenta: seguridad (código en cada inicio), cerrar sesión
 * y eliminación de la cuenta (requiere la contraseña).
 */
export default function AccountPanel() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Reflejo inmediato del toggle mientras el servidor confirma
  const [otpOverride, setOtpOverride] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: SessionUser | null } | null) => {
        if (!active) return;
        const found = data?.user ?? null;
        if (!found) {
          window.location.replace('/login');
          return;
        }
        setUser(found);
        setLoading(false);
      })
      .catch(() => {
        if (active) window.location.replace('/login');
      });
    return () => {
      active = false;
    };
  }, []);

  async function toggleOtpOnLogin(checked: boolean) {
    if (pending) return;
    setError('');
    setNote('');
    setPending(true);
    try {
      const response = await fetch('/api/auth/settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ otpOnLogin: checked }),
      });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; user?: SessionUser; error?: string }
        | null;
      if (!data?.ok || !data.user) {
        setError(String(data?.error ?? 'No se pudo guardar la configuración.'));
        return;
      }
      setUser(data.user);
      setNote(
        data.user.otpOnLogin
          ? 'Guardado: a partir de ahora se pedirá un código al correo en cada inicio de sesión.'
          : 'Guardado: ya no se pedirá código al iniciar sesión.',
      );
    } catch {
      setError('No se pudo guardar la configuración. Inténtalo de nuevo.');
    } finally {
      setOtpOverride(null);
      setPending(false);
    }
  }

  async function handleLogout() {
    if (pending) return;
    setPending(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.assign('/');
    }
  }

  async function handleDelete(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError('');
    if (!deletePassword) {
      setError('Introduce tu contraseña para confirmar.');
      return;
    }
    setPending(true);
    try {
      const response = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!data?.ok) {
        setError(String(data?.error ?? 'No se pudo eliminar la cuenta.'));
        return;
      }
      window.location.assign('/');
    } catch {
      setError('No se pudo eliminar la cuenta. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="rounded-3xl border border-border bg-background p-8 text-center text-sm text-muted-foreground shadow-lg">
        Cargando tu cuenta…
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Identidad */}
      <section className="rounded-3xl border border-border bg-background p-8 shadow-lg">
        <h2 className="mb-1 text-xl font-semibold text-foreground">@{user.username}</h2>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </section>

      {/* Seguridad */}
      <section className="rounded-3xl border border-border bg-background p-8 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-foreground">Seguridad</h2>
        </div>

        <label htmlFor="otp-on-login" className="flex cursor-pointer items-start gap-3">
          <input
            id="otp-on-login"
            type="checkbox"
            checked={otpOverride ?? user.otpOnLogin}
            disabled={pending}
            onChange={(e) => {
              const next = e.target.checked;
              setOtpOverride(next);
              void toggleOtpOnLogin(next);
            }}
            className="mt-1 h-4 w-4 accent-primary"
          />
          <span>
            <span className="block text-sm font-medium text-foreground">
              Pedir código de verificación en cada inicio de sesión
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              Cuando está activado, introducir la contraseña no basta: también se envía un
              código de 6 dígitos a tu correo que debes escribir para entrar.
            </span>
          </span>
        </label>

        {note && (
          <p role="status" className="mt-4 rounded-lg border border-border bg-soft p-3 text-xs text-muted-foreground">
            {note}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 border-t border-border pt-6">
          <button
            type="button"
            onClick={handleLogout}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </section>

      {/* Zona de peligro */}
      <section className="rounded-3xl border border-destructive/30 bg-background p-8 shadow-lg">
        <div className="mb-2 flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-foreground">Eliminar cuenta</h2>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
          Esta acción borra tu usuario, tu correo, tu contraseña y todas tus sesiones. No se
          puede deshacer.
        </p>

        <form onSubmit={handleDelete} className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <label htmlFor="delete-password" className="sr-only">
              Contraseña actual
            </label>
            <input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              placeholder="Tu contraseña actual"
              aria-label="Contraseña actual"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className={fieldInputClass}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-destructive px-5 py-3 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirmDelete ? 'Sí, eliminar definitivamente' : 'Eliminar mi cuenta'}
          </button>
        </form>
        {!confirmDelete && deletePassword.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-3 text-xs font-medium text-destructive underline"
          >
            Confirmar que quiero eliminar la cuenta
          </button>
        )}
        {confirmDelete && (
          <p role="status" className="mt-3 text-xs text-muted-foreground">
            Al enviar el formulario se eliminará la cuenta de forma permanente.
          </p>
        )}
      </section>
    </div>
  );
}
