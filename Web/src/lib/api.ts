import {
  SESSION_COOKIE,
  SESSION_TTL_S,
  getSessionUser,
  rateLimit,
  toPublicUser,
  type PublicUser,
  type UserRecord,
} from './auth';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

export function json(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...SECURITY_HEADERS,
      ...extraHeaders,
    },
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

export function clientKey(request: Request, bucket: string): string {
  const fwd = request.headers.get('x-forwarded-for');
  const ip = fwd ? fwd.split(',')[0]?.trim() : 'local';
  return `${bucket}:${ip || 'local'}`;
}

export function isHttps(request: Request): boolean {
  try {
    return new URL(request.url).protocol === 'https:';
  } catch {
    return false;
  }
}

/* ── Cookies (sin API de framework: se manejan a mano) ──────────────────── */

export function getCookieValue(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (key === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}

export function sessionSetCookie(token: string, secure: boolean): string {
  const attrs = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_S}`,
  ];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

export function clearSessionCookie(): string {
  return [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'].join('; ');
}

/* ── Sesión y límites ───────────────────────────────────────────────────── */

export async function sessionUserFromRequest(request: Request): Promise<UserRecord | undefined> {
  const token = getCookieValue(request, SESSION_COOKIE);
  if (!token) return undefined;
  return getSessionUser(token);
}

export async function sessionUserResponse(request: Request): Promise<PublicUser | null> {
  const user = await sessionUserFromRequest(request);
  return user ? toPublicUser(user) : null;
}

/** Límite compartido para endpoints que mutan estado. */
export async function limitOrError(
  request: Request,
  bucket: string,
  limit: number,
  windowMs: number,
  message = 'Demasiados intentos. Inténtalo de nuevo más tarde.',
): Promise<Response | null> {
  if (!(await rateLimit(clientKey(request, bucket), limit, windowMs))) {
    return json({ ok: false, error: message }, 429);
  }
  return null;
}
