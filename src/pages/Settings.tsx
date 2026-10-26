import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAreas, useTrash } from '../db/hooks';
import { emptyTrash, entryTitle, newArea, patch, purge, remove, restore } from '../db/repo';
import type { Area, TableName } from '../db/types';
import { ago } from '../lib/dates';
import { exportJSON, exportMarkdown, exportTasksCSV, importJSON } from '../lib/export';
import { isIOS, isStandalone, promptInstall, useCanInstall } from '../lib/install';
import { ACCENTS, setPrefs, TYPESETS, usePrefs, type Density, type ThemePref } from '../lib/prefs';
import { ensurePermission, permission, showSystemNotification } from '../lib/reminders';
import { playAlarm, playTick } from '../lib/sound';
import { toast } from '../lib/ui';
import { PageHeader } from '../components/ui';
import { SyncPanel } from '../components/SyncPanel';
import { forceFullPush } from '../sync/cloud';

const TABLE_LABEL: Record<string, string> = {
  entries: 'Entrada', projects: 'Proyecto', phases: 'Fase', tasks: 'Tarea', goals: 'Objetivo', areas: 'Área', events: 'Evento', reminders: 'Recordatorio',
};

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function Settings() {
  const prefs = usePrefs();
  const areas = useAreas() ?? [];
  const trash = useTrash() ?? [];
  const canInstall = useCanInstall();
  const [perm, setPerm] = useState(permission());
  const [storage, setStorage] = useState<{ usage?: number; quota?: number; persisted?: boolean }>({});
  const [newAreaName, setNewAreaName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const est = await navigator.storage?.estimate?.();
      const persisted = await navigator.storage?.persisted?.();
      setStorage({ usage: est?.usage, quota: est?.quota, persisted });
    })();
    if (location.hash) setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  return (
    <div className="page narrow">
      <PageHeader kicker="Ajustes" title="Ajustes" sub="Pocas opciones, bien elegidas." />

      <section className="settings-sec">
        <div><h2>Tú</h2><p className="ss-desc">Nombre, avatar y lo que te importa.</p></div>
        <div><Link to="/perfil" className="btn">Ir a tu perfil →</Link></div>
      </section>

      <section className="settings-sec">
        <div><h2>Apariencia</h2><p className="ss-desc">Se guarda en este dispositivo.</p></div>
        <div className="stack" style={{ gap: 22 }}>
          <div className="field">
            <span>Tema</span>
            <div className="seg">
              {([['light', 'Claro'], ['dark', 'Oscuro'], ['auto', 'Automático']] as [ThemePref, string][]).map(([k, l]) => (
                <button key={k} aria-pressed={prefs.theme === k} onClick={() => setPrefs({ theme: k })}>{l}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <span>Color de acento</span>
            <div className="swatches">
              {ACCENTS.map((a) => (
                <button
                  key={a.key}
                  className="swatch"
                  title={a.label}
                  aria-label={a.label}
                  aria-pressed={prefs.accent === a.key}
                  style={{ background: document.documentElement.dataset.theme === 'dark' ? a.dark : a.light }}
                  onClick={() => setPrefs({ accent: a.key })}
                />
              ))}
              <span
                className="swatch"
                title="Personalizado"
                aria-pressed={prefs.accent === 'custom'}
                style={{ background: `conic-gradient(from 90deg, #c23b22, #bf5512, #94640a, #33734a, #2a49c9, #7a3a9c, #c23b22)` }}
              >
                <input type="color" aria-label="Color personalizado" value={prefs.customAccent} onChange={(e) => setPrefs({ accent: 'custom', customAccent: e.target.value })} />
              </span>
            </div>
          </div>
          <div className="field">
            <span>Tipografía</span>
            <div>
              {TYPESETS.map((t) => (
                <button key={t.key} className="type-opt" aria-pressed={prefs.typeset === t.key} onClick={() => setPrefs({ typeset: t.key })}>
                  <div className="to-sample" style={{
                    fontFamily: t.key === 'hielo' ? "'Onest Variable'" : t.key === 'editorial' ? "'Fraunces Variable'" : "'JetBrains Mono Variable'",
                  }}>{t.label} — ¿Qué tienes en la cabeza?</div>
                  <div className="mono muted mt-1">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span>Densidad</span>
            <div className="seg">
              {([['comoda', 'Cómoda'], ['compacta', 'Compacta']] as [Density, string][]).map(([k, l]) => (
                <button key={k} aria-pressed={prefs.density === k} onClick={() => setPrefs({ density: k })}>{l}</button>
              ))}
            </div>
          </div>
          <label className="row" style={{ gap: 10 }}>
            <input type="checkbox" checked={prefs.sounds} onChange={(e) => { setPrefs({ sounds: e.target.checked }); if (e.target.checked) setTimeout(playTick, 50); }} />
            <span>Sonido sutil al completar tareas</span>
          </label>
        </div>
      </section>

      <section className="settings-sec" id="areas">
        <div><h2>Áreas de vida</h2><p className="ss-desc">Los grandes cajones. El símbolo es cualquier carácter o emoji.</p></div>
        <div>
          {areas.map((a, i) => <AreaRow key={a.id} a={a} list={areas} i={i} />)}
          <div className="row mt-1">
            <input className="input" placeholder="Nueva área…" value={newAreaName} onChange={(e) => setNewAreaName(e.target.value)}
              onKeyDown={async (e) => { if (e.key === 'Enter' && newAreaName.trim()) { await newArea(newAreaName.trim()); setNewAreaName(''); } }} />
            <button className="btn" disabled={!newAreaName.trim()} onClick={async () => { await newArea(newAreaName.trim()); setNewAreaName(''); }}>Añadir</button>
          </div>
        </div>
      </section>

      <section className="settings-sec">
        <div><h2>Avisos</h2><p className="ss-desc">Recordarte lo importante, no molestarte.</p></div>
        <div className="stack">
          <p>
            Notificaciones del sistema:{' '}
            <strong className="mono">
              {perm === 'granted' ? 'activadas' : perm === 'denied' ? 'bloqueadas' : perm === 'unsupported' ? 'no disponibles aquí' : 'sin activar'}
            </strong>
          </p>
          <div className="row wrap">
            {perm === 'default' && <button className="btn btn-primary" onClick={async () => { await ensurePermission(); setPerm(permission()); }}>Activar notificaciones</button>}
            {perm === 'granted' && <button className="btn" onClick={() => showSystemNotification('Notipeng', 'Así se verán tus recordatorios.')}>Probar notificación</button>}
            <button className="btn" onClick={playAlarm}>Probar sonido de alarma</button>
          </div>
          {perm === 'denied' && <p className="muted">Están bloqueadas en el navegador. Actívalas desde el candado de la barra de direcciones o los ajustes del sistema.</p>}
          {isIOS() && !isStandalone() && <p className="muted">En iPhone, las notificaciones solo funcionan con la app instalada en la pantalla de inicio (iOS 16.4+).</p>}
          <div className="storage-note">
            <strong>Recordatorio</strong> = aviso discreto. <strong>Alarma</strong> = ocupa la pantalla y suena hasta que la atiendes.
            En esta versión web los avisos llegan con la app abierta o en segundo plano reciente; si estaba cerrada, verás los pendientes al abrirla.
            La versión nativa (Capacitor, en el roadmap) permitirá avisos exactos con la app cerrada.
          </div>
        </div>
      </section>

      <section className="settings-sec">
        <div><h2>Instalar</h2><p className="ss-desc">Ábrela como una app: icono, pantalla completa, sin barra del navegador.</p></div>
        <div className="stack">
          {isStandalone() ? (
            <p>Ya la estás usando como aplicación instalada. ✓</p>
          ) : canInstall ? (
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={promptInstall}>Instalar Notipeng</button>
          ) : (
            <p className="muted">
              {isIOS()
                ? 'En Safari: botón Compartir → "Añadir a pantalla de inicio".'
                : 'En Chrome/Edge: icono de instalar en la barra de direcciones, o menú ⋮ → "Instalar aplicación". En Android: menú ⋮ → "Añadir a pantalla de inicio".'}
            </p>
          )}
          <p className="muted" style={{ fontSize: '0.9em' }}>
            Instalada en Android, mantén pulsado el icono para "Capturar" o "Diario", y usa Compartir → Notipeng desde cualquier app para mandar texto o enlaces a la Bandeja.
          </p>
        </div>
      </section>

      <section className="settings-sec" id="sync">
        <div><h2>Sincronización</h2><p className="ss-desc">El mismo contenido en tu teléfono y tu ordenador.</p></div>
        <SyncPanel />
      </section>

      <section className="settings-sec" id="datos">
        <div><h2>Tus datos</h2><p className="ss-desc">Son tuyos. Expórtalos cuando quieras, en formatos abiertos.</p></div>
        <div className="stack" style={{ gap: 16 }}>
          <div className="storage-note">
            Cada dispositivo guarda una copia completa en su navegador (IndexedDB <code>bitacora</code>), así funciona sin conexión.
            Si activas la sincronización, se replica en tu base de datos privada de Supabase; si no, no sale de aquí.
            {storage.usage !== undefined && <> Ocupa <strong>{fmtBytes(storage.usage)}</strong>.</>}
            {' '}Almacenamiento persistente: <strong>{storage.persisted ? 'sí' : 'no garantizado'}</strong>
            {!storage.persisted && ' (instalar la app ayuda a que el navegador no lo borre)'}.
            <br />El backup JSON es tu copia de seguridad independiente: guárdalo de vez en cuando aunque sincronices.
          </div>
          <div className="row wrap">
            <button className="btn btn-primary" onClick={() => exportJSON().then(() => toast('Backup descargado.'))}>Backup completo (JSON)</button>
            <button className="btn" onClick={() => exportMarkdown()}>Markdown (.zip)</button>
            <button className="btn" onClick={() => exportTasksCSV()}>Tareas (CSV)</button>
          </div>
          <div className="row wrap">
            <button className="btn" onClick={() => fileRef.current?.click()}>Importar / restaurar JSON…</button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                try {
                  const s = await importJSON(f);
                  forceFullPush();
                  toast(`Importado: ${s.added} nuevos, ${s.updated} actualizados, ${s.skipped} sin cambios.`, undefined, 7000);
                } catch (err) {
                  toast(`No se pudo importar: ${(err as Error).message}`);
                }
              }}
            />
          </div>
        </div>
      </section>

      <section className="settings-sec">
        <div><h2>Papelera</h2><p className="ss-desc">Lo eliminado espera aquí hasta que la vacíes.</p></div>
        <div>
          {trash.length === 0 ? (
            <p className="muted">Vacía.</p>
          ) : (
            <>
              <div className="list mb-2">
                {trash.slice(0, 40).map(({ table, rec }) => (
                  <div key={rec.id} className="item">
                    <span className="mono muted" style={{ width: 90, flex: 'none', paddingTop: 3 }}>{TABLE_LABEL[table] ?? table}</span>
                    <span className="item-main item-title">{table === 'entries' ? entryTitle(rec) : rec.title || rec.name || 'Sin título'}</span>
                    <span className="mono faint hidden-mobile">{ago(rec.deletedAt)}</span>
                    <button className="btn btn-sm" onClick={() => restore(table as TableName, rec.id)}>Recuperar</button>
                    <button className="btn btn-sm btn-ghost btn-danger" onClick={() => purge(table as TableName, rec.id)} aria-label="Eliminar definitivamente">×</button>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  if (confirm(`¿Eliminar definitivamente ${trash.length} elementos? No se puede deshacer.`)) {
                    await emptyTrash();
                    toast('Papelera vaciada.');
                  }
                }}
              >
                Vaciar papelera ({trash.length})
              </button>
            </>
          )}
        </div>
      </section>

      <section className="settings-sec">
        <div><h2>Atajos</h2></div>
        <div className="stack mono" style={{ fontSize: 12, gap: 8 }}>
          <span><kbd>N</kbd> capturar desde cualquier pantalla</span>
          <span><kbd>Ctrl/⌘</kbd> + <kbd>K</kbd> o <kbd>/</kbd> buscar y comandos</span>
          <span><kbd>Ctrl/⌘</kbd> + <kbd>Enter</kbd> guardar captura</span>
          <span><kbd>Esc</kbd> cerrar</span>
        </div>
      </section>
    </div>
  );
}

function AreaRow({ a, list, i }: { a: Area; list: Area[]; i: number }) {
  const [name, setName] = useState(a.name);
  const [symbol, setSymbol] = useState(a.symbol);
  const save = () => (name !== a.name || symbol !== a.symbol) && name.trim() && patch<Area>('areas', a.id, { name: name.trim(), symbol: symbol.trim() || '◇' });
  const move = async (dir: -1 | 1) => {
    const b = list[i + dir];
    if (!b) return;
    await patch<Area>('areas', a.id, { order: b.order });
    await patch<Area>('areas', b.id, { order: a.order });
  };
  return (
    <div className="area-row">
      <input className="input sym" value={symbol} maxLength={3} onChange={(e) => setSymbol(e.target.value)} onBlur={save} aria-label="Símbolo" />
      <input className="input grow" value={name} onChange={(e) => setName(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === 'Enter' && save()} aria-label="Nombre del área" />
      <button className="btn btn-ghost btn-icon btn-sm" disabled={i === 0} onClick={() => move(-1)} aria-label="Subir">▲</button>
      <button className="btn btn-ghost btn-icon btn-sm" disabled={i === list.length - 1} onClick={() => move(1)} aria-label="Bajar">▼</button>
      <button className="btn btn-ghost btn-icon btn-sm btn-danger" onClick={() => remove('areas', a.id)} aria-label={`Eliminar ${a.name}`}>×</button>
    </div>
  );
}
