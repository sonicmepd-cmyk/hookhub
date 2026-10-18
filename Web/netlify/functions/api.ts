/**
 * API de cuentas de HookHub como Netlify Function (v2: Request → Response).
 * Todas las rutas /api/auth/* caen aquí vía `export const config = { path }`.
 */
import {
  EMAIL_RE,
  USERNAME_RE,
  createSession,
  createVerificationCode,
  createUser,
  deleteSession,
  deleteUser,
  dummyPasswordCheck,
  getUserByEmail,
  getUserByIdentifier,
  getUserByUsername,
  hashPassword,
  markUserVerified,
  maskEmail,
  normalizeEmail,
  normalizeUsername,
  rateLimit,
  toPublicUser,
  updateUserOtpOnLogin,
  verifyPassword,
  verifyVerificationCode,
} from '../../src/lib/auth';
import {
  clearSessionCookie,
  getCookieValue,
  isHttps,
  json,
  limitOrError,
  readJson,
  sameOriginOk,
  sessionSetCookie,
  sessionUserFromRequest,
  sessionUserResponse,
} from '../../src/lib/api';
import { sendVerificationEmail } from '../../src/lib/mail';
import { SESSION_COOKIE } from '../../src/lib/auth';

export const config = { path: '/api/*' };

async function route(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();

  if (path === '/api/auth/register' && method === 'POST') return handleRegister(request);
  if (path === '/api/auth/register/verify' && method === 'POST') return handleRegisterVerify(request);
  if (path === '/api/auth/resend' && method === 'POST') return handleResend(request);
  if (path === '/api/auth/login' && method === 'POST') return handleLogin(request);
  if (path === '/api/auth/login/verify' && method === 'POST') return handleLoginVerify(request);
  if (path === '/api/auth/logout' && method === 'POST') return handleLogout(request);
  if (path === '/api/auth/me' && method === 'GET') return handleMe(request);
  if (path === '/api/auth/settings' && method === 'PATCH') return handleSettings(request);
  if (path === '/api/auth/account' && method === 'DELETE') return handleAccountDelete(request);

  return json({ ok: false, error: 'Ruta no encontrada.' }, 404);
}

/* ── Handlers ───────────────────────────────────────────────────────────── */

async function handleRegister(request: Request): Promise<Response> {
  if (!sameOriginOk(request)) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  const limited = await limitOrError(request, 'register-ip', 10, 60 * 60 * 1000);
  if (limited) return limited;

  const body = await readJson(request);
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
  if (!(await rateLimit(`register-email:${email}`, 3, 60 * 60 * 1000))) {
    return json(
      { ok: false, error: 'Demasiados registros con este correo. Inténtalo más tarde.' },
      429,
    );
  }

  if (await getUserByEmail(email)) {
    return json({ ok: false, error: 'Ya existe una cuenta con ese correo.' }, 409);
  }
  if (await getUserByUsername(username)) {
    return json({ ok: false, error: 'Ese nombre de usuario ya está en uso.' }, 409);
  }

  const user = await createUser({ username, email, passwordHash: hashPassword(password) });
  const code = await createVerificationCode(user.id, 'register');
  try {
    await sendVerificationEmail(email, code);
  } catch (error) {
    await deleteUser(user.id);
    console.error('[auth] Error enviando código de registro:', error);
    return json(
      { ok: false, error: 'No se pudo enviar el código de verificación. Inténtalo más tarde.' },
      502,
    );
  }

  return json({ ok: true, requiresCode: true, email: maskEmail(email), flow: 'register' });
}

async function handleRegisterVerify(request: Request): Promise<Response> {
  if (!sameOriginOk(request)) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  const limited = await limitOrError(request, 'verify-register-ip', 15, 15 * 60 * 1000);
  if (limited) return limited;

  const body = await readJson(request);
  if (!body) return json({ ok: false, error: 'Petición inválida.' }, 400);

  const email = String(body.email ?? '').trim().toLowerCase();
  const code = String(body.code ?? '').trim();
  if (!email || !/^\d{6}$/.test(code)) {
    return json({ ok: false, error: 'Introduce el código de 6 dígitos.' }, 400);
  }

  const user = await getUserByEmail(email);
  if (!user || user.verified === 1) {
    return json({ ok: false, error: 'No hay ninguna cuenta pendiente de verificar con ese correo.' }, 404);
  }

  const checked = await verifyVerificationCode(user.id, 'register', code);
  if (!checked.ok) return json({ ok: false, error: checked.error }, 400);

  await markUserVerified(user.id);
  const token = await createSession(user.id);
  const updated = await getUserByEmail(email);
  return json(
    { ok: true, user: toPublicUser(updated ?? user) },
    200,
    { 'Set-Cookie': sessionSetCookie(token, isHttps(request)) },
  );
}

