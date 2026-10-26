// Sonidos sintetizados (sin archivos). Solo dos: completar (opcional) y alarma.
import { getPrefs } from './prefs';

let ctx: AudioContext | null = null;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, gain = 0.08, type: OscillatorType = 'sine') {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

/** Un "tic" de lápiz al completar algo. Solo si el usuario lo activó. */
export function playTick() {
  if (!getPrefs().sounds) return;
  try {
    tone(1320, 0, 0.08, 0.05, 'triangle');
    tone(1760, 0.05, 0.12, 0.04, 'triangle');
  } catch {}
}

/** Campana de alarma: tres golpes suaves. */
export function playAlarm() {
  try {
    [0, 0.45, 0.9].forEach((t) => {
      tone(880, t, 0.6, 0.12);
      tone(1320, t, 0.4, 0.05);
    });
  } catch {}
}
