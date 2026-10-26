import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useAreas, useEntries, useEvents, useGoals, usePhases, useProject, useReminders, useTasks } from '../db/hooks';
import {
  byOrder, entryTitle, movePhase, newEntry, newEvent, newPhase, newTask, nextStep, patch, progress, remove, restore, touchOpened, uid,
} from '../db/repo';
import type { Phase, Priority, Project, ProjectStatus, Task } from '../db/types';
import { ago, daysBetween, fmtShort, relDay, todayISO } from '../lib/dates';
import { parseCapture } from '../lib/parse';
import { openTask, toast } from '../lib/ui';
import { Attachments } from '../components/Attachments';
import { TaskRow, toggleTask } from '../components/TaskRow';
import { AutoTextarea, Check, Empty, PROJECT_STATUS, Section, TagInput, Ticks, useDebounced } from '../components/ui';
import { IconArrowLeft, IconStar, IconTrash } from '../components/Icons';

export function ProjectView() {
  const { id } = useParams();
  const project = useProject(id);
  useEffect(() => { if (id) touchOpened('projects', id); }, [id]);
  if (project === undefined) return <div className="page" />;
  if (!project || project.deletedAt)
    return (
      <div className="page">
        <Empty line="Este proyecto no existe o está en la papelera.">
          <Link to="/proyectos" className="btn">Ver proyectos</Link>
        </Empty>
      </div>
    );
  return <ProjectBody key={project.id} p={project} />;
}

