# Bitácora — Arquitectura y decisiones

> *"No quiero una aplicación que me ayude a organizar más cosas. Quiero una aplicación que me ayude a hacer las cosas que realmente importan."*

Una **bitácora** es el cuaderno donde un navegante anota lo que pasa, decide el rumbo y registra el avance. Es diario, mapa y plan a la vez. Por eso el nombre.

Filosofía: **CAPTURAR → ORGANIZAR → PLANIFICAR → EJECUTAR → REVISAR**

---

## 1. Análisis de requisitos

Hay 49 puntos en el brief. Se reducen a cinco trabajos:

| Trabajo | Qué necesito | Dónde vive |
|---|---|---|
| Sacarlo de la cabeza | Capturar en segundos y sin decidir dónde va | `+ Capturar` (global), Bandeja |
| Darle forma | Convertir en idea, nota, tarea, proyecto u objetivo | Bandeja → conversiones |
| Decidir el rumbo | Objetivo, roadmap por fases, plan de acción | Proyecto, Objetivo |
| Avanzar hoy | Ver **el siguiente paso concreto** y hacerlo | Mesa, Tareas |
| Recordar y revisar | Fechas, recordatorios, diario, búsqueda | Calendario, Diario, Ctrl+K |

Cada pantalla tiene que servir al menos a uno de estos trabajos. Si no, sobra.

## 2. Contradicciones y tensiones detectadas

1. **"Experiencia de app real + notificaciones + alarmas" frente a "una sola base de código web".**
   Una PWA se instala, tiene icono y se abre a pantalla completa. Pero la web **no puede programar una notificación para dentro de 3 días con la app cerrada**: la API *Notification Triggers* se abandonó. Hay dos caminos:
   - **Web Push** desde un servidor. Funciona con la app cerrada, pero necesita backend y en iOS solo funciona con la app instalada, desde iOS 16.4.
   - **Notificaciones locales nativas** con Capacitor. Son exactas y funcionan sin servidor.

   Las **alarmas** de verdad, que suenan con el teléfono bloqueado, solo existen en nativo.
   → **Decisión:** PWA ahora. Los recordatorios se disparan con la app abierta o en segundo plano reciente, y los perdidos se muestran al abrirla. Más adelante se envuelve la misma app con **Capacitor** para tener notificaciones y alarmas nativas. El código de recordatorios está detrás de una interfaz `Scheduler` (`src/lib/reminders.ts`) para cambiar la implementación sin tocar la UI.

2. **"Sincronización entre dispositivos" frente a "privacidad / evitar servicios externos / gratis".**
   Sincronizar exige un servidor. Se resuelve con *local-first*: los datos viven en el dispositivo y la nube es una réplica opcional, con autenticación y aislamiento por usuario (RLS). El cifrado de extremo a extremo queda en el roadmap.

3. **"Offline" + "sync" ⇒ conflictos.** Siendo un solo usuario, basta con *last-write-wins* por registro, usando `updatedAt` y borrado lógico con `deletedAt`. Ya está implementado en `src/sync/engine.ts` y lo usa la importación de backups.

4. **"Muchísimas funciones" frente a "productividad sin agobio".** Se resuelve con revelación progresiva. La Mesa solo muestra *hoy*, *siguiente paso*, *captura* y *recientes*. No hay rachas, puntuaciones ni gráficas en el MVP.

5. **"Personalización" frente a "no excesivamente compleja".** Se ofrecen 3 temas, 6 acentos más uno libre, 3 combinaciones tipográficas y 2 densidades. Nada más.

6. **iOS.** Safari borra el almacenamiento de webs *no instaladas* tras 7 días sin uso. Instalada en la pantalla de inicio no ocurre. La app pide almacenamiento persistente (`navigator.storage.persist()`) y Ajustes muestra el estado.

## 3. Stack elegido

| Capa | Elección | Por qué |
|---|---|---|
| UI | **React 19 + TypeScript** | Ecosistema maduro y tipado para un modelo con muchas relaciones. Reutilizable en Capacitor tal cual. |
| Build | **Vite** | Arranque instantáneo y build pequeño. |
| Datos locales | **IndexedDB vía Dexie 4** | Base de datos real en el navegador, offline, capaz de guardar archivos (Blob). `useLiveQuery` hace la UI reactiva: escribes en un sitio y se actualiza en todos. |
| Instalación | **PWA** (`vite-plugin-pwa` + Workbox) | Icono, pantalla completa, offline, atajos de app y "Compartir con Bitácora" en Android. Coste cero. |
| Móvil nativo (fase posterior) | **Capacitor** | Envuelve la *misma* app web. Añade notificaciones locales exactas, alarmas y widgets. |
| Rutas | React Router 7 | |
| Fuentes | Fontsource (autoalojadas) | Sin peticiones a Google Fonts (privacidad) y disponibles offline. |
| Export | `fflate` | ZIP de Markdown en el cliente. |

