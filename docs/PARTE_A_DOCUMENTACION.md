# PARTE A — DOCUMENTACIÓN DEL PROYECTO

> Registro fiel de la aplicación tal como quedó construida.
> Documenta el **resultado final**, no las ideas iniciales: cuando algo cambió por el camino se indica la versión que quedó.
> Las marcas de estado se usan en todo el documento:
> **[HECHO]** implementado y probado · **[HECHO, SIN VERIFICAR]** implementado pero no probado en condiciones reales · **[DATOS SÍ, UI NO]** el modelo lo admite pero ninguna pantalla lo usa · **[NO IMPLEMENTADO]** solo idea o pendiente.

---

## A.0 Ficha del proyecto

| | |
|---|---|
| Nombre actual | **Notipeng** (se llamó «Bitácora» durante gran parte del desarrollo; la carpeta del código y la base de datos interna conservan el nombre `bitacora`) |
| Tipo | Aplicación personal de productividad: captura, organización, planificación y ejecución |
| Usuario | Una sola persona (uso personal), en ordenador y teléfono |
| Idioma de la interfaz | Español |
| Forma de entrega | PWA (aplicación web instalable), una sola base de código para escritorio y móvil |
| Publicación | Cloudflare Workers (recursos estáticos), plan gratuito |
| Sincronización | Supabase (Postgres + Auth + Storage + Realtime), plan gratuito |
| Tamaño | 51 archivos fuente, ~7.000 líneas (TypeScript/TSX/CSS/SQL) |
| Pruebas automatizadas | **Ninguna.** Se verificó con compilación de tipos, build y pruebas manuales en navegador |

---

## A.1 Qué es y qué problema resuelve

El usuario tiene muchas ideas (negocios, proyectos, universidad, contenido, metas personales) que quedan dispersas y no llega a ejecutar. La aplicación está pensada para recorrer este camino:

> «Tengo esto en la cabeza» → «esto es lo que quiero hacer» → «este es el plan» → «estos son los siguientes pasos» → «esto es lo que estoy haciendo hoy».

**Filosofía:** CAPTURAR → ORGANIZAR → PLANIFICAR → EJECUTAR → REVISAR.

**Principio rector** (lo fijó el usuario y guía cada decisión):
> «No quiero una aplicación que me ayude a organizar más cosas. Quiero una aplicación que me ayude a hacer las cosas que realmente importan.»

Consecuencias concretas de ese principio en lo construido:
- Capturar nunca obliga a clasificar: todo puede ir primero a la Bandeja.
- Cada proyecto tiene siempre un **siguiente paso concreto** visible.
- El progreso se calcula solo con acciones reales (tareas hechas / tareas totales). No hay porcentajes inventados.
- No hay rachas, puntuaciones, gamificación ni paneles de estadísticas. El perfil muestra un resumen amable («lo que has construido») sin presión.
- Las notificaciones solo existen si el usuario crea un recordatorio.
- Los textos de la interfaz son tranquilos («Una cosa a la vez.», «¿Cuál es el siguiente paso?», «Sin culpa: decide si siguen importando.») y aparecen con moderación según el contexto.

---

## A.2 Evolución y decisiones tomadas

| Momento | Decisión | Estado final |
|---|---|---|
| Inicio | PWA con React + Vite + IndexedDB (Dexie), local-first, preparada para sincronizar | Se mantiene |
| Inicio | Descartados React Native/Expo (obliga a rehacer escritorio), Flutter y Electron | Se mantiene; Capacitor queda como paso futuro |
| Diseño v1 | Dirección «cuaderno de papel» (crema, Fraunces/Newsreader, mono en mayúsculas, retícula de puntos, numeración `01 ──`) | **Descartada** por parecer «diseñada por una IA» |
| Diseño v2 | Paleta «Atardecer» (azul marino + coral) elegida por el usuario entre 6 propuestas | **Sustituida** |
| Diseño v3 | Rediseño «hecho a mano» (manuscrita, texturas, notas adhesivas) | **Descartado por el usuario a mitad de trabajo**: quería una app profesional, no artesanal |
| Diseño final | Estética profesional tipo Notion/Obsidian con tema **Ártico** (blancos hielo, azul glaciar, noche polar, aurora), mascota pingüino, nombre **Notipeng** | **Vigente** |
| Sincronización v1 | Exportar/importar JSON con fusión | Se mantiene como backup |
| Sincronización v2 | Supabase con tabla genérica `records`, last-write-wins, tiempo real | **Vigente** |
| Publicación | Cloudflare Pages → Workers (recursos estáticos) | **Vigente:** Workers |
| Voz | Dictado del navegador vs. Whisper local | **Pendiente de decisión del usuario; no implementado** |
| Perfil | Añadido al pedir «perfil de usuario» en el rediseño | **Vigente** |

---

## A.3 Estado real de cada parte

**[HECHO]**
- Mesa (dashboard).
- Captura rápida global con lenguaje natural.
- Bandeja con procesado.
- Diario, notas e ideas.
- Editor de entradas.
- Proyectos con plan de acción, roadmap por fases, notas, fechas, archivos y enlaces.
- Tareas.
- Objetivos.
- Calendario (mes/semana/agenda).
- Etiquetas y áreas.
- Búsqueda/paleta de comandos.
- Recientes y favoritos.
- Perfil.
- Ajustes (apariencia, áreas, avisos, instalar, datos, papelera, atajos).
- Exportar JSON/Markdown/CSV e importar con fusión.
- Papelera con restauración.
- Recordatorios y alarmas con la app abierta.
- PWA instalable con atajos e iconos.
- Tema claro/oscuro/automático, 6 acentos más uno libre, 3 tipografías y 2 densidades.

**[HECHO, SIN VERIFICAR]**
- Sincronización Supabase de extremo a extremo. El esquema SQL está aplicado y la conexión verificada (la tabla responde vacía sin sesión), pero el usuario aún no había creado su cuenta, así que nunca se probó un ciclo real entre dos dispositivos.
- Notificaciones del sistema en un teléfono real.
- Instalación en iOS y Android.
- «Compartir → app» en Android.
- Uso prolongado sin conexión.

**[DATOS SÍ, UI NO]**
- Repetición de recordatorios (`repeat: 'daily' | 'weekly'`): el planificador la respeta, pero ninguna pantalla permite elegirla.
- Campo `note` de las fases.
- Campos `goalId` en entradas: sí tienen UI (selector «objetivo» en el editor), pero no se muestran en la vista de objetivo.

