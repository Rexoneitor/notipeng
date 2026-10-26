// Única puerta de escritura a los datos. Sella `updatedAt` en cada cambio
// (base de la sincronización) y contiene las conversiones entre tipos.
import type { Table } from 'dexie';
import { db } from './db';
import { todayISO } from '../lib/dates';
import type {
  Area,
  Attachment,
  Base,
  CalEvent,
  Entry,
  EntryKind,
  Goal,
  ID,
  OwnerType,
  Phase,
  Project,
  Reminder,
  TableName,
  Task,
} from './types';

export const uid = (): ID => crypto.randomUUID();
const now = () => Date.now();

type NewOf<T extends Base> = Omit<T, keyof Base> & Partial<Base>;

function table<T extends Base>(name: TableName): Table<T, string> {
  return (db as unknown as Record<TableName, Table<T, string>>)[name];
}

async function insert<T extends Base>(name: TableName, data: NewOf<T>): Promise<T> {
  const t = now();
  const rec = { id: uid(), createdAt: t, updatedAt: t, deletedAt: null, ...data } as T;
  await table<T>(name).put(rec);
  return rec;
}

export async function patch<T extends Base>(name: TableName, id: ID, changes: Partial<T>) {
  await table<T>(name).update(id, { ...changes, updatedAt: now() } as any);
}

/** Marca de "abierto recientemente". No cambia updatedAt (es metadato de vista). */
export async function touchOpened(name: 'entries' | 'projects' | 'goals', id: ID) {
  await table<any>(name).update(id, { openedAt: now() });
}

/** Borrado lógico → Papelera. Proyectos y objetivos arrastran lo que les pertenece. */
export async function remove(name: TableName, id: ID) {
  const t = now();
  await db.transaction('rw', db.tables, async () => {
    await table<any>(name).update(id, { deletedAt: t, updatedAt: t });
    if (name === 'projects') {
      await db.tasks.where('projectId').equals(id).modify({ deletedAt: t, updatedAt: t });
      await db.phases.where('projectId').equals(id).modify({ deletedAt: t, updatedAt: t });
      await db.entries.where('projectId').equals(id).modify({ projectId: null, updatedAt: t });
      await db.events.where('projectId').equals(id).modify({ projectId: null, updatedAt: t });
      await db.attachments.where('ownerId').equals(id).modify({ deletedAt: t, updatedAt: t });
    }
    if (name === 'goals') {
      await db.projects.where('goalId').equals(id).modify({ goalId: null, updatedAt: t });
      await db.tasks.where('goalId').equals(id).modify({ goalId: null, updatedAt: t });
    }
    if (name === 'phases') {
      await db.tasks.where('phaseId').equals(id).modify({ phaseId: null, updatedAt: t });
    }
    if (name === 'tasks' || name === 'entries' || name === 'projects' || name === 'goals' || name === 'events') {
      await db.reminders.where('refId').equals(id).modify({ deletedAt: t, updatedAt: t });
    }
    if (name === 'areas') {
      for (const tb of [db.entries, db.projects, db.goals, db.tasks] as Table<any, string>[]) {
        await tb.where('areaId').equals(id).modify({ areaId: null, updatedAt: t });
      }
    }
  });
}

export async function restore(name: TableName, id: ID) {
  const rec = await table<any>(name).get(id);
  if (!rec) return;
  const t = now();
  const when = rec.deletedAt;
  await db.transaction('rw', db.tables, async () => {
    await table<any>(name).update(id, { deletedAt: null, updatedAt: t });
    if (name === 'projects' && when) {
      // Restaura lo que se borró en cascada en el mismo instante.
      await db.tasks.where('projectId').equals(id).filter((x) => x.deletedAt === when).modify({ deletedAt: null, updatedAt: t });
      await db.phases.where('projectId').equals(id).filter((x) => x.deletedAt === when).modify({ deletedAt: null, updatedAt: t });
      await db.attachments.where('ownerId').equals(id).filter((x) => x.deletedAt === when).modify({ deletedAt: null, updatedAt: t });
    }
  });
}

