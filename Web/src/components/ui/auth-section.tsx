'use client';

import { useEffect, useState } from 'react';
import {
  CardLogo,
  GoogleDisabledButton,
  PasswordToggle,
  SocialProof,
  fieldInputClass,
} from '@/components/ui/auth-shared';

type View = 'signin' | 'signup' | 'code';
type Flow = 'register' | 'login';

interface ApiResult {
  status: number;
  data: Record<string, unknown> | null;
}

async function postJson(path: string, body: unknown): Promise<ApiResult> {
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    let data: Record<string, unknown> | null = null;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      data = null;
    }
    return { status: response.status, data };
  } catch {
    return { status: 0, data: null };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]+$/;

/**
 * Flujo real de autenticación: inicio de sesión (correo o usuario),
 * registro con nombre de usuario y verificación por código de 6 dígitos
 * que llega al correo (en desarrollo se muestra en la consola del servidor).
 */
export default function AuthSection() {
  const [view, setView] = useState<View>('signin');
  const [flow, setFlow] = useState<Flow>('register');
  const [pendingEmail, setPendingEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [mailMode, setMailMode] = useState('console');

  // Inicio de sesión
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registro
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Código
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { mailMode?: string } | null) => {
        if (d?.mailMode) setMailMode(d.mailMode);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function goToCode(nextFlow: Flow, fullEmail: string, masked: string) {
    setFlow(nextFlow);
    setPendingEmail(fullEmail);
    setMaskedEmail(masked);
    setView('code');
    setCode('');
    setError('');
    setNote(`Enviamos un código de 6 dígitos a ${masked}. Caduca en 15 minutos.`);
    setCooldown(60);
    setPending(false);
  }

  async function handleSignin(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError('');
    setNote('');
    setNeedsVerification(false);
    const id = identifier.trim();
    if (!id || !password) {
      setError('Introduce tu correo (o usuario) y tu contraseña.');
      return;
    }
    setPending(true);
    const { data } = await postJson('/api/auth/login', { identifier: id, password });
    setPending(false);
    if (!data?.ok) {
      setError(String(data?.error ?? 'No se pudo iniciar sesión. Inténtalo de nuevo.'));
      if (data?.needsVerification === true) setNeedsVerification(true);
      return;
    }
    if (data.requiresCode === true) {
      goToCode('login', String(data.pendingEmail ?? ''), String(data.email ?? 'tu correo'));
      return;
    }
    window.location.assign('/');
  }

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError('');
    setNote('');
    const name = username.trim().toLowerCase();
    const mail = email.trim().toLowerCase();
    if (name.length < 3 || name.length > 20 || !USERNAME_RE.test(name)) {
      setError('El usuario debe tener entre 3 y 20 caracteres (letras, números o _).');
      return;
    }
    if (!EMAIL_RE.test(mail)) {
      setError('El correo no es válido.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setPending(true);
    const { data } = await postJson('/api/auth/register', {
      username: name,
      email: mail,
      password,
    });
    setPending(false);
    if (!data?.ok) {
      setError(String(data?.error ?? 'No se pudo crear la cuenta. Inténtalo de nuevo.'));
      return;
    }
    goToCode('register', mail, String(data.email ?? mail));
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Introduce el código de 6 dígitos.');
      return;
    }
    setPending(true);
    const path =
      flow === 'register' ? '/api/auth/register/verify' : '/api/auth/login/verify';
    const { data } = await postJson(path, { email: pendingEmail, code });
    setPending(false);
    if (!data?.ok) {
      setError(String(data?.error ?? 'El código no es válido.'));
      return;
    }
    window.location.assign('/');
  }

  async function handleResend() {
    if (cooldown > 0 || pending) return;
    setError('');
    setPending(true);
    const { data } = await postJson('/api/auth/resend', { email: pendingEmail, flow });
    setPending(false);
    if (!data?.ok) {
      setError(String(data?.error ?? 'No se pudo reenviar el código.'));
      return;
    }
    setNote(`Código reenviado a ${String(data.email ?? maskedEmail)}. Caduca en 15 minutos.`);
    setCooldown(60);
  }

  async function handleResendRegister() {
    const mail = identifier.trim().toLowerCase();
    if (!EMAIL_RE.test(mail) || cooldown > 0 || pending) return;
    setError('');
    setNote('');
    setPending(true);
    const { data } = await postJson('/api/auth/resend', { email: mail, flow: 'register' });
    setPending(false);
    if (!data?.ok) {
      setError(String(data?.error ?? 'No se pudo reenviar el código.'));
      return;
    }
    setPendingEmail(mail);
    setMaskedEmail(String(data.email ?? mail));
    setFlow('register');
    setView('code');
    setCode('');
    setNote(`Código reenviado a ${String(data.email ?? mail)}. Caduca en 15 minutos.`);
    setCooldown(60);
  }

  /* ── Vista: verificar código ─────────────────────────────────────────── */

  if (view === 'code') {
    return (
      <div className="flex w-full flex-col items-center rounded-3xl border border-border bg-background p-8 shadow-lg">
        <CardLogo />
        <h2 id="auth-title" className="mb-2 text-center text-2xl font-semibold text-foreground">
          Verifica tu correo
        </h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Hemos enviado un código a <span className="font-medium">{maskedEmail}</span>
        </p>

        <form onSubmit={handleVerify} className="w-full" noValidate>
          <div className="mb-4">
            <label htmlFor="otp-code" className="sr-only">
              Código de verificación
            </label>
            <input
              id="otp-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="\d{6}"
              placeholder="000000"
              aria-label="Código de verificación"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-xl border border-input bg-soft px-5 py-3 text-center font-mono text-lg tracking-[0.4em] text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {error && (
            <p role="alert" className="mb-3 text-left text-sm text-destructive">
              {error}
            </p>
          )}
          {note && (
            <p
              role="status"
              className="mb-3 rounded-lg border border-border bg-soft p-3 text-left text-xs leading-relaxed text-muted-foreground"
            >
              {note}
              {mailMode === 'console' &&
                ' En modo desarrollo, el código también aparece en la consola del servidor.'}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mb-3 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Verificando…' : 'Verificar y entrar'}
          </button>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setView(flow === 'register' ? 'signup' : 'signin');
                setError('');
                setNote('');
              }}
              className="text-primary underline transition-colors hover:text-primary/80"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || pending}
              className="text-primary underline transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              {cooldown > 0 ? `Reenviar en ${cooldown} s` : 'Reenviar código'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ── Vista: inicio de sesión ─────────────────────────────────────────── */

  if (view === 'signin') {
    return (
      <div className="flex w-full flex-col items-center rounded-3xl border border-border bg-background p-8 shadow-lg">
        <CardLogo />
        <h2 id="auth-title" className="mb-6 text-center text-2xl font-semibold text-foreground">
          Iniciar sesión
        </h2>

        <form onSubmit={handleSignin} className="w-full" noValidate>
          <div className="mb-4">
            <label htmlFor="signin-identifier" className="sr-only">
              Correo o usuario
            </label>
            <input
              id="signin-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              placeholder="Correo o usuario"
              aria-label="Correo o usuario"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={fieldInputClass}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="signin-password" className="sr-only">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="signin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Contraseña"
                aria-label="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldInputClass}
              />
              <PasswordToggle show={showPassword} onToggle={() => setShowPassword((s) => !s)} />
            </div>
          </div>

          {error && (
            <p role="alert" className="mb-3 text-left text-sm text-destructive">
              {error}
            </p>
          )}
          {needsVerification && (
            <div className="mb-3 rounded-lg border border-border bg-soft p-3 text-left">
              <p role="status" className="text-xs leading-relaxed text-muted-foreground">
                Tu cuenta está creada pero sin verificar. Pide un código nuevo para terminar el
                registro.
              </p>
              {cooldown > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Reenviar en {cooldown} s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendRegister}
                  disabled={pending}
                  className="mt-2 text-xs font-medium text-primary underline transition-colors hover:text-primary/80 disabled:cursor-not-allowed"
                >
                  Reenviar código de registro
                </button>
              )}
            </div>
          )}
          {note && (
            <p
              role="status"
              className="mb-3 rounded-lg border border-border bg-soft p-3 text-left text-xs leading-relaxed text-muted-foreground"
            >
              {note}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mb-3 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="w-full">
          <GoogleDisabledButton />
          <div className="mt-3 text-center">
            <span className="text-xs text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setView('signup');
                  setError('');
                  setNote('');
                  setNeedsVerification(false);
                }}
                className="text-primary underline transition-colors hover:text-primary/80"
              >
                ¡Regístrate!
              </button>
            </span>
          </div>
        </div>

        <SocialProof />
      </div>
    );
  }

  /* ── Vista: registro ─────────────────────────────────────────────────── */

  return (
    <div className="flex w-full flex-col items-center rounded-3xl border border-border bg-background p-8 shadow-lg">
      <CardLogo />
      <h2 id="auth-title" className="mb-6 text-center text-2xl font-semibold text-foreground">
        Crear cuenta
      </h2>

      <form onSubmit={handleSignup} className="w-full" noValidate>
        <div className="mb-4">
          <label htmlFor="signup-username" className="sr-only">
            Nombre de usuario
          </label>
          <input
            id="signup-username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Nombre de usuario"
            aria-label="Nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={fieldInputClass}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="signup-email" className="sr-only">
            Correo electrónico
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Correo electrónico"
            aria-label="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldInputClass}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="signup-password" className="sr-only">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Contraseña (mínimo 8 caracteres)"
              aria-label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldInputClass}
            />
            <PasswordToggle show={showPassword} onToggle={() => setShowPassword((s) => !s)} />
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="signup-password-confirm" className="sr-only">
            Repite la contraseña
          </label>
          <div className="relative">
            <input
              id="signup-password-confirm"
              name="passwordConfirm"
              type={showPasswordConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              aria-label="Repite la contraseña"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className={fieldInputClass}
            />
            <PasswordToggle
              show={showPasswordConfirm}
              onToggle={() => setShowPasswordConfirm((s) => !s)}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-3 text-left text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mb-3 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Enviando código…' : 'Crear cuenta'}
        </button>
      </form>

      <div className="w-full">
        <GoogleDisabledButton />
        <div className="mt-3 text-center">
          <span className="text-xs text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => {
                setView('signin');
                setError('');
              }}
              className="text-primary underline transition-colors hover:text-primary/80"
            >
              Inicia sesión
            </button>
          </span>
        </div>
      </div>

      <SocialProof />
    </div>
  );
}
