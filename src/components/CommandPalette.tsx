import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/db';
import { entryTitle, newEntry, newGoal, newProject } from '../db/repo';
import { ago } from '../lib/dates';
import { isDark, setPrefs } from '../lib/prefs';
import { norm, searchAll, TYPE_LABEL, type SearchResult } from '../lib/search';
import { closePalette, openCapture, openTask } from '../lib/ui';
import { Modal } from './ui';

interface Cmd {
  kind: 'cmd';
  label: string;
  hint?: string;
  run: () => void | Promise<void>;
}
type Row = Cmd | (SearchResult & { kind: 'res' }) | { kind: 'recent'; title: string; href: string; type: string; when: number };

export function CommandPalette() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recent, setRecent] = useState<Row[]>([]);
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const go = (href: string) => () => { closePalette(); navigate(href); };

  const commands: Omit<Cmd, 'kind'>[] = useMemo(() => [
    { label: 'Capturar algo', hint: 'N', run: () => openCapture() },
    { label: 'Nueva tarea', run: () => openCapture({ kind: 'task' }) },
    { label: 'Escribir en el diario', run: async () => { const e = await newEntry('journal'); closePalette(); navigate(`/e/${e.id}`); } },
    { label: 'Nueva idea', run: async () => { const e = await newEntry('idea'); closePalette(); navigate(`/e/${e.id}`); } },
    { label: 'Nueva nota', run: async () => { const e = await newEntry('note'); closePalette(); navigate(`/e/${e.id}`); } },
    { label: 'Nuevo proyecto', run: async () => { const p = await newProject(); closePalette(); navigate(`/proyectos/${p.id}?nuevo=1`); } },
    { label: 'Nuevo objetivo', run: async () => { const g = await newGoal(); closePalette(); navigate(`/objetivos/${g.id}?nuevo=1`); } },
    { label: 'Recordatorio o alarma', run: () => openCapture({ kind: 'reminder' }) },
    { label: 'Ir a la Mesa', run: go('/') },
    { label: 'Ir a la Bandeja', run: go('/bandeja') },
    { label: 'Ir al Diario', run: go('/diario') },
    { label: 'Ir a Ideas', run: go('/ideas') },
    { label: 'Ir a Notas', run: go('/notas') },
    { label: 'Ir a Proyectos', run: go('/proyectos') },
    { label: 'Ir a Tareas', run: go('/tareas') },
    { label: 'Ir a Objetivos', run: go('/objetivos') },
    { label: 'Ir al Calendario', run: go('/calendario') },
    { label: 'Ir a Etiquetas y áreas', run: go('/etiquetas') },
    { label: 'Ir a Recientes', run: go('/recientes') },
    { label: 'Ajustes', run: go('/ajustes') },
    { label: 'Exportar mis datos', run: go('/ajustes#datos') },
    { label: isDark() ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro', run: () => { setPrefs({ theme: isDark() ? 'light' : 'dark' }); closePalette(); } },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  // Recientes al abrir
  useEffect(() => {
    (async () => {
      const [e, p, g] = await Promise.all([
        db.entries.filter((x) => !x.deletedAt && !!x.openedAt).toArray(),
        db.projects.filter((x) => !x.deletedAt && !!x.openedAt).toArray(),
        db.goals.filter((x) => !x.deletedAt && !!x.openedAt).toArray(),
      ]);
      const rows: Row[] = [
        ...e.map((x) => ({ kind: 'recent' as const, title: entryTitle(x), href: `/e/${x.id}`, type: TYPE_LABEL[x.kind], when: x.openedAt! })),
        ...p.map((x) => ({ kind: 'recent' as const, title: x.title, href: `/proyectos/${x.id}`, type: 'Proyecto', when: x.openedAt! })),
        ...g.map((x) => ({ kind: 'recent' as const, title: x.title, href: `/objetivos/${x.id}`, type: 'Objetivo', when: x.openedAt! })),
      ];
      setRecent(rows.sort((a: any, b: any) => b.when - a.when).slice(0, 6));
    })();
  }, []);

  useEffect(() => {
    let alive = true;
    if (!q.trim()) { setResults([]); return; }
    searchAll(q).then((r) => alive && setResults(r));
    return () => { alive = false; };
  }, [q]);

  const nq = norm(q.trim());
  const matchedCmds: Cmd[] = (nq ? commands.filter((c) => norm(c.label).includes(nq)).slice(0, 5) : commands.slice(0, 7)).map((c) => ({ ...c, kind: 'cmd' as const }));

  const groups: { label: string; rows: Row[] }[] = nq
    ? [
        { label: 'Resultados', rows: results.map((r) => ({ ...r, kind: 'res' as const })) },
        { label: 'Acciones', rows: matchedCmds },
      ]
    : [
        { label: 'Acciones', rows: matchedCmds },
        { label: 'Abierto recientemente', rows: recent },
      ];
  const flat = groups.flatMap((g) => g.rows);

  useEffect(() => setSel(0), [q, results.length]);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const run = (r: Row | undefined) => {
    if (!r) return;
    if (r.kind === 'cmd') { r.run(); return; }
    closePalette();
    if (r.kind === 'res' && r.type === 'task') { navigate('/tareas'); openTask(r.id); return; }
    navigate(r.href);
  };

  let i = -1;
  return (
    <Modal onClose={closePalette} className="palette">
      <input
        autoFocus
        className="palette-input"
        placeholder="Buscar o escribir un comando…  (#etiqueta filtra)"
        value={q}
        aria-label="Buscar"
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(flat.length - 1, s + 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
          if (e.key === 'Enter') { e.preventDefault(); run(flat[sel]); }
        }}
      />
      <div className="palette-list" ref={listRef} role="listbox">
        {groups.map((g) =>
          g.rows.length ? (
            <div key={g.label}>
              <div className="palette-group">{g.label}</div>
              {g.rows.map((r) => {
                i++;
                const idx = i;
                const selected = idx === sel;
                return (
                  <button
                    key={(r.kind === 'cmd' ? 'c' : r.kind === 'res' ? r.id : r.href) + idx}
                    className="palette-item"
                    role="option"
                    aria-selected={selected}
                    onMouseMove={() => setSel(idx)}
                    onClick={() => run(r)}
                  >
                    {r.kind === 'cmd' && (<><span className="pi-type">→</span><span className="pi-main">{r.label}</span>{r.hint && <kbd>{r.hint}</kbd>}</>)}
                    {r.kind === 'recent' && (<><span className="pi-type">{r.type}</span><span className="pi-main pi-title">{r.title}</span><span className="mono faint">{ago(r.when)}</span></>)}
                    {r.kind === 'res' && (
                      <>
                        <span className="pi-type">{TYPE_LABEL[r.type]}</span>
                        <span className="pi-main">
                          <div className="pi-title">{r.title}</div>
                          {r.snippet && <div className="pi-snip">{r.snippet}</div>}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ) : null,
        )}
        {nq && !results.length && !matchedCmds.length && (
          <div className="empty small" style={{ margin: 10 }}>
            <div className="empty-line">Nada por aquí.</div>
            <div className="empty-hint">
              <button className="btn btn-sm mt-1" onClick={() => openCapture({ text: q })}>Capturar «{q}»</button>
            </div>
          </div>
        )}
      </div>
      <div className="palette-foot"><span>↑↓ moverse</span><span>↵ abrir</span><span>esc cerrar</span><span>#etiqueta filtra</span></div>
    </Modal>
  );
}
