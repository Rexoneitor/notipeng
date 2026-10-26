// Lenguaje natural mínimo para la captura rápida (español).
// "Recordarme investigar proveedores el viernes a las 10:00 #negocio !alta"
//   → { text: 'Investigar proveedores', date: viernes, time: '10:00', tags: ['negocio'], priority: 'alta', reminder: true }
import { addDays, todayISO, toISODate } from './dates';
import type { Priority } from '../db/types';

export interface Parsed {
  text: string;
  date?: string;
  time?: string;
  tags: string[];
  priority?: Priority;
  /** El texto empieza con "recuérdame/recordarme/recordar" */
  reminder: boolean;
}

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

const DAYS: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
};
const MONTHS: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7,
  septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

export function parseCapture(input: string): Parsed {
  let s = ' ' + input.trim() + ' ';
  const out: Parsed = { text: '', tags: [], reminder: false };

  // #etiquetas
  s = s.replace(/(^|\s)#([\p{L}\p{N}_-]+)/gu, (_, sp, tag) => {
    out.tags.push(tag.toLowerCase());
    return sp;
  });

  // !alta !media !baja  (también !!! / !! / !)
  s = s.replace(/(^|\s)!(alta|media|baja)\b/giu, (_, sp, p) => {
    out.priority = p.toLowerCase() as Priority;
    return sp;
  });
  s = s.replace(/(^|\s)(!{1,3})(?=\s)/g, (_, sp, bangs: string) => {
    out.priority = bangs.length === 3 ? 'alta' : bangs.length === 2 ? 'media' : 'baja';
    return sp;
  });

  // Recordarme / recuérdame / recordar
  s = s.replace(/^\s*(recu[eé]rdame|recordarme|recordar|av[ií]same)\s+(que\s+|de\s+)?/iu, () => {
    out.reminder = true;
    return ' ';
  });

  // Hora: "a las 10", "a las 10:30", "10:30", "10am", "6 pm", "a las 6 de la tarde"
  const timeRe =
    /\s(?:a\s+las?\s+|a\s+la\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.\s?m\.|p\.\s?m\.|h|hs)?(?:\s+de\s+la\s+(mañana|manana|tarde|noche))?(?=\s)/giu;
  // Solo cuenta como hora si hay marcador ("a las", ":mm", am/pm…): "comprar 2 libros" no es una hora.
  const tm = [...s.matchAll(timeRe)].find((t) => /a\s+las?\s/i.test(t[0]) || t[2] || t[3] || t[4]);
  if (tm) {
    let h = Number(tm[1]);
    const m = Number(tm[2] || 0);
    if (h <= 23 && m <= 59) {
      const suf = (tm[3] || '').toLowerCase().replace(/[.\s]/g, '');
      const part = strip((tm[4] || '').toLowerCase());
      if ((suf === 'pm' || part === 'tarde' || part === 'noche') && h < 12) h += 12;
      if ((suf === 'am' || part === 'manana') && h === 12) h = 0;
      out.time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      s = s.replace(tm[0], ' ');
    }
  }

  // Fecha
  const lower = strip(s.toLowerCase());
  const today = todayISO();
  const tryRemove = (re: RegExp) => {
    const m = strip(s).match(re);
    if (m && m.index !== undefined) s = s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length);
  };

  let mm: RegExpMatchArray | null;
  if (/\spasado\s+manana(?=\s)/.test(lower)) {
    out.date = addDays(today, 2);
    tryRemove(/\s(para\s+)?pasado\s+ma[nñ]ana(?=\s)/i);
  } else if (/\smanana(?=\s)/.test(lower) && !/de\s+la\s+manana/.test(lower)) {
    out.date = addDays(today, 1);
    tryRemove(/\s(para\s+)?ma[nñ]ana(?=\s)/i);
  } else if (/\s(hoy|esta\s+noche|esta\s+tarde)(?=\s)/.test(lower)) {
    out.date = today;
    tryRemove(/\s(para\s+)?(hoy|esta\s+noche|esta\s+tarde)(?=\s)/i);
  } else if ((mm = lower.match(/\s(?:el\s+|este\s+|para\s+el\s+)?(proximo\s+)?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)(\s+que\s+viene)?(?=\s)/))) {
    const target = DAYS[mm[2]];
    const now = new Date();
    let diff = (target - now.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    if (mm[1] || mm[3]) diff = diff < 7 ? diff + 7 : diff;
    out.date = addDays(today, diff);
    tryRemove(/\s(?:el\s+|este\s+|para\s+el\s+)?(proximo\s+)?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)(\s+que\s+viene)?(?=\s)/i);
  } else if ((mm = lower.match(/\sen\s+(\d+)\s+(dias?|semanas?)(?=\s)/))) {
    const n = Number(mm[1]) * (mm[2].startsWith('semana') ? 7 : 1);
    out.date = addDays(today, n);
    tryRemove(/\sen\s+(\d+)\s+(dias?|semanas?)(?=\s)/i);
  } else if ((mm = lower.match(/\s(?:el\s+)?(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?(?=\s)/))) {
    const now = new Date();
    let y = mm[3] ? Number(mm[3]) : now.getFullYear();
    const d = new Date(y, MONTHS[mm[2]], Number(mm[1]));
    if (!mm[3] && toISODate(d) < today) d.setFullYear(++y);
    out.date = toISODate(d);
    tryRemove(/\s(?:el\s+)?(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?(?=\s)/i);
  } else if ((mm = lower.match(/\s(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s)/))) {
    const now = new Date();
    let y = mm[3] ? Number(mm[3].length === 2 ? '20' + mm[3] : mm[3]) : now.getFullYear();
    const d = new Date(y, Number(mm[2]) - 1, Number(mm[1]));
    if (!mm[3] && toISODate(d) < today) d.setFullYear(++y);
    out.date = toISODate(d);
    tryRemove(/\s(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s)/);
  }

  // Si hay hora pero no fecha: hoy (o mañana si la hora ya pasó).
  if (out.time && !out.date) {
    const [h, m] = out.time.split(':').map(Number);
    const n = new Date();
    out.date = h * 60 + m > n.getHours() * 60 + n.getMinutes() ? today : addDays(today, 1);
  }

  let text = s.replace(/\s{2,}/g, ' ').trim();
  text = text.replace(/\s+(el|para|a\s+las?)$/i, '').trim();
  if (out.reminder && text) text = text[0].toUpperCase() + text.slice(1);
  out.text = text;
  return out;
}