**[NO IMPLEMENTADO]**
- Dictado por voz.
- Notificaciones con la app cerrada (Web Push).
- Alarmas nativas.
- Capacitor.
- Edición de eventos (solo crear y borrar).
- Renderizado Markdown en notas (son texto plano).
- Arrastrar y soltar (se reordena con botones ▲/▼).
- Revisión semanal.
- IA.
- Cifrado de extremo a extremo.
- Integración con calendarios externos.
- Widgets.
- Mesa personalizable.
- Pruebas automatizadas.

---

## A.4 Arquitectura técnica

### Stack (versiones instaladas)
| Capa | Tecnología |
|---|---|
| UI | React 19.3 + TypeScript 7 (modo estricto) |
| Build | Vite 8.3 + `@vitejs/plugin-react` 6 |
| Rutas | React Router 7.18 (`createBrowserRouter`) |
| Datos locales | Dexie 4.4 (IndexedDB) + `dexie-react-hooks` (`useLiveQuery`) |
| PWA | `vite-plugin-pwa` 2 (Workbox `generateSW`, `registerType: 'autoUpdate'`) + `@vite-pwa/assets-generator` para iconos |
| Nube | `@supabase/supabase-js` 2.117 (cargado de forma diferida con `import()`) |
| ZIP | `fflate` 0.8 (export Markdown) |
| Fuentes | Fontsource autoalojadas: Onest, JetBrains Mono, Fraunces, Newsreader, IBM Plex Sans (variables) |
| Iconos | Conjunto propio de SVG de trazo (`Icons.tsx`), sin librería |
| Estado global | Sin librerías: pequeños *stores* con `useSyncExternalStore` (`lib/ui.ts`, `lib/prefs.ts`, `sync/cloud.ts`) |

### Estructura de carpetas
```
bitacora/
├── index.html              script inline que aplica tema/acento antes del primer pintado
├── vite.config.ts          manifiesto PWA, atajos, share_target, Workbox
├── public/                 icon.svg (pingüino), PNG generados, sw-notify.js (clic en notificación)
├── supabase/schema.sql     tabla records, RPC push_records, RLS, realtime, bucket attachments
├── docs/                   ARQUITECTURA.md (desactualizado en lo visual), esta documentación
└── src/
    ├── main.tsx            fuentes, estilos, registro SW, persist(), seed → perfil → planificador → nube
    ├── App.tsx             rutas
    ├── db/
    │   ├── types.ts        modelo de datos
    │   ├── db.ts           esquema Dexie (versión 1 + versión 2 con `profile`)
    │   ├── repo.ts         ÚNICA puerta de escritura: CRUD, cascadas, conversiones, progreso, seeds
    │   └── hooks.ts        lecturas reactivas (useLiveQuery)
    ├── sync/
    │   ├── engine.ts       fusión last-write-wins, cambios locales, bandera applyingRemote
    │   └── cloud.ts        Supabase: sesión, ciclo subir/bajar/archivos, disparadores, estado
    ├── lib/
    │   ├── dates.ts        fechas locales YYYY-MM-DD, formatos en español
    │   ├── parse.ts        lenguaje natural de la captura
    │   ├── search.ts       búsqueda global en memoria, etiquetas
    │   ├── reminders.ts    planificador web de recordatorios/alarmas, permisos, notificaciones
    │   ├── export.ts       JSON / Markdown zip / CSV, importación
    │   ├── prefs.ts        preferencias visuales por dispositivo
    │   ├── install.ts      evento beforeinstallprompt
    │   ├── sound.ts        sonidos sintetizados (WebAudio)
    │   └── ui.ts           capas abiertas (captura, paleta, tarea, «más»), avisos, alarma
    ├── components/         Layout (sidebar, barra móvil), CaptureSheet, CommandPalette, TaskSheet,
    │                       TaskRow, Overlays (toasts, alarma), Attachments, SyncPanel, Art (logo,
    │                       mascota, avatares), ui.tsx (primitivas), Icons
    ├── pages/              Desk, Inbox, Journal, Notes, Ideas, EntryPage, Projects, ProjectView,
    │                       Tasks, Goals, GoalView, Calendar, Tags (+TagView, AreaView), Recent,
    │                       Profile, Settings, Share, NotFound
    └── styles/             tokens.css (paleta/tipos), base.css, app.css
```

### Reglas de arquitectura que se cumplieron
1. **La UI nunca escribe en Dexie directamente.** Todo pasa por `repo.ts`, que sella `updatedAt` en cada cambio. Es el único punto que hubo que tocar para la sincronización.
2. **Lectura reactiva:** cada pantalla lee con `useLiveQuery`. No hay estado duplicado, y cualquier escritura (local o remota) refresca la UI.
3. **Borrado lógico:** `deletedAt` en lugar de borrar, para poder deshacer, tener papelera y propagar borrados.
4. **IDs UUID generados en el cliente** (`crypto.randomUUID()`), así no hay colisiones entre dispositivos. Excepciones deterministas: áreas por defecto `area-<nombre>`, nota de bienvenida `bienvenida` y perfil `me`.
5. **Preparado para IA futura:** conversiones y creación de fases/tareas son funciones de `repo.ts` que una IA podría invocar con una estructura `{objetivo, proyecto, fases[], tareas[]}`.

### Persistencia
- Base IndexedDB `bitacora` con tablas `entries, projects, phases, tasks, goals, areas, events, reminders, attachments, profile`.
- Los adjuntos se guardan como `Blob` dentro de IndexedDB (máx. 25 MB por archivo).
- Se pide `navigator.storage.persist()` al arrancar. Ajustes muestra el uso y si está garantizado.
- Las preferencias visuales van en `localStorage` (`bitacora.prefs`), por dispositivo y sin sincronizar.

### Sincronización (Supabase)
- **Servidor:** una tabla genérica `records(user_id, tbl, id, data jsonb, updated_at, deleted_at, rev)`, con clave `(user_id, tbl, id)`, RLS «solo el dueño» y secuencia `rev` asignada en cada inserción o actualización.
  - RPC `push_records(rows jsonb)`: inserta o actualiza **solo si** `updated_at` entrante es mayor. El servidor nunca pisa una versión más nueva.
  - La tabla está publicada en `supabase_realtime`.
  - Bucket privado `attachments` con políticas por carpeta `user_id/`.
- **Cliente, ciclo `cycle()`:**
  1. **Subir:** registros con `updatedAt > lastPush` (reloj del dispositivo), excluyendo versiones que ya vinieron del servidor (mapa `seen` en `localStorage`). Los adjuntos suben su blob a Storage y la fila sin blob. Va en lotes de 400.
  2. **Bajar:** filas con `rev > lastRev - 50` (solape de seguridad; la fusión es idempotente), paginadas de 1000 en 1000. Se fusionan con `mergeSnapshot` (gana `updatedAt` mayor) bajo la bandera `applyingRemote`.
  3. **Archivos:** descarga los blobs que falten.
  4. **Deduplicar áreas** con el mismo nombre. Si une alguna, hace otra pasada.
