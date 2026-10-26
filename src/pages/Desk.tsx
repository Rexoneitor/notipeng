import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEntries, useEvents, useGoals, useInboxCount, useProfile, useProjects, useReminders, useTasks } from '../db/hooks';
import { entryTitle, newEntry, nextStep, patch, progress } from '../db/repo';
import type { Reminder, Task } from '../db/types';
import { addDays, ago, fmtTime, greeting, isoWeek, parseISODate, relDay, todayISO, toISODate, MONTHS, WEEKDAYS } from '../lib/dates';
import { parseCapture } from '../lib/parse';
import { usePrefs } from '../lib/prefs';
import { openCapture, openTask, toast } from '../lib/ui';
import { toggleTask, TaskRow } from '../components/TaskRow';
import { AutoTextarea, Check, Empty, Section, Stamp, Ticks, PROJECT_STATUS } from '../components/ui';
import { IconAlarm, IconBell, IconPlus } from '../components/Icons';
import { Peng, type PengItem } from '../components/Art';

const KIND_LABEL = { inbox: 'Bandeja', note: 'Nota', journal: 'Diario', idea: 'Idea' } as const;

export function Desk() {
  const prefs = usePrefs();
  const tasks = useTasks();
  const projects = useProjects();
  const entries = useEntries();
  const events = useEvents();
  const reminders = useReminders();
  const goals = useGoals();
  const profile = useProfile();
  const inbox = useInboxCount();
  const [draft, setDraft] = useState('');

  const today = todayISO();

  const data = useMemo(() => {
    if (!tasks || !projects || !entries || !events || !reminders || !goals) return null;
    const pById = new Map(projects.map((p) => [p.id, p]));
    const open = tasks.filter((t) => t.status !== 'hecha');
    const overdue = open.filter((t) => t.due && t.due < today).sort((a, b) => a.due!.localeCompare(b.due!));
    const dueToday = open.filter((t) => t.due === today).sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));
    const doneToday = tasks.filter((t) => t.status === 'hecha' && t.completedAt && toISODate(new Date(t.completedAt)) === today);
    const eventsToday = events.filter((e) => e.date === today).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    const remToday = reminders
      .filter((r) => !r.done && (toISODate(new Date(r.at)) === today || (r.firedAt && !r.done)))
      .sort((a, b) => a.at - b.at);

    const active = projects
      .filter((p) => p.status === 'progreso' || p.status === 'planificacion')
      .sort((a, b) => (a.status === b.status ? b.updatedAt - a.updatedAt : a.status === 'progreso' ? -1 : 1))
      .slice(0, 5)
      .map((p) => {
        const pt = tasks.filter((t) => t.projectId === p.id);
        return { p, prog: progress(pt), next: nextStep(pt) };
      });

    const recent = entries
      .filter((e) => !(e.kind === 'inbox' && e.archived))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6);

    // Próximamente: 14 días
    const until = addDays(today, 14);
    type Up = { date: string; label: string; kind: string; href?: string; task?: Task };
    const up: Up[] = [];
    open.filter((t) => t.due && t.due > today && t.due <= until).forEach((t) => up.push({ date: t.due!, label: t.title, kind: 'task', task: t }));
    events.filter((e) => e.date > today && e.date <= until).forEach((e) => up.push({ date: e.date, label: `${e.time ? e.time + ' · ' : ''}${e.title}`, kind: 'event', href: `/calendario?d=${e.date}` }));
    projects.filter((p) => p.targetDate && p.targetDate > today && p.targetDate <= until && p.status !== 'completado' && p.status !== 'archivado')
      .forEach((p) => up.push({ date: p.targetDate!, label: `Fecha objetivo · ${p.title}`, kind: 'deadline', href: `/proyectos/${p.id}` }));
    reminders.filter((r) => !r.done && r.refType !== 'task').forEach((r) => {
      const d = toISODate(new Date(r.at));
      if (d > today && d <= until) up.push({ date: d, label: `${r.kind === 'alarma' ? '⏰' : '🔔'} ${fmtTime(r.at)} · ${r.title}`, kind: 'reminder', href: `/calendario?d=${d}` });
    });
    goals.filter((g) => g.targetDate && g.targetDate > today && g.targetDate <= until && g.status === 'activo')
      .forEach((g) => up.push({ date: g.targetDate!, label: `Objetivo · ${g.title}`, kind: 'deadline', href: `/objetivos/${g.id}` }));
    const upcoming = [...new Set(up.map((u) => u.date))].sort().map((d) => ({ date: d, items: up.filter((u) => u.date === d) }));

    return { pById, overdue, dueToday, doneToday, eventsToday, remToday, active, recent, upcoming };
  }, [tasks, projects, entries, events, reminders, goals, today]);

  const phrase = useMemo(() => {
    if (!data) return '';
    const todayCount = data.overdue.length + data.dueToday.length;
    if (data.overdue.length > 2) return `Hay ${data.overdue.length} cosas que se pasaron de fecha. Sin culpa: decide si siguen importando.`;
    if (inbox > 6) return `Tienes ${inbox} cosas en la bandeja. ¿Las ordenamos un poco?`;
    if (todayCount === 1) return 'Hoy hay una cosa importante. Empieza por ahí.';
    if (todayCount > 1) return `Hoy tienes ${todayCount} cosas. Una a la vez.`;
    if (data.active.some((a) => a.next)) return '¿Cuál es el siguiente paso?';
    if (data.doneToday.length) return 'Buen avance hoy. Lo demás puede esperar.';
    return '¿Qué tienes en la cabeza?';
  }, [data, inbox]);

  async function quickSave() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    const p = parseCapture(text);
    await newEntry('inbox', { body: text.replace(/(^|\s)#[\p{L}\p{N}_-]+/gu, '$1').trim(), tags: p.tags });
    toast('A la bandeja. Ya lo ordenarás.');
  }

  const name = (profile?.name || prefs.name || '').trim();
  const intentions = (profile?.intentions ?? []).filter((x) => x.trim());
  const d = new Date();
  const dateLabel = `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`.replace(/^./, (ch) => ch.toUpperCase());
  const todayCount = data ? data.overdue.length + data.dueToday.length : 0;
  const hr = d.getHours();
  const pengItem: PengItem = hr < 12 ? 'taza' : hr < 19 ? 'nota' : 'estrella';

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-copy">
          <div className="desk-date"><span>{dateLabel}</span><span>Semana {isoWeek(d)}</span></div>
          <h1 className="desk-hello">{greeting(d)}{name ? <>, <span className="name">{name}</span></> : ''}</h1>
          {phrase && <p className="desk-phrase">{phrase}</p>}
          {data && (
            <div className="hero-chips">
              <Link to="/tareas"><b>{todayCount}</b> para hoy</Link>
              <Link to="/bandeja"><b>{inbox}</b> en la bandeja</Link>
              <Link to="/proyectos"><b>{data.active.length}</b> {data.active.length === 1 ? 'proyecto activo' : 'proyectos activos'}</Link>
            </div>
          )}
        </div>
        <div className="hero-art" aria-hidden="true"><Peng item={pengItem} size={150} /></div>
      </section>

      <div className="desk-capture">
        <IconPlus />
        <div className="grow">
          <AutoTextarea
            value={draft}
            placeholder="¿Qué tienes en la cabeza? Escríbelo y lo ordenas luego."
            aria-label="Captura rápida a la bandeja"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); quickSave(); }
            }}
          />
          <div className="hint">
            <span>Enter → Bandeja</span><span className="hidden-mobile">Shift+Enter nueva línea</span>
            <button className="btn btn-ghost btn-sm" onClick={() => openCapture({ text: draft })}>Más opciones</button>
          </div>
        </div>
        <button className="btn btn-primary" onClick={quickSave} disabled={!draft.trim()}>Guardar</button>
      </div>

      {!data ? null : (
        <div className="desk-grid">
          <div className="desk-col">
            <Section card label="Hoy" extra={<Link className="sec-extra" to="/tareas">Todas las tareas →</Link>}>
              {data.overdue.length + data.dueToday.length + data.eventsToday.length + data.remToday.length === 0 ? (
                <Empty
                  small
                  line={data.doneToday.length ? `Hoy completaste ${data.doneToday.length}. Bien.` : 'Nada con fecha para hoy.'}
                  hint="Elige un siguiente paso de tus proyectos, o descansa."
                />
              ) : (
                <div className="list">
                  {data.eventsToday.map((e) => (
                    <Link key={e.id} to={`/calendario?d=${e.date}`} className="item">
                      <span className="accent" style={{ width: 19, paddingTop: 1, textAlign: 'center' }}>◆</span>
                      <div className="item-main"><div className="item-title">{e.title}</div><div className="meta item-sub">Evento{e.time ? ` · ${e.time}` : ''}</div></div>
                    </Link>
                  ))}
                  {data.remToday.map((r) => <ReminderLine key={r.id} r={r} />)}
                  {[...data.overdue, ...data.dueToday].map((t) => (
                    <TaskRow key={t.id} task={t} project={t.projectId ? data.pById.get(t.projectId) : undefined} />
                  ))}
                </div>
              )}
            </Section>

            <Section card label="Siguiente paso" extra={<Link className="sec-extra" to="/proyectos">Proyectos →</Link>}>
              {data.active.length === 0 ? (
                <Empty small line="Ningún proyecto en marcha." hint="Convierte una idea en proyecto desde la Bandeja o Ideas." />
              ) : (
                data.active.map(({ p, prog, next }) => (
                  <div key={p.id} className="next-card">
                    <div className="nc-top">
                      <Link to={`/proyectos/${p.id}`} className="nc-project">{p.title}</Link>
                      <Stamp tone={PROJECT_STATUS[p.status].tone}>{PROJECT_STATUS[p.status].label}</Stamp>
                    </div>
                    <div className="row mt-1" style={{ gap: 10 }}>
                      <Ticks done={prog.done} total={prog.total} />
                      <span className="mono muted">{prog.total ? `${prog.pct}%` : 'sin acciones'}</span>
                    </div>
                    <div className="nc-step">
                      {next ? (
                        <>
                          <Check state={next.status} onToggle={() => toggleTask(next)} label={`Completar: ${next.title}`} priority={next.priority} />
                          <div className="grow">
                            <span className="lbl">Siguiente paso</span>
                            <span>{next.title}</span>
                          </div>
                        </>
                      ) : (
                        <Link to={`/proyectos/${p.id}#plan`} className="accent" style={{ fontSize: 14, fontWeight: 550 }}>
                          + Define el siguiente paso concreto
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </Section>
          </div>

          <div className="desk-col">
            <Section card label="Lo que importa" extra={<Link className="sec-extra" to="/perfil">Editar</Link>}>
              {intentions.length > 0 ? (
                <ol className="intent-list">{intentions.map((x, i) => <li key={i}>{x}</li>)}</ol>
              ) : (
                <p className="muted" style={{ fontSize: 14.5 }}>
                  Escribe las dos o tres cosas que de verdad importan este año y las verás aquí cada día.{' '}
                  <Link to="/perfil" className="accent" style={{ fontWeight: 600 }}>Definirlas →</Link>
                </p>
              )}
            </Section>

            <Section card label="Recién capturado" extra={inbox > 0 ? <Link className="sec-extra" to="/bandeja"><span className="accent">{inbox}</span> en bandeja →</Link> : undefined}>
              {data.recent.length === 0 ? (
                <Empty small line="Aún no has escrito nada." />
              ) : (
                <div className="list">
                  {data.recent.map((e) => (
                    <Link key={e.id} to={e.kind === 'inbox' ? '/bandeja' : `/e/${e.id}`} className="recent-note">
                      <div className="rn-title">{entryTitle(e)}</div>
                      <div className="meta item-sub"><span>{KIND_LABEL[e.kind]}</span><span>{ago(e.createdAt)}</span></div>
                    </Link>
                  ))}
                </div>
              )}
            </Section>

            <Section card label="Próximamente" extra={<Link className="sec-extra" to="/calendario?v=agenda">Agenda →</Link>}>
              {data.upcoming.length === 0 ? (
                <Empty small line="Las próximas dos semanas están despejadas." />
              ) : (
                <div className="list">
                  {data.upcoming.slice(0, 7).map((g) => {
                    const dd = parseISODate(g.date);
                    return (
                      <div key={g.date} className="upcoming-day">
                        <div className="ud-date"><b>{dd.getDate()}</b>{relDay(g.date)}</div>
                        <div className="stack" style={{ gap: 4 }}>
                          {g.items.map((u, i) =>
                            u.task ? (
                              <button key={i} style={{ textAlign: 'left' }} onClick={() => openTask(u.task!.id)}>
                                {u.task.title}{u.task.time && <span className="mono muted"> · {u.task.time}</span>}
                              </button>
                            ) : (
                              <Link key={i} to={u.href!} style={u.kind === 'deadline' ? { fontSize: 13.5, color: 'var(--warn)', fontWeight: 550 } : undefined}>
                                {u.kind === 'event' && <span className="accent">◆ </span>}{u.label}
                              </Link>
                            ),
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

function ReminderLine({ r }: { r: Reminder }) {
  const fired = !!r.firedAt;
  return (
    <div className="item">
      <span className={fired ? 'accent' : 'muted'} style={{ width: 22, paddingTop: 2 }}>
        {r.kind === 'alarma' ? <IconAlarm width={18} /> : <IconBell width={18} />}
      </span>
      <div className="item-main">
        <div className="item-title">{r.title}</div>
        <div className="meta item-sub">
          <span>{r.kind} · {fmtTime(r.at)}</span>
          {fired && <span className="accent">avisado</span>}
        </div>
      </div>
      <button className="btn btn-sm" onClick={() => patch<Reminder>('reminders', r.id, { done: true })}>Hecho</button>
    </div>
  );
}
