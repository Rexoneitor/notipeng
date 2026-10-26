import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject, type TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import type { GoalStatus, IdeaStatus, Priority, ProjectStatus, TaskStatus } from '../db/types';
import {
  IconCalendar, IconCheck, IconClose, IconGoal, IconIdea, IconInbox, IconJournal, IconNote, IconProjects, IconRecent, IconTag, IconTasks,
} from './Icons';
import { Peng, type PengItem } from './Art';

// ─── Vocabulario ────────────────────────────────────────────────────────────

type Tone = 'accent' | 'ok' | 'warn' | 'ink' | 'faint' | undefined;

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: Tone }> = {
  idea: { label: 'Idea', tone: 'faint' },
  planificacion: { label: 'Planificación', tone: 'warn' },
  progreso: { label: 'En progreso', tone: 'accent' },
  pausado: { label: 'Pausado', tone: undefined },
  completado: { label: 'Completado', tone: 'ok' },
  archivado: { label: 'Archivado', tone: 'faint' },
};

export const IDEA_STATUS: Record<IdeaStatus, { label: string; tone: Tone }> = {
  nueva: { label: 'Nueva', tone: 'ink' },
  explorando: { label: 'Explorando', tone: 'warn' },
  interesante: { label: 'Interesante', tone: 'accent' },
  desarrollo: { label: 'En desarrollo', tone: 'accent' },
  convertida: { label: 'Convertida en proyecto', tone: 'ok' },
  descartada: { label: 'Descartada', tone: 'faint' },
};

export const TASK_STATUS: Record<TaskStatus, string> = {
  pendiente: 'Pendiente',
  progreso: 'En progreso',
  hecha: 'Completada',
};

export const GOAL_STATUS: Record<GoalStatus, { label: string; tone: Tone }> = {
  activo: { label: 'Activo', tone: 'accent' },
  logrado: { label: 'Logrado', tone: 'ok' },
  pausado: { label: 'Pausado', tone: undefined },
  archivado: { label: 'Archivado', tone: 'faint' },
};

export const PRIORITY_LABEL: Record<Priority, string> = { alta: 'Alta', media: 'Media', baja: 'Baja' };
const PRIO_MARK: Record<Priority, string> = { alta: '!!!', media: '!!', baja: '!' };

// ─── Primitivas ─────────────────────────────────────────────────────────────

const PAGE_ICON: Record<string, ReactNode> = {
  '01': <IconInbox />, '02': <IconJournal />, '03': <IconIdea />, '04': <IconNote />, '05': <IconTag />,
  '06': <IconProjects />, '07': <IconTasks />, '08': <IconGoal />, '09': <IconCalendar />, '10': <IconRecent />,
};

export function PageHeader({
  idx, kicker, title, sub, actions,
}: { idx?: string; kicker: string; title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  const icon = idx ? PAGE_ICON[idx] : undefined;
  return (
    <header className="ph">
      <div className="ph-row">
        <div className="ph-main">
          {icon && <span className="ph-icon" aria-hidden="true">{icon}</span>}
          <div>
            <div className="ph-kicker"><span>{kicker.replace(/ · /g, ' / ')}</span></div>
            <h1 className="ph-title">{title}</h1>
            {sub && <p className="ph-sub">{sub}</p>}
          </div>
        </div>
        {actions && <div className="ph-actions">{actions}</div>}
      </div>
    </header>
  );
}

export function Section({
  label, extra, children, id, className, card,
}: { idx?: string; label: string; extra?: ReactNode; children: ReactNode; id?: string; className?: string; card?: boolean }) {
  return (
    <section className={`${card ? 'card panel' : 'block'} ${className ?? ''}`} id={id}>
      <h2 className="sec">
        <span className="sec-title">{label}</span>
        {extra}
      </h2>
      {children}
    </section>
  );
}

export function Stamp({ tone, children }: { tone?: Tone; children: ReactNode }) {
  return <span className="stamp" data-tone={tone}>{children}</span>;
}

export function Prio({ p }: { p?: Priority | null }) {
  if (!p) return null;
  return <span className="prio" data-p={p} title={`Prioridad ${PRIORITY_LABEL[p].toLowerCase()}`}>{PRIO_MARK[p]}</span>;
}

/** Barra de progreso: ancho = acciones hechas / acciones totales. */
export function Ticks({ done, total, lg }: { done: number; total: number; n?: number; lg?: boolean }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <span className={`ticks ${lg ? 'lg' : ''}`} role="img" aria-label={`${done} de ${total} completadas`}>
      <i style={{ width: `${pct}%` }} />
    </span>
  );
}

