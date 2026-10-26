import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import '@fontsource-variable/onest/wght.css';
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import '@fontsource-variable/ibm-plex-sans/wght.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/app.css';

import { App } from './App';
import { applyPrefs } from './lib/prefs';
import { ensureProfile, seedIfEmpty } from './db/repo';
import { scheduler } from './lib/reminders';
import './lib/install';
import { initCloud } from './sync/cloud';

applyPrefs();
registerSW({ immediate: true });

// Pide almacenamiento persistente para que el navegador no borre los datos.
navigator.storage?.persist?.().catch(() => {});

seedIfEmpty().then(ensureProfile).catch(() => {}).finally(() => {
  scheduler.start();
  initCloud();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
