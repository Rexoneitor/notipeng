import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProjects, useReminders, useTasks } from '../db/hooks';
import { byOrder, newReminder, newTask } from '../db/repo';
import type { Task } from '../db/types';
import { combine, fmtLong, relDay, todayISO, toISODate } from '../lib/dates';
import { parseCapture } from '../lib/parse';
import { ensurePermission } from '../lib/reminders';
import { openTask } from '../lib/ui';
import { TaskRow } from '../components/TaskRow';
import { Empty, PageHeader } from '../components/ui';

type View = 'hoy' | 'proximas' | 'sinfecha' | 'hechas';

const prRank = (t: Task) => ({ alta: 0, media: 1, baja: 2 })[t.priority ?? 'baja'] + (t.priority ? 0 : 1);

export function Tasks() {
  const tasks = useTasks();
  const projects = useProjects() ?? [];
  const reminders = useReminders() ?? [];
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>((params.get('v') as View) || 'hoy');
  const [draft, setDraft] = useState('');
  const today = todayISO();

  useEffect(() => {
    const t = params.get('t');
    if (t) {
      openTask(t);
      params.delete('t');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const pById = new Map(projects.map((p) => [p.id, p]));
  const remIds = new Set(reminders.filter((r) => !r.done).map((r) => r.refId));
  const all = tasks ?? [];
  const open = all.filter((t) => t.status !== 'hecha');

  const overdue = open.filter((t) => t.due && t.due < today).sort((a, b) => a.due!.localeCompare(b.due!));
  const dueToday = open.filter((t) => t.due === today).sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99') || prRank(a) - prRank(b));
  const inProgress = open.filter((t) => t.status === 'progreso' && (!t.due || t.due > today));
  const upcoming = open.filter((t) => t.due && t.due > today).sort((a, b) => a.due!.localeCompare(b.due!) || (a.time ?? '').localeCompare(b.time ?? ''));
  const undated = open.filter((t) => !t.due);
  const done = all.filter((t) => t.status === 'hecha').sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)).slice(0, 80);

  const counts: Record<View, number> = { hoy: overdue.length + dueToday.length + inProgress.length, proximas: upcoming.length, sinfecha: undated.length, hechas: 0 };

  async function add() {
    const t = draft.trim();
    if (!t) return;
    setDraft('');
    const p = parseCapture(t);
    const due = p.date ?? (view === 'hoy' ? today : null);
    const task = await newTask({ title: p.text || t, due, time: p.time ?? null, priority: p.priority ?? null, tags: p.tags });
    if (due && p.time) {
      await newReminder({ title: task.title, at: combine(due, p.time), refType: 'task', refId: task.id });
      ensurePermission();
    }
  }

  const group = (label: string, list: Task[], opts: { order?: boolean } = {}) =>
    list.length > 0 && (
      <section className="task-group" key={label}>
        <h2 className="sec"><span className="sec-title">{label}</span><span className="sec-extra">{list.length}</span></h2>
        <div className="list">
          {list.map((t) => (
            <TaskRow key={t.id} task={t} project={t.projectId ? pById.get(t.projectId) : undefined} hasReminder={remIds.has(t.id)} orderList={opts.order ? list : undefined} />
          ))}
        </div>
      </section>
    );

  const byKey = <K extends string>(list: Task[], key: (t: Task) => K) => {
    const m = new Map<K, Task[]>();
    list.forEach((t) => m.set(key(t), [...(m.get(key(t)) ?? []), t]));
    return [...m];
  };

  return (
    <div className="page narrow">
      <PageHeader idx="07" kicker="Ejecutar · Tareas" title="Tareas" sub="Lo que hay que hacer, sin adornos. Una cosa a la vez." />

      <div className="card flat mb-2" style={{ padding: '4px 14px' }}>
        <div className="adder">
          <span className="plus-dot">+</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={view === 'hoy' ? 'Nueva tarea para hoy…  (prueba: "llamar a Ana mañana a las 10 !alta")' : 'Nueva tarea…  ("el viernes", "#uni", "!alta")'}
            aria-label="Nueva tarea"
          />
        </div>
      </div>

      <div className="toolbar">
        <div className="chips" role="tablist">
          {([['hoy', 'Hoy'], ['proximas', 'Próximas'], ['sinfecha', 'Sin fecha'], ['hechas', 'Hechas']] as [View, string][]).map(([v, l]) => (
            <button key={v} role="tab" className="chip" aria-pressed={view === v} aria-selected={view === v} onClick={() => setView(v)}>
              {l}{counts[v] > 0 && <span className="n">{counts[v]}</span>}
            </button>
          ))}
        </div>
      </div>

      {tasks && view === 'hoy' && (
        counts.hoy === 0 ? (
          <Empty peng="taza" line="Nada pendiente para hoy." hint="Mira el siguiente paso de tus proyectos o tómate el día con calma." />
        ) : (
          <>
            {group('Se pasaron de fecha', overdue)}
            {group(`Hoy · ${fmtLong(today)}`, dueToday)}
            {group('En progreso', inProgress)}
          </>
        )
      )}

      {tasks && view === 'proximas' && (
        upcoming.length === 0 ? <Empty line="Nada programado más adelante." /> :
          byKey(upcoming, (t) => t.due!).map(([d, list]) => group(`${relDay(d)} · ${fmtLong(d)}`, list))
      )}

      {tasks && view === 'sinfecha' && (
        undated.length === 0 ? <Empty line="Todas tus tareas tienen fecha." /> :
          byKey(undated.sort(byOrder), (t) => t.projectId ?? '').sort(([a], [b]) => (a ? 1 : 0) - (b ? 1 : 0)).map(([pid, list]) =>
            group(pid ? `▲ ${pById.get(pid)?.title ?? 'Proyecto'}` : 'Sueltas', list, { order: true }),
          )
      )}

      {tasks && view === 'hechas' && (
        done.length === 0 ? <Empty peng="estrella" line="Aún no has completado nada aquí." hint="Cuando lo hagas, quedará constancia. Sin rachas, sin presión." /> :
          byKey(done, (t) => toISODate(new Date(t.completedAt ?? t.updatedAt))).map(([d, list]) => group(`${relDay(d)} · ${fmtLong(d)}`, list))
      )}
    </div>
  );
}
