// Sincronización en la nube con Supabase.
//
// Cada dispositivo guarda una copia completa en IndexedDB (funciona sin conexión) y
// la nube actúa como punto de encuentro:
//   1. SUBIR: los registros cambiados aquí desde la última subida → push_records()
//      (en el servidor gana la versión con updatedAt más reciente).
//   2. BAJAR: los registros que llegaron al servidor después del último `rev` visto
//      → mergeSnapshot() local (misma regla).
//   3. ARCHIVOS: los adjuntos viajan aparte, al bucket privado `attachments`.
// Se sincroniza al abrir, al volver a la app, al recuperar conexión, tras cada cambio
// (con 2 s de margen), cada minuto y al instante cuando el otro dispositivo cambia algo.
import type { RealtimeChannel, Session, SupabaseClient } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';
import { db } from '../db/db';
import { dedupeAreas } from '../db/repo';
import { TABLES, type Attachment, type Base, type TableName } from '../db/types';
import { applyingRemote, asRemote, localChanges, mergeSnapshot, type Snapshot } from './engine';

const URL: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const KEY: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const cloudConfigured = !!(URL && KEY);

// ─── Estado observable ──────────────────────────────────────────────────────

export type SyncState = 'off' | 'signed-out' | 'idle' | 'syncing' | 'offline' | 'error';
export interface SyncStatus {
  state: SyncState;
  email?: string;
  lastSync?: number;
  error?: string;
}

let status: SyncStatus = { state: cloudConfigured ? 'signed-out' : 'off' };
const subs = new Set<() => void>();
const setStatus = (p: Partial<SyncStatus>) => {
  status = { ...status, ...p };
  subs.forEach((f) => f());
};

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => { subs.delete(f); }; },
    () => status,
  );
}

// ─── Cliente ────────────────────────────────────────────────────────────────

let client: SupabaseClient | null = null;
let userId: string | null = null;
let channel: RealtimeChannel | null = null;

async function getClient(): Promise<SupabaseClient> {
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(URL!, KEY!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'bitacora.auth' },
    });
  }
  return client;
}

// Cursores por usuario: hasta qué `rev` del servidor hemos bajado y cuándo subimos por última vez.
interface Cursor { lastRev: number; lastPush: number }
const cursorKey = () => `bitacora.sync.${userId}`;
const loadCursor = (): Cursor => {
  try {
    return { lastRev: 0, lastPush: 0, ...JSON.parse(localStorage.getItem(cursorKey()) || '{}') };
  } catch {
    return { lastRev: 0, lastPush: 0 };
  }
};
const saveCursor = (c: Cursor) => localStorage.setItem(cursorKey(), JSON.stringify(c));

// Versiones que ya vinieron del servidor: no hace falta devolverlas (ni resubir sus archivos).
const seenKey = () => `bitacora.seen.${userId}`;
const loadSeen = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(seenKey()) || '{}');
  } catch {
    return {};
  }
};
const saveSeen = (m: Record<string, number>) => {
  try {
    localStorage.setItem(seenKey(), JSON.stringify(m));
  } catch {}
};

/** Tras importar un backup: vuelve a subirlo todo (el servidor descarta lo que ya tenga más nuevo). */
export function forceFullPush() {
  if (!userId) return;
  saveCursor({ ...loadCursor(), lastPush: 0 });
  syncNow();
}

// ─── Sesión ─────────────────────────────────────────────────────────────────

function onSession(s: Session | null) {
  const id = s?.user.id ?? null;
  if (id === userId) return;
  userId = id;
  channel?.unsubscribe();
  channel = null;
  if (!id) {
    setStatus({ state: 'signed-out', email: undefined, lastSync: undefined, error: undefined });
    return;
  }
  setStatus({ state: 'idle', email: s!.user.email ?? undefined });
  subscribeRealtime();
  syncNow();
}

export async function signIn(email: string, password: string) {
  const c = await getClient();
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(translate(error.message));
}

/** Devuelve true si la cuenta quedó lista; false si hay que confirmar el correo. */
export async function signUp(email: string, password: string): Promise<boolean> {
  const c = await getClient();
  const { data, error } = await c.auth.signUp({ email, password });
  if (error) throw new Error(translate(error.message));
  return !!data.session;
}

export async function signOut() {
  const c = await getClient();
  await c.auth.signOut();
}

