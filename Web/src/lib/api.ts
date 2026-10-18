import type { APIContext } from 'astro';
import {
  SESSION_COOKIE,
  getUserBySessionToken,
  rateLimit,
} from './auth';
import { toPublicUser, type PublicUser, type UserRow } from './db';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = (await request.json()) as unknown;
    if (body && typeof body === 'object') return body as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

/** Protección CSRF básica: si el navegador envía Origin, debe coincidir con el host. */
export function sameOriginOk(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // peticiones no de navegador
  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const candidates = new Set<string>();
  try {
    candidates.add(new URL(request.url).host.toLowerCase());
  } catch {
    /* request.url puede no ser absoluto en algunos entornos */
  }
  const hostHeader = request.headers.get('host');
  if (hostHeader) candidates.add(hostHeader.toLowerCase());

  // localhost y 127.0.0.1 (y ::1) son el mismo origen local
  const normalize = (host: string): string => {
    const match = host.match(/^(.+?)(:\d+)?$/);
    if (!match) return host;
    let name = match[1] ?? host;
    const port = match[2] ?? '';
    if (name === 'localhost' || name === '[::1]' || name === '::1') name = '127.0.0.1';
    return name + port;
  };
  const target = normalize(originHost);
  for (const candidate of candidates) {
    if (normalize(candidate) === target) return true;
  }
  return false;
}

export function clientKey(context: APIContext, bucket: string): string {
  const fwd = context.request.headers.get('x-forwarded-for');
  const ip = fwd ? fwd.split(',')[0]?.trim() : 'local';
  return `${bucket}:${ip || 'local'}`;
}

export function getSessionUser(context: APIContext): UserRow | undefined {
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return undefined;
  return getUserBySessionToken(token);
}

export function sessionUserResponse(context: APIContext): PublicUser | null {
  const user = getSessionUser(context);
  return user ? toPublicUser(user) : null;
}

/** Límite compartido para endpoints que mutan estado. */
export function limitOrError(
  context: APIContext,
  bucket: string,
  limit: number,
  windowMs: number,
  message = 'Demasiados intentos. Inténtalo de nuevo más tarde.',
): Response | null {
  if (!rateLimit(clientKey(context, bucket), limit, windowMs)) {
    return json({ ok: false, error: message }, 429);
  }
  return null;
}
