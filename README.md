# Notipeng

Tu espacio personal en el hielo para **capturar → organizar → planificar → ejecutar → revisar**.

> *"No quiero una aplicación que me ayude a organizar más cosas. Quiero una aplicación que me ayude a hacer las cosas que realmente importan."*

La arquitectura, las decisiones y el roadmap están en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

## Usarla en tu ordenador

```bash
npm install
npm run dev
```
Abre http://localhost:5173. En Chrome o Edge puedes instalarla como app con el icono de instalar de la barra de direcciones.

## Instalación como PWA y modo móvil

Las aplicaciones progresivas (PWA) requieren un contexto seguro (HTTPS o localhost) para registrar Service Workers y permitir la instalación en el dispositivo:

1. `npm run build` → genera el bundle estático en `dist/`.
2. Servir con cualquier servidor HTTP local o estático que soporte HTTPS.
3. Para instalar en el navegador/dispositivo:
   - **Escritorio (Chrome / Edge):** icono de instalación en la barra de direcciones.
   - **Android (Chrome):** menú ⋮ → *Instalar aplicación*.
   - **iOS (Safari):** Compartir → *Añadir a pantalla de inicio*.

Una vez instalada:
- **Android:** soporte para accesos rápidos ("Capturar" o "Diario") y Web Share Target para recibir texto o enlaces desde otras aplicaciones.

## Dónde están tus datos y cómo se sincronizan

Cada dispositivo guarda una **copia completa** en su navegador (IndexedDB), así que la app funciona sin conexión.
Con la sincronización activada, todos los dispositivos se encuentran en **tu base de datos privada de Supabase** (plan gratis):

- Entras con la misma cuenta en el teléfono y en el ordenador (Ajustes → Sincronización).
- Cada cambio se sube a los ~2 s y el otro dispositivo lo recibe al instante (tiempo real). Si estás sin conexión, se pone al día al volver.
- Si el mismo elemento se edita en dos sitios, gana la edición más reciente.
- Los archivos adjuntos van a un bucket privado de Supabase Storage.
- Cada usuario solo puede leer y escribir sus propios datos (Row Level Security).

### Configurarla (una sola vez)

1. Crea un proyecto gratis en supabase.com.
2. En el proyecto, abre **SQL Editor**, pega [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
3. En **Authentication → Sign In / Providers → Email**, desactiva *Confirm email* (para uso personal).
4. Copia `.env.example` como `.env.local` con tu *Project URL* y tu clave *anon/publishable* (Project Settings → API).
5. `npm run build` y publica `dist/`. Entra con tu cuenta en cada dispositivo.
6. Cuando tengas tu cuenta creada, desactiva el registro de usuarios nuevos (*Allow new users to sign up*) para que nadie más pueda crearse cuenta en tu proyecto.

> El plan gratis de Supabase pausa los proyectos tras ~7 días sin ninguna actividad. Usándola a diario no pasa. Si ocurre, la app sigue funcionando en local y se reanuda al reactivar el proyecto desde el panel.

**Backup independiente:** Ajustes → Tus datos → *Backup completo (JSON)*. También puedes exportar Markdown (.zip) y CSV de tareas.

## Atajos

| | |
|---|---|
| `N` | Capturar desde cualquier pantalla |
| `Ctrl/⌘ + K` o `/` | Buscar y lanzar comandos (`#etiqueta` filtra) |
| `Ctrl/⌘ + Enter` | Guardar captura |
| `Esc` | Cerrar |

La captura entiende lenguaje natural:
- `Recordarme llamar a Ana el viernes a las 10 #uni !alta` → recordatorio el viernes a las 10:00, etiqueta `uni`, prioridad alta.
- `mañana`, `pasado mañana`, `el lunes`, `en 3 días`, `15 de noviembre`, `15/11`, `a las 6 de la tarde`.

## Limitación actual de los recordatorios

En la versión web, los avisos se disparan con la app abierta o en segundo plano reciente. Si estaba cerrada, verás los pendientes al abrirla. Para avisos exactos con la app cerrada y alarmas reales, el roadmap contempla envolver la misma app con **Capacitor**. El código ya está aislado tras la interfaz `Scheduler`.

## Stack

React 19 · TypeScript · Vite · Dexie (IndexedDB) · vite-plugin-pwa · React Router. Las fuentes (Fraunces, Newsreader, JetBrains Mono, Literata, IBM Plex Sans) están autoalojadas y funcionan sin conexión.
