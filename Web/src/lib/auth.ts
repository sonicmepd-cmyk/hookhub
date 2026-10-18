import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';
import { db, type UserRow } from './db';

export const SESSION_COOKIE = 'hh_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutos
const CODE_MAX_ATTEMPTS = 5;

export type CodePurpose = 'register' | 'login';

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

/** Hash constante para comparar códigos sin adivinar por tiempos. */
export function dummyPasswordCheck(): void {
  verifyPassword('dummy', hashPassword('dummy-password-for-timing'));
}

/* ── Sesiones ───────────────────────────────────────────────────────────── */

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function createSession(userId: number): string {
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
  ).run(sha256(token), userId, expires);
  return token;
}

export function getUserBySessionToken(token: string): UserRow | undefined {
  const row = db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > datetime('now')`,
    )
    .get(sha256(token)) as UserRow | undefined;
  return row;
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

export function deleteUserSessions(userId: number): void {
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
    secure: false, // se ajusta en la ruta que lee el protocolo real
  };
}

/* ── Códigos de verificación ────────────────────────────────────────────── */

export function createVerificationCode(userId: number, purpose: CodePurpose): string {
  const code = String(randomInt(100000, 1000000));
  db.prepare('DELETE FROM codes WHERE user_id = ? AND purpose = ?').run(userId, purpose);
  const expires = new Date(Date.now() + CODE_TTL_MS).toISOString();
  db.prepare(
    'INSERT INTO codes (user_id, purpose, code_hash, expires_at) VALUES (?, ?, ?, ?)',
  ).run(userId, purpose, sha256(code), expires);
  return code;
}

export function verifyVerificationCode(
  userId: number,
  purpose: CodePurpose,
  code: string,
): { ok: true } | { ok: false; error: string } {
  const row = db
    .prepare(
      'SELECT id, code_hash, attempts, expires_at FROM codes WHERE user_id = ? AND purpose = ? ORDER BY id DESC LIMIT 1',
    )
    .get(userId, purpose) as
    | { id: number; code_hash: string; attempts: number; expires_at: string }
    | undefined;

  if (!row || Date.parse(row.expires_at) <= Date.now()) {
    db.prepare('DELETE FROM codes WHERE user_id = ? AND purpose = ?').run(userId, purpose);
    return { ok: false, error: 'El código ha caducado. Solicita uno nuevo.' };
  }
  if (row.attempts >= CODE_MAX_ATTEMPTS) {
    db.prepare('DELETE FROM codes WHERE id = ?').run(row.id);
    return { ok: false, error: 'Demasiados intentos. Solicita un código nuevo.' };
  }
  db.prepare('UPDATE codes SET attempts = attempts + 1 WHERE id = ?').run(row.id);
  if (sha256(code) !== row.code_hash) {
    return { ok: false, error: 'El código no es correcto.' };
  }
  db.prepare('DELETE FROM codes WHERE id = ?').run(row.id);
  return { ok: true };
}

/* ── Límites por clave (IP o identificador) ─────────────────────────────── */

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const row = db.prepare('SELECT hits FROM rate_limits WHERE key = ?').get(key) as
    | { hits: string }
    | undefined;
  let hits: number[] = [];
  try {
    hits = row ? (JSON.parse(row.hits) as number[]) : [];
  } catch {
    hits = [];
  }
  hits = hits.filter((t) => Number.isFinite(t) && now - t < windowMs);
  if (hits.length >= limit) {
    db.prepare(
      'INSERT INTO rate_limits (key, hits) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET hits = excluded.hits',
    ).run(key, JSON.stringify(hits));
    return false;
  }
  hits.push(now);
  db.prepare(
    'INSERT INTO rate_limits (key, hits) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET hits = excluded.hits',
  ).run(key, JSON.stringify(hits));
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