/** Elimina definitivamente (solo desde la Papelera). */
export async function purge(name: TableName, id: ID) {
  await table<any>(name).delete(id);
}

export async function emptyTrash() {
  await db.transaction('rw', db.tables, async () => {
    for (const tb of db.tables) {
      await tb.filter((r: any) => !!r.deletedAt).delete();
    }
  });
}

// ─── Creación ────────────────────────────────────────────────────────────────

export function newEntry(kind: EntryKind, data: Partial<NewOf<Entry>> = {}) {
  return insert<Entry>('entries', {
    kind,
    title: '',
    body: '',
    tags: [],
    date: kind === 'journal' ? todayISO() : null,
    ideaStatus: kind === 'idea' ? 'nueva' : undefined,
    favorite: false,
    archived: false,
    ...data,
  });
}

export function newProject(data: Partial<NewOf<Project>> = {}) {
  return insert<Project>('projects', {
    title: 'Proyecto sin título',
    description: '',
    objective: '',
    status: 'planificacion',
    startDate: todayISO(),
    tags: [],
    links: [],
    favorite: false,
    ...data,
  });
}

export function newTask(data: Partial<NewOf<Task>> = {}) {
  return insert<Task>('tasks', {
    title: '',
    notes: '',
    status: 'pendiente',
    tags: [],
    order: now(),
    ...data,
  });
}

export async function newPhase(projectId: ID, title: string) {
  const existing = await db.phases.where('projectId').equals(projectId).filter((p) => !p.deletedAt).count();
  return insert<Phase>('phases', { projectId, title, note: '', order: existing + 1 });
}

export function newGoal(data: Partial<NewOf<Goal>> = {}) {
  return insert<Goal>('goals', {
    title: 'Objetivo sin título',
    description: '',
    status: 'activo',
    tags: [],
    favorite: false,
    ...data,
  });
}

export async function newArea(name: string, symbol = '◇') {
  const n = await db.areas.filter((a) => !a.deletedAt).count();
  return insert<Area>('areas', { name, symbol, order: n + 1 });
}

export function newEvent(data: Partial<NewOf<CalEvent>> & { title: string; date: string }) {
  return insert<CalEvent>('events', { notes: '', ...data });
}

export function newReminder(data: Partial<NewOf<Reminder>> & { title: string; at: number }) {
  return insert<Reminder>('reminders', { kind: 'recordatorio', done: false, firedAt: null, repeat: 'none', ...data });
}

export async function addAttachment(ownerType: OwnerType, ownerId: ID, file: File) {
  return insert<Attachment>('attachments', {
    ownerType,
    ownerId,
    name: file.name,
    mime: file.type || 'application/octet-stream',
    size: file.size,
    blob: file,
  });
}

// ─── Tareas ──────────────────────────────────────────────────────────────────

export async function setTaskStatus(id: ID, status: Task['status']) {
  await patch<Task>('tasks', id, { status, completedAt: status === 'hecha' ? now() : null });
  if (status === 'hecha') {
    // Una tarea hecha no necesita recordar nada más.
    const t = now();
    await db.reminders.where('refId').equals(id).filter((r) => !r.done).modify({ done: true, updatedAt: t });
  }
}

