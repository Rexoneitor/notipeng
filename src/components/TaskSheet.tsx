import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useGoals, usePhases, useProjects } from '../db/hooks';
import { newReminder, patch, remove, restore, setTaskStatus } from '../db/repo';
import type { Priority, Reminder, ReminderKind, Task } from '../db/types';
import { combine, fmtDateTime, toLocalInput } from '../lib/dates';
import { ensurePermission } from '../lib/reminders';
import { closeTask, toast } from '../lib/ui';
import { IconAlarm, IconBell, IconTrash } from './Icons';
import { AutoTextarea, Modal, TagInput, TASK_STATUS, useDebounced } from './ui';

export function TaskSheet({ id }: { id: string }) {
  const task = useLiveQuery(() => db.tasks.get(id), [id]);
  if (task === undefined) return null;
  if (!task || task.deletedAt) {
    return (
      <Modal title="Tarea" onClose={closeTask}>
        <div className="sheet-body"><p className="muted">Esta tarea ya no existe.</p></div>
      </Modal>
    );
  }
  return <TaskEditor task={task} />;
}

function TaskEditor({ task }: { task: Task }) {
  const projects = useProjects() ?? [];
  const goals = useGoals() ?? [];
  const phases = usePhases(task.projectId ?? undefined) ?? [];
  const reminders = useLiveQuery(
    () => db.reminders.where('refId').equals(task.id).filter((r) => !r.deletedAt).sortBy('at'),
    [task.id],
  ) ?? [];

  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  useDebounced({ title, notes }, (v) => patch<Task>('tasks', task.id, v));

  const [remAt, setRemAt] = useState(() =>
    toLocalInput(task.due ? combine(task.due, task.time) : Date.now() + 3600000),
  );
  const [remKind, setRemKind] = useState<ReminderKind>('recordatorio');
  useEffect(() => {
    if (task.due) setRemAt(toLocalInput(combine(task.due, task.time)));
  }, [task.due, task.time]);

  const set = (p: Partial<Task>) => patch<Task>('tasks', task.id, p);

  async function addReminder() {
    const at = new Date(remAt).getTime();
    if (!at) return;
    await newReminder({ title: title || 'Tarea', at, kind: remKind, refType: 'task', refId: task.id });
    const ok = await ensurePermission();
    toast(ok ? 'Te avisaré.' : 'Guardado. Activa las notificaciones en Ajustes para recibir avisos del sistema.');
  }

  return (
    <Modal
      title="Tarea"
      onClose={closeTask}
      footer={
        <>
          <button
            className="btn btn-ghost btn-danger"
            onClick={async () => {
              await remove('tasks', task.id);
              closeTask();
              toast('Tarea enviada a la papelera.', { label: 'Deshacer', run: () => restore('tasks', task.id) });
            }}
          >
            <IconTrash /> Eliminar
          </button>
          <span className="spacer" />
          <button className="btn btn-primary" onClick={closeTask}>Listo</button>
        </>
      }
    >
      <div className="sheet-body stack" style={{ gap: 18 }}>
        <AutoTextarea
          className="write-title"
          style={{ fontSize: '1.6rem' }}
          value={title}
          placeholder="¿Qué hay que hacer?"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          aria-label="Título"
        />

        <div className="row wrap" style={{ gap: 14 }}>
          <div className="field">
            <span>Estado</span>
            <div className="seg">
              {(Object.keys(TASK_STATUS) as Task['status'][]).map((s) => (
                <button key={s} aria-pressed={task.status === s} onClick={() => setTaskStatus(task.id, s)}>{TASK_STATUS[s]}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <span>Prioridad</span>
            <div className="seg">
              {(['alta', 'media', 'baja'] as Priority[]).map((p) => (
                <button key={p} aria-pressed={task.priority === p} onClick={() => set({ priority: task.priority === p ? null : p })}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid-2">
          <label className="field">
            <span>Fecha</span>
            <input type="date" className="input mono-in" value={task.due ?? ''} onChange={(e) => set({ due: e.target.value || null })} />
          </label>
          <label className="field">
            <span>Hora</span>
            <input type="time" className="input mono-in" value={task.time ?? ''} onChange={(e) => set({ time: e.target.value || null })} />
          </label>
          <label className="field">
            <span>Proyecto</span>
            <select className="select" value={task.projectId ?? ''} onChange={(e) => set({ projectId: e.target.value || null, phaseId: null })}>
              <option value="">— Ninguno —</option>
              {projects.filter((p) => p.status !== 'archivado' || p.id === task.projectId).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </label>
          {task.projectId && phases.length > 0 ? (
            <label className="field">
              <span>Fase del roadmap</span>
              <select className="select" value={task.phaseId ?? ''} onChange={(e) => set({ phaseId: e.target.value || null })}>
                <option value="">— Sin fase —</option>
                {phases.map((p, i) => <option key={p.id} value={p.id}>{`F${i + 1} · ${p.title}`}</option>)}
              </select>
            </label>
          ) : (
            <label className="field">
              <span>Objetivo</span>
              <select className="select" value={task.goalId ?? ''} onChange={(e) => set({ goalId: e.target.value || null })}>
                <option value="">— Ninguno —</option>
                {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </label>
          )}
        </div>

        <label className="field">
          <span>Notas</span>
          <AutoTextarea className="textarea" value={notes} placeholder="Detalles, contexto, enlaces…" onChange={(e) => setNotes(e.target.value)} />
        </label>

        <div className="field">
          <span>Etiquetas</span>
          <TagInput value={task.tags} onChange={(tags) => set({ tags })} />
        </div>

        <div className="field">
          <span>Recordatorios</span>
          {reminders.map((r: Reminder) => (
            <div key={r.id} className="row mono" style={{ fontSize: 12 }}>
              {r.kind === 'alarma' ? <IconAlarm width={15} /> : <IconBell width={15} />}
              <span className={r.done || r.firedAt ? 'faint' : ''}>{fmtDateTime(r.at)}{r.kind === 'alarma' ? ' · alarma' : ''}{r.firedAt ? ' · avisado' : ''}</span>
              <span className="grow" />
              <button className="btn btn-ghost btn-sm" onClick={() => remove('reminders', r.id)}>Quitar</button>
            </div>
          ))}
          <div className="row wrap">
            <input type="datetime-local" className="input mono-in" style={{ maxWidth: 230 }} value={remAt} onChange={(e) => setRemAt(e.target.value)} aria-label="Fecha y hora del aviso" />
            <div className="seg">
              <button aria-pressed={remKind === 'recordatorio'} onClick={() => setRemKind('recordatorio')}>Aviso</button>
              <button aria-pressed={remKind === 'alarma'} onClick={() => setRemKind('alarma')}>Alarma</button>
            </div>
            <button className="btn btn-sm" onClick={addReminder}><IconBell /> Añadir</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
