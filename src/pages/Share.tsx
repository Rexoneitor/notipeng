import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { newEntry } from '../db/repo';
import { toast } from '../lib/ui';

/** Destino de "Compartir → Notipeng" (Android) y de enlaces /capturar?text=… */
export function Share() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const parts = [params.get('title'), params.get('text'), params.get('url')].map((s) => s?.trim()).filter(Boolean) as string[];
    const unique = parts.filter((p, i) => !parts.slice(0, i).some((q) => q.includes(p)));
    (async () => {
      if (unique.length) {
        await newEntry('inbox', { body: unique.join('\n') });
        toast('Guardado en la Bandeja.');
      }
      navigate('/bandeja', { replace: true });
    })();
  }, [params, navigate]);
  return <div className="page narrow"><p className="mono muted">Guardando…</p></div>;
}