- **Disparadores:**
  - Escritura local con cambio de `updatedAt` (hooks de Dexie): espera 2 s y sincroniza.
  - Evento de tiempo real del otro dispositivo: espera 0,6 s.
  - Al abrir la app, al volver a ella (`visibilitychange`), al recuperar conexión y cada 60 s con la app visible.
- **Cursores** por usuario en `localStorage`: `bitacora.sync.<uid>` (`lastRev`, `lastPush`) y `bitacora.seen.<uid>`.
- Tras **importar un backup** se fuerza una subida completa (`lastPush = 0`).
- **Autenticación:** correo + contraseña (se descartó el enlace mágico porque en iOS se abre fuera de la PWA). Se recomienda desactivar «Confirm email» y, tras crear la cuenta, «Allow new users to sign up».
- **Configuración:** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local` (incluidas en el build; la clave es pública por diseño). Sin ellas, la sección muestra «sin configurar» y la app funciona solo en local.
- **Estado visible:** un punto en la cabecera (verde al día, ámbar sincronizando, rojo error, gris sin conexión/sin sesión) y el panel completo en Ajustes.

### Recordatorios y notificaciones (web)
- Planificador `WebScheduler`: revisa cada 10 s y al volver a la app. Dispara los recordatorios con `at <= ahora`, no hechos y no disparados.
- **Recordatorio:** aviso dentro de la app («🔔 título» con botón *Hecho*) y notificación del sistema **solo si la app está en segundo plano**.
- **Alarma:** suena (WebAudio), envía la notificación con `requireInteraction` y abre una capa a pantalla completa con *Posponer 10 min*, *Abrir* y *Hecho*.
- Con `repeat`, se reprograma a la siguiente ocurrencia en lugar de marcarse como disparado.
- El permiso se pide solo al crear el primer recordatorio o desde Ajustes.
- `sw-notify.js` enfoca la app y navega a la URL del elemento al tocar la notificación.
- **Limitación:** con la app totalmente cerrada no se dispara nada; los pendientes aparecen al abrir. Se documenta en Ajustes.

### PWA
- Manifiesto: nombre, colores, iconos (64/192/512/maskable).
- **Atajos del icono:** Capturar (`/?capturar=1`), Escribir en el diario (`/diario?hoy=1`) y Tareas de hoy.
- **`share_target`** GET a `/capturar` (title/text/url): crea una entrada en la Bandeja.
- Workbox precachea JS/CSS/HTML/SVG/PNG/ICO y las fuentes `latin`; las demás fuentes se cachean en tiempo de ejecución. Tiene `navigateFallback`.
- Botón «Instalar» propio cuando el navegador ofrece `beforeinstallprompt`; instrucciones para iOS.

### Publicación
- Cloudflare Workers con recursos estáticos, worker `notipeng`, con `not_found_handling: "single-page-application"` para que las rutas directas (`/ajustes`) funcionen al recargar.
- Se despliega con `npx wrangler@4 deploy --config <wrangler.jsonc>`.
- **Riesgo:** ese `wrangler.jsonc` se creó fuera del repositorio, en una carpeta temporal. Hay que recrearlo en el proyecto para poder volver a publicar más adelante.

---

## A.5 Modelo de datos

Todos los registros heredan **Base**: `id: string`, `createdAt: number` (epoch ms), `updatedAt: number`, `deletedAt?: number | null`. Las fechas de día son cadenas locales `YYYY-MM-DD`; las horas, `HH:mm`.

| Entidad | Campos (además de Base) | Notas |
|---|---|---|
| **Entry** (bandeja, nota, diario, idea) | `kind: 'inbox'\|'note'\|'journal'\|'idea'`, `title`, `body`, `tags[]`, `areaId?`, `projectId?`, `goalId?`, `date?` (diario), `ideaStatus?`, `priority?`, `category?`, `favorite?`, `archived?`, `openedAt?`, `convertedTo?: {type:'project'\|'task'\|'goal', id}` | Un solo registro cambia de tipo al procesarse |
| **Project** | `title`, `description`, `objective`, `status`, `startDate?`, `targetDate?`, `priority?`, `areaId?`, `goalId?`, `tags[]`, `favorite?`, `links: {id,url,title}[]`, `fromEntryId?`, `openedAt?` | Estado: idea · planificación · en progreso · pausado · completado · archivado |
| **Phase** | `projectId`, `title`, `note`, `order` | Fases del roadmap |
| **Task** | `title`, `notes`, `status: 'pendiente'\|'progreso'\|'hecha'`, `priority?`, `due?`, `time?`, `projectId?`, `phaseId?`, `goalId?`, `areaId?`, `tags[]`, `order`, `completedAt?`, `fromEntryId?` | `order` inicial = `Date.now()`; se reordena intercambiando |
| **Goal** | `title`, `description`, `targetDate?`, `status: 'activo'\|'logrado'\|'pausado'\|'archivado'`, `areaId?`, `tags[]`, `favorite?`, `openedAt?`, `fromEntryId?` | |
| **Area** | `name`, `symbol` (carácter/emoji), `order` | 8 por defecto: Negocios ◆, Universidad ✎, Personal ●, Finanzas ¤, Salud ✚, Proyectos ▲, Aprendizaje ◎, Ideas ✦ |
| **CalEvent** | `title`, `date`, `time?`, `endTime?`, `notes`, `projectId?` | `endTime` sin UI |
| **Reminder** | `title`, `at` (epoch ms), `kind: 'recordatorio'\|'alarma'`, `refType?: 'task'\|'project'\|'entry'\|'goal'\|'event'`, `refId?`, `firedAt?`, `done`, `repeat?: 'none'\|'daily'\|'weekly'` | `repeat` sin UI |
| **Attachment** | `ownerType: 'project'\|'entry'\|'goal'\|'task'`, `ownerId`, `name`, `mime`, `size`, `blob: Blob\|null` | UI solo en entradas y proyectos; `null` mientras se descarga de la nube |
| **Profile** | `name`, `motto`, `intentions: string[]` (≤3), `avatar: {sticker, color}` | Registro único `id: 'me'` |

Enumeraciones:
- **Prioridad:** alta · media · baja (o ninguna).
- **Estado de idea:** nueva · explorando · interesante · en desarrollo · convertida en proyecto · descartada.

**Relaciones:**
```
Area 1─* Entry / Project / Goal / Task
Goal 1─* Project (goalId) ; Goal 1─* Task (goalId)
Project 1─* Phase ; Project 1─* Task ; Project 1─* Entry (notas) ; Project 1─* CalEvent
Phase 1─* Task (phaseId)
Entry ─▶ Project/Task/Goal (convertedTo) ; Project/Task/Goal ─▶ Entry (fromEntryId)
Reminder ─▶ cualquier elemento (refType/refId)
Attachment ─▶ Project/Entry (ownerType/ownerId)
```

**Borrado en cascada (lógico)** — `repo.remove`:
- **Proyecto:** borra sus tareas, fases y adjuntos. Desvincula sus notas y eventos (`projectId = null`).
- **Objetivo:** desvincula sus proyectos y tareas.
- **Fase:** sus tareas quedan sin fase.
- **Área:** los elementos quedan sin área.
- Tareas, entradas, proyectos, objetivos y eventos borran sus recordatorios.
- **Restaurar un proyecto** recupera lo que se borró en el mismo instante (mismo `deletedAt`).

**Seeds (primera vez):** áreas y nota de bienvenida con ids fijos y `updatedAt = 1`. Así cualquier edición del usuario gana siempre al sincronizar y no se duplican entre dispositivos. El perfil `me` se crea igual con `updatedAt = 1`.

---

## A.6 Estructura de la aplicación (rutas reales)

```
NOTIPENG
├── /                    Mesa (dashboard)
├── CAPTURAR
│   ├── /bandeja         Bandeja (lista o «una a una»)
│   └── /diario          Diario cronológico (?hoy=1 crea la entrada de hoy)
├── ORGANIZAR
│   ├── /ideas           Ideas (filtros por estado)
│   ├── /notas           Notas (filtros todas / favoritas / área)
│   ├── /etiquetas       Áreas de vida + nube de etiquetas
│   │   ├── /etiqueta/:tag   todo lo que lleva esa etiqueta
│   │   └── /area/:id        todo lo de un área
│   └── /e/:id           Editor de entrada (nota, diario, idea o bandeja)
├── EJECUTAR
│   ├── /proyectos       Proyectos agrupados por estado
│   │   └── /proyectos/:id   Proyecto: objetivo · siguiente paso · plan · roadmap · notas · fechas · archivos · enlaces
│   ├── /tareas          Tareas: Hoy · Próximas · Sin fecha · Hechas (?t=id abre la tarea)
│   ├── /objetivos       Objetivos
│   │   └── /objetivos/:id
│   └── /calendario      Mes · Semana · Agenda (?v=&d=)
├── REVISAR
│   └── /recientes       Abierto recientemente / Modificado recientemente
├── /perfil              Perfil
├── /ajustes             Ajustes
├── /capturar            Destino de «Compartir» (crea en Bandeja y redirige)
└── *                    No encontrada

