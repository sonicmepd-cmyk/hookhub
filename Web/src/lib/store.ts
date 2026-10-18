/**
 * Almacén clave-valor para la API de cuentas.
 * - En Netlify (producción o `netlify dev`): Netlify Blobs, persistente.
 * - Fuera de Netlify (depuración con node a pelo): ficheros en data/kv/.
 */

export interface KV {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  del(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

/* ── Backend local: un fichero por clave ────────────────────────────────── */

import { mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

class FileKV implements KV {
  private dir: string;

  constructor(dir: string) {
    this.dir = dir;
    mkdirSync(dir, { recursive: true });
  }

  private file(key: string): string {
    return join(this.dir, encodeURIComponent(key) + '.json');
  }

  async get<T>(key: string): Promise<T | null> {
    const file = this.file(key);
    if (!existsSync(file)) return null;
    try {
      return JSON.parse(readFileSync(file, 'utf8')) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    writeFileSync(this.file(key), JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    rmSync(this.file(key), { force: true });
  }

  async list(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    for (const name of readdirSync(this.dir)) {
      if (!name.endsWith('.json')) continue;
      try {
        const key = decodeURIComponent(name.slice(0, -'.json'.length));
        if (key.startsWith(prefix)) keys.push(key);
      } catch {
        /* nombre ilegible: se ignora */
      }
    }
    return keys;
  }
}

/* ── Backend Netlify Blobs ──────────────────────────────────────────────── */

interface BlobsStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options: { prefix: string }): Promise<{ blobs: { name: string }[] }>;
}

class BlobsKV implements KV {
  constructor(private store: BlobsStore) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.store.get(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.store.set(key, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.store.delete(key);
  }

  async list(prefix: string): Promise<string[]> {
    const { blobs } = await this.store.list({ prefix });
    return blobs.map((b) => b.name);
  }
}

/* ── Selección del backend ──────────────────────────────────────────────── */

async function createBackend(): Promise<KV> {
  if (process.env.NETLIFY || process.env.NETLIFY_DEV) {
    try {
      const { getStore } = await import('@netlify/blobs');
      return new BlobsKV(getStore('hookhub-auth') as unknown as BlobsStore);
    } catch (error) {
      console.warn('[store] Netlify Blobs no disponible, uso almacenamiento local:', error);
    }
  }
  const dir = process.env.KV_DIR ?? join(process.cwd(), 'data', 'kv');
  return new FileKV(dir);
}

export const kvPromise = createBackend();

export async function kv(): Promise<KV> {
  return kvPromise;
}
