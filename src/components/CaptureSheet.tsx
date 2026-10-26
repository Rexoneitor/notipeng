import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { newEntry, newReminder, newTask } from '../db/repo';
import type { ReminderKind } from '../db/types';
import { combine, fmtShort, relDay, toLocalInput } from '../lib/dates';
import { parseCapture } from '../lib/parse';
import { ensurePermission } from '../lib/reminders';
import { MOD, closeCapture, toast, type CaptureKind, type CaptureOpts } from '../lib/ui';
import { Modal } from './ui';

const KINDS: { key: CaptureKind; label: string; dest: string }[] = [
  { key: 'inbox', label: 'Bandeja', dest: '/bandeja' },
  { key: 'task', label: 'Tarea', dest: '/tareas' },
  { key: 'idea', label: 'Idea', dest: '/ideas' },
  { key: 'note', label: 'Nota', dest: '/notas' },
  { key: 'journal', label: 'Diario', dest: '/diario' },
  { key: 'reminder', label: 'Recordatorio', dest: '/calendario?v=agenda' },
];

const PLACEHOLDERS = [
  '¿Qué tienes en la cabeza?',
  'Escríbelo. Ya lo ordenarás después.',
  'Una idea, una tarea, una preocupación…',
];

export function CaptureSheet({ opts }: { opts: CaptureOpts }) {
  const navigate = useNavigate();
  const [text, setText] = useState(opts.text ?? '');
  const [kind, setKind] = useState<CaptureKind>(opts.kind ?? 'inbox');
  const [picked, setPicked] = useState(!!opts.kind);
  const [notify, setNotify] = useState(true);
  const [alarm, setAlarm] = useState<ReminderKind>('recordatorio');
  const [when, setWhen] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const placeholder = useMemo(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)], []);

  const parsed = useMemo(() => parseCapture(text), [text]);

  // "Recuérdame…" sugiere Recordatorio si el usuario no eligió otra cosa.
  useEffect(() => {
    if (!picked) setKind(parsed.reminder ? 'reminder' : opts.kind ?? 'inbox');
  }, [parsed.reminder, picked, opts.kind]);

  useEffect(() => {
    if (parsed.date) setWhen(toLocalInput(combine(parsed.date, parsed.time)));
    else if (!when) setWhen(toLocalInput(Date.now() + 3600000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.date, parsed.time]);

  useEffect(() => {
    // En iOS el foco debe darse en el mismo gesto; autoFocus cubre la mayoría de casos.
    const t = setTimeout(() => ref.current?.focus(), 30);
    return () => clearTimeout(t);
  }, []);

  const bodyText = () => text.replace(/(^|\s)#[\p{L}\p{N}_-]+/gu, '$1').replace(/(^|\s)!(alta|media|baja)\b/giu, '$1').trim();

  async function save() {
    if (!text.trim()) return;
    const k = KINDS.find((x) => x.key === kind)!;
    if (kind === 'task') {
      const task = await newTask({
        title: parsed.text || bodyText(),
        due: parsed.date ?? null,
        time: parsed.time ?? null,
        priority: parsed.priority ?? null,
        tags: parsed.tags,
        projectId: opts.projectId ?? null,
      });
      if (parsed.date && parsed.time && notify) {
        await newReminder({ title: task.title, at: combine(parsed.date, parsed.time), refType: 'task', refId: task.id });
        ensurePermission();
      }
    } else if (kind === 'reminder') {
      const at = when ? new Date(when).getTime() : Date.now() + 3600000;
      await newReminder({ title: parsed.text || bodyText(), at, kind: alarm });
      ensurePermission();
    } else {
      await newEntry(kind, {
        body: bodyText(),
        tags: parsed.tags,
        priority: parsed.priority ?? null,
        projectId: opts.projectId ?? null,
      });
    }
    closeCapture();
    toast(`Guardado en ${k.label}`, { label: 'Ver', run: () => navigate(k.dest) });
  }

  const showWhen = kind === 'reminder';
  const showNotify = kind === 'task' && parsed.date && parsed.time;

  return (
    <Modal
      title="Capturar"
      onClose={closeCapture}
      footer={
        <>
          <span className="mono faint hidden-mobile">{MOD}+Enter para guardar · Esc para cerrar</span>
          <span className="spacer" />
          <button className="btn btn-ghost" onClick={closeCapture}>Cancelar</button>
          <button className="btn btn-accent" onClick={save} disabled={!text.trim()}>Guardar</button>
        </>
      }
    >
      <div className="sheet-body">
        <textarea
          ref={ref}
          autoFocus
          className="capture-text"
          value={text}
          placeholder={placeholder}
          aria-label="Texto a capturar"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save(); }
          }}
        />
        <div className="detected" aria-live="polite">
          {parsed.date && <span className="chip">📅 {relDay(parsed.date)} · {fmtShort(parsed.date)}</span>}
          {parsed.time && <span className="chip">⏱ {parsed.time}</span>}
          {parsed.priority && <span className="chip">prioridad {parsed.priority}</span>}
          {parsed.tags.map((t) => <span key={t} className="chip">#{t}</span>)}
        </div>
        <div className="mt-2">
          <div className="label mb-2" style={{ marginBottom: 8 }}>Guardar como</div>
          <div className="kind-picker" role="radiogroup" aria-label="Tipo">
            {KINDS.map((k) => (
              <button
                key={k.key}
                className="chip"
                role="radio"
                aria-checked={kind === k.key}
                aria-pressed={kind === k.key}
                onClick={() => { setKind(k.key); setPicked(true); }}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>
        {showWhen && (
          <div className="row wrap mt-2">
            <label className="field grow">
              <span>Cuándo</span>
              <input type="datetime-local" className="input mono-in" value={when} onChange={(e) => setWhen(e.target.value)} />
            </label>
            <div className="field">
              <span>Tipo</span>
              <div className="seg">
                <button aria-pressed={alarm === 'recordatorio'} onClick={() => setAlarm('recordatorio')}>Recordatorio</button>
                <button aria-pressed={alarm === 'alarma'} onClick={() => setAlarm('alarma')}>Alarma</button>
              </div>
            </div>
          </div>
        )}
        {showNotify && (
          <label className="row mt-2 mono muted" style={{ fontSize: 12 }}>
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Avisarme {relDay(parsed.date!)} a las {parsed.time}
          </label>
        )}
      </div>
    </Modal>
  );
}
