// Preferencias visuales por dispositivo (localStorage). Se aplican como data-atributos en <html>.
import { useSyncExternalStore } from 'react';

export type ThemePref = 'light' | 'dark' | 'auto';
export type Accent = 'glaciar' | 'aurora' | 'violeta' | 'atardecer' | 'musgo' | 'grafito' | 'custom';
export type Typeset = 'hielo' | 'editorial' | 'laboratorio';
export type Density = 'comoda' | 'compacta';

export interface Prefs {
  theme: ThemePref;
  accent: Accent;
  customAccent: string;
  typeset: Typeset;
  density: Density;
  name: string;
  sounds: boolean;
}

export const ACCENTS: { key: Exclude<Accent, 'custom'>; label: string; light: string; dark: string }[] = [
  { key: 'glaciar', label: 'Glaciar', light: '#1A66CF', dark: '#62B0FF' },
  { key: 'aurora', label: 'Aurora', light: '#087568', dark: '#3DD9BE' },
  { key: 'violeta', label: 'Violeta', light: '#5A47D6', dark: '#A596FF' },
  { key: 'atardecer', label: 'Atardecer', light: '#C0451B', dark: '#FF8A63' },
  { key: 'musgo', label: 'Musgo', light: '#2F7A4C', dark: '#7DCB95' },
  { key: 'grafito', label: 'Grafito', light: '#3A4A5E', dark: '#AEBFD4' },
];

export const TYPESETS: { key: Typeset; label: string; desc: string }[] = [
  { key: 'hielo', label: 'Hielo', desc: 'Onest · JetBrains Mono — limpia y moderna' },
  { key: 'editorial', label: 'Editorial', desc: 'Fraunces · Newsreader — para escribir largo' },
  { key: 'laboratorio', label: 'Laboratorio', desc: 'JetBrains Mono · IBM Plex Sans — técnica' },
];

const KEY = 'bitacora.prefs';
const DEFAULTS: Prefs = {
  theme: 'auto',
  accent: 'glaciar',
  customAccent: '#1A66CF',
  typeset: 'hielo',
  density: 'comoda',
  name: '',
  sounds: false,
};

let current: Prefs = load();
const subs = new Set<() => void>();

function load(): Prefs {
  try {
    const p = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') } as Prefs;
    if (!TYPESETS.some((t) => t.key === p.typeset)) p.typeset = DEFAULTS.typeset;
    if (p.accent !== 'custom' && !ACCENTS.some((a) => a.key === p.accent)) p.accent = DEFAULTS.accent;
    return p;
  } catch {
    return DEFAULTS;
  }
}

export function getPrefs() {
  return current;
}

export function setPrefs(p: Partial<Prefs>) {
  current = { ...current, ...p };
  localStorage.setItem(KEY, JSON.stringify(current));
  applyPrefs();
  subs.forEach((f) => f());
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => current,
  );
}

const mq = window.matchMedia('(prefers-color-scheme: dark)');
mq.addEventListener('change', () => current.theme === 'auto' && applyPrefs());

export function isDark() {
  return current.theme === 'dark' || (current.theme === 'auto' && mq.matches);
}

export function applyPrefs() {
  const d = document.documentElement;
  const dark = isDark();
  d.dataset.theme = dark ? 'dark' : 'light';
  d.dataset.accent = current.accent;
  d.dataset.type = current.typeset;
  d.dataset.density = current.density;
  if (current.accent === 'custom') {
    d.style.setProperty('--accent-custom', current.customAccent);
  } else d.style.removeProperty('--accent-custom');
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', dark ? '#0A1322' : '#F2F6FA');
}
