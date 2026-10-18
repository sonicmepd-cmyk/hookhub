import type { APIContext } from 'astro';
import {
  SESSION_COOKIE,
  createSession,
  createVerificationCode,
  dummyPasswordCheck,
  maskEmail,
  rateLimit,
  sessionCookieOptions,
  verifyPassword,
} from '../../../lib/auth';
import { db, toPublicUser, type UserRow } from '../../../lib/db';
import { clientKey, json, limitOrError, readJson, sameOriginOk } from '../../../lib/api';
import { sendVerificationEmail } from '../../../lib/mail';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  if (!sameOriginOk(context.request)) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  const limited = limitOrError(context, 'login-ip', 20, 15 * 60 * 1000);
  if (limited) return limited;

  const body = await readJson(context.request);
  if (!body) return json({ ok: false, error: 'Petición inválida.' }, 400);

  const identifier = String(body.identifier ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  if (!identifier || !password) {
    return json({ ok: false, error: 'Introduce tu correo (o usuario) y tu contraseña.' }, 400);
  }
  // 5 intentos por identificador + IP cada 15 min
  if (!rateLimit(`${clientKey(context, 'login')}:${identifier}`, 5, 15 * 60 * 1000)) {
    return json(
      { ok: false, error: 'Demasiados intentos. Inténtalo de nuevo más tarde.' },
      429,
    );
  }

  const user = db
    .prepare('SELECT * FROM users WHERE email = ? OR username = ?')
    .get(identifier, identifier) as UserRow | undefined;

  if (!user) {
    dummyPasswordCheck();
    return json({ ok: false, error: 'El correo o la contraseña no son correctos.' }, 401);
  }
  if (!verifyPassword(password, user.password_hash)) {
    return json({ ok: false, error: 'El correo o la contraseña no son correctos.' }, 401);
  }
  if (user.verified === 0) {
    return json(
      {
        ok: false,
        error: 'Tu cuenta aún no está verificada. Usa el código que te enviamos por correo.',
        needsVerification: true,
      },
      403,
    );
  }

  if (user.otp_on_login === 1) {
    const code = createVerificationCode(user.id, 'login');
    try {
      await sendVerificationEmail(user.email, code);
    } catch (error) {
      console.error('[auth] Error enviando código de acceso:', error);
      return json(
        { ok: false, error: 'No se pudo enviar el código de acceso. Inténtalo más tarde.' },
        502,
      );
    }
    return json({
      ok: true,
      requiresCode: true,
      email: maskEmail(user.email),
      // el correo completo solo viaja tras validar la contraseña del propio titular
      pendingEmail: user.email,
      flow: 'login',
    });
  }

  const token = createSession(user.id);
  const opts = sessionCookieOptions();
  context.cookies.set(SESSION_COOKIE, token, {
    ...opts,
    secure: context.url.protocol === 'https:',
  });
  return json({ ok: true, user: toPublicUser(user) });
}