export function ProgressLine({ done, total, n = 20 }: { done: number; total: number; n?: number }) {
  if (!total) return <span className="mono muted">sin acciones aún</span>;
  return (
    <span className="progress-line">
      <Ticks done={done} total={total} n={n} />
      <span className="pct">{done}/{total}</span>
    </span>
  );
}

export function Tags({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;
  return <>{tags.map((t) => <Link key={t} className="tag" to={`/etiqueta/${encodeURIComponent(t)}`} onClick={(e) => e.stopPropagation()}>{t}</Link>)}</>;
}

export function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const t = draft.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-');
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft('');
  };
  return (
    <span className="tag-input">
      {value.map((t) => (
        <span key={t} className="tag-x">
          <span className="tag">{t}</span>
          <button type="button" aria-label={`Quitar ${t}`} onClick={() => onChange(value.filter((x) => x !== t))}>×</button>
        </span>
      ))}
      <input
        value={draft}
        placeholder="+ etiqueta"
        aria-label="Añadir etiqueta"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',' || e.key === ' ') { e.preventDefault(); add(); }
          if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
      />
    </span>
  );
}

export function Empty({ line, hint, small, children, peng }: { line: string; hint?: string; small?: boolean; children?: ReactNode; peng?: PengItem }) {
  return (
    <div className={`empty ${small ? 'small' : ''}`}>
      {!small && <Peng item={peng ?? null} size={104} />}
      <div className="empty-line">{line}</div>
      {hint && <div className="empty-hint">{hint}</div>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

export function Check({
  state, onToggle, priority, label,
}: { state: TaskStatus; onToggle: () => void; priority?: Priority | null; label: string }) {
  return (
    <button
      type="button"
      className="check"
      data-state={state}
      data-p={priority ?? undefined}
      role="checkbox"
      aria-checked={state === 'hecha'}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
    >
      <IconCheck />
    </button>
  );
}

/** Textarea que crece con el contenido. */
export function AutoTextarea({
  ref: outer, ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: RefObject<HTMLTextAreaElement | null> }) {
  const inner = useRef<HTMLTextAreaElement>(null);
  const ref = outer ?? inner;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [props.value, ref]);
  return <textarea ref={ref} rows={1} {...props} />;
}

export function Modal({
  title, onClose, children, footer, wide, className,
}: { title?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey, true);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`sheet ${wide ? 'wide' : ''} ${className ?? ''}`} role="dialog" aria-modal="true">
        <div className="grabber" />
        {title !== undefined && (
          <div className="sheet-head">
            <span>{title}</span>
            <span className="spacer" />
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Cerrar"><IconClose /></button>
          </div>
        )}
        {children}
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

/** Guarda con retardo mientras se escribe y al desmontar. */
export function useDebounced<T>(value: T, save: (v: T) => void, ms = 500) {
  const saved = useRef(JSON.stringify(value));
  const latest = useRef(value);
  const saveRef = useRef(save);
  saveRef.current = save;
  const [pending, setPending] = useState(false);
  latest.current = value;
  const flush = () => {
    const s = JSON.stringify(latest.current);
    if (s === saved.current) return;
    saved.current = s;
    saveRef.current(latest.current);
  };
  useEffect(() => {
    if (JSON.stringify(value) === saved.current) { setPending(false); return; }
    setPending(true);
    const t = setTimeout(() => { flush(); setPending(false); }, ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  useEffect(() => () => flush(), []);
  return pending;
}
