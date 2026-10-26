import { Link } from 'react-router-dom';
import { useEntries, useGoals, useProjects, useTasks } from '../db/hooks';
import { entryTitle } from '../db/repo';
import { ago } from '../lib/dates';
import { TYPE_LABEL } from '../lib/search';
import { openTask } from '../lib/ui';
import { Empty, PageHeader, Section } from '../components/ui';

interface Row { id: string; type: string; title: string; href?: string; task?: boolean; opened?: number; updated: number }

export function Recent() {
  const entries = useEntries() ?? [];
  const projects = useProjects() ?? [];
  const goals = useGoals() ?? [];
  const tasks = useTasks() ?? [];

  const rows: Row[] = [
    ...entries.filter((e) => !(e.kind === 'inbox' && e.archived)).map((e) => ({ id: e.id, type: TYPE_LABEL[e.kind], title: entryTitle(e), href: e.kind === 'inbox' ? '/bandeja' : `/e/${e.id}`, opened: e.openedAt, updated: e.updatedAt })),
    ...projects.map((p) => ({ id: p.id, type: 'Proyecto', title: p.title, href: `/proyectos/${p.id}`, opened: p.openedAt, updated: p.updatedAt })),
    ...goals.map((g) => ({ id: g.id, type: 'Objetivo', title: g.title, href: `/objetivos/${g.id}`, opened: g.openedAt, updated: g.updatedAt })),
    ...tasks.map((t) => ({ id: t.id, type: 'Tarea', title: t.title, task: true, updated: t.updatedAt })),
  ];
  const opened = rows.filter((r) => r.opened).sort((a, b) => b.opened! - a.opened!).slice(0, 15);
  const modified = rows.slice().sort((a, b) => b.updated - a.updated).slice(0, 20);

  const line = (r: Row, when: number) => {
    const inner = (
      <>
        <span className="mono muted" style={{ width: 74, flex: 'none', paddingTop: 3 }}>{r.type}</span>
        <span className="item-main item-title">{r.title || 'Sin título'}</span>
        <span className="mono faint">{ago(when)}</span>
      </>
    );
    return r.task ? (
      <button key={r.id} className="item" style={{ textAlign: 'left', width: '100%' }} onClick={() => openTask(r.id)}>{inner}</button>
    ) : (
      <Link key={r.id} to={r.href!} className="item">{inner}</Link>
    );
  };

  return (
    <div className="page">
      <PageHeader idx="10" kicker="Revisar · Recientes" title="Recientes" sub="Para volver rápido a donde estabas." />
      <div className="grid-2" style={{ gap: 44 }}>
        <Section idx="01" label="Abierto recientemente">
          {opened.length ? <div className="list">{opened.map((r) => line(r, r.opened!))}</div> : <Empty small line="Aún no has abierto nada." />}
        </Section>
        <Section idx="02" label="Modificado recientemente">
          {modified.length ? <div className="list">{modified.map((r) => line(r, r.updated))}</div> : <Empty small line="Nada todavía." />}
        </Section>
      </div>
    </div>
  );
}