/** Intercambia el orden con la tarea vecina dentro de la lista dada. */
export async function moveTask(list: Task[], id: ID, dir: -1 | 1) {
  const i = list.findIndex((t) => t.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  const a = list[i];
  const b = list[j];
  const t = now();
  await db.transaction('rw', db.tasks, async () => {
    await db.tasks.update(a.id, { order: b.order, updatedAt: t });
    await db.tasks.update(b.id, { order: a.order === b.order ? a.order + dir : a.order, updatedAt: t });
  });
}

export async function movePhase(list: Phase[], id: ID, dir: -1 | 1) {
  const i = list.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  const t = now();
  await db.transaction('rw', db.phases, async () => {
    await db.phases.update(list[i].id, { order: list[j].order, updatedAt: t });
    await db.phases.update(list[j].id, { order: list[i].order, updatedAt: t });
  });
}

// ─── Conversiones (capturar → organizar → ejecutar) ─────────────────────────

export function firstLine(s: string) {
  return (s.split('\n').find((l) => l.trim()) ?? '').trim();
}

export function entryTitle(e: Pick<Entry, 'title' | 'body'>): string {
  const t = e.title?.trim() || firstLine(e.body);
  return t.length > 140 ? t.slice(0, 137) + '…' : t || 'Sin título';
}

function splitText(e: Entry): { title: string; rest: string } {
  if (e.title.trim()) return { title: e.title.trim(), rest: e.body };
  const lines = e.body.split('\n');
  const idx = lines.findIndex((l) => l.trim());
  return {
    title: (lines[idx] ?? '').trim().slice(0, 200),
    rest: lines.slice(idx + 1).join('\n').trim(),
  };
}

/** Qué le pasa a la entrada original tras convertirse. */
async function markConverted(e: Entry, type: 'project' | 'task' | 'goal', id: ID) {
  const changes: Partial<Entry> = { convertedTo: { type, id } };
  if (e.kind === 'inbox') changes.archived = true; // sale de la bandeja
  if (e.kind === 'idea' && type === 'project') changes.ideaStatus = 'convertida';
  if (type === 'project') changes.projectId = id;
  await patch<Entry>('entries', e.id, changes);
}

export async function entryToTask(e: Entry, extra: Partial<Task> = {}) {
  const { title, rest } = splitText(e);
  const task = await newTask({
    title,
    notes: rest,
    tags: e.tags,
    areaId: e.areaId,
    projectId: e.projectId ?? null,
    priority: e.priority ?? null,
    fromEntryId: e.id,
    ...extra,
  });
  await markConverted(e, 'task', task.id);
  return task;
}

export async function entryToProject(e: Entry) {
  const { title, rest } = splitText(e);
  const project = await newProject({
    title,
    description: rest,
    tags: e.tags,
    areaId: e.areaId,
    priority: e.priority ?? null,
    status: 'planificacion',
    fromEntryId: e.id,
  });
  await markConverted(e, 'project', project.id);
  return project;
}

export async function entryToGoal(e: Entry) {
  const { title, rest } = splitText(e);
  const goal = await newGoal({ title, description: rest, tags: e.tags, areaId: e.areaId, fromEntryId: e.id });
  await markConverted(e, 'goal', goal.id);
  return goal;
}

/** Bandeja → idea / nota / diario: mismo registro, otro tipo. */
export async function changeKind(e: Entry, kind: EntryKind) {
  const changes: Partial<Entry> = { kind };
  if (kind === 'journal' && !e.date) changes.date = todayISO();
  if (kind === 'idea' && !e.ideaStatus) changes.ideaStatus = 'nueva';
  await patch<Entry>('entries', e.id, changes);
}

/**
 * Convierte líneas de una nota en tareas: "- algo", "* algo", "[ ] algo".
 * Las líneas convertidas se marcan "[x]→" en la nota para no duplicarlas.
 */
export async function extractTasks(e: Entry, projectId?: ID | null) {
  const re = /^\s*(?:[-*•]|\[ \])\s+(.+)$/;
  const lines = e.body.split('\n');
  let n = 0;
  const out = [];
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      await newTask({ title: m[1].trim(), projectId: projectId ?? e.projectId ?? null, tags: e.tags, fromEntryId: e.id });
      out.push(line.replace(re, '→ $1'));
      n++;
    } else out.push(line);
  }
  const body = out.join('\n');
  if (n) await patch<Entry>('entries', e.id, { body });
  return { n, body };
}

// ─── Progreso (basado en acciones reales) ───────────────────────────────────

