import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEvents, useGoals, useProjects, useReminders, useTasks } from '../db/hooks';
import { newEvent, newTask, remove } from '../db/repo';
import {
  addDays, fmtLong, fmtTime, monthGrid, MONTHS, parseISODate, relDay, startOfWeek, todayISO, toISODate, WEEKDAYS_SHORT,
} from '../lib/dates';
import { openTask } from '../lib/ui';
import { toggleTask } from '../components/TaskRow';
import { Check, Empty, PageHeader } from '../components/ui';

type View = 'mes' | 'semana' | 'agenda';
type Kind = 'task' | 'event' | 'deadline' | 'reminder';
interface CalItem { key: string; kind: Kind; title: string; time?: string | null; done?: boolean; open: () => void; taskId?: string }

const DOW = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

export function Calendar() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const view = (params.get('v') as View) || 'mes';
  const sel = params.get('d') || todayISO();
  const today = todayISO();

  const tasks = useTasks() ?? [];
  const events = useEvents() ?? [];
  const reminders = useReminders() ?? [];
  const projects = useProjects() ?? [];
  const goals = useGoals() ?? [];

  const setP = (v: View, d: string) => setParams({ v, d }, { replace: true });

  const byDate = useMemo(() => {
    const m = new Map<string, CalItem[]>();
    const push = (d: string, it: CalItem) => m.set(d, [...(m.get(d) ?? []), it]);
    events.forEach((e) => push(e.date, { key: e.id, kind: 'event', title: e.title, time: e.time, open: () => setP('mes', e.date) }));
    tasks.filter((t) => t.due).forEach((t) => push(t.due!, { key: t.id, kind: 'task', title: t.title, time: t.time, done: t.status === 'hecha', open: () => openTask(t.id), taskId: t.id }));
    reminders.filter((r) => !r.done && r.refType !== 'task').forEach((r) =>
      push(toISODate(new Date(r.at)), { key: r.id, kind: 'reminder', title: `${r.kind === 'alarma' ? '⏰' : '🔔'} ${r.title}`, time: fmtTime(r.at), open: () => {} }),
    );
    projects.filter((p) => p.targetDate && p.status !== 'archivado').forEach((p) =>
      push(p.targetDate!, { key: p.id, kind: 'deadline', title: `Meta: ${p.title}`, open: () => navigate(`/proyectos/${p.id}`) }),
    );
    goals.filter((g) => g.targetDate && g.status !== 'archivado').forEach((g) =>
      push(g.targetDate!, { key: g.id, kind: 'deadline', title: `◎ ${g.title}`, open: () => navigate(`/objetivos/${g.id}`) }),
    );
    for (const list of m.values()) list.sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, events, reminders, projects, goals]);

  const selD = parseISODate(sel);

  const shift = (dir: -1 | 1) => {
    if (view === 'mes') {
      const d = new Date(selD.getFullYear(), selD.getMonth() + dir, 1);
      setP(view, toISODate(d));
    } else if (view === 'semana') setP(view, addDays(sel, dir * 7));
  };

  const title =
    view === 'mes'
      ? `${MONTHS[selD.getMonth()]} ${selD.getFullYear()}`
      : view === 'semana'
        ? (() => { const s = startOfWeek(sel); const e = addDays(s, 6); return `${parseISODate(s).getDate()} – ${fmtLong(e)}`; })()
        : 'Próximos 60 días';

  return (
    <div className="page">
      <PageHeader idx="09" kicker="Ejecutar · Calendario" title="Calendario" />
      <div className="cal-head">
        <div className="seg" role="tablist">
          {(['mes', 'semana', 'agenda'] as View[]).map((v) => (
            <button key={v} role="tab" aria-pressed={view === v} aria-selected={view === v} onClick={() => setP(v, sel)}>{v}</button>
          ))}
        </div>
        <span className="cal-title">{title}</span>
        <span className="grow" />
        {view !== 'agenda' && (
          <>
            <button className="btn btn-icon" aria-label="Anterior" onClick={() => shift(-1)}>‹</button>
            <button className="btn" onClick={() => setP(view, today)}>Hoy</button>
            <button className="btn btn-icon" aria-label="Siguiente" onClick={() => shift(1)}>›</button>
          </>
        )}
      </div>

      {view === 'mes' && (
        <>
          <div className="cal-grid">
            {DOW.map((d) => <div key={d} className="cal-dow">{d}</div>)}
            {monthGrid(selD.getFullYear(), selD.getMonth()).map((d) => {
              const items = byDate.get(d) ?? [];
              const out = parseISODate(d).getMonth() !== selD.getMonth();
              return (
                <button
                  key={d}
                  className={`cal-cell ${out ? 'out' : ''} ${d === today ? 'today' : ''} ${d === sel ? 'sel' : ''}`}
                  onClick={() => setP('mes', d)}
                  aria-label={`${fmtLong(d)}: ${items.length} elementos`}
                >
                  <span className="cal-num">{parseISODate(d).getDate()}</span>
                  {items.slice(0, 3).map((it) => (
                    <span key={it.key} className={`cal-chip ${it.done ? 'done' : ''}`} data-k={it.kind}>{it.time ? `${it.time} ` : ''}{it.title}</span>
                  ))}
                  {items.length > 3 && <span className="cal-more">+{items.length - 3} más</span>}
                  <span className="cal-dots">{items.slice(0, 4).map((it) => <i key={it.key} data-k={it.kind} />)}</span>
                </button>
              );
            })}
          </div>
          <DayPanel date={sel} items={byDate.get(sel) ?? []} />
        </>
      )}

      {view === 'semana' && (
        <div className="cal-week">
          {Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(sel), i)).map((d) => (
            <div key={d} className={`wk-day ${d === today ? 'today' : ''}`}>
              <div className="wk-head"><span>{WEEKDAYS_SHORT[parseISODate(d).getDay()]}</span><b>{parseISODate(d).getDate()}</b></div>
              {(byDate.get(d) ?? []).map((it) => (
                <button key={it.key} className={`cal-chip ${it.done ? 'done' : ''}`} data-k={it.kind} style={{ textAlign: 'left' }} onClick={it.open}>
                  {it.time ? `${it.time} ` : ''}{it.title}
                </button>
              ))}
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 'auto' }} onClick={() => setP('mes', d)}>+ añadir</button>
            </div>
          ))}
        </div>
      )}

      {view === 'agenda' && (() => {
        const days = Array.from({ length: 60 }, (_, i) => addDays(today, i)).filter((d) => byDate.get(d)?.length);
        return days.length === 0 ? <Empty line="Nada en el horizonte." hint="Las fechas de tareas, eventos y metas aparecerán aquí." /> : (
          <div>
            {days.map((d) => (
              <div key={d} className={`agenda-day ${d === today ? 'today' : ''}`}>
                <div className="ad-date"><b>{parseISODate(d).getDate()}</b>{relDay(d)}</div>
                <div>
                  {byDate.get(d)!.map((it) => (
                    <div key={it.key} className="agenda-line">
                      <span className="al-time">{it.time ?? ''}</span>
                      <span className="al-kind" data-k={it.kind} />
                      <button className={it.done ? 'done-text' : ''} style={{ textAlign: 'left' }} onClick={it.open}>{it.title}</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

function DayPanel({ date, items }: { date: string; items: CalItem[] }) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const tasks = useTasks() ?? [];
  const events = useEvents() ?? [];
  const add = async (kind: 'event' | 'task') => {
    const t = title.trim();
    if (!t) return;
    setTitle('');
    setTime('');
    if (kind === 'event') await newEvent({ title: t, date, time: time || null });
    else await newTask({ title: t, due: date, time: time || null });
  };
  return (
    <section className="block mt-3">
      <h2 className="sec"><span className="sec-title" style={{ textTransform: "capitalize" }}>{relDay(date)} · {fmtLong(date)}</span></h2>
      <div className="list">
        {items.length === 0 && <p className="muted mono" style={{ padding: '8px 0' }}>Día libre.</p>}
        {items.map((it) => {
          const task = it.taskId ? tasks.find((t) => t.id === it.taskId) : undefined;
          const ev = it.kind === 'event' ? events.find((e) => e.id === it.key) : undefined;
          return (
            <div key={it.key} className="item">
              {task ? <Check state={task.status} onToggle={() => toggleTask(task)} label={`Completar: ${task.title}`} /> : <span style={{ width: 22, display: 'grid', placeItems: 'center', paddingTop: 8 }}><span className="al-kind" data-k={it.kind} /></span>}
              <button className={`item-main item-title ${it.done ? 'done-text' : ''}`} style={{ textAlign: 'left' }} onClick={it.open}>
                {it.title}
              </button>
              <span className="mono muted">{it.time ?? ''}</span>
              {ev && <button className="btn btn-ghost btn-sm" onClick={() => remove('events', ev.id)}>Quitar</button>}
            </div>
          );
        })}
      </div>
      <div className="row wrap mt-1">
        <input className="input" style={{ flex: '1 1 220px' }} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add('event')} placeholder="Añadir a este día…" aria-label="Título" />
        <input type="time" className="input mono-in" style={{ width: 120 }} value={time} onChange={(e) => setTime(e.target.value)} aria-label="Hora" />
        <button className="btn" onClick={() => add('event')} disabled={!title.trim()}>+ Evento</button>
        <button className="btn" onClick={() => add('task')} disabled={!title.trim()}>+ Tarea</button>
      </div>
    </section>
  );
}
