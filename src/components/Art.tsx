// Identidad visual de Notipeng: logo, mascota y avatares. Vectorial, plano y limpio.
import type { ReactNode } from 'react';
import type { AvatarSticker } from '../db/types';

const NAVY = '#0b1b2e';
const ICE = '#f3f8fd';
const BEAK = '#ff9f43';

/** Marca: pingüino geométrico sobre hielo. Mismo dibujo que el icono de la app. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lg-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4f1ff" />
          <stop offset="1" stopColor="#9cc9f5" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#lg-bg)" />
      <ellipse cx="32" cy="38" rx="15" ry="18" fill={NAVY} />
      <ellipse cx="32" cy="41" rx="9.5" ry="13.5" fill={ICE} />
      <circle cx="26.6" cy="27.6" r="2.3" fill="#fff" />
      <circle cx="37.4" cy="27.6" r="2.3" fill="#fff" />
      <circle cx="26.9" cy="27.9" r="1.1" fill={NAVY} />
      <circle cx="37.1" cy="27.9" r="1.1" fill={NAVY} />
      <path d="M32 30.4l3.6 2.6-3.6 2.2-3.6-2.2z" fill={BEAK} />
      <path d="M22 55.5h8.2l-1.4-3.5h-6zM33.8 55.5H42l-1.4-3.5h-6z" fill={BEAK} />
    </svg>
  );
}

export type PengItem = 'nota' | 'idea' | 'brujula' | 'taza' | 'estrella' | null;

/** Peng, la mascota. Aparece en estados vacíos y en la Mesa; nunca estorba. */
export function Peng({ item = null, size = 120, floe = true }: { item?: PengItem; size?: number; floe?: boolean }) {
  const things: Record<Exclude<PengItem, null>, ReactNode> = {
    nota: (
      <g transform="rotate(-8 100 84)">
        <rect x="86" y="70" width="26" height="30" rx="3" fill="#fff" stroke={NAVY} strokeWidth="2" />
        <path d="M91 79h16M91 85h16M91 91h10" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    ),
    idea: (
      <g>
        <circle cx="100" cy="74" r="10" fill="#ffe27a" stroke={NAVY} strokeWidth="2" />
        <path d="M96 85h8v4h-8z" fill="#c7d3e0" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" />
        <path d="M100 56v-5M88 60l-3-3M112 60l3-3" stroke="#ffb703" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    ),
    brujula: (
      <g>
        <circle cx="100" cy="82" r="13" fill="#fff" stroke={NAVY} strokeWidth="2" />
        <path d="M106 76l-3.5 9-9 3.5 3.5-9z" fill="var(--accent)" stroke={NAVY} strokeWidth="1.6" strokeLinejoin="round" />
      </g>
    ),
    taza: (
      <g>
        <path d="M89 78h20v10a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" fill="#fff" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" />
        <path d="M109 81h3a4 4 0 0 1 0 8h-3" fill="none" stroke={NAVY} strokeWidth="2" />
        <path d="M94 72c-2-3 2-4 0-7M101 72c-2-3 2-4 0-7" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    estrella: <path d="M100 66l3.6 7.4 8.1 1.1-5.9 5.6 1.5 8-7.3-3.9-7.3 3.9 1.5-8-5.9-5.6 8.1-1.1z" fill="#ffd966" stroke={NAVY} strokeWidth="1.8" strokeLinejoin="round" />,
  };
  return (
    <svg className="peng" width={size} height={size * 0.92} viewBox="0 0 160 148" aria-hidden="true">
      {floe && (
        <>
          <ellipse cx="80" cy="134" rx="62" ry="9" fill="var(--ice-floe)" />
          <ellipse cx="80" cy="131" rx="52" ry="6.5" fill="var(--ice-floe-top)" />
        </>
      )}
      <path d="M62 128h14l-3-8H64zM84 128h14l-3-8H87z" fill={BEAK} />
      <ellipse cx="80" cy="82" rx="34" ry="44" fill={NAVY} />
      <ellipse cx="80" cy="90" rx="22" ry="34" fill={ICE} />
      <path d="M48 76c-9 6-12 20-6 32 4-4 8-14 10-24z" fill={NAVY} />
      <path d="M112 76c9 6 12 20 6 32-4-4-8-14-10-24z" fill={NAVY} />
      <circle cx="68" cy="58" r="5.2" fill="#fff" />
      <circle cx="92" cy="58" r="5.2" fill="#fff" />
      <circle cx="69" cy="59" r="2.5" fill={NAVY} />
      <circle cx="91" cy="59" r="2.5" fill={NAVY} />
      <path d="M80 62l8.4 6-8.4 5-8.4-5z" fill={BEAK} />
      <path d="M52 76q28 12 56 0v8q-28 12-56 0z" fill="var(--accent)" />
      <path d="M100 82v22q2 6 7 6l1-8-3-5z" fill="var(--accent)" />
      {item && things[item]}
    </svg>
  );
}

// ─── Avatares ───────────────────────────────────────────────────────────────

export const STICKERS: AvatarSticker[] = ['letra', 'estrella', 'luna', 'sol', 'hoja', 'llama', 'rayo', 'barco', 'brujula'];

export const STICKER_LABEL: Record<AvatarSticker, string> = {
  sol: 'Sol', luna: 'Luna', barco: 'Barco', brujula: 'Brújula', hoja: 'Hoja', estrella: 'Estrella', rayo: 'Rayo', llama: 'Llama', letra: 'Inicial',
};

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function Glyph({ s, letter }: { s: AvatarSticker; letter: string }) {
  const g: Record<AvatarSticker, ReactNode> = {
    sol: <><circle cx="20" cy="20" r="6" {...line} /><path d="M20 7v4M20 29v4M7 20h4M29 20h4M10.8 10.8l2.8 2.8M26.4 26.4l2.8 2.8M29.2 10.8l-2.8 2.8M13.6 26.4l-2.8 2.8" {...line} /></>,
    luna: <path d="M26 24.5A10 10 0 0 1 15.5 9a10 10 0 1 0 10.5 15.5z" {...line} />,
    barco: <><path d="M20 8v17M20 9c5 3 8 8 8 14h-8zM18 12c-3 3-5 6-6 11h6" {...line} /><path d="M9 27h22l-3 5H12z" {...line} /></>,
    brujula: <><circle cx="20" cy="20" r="11" {...line} /><path d="M24.5 15.5 22 22l-6.5 2.5L18 18z" {...line} /></>,
    hoja: <><path d="M10 30C9 18 17 9 31 9c0 14-8 22-20 21z" {...line} /><path d="M10 30c4-8 9-12 15-15" {...line} /></>,
    estrella: <path d="m20 8 3.6 7.6 8.2 1-6 5.7 1.6 8.2L20 26.4l-7.4 4.1 1.6-8.2-6-5.7 8.2-1z" {...line} />,
    rayo: <path d="M23 7 11 22h8l-2 11 12-16h-8z" {...line} />,
    llama: <path d="M20 7c1 6 8 9 8 17a8 8 0 0 1-16 0c0-4 2-6 4-8 0 3 1 4 3 4-1-5-1-9 1-13z" {...line} />,
    letra: <text x="20" y="27.5" textAnchor="middle" fontFamily="var(--f-display)" fontSize="21" fontWeight="650" fill="currentColor">{letter}</text>,
  };
  return <>{g[s]}</>;
}

export function Avatar({ sticker, color, name, size = 36 }: { sticker: AvatarSticker; color: string; name?: string; size?: number }) {
  const letter = (name?.trim()[0] ?? 'N').toUpperCase();
  return (
    <span className="avatar" style={{ width: size, height: size, ['--av' as string]: color }}>
      <svg viewBox="0 0 40 40" width={size * 0.62} height={size * 0.62} aria-hidden="true">
        <Glyph s={sticker} letter={letter} />
      </svg>
    </span>
  );
}