**Descartados:**
- **React Native / Expo.** Obliga a rehacer la versión de escritorio/web, o a usar RN-web con peor experiencia de escritura, y la prioridad es escribir y planificar en el ordenador.
- **Flutter.** Otro lenguaje y peor web.
- **Electron.** Innecesario: una PWA instalada en Windows/macOS desde Chrome o Edge ya es una ventana propia.

**Una sola base de código** para web, escritorio (PWA instalada) y móvil (PWA ahora, Capacitor después).

## 4. Escritorio + móvil

No es una web encogida. Hay dos *layouts* que comparten los mismos datos y componentes:

- **Escritorio (≥ 900 px).** Barra lateral organizada por la filosofía (Capturar · Organizar · Ejecutar · Revisar), con favoritos, contenido amplio en dos columnas en la Mesa y vistas de proyecto con roadmap horizontal. Atajos: `Ctrl/Cmd+K` para buscar o lanzar comandos, `N` para capturar, `/` para buscar y `Esc` para cerrar.
- **Móvil.** Barra inferior: **Mesa · Proyectos · ＋ · Tareas · Más**. El `＋` central abre una hoja inferior con el teclado ya activo. Usa áreas táctiles de 44 px o más, respeta `safe-area-inset` y no usa *hover*.
  - Captura desde fuera de la app con el atajo del icono (mantener pulsado → "Capturar").
  - En Android, compartir texto o enlaces desde cualquier app → Bitácora → entra directo a la Bandeja (`share_target`).

## 5. Datos: dónde están, sincronización y backups

### Dónde se almacenan hoy
En **IndexedDB del navegador de cada dispositivo**, en la base `bitacora`. No sale nada a Internet. Las preferencias visuales (tema, acento…) están en `localStorage` porque son por dispositivo.

### Cómo se sincroniza (diseño preparado)
Cada registro tiene:
```
id         UUID v4 (generado en cliente → no hay colisiones entre dispositivos)
createdAt  epoch ms
updatedAt  epoch ms  ← reloj del cambio, base de last-write-wins
deletedAt  epoch ms | null  ← borrado lógico (tombstone) para propagar borrados
```
El motor (`src/sync/engine.ts`) define:
- `mergeSnapshot(remote)`: para cada registro, gana el `updatedAt` mayor.
- `SyncAdapter { pull(since), push(changes) }`: interfaz para conectar cualquier backend.

Ciclo previsto: al abrir la app, al recuperar conexión y cada X minutos → `push` de cambios locales con `updatedAt > lastSync` → `pull` de cambios remotos → `merge`.

### Alternativas para alojar los datos

| Opción | Coste | Pros | Contras |
|---|---|---|---|
| **Supabase** (recomendada) | Gratis (500 MB DB, 1 GB archivos) | Postgres de verdad, Auth, RLS, Storage para adjuntos y Edge Functions para Web Push. Tus datos están en SQL estándar. | El plan gratis pausa el proyecto tras ~1 semana sin actividad (se reactiva). |
| **Dexie Cloud** | Plan gratuito limitado | Casi cero código: ya usamos Dexie. Sync y auth incluidos. | Servicio propietario más pequeño. |
| **PocketBase** autoalojado | 0–5 €/mes (VPS) | Un binario y control total. | Lo mantienes tú. |
| **Archivo** (hoy) | 0 | Exportar JSON → Drive/OneDrive → importar en otro dispositivo (fusiona sin duplicar). | Manual. |

Un esquema SQL de referencia para Supabase está en la sección 11.

### Backups
**Ajustes → Datos**:
- **JSON completo.** Restaurable, incluye adjuntos en base64. Importarlo *fusiona* y no duplica.
- **Markdown (.zip).** Un archivo por nota, entrada, idea o proyecto, legible en Obsidian o cualquier editor.
- **CSV** de tareas.

*Tus datos son tuyos:* todo se puede exportar en formatos abiertos.

### Acceso desde varios dispositivos
1. Publicar el build estático (`npm run build` → carpeta `dist/`) en **Cloudflare Pages / Netlify / Vercel / GitHub Pages**. Es gratis, con HTTPS, que es necesario para instalar la PWA y para las notificaciones.
2. Abrir la URL en el teléfono → "Añadir a pantalla de inicio" o "Instalar".
3. Hasta activar la sincronización en la nube, cada dispositivo tiene sus datos. El puente es exportar e importar JSON.