CAPAS GLOBALES (sobre cualquier pantalla)
├── Captura rápida (hoja inferior en móvil, modal en escritorio)
├── Paleta de comandos / búsqueda (Ctrl/⌘+K, /)
├── Detalle de tarea (hoja)
├── «Más» (solo móvil)
├── Avisos (toasts con Deshacer)
└── Alarma a pantalla completa
```

**Escritorio (≥ 900 px):**
- Barra lateral fija con logo y punto de sincronización.
- Botones «Capturar» (acento) y «Buscar».
- Navegación con iconos agrupada por la filosofía (Capturar / Organizar / Ejecutar / Revisar), contadores de Bandeja y Tareas, y sección Favoritos.
- Al pie, la ficha de perfil y el botón de Ajustes.

**Móvil:**
- Cabecera con logo o título de sección, punto de sincronización y lupa.
- Barra inferior con Mesa, Proyectos, **＋** (capturar, botón central elevado), Tareas y Más (con contador de la Bandeja).
- «Más» abre una cuadrícula con Bandeja, Diario, Ideas, Notas, Objetivos, Calendario, Etiquetas, Recientes, Perfil y Ajustes.
- Las capas se abren como hojas desde abajo.
- Se respetan `safe-area-inset`.

---

## A.7 Inventario de funcionalidades

Formato por funcionalidad: **Propósito · Acceso · Funcionamiento · Lee/Modifica · Después · Relacionadas · Estados y casos · Móvil/Escritorio**.

### 1. Mesa (dashboard) — [HECHO]
- **Propósito:** ver de un vistazo qué importa hoy y cuál es el siguiente paso.
- **Acceso:** `/`, logo, «Mesa».
- **Funcionamiento:**
  - **Cabecera:** fecha larga («Lunes, 5 de octubre»), semana ISO, saludo según la hora («Buenos días / Buenas tardes / Buenas noches») más el nombre del perfil, y una frase contextual. Debajo, chips con «N para hoy», «N en la bandeja» y «N proyectos activos» (enlaces), y la mascota con un objeto según la hora: taza por la mañana, nota por la tarde, estrella por la noche.
  - **Captura rápida en línea:** Enter guarda en la Bandeja, Shift+Enter hace salto de línea, «Más opciones» abre la captura completa con el texto escrito, y las `#etiquetas` se extraen.
  - **Panel «Hoy»:** eventos de hoy, recordatorios de hoy y disparados sin atender (botón *Hecho*), y tareas vencidas más las de hoy (ordenadas por hora).
  - **Panel «Siguiente paso»:** hasta 5 proyectos en progreso o planificación (primero los en progreso, luego los recién modificados), con estado, barra de progreso, % y el siguiente paso con su casilla. Sin siguiente paso muestra «+ Define el siguiente paso concreto».
  - **Panel «Lo que importa»:** las intenciones del perfil numeradas, o una invitación a definirlas.
  - **Panel «Recién capturado»:** las 6 últimas entradas (sin las archivadas de la bandeja).
  - **Panel «Próximamente»:** los próximos 14 días (tareas, eventos, recordatorios sueltos, fechas meta de proyectos y objetivos), agrupados por día y con un máximo de 7 días.
- **Frase contextual, por prioridad:**
  1. Más de 2 vencidas: «Hay N cosas que se pasaron de fecha. Sin culpa: decide si siguen importando.»
  2. Bandeja con más de 6: «Tienes N cosas en la bandeja. ¿Las ordenamos un poco?»
  3. 1 para hoy: «Hoy hay una cosa importante. Empieza por ahí.»
  4. Más de 1 para hoy: «Hoy tienes N cosas. Una a la vez.»
  5. Algún proyecto con siguiente paso: «¿Cuál es el siguiente paso?»
  6. Algo completado hoy: «Buen avance hoy. Lo demás puede esperar.»
  7. En otro caso: «¿Qué tienes en la cabeza?»
