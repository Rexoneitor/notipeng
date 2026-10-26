import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAreas, useEntry, useGoals, useProjects } from '../db/hooks';
import { changeKind, entryToGoal, entryToProject, entryToTask, extractTasks, patch, remove, restore, touchOpened } from '../db/repo';
import type { Entry, EntryKind, IdeaStatus, Priority } from '../db/types';
import { ago, fmtLong } from '../lib/dates';
import { toast } from '../lib/ui';
import { Attachments } from '../components/Attachments';
import { AutoTextarea, Empty, IDEA_STATUS, Section, TagInput, useDebounced } from '../components/ui';
import { IconArrowLeft, IconStar, IconTrash } from '../components/Icons';

const BACK: Record<EntryKind, [string, string]> = {
  inbox: ['/bandeja', 'Bandeja'],
  note: ['/notas', 'Notas'],
  journal: ['/diario', 'Diario'],
  idea: ['/ideas', 'Ideas'],
};

export function EntryPage() {
  const { id } = useParams();
  const entry = useEntry(id);
  useEffect(() => { if (id) touchOpened('entries', id); }, [id]);
  if (entry === undefined) return <div className="page narrow" />;
  if (!entry || entry.deletedAt)
    return (
      <div className="page narrow">
        <Empty line="Esta entrada no existe o está en la papelera." hint="Puedes recuperarla desde Ajustes → Papelera.">
          <Link to="/" className="btn">Volver a la Mesa</Link>
        </Empty>
      </div>
    );
  return <Editor key={entry.id} e={entry} />;
}

