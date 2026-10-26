// Iconos de trazo fino para Notipeng (sin librerías).
import type { SVGProps } from 'react';

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
});

export const IconDesk = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 10h18M5 10v9M19 10v9M8 10V6.5a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 6.5V10" /><circle cx="12" cy="7.6" r=".6" fill="currentColor" /></svg>
);
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconProjects = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 19V8l4-3h12v14z" /><path d="M8 5v14M12 10h5M12 14h3" /></svg>
);
export const IconTasks = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="6" cy="7" r="2" /><path d="m4.9 16.8 1.2 1.2 2.3-2.6" /><path d="M11 7h9M11 17h9" /></svg>
);
export const IconMore = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="6" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="18" cy="12" r="1.2" fill="currentColor" /></svg>
);
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></svg>
);
export const IconInbox = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 13 6.5 5h11L20 13v6H4z" /><path d="M4 13h4.5a3.5 3.5 0 0 0 7 0H20" /></svg>
);
export const IconJournal = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 3.5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6z" /><path d="M6 3.5v17M9.5 8H15M9.5 11.5H14" /><path d="M18 6h1.5M18 10h1.5" /></svg>
);
export const IconIdea = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M9.5 17.5h5M10 20.5h4" /><path d="M12 3.5a5.5 5.5 0 0 0-3.2 10c.5.4.7.9.7 1.5v.5h5V15c0-.6.2-1.1.7-1.5a5.5 5.5 0 0 0-3.2-10Z" /></svg>
);
export const IconNote = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 4h14v11l-5 5H5z" /><path d="M14 20v-5h5M8.5 9h7M8.5 12.5h4" /></svg>
);
export const IconGoal = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></svg>
);
export const IconCalendar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="4" y="5.5" width="16" height="14" rx="1.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></svg>
);
export const IconTag = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M9.5 4 8 20M16 4l-1.5 16M4.5 9h16M3.5 15h16" /></svg>
);
export const IconClock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></svg>
);
export const IconSettings = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ strokeWidth: 2.6, ...p })}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const IconStar = ({ filled, ...p }: SVGProps<SVGSVGElement> & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? 'currentColor' : 'none'}><path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z" /></svg>
);
export const IconBell = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>
);
export const IconAlarm = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="13" r="7" /><path d="M12 9.5V13l2.5 1.5M4 5.5 6.5 3M20 5.5 17.5 3" /></svg>
);
export const IconTrash = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 7h14M10 7V4.5h4V7M6.5 7l1 13h9l1-13" /></svg>
);
export const IconArchive = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3.5" y="4.5" width="17" height="4" rx="1" /><path d="M5 8.5V19h14V8.5M10 12.5h4" /></svg>
);
export const IconArrowLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);
export const IconLink = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
);
export const IconPaperclip = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m19 11.5-7 7a4.5 4.5 0 0 1-6.4-6.4l7.4-7.4a3 3 0 0 1 4.2 4.2l-7.3 7.3a1.5 1.5 0 0 1-2.1-2.1l6.6-6.6" /></svg>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconRecent = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" /><path d="M4 4v4.5h4.5M12 8v4l3 2" /></svg>
);
export const IconDownload = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" /></svg>
);
export const IconProfile = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="8.5" r="3.6" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></svg>
);
