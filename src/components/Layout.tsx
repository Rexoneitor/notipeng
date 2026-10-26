import { useEffect, useState, type ReactElement } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useInboxCount, useProfile } from '../db/hooks';
import { entryTitle, patch } from '../db/repo';
import type { Reminder } from '../db/types';
import { todayISO } from '../lib/dates';
import { onReminderFired } from '../lib/reminders';
import { MOD, openCapture, openPalette, setMore, showAlarm, toast, useUI } from '../lib/ui';
import { CaptureSheet } from './CaptureSheet';
import { CommandPalette } from './CommandPalette';
import { TaskSheet } from './TaskSheet';
import { AlarmOverlay, Toasts } from './Overlays';
import { Modal } from './ui';
import { SyncDot } from './SyncPanel';
import { Avatar, Logo } from './Art';
import {
  IconCalendar, IconDesk, IconGoal, IconIdea, IconInbox, IconJournal, IconMore, IconNote, IconPlus,
  IconProfile, IconProjects, IconRecent, IconSearch, IconSettings, IconTag, IconTasks,
} from './Icons';


function useTodayCount() {
  return (
    useLiveQuery(() => {
      const t = todayISO();
      return db.tasks.filter((x) => !x.deletedAt && x.status !== 'hecha' && !!x.due && x.due <= t).count();
    }, []) ?? 0
  );
}

function useFavorites() {
  return useLiveQuery(async () => {
    const [e, p, g] = await Promise.all([
      db.entries.filter((x) => !x.deletedAt && !!x.favorite).toArray(),
      db.projects.filter((x) => !x.deletedAt && !!x.favorite).toArray(),
      db.goals.filter((x) => !x.deletedAt && !!x.favorite).toArray(),
    ]);
    return [
      ...p.map((x) => ({ id: x.id, title: x.title, href: `/proyectos/${x.id}` })),
      ...g.map((x) => ({ id: x.id, title: x.title, href: `/objetivos/${x.id}` })),
      ...e.map((x) => ({ id: x.id, title: entryTitle(x), href: `/e/${x.id}` })),
    ];
  }, []) ?? [];
}

function NavItem({ to, icon, label, count, hot, end }: { to: string; icon: ReactElement; label: string; count?: number; hot?: boolean; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      {icon}
      <span>{label}</span>
      {!!count && <span className={`nav-count ${hot ? 'hot' : ''}`}>{count}</span>}
    </NavLink>
  );
}

