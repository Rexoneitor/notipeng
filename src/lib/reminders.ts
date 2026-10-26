// Recordatorios y alarmas.
// Implementación web: un planificador revisa cada pocos segundos mientras la app está abierta
// (o en segundo plano reciente) y dispara una notificación del sistema + aviso dentro de la app.
// Limitación de la plataforma web: con la app totalmente cerrada no hay disparo; al abrirla se
// muestran los perdidos. La interfaz `Scheduler` permite sustituir esto por notificaciones
// locales nativas (Capacitor) o Web Push sin tocar la UI. Ver docs/ARQUITECTURA.md §2.
import { db } from '../db/db';
import type { Reminder } from '../db/types';
import { patch } from '../db/repo';
import { playAlarm } from './sound';

export interface Scheduler {
  start(): void;
  stop(): void;
}

type Listener = (r: Reminder) => void;
const listeners = new Set<Listener>();
export function onReminderFired(f: Listener) {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
}

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function permission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

/** Pide permiso solo cuando tiene sentido (al crear el primer recordatorio o desde Ajustes). */
export async function ensurePermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

export function refUrl(r: Pick<Reminder, 'refType' | 'refId'>): string {
  switch (r.refType) {
    case 'task': return `/tareas?t=${r.refId}`;
    case 'project': return `/proyectos/${r.refId}`;
    case 'goal': return `/objetivos/${r.refId}`;
    case 'entry': return `/e/${r.refId}`;
    default: return '/';
  }
}

export async function showSystemNotification(title: string, body: string, opts: { url?: string; tag?: string; alarm?: boolean } = {}) {
  if (permission() !== 'granted') return false;
  const options: NotificationOptions & Record<string, unknown> = {
    body,
    tag: opts.tag,
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    data: { url: opts.url ?? '/' },
    requireInteraction: !!opts.alarm,
    vibrate: opts.alarm ? [300, 150, 300, 150, 300] : [80],
  };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, options);
      return true;
    }
  } catch {}
  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

function nextOccurrence(r: Reminder): number | null {
  if (!r.repeat || r.repeat === 'none') return null;
  const step = r.repeat === 'daily' ? 86400000 : 7 * 86400000;
  let at = r.at;
  while (at <= Date.now()) at += step;
  return at;
}

async function fire(r: Reminder) {
  const next = nextOccurrence(r);
  // Repetición: se reprograma; el aviso actual sigue mostrándose en la app.
  await patch<Reminder>('reminders', r.id, next ? { at: next, firedAt: null } : { firedAt: Date.now() });
  const alarm = r.kind === 'alarma';
  if (alarm) playAlarm();
  if (document.hidden || alarm) {
    await showSystemNotification(alarm ? `⏰ ${r.title}` : r.title, alarm ? 'Alarma' : 'Recordatorio', {
      url: refUrl(r),
      tag: r.id,
      alarm,
    });
  }
  listeners.forEach((f) => f(r));
}

let busy = false;
export async function checkDue() {
  if (busy) return;
  busy = true;
  try {
    const now = Date.now();
    const due = await db.reminders
      .where('at')
      .belowOrEqual(now)
      .filter((r) => !r.deletedAt && !r.done && !r.firedAt)
      .toArray();
    for (const r of due) await fire(r);
  } finally {
    busy = false;
  }
}

class WebScheduler implements Scheduler {
  private timer: number | undefined;
  private onVis = () => document.visibilityState === 'visible' && checkDue();
  start() {
    checkDue();
    this.timer = window.setInterval(checkDue, 10_000);
    document.addEventListener('visibilitychange', this.onVis);
  }
  stop() {
    clearInterval(this.timer);
    document.removeEventListener('visibilitychange', this.onVis);
  }
}

export const scheduler: Scheduler = new WebScheduler();
