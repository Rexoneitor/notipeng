import { useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEntries } from '../db/hooks';
import { newEntry } from '../db/repo';
import { MONTHS, parseISODate, toISODate, todayISO, weekdayName } from '../lib/dates';
import { Empty, PageHeader, Tags } from '../components/ui';

const PROMPTS = [
  '¿Qué ocupa tu cabeza hoy?',
  '¿Qué aprendiste esta semana?',
  '¿Qué te gustaría que fuera distinto mañana?',
  '¿Qué salió bien hoy, aunque sea pequeño?',
];

export function Journal() {
  const entries = useEntries('journal');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const started = useRef(false);

  const write = async () => {
    const e = await newEntry('journal', { date: todayISO() });
    navigate(`/e/${e.id}`);
  };

  // Atajo "Escribir en el diario" del icono de la app.
  useEffect(() => {
    if (params.get('hoy') && !started.current) {
      started.current = true;
      write();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const byDay = new Map<string, typeof entries>();
  (entries ?? [])
    .slice()
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.createdAt - a.createdAt)
    .forEach((e) => {
      const d = e.date ?? toISODate(new Date(e.createdAt));
      byDay.set(d, [...(byDay.get(d) ?? []), e]);
    });

  const prompt = PROMPTS[new Date().getDate() % PROMPTS.length];

  return (
    <div className="page narrow">
      <PageHeader
        idx="02"
        kicker="Capturar · Diario"
        title="Diario"
        sub={prompt}
        actions={<button className="btn btn-accent" onClick={write}>Escribir hoy</button>}
      />
      {entries && entries.length === 0 && (
        <Empty peng="nota" line="Tu diario está en blanco." hint="Escribe sin pensar en el formato. Nadie más lo lee.">
          <button className="btn btn-primary" onClick={write}>Empezar</button>
        </Empty>
      )}
      <div>
        {[...byDay].map(([day, list]) => {
          const d = parseISODate(day);
          return (
            <section key={day} className="journal-day">
              <div className="jd-date">
                <div className="jd-num">{d.getDate()}</div>
                <div>
                  <div className="jd-month">{MONTHS[d.getMonth()]} {d.getFullYear()}</div>
                  <div className="jd-wd">{weekdayName(day)}</div>
                </div>
              </div>
              <div>
                {list!.map((e) => (
                  <Link key={e.id} to={`/e/${e.id}`} className="jd-entry">
                    {e.title && <h3 className="je-title">{e.title}</h3>}
                    <p className="je-body">{e.body || <span className="faint">Entrada vacía</span>}</p>
                    {e.tags.length > 0 && <div className="meta mt-1"><Tags tags={e.tags} /></div>}
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
