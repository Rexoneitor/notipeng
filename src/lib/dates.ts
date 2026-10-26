// Utilidades de fecha en español, sin dependencias. Fechas de día como 'YYYY-MM-DD' locales.

export const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
/** Índice 0 = domingo (como Date.getDay) */
export const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const WEEKDAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = parseISODate(fromISO).getTime();
  const b = parseISODate(toISO).getTime();
  return Math.round((b - a) / 86400000);
}

/** Lunes de la semana de `iso`. */
export function startOfWeek(iso: string): string {
  const d = parseISODate(iso);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return toISODate(d);
}

export function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7);
}

/** "5 octubre 2026" */
export function fmtLong(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "lun 5 oct" (+ año si no es el actual) */
export function fmtShort(iso: string): string {
  const d = parseISODate(iso);
  const y = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}${y}`;
}

export function weekdayName(iso: string): string {
  return WEEKDAYS[parseISODate(iso).getDay()];
}

/** "hoy", "mañana", "ayer", "en 3 días", "hace 2 días", o fecha corta. */
export function relDay(iso: string): string {
  const n = daysBetween(todayISO(), iso);
  if (n === 0) return 'hoy';
  if (n === 1) return 'mañana';
  if (n === -1) return 'ayer';
  if (n > 1 && n < 7) return WEEKDAYS[parseISODate(iso).getDay()];
  if (n < 0 && n > -7) return `hace ${-n} días`;
  return fmtShort(iso);
}

export function fmtTime(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtDateTime(ms: number): string {
  const d = new Date(ms);
  return `${relDay(toISODate(d))} · ${fmtTime(ms)}`;
}

/** "hace 5 min", "hace 3 h", "ayer", fecha corta */
export function ago(ms: number): string {
  if (ms < 1e11) return '—'; // registros iniciales (updatedAt = 1)
  const s = (Date.now() - ms) / 1000;
  if (s < 60) return 'ahora';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400 && toISODate(new Date(ms)) === todayISO()) return `hace ${Math.floor(s / 3600)} h`;
  return relDay(toISODate(new Date(ms)));
}

export function combine(dateISO: string, time?: string | null): number {
  const d = parseISODate(dateISO);
  if (time) {
    const [h, m] = time.split(':').map(Number);
    d.setHours(h || 0, m || 0, 0, 0);
  } else d.setHours(9, 0, 0, 0);
  return d.getTime();
}

/** Valor para <input type="datetime-local"> */
export function toLocalInput(ms: number): string {
  const d = new Date(ms);
  return `${toISODate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'Buenas noches';
  if (h < 13) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Matriz de 6 semanas (lunes primero) para la vista mensual. */
export function monthGrid(year: number, month: number): string[] {
  const first = toISODate(new Date(year, month, 1));
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
