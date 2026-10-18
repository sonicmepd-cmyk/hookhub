import type { APIContext } from 'astro';
import { SESSION_COOKIE, deleteSession } from '../../../lib/auth';
import { json, sameOriginOk } from '../../../lib/api';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  if (!sameOriginOk(context.request)) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  context.cookies.delete(SESSION_COOKIE, { path: '/' });
  return json({ ok: true });
}
