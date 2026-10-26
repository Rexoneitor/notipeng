import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAreas, useGoal, useProjects, useTasks } from '../db/hooks';
import { byOrder, newProject, newTask, nextStep, patch, progress, remove, restore, touchOpened } from '../db/repo';
import type { Goal, GoalStatus, Project } from '../db/types';
import { parseCapture } from '../lib/parse';
import { toast } from '../lib/ui';
import { TaskRow } from '../components/TaskRow';
import { AutoTextarea, Empty, GOAL_STATUS, PROJECT_STATUS, Section, Stamp, TagInput, Ticks, useDebounced } from '../components/ui';
import { IconArrowLeft, IconStar, IconTrash } from '../components/Icons';
import { countdown, goalTasks, Ring } from './Goals';

export function GoalView() {
  const { id } = useParams();
  const goal = useGoal(id);
  useEffect(() => { if (id) touchOpened('goals', id); }, [id]);
  if (goal === undefined) return <div className="page narrow" />;
  if (!goal || goal.deletedAt)
    return (
      <div className="page narrow">
        <Empty line="Este objetivo no existe o está en la papelera."><Link to="/objetivos" className="btn">Objetivos</Link></Empty>
      </div>
    );
  return <GoalBody key={goal.id} g={goal} />;
}

function GoalBody({ g }: { g: Goal }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const projects = useProjects() ?? [];
  const tasks = useTasks() ?? [];
  const areas = useAreas() ?? [];
  const [title, setTitle] = useState(g.title);
  const [description, setDescription] = useState(g.description);
  const [draft, setDraft] = useState('');
  useDebounced({ title, description }, (v) => patch<Goal>('goals', g.id, v));
  const set = (c: Partial<Goal>) => patch<Goal>('goals', g.id, c);

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

  const gp = projects.filter((p) => p.goalId === g.id);
  const direct = tasks.filter((t) => t.goalId === g.id && !t.projectId).sort(byOrder);
  const prog = progress(goalTasks(g, projects, tasks));
  const available = projects.filter((p) => !p.goalId && p.status !== 'archivado');

  async function addTask() {
    const t = draft.trim();
    if (!t) return;
    setDraft('');
    const p = parseCapture(t);
    await newTask({ title: p.text || t, due: p.date ?? null, time: p.time ?? null, priority: p.priority ?? null, tags: p.tags, goalId: g.id });
  }

  return (
    <div className="page narrow">
      <div className="row between mb-2">
        <Link to="/objetivos" className="btn btn-ghost btn-sm"><IconArrowLeft /> Objetivos</Link>
        <div className="row" style={{ gap: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => set({ favorite: !g.favorite })} aria-pressed={!!g.favorite}>
            <IconStar filled={!!g.favorite} className={g.favorite ? 'accent' : ''} />
          </button>
          <button
            className="btn btn-ghost btn-sm btn-danger"
            aria-label="Eliminar objetivo"
            onClick={async () => {
              await remove('goals', g.id);
              navigate('/objetivos');
              toast('Objetivo enviado a la papelera.', { label: 'Deshacer', run: () => restore('goals', g.id) });
            }}
          >
            <IconTrash />
          </button>
        </div>
      </div>

      <div className="pv-head">
        <div>
          <div className="ph-kicker"><b>◎ Objetivo</b>{g.targetDate && <span>{countdown(g.targetDate)}</span>}</div>
          <AutoTextarea ref={titleRef} className="write-title" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} placeholder="¿Qué quieres lograr?" aria-label="Objetivo" />
          <AutoTextarea className="inline-input muted mt-1" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿Por qué importa? ¿Cómo sabrás que lo lograste?" aria-label="Descripción" />
        </div>
        <Ring pct={prog.pct} size={96} label={prog.total ? undefined : '—'} />
      </div>

      <div className="pv-props">
        <label className="meta-field">
          estado
          <select value={g.status} onChange={(e) => set({ status: e.target.value as GoalStatus })}>
            {(Object.keys(GOAL_STATUS) as GoalStatus[]).map((s) => <option key={s} value={s}>{GOAL_STATUS[s].label}</option>)}
          </select>
        </label>
        <label className="meta-field">fecha objetivo <input type="date" value={g.targetDate ?? ''} onChange={(e) => set({ targetDate: e.target.value || null })} /></label>
        <label className="meta-field">
          área
          <select value={g.areaId ?? ''} onChange={(e) => set({ areaId: e.target.value || null })}>
            <option value="">—</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.symbol} {a.name}</option>)}
          </select>
        </label>
        <span className="meta-field"><TagInput value={g.tags} onChange={(tags) => set({ tags })} /></span>
      </div>

      <Section idx="01" label="Proyectos" extra={<span className="sec-extra">{gp.length}</span>}>
        {gp.length === 0 && <Empty small line="Ningún proyecto asociado." hint="Un objetivo avanza a través de proyectos concretos." />}
        <div className="list">
          {gp.map((p: Project) => {
            const pt = tasks.filter((t) => t.projectId === p.id);
            const pr = progress(pt);
            const nx = nextStep(pt);
            return (
              <div key={p.id} className="item">
                <div className="item-main">
                  <Link to={`/proyectos/${p.id}`} className="item-title display" style={{ fontSize: '1.15rem' }}>{p.title}</Link>
                  <div className="meta item-sub">
                    <Stamp tone={PROJECT_STATUS[p.status].tone}>{PROJECT_STATUS[p.status].label}</Stamp>
                    <Ticks done={pr.done} total={pr.total} n={16} />
                    {nx && <span>→ {nx.title}</span>}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => patch<Project>('projects', p.id, { goalId: null })}>Desvincular</button>
              </div>
            );
          })}
        </div>
        <div className="row wrap mt-1">
          {available.length > 0 && (
            <select className="select" style={{ maxWidth: 280 }} value="" onChange={(e) => e.target.value && patch<Project>('projects', e.target.value, { goalId: g.id })} aria-label="Vincular proyecto existente">
              <option value="">Vincular proyecto existente…</option>
              {available.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          )}
          <button className="btn" onClick={async () => { const p = await newProject({ goalId: g.id, areaId: g.areaId }); navigate(`/proyectos/${p.id}?nuevo=1`); }}>+ Nuevo proyecto</button>
        </div>
      </Section>

      <Section idx="02" label="Acciones directas" extra={<span className="sec-extra">fuera de proyectos</span>}>
        <div className="list">
          {direct.map((t) => <TaskRow key={t.id} task={t} />)}
        </div>
        <div className="adder">
          <span className="plus-dot">+</span>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask()} placeholder="Añadir acción para este objetivo…" aria-label="Nueva acción" />
        </div>
      </Section>
    </div>
  );
}
