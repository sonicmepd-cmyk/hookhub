import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';
import { kv } from './store';

export const SESSION_COOKIE = 'hh_session';
const SESSION_TTL_S = 30 * 24 * 60 * 60; // 30 días
const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutos
const CODE_MAX_ATTEMPTS = 5;

export type CodePurpose = 'register' | 'login';

export interface UserRecord {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  otp_on_login: number;
  verified: number;
  created_at: string;
}

export interface PublicUser {
  id: number;
  username: string;
  email: string;
  otpOnLogin: boolean;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    otpOnLogin: user.otp_on_login === 1,
  };
}

/* ── Contraseñas (scrypt, sin dependencias nativas) ─────────────────────── */

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, n, r, p, saltB64, hashB64] = stored.split('$');
    if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
    const expected = Buffer.from(hashB64, 'base64');
    const actual = scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Hash constante para comparar contraseñas sin adivinar por tiempos. */
export function dummyPasswordCheck(): void {
  verifyPassword('dummy', hashPassword('dummy-password-for-timing'));
}

/* ── Utilidades de claves KV ────────────────────────────────────────────── */

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

interface SessionRow {
  user_id: number;
  expires_at: string;
}

interface CodeRow {
  hash: string;
  attempts: number;
  expires_at: string;
}

/* ── Usuarios ───────────────────────────────────────────────────────────── */

export async function createUser(input: {
  username: string;
  email: string;
  passwordHash: string;
}): Promise<UserRecord> {
  const store = await kv();
  // id aleatorio: sin contador que pueda entrar en carrera entre funciones
  let id = randomInt(1, 2 ** 42);
  while (await store.get(`user:${id}`)) id = randomInt(1, 2 ** 42);
  const user: UserRecord = {
    id,
    username: input.username,
    email: input.email,
    password_hash: input.passwordHash,
    otp_on_login: 0,
    verified: 0,
    created_at: new Date().toISOString(),
  };
  await store.set(`user:${id}`, user);
  await store.set(`email:${user.email}`, id);
  await store.set(`username:${user.username}`, id);
  return user;
}

export async function getUserById(id: number): Promise<UserRecord | undefined> {
  const store = await kv();
  return (await store.get<UserRecord>(`user:${id}`)) ?? undefined;
}

export async function getUserByEmail(email: string): Promise<UserRecord | undefined> {
  const store = await kv();
  const id = await store.get<number>(`email:${email}`);
  if (id == null) return undefined;
  return getUserById(id);
}

export async function getUserByUsername(username: string): Promise<UserRecord | undefined> {
  const store = await kv();
  const id = await store.get<number>(`username:${username}`);
  if (id == null) return undefined;
  return getUserById(id);
}

export async function getUserByIdentifier(identifier: string): Promise<UserRecord | undefined> {
  return (await getUserByEmail(identifier)) ?? (await getUserByUsername(identifier));
}

export async function markUserVerified(id: number): Promise<void> {
  const store = await kv();
  const user = await getUserById(id);
  if (!user) return;
  await store.set(`user:${id}`, { ...user, verified: 1 });
}

export async function updateUserOtpOnLogin(id: number, on: boolean): Promise<void> {
  const store = await kv();
  const user = await getUserById(id);
  if (!user) return;
  await store.set(`user:${id}`, { ...user, otp_on_login: on ? 1 : 0 });
}

export async function deleteUser(id: number): Promise<void> {
  const store = await kv();
  const user = await getUserById(id);
  if (!user) return;
  await store.del(`user:${id}`);
  await store.del(`email:${user.email}`);
  await store.del(`username:${user.username}`);
  await deleteUserSessions(id);
  for (const purpose of ['register', 'login'] as const) {
    await store.del(`code:${id}:${purpose}`);
  }
}

/* ── Sesiones ───────────────────────────────────────────────────────────── */

export async function createSession(userId: number): Promise<string> {
  const store = await kv();
  const token = randomBytes(32).toString('base64url');
  const hash = sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_S * 1000).toISOString();
  await store.set(`session:${hash}`, { user_id: userId, expires_at: expiresAt });
  await store.set(`usession:${userId}:${hash}`, 1);
  return token;
}

export async function getSessionUser(token: string): Promise<UserRecord | undefined> {
  const store = await kv();
  const hash = sha256(token);
  const session = await store.get<SessionRow>(`session:${hash}`);
  if (!session || Date.parse(session.expires_at) <= Date.now()) {
    if (session) await store.del(`session:${hash}`);
    return undefined;
  }
  return getUserById(session.user_id);
}

export async function deleteSession(token: string): Promise<void> {
  const store = await kv();
  const hash = sha256(token);
  const session = await store.get<SessionRow>(`session:${hash}`);
  if (!session) return;
  await store.del(`session:${hash}`);
  await store.del(`usession:${session.user_id}:${hash}`);
}

export async function deleteUserSessions(userId: number): Promise<void> {
  const store = await kv();
  const keys = await store.list(`usession:${userId}:`);
  for (const key of keys) {
    const hash = key.slice(`usession:${userId}:`.length);
    await store.del(`session:${hash}`);
    await store.del(key);
  }
}

export { SESSION_TTL_S };

/* ── Códigos de verificación ────────────────────────────────────────────── */

export async function createVerificationCode(
  userId: number,
  purpose: CodePurpose,
): Promise<string> {
  const store = await kv();
  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
  await store.set(`code:${userId}:${purpose}`, { hash: sha256(code), attempts: 0, expires_at: expiresAt });
  return code;
}

export async function verifyVerificationCode(
  userId: number,
  purpose: CodePurpose,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const store = await kv();
  const key = `code:${userId}:${purpose}`;
  const row = await store.get<CodeRow>(key);

  if (!row || Date.parse(row.expires_at) <= Date.now()) {
    await store.del(key);
    return { ok: false, error: 'El código ha caducado. Solicita uno nuevo.' };
  }
  if (row.attempts >= CODE_MAX_ATTEMPTS) {
    await store.del(key);
    return { ok: false, error: 'Demasiados intentos. Solicita un código nuevo.' };
  }
  await store.set(key, { ...row, attempts: row.attempts + 1 });
  if (sha256(code) !== row.hash) {
    return { ok: false, error: 'El código no es correcto.' };
  }
  await store.del(key);
  return { ok: true };
}

/* ── Límites por clave (IP o identificador) ─────────────────────────────── */

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const store = await kv();
  const storeKey = `rl:${key}`;
  const now = Date.now();
  let hits: number[] = (await store.get<number[]>(storeKey)) ?? [];
  hits = hits.filter((t) => Number.isFinite(t) && now - t < windowMs);
  if (hits.length >= limit) {
    await store.set(storeKey, hits);
    return false;
  }
  hits.push(now);
  await store.set(storeKey, hits);
  return true;
}

/* ── Validaciones ───────────────────────────────────────────────────────── */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_RE = /^[a-z0-9_]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.slice(0, 2)}***@${domain}`;
}
