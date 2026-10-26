import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAreas, useProjects, useTasks } from '../db/hooks';
import { newProject, nextStep, progress } from '../db/repo';
import type { ProjectStatus } from '../db/types';
import { daysBetween, relDay, todayISO } from '../lib/dates';
import { Empty, PageHeader, PROJECT_STATUS, Prio, Section, Stamp, Ticks } from '../components/ui';

const ORDER: ProjectStatus[] = ['progreso', 'planificacion', 'idea', 'pausado', 'completado', 'archivado'];

export function Projects() {
  const projects = useProjects();
  const tasks = useTasks() ?? [];
  const areas = useAreas() ?? [];
  const navigate = useNavigate();
  const [showClosed, setShowClosed] = useState(false);
  const [area, setArea] = useState<string>('');

  const create = async () => {
    const p = await newProject({ areaId: area || null });
    navigate(`/proyectos/${p.id}?nuevo=1`);
  };

  const list = (projects ?? []).filter((p) => !area || p.areaId === area);
  const visible = ORDER.filter((s) => showClosed || (s !== 'completado' && s !== 'archivado'));
  const closedCount = list.filter((p) => p.status === 'completado' || p.status === 'archivado').length;

  return (
    <div className="page">
      <PageHeader
        idx="06"
        kicker="Ejecutar · Proyectos"
        title="Proyectos"
        sub="Cada proyecto tiene un objetivo, un plan y, sobre todo, un siguiente paso."
        actions={<button className="btn btn-primary" onClick={create}>+ Nuevo proyecto</button>}
      />
      <div className="toolbar">
        <div className="chips">
          <button className="chip" aria-pressed={!area} onClick={() => setArea('')}>Todas las áreas</button>
          {areas.filter((a) => projects?.some((p) => p.areaId === a.id)).map((a) => (
            <button key={a.id} className="chip" aria-pressed={area === a.id} onClick={() => setArea(a.id)}>{a.symbol} {a.name}</button>
          ))}
        </div>
        <span className="spacer" />
        {closedCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={() => setShowClosed(!showClosed)}>
            {showClosed ? 'Ocultar cerrados' : `Ver cerrados (${closedCount})`}
          </button>
        )}
      </div>

      {projects && list.length === 0 && (
        <Empty peng="brujula" line="Todavía no hay proyectos." hint="Un proyecto nace de una idea. Conviértela desde Ideas o la Bandeja, o empieza uno aquí.">
          <button className="btn btn-primary" onClick={create}>Crear el primero</button>
        </Empty>
      )}

      {visible.map((s) => {
        const group = list.filter((p) => p.status === s).sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || b.updatedAt - a.updatedAt);
        if (!group.length) return null;
        return (
          <Section key={s} label={PROJECT_STATUS[s].label} extra={<span className="sec-extra">{group.length}</span>} className="status-group">
            <div className="grid-3">
              {group.map((p) => {
                const pt = tasks.filter((t) => t.projectId === p.id);
                const prog = progress(pt);
                const next = nextStep(pt);
                const a = areas.find((x) => x.id === p.areaId);
                const left = p.targetDate ? daysBetween(todayISO(), p.targetDate) : null;
                return (
                  <Link key={p.id} to={`/proyectos/${p.id}`} className="card project-card">
                    <div className="row between">
                      <span className="mono muted">{a ? `${a.symbol} ${a.name}` : 'proyecto'}</span>
                      <span className="row" style={{ gap: 6 }}>
                        <Prio p={p.priority} />
                        {p.favorite && <span className="fav-star">★</span>}
                      </span>
                    </div>
                    <div className="pc-title">{p.title}</div>
                    {p.objective && <div className="pc-obj">{p.objective}</div>}
                    <div className="row" style={{ gap: 10 }}>
                      <Ticks done={prog.done} total={prog.total} n={22} />
                      <span className="mono muted">{prog.total ? `${prog.pct}%` : '—'}</span>
                    </div>
                    <div className="meta">
                      <Stamp tone={PROJECT_STATUS[p.status].tone}>{PROJECT_STATUS[p.status].label}</Stamp>
                      {p.targetDate && <span className={left !== null && left < 0 && p.status !== 'completado' ? 'late' : ''}>meta {relDay(p.targetDate)}</span>}
                    </div>
                    {p.status !== 'completado' && p.status !== 'archivado' && (
                      <div className="pc-next">
                        <span className="arrow">→</span>
                        {next ? <span>{next.title}</span> : <span className="faint">Sin siguiente paso</span>}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </Section>
        );
      })}
    </div>
  );
}
