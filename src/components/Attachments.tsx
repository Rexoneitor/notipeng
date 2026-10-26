import { useEffect, useMemo, useRef, useState } from 'react';
import { useAttachments } from '../db/hooks';
import { addAttachment, remove } from '../db/repo';
import type { Attachment, ID, OwnerType } from '../db/types';
import { download } from '../lib/export';
import { toast } from '../lib/ui';
import { IconClose } from './Icons';

const MAX = 25 * 1024 * 1024;

function Thumb({ a }: { a: Attachment }) {
  const url = useMemo(() => (a.blob && a.mime.startsWith('image/') ? URL.createObjectURL(a.blob) : null), [a]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  const ext = a.name.split('.').pop()?.toUpperCase().slice(0, 4) ?? 'FILE';
  if (!a.blob) return <div className="thumb" title="Descargando desde la nube…">…</div>;
  return <div className="thumb">{url ? <img src={url} alt="" /> : ext}</div>;
}

export function Attachments({ ownerType, ownerId }: { ownerType: OwnerType; ownerId: ID }) {
  const files = useAttachments(ownerId) ?? [];
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  async function addFiles(list: FileList | null) {
    if (!list) return;
    for (const f of Array.from(list)) {
      if (f.size > MAX) { toast(`${f.name} supera 25 MB; guárdalo como enlace.`); continue; }
      await addAttachment(ownerType, ownerId, f);
    }
  }

  const open = (a: Attachment) => {
    if (!a.blob) { toast('Este archivo aún se está descargando desde la nube.'); return; }
    const url = URL.createObjectURL(a.blob);
    const w = window.open(url, '_blank');
    if (!w) download(a.name, a.blob);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <div className="stack">
      {files.length > 0 && (
        <div className="files">
          {files.map((a) => (
            <div key={a.id} className="file">
              <button onClick={() => open(a)} title={`Abrir ${a.name}`} style={{ textAlign: 'left' }}>
                <Thumb a={a} />
                <div className="fname">{a.name}</div>
              </button>
              <button className="btn btn-ghost btn-icon btn-sm fdel" aria-label={`Quitar ${a.name}`} onClick={() => remove('attachments', a.id)}>
                <IconClose />
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        className={`dropzone ${over ? 'over' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}
      >
        Suelta archivos aquí o pulsa para adjuntar · imágenes, PDF, documentos (máx. 25 MB)
      </div>
      <input ref={input} type="file" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
    </div>
  );
}
