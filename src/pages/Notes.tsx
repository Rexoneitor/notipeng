import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAreas, useEntries, useProjects } from '../db/hooks';
import { entryTitle, newEntry } from '../db/repo';
import { ago } from '../lib/dates';
import { Empty, PageHeader, Tags } from '../components/ui';

export function Notes() {
  const entries = useEntries('note');
  const areas = useAreas() ?? [];
  const projects = useProjects() ?? [];
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'todas' | 'favoritas' | string>('todas');

  const create = async () => {
    const e = await newEntry('note', filter.startsWith('area:') ? { areaId: filter.slice(5) } : {});
    navigate(`/e/${e.id}`);
  };

  const list = (entries ?? [])
    .filter((e) => !e.archived)
    .filter((e) => (filter === 'favoritas' ? e.favorite : filter.startsWith('area:') ? e.areaId === filter.slice(5) : true))
    .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || b.updatedAt - a.updatedAt);

  const usedAreas = areas.filter((a) => entries?.some((e) => e.areaId === a.id));

  return (
    <div className="page">
      <PageHeader
        idx="04"
        kicker="Organizar · Notas"
        title="Notas"
        sub="Lo que quieres conservar: referencias, aprendizajes, borradores."
        actions={<button className="btn btn-primary" onClick={create}>+ Nueva nota</button>}
      />
      <div className="toolbar">
        <div className="chips">
          <button className="chip" aria-pressed={filter === 'todas'} onClick={() => setFilter('todas')}>Todas</button>
          <button className="chip" aria-pressed={filter === 'favoritas'} onClick={() => setFilter('favoritas')}>★ Favoritas</button>
          {usedAreas.map((a) => (
            <button key={a.id} className="chip" aria-pressed={filter === `area:${a.id}`} onClick={() => setFilter(`area:${a.id}`)}>
              {a.symbol} {a.name}
            </button>
          ))}
        </div>
      </div>
      {entries && list.length === 0 && <Empty peng="nota" line="No hay notas aquí todavía." hint="También puedes guardar algo de la Bandeja como nota." />}
      <div className="grid-3">
        {list.map((e) => {
          const project = projects.find((p) => p.id === e.projectId);
          const area = areas.find((a) => a.id === e.areaId);
          return (
            <Link key={e.id} to={`/e/${e.id}`} className="card note-card">
              <div className="nt-title">{e.favorite && <span className="fav-star">★ </span>}{entryTitle(e)}</div>
              <div className="nt-body">{e.title ? e.body : e.body.split('\n').slice(1).join('\n')}</div>
              <div className="meta">
                <span>{ago(e.updatedAt)}</span>
                {area && <span>{area.symbol} {area.name}</span>}
                {project && <span>▲ {project.title}</span>}
                <Tags tags={e.tags} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
