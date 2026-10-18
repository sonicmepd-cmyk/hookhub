import type { APIContext } from 'astro';
import { db } from '../../../lib/db';
import {
  EMAIL_RE,
  USERNAME_RE,
  createSession,
  createVerificationCode,
  hashPassword,
  maskEmail,
  normalizeEmail,
  normalizeUsername,
  rateLimit,
} from '../../../lib/auth';
import { json, limitOrError, readJson, sameOriginOk } from '../../../lib/api';
import { sendVerificationEmail } from '../../../lib/mail';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  if (!sameOriginOk(context.request)) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  const limited = limitOrError(context, 'register-ip', 10, 60 * 60 * 1000);
  if (limited) return limited;

  const body = await readJson(context.request);
  if (!body) return json({ ok: false, error: 'Petición inválida.' }, 400);

  const username = normalizeUsername(String(body.username ?? ''));
  const email = normalizeEmail(String(body.email ?? ''));
  const password = String(body.password ?? '');

  if (username.length < 3 || username.length > 20 || !USERNAME_RE.test(username)) {
    return json(
      { ok: false, error: 'El usuario debe tener entre 3 y 20 caracteres (letras, números o _).' },
      400,
    );
  }
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'El correo no es válido.' }, 400);
  }
  if (password.length < 8 || password.length > 128) {
    return json({ ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
  }
  if (!rateLimit(`register-email:${email}`, 3, 60 * 60 * 1000)) {
    return json(
      { ok: false, error: 'Demasiados registros con este correo. Inténtalo más tarde.' },
      429,
    );
  }

  const existingEmail = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(email) as { id: number } | undefined;
  if (existingEmail) {
    return json({ ok: false, error: 'Ya existe una cuenta con ese correo.' }, 409);
  }
  const existingUsername = db
    .prepare('SELECT id FROM users WHERE username = ?')
    .get(username) as { id: number } | undefined;
  if (existingUsername) {
    return json({ ok: false, error: 'Ese nombre de usuario ya está en uso.' }, 409);
  }

  const result = db
    .prepare('INSERT INTO users (username, email, password_hash, verified) VALUES (?, ?, ?, 0)')
    .run(username, email, hashPassword(password));
  const userId = Number(result.lastInsertRowid);

  const code = createVerificationCode(userId, 'register');
  try {
    await sendVerificationEmail(email, code);
  } catch (error) {
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    console.error('[auth] Error enviando código de registro:', error);
    return json(
      { ok: false, error: 'No se pudo enviar el código de verificación. Inténtalo más tarde.' },
      502,
    );
  }

  return json({ ok: true, requiresCode: true, email: maskEmail(email), flow: 'register' });
}