export function progress(tasks: Task[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'hecha').length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function byOrder(a: Task, b: Task) {
  return a.order - b.order;
}

/** El siguiente paso concreto: lo que está en marcha, o lo primero pendiente. */
export function nextStep(tasks: Task[]): Task | undefined {
  const open = tasks.filter((t) => t.status !== 'hecha').sort(byOrder);
  return open.find((t) => t.status === 'progreso') ?? open[0];
}

// ─── Primera vez ─────────────────────────────────────────────────────────────

const DEFAULT_AREAS: [string, string][] = [
  ['Negocios', '◆'],
  ['Universidad', '✎'],
  ['Personal', '●'],
  ['Finanzas', '¤'],
  ['Salud', '✚'],
  ['Proyectos', '▲'],
  ['Aprendizaje', '◎'],
  ['Ideas', '✦'],
];

/**
 * Contenido inicial con ids fijos y updatedAt = 1: así, al sincronizar, todos los
 * dispositivos comparten las mismas áreas y cualquier cambio tuyo siempre gana.
 */
export async function seedIfEmpty() {
  const count = await db.areas.count();
  if (count > 0) return;
  await db.transaction('rw', db.areas, db.entries, async () => {
    if ((await db.areas.count()) > 0) return;
    const t = now();
    let i = 1;
    for (const [name, symbol] of DEFAULT_AREAS) {
      const id = 'area-' + name.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
      await db.areas.put({ id, name, symbol, order: i++, createdAt: t, updatedAt: 1, deletedAt: null });
    }
    await db.entries.put({
      id: 'bienvenida',
      kind: 'inbox',
      title: '',
      tags: [],
      favorite: false,
      archived: false,
      createdAt: t,
      updatedAt: 1,
      deletedAt: null,
      body:
        'Esta es tu Notipeng.\n\nEsto es la Bandeja: todo lo que capturas llega aquí sin que tengas que decidir dónde va. ' +
        'Cuando tengas un momento, procésalo: conviértelo en tarea, idea, nota, proyecto u objetivo, o archívalo.\n\n' +
        'Prueba ahora: pulsa "Archivar" y la bandeja quedará vacía.',
    });
  });
}

/** Une áreas con el mismo nombre (p. ej. tras importar un backup antiguo). Devuelve cuántas unió. */
export async function dedupeAreas(): Promise<number> {
  const areas = (await db.areas.filter((a) => !a.deletedAt).toArray()).sort(
    (a, b) => Number(!b.id.startsWith('area-')) - Number(!a.id.startsWith('area-')) || a.createdAt - b.createdAt,
  );
  const keep = new Map<string, Area>();
  let merged = 0;
  for (const a of areas) {
    const key = a.name.trim().toLowerCase();
    const keeper = keep.get(key);
    if (!keeper) { keep.set(key, a); continue; }
    const t = now();
    await db.transaction('rw', db.tables, async () => {
      for (const tb of [db.entries, db.projects, db.goals, db.tasks] as Table<any, string>[]) {
        await tb.where('areaId').equals(a.id).modify({ areaId: keeper.id, updatedAt: t });
      }
      await db.areas.update(a.id, { deletedAt: t, updatedAt: t });
    });
    merged++;
  }
  return merged;
}

/**
 * Garantiza que exista el perfil (id fijo 'me', updatedAt = 1: cualquier edición tuya gana al sincronizar).
 * Si venías de la versión anterior, recupera el nombre que ya habías escrito en Ajustes.
 */
export async function ensureProfile() {
  if (await db.profile.get('me')) return;
  let name = '';
  try {
    name = JSON.parse(localStorage.getItem('bitacora.prefs') || '{}').name ?? '';
  } catch {}
  await db.profile.put({
    id: 'me',
    name,
    motto: '',
    intentions: [],
    avatar: { sticker: 'sol', color: '#E56037' },
    createdAt: Date.now(),
    updatedAt: 1,
    deletedAt: null,
  });
}