function Editor({ e }: { e: Entry }) {
  const navigate = useNavigate();
  const areas = useAreas() ?? [];
  const projects = useProjects() ?? [];
  const goals = useGoals() ?? [];
  const [title, setTitle] = useState(e.title);
  const [body, setBody] = useState(e.body);
  const pending = useDebounced({ title, body }, (v) => patch<Entry>('entries', e.id, v), 600);
  const set = (p: Partial<Entry>) => patch<Entry>('entries', e.id, p);
  const [backTo, backLabel] = BACK[e.kind];
  const fresh = () => ({ ...e, title, body });
  const hasListLines = /^\s*(?:[-*•]|\[ \])\s+\S/m.test(body);

  const placeholder =
    e.kind === 'journal' ? 'Hoy estuve pensando en…' : e.kind === 'idea' ? '¿De qué va la idea? ¿Para quién? ¿Por qué ahora?' : 'Escribe…';

  return (
    <div className="page narrow">
      <div className="row between mb-2">
        <Link to={backTo} className="btn btn-ghost btn-sm"><IconArrowLeft /> {backLabel}</Link>
        <span className="save-state">{pending ? 'guardando…' : `guardado · ${ago(e.updatedAt)}`}</span>
      </div>

      {e.kind === 'journal' && e.date && <div className="ph-kicker"><b>{fmtLong(e.date)}</b></div>}

      <AutoTextarea
        className="write-title"
        value={title}
        placeholder={e.kind === 'journal' ? 'Título (opcional)' : 'Título'}
        onChange={(ev) => setTitle(ev.target.value)}
        onKeyDown={(ev) => { if (ev.key === 'Enter') { ev.preventDefault(); (document.querySelector('.write-body') as HTMLElement)?.focus(); } }}
        aria-label="Título"
      />

      <div className="editor-meta">
        <label className="meta-field">
          tipo
          <select value={e.kind} onChange={(ev) => changeKind(fresh(), ev.target.value as EntryKind)}>
            <option value="note">Nota</option>
            <option value="journal">Diario</option>
            <option value="idea">Idea</option>
            <option value="inbox">Bandeja</option>
          </select>
        </label>
        {e.kind === 'journal' && (
          <label className="meta-field">
            fecha
            <input type="date" value={e.date ?? ''} onChange={(ev) => set({ date: ev.target.value || null })} />
          </label>
        )}
        {e.kind === 'idea' && (
          <>
            <label className="meta-field">
              estado
              <select value={e.ideaStatus ?? 'nueva'} onChange={(ev) => set({ ideaStatus: ev.target.value as IdeaStatus })}>
                {(Object.keys(IDEA_STATUS) as IdeaStatus[]).map((s) => <option key={s} value={s}>{IDEA_STATUS[s].label}</option>)}
              </select>
            </label>
            <label className="meta-field">
              categoría
              <input
                defaultValue={e.category ?? ''}
                placeholder="negocio, app…"
                style={{ width: 110 }}
                onBlur={(ev) => ev.target.value !== (e.category ?? '') && set({ category: ev.target.value.trim() })}
              />
            </label>
          </>
        )}
        {e.kind !== 'journal' && (
          <label className="meta-field">
            prioridad
            <select value={e.priority ?? ''} onChange={(ev) => set({ priority: (ev.target.value || null) as Priority | null })}>
              <option value="">—</option>
              <option value="alta">alta</option>
              <option value="media">media</option>
              <option value="baja">baja</option>
            </select>
          </label>
        )}
        <label className="meta-field">
          área
          <select value={e.areaId ?? ''} onChange={(ev) => set({ areaId: ev.target.value || null })}>
            <option value="">—</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.symbol} {a.name}</option>)}
          </select>
        </label>
        <label className="meta-field">
          proyecto
          <select value={e.projectId ?? ''} onChange={(ev) => set({ projectId: ev.target.value || null })} style={{ maxWidth: 170 }}>
            <option value="">—</option>
            {projects.filter((p) => p.status !== 'archivado' || p.id === e.projectId).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </label>
        {goals.length > 0 && (
          <label className="meta-field">
            objetivo
            <select value={e.goalId ?? ''} onChange={(ev) => set({ goalId: ev.target.value || null })} style={{ maxWidth: 170 }}>
              <option value="">—</option>
              {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </label>
        )}
        <button className="meta-field" onClick={() => set({ favorite: !e.favorite })} aria-pressed={!!e.favorite}>
          <IconStar filled={!!e.favorite} width={14} className={e.favorite ? 'accent' : ''} /> {e.favorite ? 'favorita' : 'marcar'}
        </button>
        <span className="meta-field">
          <TagInput value={e.tags} onChange={(tags) => set({ tags })} />
        </span>
      </div>

      <AutoTextarea
        className="write-body"
        value={body}
        placeholder={placeholder}
        onChange={(ev) => setBody(ev.target.value)}
        aria-label="Contenido"
      />

      {e.convertedTo && (
        <p className="mono muted mt-2">
          Convertida en{' '}
          <Link className="accent" to={e.convertedTo.type === 'project' ? `/proyectos/${e.convertedTo.id}` : e.convertedTo.type === 'goal' ? `/objetivos/${e.convertedTo.id}` : `/tareas?t=${e.convertedTo.id}`}>
            {e.convertedTo.type === 'project' ? 'proyecto' : e.convertedTo.type === 'goal' ? 'objetivo' : 'tarea'} →
          </Link>
        </p>
      )}

      <div className="mt-3">
        <Section label="Archivos">
          <Attachments ownerType="entry" ownerId={e.id} />
        </Section>

        <Section label="Convertir y actuar">
          <div className="row wrap">
            <button className="btn" onClick={async () => { const t = await entryToTask(fresh()); toast('Tarea creada.', { label: 'Ver', run: () => navigate(`/tareas?t=${t.id}`) }); }}>→ Tarea</button>
            <button className="btn" onClick={async () => { const p = await entryToProject(fresh()); navigate(`/proyectos/${p.id}`); }}>→ Proyecto</button>
            <button className="btn" onClick={async () => { const g = await entryToGoal(fresh()); navigate(`/objetivos/${g.id}`); }}>→ Objetivo</button>
            {hasListLines && (
              <button
                className="btn"
                title="Convierte líneas que empiezan por - o [ ] en tareas"
                onClick={async () => {
                  await patch<Entry>('entries', e.id, { title, body });
                  const { n, body: nb } = await extractTasks({ ...e, title, body });
                  setBody(nb);
                  toast(n ? `${n} tareas creadas desde la nota.` : 'No encontré líneas de lista.');
                }}
              >
                Extraer tareas de la lista
              </button>
            )}
            <span className="grow" />
            <button
              className="btn btn-ghost btn-danger"
              onClick={async () => {
                await remove('entries', e.id);
                navigate(backTo);
                toast('Enviado a la papelera.', { label: 'Deshacer', run: () => restore('entries', e.id) });
              }}
            >
              <IconTrash /> Eliminar
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