- **Estados:** paneles vacíos con texto propio («Nada con fecha para hoy.», «Hoy completaste N. Bien.»).
- **Móvil:** una columna; la mascota se oculta. **Escritorio:** dos columnas (1,35fr / 1fr).

### 2. Captura rápida — [HECHO]
- **Acceso:** botón «Capturar», tecla `N` (fuera de campos de texto), botón ＋ en móvil, atajo del icono de la app, «Más opciones» desde la Mesa, comando de la paleta.
- **Funcionamiento:**
  - Texto libre y selector «Guardar como»: Bandeja (por defecto), Tarea, Idea, Nota, Diario o Recordatorio.
  - Mientras se escribe aparecen chips con lo detectado (fecha relativa, hora, prioridad, etiquetas).
  - Si el texto empieza por «recuérdame / recordarme / recordar / avísame», se elige *Recordatorio* automáticamente, salvo que el usuario haya elegido otro tipo.
  - **Recordatorio:** campo fecha-hora (precargado con lo detectado o con «ahora + 1 h») y selector Recordatorio/Alarma.
  - **Tarea con fecha y hora:** casilla «Avisarme …», activa por defecto, que crea el recordatorio vinculado.
  - Ctrl/⌘+Enter guarda; Esc cierra.
- **Modifica:**
  - Crea una Entry (body sin `#etiquetas` ni `!prioridad`, tags y priority).
  - O una Task (title = texto limpio, due, time, priority, tags).
  - O un Reminder.
- **Después:** aviso «Guardado en X» con botón «Ver», y se pide permiso de notificaciones si hace falta.
- **Móvil:** hoja inferior con el teclado activo. **Escritorio:** modal centrado.

### 3. Lenguaje natural (parser) — [HECHO]
- Detecta:
  - **`#etiqueta`:** en minúsculas, admite letras con acento, números, `_` y `-`.
  - **Prioridad:** `!alta`, `!media`, `!baja`, o `!!!`, `!!`, `!`.
  - **Prefijos de recordatorio.**
  - **Horas:** «a las 10», «10:30», «10am / 6 pm», «a las 6 de la tarde / de la noche / de la mañana», «10h». Un número suelto sin marcador no se toma como hora.
  - **Fechas:** «hoy», «esta tarde / esta noche», «mañana», «pasado mañana», «(el / este / el próximo) lunes…domingo (que viene)», «en N días / semanas», «15 de noviembre (de 2026)», «15/11(/26)».
- Una fecha del pasado sin año pasa al año siguiente.
- Hora sin fecha: hoy, o mañana si la hora ya pasó.
- Fecha sin hora para un recordatorio: 09:00.
- Devuelve `{text, date, time, tags, priority, reminder}`.

### 4. Bandeja — [HECHO]
- **Propósito:** todo lo no procesado.
- **Funcionamiento:**
  - Lista (las más nuevas primero) con texto editable en línea (guardado automático).
  - Acciones: convertir en **Tarea, Idea, Nota, Diario, Proyecto, Objetivo**, **Archivar** (Deshacer) y **Eliminar** (a la Papelera, Deshacer).
  - Modo **«Una a una»:** muestra solo la más antigua, en grande, con el contador de pendientes.
- **Reglas de conversión:**
  - Idea, Nota y Diario cambian el `kind` del mismo registro (Diario pone la fecha de hoy; Idea pone estado «nueva»).
  - Tarea, Proyecto y Objetivo crean una entidad nueva: título = primera línea no vacía (o el título), el resto pasa a notas/descripción; heredan etiquetas, área y prioridad.
  - La entrada original queda archivada con `convertedTo`. Si era una idea convertida en proyecto: `ideaStatus = 'convertida'` y `projectId`.
  - Convertir en proyecto navega al proyecto («¿Cuál es el primer paso?»).
- **Vacío:** «Bandeja vacía. Cabeza despejada.» con la mascota.

### 5. Diario — [HECHO]
- Entradas agrupadas por fecha (más recientes arriba): día grande, mes y año, día de la semana.
- La cabecera muestra una pregunta que rota según el día del mes.
- «Escribir hoy» crea una entrada con la fecha de hoy y abre el editor; `?hoy=1` lo hace automáticamente.
- Cada entrada muestra título (opcional), cuerpo recortado y etiquetas.

### 6. Notas — [HECHO]
- Tarjetas en cuadrícula (favoritas primero, luego las modificadas más recientemente).
- Filtros: Todas, ★ Favoritas y las áreas que tienen notas.
- «Nueva nota» la crea con el área del filtro activo.

### 7. Ideas — [HECHO]
- Campo para añadir rápido (admite `#etiqueta` y `!alta`).
- Filtros por estado con contador: «Vivas» (todas menos convertidas y descartadas, por defecto), cada uno de los 6 estados y «Todas».
- **Orden:** favoritas, luego prioridad (alta, media, baja, ninguna), luego las modificadas más recientemente.
- Cada fila muestra el selector de estado en línea, la prioridad, la categoría, las etiquetas y «→ ver proyecto» si se convirtió.
- **→ Proyecto:** botón visible en escritorio para convertir en proyecto.

### 8. Editor de entrada — [HECHO]
- Título grande; Enter salta al cuerpo. Cuerpo de escritura libre (texto plano). Guardado automático con indicador «guardando… / guardado».
- **Barra de propiedades:**
  - Tipo, fecha (diario), estado y categoría (idea), prioridad (excepto diario).
  - Área, proyecto, objetivo (si existen objetivos), favorita y etiquetas.
- **Secciones:**
  - **Archivos:** soltar o elegir, miniaturas de imágenes, abrir o descargar, quitar.
  - **Convertir y actuar:** → Tarea, → Proyecto, → Objetivo.
  - **«Extraer tareas de la lista»:** aparece solo si hay líneas que empiezan por `-`, `*`, `•` o `[ ]`. Crea una tarea por línea y marca la línea como `→ texto`.
  - **Eliminar** (con Deshacer).
- Muestra «Convertida en proyecto / objetivo / tarea →» cuando aplica.
- Registra `openedAt` para «Recientes».

### 9. Proyectos (lista) — [HECHO]
- Grupos por estado: En progreso, Planificación, Idea y Pausado. Completado y Archivado están ocultos tras «Ver cerrados (N)».
- Filtro por área.
- **Tarjeta:** área, prioridad, favorito, título, objetivo, barra y %, estado, fecha meta relativa (en rojo si venció) y siguiente paso.
- «Nuevo proyecto» lo crea en «planificación» y abre la vista con el título seleccionado.

### 10. Vista de proyecto — [HECHO]
- **Cabecera:**
  - Volver, favorito y eliminar (Deshacer restaura también lo borrado en cascada).
  - Origen («nació de: …» si vino de una entrada).
  - Título y descripción editables.
  - Progreso grande: «40 %» con barra y «2 de 5 acciones».
