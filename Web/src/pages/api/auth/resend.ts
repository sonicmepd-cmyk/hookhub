import type { APIContext } from 'astro';
import { createVerificationCode, maskEmail, rateLimit } from '../../../lib/auth';
import { db, type UserRow } from '../../../lib/db';
import { json, limitOrError, readJson, sameOriginOk } from '../../../lib/api';
import { sendVerificationEmail } from '../../../lib/mail';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  if (!sameOriginOk(context.request)) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  const limited = limitOrError(context, 'resend-ip', 20, 60 * 60 * 1000);
  if (limited) return limited;

  const body = await readJson(context.request);
  if (!body) return json({ ok: false, error: 'Petición inválida.' }, 400);

  const email = String(body.email ?? '').trim().toLowerCase();
  const flow = String(body.flow ?? '');
  if (!email || (flow !== 'register' && flow !== 'login')) {
    return json({ ok: false, error: 'Petición inválida.' }, 400);
  }
  if (!rateLimit(`resend:${email}`, 1, 60 * 1000)) {
    return json({ ok: false, error: 'Espera un momento antes de pedir otro código.' }, 429);
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!user) {
    return json({ ok: false, error: 'No hay ninguna cuenta con ese correo.' }, 404);
  }
  if (flow === 'register') {
    if (user.verified === 1) {
      return json({ ok: false, error: 'Esa cuenta ya está verificada. Inicia sesión.' }, 409);
    }
  } else {
    if (user.verified === 0) {
      return json(
        { ok: false, error: 'La cuenta aún no está verificada. Revisa el código de registro.' },
        409,
      );
    }
    if (user.otp_on_login !== 1) {
      return json({ ok: false, error: 'Esta cuenta no pide código al iniciar sesión.' }, 409);
    }
  }

  const code = createVerificationCode(user.id, flow);
  try {
    await sendVerificationEmail(user.email, code);
  } catch (error) {
    console.error('[auth] Error reenviando código:', error);
    return json(
      { ok: false, error: 'No se pudo enviar el código. Inténtalo más tarde.' },
      502,
    );
  }
  return json({ ok: true, email: maskEmail(user.email), flow });
}