function translate(msg: string) {
  if (/invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.';
  if (/email not confirmed/i.test(msg)) return 'Falta confirmar el correo (revisa tu bandeja, o desactiva "Confirm email" en Supabase).';
  if (/already registered/i.test(msg)) return 'Ese correo ya tiene cuenta: usa "Entrar".';
  if (/signups not allowed|signup is disabled/i.test(msg)) return 'El registro de cuentas nuevas está desactivado en Supabase.';
  if (/password should be at least/i.test(msg)) return 'La contraseña debe tener al menos 6 caracteres.';
  if (/failed to fetch|network/i.test(msg)) return 'Sin conexión con el servidor.';
  return msg;
}

// ─── Ciclo de sincronización ────────────────────────────────────────────────

let running = false;
let again = false;

export async function syncNow() {
  if (!userId) return;
  if (!navigator.onLine) {
    setStatus({ state: 'offline' });
    return;
  }
  if (running) {
    again = true;
    return;
  }
  running = true;
  setStatus({ state: 'syncing' });
  try {
    do {
      again = false;
      await cycle();
    } while (again);
    setStatus({ state: 'idle', lastSync: Date.now(), error: undefined });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    setStatus({ state: navigator.onLine ? 'error' : 'offline', error: translate(msg) });
  } finally {
    running = false;
  }
}

const path = (id: string) => `${userId}/${id}`;

async function cycle() {
  const c = await getClient();
  const uid = userId;
  const cur = loadCursor();
  const seen = loadSeen();
  const started = Date.now();

  // 1. SUBIR
  const changes = await localChanges(cur.lastPush);
  const rows: { tbl: TableName; id: string; data: unknown; updated_at: number; deleted_at: number | null }[] = [];
  for (const name of TABLES) {
    for (const r of changes[name] ?? []) {
      if (seen[`${name}:${r.id}`] === r.updatedAt) continue;
      let data: Base = r;
      if (name === 'attachments') {
        const { blob, ...meta } = r as Attachment;
        if (!meta.deletedAt && blob) {
          const up = await c.storage.from('attachments').upload(path(r.id), blob, { upsert: true, contentType: meta.mime });
          if (up.error) throw up.error;
        } else if (meta.deletedAt) {
          await c.storage.from('attachments').remove([path(r.id)]);
        }
        data = meta as Base;
      }
      rows.push({ tbl: name, id: r.id, data, updated_at: r.updatedAt ?? 0, deleted_at: r.deletedAt ?? null });
    }
  }
  for (let i = 0; i < rows.length; i += 400) {
    const { error } = await c.rpc('push_records', { rows: rows.slice(i, i + 400) });
    if (error) throw error;
  }
  if (userId !== uid) return; // cambió la sesión a mitad
  cur.lastPush = started;
  saveCursor(cur);

  // 2. BAJAR (con un pequeño solape: la fusión es idempotente)
  let since = cur.lastRev > 0 ? Math.max(0, cur.lastRev - 50) : 0;
  let maxRev = cur.lastRev;
  for (;;) {
    const { data, error } = await c
      .from('records')
      .select('tbl,id,data,rev')
      .gt('rev', since)
      .order('rev', { ascending: true })
      .limit(1000);
    if (error) throw error;
    if (!data?.length) break;
    const snap: Snapshot = {};
    for (const row of data as { tbl: TableName; id: string; data: Base; rev: number }[]) {
      if (!TABLES.includes(row.tbl)) continue;
      let rec = row.data;
      if (row.tbl === 'attachments') {
        // El archivo se descarga aparte; conservamos el que ya tengamos.
        const local = await db.attachments.get(row.id);
        rec = { ...rec, blob: local?.blob ?? null } as Base;
      }
      (snap[row.tbl] ??= []).push(rec);
      seen[`${row.tbl}:${row.id}`] = rec.updatedAt;
      maxRev = Math.max(maxRev, row.rev);
    }
    await mergeSnapshot(snap);
    since = (data[data.length - 1] as { rev: number }).rev;
    if (data.length < 1000) break;
  }
  cur.lastRev = maxRev;
  saveCursor(cur);
  saveSeen(seen);

  // 3. ARCHIVOS que faltan en este dispositivo
  const missing = await db.attachments.filter((a) => !a.deletedAt && !a.blob).toArray();
  for (const a of missing) {
    const { data, error } = await c.storage.from('attachments').download(path(a.id));
    if (!error && data) await asRemote(() => db.attachments.update(a.id, { blob: data }));
  }

  // Si se unieron áreas duplicadas, sube el resultado en otra pasada.
  if (await asRemote(dedupeAreas)) again = true;
}

// ─── Disparadores ───────────────────────────────────────────────────────────

let debounce: number | undefined;
function onLocalWrite() {
  if (applyingRemote || !userId) return;
  clearTimeout(debounce);
  debounce = window.setTimeout(syncNow, 2000);
}

function subscribeRealtime() {
  if (!client || !userId) return;
  channel = client
    .channel(`records-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'records', filter: `user_id=eq.${userId}` }, () => {
      clearTimeout(debounce);
      debounce = window.setTimeout(syncNow, 600);
    })
    .subscribe();
}

let started = false;
export async function initCloud() {
  if (!cloudConfigured || started) return;
  started = true;

  // Cualquier escritura local (que cambie updatedAt) programa una subida.
  for (const t of db.tables) {
    t.hook('creating', () => { onLocalWrite(); });
    t.hook('updating', (mods) => { if ('updatedAt' in (mods as object)) onLocalWrite(); });
  }

  window.addEventListener('online', () => syncNow());
  window.addEventListener('offline', () => setStatus({ state: 'offline' }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncNow();
  });
  window.setInterval(() => {
    if (document.visibilityState === 'visible') syncNow();
  }, 60_000);

  const c = await getClient();
  // Supabase recomienda no llamar a la API dentro del callback: diferimos.
  c.auth.onAuthStateChange((_e, s) => { setTimeout(() => onSession(s), 0); });
  const { data } = await c.auth.getSession();
  onSession(data.session);
}