- **Propiedades:** estado, prioridad, inicio, meta (con «N d» restantes o «N d tarde»), área, objetivo y etiquetas.
- **Navegación interna fija:** Plan de acción · Roadmap · Notas · Fechas · Archivos · Enlaces.
- **Objetivo del proyecto:** recuadro destacado y editable («¿Qué significa terminar este proyecto? Una frase.»).
- **Siguiente paso:** tarjeta destacada con casilla y «empezar ahora» (pasa la tarea a «en progreso»).
  - Sin tareas: «¿Cuál es la primera acción concreta?».
  - Todo hecho: «Todo hecho. ¿Cerramos el proyecto?» con «Marcar completado».
- **Plan de acción:**
  - Tareas abiertas numeradas, con el siguiente paso resaltado y ▲/▼ para reordenar.
  - Campo para añadir que entiende lenguaje natural.
  - «Hechas (N)» plegable.
- **Roadmap:**
  - Columnas horizontales de fases, cada una con un nodo de estado (vacío / iniciado / hecho) y una línea de progreso.
  - Título editable; mover a la izquierda o derecha; eliminar (sus tareas siguen en el plan, sin fase).
  - Tareas de la fase con casilla y un campo para añadir dentro de la fase.
  - «+ Añadir fase».
  - Sin fases: «Usar 4 fases sugeridas» (Investigación, Preparación, Lanzamiento, Optimización) o «+ Primera fase».
  - Aviso de cuántas acciones abiertas no tienen fase.
- **Notas del proyecto:** tarjetas; «+ nota» crea una nota vinculada que hereda área y etiquetas.
- **Fechas:** inicio, tareas con fecha, eventos del proyecto (con quitar), fecha meta y un formulario «+ Evento» (título, fecha, hora).
- **Archivos.**
- **Enlaces:** URL más título opcional; añade `https://` si falta; quitar.

### 11. Tareas — [HECHO]
- **Vistas:**
  - **Hoy:** «Se pasaron de fecha», «Hoy · fecha» y «En progreso» (sin fecha o futuras).
  - **Próximas:** agrupadas por día.
  - **Sin fecha:** agrupadas por proyecto, primero las «Sueltas», con reordenación.
  - **Hechas:** las últimas 80, agrupadas por día de finalización.
- **Campo para añadir:** en la vista Hoy, sin fecha detectada, la tarea es para hoy. Con fecha y hora crea un recordatorio automáticamente.
- **Fila:**
  - La casilla alterna hecha/pendiente, con el aviso «Hecho. Una cosa menos.» y *Deshacer*, y un sonido opcional.
  - El título abre el detalle.
  - Metadatos: «● en progreso», fecha relativa con «vencida», hora, 🔔 si tiene recordatorio, ▲ proyecto, etiquetas, ¶ si tiene notas.
  - Prioridad en marcas `!!!/!!/!`.
- **Detalle de tarea (hoja):**
  - Título, estado (Pendiente / En progreso / Completada), prioridad (pulsar de nuevo la quita), fecha, hora y proyecto.
  - Fase (si el proyecto tiene fases); si no, objetivo.
  - Notas y etiquetas.
  - **Recordatorios:** lista con quitar; añadir con fecha-hora y tipo Aviso/Alarma.
  - Eliminar (Deshacer).
- Completar una tarea marca como hechos sus recordatorios.

### 12. Objetivos — [HECHO]
- **Lista:**
  - Orden por estado (activo, pausado, logrado, archivado) y fecha.
  - **Tarjeta:** estado, título, fecha, cuenta atrás tranquila («faltan N días», «faltan ~N meses», «es hoy», «fecha pasada hace N días»), nº de proyectos, acciones hechas/totales y anillo de progreso.
- **Vista:**
  - Título, descripción, anillo grande.
  - Estado, fecha objetivo, área, etiquetas, favorito y eliminar.
  - **Proyectos vinculados:** estado, barra, siguiente paso y «Desvincular». Selector «Vincular proyecto existente» y «+ Nuevo proyecto» (ya vinculado).
  - **Acciones directas:** tareas con `goalId` fuera de proyectos.
- **Progreso** = tareas del objetivo + tareas de sus proyectos.

### 13. Calendario — [HECHO]
- **Mes:**
  - Cuadrícula de 6 semanas, empieza en lunes; hoy resaltado.
  - Hasta 3 chips por día y «+N más». En móvil, puntos de color.
  - Al elegir un día aparece su panel: lista de elementos (tareas con casilla, eventos con «Quitar») y formulario «Añadir a este día» (+ Evento / + Tarea, con hora opcional).
- **Semana:** 7 columnas (1 en móvil); «+ añadir» lleva al día en vista mes.
- **Agenda:** próximos 60 días, solo los días con elementos.
- **Elementos:** eventos, tareas con fecha, recordatorios sueltos no hechos, metas de proyectos y fechas de objetivos (no archivados).
- **Navegación:** ‹ Hoy ›. El estado va en la URL.

### 14. Etiquetas y áreas — [HECHO]
- Tarjetas de áreas con el número de elementos y enlace a «editar» en Ajustes.
- Nube de etiquetas con tamaño según el uso.
- Las vistas por etiqueta y por área agrupan Objetivos, Proyectos, Tareas abiertas y Notas/ideas/diario.

### 15. Búsqueda global y paleta de comandos — [HECHO]
- **Acceso:** Ctrl/⌘+K, `/`, «Buscar», lupa en móvil.
- **Vacía:** muestra acciones frecuentes y «Abierto recientemente» (6).
- **Con texto:** resultados (hasta 40) más los comandos que coinciden.
- **Búsqueda:**
  - En memoria sobre entradas (sin las archivadas de la bandeja), proyectos, tareas, objetivos y eventos.
  - Ignora tildes y mayúsculas; deben aparecer **todos** los términos.
  - **Puntuación:** título empieza por (6), título contiene (4), etiqueta (3), cuerpo (1), más un bonus de recencia de hasta 1 (30 días).
  - `#etiqueta` filtra; muestra un fragmento alrededor de la coincidencia.
- **Comandos:**
  - Capturar, Nueva tarea, Escribir en el diario, Nueva idea, Nueva nota, Nuevo proyecto, Nuevo objetivo, Recordatorio o alarma.
  - Ir a cada sección, Ajustes, Exportar mis datos y cambiar tema claro/oscuro.
- Flechas, Enter y Esc. Sin resultados: «Capturar «texto»».

### 16. Recordatorios y alarmas — [HECHO] (con la limitación web descrita en A.4)

