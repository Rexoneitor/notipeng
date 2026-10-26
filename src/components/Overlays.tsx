import { useNavigate } from 'react-router-dom';
import { patch } from '../db/repo';
import type { Reminder } from '../db/types';
import { fmtTime } from '../lib/dates';
import { refUrl } from '../lib/reminders';
import { dismissToast, showAlarm, useUI } from '../lib/ui';

export function Toasts() {
  const { toasts } = useUI();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span className="dot" />
          <span className="grow">{t.text}</span>
          {t.action && (
            <button className="btn btn-sm" onClick={() => { t.action!.run(); dismissToast(t.id); }}>{t.action.label}</button>
          )}
        </div>
      ))}
    </div>
  );
}

/** Alarma: ocupa la pantalla hasta que la atiendes. Recordatorios ≠ alarmas. */
export function AlarmOverlay() {
  const { alarm } = useUI();
  const navigate = useNavigate();
  if (!alarm) return null;
  const done = async () => {
    await patch<Reminder>('reminders', alarm.id, { done: true });
    showAlarm(null);
  };
  const snooze = async () => {
    await patch<Reminder>('reminders', alarm.id, { at: Date.now() + 10 * 60000, firedAt: null });
    showAlarm(null);
  };
  return (
    <div className="alarm" role="alertdialog" aria-label={`Alarma: ${alarm.title}`}>
      <div className="alarm-card">
        <div className="mono caps muted"><span className="alarm-ring">⏰</span> Alarma</div>
        <div className="alarm-time mt-2">{fmtTime(Date.now())}</div>
        <div className="alarm-title">{alarm.title}</div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn" onClick={snooze}>Posponer 10 min</button>
          {alarm.refType && (
            <button className="btn" onClick={async () => { await done(); navigate(refUrl(alarm)); }}>Abrir</button>
          )}
          <button className="btn btn-accent" autoFocus onClick={done}>Hecho</button>
        </div>
      </div>
    </div>
  );
}