## 6. Modelo de datos

```
Area ─┬─< Entry (inbox | note | journal | idea)
      ├─< Project ─┬─< Phase ─< Task
      │            ├─< Task (plan de acción, ordenado por `order`)
      │            ├─< Entry (notas del proyecto)
      │            ├─< Event, Reminder, Attachment, links[]
      │            └── fromEntryId → Entry (la idea de la que nació)
      └─< Goal ─┬─< Project (goalId)
                └─< Task (goalId)

Task ─< Reminder (refType='task')
Attachment (ownerType, ownerId) → Blob en IndexedDB
```

| Tabla | Campos clave |
|---|---|
| `entries` | `kind`, `title`, `body`, `tags[]`, `areaId`, `projectId`, `goalId`, `date` (diario), `ideaStatus`, `priority`, `category`, `favorite`, `archived`, `openedAt`, `convertedTo` |
| `projects` | `title`, `description`, `objective`, `status`, `startDate`, `targetDate`, `priority`, `areaId`, `goalId`, `tags`, `favorite`, `links[]`, `fromEntryId` |
| `phases` | `projectId`, `title`, `order`, `note` |
| `tasks` | `title`, `notes`, `status` (pendiente / progreso / hecha), `priority`, `due`, `time`, `projectId`, `phaseId`, `goalId`, `order`, `completedAt`, `tags` |
| `goals` | `title`, `description`, `targetDate`, `status`, `areaId`, `favorite`, `tags` |
| `areas` | `name`, `symbol`, `order` |
| `events` | `title`, `date`, `time`, `endTime`, `notes`, `projectId` |
| `reminders` | `title`, `at`, `kind` (recordatorio / alarma), `refType`, `refId`, `firedAt`, `done`, `repeat` |
| `attachments` | `ownerType`, `ownerId`, `name`, `mime`, `size`, `blob` |

**Progreso basado en acciones reales:** proyecto = tareas hechas / tareas totales; fase = lo mismo dentro de la fase; objetivo = todas las tareas de sus proyectos más sus tareas directas. No hay porcentajes inventados.

**Siguiente paso:** la primera tarea *en progreso* del plan de acción; si no hay ninguna, la primera *pendiente* según el orden.

## 7. Arquitectura de código

```
src/
  db/        types.ts (modelo) · db.ts (Dexie + esquema versionado) · repo.ts (CRUD, conversiones, progreso)
  sync/      engine.ts (merge LWW, interfaz SyncAdapter)
  lib/       dates · parse (lenguaje natural ES) · search · reminders · export · prefs · sound
  components/ Layout, Sidebar, BottomBar, CaptureSheet, CommandPalette, TaskRow, TaskSheet, UI primitives, Icons
  pages/     Desk, Inbox, Journal, Notes, Ideas, EntryPage, Projects, ProjectView, Tasks, Goals, GoalView, Calendar, Tags, Recent, Settings, Share
```

Reglas:
- **La UI nunca toca Dexie directamente para escribir.** Todo pasa por `repo.ts`, que sella `updatedAt` y es el único punto a cambiar cuando llegue la sync.
- **Lectura reactiva** con `useLiveQuery`: no hay estado global duplicado.
- **Preparado para IA:** las conversiones (`entryToProject`, `entryToTask`…) y la creación de fases y tareas son funciones puras de `repo.ts`. Una IA futura solo tiene que devolver una estructura `{goal, project, phases[], tasks[]}` y llamar a las mismas funciones.

## 8. Navegación

```
Mesa (/)                       ← pantalla principal
CAPTURAR   Bandeja · Diario
ORGANIZAR  Ideas · Notas · Etiquetas y áreas
EJECUTAR   Proyectos · Tareas · Objetivos · Calendario
REVISAR    Recientes
           Favoritos (lista viva)
           Ajustes
```
Detalle: `/e/:id` (entrada), `/proyectos/:id`, `/objetivos/:id`, `/etiqueta/:tag`, `/area/:id`.

## 9. MVP (implementado en esta primera versión)

