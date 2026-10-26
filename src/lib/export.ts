// Exportar / importar. "Tus datos son tuyos": JSON completo, Markdown legible y CSV.
import { strToU8, zipSync } from 'fflate';
import { db } from '../db/db';
import { entryTitle } from '../db/repo';
import { mergeSnapshot, type Snapshot } from '../sync/engine';
import { TABLES, type Attachment, type Entry, type Task } from '../db/types';
import { todayISO } from './dates';

export function download(name: string, data: Blob) {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const blobToDataURL = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(b);
  });

async function dataURLToBlob(s: string): Promise<Blob> {
  return (await fetch(s)).blob();
}

export async function exportJSON(includeFiles = true) {
  const out: Record<string, unknown> = { app: 'bitacora', version: 1, exportedAt: new Date().toISOString() };
  for (const name of TABLES) {
    const rows = await (db as any)[name].toArray();
    if (name === 'attachments') {
      out[name] = includeFiles
        ? await Promise.all(rows.map(async (a: Attachment) => ({ ...a, blob: a.blob ? await blobToDataURL(a.blob) : null })))
        : [];
    } else out[name] = rows;
  }
  download(`bitacora-backup-${todayISO()}.json`, new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
}

export async function importJSON(file: File) {
  const data = JSON.parse(await file.text());
  if (data?.app !== 'bitacora') throw new Error('Este archivo no parece un backup de Notipeng.');
  if (Array.isArray(data.attachments)) {
    data.attachments = await Promise.all(
      data.attachments.map(async (a: any) => ({ ...a, blob: typeof a.blob === 'string' ? await dataURLToBlob(a.blob) : a.blob })),
    );
  }
  return mergeSnapshot(data as Snapshot);
}

// ─── Markdown ────────────────────────────────────────────────────────────────

const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'sin-titulo';

const fm = (o: Record<string, unknown>) =>
  '---\n' +
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(', ')}]` : JSON.stringify(v)}`)
    .join('\n') +
  '\n---\n\n';

const check = (t: Task) => `- [${t.status === 'hecha' ? 'x' : ' '}] ${t.title}${t.due ? ` (📅 ${t.due})` : ''}`;

export async function exportMarkdown() {
  const files: Record<string, Uint8Array> = {};
  const used = new Set<string>();
  const put = (path: string, text: string) => {
    let p = path;
    let i = 2;
    while (used.has(p)) p = path.replace(/\.md$/, `-${i++}.md`);
    used.add(p);
    files[p] = strToU8(text);
  };
  const alive = <T extends { deletedAt?: number | null }>(x: T) => !x.deletedAt;
  const [entries, projects, phases, tasks, goals, areas] = await Promise.all([
    db.entries.filter(alive).toArray(),
    db.projects.filter(alive).toArray(),
    db.phases.filter(alive).toArray(),
    db.tasks.filter(alive).toArray(),
    db.goals.filter(alive).toArray(),
    db.areas.filter(alive).toArray(),
  ]);
  const areaName = (id?: string | null) => areas.find((a) => a.id === id)?.name;
  const folder: Record<Entry['kind'], string> = { inbox: 'bandeja', note: 'notas', journal: 'diario', idea: 'ideas' };

  for (const e of entries) {
    if (e.kind === 'inbox' && e.archived) continue;
    const title = entryTitle(e);
    const date = e.date ?? new Date(e.createdAt).toISOString().slice(0, 10);
    put(
      `${folder[e.kind]}/${date}-${slug(title)}.md`,
      fm({ titulo: title, fecha: date, etiquetas: e.tags, area: areaName(e.areaId), estado: e.ideaStatus, prioridad: e.priority, categoria: e.category }) +
        (e.title ? `# ${e.title}\n\n` : '') +
        e.body +
        '\n',
    );
  }
  for (const p of projects) {
    const pt = tasks.filter((t) => t.projectId === p.id).sort((a, b) => a.order - b.order);
    const ph = phases.filter((x) => x.projectId === p.id).sort((a, b) => a.order - b.order);
    let md = fm({ estado: p.status, inicio: p.startDate, objetivo_fecha: p.targetDate, etiquetas: p.tags, area: areaName(p.areaId), prioridad: p.priority });
    md += `# ${p.title}\n\n`;
    if (p.objective) md += `**Objetivo:** ${p.objective}\n\n`;
    if (p.description) md += `${p.description}\n\n`;
    if (ph.length) {
      md += `## Roadmap\n\n`;
      for (const f of ph) {
        md += `### ${f.title}\n\n${pt.filter((t) => t.phaseId === f.id).map(check).join('\n') || '_(sin tareas)_'}\n\n`;
      }
    }
    md += `## Plan de acción\n\n${pt.map(check).join('\n') || '_(sin tareas)_'}\n\n`;
    if (p.links.length) md += `## Enlaces\n\n${p.links.map((l) => `- [${l.title || l.url}](${l.url})`).join('\n')}\n`;
    put(`proyectos/${slug(p.title)}.md`, md);
  }
  for (const g of goals) {
    const gp = projects.filter((p) => p.goalId === g.id);
    put(
      `objetivos/${slug(g.title)}.md`,
      fm({ estado: g.status, fecha_objetivo: g.targetDate, etiquetas: g.tags }) +
        `# ${g.title}\n\n${g.description}\n\n## Proyectos\n\n${gp.map((p) => `- ${p.title}`).join('\n')}\n\n## Tareas\n\n${tasks.filter((t) => t.goalId === g.id).map(check).join('\n')}\n`,
    );
  }
  const loose = tasks.filter((t) => !t.projectId).sort((a, b) => (a.due ?? '9').localeCompare(b.due ?? '9'));
  put('tareas.md', `# Tareas sueltas\n\n${loose.map(check).join('\n')}\n`);

  download(`bitacora-markdown-${todayISO()}.zip`, new Blob([zipSync(files) as BlobPart], { type: 'application/zip' }));
}

export async function exportTasksCSV() {
  const [tasks, projects] = await Promise.all([db.tasks.filter((t) => !t.deletedAt).toArray(), db.projects.toArray()]);
  const pname = (id?: string | null) => projects.find((p) => p.id === id)?.title ?? '';
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['titulo', 'estado', 'prioridad', 'fecha', 'hora', 'proyecto', 'etiquetas', 'notas', 'creada', 'completada'],
    ...tasks.map((t) => [
      t.title, t.status, t.priority, t.due, t.time, pname(t.projectId), t.tags.join(' '), t.notes,
      new Date(t.createdAt).toISOString(), t.completedAt ? new Date(t.completedAt).toISOString() : '',
    ]),
  ];
  const csv = '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
  download(`bitacora-tareas-${todayISO()}.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8' }));
}
