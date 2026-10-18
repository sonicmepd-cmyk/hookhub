import type { APIContext } from 'astro';
import {
  SESSION_COOKIE,
  createSession,
  sessionCookieOptions,
  verifyVerificationCode,
} from '../../../../lib/auth';
import { db, toPublicUser, type UserRow } from '../../../../lib/db';
import { json, limitOrError, readJson, sameOriginOk } from '../../../../lib/api';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  if (!sameOriginOk(context.request)) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  const limited = limitOrError(context, 'verify-login-ip', 15, 15 * 60 * 1000);
  if (limited) return limited;

  const body = await readJson(context.request);
  if (!body) return json({ ok: false, error: 'Petición inválida.' }, 400);

  const email = String(body.email ?? '').trim().toLowerCase();
  const code = String(body.code ?? '').trim();
  if (!email || !/^\d{6}$/.test(code)) {
    return json({ ok: false, error: 'Introduce el código de 6 dígitos.' }, 400);
  }

  const user = db
    .prepare('SELECT * FROM users WHERE email = ? AND verified = 1')
    .get(email) as UserRow | undefined;
  if (!user) {
    return json({ ok: false, error: 'No hay ninguna cuenta activa con ese correo.' }, 404);
  }

  const checked = verifyVerificationCode(user.id, 'login', code);
  if (!checked.ok) return json({ ok: false, error: checked.error }, 400);

  const token = createSession(user.id);
  const opts = sessionCookieOptions();
  context.cookies.set(SESSION_COOKIE, token, {
    ...opts,
    secure: context.url.protocol === 'https:',
  });
  return json({ ok: true, user: toPublicUser(user) });
}
