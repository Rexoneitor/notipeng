import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';
import { db } from '../db/db';
import { useAreas, useEntries, useGoals, useProjects, useTasks } from '../db/hooks';
import { entryTitle } from '../db/repo';
import { allTags, TYPE_LABEL } from '../lib/search';
import { ago } from '../lib/dates';
import { TaskRow } from '../components/TaskRow';
import { Empty, PageHeader, Section, Tags } from '../components/ui';

export function TagsPage() {
  const tags = useLiveQuery(allTags, []);
  const areas = useAreas() ?? [];
  const counts = useLiveQuery(async () => {
    const m = new Map<string, number>();
    const add = (id?: string | null) => id && m.set(id, (m.get(id) ?? 0) + 1);
    (await db.entries.filter((e) => !e.deletedAt && !(e.kind === 'inbox' && e.archived)).toArray()).forEach((e) => add(e.areaId));
    (await db.projects.filter((p) => !p.deletedAt).toArray()).forEach((p) => add(p.areaId));
    (await db.goals.filter((g) => !g.deletedAt).toArray()).forEach((g) => add(g.areaId));
    return m;
  }, []);

  return (
    <div className="page narrow">
      <PageHeader idx="05" kicker="Organizar · Conexiones" title="Etiquetas y áreas" sub="Las áreas son los grandes cajones de tu vida; las etiquetas, los hilos que los cruzan." />
      <Section idx="01" label="Áreas de vida" extra={<Link className="sec-extra" to="/ajustes#areas">editar →</Link>}>
        <div className="grid-3">
          {areas.map((a) => (
            <Link key={a.id} to={`/area/${a.id}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.4rem', width: 30, textAlign: 'center' }} className="accent">{a.symbol}</span>
              <span className="display grow" style={{ fontSize: '1.15rem' }}>{a.name}</span>
              <span className="mono muted">{counts?.get(a.id) ?? 0}</span>
            </Link>
          ))}
        </div>
      </Section>
      <Section idx="02" label="Etiquetas" extra={<span className="sec-extra">{tags?.length ?? 0}</span>}>
        {tags && tags.length === 0 ? (
          <Empty small line="Sin etiquetas aún." hint="Escribe #algo al capturar, o añádelas en cualquier nota, tarea o proyecto." />
        ) : (
          <div className="tag-cloud">
            {tags?.map(({ tag, count }) => (
              <Link key={tag} to={`/etiqueta/${encodeURIComponent(tag)}`} style={{ fontSize: `${Math.min(1.5, 0.85 + count * 0.08)}rem` }}>
                #{tag}<span className="n">{count}</span>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Collection({ match }: { match: (x: { tags?: string[]; areaId?: string | null }) => boolean }) {
  const entries = (useEntries() ?? []).filter((e) => !(e.kind === 'inbox' && e.archived) && match(e));
  const projects = (useProjects() ?? []).filter(match);
  const goals = (useGoals() ?? []).filter(match);
  const allProjects = useProjects() ?? [];
  const tasks = (useTasks() ?? []).filter((t) => t.status !== 'hecha' && match(t));
  const nothing = !entries.length && !projects.length && !goals.length && !tasks.length;
  if (nothing) return <Empty line="Nada conectado aquí todavía." />;
  return (
    <>
      {goals.length > 0 && (
        <Section label="Objetivos">
          <div className="list">{goals.map((g) => <Link key={g.id} to={`/objetivos/${g.id}`} className="item"><span className="item-title display">◎ {g.title}</span></Link>)}</div>
        </Section>
      )}
      {projects.length > 0 && (
        <Section label="Proyectos">
          <div className="list">{projects.map((p) => <Link key={p.id} to={`/proyectos/${p.id}`} className="item"><span className="item-title display">▲ {p.title}</span></Link>)}</div>
        </Section>
      )}
      {tasks.length > 0 && (
        <Section label="Tareas abiertas">
          <div className="list">{tasks.map((t) => <TaskRow key={t.id} task={t} project={allProjects.find((p) => p.id === t.projectId)} />)}</div>
        </Section>
      )}
      {entries.length > 0 && (
        <Section label="Notas, ideas y diario">
          <div className="list">
            {entries.sort((a, b) => b.updatedAt - a.updatedAt).map((e) => (
              <Link key={e.id} to={e.kind === 'inbox' ? '/bandeja' : `/e/${e.id}`} className="item">
                <span className="mono muted" style={{ width: 70, paddingTop: 3 }}>{TYPE_LABEL[e.kind]}</span>
                <div className="item-main">
                  <div className="item-title">{entryTitle(e)}</div>
                  <div className="meta item-sub"><span>{ago(e.updatedAt)}</span><Tags tags={e.tags} /></div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

export function TagView() {
  const { tag = '' } = useParams();
  const t = decodeURIComponent(tag);
  return (
    <div className="page narrow">
      <PageHeader kicker="Etiqueta" title={<span className="mono" style={{ fontSize: '0.8em' }}>#{t}</span>} actions={<Link to="/etiquetas" className="btn btn-ghost">Todas</Link>} />
      <Collection match={(x) => !!x.tags?.includes(t)} />
    </div>
  );
}

export function AreaView() {
  const { id } = useParams();
  const area = (useAreas() ?? []).find((a) => a.id === id);
  return (
    <div className="page narrow">
      <PageHeader kicker="Área de vida" title={area ? <><span className="accent">{area.symbol}</span> {area.name}</> : '…'} actions={<Link to="/etiquetas" className="btn btn-ghost">Todas</Link>} />
      <Collection match={(x) => x.areaId === id} />
    </div>
  );
}