async function handleResend(request: Request): Promise<Response> {
  if (!sameOriginOk(request)) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  const limited = await limitOrError(request, 'resend-ip', 20, 60 * 60 * 1000);
  if (limited) return limited;

  const body = await readJson(request);
  if (!body) return json({ ok: false, error: 'Petición inválida.' }, 400);

  const email = String(body.email ?? '').trim().toLowerCase();
  const flow = String(body.flow ?? '');
  if (!email || (flow !== 'register' && flow !== 'login')) {
    return json({ ok: false, error: 'Petición inválida.' }, 400);
  }
  if (!(await rateLimit(`resend:${email}`, 1, 60 * 1000))) {
    return json({ ok: false, error: 'Espera un momento antes de pedir otro código.' }, 429);
  }

  const user = await getUserByEmail(email);
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

  const code = await createVerificationCode(user.id, flow as 'register' | 'login');
  try {
    await sendVerificationEmail(user.email, code);
  } catch (error) {
    console.error('[auth] Error reenviando código:', error);
    return json({ ok: false, error: 'No se pudo enviar el código. Inténtalo más tarde.' }, 502);
  }
  return json({ ok: true, email: maskEmail(user.email), flow });
}

async function handleLogin(request: Request): Promise<Response> {
  if (!sameOriginOk(request)) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  const limited = await limitOrError(request, 'login-ip', 20, 15 * 60 * 1000);
  if (limited) return limited;

  const body = await readJson(request);
  if (!body) return json({ ok: false, error: 'Petición inválida.' }, 400);

  const identifier = String(body.identifier ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  if (!identifier || !password) {
    return json({ ok: false, error: 'Introduce tu correo (o usuario) y tu contraseña.' }, 400);
  }
  // 5 intentos por identificador + IP cada 15 min
  if (!(await rateLimit(`${clientKeySafe(request)}:${identifier}`, 5, 15 * 60 * 1000))) {
    return json({ ok: false, error: 'Demasiados intentos. Inténtalo de nuevo más tarde.' }, 429);
  }

  const user = await getUserByIdentifier(identifier);
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
    const code = await createVerificationCode(user.id, 'login');
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

  const token = await createSession(user.id);
  return json(
    { ok: true, user: toPublicUser(user) },
    200,
    { 'Set-Cookie': sessionSetCookie(token, isHttps(request)) },
  );
}

async function handleLoginVerify(request: Request): Promise<Response> {
  if (!sameOriginOk(request)) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  const limited = await limitOrError(request, 'verify-login-ip', 15, 15 * 60 * 1000);
  if (limited) return limited;

  const body = await readJson(request);
  if (!body) return json({ ok: false, error: 'Petición inválida.' }, 400);

  const email = String(body.email ?? '').trim().toLowerCase();
  const code = String(body.code ?? '').trim();
  if (!email || !/^\d{6}$/.test(code)) {
    return json({ ok: false, error: 'Introduce el código de 6 dígitos.' }, 400);
  }

  const user = await getUserByEmail(email);
  if (!user || user.verified !== 1) {
    return json({ ok: false, error: 'No hay ninguna cuenta activa con ese correo.' }, 404);
  }

  const checked = await verifyVerificationCode(user.id, 'login', code);
  if (!checked.ok) return json({ ok: false, error: checked.error }, 400);

  const token = await createSession(user.id);
  return json(
    { ok: true, user: toPublicUser(user) },
    200,
    { 'Set-Cookie': sessionSetCookie(token, isHttps(request)) },
  );
}

async function handleLogout(request: Request): Promise<Response> {
  if (!sameOriginOk(request)) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  const token = getCookieValue(request, SESSION_COOKIE);
  if (token) await deleteSession(token);
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}

async function handleMe(request: Request): Promise<Response> {
  return json({
    ok: true,
    user: await sessionUserResponse(request),
    mailMode: process.env.MAIL_MODE ?? 'console',
  });
}

async function handleSettings(request: Request): Promise<Response> {
  if (!sameOriginOk(request)) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  const limited = await limitOrError(request, 'settings-ip', 30, 15 * 60 * 1000);
  if (limited) return limited;

  const sessionUser = await sessionUserFromRequest(request);
  if (!sessionUser) {
    return json({ ok: false, error: 'Inicia sesión para cambiar la configuración.' }, 401);
  }

  const body = await readJson(request);
  if (!body || typeof body.otpOnLogin !== 'boolean') {
    return json({ ok: false, error: 'Petición inválida.' }, 400);
  }

  await updateUserOtpOnLogin(sessionUser.id, body.otpOnLogin);
  const updated = await getUserByIdentifier(sessionUser.username);
  return json({ ok: true, user: toPublicUser(updated ?? sessionUser) });
}

async function handleAccountDelete(request: Request): Promise<Response> {
  if (!sameOriginOk(request)) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  const limited = await limitOrError(request, 'delete-ip', 5, 15 * 60 * 1000);
  if (limited) return limited;

  const sessionUser = await sessionUserFromRequest(request);
  if (!sessionUser) {
    return json({ ok: false, error: 'Inicia sesión para eliminar la cuenta.' }, 401);
  }

  const body = await readJson(request);
  const password = String(body?.password ?? '');
  if (!password) {
    return json({ ok: false, error: 'Introduce tu contraseña para confirmar.' }, 400);
  }
  if (!verifyPassword(password, sessionUser.password_hash)) {
    return json({ ok: false, error: 'La contraseña no es correcta.' }, 401);
  }

  await deleteUser(sessionUser.id);
  const token = getCookieValue(request, SESSION_COOKIE);
  if (token) await deleteSession(token);
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}

/* ── Auxiliar (mismo criterio que clientKey) ────────────────────────────── */

function clientKeySafe(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  const ip = fwd ? fwd.split(',')[0]?.trim() : 'local';
  return `login:${ip || 'local'}`;
}

export default async (request: Request): Promise<Response> => route(request);
