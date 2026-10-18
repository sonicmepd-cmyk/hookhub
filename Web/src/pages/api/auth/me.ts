import type { APIContext } from 'astro';
import { sessionUserResponse } from '../../../lib/api';

export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  return new Response(
    JSON.stringify({
      ok: true,
      user: sessionUserResponse(context),
      mailMode: process.env.MAIL_MODE ?? 'console',
    }),
    { headers: { 'content-type': 'application/json; charset=utf-8' } },
  );
}
