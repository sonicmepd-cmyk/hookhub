import type { APIContext } from 'astro';
import { SESSION_COOKIE, deleteSession, deleteUserSessions, verifyPassword } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { json, getSessionUser, limitOrError, readJson, sameOriginOk } from '../../../lib/api';

export const prerender = false;

export async function DELETE(context: APIContext): Promise<Response> {
  if (!sameOriginOk(context.request)) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  const limited = limitOrError(context, 'delete-ip', 5, 15 * 60 * 1000);
  if (limited) return limited;

  const user = getSessionUser(context);
  if (!user) return json({ ok: false, error: 'Inicia sesión para eliminar la cuenta.' }, 401);

  const body = await readJson(context.request);
  const password = String(body?.password ?? '');
  if (!password) {
    return json({ ok: false, error: 'Introduce tu contraseña para confirmar.' }, 400);
  }
  if (!verifyPassword(password, user.password_hash)) {
    return json({ ok: false, error: 'La contraseña no es correcta.' }, 401);
  }

  deleteUserSessions(user.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  context.cookies.delete(SESSION_COOKIE, { path: '/' });
  return json({ ok: true });
}
