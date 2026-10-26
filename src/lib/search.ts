// Búsqueda global en memoria. Para un uso personal (miles de registros) es instantánea
// y no necesita índices externos. "#etiqueta" filtra por etiqueta.
import { db } from '../db/db';
import { entryTitle } from '../db/repo';

export type ResultType = 'inbox' | 'note' | 'journal' | 'idea' | 'project' | 'task' | 'goal' | 'event';

export interface SearchResult {
  type: ResultType;
  id: string;
  title: string;
  snippet: string;
  href: string;
  score: number;
  updatedAt: number;
  tags: string[];
}

export const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const TYPE_LABEL: Record<ResultType, string> = {
  inbox: 'Bandeja',
  note: 'Nota',
  journal: 'Diario',
  idea: 'Idea',
  project: 'Proyecto',
  task: 'Tarea',
  goal: 'Objetivo',
  event: 'Evento',
};

function snippetAround(text: string, q: string): string {
  if (!text) return '';
  const n = norm(text);
  const i = q ? n.indexOf(q) : -1;
  const start = Math.max(0, i - 40);
  const s = text.slice(start, start + 140).replace(/\s+/g, ' ').trim();
  return (start > 0 ? '…' : '') + s;
}

export async function searchAll(raw: string, limit = 40): Promise<SearchResult[]> {
  const tagFilters: string[] = [];
  const text = raw.replace(/#([\p{L}\p{N}_-]+)/gu, (_, t) => {
    tagFilters.push(norm(t));
    return ' ';
  });
  const terms = norm(text).split(/\s+/).filter(Boolean);
  if (!terms.length && !tagFilters.length) return [];

  const [entries, projects, tasks, goals, events] = await Promise.all([
    db.entries.filter((e) => !e.deletedAt && !(e.kind === 'inbox' && e.archived)).toArray(),
    db.projects.filter((p) => !p.deletedAt).toArray(),
    db.tasks.filter((t) => !t.deletedAt).toArray(),
    db.goals.filter((g) => !g.deletedAt).toArray(),
    db.events.filter((e) => !e.deletedAt).toArray(),
  ]);

  const out: SearchResult[] = [];
  const consider = (r: Omit<SearchResult, 'score' | 'snippet'>, body: string) => {
    const tagsN = r.tags.map(norm);
    if (tagFilters.some((t) => !tagsN.includes(t))) return;
    const title = norm(r.title);
    const bodyN = norm(body);
    let score = 0;
    for (const t of terms) {
      if (title.startsWith(t)) score += 6;
      else if (title.includes(t)) score += 4;
      else if (tagsN.some((x) => x.includes(t))) score += 3;
      else if (bodyN.includes(t)) score += 1;
      else return; // todos los términos deben aparecer
    }
    if (!terms.length) score = 1;
    // Lo reciente pesa un poco más.
    score += Math.max(0, 1 - (Date.now() - r.updatedAt) / (30 * 86400000));
    out.push({ ...r, score, snippet: snippetAround(body, terms[0] ?? '') });
  };

  for (const e of entries)
    consider({ type: e.kind, id: e.id, title: entryTitle(e), href: `/e/${e.id}`, updatedAt: e.updatedAt, tags: e.tags }, e.title ? e.body : e.body.split('\n').slice(1).join(' '));
  for (const p of projects)
    consider({ type: 'project', id: p.id, title: p.title, href: `/proyectos/${p.id}`, updatedAt: p.updatedAt, tags: p.tags }, `${p.objective} ${p.description}`);
  for (const t of tasks)
    consider({ type: 'task', id: t.id, title: t.title, href: `/tareas?t=${t.id}`, updatedAt: t.updatedAt, tags: t.tags }, t.notes);
  for (const g of goals)
    consider({ type: 'goal', id: g.id, title: g.title, href: `/objetivos/${g.id}`, updatedAt: g.updatedAt, tags: g.tags }, g.description);
  for (const ev of events)
    consider({ type: 'event', id: ev.id, title: ev.title, href: `/calendario?d=${ev.date}`, updatedAt: ev.updatedAt, tags: [] }, ev.notes);

  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Todas las etiquetas con su número de usos. */
export async function allTags(): Promise<{ tag: string; count: number }[]> {
  const counts = new Map<string, number>();
  const add = (tags?: string[]) => tags?.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
  (await db.entries.filter((e) => !e.deletedAt && !(e.kind === 'inbox' && e.archived)).toArray()).forEach((e) => add(e.tags));
  (await db.projects.filter((p) => !p.deletedAt).toArray()).forEach((p) => add(p.tags));
  (await db.tasks.filter((t) => !t.deletedAt).toArray()).forEach((t) => add(t.tags));
  (await db.goals.filter((g) => !g.deletedAt).toArray()).forEach((g) => add(g.tags));
  return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
