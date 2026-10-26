import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEntries } from '../db/hooks';
import { entryTitle, entryToProject, newEntry, patch } from '../db/repo';
import type { Entry, IdeaStatus } from '../db/types';
import { ago } from '../lib/dates';
import { parseCapture } from '../lib/parse';
import { toast } from '../lib/ui';
import { Empty, IDEA_STATUS, PageHeader, Prio, Tags } from '../components/ui';

const rank = (e: Entry) => ({ alta: 0, media: 1, baja: 2 })[e.priority ?? 'baja'] + (e.priority ? 0 : 1);

const ORDER: IdeaStatus[] =['nueva', 'explorando', 'interesante', 'desarrollo', 'convertida', 'descartada'];

export function Ideas() {
  const entries = useEntries('idea');
  const navigate = useNavigate();
  const [status, setStatus] = useState<IdeaStatus | 'vivas' | 'todas'>('vivas');
  const [draft, setDraft] = useState('');

  const ideas = (entries ?? []).filter((e) => !e.archived);
  const count = (s: IdeaStatus) => ideas.filter((e) => (e.ideaStatus ?? 'nueva') === s).length;
  const list = ideas
    .filter((e) => {
      const s = e.ideaStatus ?? 'nueva';
      if (status === 'todas') return true;
      if (status === 'vivas') return s !== 'convertida' && s !== 'descartada';
      return s === status;
    })
    .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || rank(a) - rank(b) || b.updatedAt - a.updatedAt);

  async function add() {
    const t = draft.trim();
    if (!t) return;
    setDraft('');
    const p = parseCapture(t);
    await newEntry('idea', { title: p.text || t, tags: p.tags, priority: p.priority ?? null });
  }

  return (
    <div className="page">
      <PageHeader
        idx="03"
        kicker="Organizar · Ideas"
        title="Ideas"
        sub="Lo que todavía no es un proyecto. Déjalas madurar; algunas merecen convertirse en algo."
      />
      <div className="card flat mb-2" style={{ padding: '4px 14px' }}>
        <div className="adder">
          <span className="plus-dot">+</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Nueva idea…  (#etiqueta, !alta)"
            aria-label="Nueva idea"
          />
        </div>
      </div>
      <div className="toolbar">
        <div className="chips">
          <button className="chip" aria-pressed={status === 'vivas'} onClick={() => setStatus('vivas')}>Vivas</button>
          {ORDER.map((s) => (
            <button key={s} className="chip" aria-pressed={status === s} onClick={() => setStatus(s)}>
              {IDEA_STATUS[s].label} <span className="n">{count(s)}</span>
            </button>
          ))}
          <button className="chip" aria-pressed={status === 'todas'} onClick={() => setStatus('todas')}>Todas</button>
        </div>
      </div>
      {entries && list.length === 0 && (
        <Empty peng="idea" line={ideas.length ? 'Ninguna idea en este estado.' : 'Todavía no hay ideas.'} hint="Escribe arriba, o captura con N desde cualquier sitio." />
      )}
      <div className="list">
        {list.map((e) => <IdeaRow key={e.id} e={e} onConvert={async () => {
          const p = await entryToProject(e);
          toast('Idea convertida en proyecto.');
          navigate(`/proyectos/${p.id}`);
        }} />)}
      </div>
    </div>
  );
}

function IdeaRow({ e, onConvert }: { e: Entry; onConvert: () => void }) {
  const s = e.ideaStatus ?? 'nueva';
  return (
    <div className="idea-row">
      <div style={{ minWidth: 0 }}>
        <Link to={`/e/${e.id}`} className="ir-title">{e.favorite && <span className="fav-star">★ </span>}{entryTitle(e)}</Link>
        {(e.title ? e.body : '') && <p className="ir-body">{e.body}</p>}
        <div className="meta mt-1">
          <span>{ago(e.createdAt)}</span>
          {e.category && <span>◇ {e.category}</span>}
          <Tags tags={e.tags} />
          {e.convertedTo?.type === 'project' && <Link to={`/proyectos/${e.convertedTo.id}`} className="accent">→ ver proyecto</Link>}
        </div>
      </div>
      <div className="row" style={{ alignItems: 'center' }}>
        <Prio p={e.priority} />
        <select
          className="stamp"
          data-tone={IDEA_STATUS[s].tone}
          value={s}
          aria-label="Estado de la idea"
          onChange={(ev) => patch<Entry>('entries', e.id, { ideaStatus: ev.target.value as IdeaStatus })}
        >
          {ORDER.map((o) => <option key={o} value={o}>{IDEA_STATUS[o].label}</option>)}
        </select>
        {s !== 'convertida' && s !== 'descartada' && (
          <button className="btn btn-sm hidden-mobile" onClick={onConvert}>→ Proyecto</button>
        )}
      </div>
    </div>
  );
}
