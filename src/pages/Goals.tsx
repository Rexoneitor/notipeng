import { Link, useNavigate } from 'react-router-dom';
import { useGoals, useProjects, useTasks } from '../db/hooks';
import { newGoal, progress } from '../db/repo';
import type { Goal, Project, Task } from '../db/types';
import { daysBetween, fmtLong, todayISO } from '../lib/dates';
import { Empty, GOAL_STATUS, PageHeader, Stamp } from '../components/ui';

export function goalTasks(g: Goal, projects: Project[], tasks: Task[]) {
  const pids = new Set(projects.filter((p) => p.goalId === g.id).map((p) => p.id));
  return tasks.filter((t) => t.goalId === g.id || (t.projectId && pids.has(t.projectId)));
}

export function Ring({ pct, size = 64, label }: { pct: number; size?: number; label?: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg className="goal-ring" viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={`${pct}%`}>
      <circle className="bg" cx="32" cy="32" r={r} />
      <circle className="fg" cx="32" cy="32" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 32 32)" />
      <text x="32" y="32">{label ?? `${pct}%`}</text>
    </svg>
  );
}

export function countdown(target?: string | null) {
  if (!target) return null;
  const n = daysBetween(todayISO(), target);
  if (n < 0) return `fecha pasada hace ${-n} días`;
  if (n === 0) return 'es hoy';
  if (n < 60) return `faltan ${n} días`;
  return `faltan ~${Math.round(n / 30)} meses`;
}

export function Goals() {
  const goals = useGoals();
  const projects = useProjects() ?? [];
  const tasks = useTasks() ?? [];
  const navigate = useNavigate();

  const create = async () => {
    const g = await newGoal();
    navigate(`/objetivos/${g.id}?nuevo=1`);
  };

  const order = { activo: 0, pausado: 1, logrado: 2, archivado: 3 } as const;
  const list = (goals ?? []).slice().sort((a, b) => order[a.status] - order[b.status] || (a.targetDate ?? '9').localeCompare(b.targetDate ?? '9'));

  return (
    <div className="page narrow">
      <PageHeader
        idx="08"
        kicker="Ejecutar · Objetivos"
        title="Objetivos"
        sub="Hacia dónde vas. Los proyectos son el camino; las tareas, los pasos."
        actions={<button className="btn btn-primary" onClick={create}>+ Nuevo objetivo</button>}
      />
      {goals && list.length === 0 && (
        <Empty peng="brujula" line="Sin objetivos todavía." hint='Ejemplo: "Crear mi primer negocio digital — 31 dic 2026".'>
          <button className="btn btn-primary" onClick={create}>Definir uno</button>
        </Empty>
      )}
      <div className="stack" style={{ gap: 12 }}>
        {list.map((g) => {
          const prog = progress(goalTasks(g, projects, tasks));
          const gp = projects.filter((p) => p.goalId === g.id);
          return (
            <Link key={g.id} to={`/objetivos/${g.id}`} className="card goal-card">
              <div>
                <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                  <Stamp tone={GOAL_STATUS[g.status].tone}>{GOAL_STATUS[g.status].label}</Stamp>
                  {g.favorite && <span className="fav-star">★</span>}
                </div>
                <div className="gc-title">{g.title}</div>
                <div className="meta mt-1">
                  {g.targetDate && <span>{fmtLong(g.targetDate)}</span>}
                  {g.status === 'activo' && g.targetDate && <span className="countdown">{countdown(g.targetDate)}</span>}
                  <span>{gp.length} {gp.length === 1 ? 'proyecto' : 'proyectos'}</span>
                  <span>{prog.done}/{prog.total} acciones</span>
                </div>
              </div>
              <Ring pct={prog.pct} label={prog.total ? undefined : '—'} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