function Sidebar() {
  const inbox = useInboxCount();
  const today = useTodayCount();
  const favs = useFavorites();
  const profile = useProfile();
  return (
    <aside className="sidebar" aria-label="Navegación principal">
      <div className="side-head">
        <Link to="/" className="brand"><Logo size={28} />Notipeng</Link>
        <SyncDot />
      </div>
      <div className="side-actions">
        <button className="capture-btn" onClick={() => openCapture()}>
          <IconPlus />Capturar<kbd>N</kbd>
        </button>
        <button className="search-btn" onClick={openPalette}>
          <IconSearch />Buscar<kbd>{MOD} K</kbd>
        </button>
      </div>
      <nav>
        <NavItem to="/" end icon={<IconDesk />} label="Mesa" />
        <div className="nav-group">Capturar</div>
        <NavItem to="/bandeja" icon={<IconInbox />} label="Bandeja" count={inbox} hot />
        <NavItem to="/diario" icon={<IconJournal />} label="Diario" />
        <div className="nav-group">Organizar</div>
        <NavItem to="/ideas" icon={<IconIdea />} label="Ideas" />
        <NavItem to="/notas" icon={<IconNote />} label="Notas" />
        <NavItem to="/etiquetas" icon={<IconTag />} label="Etiquetas y áreas" />
        <div className="nav-group">Ejecutar</div>
        <NavItem to="/proyectos" icon={<IconProjects />} label="Proyectos" />
        <NavItem to="/tareas" icon={<IconTasks />} label="Tareas" count={today} />
        <NavItem to="/objetivos" icon={<IconGoal />} label="Objetivos" />
        <NavItem to="/calendario" icon={<IconCalendar />} label="Calendario" />
        <div className="nav-group">Revisar</div>
        <NavItem to="/recientes" icon={<IconRecent />} label="Recientes" />
        {favs.length > 0 && (
          <>
            <div className="nav-group">Favoritos</div>
            {favs.slice(0, 12).map((f) => (
              <NavLink key={f.id} to={f.href} className={({ isActive }) => `nav-item nav-fav ${isActive ? 'active' : ''}`}>
                <span className="star">★</span><span>{f.title}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>
      <div className="sidebar-foot">
        <NavLink to="/perfil" className="profile-chip">
          <Avatar sticker={profile?.avatar.sticker ?? 'letra'} color={profile?.avatar.color ?? '#1A66CF'} name={profile?.name} size={32} />
          <span><b>{profile?.name?.trim() || 'Tu perfil'}</b><small>Ver perfil</small></span>
        </NavLink>
        <NavLink to="/ajustes" className={({ isActive }) => `icon-btn ${isActive ? 'active' : ''}`} aria-label="Ajustes" title="Ajustes"><IconSettings /></NavLink>
      </div>
    </aside>
  );
}

const TITLES: [RegExp, string][] = [
  [/^\/bandeja/, 'Bandeja'], [/^\/diario/, 'Diario'], [/^\/ideas/, 'Ideas'], [/^\/notas/, 'Notas'],
  [/^\/proyectos/, 'Proyectos'], [/^\/tareas/, 'Tareas'], [/^\/objetivos/, 'Objetivos'], [/^\/calendario/, 'Calendario'],
  [/^\/etiqueta/, 'Etiquetas'], [/^\/area/, 'Área'], [/^\/recientes/, 'Recientes'], [/^\/ajustes/, 'Ajustes'], [/^\/perfil/, 'Perfil'], [/^\/e\//, 'Entrada'],
];

function MobileTop() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  const title = TITLES.find(([re]) => re.test(pathname))?.[1];
  return (
    <header className={`mtop ${scrolled ? 'scrolled' : ''}`}>
      <Link to="/" className="brand"><Logo size={28} />{!title && 'Notipeng'}</Link>
      {title && <span className="mtop-title">{title}</span>}
      <span className="spacer" />
      <Link to="/ajustes#sync" aria-label="Estado de sincronización" style={{ padding: 8 }}><SyncDot /></Link>
      <button className="btn btn-ghost btn-icon" aria-label="Buscar" onClick={openPalette}><IconSearch /></button>
    </header>
  );
}

function BottomBar() {
  const inbox = useInboxCount();
  const cls = ({ isActive }: { isActive: boolean }) => `bb-item ${isActive ? 'active' : ''}`;
  return (
    <nav className="bottombar" aria-label="Navegación">
      <NavLink to="/" end className={cls}><IconDesk />Mesa</NavLink>
      <NavLink to="/proyectos" className={cls}><IconProjects />Proyectos</NavLink>
      <button className="bb-capture" aria-label="Capturar" onClick={() => openCapture()}><IconPlus /></button>
      <NavLink to="/tareas" className={cls}><IconTasks />Tareas</NavLink>
      <button className="bb-item" onClick={() => setMore(true)}>
        <IconMore />Más{inbox > 0 && <span className="badge">{inbox}</span>}
      </button>
    </nav>
  );
}

function MoreSheet() {
  const inbox = useInboxCount();
  const close = () => setMore(false);
  const items: [string, string, ReactElement, number?][] = [
    ['/bandeja', 'Bandeja', <IconInbox />, inbox],
    ['/diario', 'Diario', <IconJournal />],
    ['/ideas', 'Ideas', <IconIdea />],
    ['/notas', 'Notas', <IconNote />],
    ['/objetivos', 'Objetivos', <IconGoal />],
    ['/calendario', 'Calendario', <IconCalendar />],
    ['/etiquetas', 'Etiquetas', <IconTag />],
    ['/recientes', 'Recientes', <IconRecent />],
    ['/perfil', 'Perfil', <IconProfile />],
    ['/ajustes', 'Ajustes', <IconSettings />],
  ];
  return (
    <Modal title="Todo" onClose={close}>
      <div className="sheet-body">
        <div className="more-grid">
          {items.map(([to, label, icon, n]) => (
            <Link key={to} to={to} onClick={close}>{icon}{label}{!!n && <span className="badge">{n}</span>}</Link>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export function Layout() {
  const ui = useUI();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // Atajos globales
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
        return;
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openCapture(); }
      if (e.key === '/') { e.preventDefault(); openPalette(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Atajo de app instalada: /?capturar=1
  useEffect(() => {
    if (params.get('capturar')) {
      openCapture();
      params.delete('capturar');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  // Recordatorios disparados → aviso o alarma
  useEffect(
    () =>
      onReminderFired((r: Reminder) => {
        if (r.kind === 'alarma') showAlarm(r);
        else
          toast(`🔔 ${r.title}`, {
            label: 'Hecho',
            run: () => patch<Reminder>('reminders', r.id, { done: true }),
          }, 12000);
      }),
    [navigate],
  );

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <MobileTop />
        <div key={location.pathname}>
          <Outlet />
        </div>
      </main>
      <BottomBar />
      {ui.capture && <CaptureSheet opts={ui.capture} />}
      {ui.palette && <CommandPalette />}
      {ui.more && <MoreSheet />}
      {ui.taskId && <TaskSheet id={ui.taskId} />}
      <Toasts />
      <AlarmOverlay />
    </div>
  );
}
