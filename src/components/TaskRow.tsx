import { Link } from 'react-router-dom';
import { moveTask, setTaskStatus } from '../db/repo';
import type { Project, Task } from '../db/types';
import { relDay, todayISO } from '../lib/dates';
import { playTick } from '../lib/sound';
import { openTask, toast } from '../lib/ui';
import { Check, Prio, Tags } from './ui';

export function toggleTask(t: Task) {
  const next = t.status === 'hecha' ? 'pendiente' : 'hecha';
  setTaskStatus(t.id, next);
  if (next === 'hecha') {
    playTick();
    toast('Hecho. Una cosa menos.', { label: 'Deshacer', run: () => setTaskStatus(t.id, t.status) });
  }
}

export function TaskRow({
  task, project, showProject = true, orderList, num, isNext, hasReminder,
}: {
  task: Task;
  project?: Project;
  showProject?: boolean;
  /** Si se pasa, aparecen botones para reordenar dentro de esta lista. */
  orderList?: Task[];
  num?: number;
  isNext?: boolean;
  hasReminder?: boolean;
}) {
  const done = task.status === 'hecha';
  const late = !done && task.due && task.due < todayISO();
  return (
    <div className={`item task-row ${isNext ? 'is-next' : ''}`}>
      {num !== undefined && <span className="plan-num">{String(num).padStart(2, '0')}</span>}
      <Check state={task.status} priority={task.priority} onToggle={() => toggleTask(task)} label={`Completar: ${task.title}`} />
      <div className="item-main">
        <div
          className={`item-title tr-title ${done ? 'done-text' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => openTask(task.id)}
          onKeyDown={(e) => e.key === 'Enter' && openTask(task.id)}
        >
          {task.title || <span className="faint">Sin título</span>}
        </div>
        <div className="item-sub meta">
          {task.status === 'progreso' && <span className="accent">● en progreso</span>}
          {task.due && <span className={late ? 'late' : ''}>{late ? 'vencida · ' : ''}{relDay(task.due)}{task.time ? ` · ${task.time}` : ''}</span>}
          {hasReminder && <span title="Tiene recordatorio">🔔</span>}
          {showProject && project && <Link to={`/proyectos/${project.id}`} onClick={(e) => e.stopPropagation()}>▲ {project.title}</Link>}
          <Tags tags={task.tags} />
          {task.notes && <span title="Tiene notas">¶</span>}
        </div>
      </div>
      <div className="item-side">
        <Prio p={task.priority} />
        {orderList && !done && (
          <span className="order-btns hover-actions">
            <button aria-label="Subir" onClick={() => moveTask(orderList, task.id, -1)}>▲</button>
            <button aria-label="Bajar" onClick={() => moveTask(orderList, task.id, 1)}>▼</button>
          </span>
        )}
      </div>
    </div>
  );
}