### 17. Favoritos y recientes — [HECHO]
- Estrella en entradas, proyectos y objetivos.
- Los favoritos aparecen en la barra lateral (hasta 12).
- **Recientes:**
  - «Abierto recientemente» (por `openedAt`, que se actualiza sin tocar `updatedAt`).
  - «Modificado recientemente» (por `updatedAt`, incluye tareas).

### 18. Perfil — [HECHO]
- Avatar (9 iconos de línea: inicial, estrella, luna, sol, hoja, llama, rayo, barco, brújula, con 7 colores), nombre y lema.
- **«Lo que realmente importa»:** hasta 3 intenciones que aparecen en la Mesa.
- **«Lo que has construido»:** tareas terminadas, cosas capturadas y proyectos, desde la fecha de inicio. Sin rachas.
- Resumen de la cuenta de sincronización.
- Guardado automático. Se sincroniza.

### 19. Ajustes — [HECHO]
- **Tú:** enlace al perfil.
- **Apariencia:**
  - Tema claro / oscuro / automático.
  - Acento: 6 predefinidos más color libre.
  - Tipografía Hielo / Editorial / Laboratorio, con muestra.
  - Densidad cómoda / compacta.
  - Sonido sutil al completar.
- **Áreas de vida:** símbolo, nombre, subir/bajar, eliminar y añadir.
- **Sincronización:** el panel descrito en A.4.
- **Avisos:** estado del permiso, activar, probar notificación y sonido de alarma; explicación de recordatorio frente a alarma y del límite web.
- **Instalar:** botón propio o instrucciones por plataforma.
- **Tus datos:**
  - Dónde se guardan, espacio usado y si el almacenamiento es persistente.
  - Backup JSON (con adjuntos en base64), Markdown `.zip` (carpetas por tipo, frontmatter YAML; proyectos con roadmap y plan como checklists) y CSV de tareas (BOM UTF-8).
  - Importar/restaurar JSON, que fusiona sin duplicar y muestra cuántos registros nuevos, actualizados y sin cambios hay.
- **Papelera:** recuperar, eliminar definitivamente, vaciar (con confirmación).
- **Atajos.**

### 20. Compartir hacia la app (Android) — [HECHO, SIN VERIFICAR]
- `/capturar?title&text&url` une las partes sin repetir, crea una entrada en la Bandeja y redirige.

### 21. Avisos y deshacer — [HECHO]
- Toasts (máx. 3 a la vez, 4,2 s por defecto) con acción opcional.
- *Deshacer* en completar, archivar, eliminar tarea, entrada, proyecto, objetivo y fase.

### 22. Sonidos — [HECHO]
- «Tic» al completar (desactivado por defecto) y campana de alarma, sintetizados con WebAudio.

---

## A.8 Flujos de usuario principales

1. **Capturar una idea:** ＋ o `N` → escribir → (opcional) elegir tipo → Ctrl+Enter / Guardar → aviso «Guardado en Bandeja · Ver».
2. **Procesar la bandeja:** Bandeja → (opcional) «Una a una» → por cada elemento: Tarea / Idea / Nota / Diario / Proyecto / Objetivo / Archivar / Eliminar.
3. **Idea → proyecto:** Ideas → «→ Proyecto» (o desde el editor o la Bandeja) → se abre el proyecto en «Planificación» → escribir el objetivo → añadir la primera acción → (opcional) «Usar 4 fases sugeridas» → asignar tareas a fases.
4. **Avanzar un proyecto:** Mesa → «Siguiente paso» → marcar la casilla → aparece el siguiente automáticamente → el progreso se recalcula.
5. **Crear una tarea con aviso:** captura «Llamar a Ana mañana a las 10 !alta» → tipo Tarea → «Avisarme» activo → guardar → la tarea queda con fecha y hora y un recordatorio vinculado.
6. **Crear un recordatorio o una alarma:** captura «Recuérdame pagar el internet el viernes a las 9» → se elige *Recordatorio* solo → (opcional) cambiar a Alarma → guardar → se pide permiso de notificaciones.
7. **Escribir en el diario:** Diario → «Escribir hoy» (o atajo del icono) → escribir → se guarda solo.
8. **Nota → tareas:** escribir una lista con `- ` → «Extraer tareas de la lista» → N tareas creadas.
9. **Completar un proyecto:** al terminar todas las tareas, el siguiente paso dice «Todo hecho. ¿Cerramos el proyecto?» → «Marcar completado» → pasa a «Completado» (oculto en la lista hasta «Ver cerrados»).
10. **Definir el rumbo:** Perfil → escribir hasta 3 intenciones → aparecen en la Mesa.
11. **Buscar:** Ctrl+K → escribir o `#etiqueta` → flechas → Enter (una tarea abre su detalle).
12. **Sincronizar dispositivos:** Ajustes → Sincronización → «Crear mi cuenta» en el primero, «Entrar» en el segundo → lo local se sube y se une → los cambios viajan en segundos.
13. **Backup:** Ajustes → Backup completo (JSON); en otro dispositivo, Importar → fusión sin duplicados.
14. **Recuperar algo borrado:** *Deshacer* en el aviso, o Ajustes → Papelera → Recuperar.

---

## A.9 Reglas de negocio y algoritmos

- **Siguiente paso** = la primera tarea en estado «progreso» por `order`; si no hay, la primera «pendiente» por `order`.
- **Progreso:** proyecto = hechas / total de sus tareas; fase = lo mismo dentro de la fase; objetivo = tareas con `goalId` más las de sus proyectos. Sin tareas no hay porcentaje («sin acciones»).
- **Completar una tarea:** `completedAt = ahora`; sus recordatorios pasan a `done`. Desmarcarla quita `completedAt`.
- **Reordenar:** intercambia el `order` con la vecina.
- **Ideas:** convertir en proyecto pone el estado «convertida en proyecto».
- **Fusión (backup y nube):** gana el `updatedAt` mayor por registro. Es idempotente.
- **Seeds deterministas** y **deduplicación de áreas** por nombre (se queda la de id fijo o la más antigua y reasigna las referencias).
- **Fechas** siempre locales (nunca UTC) para que «hoy» sea el del usuario.
- **Guardado automático:** con 500–600 ms de espera; solo escribe si el contenido cambió (comparación JSON), así no altera `updatedAt` al abrir.
- **Campos de «añadir»:** vacían el campo **antes** de la escritura asíncrona (corrección de un error real; ver A.12).

---

## A.10 UI/UX y sistema de diseño actual (Ártico)

> Se documenta para referencia. **El prompt de la Parte B pide expresamente NO copiar esta identidad.**