/** Añadir tarea en una línea, con lenguaje natural (fecha, #etiqueta, !alta). */
function TaskAdder({ placeholder, extra }: { placeholder: string; extra: Partial<Task> }) {
  const [v, setV] = useState('');
  const add = async () => {
    const t = v.trim();
    if (!t) return;
    setV('');
    const p = parseCapture(t);
    await newTask({ title: p.text || t, due: p.date ?? null, time: p.time ?? null, priority: p.priority ?? null, tags: p.tags, ...extra });
  };
  return (
    <div className="adder">
      <span className="plus-dot">+</span>
      <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

const SUGGESTED = ['Investigación', 'Preparación', 'Lanzamiento', 'Optimización'];

function ProjectBody({ p }: { p: Project }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const allTasks = useTasks() ?? [];
  const phases = usePhases(p.id) ?? [];
  const areas = useAreas() ?? [];
  const goals = useGoals() ?? [];
  const notes = (useEntries() ?? []).filter((e) => e.projectId === p.id && !(e.kind === 'inbox' && e.archived));
  const events = (useEvents() ?? []).filter((e) => e.projectId === p.id);
  const reminders = useReminders() ?? [];
  const origin = useLiveQuery(async () => (p.fromEntryId ? db.entries.get(p.fromEntryId) : undefined), [p.fromEntryId]);

  const tasks = useMemo(() => allTasks.filter((t) => t.projectId === p.id).sort(byOrder), [allTasks, p.id]);
  const open = tasks.filter((t) => t.status !== 'hecha');
  const done = tasks.filter((t) => t.status === 'hecha').sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const prog = progress(tasks);
  const next = nextStep(tasks);
  const remIds = new Set(reminders.filter((r) => !r.done).map((r) => r.refId));

  const [title, setTitle] = useState(p.title);
  const [description, setDescription] = useState(p.description);
  const [objective, setObjective] = useState(p.objective);
  useDebounced({ title, description, objective }, (v) => patch<Project>('projects', p.id, v));
  const set = (c: Partial<Project>) => patch<Project>('projects', p.id, c);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (params.get('nuevo')) {
      titleRef.current?.focus();
      titleRef.current?.select();
      params.delete('nuevo');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showDone, setShowDone] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [ev, setEv] = useState({ title: '', date: todayISO(), time: '' });

  const left = p.targetDate ? daysBetween(todayISO(), p.targetDate) : null;
  const area = areas.find((a) => a.id === p.areaId);

  async function addLink() {
    let url = linkUrl.trim();
    if (!url) return;
    if (!/^[a-z]+:\/\//i.test(url)) url = 'https://' + url;
    await set({ links: [...p.links, { id: uid(), url, title: linkTitle.trim() }] });
    setLinkUrl('');
    setLinkTitle('');
  }

  return (
    <div className="page">
      <div className="row between mb-2">
        <Link to="/proyectos" className="btn btn-ghost btn-sm"><IconArrowLeft /> Proyectos</Link>
        <div className="row" style={{ gap: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => set({ favorite: !p.favorite })} aria-pressed={!!p.favorite}>
            <IconStar filled={!!p.favorite} className={p.favorite ? 'accent' : ''} /> {p.favorite ? 'Favorito' : 'Marcar'}
          </button>
          <button
            className="btn btn-ghost btn-sm btn-danger"
            aria-label="Eliminar proyecto"
            onClick={async () => {
              await remove('projects', p.id);
              navigate('/proyectos');
              toast('Proyecto enviado a la papelera.', { label: 'Deshacer', run: () => restore('projects', p.id) });
            }}
          >
            <IconTrash /> <span className="hidden-mobile">Eliminar</span>
          </button>
        </div>
      </div>

      <div className="pv-head">
        <div>
          <div className="ph-kicker"><b>Proyecto</b>{area && <span>{area.symbol} {area.name}</span>}{origin && <Link to={`/e/${origin.id}`} className="muted">nació de: {entryTitle(origin).slice(0, 40)}</Link>}</div>
          <AutoTextarea ref={titleRef} className="write-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nombre del proyecto"
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} aria-label="Nombre del proyecto" />
          <AutoTextarea className="inline-input muted mt-1" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción breve: ¿de qué va?" aria-label="Descripción" />
        </div>
        <div className="pv-progress">
          <div className="big">{prog.total ? prog.pct : '—'}<small>{prog.total ? '%' : ''}</small></div>
          <div className="mt-1"><Ticks lg done={prog.done} total={prog.total} n={30} /></div>
          <div className="mono muted mt-1">{prog.total ? `${prog.done} de ${prog.total} acciones` : 'aún sin acciones'}</div>
        </div>
      </div>

      <div className="pv-props">
        <label className="meta-field">
          estado
          <select value={p.status} onChange={(e) => set({ status: e.target.value as ProjectStatus })}>
            {(Object.keys(PROJECT_STATUS) as ProjectStatus[]).map((s) => <option key={s} value={s}>{PROJECT_STATUS[s].label}</option>)}
          </select>
        </label>
        <label className="meta-field">
          prioridad
          <select value={p.priority ?? ''} onChange={(e) => set({ priority: (e.target.value || null) as Priority | null })}>
            <option value="">—</option><option value="alta">alta</option><option value="media">media</option><option value="baja">baja</option>
          </select>
        </label>
        <label className="meta-field">inicio <input type="date" value={p.startDate ?? ''} onChange={(e) => set({ startDate: e.target.value || null })} /></label>
        <label className="meta-field">
          meta <input type="date" value={p.targetDate ?? ''} onChange={(e) => set({ targetDate: e.target.value || null })} />
          {left !== null && p.status !== 'completado' && <span className={left < 0 ? 'accent' : ''}>{left < 0 ? `${-left} d tarde` : left === 0 ? 'hoy' : `${left} d`}</span>}
        </label>
        <label className="meta-field">
          área
          <select value={p.areaId ?? ''} onChange={(e) => set({ areaId: e.target.value || null })}>
            <option value="">—</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.symbol} {a.name}</option>)}
          </select>
        </label>
        <label className="meta-field">
          objetivo
          <select value={p.goalId ?? ''} onChange={(e) => set({ goalId: e.target.value || null })} style={{ maxWidth: 180 }}>
            <option value="">—</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </label>
        <span className="meta-field"><TagInput value={p.tags} onChange={(tags) => set({ tags })} /></span>
      </div>

      <nav className="pv-nav" aria-label="Secciones del proyecto">
        {[['plan', 'Plan de acción'], ['roadmap', 'Roadmap'], ['notas', 'Notas'], ['fechas', 'Fechas'], ['archivos', 'Archivos'], ['enlaces', 'Enlaces']].map(([h, l]) => (
          <a key={h} href={`#${h}`} onClick={(e) => { e.preventDefault(); document.getElementById(h)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{l}</a>
        ))}
      </nav>

      <div className="grid-2 block">
        <div className="objective">
          <div className="card-label">◎ Objetivo</div>
          <AutoTextarea className="inline-input" value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="¿Qué significa terminar este proyecto? Una frase." aria-label="Objetivo del proyecto" />
        </div>
        {next ? (
          <div className="next-step-hero">
            <Check state={next.status} onToggle={() => toggleTask(next)} label={`Completar: ${next.title}`} />
            <div className="grow">
              <div className="lbl">Siguiente paso</div>
              <div className="ns-title" role="button" tabIndex={0} onClick={() => openTask(next.id)} onKeyDown={(e) => e.key === 'Enter' && openTask(next.id)} style={{ cursor: 'pointer' }}>{next.title}</div>
              <div className="meta">
                {next.due && <span>{relDay(next.due)}</span>}
                {next.status !== 'progreso' && (
                  <button className="mono" style={{ textDecoration: 'underline' }} onClick={() => patch<Task>('tasks', next.id, { status: 'progreso' })}>empezar ahora</button>
                )}
                {next.status === 'progreso' && <span>en progreso</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="next-step-hero empty-ns">
            <div className="grow">
              <div className="lbl" style={{ color: 'var(--accent-ink)' }}>Siguiente paso</div>
              <div className="ns-title">{prog.total ? 'Todo hecho. ¿Cerramos el proyecto?' : '¿Cuál es la primera acción concreta?'}</div>
              {prog.total > 0 && p.status !== 'completado' && (
                <button className="btn btn-sm mt-1" onClick={() => set({ status: 'completado' })}>Marcar completado</button>
              )}
            </div>
          </div>
        )}
      </div>

      <Section idx="01" id="plan" label="Plan de acción" extra={<span className="sec-extra">{open.length} abiertas</span>}>
        <div className="list">
          {open.map((t, i) => (
            <TaskRow key={t.id} task={t} showProject={false} orderList={open} num={i + 1} isNext={t.id === next?.id} hasReminder={remIds.has(t.id)} />
          ))}
        </div>
        <TaskAdder placeholder={open.length ? 'Añadir acción…' : 'Primera acción concreta… (ej. "investigar competencia el viernes")'} extra={{ projectId: p.id }} />
        {done.length > 0 && (
          <div className="mt-1">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowDone(!showDone)}>{showDone ? '▾' : '▸'} Hechas ({done.length})</button>
            {showDone && <div className="list">{done.map((t) => <TaskRow key={t.id} task={t} showProject={false} />)}</div>}
          </div>
        )}
      </Section>

      <Section idx="02" id="roadmap" label="Roadmap" extra={<span className="sec-extra">{phases.length} fases</span>}>
        {phases.length === 0 ? (
          <Empty small line="Divide el camino en fases." hint="Cada fase agrupa sus acciones; el progreso se calcula solo.">
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              <button className="btn" onClick={async () => { for (const s of SUGGESTED) await newPhase(p.id, s); }}>Usar 4 fases sugeridas</button>
              <button className="btn btn-primary" onClick={() => newPhase(p.id, 'Fase 1')}>+ Primera fase</button>
            </div>
          </Empty>
        ) : (
          <Roadmap phases={phases} tasks={tasks} projectId={p.id} />
        )}
      </Section>

      <Section idx="03" id="notas" label="Notas" extra={<button className="sec-extra" onClick={async () => { const e = await newEntry('note', { projectId: p.id, areaId: p.areaId, tags: p.tags }); navigate(`/e/${e.id}`); }}>+ nota</button>}>
        {notes.length === 0 ? (
          <Empty small line="Sin notas todavía." hint="Investigación, referencias, borradores: todo lo que escribas para este proyecto." />
        ) : (
          <div className="grid-3">
            {notes.sort((a, b) => b.updatedAt - a.updatedAt).map((n) => (
              <Link key={n.id} to={`/e/${n.id}`} className="card note-card" style={{ minHeight: 110 }}>
                <div className="nt-title" style={{ fontSize: '1.05rem' }}>{entryTitle(n)}</div>
                <div className="nt-body">{n.title ? n.body : n.body.split('\n').slice(1).join('\n')}</div>
                <div className="meta"><span>{n.kind === 'journal' ? 'diario' : n.kind === 'idea' ? 'idea' : 'nota'}</span><span>{ago(n.updatedAt)}</span></div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section idx="04" id="fechas" label="Fechas">
        <div className="list">
          {p.startDate && <div className="item"><span className="mono muted" style={{ width: 110 }}>{fmtShort(p.startDate)}</span><span>Inicio</span></div>}
          {tasks.filter((t) => t.due && t.status !== 'hecha').sort((a, b) => a.due!.localeCompare(b.due!)).map((t) => (
            <div key={t.id} className="item"><span className="mono muted" style={{ width: 110 }}>{fmtShort(t.due!)}</span><button style={{ textAlign: 'left' }} onClick={() => openTask(t.id)}>{t.title}</button></div>
          ))}
          {events.sort((a, b) => a.date.localeCompare(b.date)).map((e) => (
            <div key={e.id} className="item">
              <span className="mono accent" style={{ width: 110 }}>{fmtShort(e.date)}{e.time ? ` ${e.time}` : ''}</span>
              <span className="grow">◆ {e.title}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => remove('events', e.id)}>Quitar</button>
            </div>
          ))}
          {p.targetDate && <div className="item"><span className="mono" style={{ width: 110, color: 'var(--warn)' }}>{fmtShort(p.targetDate)}</span><strong>Fecha objetivo</strong></div>}
        </div>
        <div className="row wrap mt-1">
          <input className="input" style={{ flex: '1 1 200px' }} placeholder="Nuevo evento o hito…" value={ev.title} onChange={(e) => setEv({ ...ev, title: e.target.value })} aria-label="Título del evento" />
          <input type="date" className="input mono-in" style={{ width: 160 }} value={ev.date} onChange={(e) => setEv({ ...ev, date: e.target.value })} aria-label="Fecha" />
          <input type="time" className="input mono-in" style={{ width: 120 }} value={ev.time} onChange={(e) => setEv({ ...ev, time: e.target.value })} aria-label="Hora" />
          <button className="btn" disabled={!ev.title.trim() || !ev.date} onClick={async () => { await newEvent({ title: ev.title.trim(), date: ev.date, time: ev.time || null, projectId: p.id }); setEv({ title: '', date: todayISO(), time: '' }); }}>+ Evento</button>
        </div>
      </Section>

      <Section idx="05" id="archivos" label="Archivos">
        <Attachments ownerType="project" ownerId={p.id} />
      </Section>

      <Section idx="06" id="enlaces" label="Enlaces">
        {p.links.length > 0 && (
          <ul className="list links-list mb-2">
            {p.links.map((l) => (
              <li key={l.id} className="item">
                <span className="mono faint">↗</span>
                <div className="item-main">
                  <a href={l.url} target="_blank" rel="noopener noreferrer">{l.title || l.url}</a>
                  {l.title && <div className="meta item-sub">{l.url.replace(/^https?:\/\//, '').slice(0, 60)}</div>}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => set({ links: p.links.filter((x) => x.id !== l.id) })}>Quitar</button>
              </li>
            ))}
          </ul>
        )}
        <div className="row wrap">
          <input className="input mono-in" style={{ flex: '2 1 220px' }} placeholder="https://…" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLink()} aria-label="URL" />
          <input className="input" style={{ flex: '1 1 160px' }} placeholder="Título (opcional)" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLink()} aria-label="Título del enlace" />
          <button className="btn" onClick={addLink} disabled={!linkUrl.trim()}>+ Enlace</button>
        </div>
      </Section>
    </div>
  );
}

function Roadmap({ phases, tasks, projectId }: { phases: Phase[]; tasks: Task[]; projectId: string }) {
  const unphased = tasks.filter((t) => !t.phaseId || !phases.some((p) => p.id === t.phaseId));
  return (
    <>
      <div className="roadmap">
        {phases.map((ph, i) => {
          const pt = tasks.filter((t) => t.phaseId === ph.id);
          const pr = progress(pt);
          const state = pr.total && pr.done === pr.total ? 'done' : pr.done > 0 || pt.some((t) => t.status === 'progreso') ? 'started' : '';
          return (
            <div key={ph.id} className="phase">
              <div className="phase-rail">
                <span className={`node ${state}`} />
                <span className="rail"><span style={{ width: `${pr.pct}%` }} /></span>
              </div>
              <div className="phase-box">
                <div className="row between">
                  <span className="phase-idx">Fase {i + 1}{pr.total ? ` · ${pr.done}/${pr.total}` : ''}</span>
                  <span className="row" style={{ gap: 0 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" aria-label="Mover a la izquierda" disabled={i === 0} onClick={() => movePhase(phases, ph.id, -1)}>‹</button>
                    <button className="btn btn-ghost btn-icon btn-sm" aria-label="Mover a la derecha" disabled={i === phases.length - 1} onClick={() => movePhase(phases, ph.id, 1)}>›</button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm btn-danger"
                      aria-label="Eliminar fase"
                      onClick={async () => { await remove('phases', ph.id); toast('Fase eliminada; sus tareas siguen en el plan.', { label: 'Deshacer', run: () => restore('phases', ph.id) }); }}
                    >×</button>
                  </span>
                </div>
                <PhaseTitle ph={ph} />
                <div className="list mt-1">
                  {pt.sort(byOrder).map((t) => (
                    <div key={t.id} className="item">
                      <Check state={t.status} onToggle={() => toggleTask(t)} label={`Completar: ${t.title}`} priority={t.priority} />
                      <button className={`item-main item-title ${t.status === 'hecha' ? 'done-text' : ''}`} style={{ textAlign: 'left' }} onClick={() => openTask(t.id)}>{t.title}</button>
                    </div>
                  ))}
                </div>
                <TaskAdder placeholder="Añadir a esta fase…" extra={{ projectId, phaseId: ph.id }} />
              </div>
            </div>
          );
        })}
        <div className="phase">
          <button className="phase-add" style={{ width: '100%' }} onClick={() => newPhase(projectId, `Fase ${phases.length + 1}`)}>+ Añadir fase</button>
        </div>
      </div>
      {unphased.filter((t) => t.status !== 'hecha').length > 0 && (
        <p className="mono muted mt-1">{unphased.filter((t) => t.status !== 'hecha').length} acciones del plan sin fase · asígnalas desde la tarea.</p>
      )}
    </>
  );
}

function PhaseTitle({ ph }: { ph: Phase }) {
  const [v, setV] = useState(ph.title);
  useDebounced(v, (title) => patch<Phase>('phases', ph.id, { title }));
  return <input className="inline-input phase-title" value={v} onChange={(e) => setV(e.target.value)} aria-label="Nombre de la fase" />;
}
