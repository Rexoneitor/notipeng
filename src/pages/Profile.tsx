import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useProfile } from '../db/hooks';
import { patch } from '../db/repo';
import type { AvatarSticker, Profile as ProfileT } from '../db/types';
import { fmtLong, toISODate } from '../lib/dates';
import { Avatar, Peng, STICKER_LABEL, STICKERS } from '../components/Art';
import { PageHeader, Section, useDebounced } from '../components/ui';
import { SyncDot } from '../components/SyncPanel';
import { useSyncStatus } from '../sync/cloud';

const COLORS = ['#1A66CF', '#087568', '#5A47D6', '#C0451B', '#2F7A4C', '#B83A6B', '#3A4A5E'];

export function Profile() {
  const profile = useProfile();
  if (!profile) return <div className="page narrow" />;
  return <Editor key={profile.id} p={profile} />;
}

function Editor({ p }: { p: ProfileT }) {
  const sync = useSyncStatus();
  const [name, setName] = useState(p.name);
  const [motto, setMotto] = useState(p.motto);
  const [intentions, setIntentions] = useState<string[]>([...p.intentions, '', '', ''].slice(0, 3));
  const pending = useDebounced({ name, motto, intentions }, (v) =>
    patch<ProfileT>('profile', 'me', { name: v.name.trim(), motto: v.motto, intentions: v.intentions.map((x) => x.trim()) }),
  );
  const setAvatar = (a: Partial<ProfileT['avatar']>) => patch<ProfileT>('profile', 'me', { avatar: { ...p.avatar, ...a } });

  // Resumen amable: lo que has construido. Sin rachas, sin puntuaciones.
  const stats = useLiveQuery(async () => {
    const alive = <T extends { deletedAt?: number | null }>(r: T) => !r.deletedAt;
    const [tasks, entries, projects] = await Promise.all([
      db.tasks.filter(alive).toArray(),
      db.entries.filter(alive).toArray(),
      db.projects.filter(alive).toArray(),
    ]);
    return {
      done: tasks.filter((t) => t.status === 'hecha').length,
      captured: entries.length,
      projects: projects.filter((x) => x.status !== 'archivado').length,
      since: toISODate(new Date(p.createdAt)),
    };
  }, [p.createdAt]);

  return (
    <div className="page narrow">
      <PageHeader kicker="Tú" title="Perfil" sub="Quién eres aquí y qué te importa. Se sincroniza con tus otros dispositivos." actions={<span className="save-state">{pending ? 'guardando…' : 'guardado'}</span>} />

      <div className="card mb-2">
        <div className="profile-head">
          <Avatar sticker={p.avatar.sticker} color={p.avatar.color} name={name} size={84} />
          <div className="grow" style={{ minWidth: 220 }}>
            <label className="field">
              <span>Tu nombre</span>
              <input className="input" value={name} placeholder="¿Cómo te llamas?" onChange={(e) => setName(e.target.value)} style={{ fontSize: 18, fontWeight: 600 }} />
            </label>
            <label className="field mt-1">
              <span>Tu lema</span>
              <input className="input" value={motto} placeholder="Una frase que te acompañe" onChange={(e) => setMotto(e.target.value)} />
            </label>
          </div>
          <div className="hidden-mobile" style={{ marginLeft: 'auto' }}><Peng item="estrella" size={112} /></div>
        </div>
      </div>

      <Section card label="Tu avatar">
        <div className="stack" style={{ gap: 14 }}>
          <div className="sticker-grid" role="radiogroup" aria-label="Icono del avatar">
            {STICKERS.map((s: AvatarSticker) => (
              <button key={s} className="sticker-btn" aria-pressed={p.avatar.sticker === s} aria-label={STICKER_LABEL[s]} title={STICKER_LABEL[s]} onClick={() => setAvatar({ sticker: s })}>
                <Avatar sticker={s} color="currentColor" name={name} size={30} />
              </button>
            ))}
          </div>
          <div className="swatches" role="radiogroup" aria-label="Color del avatar">
            {COLORS.map((c) => (
              <button key={c} className="swatch" aria-label={`Color ${c}`} aria-pressed={p.avatar.color.toLowerCase() === c.toLowerCase()} style={{ background: c }} onClick={() => setAvatar({ color: c })} />
            ))}
          </div>
        </div>
      </Section>

      <div className="mt-2" />
      <Section card label="Lo que realmente importa" extra={<span className="sec-extra">hasta 3</span>}>
        <p className="muted" style={{ fontSize: 14.5, marginBottom: 14 }}>
          No una lista de tareas: las pocas cosas que, si avanzan, hacen que este año valga la pena. Aparecen en tu Mesa para recordarte el rumbo.
        </p>
        <div className="stack" style={{ gap: 10 }}>
          {intentions.map((v, i) => (
            <div key={i} className="intent-row">
              <span className="num">{i + 1}</span>
              <input
                className="input"
                value={v}
                placeholder={['Lo más importante para mí ahora…', 'Lo segundo…', 'Lo tercero…'][i]}
                aria-label={`Intención ${i + 1}`}
                onChange={(e) => setIntentions(intentions.map((x, j) => (j === i ? e.target.value : x)))}
              />
            </div>
          ))}
        </div>
      </Section>

      <div className="mt-2" />
      <Section label="Lo que has construido" extra={stats ? <span className="sec-extra">desde el {fmtLong(stats.since)}</span> : undefined}>
        <div className="stats">
          <div className="card stat"><b>{stats?.done ?? 0}</b><span>{stats?.done === 1 ? 'tarea terminada' : 'tareas terminadas'}</span></div>
          <div className="card stat"><b>{stats?.captured ?? 0}</b><span>cosas capturadas</span></div>
          <div className="card stat"><b>{stats?.projects ?? 0}</b><span>{stats?.projects === 1 ? 'proyecto' : 'proyectos'}</span></div>
        </div>
      </Section>

      <Section label="Tu cuenta">
        <div className="card flat row between wrap">
          <div>
            <div style={{ fontWeight: 600 }}>{sync.email ?? 'Sin conectar'}</div>
            <div className="muted" style={{ fontSize: 13.5 }}><SyncDot /> {sync.state === 'signed-out' || sync.state === 'off' ? 'Tus datos están solo en este dispositivo.' : 'Sincronizado con tus otros dispositivos.'}</div>
          </div>
          <Link to="/ajustes#sync" className="btn">Sincronización y datos</Link>
        </div>
      </Section>
    </div>
  );
}
