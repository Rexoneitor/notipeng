// Motor de sincronización local-first. Lo usan la importación de backups (JSON)
// y la sincronización en la nube (src/sync/cloud.ts): ambos fusionan con la misma regla.
import type { Table } from 'dexie';
import { db } from '../db/db';
import { TABLES, type Base, type TableName } from '../db/types';

export type Snapshot = Partial<Record<TableName, Base[]>>;

/** true mientras se aplican cambios remotos: evita reenviarlos como si fueran locales. */
export let applyingRemote = false;

function tbl(name: TableName): Table<Base, string> {
  return (db as unknown as Record<TableName, Table<Base, string>>)[name];
}

/** Cambios locales desde `since` (reloj de este dispositivo). */
export async function localChanges(since: number): Promise<Snapshot> {
  const out: Snapshot = {};
  for (const name of TABLES) {
    out[name] = await tbl(name).filter((r) => (r.updatedAt ?? 0) > since).toArray();
  }
  return out;
}

/**
 * Fusión last-write-wins por registro: gana el `updatedAt` más reciente.
 * Idempotente: aplicar dos veces lo mismo no duplica nada.
 */
export async function mergeSnapshot(snap: Snapshot) {
  const stats = { added: 0, updated: 0, skipped: 0 };
  applyingRemote = true;
  try {
    await db.transaction('rw', db.tables, async () => {
      for (const name of TABLES) {
        const incoming = snap[name];
        if (!Array.isArray(incoming)) continue;
        const t = tbl(name);
        for (const rec of incoming) {
          if (!rec || typeof rec.id !== 'string') continue;
          const local = await t.get(rec.id);
          if (!local) {
            await t.put(rec);
            stats.added++;
          } else if ((rec.updatedAt ?? 0) > (local.updatedAt ?? 0)) {
            await t.put(rec);
            stats.updated++;
          } else stats.skipped++;
        }
      }
    });
  } finally {
    applyingRemote = false;
  }
  return stats;
}

/** Ejecuta escrituras que vienen de fuera (p. ej. descargar un adjunto) sin disparar una nueva subida. */
export async function asRemote<T>(fn: () => Promise<T>): Promise<T> {
  applyingRemote = true;
  try {
    return await fn();
  } finally {
    applyingRemote = false;
  }
}