- Mesa con saludo, frase contextual, captura, Hoy, Siguiente paso, Ideas recientes y Próximamente.
- Captura rápida global (botón, `N`, atajo de icono, compartir) con lenguaje natural: `mañana a las 10`, `el viernes`, `#etiqueta`, `!alta`.
- Bandeja con procesado: → tarea, idea, nota, diario, proyecto, objetivo; archivar; eliminar.
- Diario cronológico. Notas. Ideas con estados, categoría y prioridad.
- Proyectos: estados, objetivo, fechas, plan de acción ordenable, siguiente paso, roadmap por fases, notas, archivos, enlaces, progreso real.
- Tareas: hoy, próximas, sin fecha, hechas; prioridad; recordatorio.
- Objetivos con proyectos y tareas asociadas y progreso.
- Áreas personalizables y etiquetas.
- Búsqueda global `Ctrl/Cmd+K`, que también lanza comandos.
- Calendario: mes, semana y agenda, con eventos, tareas, deadlines y recordatorios.
- Recordatorios y alarmas (web), con permisos pedidos solo cuando hacen falta.
- Favoritos, recientes abiertos y modificados.
- Tema claro/oscuro/auto, acento, tipografía y densidad.
- Export JSON, Markdown y CSV, e import con fusión. Papelera.
- PWA instalable y offline.

## 10. Roadmap posterior

1. **Sync en la nube** (Supabase + Auth, adapter sobre `SyncAdapter`) y adjuntos en Storage.
2. **Capacitor**: notificaciones locales exactas, alarmas reales y widget de captura.
3. **Revisión semanal** guiada (qué hice, qué se atascó, siguiente paso por proyecto), sin puntuaciones.
4. **IA (opcional):** organizar idea → objetivo/proyecto/fases/tareas; resumir notas; extraer tareas; generar roadmap; revisión semanal asistida.
5. Búsqueda semántica (embeddings locales o en servidor).
6. Captura por voz (Web Speech API / nativa).
7. Integración de calendario (ICS export → Google Calendar sync).
8. Cifrado de extremo a extremo de la réplica en la nube.
9. Mesa personalizable (ocultar/reordenar bloques).

## 11. Esquema SQL de referencia (Supabase)

```sql
-- Una tabla por entidad con las mismas columnas que IndexedDB + user_id.
create table entries (
  id uuid primary key, user_id uuid not null default auth.uid() references auth.users,
  kind text not null, title text, body text, tags text[] default '{}',
  area_id uuid, project_id uuid, goal_id uuid, date date,
  idea_status text, priority text, category text, favorite boolean default false,
  archived boolean default false, created_at bigint, updated_at bigint not null, deleted_at bigint
);
alter table entries enable row level security;
create policy "solo el dueño" on entries using (user_id = auth.uid()) with check (user_id = auth.uid());
create index on entries (user_id, updated_at);
-- …idéntico para projects, phases, tasks, goals, areas, events, reminders.
-- attachments → Supabase Storage (bucket privado por usuario).
```

## 12. Dirección visual

**"Escritorio de papel a la luz de una lámpara."** No hay tarjetas blancas flotando sobre gris ni morado SaaS.

- **Superficies:** papel cálido (`#F2EEE5`) con una retícula de puntos muy sutil, como un cuaderno punteado. De noche es un escritorio oscuro y cálido (`#161513`), no negro azulado.
- **Tinta:** texto casi negro y cálido. El color de acento se usa como **lacre o rotulador**: el botón de captura, el siguiente paso, la prioridad alta y el progreso. Nunca en fondos grandes.
- **Tipografía (3 voces):**
  - *Editorial* (Fraunces) para títulos: con carácter, ligeramente "suave".
  - *Lectura* (Newsreader) para escribir y leer: serif de pantalla, cómoda en textos largos.
  - *Técnica* (**JetBrains Mono**) para todo lo que es *dato*: fechas, etiquetas, estados, navegación, contadores e índices (`01 MESA`). Es la voz del "laboratorio".

  Combinaciones alternativas: *Laboratorio* (Mono + IBM Plex Sans) y *Biblioteca* (Literata).
- **Lenguaje gráfico:**
  - Encabezados como fichas de catálogo de biblioteca (`02 ─ HOY ──────`).
  - Estados como **sellos** en mono.
  - Prioridad como `!!!`, `!!`, `!`.
  - Progreso como **regla de marcas** (`▮▮▮▮▯▯▯▯▯▯`) en lugar de barras genéricas.
  - Bordes finos, radio mínimo (3 px) y reglas horizontales como en un cuaderno.
- **Movimiento:** transiciones cortas (150–250 ms), hojas que suben, check con pequeño "pop". Respeta `prefers-reduced-motion`.
- **Voz:** "¿Qué tienes en la cabeza?", "Una cosa a la vez.", "¿Cuál es el siguiente paso?", usada con moderación y siempre según el contexto.
