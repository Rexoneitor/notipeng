import { useState } from 'react';
import { ago } from '../lib/dates';
import { toast } from '../lib/ui';
import { cloudConfigured, signIn, signOut, signUp, syncNow, useSyncStatus, type SyncState } from '../sync/cloud';

const LABEL: Record<SyncState, string> = {
  off: 'sin configurar',
  'signed-out': 'sin conectar',
  idle: 'al día',
  syncing: 'sincronizando…',
  offline: 'sin conexión · se sincronizará al volver',
  error: 'error',
};

/** Punto de estado para la barra lateral / cabecera móvil. */
export function SyncDot() {
  const s = useSyncStatus();
  if (s.state === 'off') return null;
  const color =
    s.state === 'idle' ? 'var(--ok)' : s.state === 'syncing' ? 'var(--warn)' : s.state === 'error' ? 'var(--danger)' : 'var(--ink-4)';
  return (
    <span
      className="sync-dot"
      title={`Sincronización: ${LABEL[s.state]}${s.lastSync ? ` · ${ago(s.lastSync)}` : ''}`}
      aria-label={`Sincronización: ${LABEL[s.state]}`}
      style={{ background: color }}
      data-busy={s.state === 'syncing'}
    />
  );
}

export function SyncPanel() {
  const s = useSyncStatus();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!cloudConfigured) {
    return (
      <div className="storage-note">
        La sincronización en la nube aún no está configurada en esta versión. Cuando se conecte a Supabase,
        aquí podrás entrar con tu cuenta y tus datos se compartirán entre el teléfono y el ordenador.
      </div>
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (s.state === 'signed-out') {
    return (
      <form
        className="stack"
        style={{ gap: 12 }}
        onSubmit={(e) => { e.preventDefault(); run(() => signIn(email.trim(), password)); }}
      >
        <p className="muted" style={{ fontSize: '0.93em' }}>
          Entra con la misma cuenta en el teléfono y en el ordenador. Lo que ya tengas en este dispositivo se sube y se une con lo de la nube; nada se borra.
        </p>
        <label className="field">
          <span>Correo</span>
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input className="input" type="password" autoComplete="current-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {err && <p className="accent mono" style={{ fontSize: 12 }}>{err}</p>}
        <div className="row wrap">
          <button className="btn btn-primary" type="submit" disabled={busy}>Entrar</button>
          <button
            className="btn"
            type="button"
            disabled={busy || !email || password.length < 6}
            onClick={() =>
              run(async () => {
                const ready = await signUp(email.trim(), password);
                toast(ready ? 'Cuenta creada. Sincronizando…' : 'Cuenta creada. Revisa tu correo para confirmarla y luego pulsa Entrar.', undefined, 8000);
              })
            }
          >
            Crear mi cuenta
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      <p>
        Conectado como <strong>{s.email}</strong>
      </p>
      <p className="mono" style={{ fontSize: 12 }}>
        <SyncDot /> {LABEL[s.state]}
        {s.lastSync && s.state !== 'syncing' ? ` · última vez ${ago(s.lastSync)}` : ''}
      </p>
      {s.state === 'error' && s.error && <p className="accent mono" style={{ fontSize: 12 }}>{s.error}</p>}
      <div className="row wrap">
        <button className="btn" onClick={() => syncNow()} disabled={s.state === 'syncing'}>Sincronizar ahora</button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (confirm('¿Cerrar sesión en este dispositivo? Tus datos locales se quedan aquí; solo deja de sincronizar.')) signOut();
          }}
        >
          Cerrar sesión
        </button>
      </div>
      <p className="muted" style={{ fontSize: '0.88em' }}>
        Se sincroniza solo: al abrir la app, al volver a ella, tras cada cambio y al instante cuando el otro dispositivo cambia algo. Sin conexión sigues trabajando; se pone al día al reconectar.
      </p>
    </div>
  );
}
