import type { APIContext } from 'astro';
import { db, toPublicUser } from '../../../lib/db';
import { json, getSessionUser, limitOrError, readJson, sameOriginOk } from '../../../lib/api';

export const prerender = false;

export async function PATCH(context: APIContext): Promise<Response> {
  if (!sameOriginOk(context.request)) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  const limited = limitOrError(context, 'settings-ip', 30, 15 * 60 * 1000);
  if (limited) return limited;

  const user = getSessionUser(context);
  if (!user) return json({ ok: false, error: 'Inicia sesión para cambiar la configuración.' }, 401);

  const body = await readJson(context.request);
  if (!body || typeof body.otpOnLogin !== 'boolean') {
    return json({ ok: false, error: 'Petición inválida.' }, 400);
  }

  db.prepare('UPDATE users SET otp_on_login = ? WHERE id = ?').run(
    body.otpOnLogin ? 1 : 0,
    user.id,
  );
  const updated = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(user.id) as unknown as typeof user;
  return json({ ok: true, user: toPublicUser(updated) });
}
