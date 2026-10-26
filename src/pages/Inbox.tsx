import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntries } from '../db/hooks';
import { changeKind, entryToGoal, entryToProject, entryToTask, patch, remove, restore } from '../db/repo';
import type { Entry } from '../db/types';
import { ago } from '../lib/dates';
import { openCapture, toast } from '../lib/ui';
import { AutoTextarea, Empty, PageHeader, Tags, useDebounced } from '../components/ui';
import { IconArchive, IconTrash } from '../components/Icons';

export function Inbox() {
  const entries = useEntries('inbox');
  const [focus, setFocus] = useState(false);
  const items = (entries ?? []).filter((e) => !e.archived).sort((a, b) => b.createdAt - a.createdAt);
  const shown = focus ? items.slice(-1) : items; // una a una: la más antigua primero

  return (
    <div className="page narrow">
      <PageHeader
        idx="01"
        kicker="Capturar · Bandeja"
        title="Bandeja"
        sub="Todo lo que todavía no has procesado. Capturar no obliga a organizar."
        actions={
          <>
            {items.length > 1 && (
              <button className="btn" aria-pressed={focus} onClick={() => setFocus(!focus)}>
                {focus ? 'Ver todo' : 'Una a una'}
              </button>
            )}
            <button className="btn btn-primary" onClick={() => openCapture()}>+ Capturar</button>
          </>
        }
      />
      {entries && items.length === 0 && (
        <Empty peng="taza" line="Bandeja vacía. Cabeza despejada." hint="Lo que captures desde cualquier sitio llegará aquí." />
      )}
      {focus && items.length > 0 && (
        <p className="mono muted mb-2">{items.length} por procesar · una cosa a la vez</p>
      )}
      <div className={focus ? 'inbox-focus' : ''}>
        {shown.map((e) => <InboxItem key={e.id} e={e} />)}
      </div>
    </div>
  );
}

function InboxItem({ e }: { e: Entry }) {
  const navigate = useNavigate();
  const [text, setText] = useState(e.body);
  useDebounced(text, (body) => patch<Entry>('entries', e.id, { body }));

  const after = (label: string, href: string) => toast(label, { label: 'Abrir', run: () => navigate(href) });
  const fresh = () => ({ ...e, body: text });

  return (
    <article className="inbox-item">
      <AutoTextarea
        className="inline-input ii-text"
        value={text}
        onChange={(ev) => setText(ev.target.value)}
        aria-label="Texto capturado"
      />
      <div className="meta mt-1">
        <span>{ago(e.createdAt)}</span>
        <Tags tags={e.tags} />
      </div>
      <div className="ii-actions">
        <span className="lbl">Convertir en</span>
        <button className="btn btn-sm" onClick={async () => { const t = await entryToTask(fresh()); after('Ahora es una tarea.', `/tareas?t=${t.id}`); }}>Tarea</button>
        <button className="btn btn-sm" onClick={async () => { await changeKind(fresh(), 'idea'); after('Guardada en Ideas.', `/e/${e.id}`); }}>Idea</button>
        <button className="btn btn-sm" onClick={async () => { await changeKind(fresh(), 'note'); after('Guardada como nota.', `/e/${e.id}`); }}>Nota</button>
        <button className="btn btn-sm" onClick={async () => { await changeKind(fresh(), 'journal'); after('Al diario.', `/e/${e.id}`); }}>Diario</button>
        <button className="btn btn-sm" onClick={async () => { const p = await entryToProject(fresh()); navigate(`/proyectos/${p.id}`); toast('Proyecto creado. ¿Cuál es el primer paso?'); }}>Proyecto</button>
        <button className="btn btn-sm" onClick={async () => { const g = await entryToGoal(fresh()); after('Objetivo creado.', `/objetivos/${g.id}`); }}>Objetivo</button>
        <span className="grow" />
        <button
          className="btn btn-sm btn-ghost"
          onClick={async () => {
            await patch<Entry>('entries', e.id, { archived: true, body: text });
            toast('Archivado.', { label: 'Deshacer', run: () => patch<Entry>('entries', e.id, { archived: false }) });
          }}
        >
          <IconArchive /> Archivar
        </button>
        <button
          className="btn btn-sm btn-ghost btn-danger"
          aria-label="Eliminar"
          onClick={async () => {
            await remove('entries', e.id);
            toast('Eliminado (está en la papelera).', { label: 'Deshacer', run: () => restore('entries', e.id) });
          }}
        >
          <IconTrash />
        </button>
      </div>
    </article>
  );
}