- **Sensación:**
  - Herramienta de trabajo limpia (referencias del usuario: Notion, Obsidian).
  - Superficies planas con bordes de 1 px y radios moderados.
  - Barra lateral con iconos y jerarquía clara.
  - La personalidad está en los detalles: aurora tenue en la cabecera de la Mesa, mascota pingüino «Peng» (logo, Mesa, estados vacíos y perfil) y degradado azul→verde aurora en las barras de progreso.
- **Colores, día «Banquisa»:**
  - Fondo `#F2F6FA`, barra lateral `#E9EFF6`, tarjetas `#FFFFFF`.
  - Tinta `#0B1B2E` / `#2A3E56` / `#52657D` / `#7889A0`, líneas `#DDE6F0` / `#C6D4E3`.
  - Acento glaciar `#1A66CF`, aurora `#087568`.
- **Colores, noche «Noche polar»:**
  - Fondo `#0A1322`, barra lateral `#070E1A`, tarjetas `#101C30`.
  - Tinta `#E7EFF8`…`#5F7391`.
  - Acento `#62B0FF`, aurora `#3DD9BE`.
- **Acentos y contraste:**
  - Acentos alternativos: Glaciar, Aurora, Violeta, Atardecer, Musgo, Grafito, más un color libre.
  - Todos verificados con WCAG (texto ≥ 4,5:1).
- **Tipografía:**
  - Onest para interfaz y títulos (peso 650); JetBrains Mono solo para datos (horas, números de plan, prioridad).
  - Alternativas: Editorial (Fraunces + Newsreader para escribir) y Laboratorio (JetBrains Mono + IBM Plex Sans).
  - Texto base 15 px; escritura 17 px.
- **Forma:**
  - Radios de 8 px (controles), 14 px (tarjetas) y 20 px (cabecera).
  - Sombras suaves de 1–2 capas; capas modales con desenfoque del fondo.
- **Movimiento:**
  - Entrada de página de 200 ms, hojas que suben, «pop» al completar y aurora lenta (14 s).
  - Respeta `prefers-reduced-motion`.
- **Estados:**
  - **Hover:** fondo tenue.
  - **Activo:** fondo del acento al 11 % y texto en acento.
  - **Foco:** contorno de 2 px en el acento.
  - **Deshabilitado:** opacidad 0,5.
  - **Vacío:** mascota y frase de invitación.
  - **Errores:** texto en el color de peligro.
  - **Carga:** sin esqueletos; las pantallas aparecen al resolver las consultas, que son instantáneas en local.
- **Accesibilidad:**
  - Contraste verificado numéricamente.
  - Navegación por teclado y atajos; trampa de foco en los modales.
  - `aria-label` en los botones de icono; roles en casillas, pestañas y radios.
  - Áreas táctiles ≥ 44 px en móvil.

---

## A.11 Seguridad, privacidad y rendimiento

- **Datos:** local-first; nada sale del dispositivo sin sesión de sincronización.
- **Supabase:**
  - RLS por `user_id = auth.uid()` en la tabla y en Storage. Sin sesión, la tabla devuelve vacío (verificado).
  - Clave pública en el build; nunca la `service_role`.
- **Navegador:**
  - Fuentes autoalojadas: sin peticiones a Google Fonts.
  - `rel="noopener noreferrer"` en los enlaces externos.
- **Rendimiento:**
  - JS principal ≈ 181 KB gzip, con el cliente de Supabase en un trozo aparte cargado bajo demanda.
  - CSS ≈ 15 KB gzip.
  - Búsqueda en memoria (suficiente para miles de registros).
  - Precarga offline ≈ 2 MB (sobre todo fuentes).

---

## A.12 Problemas resueltos (lecciones)

1. **Escritura rápida en campos de «añadir»:** el campo se vaciaba después de la escritura asíncrona y los textos se concatenaban. Solución: vaciarlo antes del `await`.
2. **StrictMode y guardado automático:** los efectos dobles provocaban guardados vacíos. Solución: comparar con el último valor guardado.
3. **Duplicados al sincronizar:** las áreas por defecto se duplicaban con ids aleatorios distintos en cada dispositivo. Solución: ids fijos, `updatedAt = 1` y deduplicación por nombre.
4. **Eco de sincronización:** los cambios recibidos se volvían a subir (y los archivos se re-subían). Solución: mapa `seen` y bandera `applyingRemote`.
5. **Backups importados que nunca llegaban a la nube:** tenían un `updatedAt` antiguo. Solución: forzar una subida completa tras importar.
6. **Cloudflare:**
   - `_redirects` con `/* /index.html 200` es inválido en Workers (bucle). Solución: `not_found_handling: single-page-application`.
   - El autoconfigurador de Wrangler modificó el proyecto sin pedirlo (plugin, scripts, dependencias). Se revirtió; se despliega con una configuración aparte.
   - La caché del borde devolvió 404 antiguos. Se verificó con parámetros anti-caché.
7. **Contraste de acentos:** los colores vivos fallaban como texto pequeño. Se separaron «relleno» y «texto» y se ajustaron los tonos midiendo.
8. **Diseño:** tres direcciones descartadas antes de la final (ver A.2). El usuario quiere una app profesional y no artesanal, con una identidad marcada pero sobria.

---

## A.13 Limitaciones conocidas

- Sin pruebas automatizadas.
- `docs/ARQUITECTURA.md` describe la dirección visual y el nombre antiguos.
- La configuración de despliegue está fuera del repositorio.
- No hay vista de «sin conexión» explícita; la app simplemente funciona en local.
- Las notas no renderizan Markdown.
- Sin edición de eventos; sin UI de repetición de recordatorios.
- Recordatorios solo con la app abierta o en segundo plano reciente.
- La sincronización no se probó de extremo a extremo.
- Las preferencias visuales no se sincronizan (es intencionado: son por dispositivo).

---

## A.14 Recomendaciones y mejoras futuras (no implementadas)

1. Probar la sincronización con la cuenta real y añadir pruebas automatizadas (repo, parser, fusión).
2. Guardar `wrangler.jsonc` y un script `deploy` en el repositorio.
3. Voz: dictado del navegador (rápido, el audio pasa por Google en Chrome) o Whisper local (privado, más lento).
4. Capacitor para notificaciones locales exactas, alarmas reales y widgets; o Web Push con Supabase Edge Functions.
5. Revisión semanal guiada, sin puntuaciones.
6. Markdown en notas, edición de eventos y UI de repetición.
7. IA opcional: organizar una idea en objetivo, proyecto, fases y tareas; resumir; extraer tareas; generar roadmap.
8. Búsqueda semántica, exportar a ICS y sincronizar con calendarios.
9. Mesa personalizable y cifrado de extremo a extremo de la réplica en la nube.
