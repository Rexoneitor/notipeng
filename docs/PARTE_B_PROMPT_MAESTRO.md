# PROMPT MAESTRO — [NOMBRE_DE_LA_APLICACIÓN]

Quiero que construyas una aplicación personal de productividad llamada **[NOMBRE_DE_LA_APLICACIÓN]**. Esta especificación contiene todo lo necesario: qué es, qué debe hacer cada parte, cómo se conectan los datos, qué arquitectura usar, cómo sincronizar entre dispositivos y cómo comprobar que quedó bien. Está basada en una aplicación de referencia que ya existe y funciona. Reproduce su **funcionalidad, lógica y arquitectura conceptual**, pero **no su aspecto**.

---

## 0. ANTES DE EMPEZAR (obligatorio)

1. **Antes de comenzar a implementar, solicita el nombre de la aplicación y cualquier preferencia visual importante. Si el usuario no tiene preferencias, propón una dirección visual original.** Pregunta como mínimo:
   - el nombre (sustituye `[NOMBRE_DE_LA_APLICACIÓN]` en todo: título, navegación, manifiesto, metadatos, textos, bienvenida, documentación);
   - idioma de la interfaz (la referencia está en español; usa el idioma del usuario);
   - preferencias visuales: colores, ambiente, referencias de apps que le gusten, claro/oscuro;
   - si quiere sincronización entre dispositivos desde el principio (recomendado) y si ya tiene cuenta en Supabase y en un hosting gratuito;
   - si quiere cambiar las áreas de vida por defecto.
   Haz las preguntas de una vez, breves, y continúa con valores razonables en lo que no responda.
2. **No copies la identidad visual de la aplicación de referencia. Utiliza la arquitectura funcional y conceptual como punto de partida, pero diseña una identidad visual completamente nueva y original para este usuario.** Nada de su paleta, tipografías, mascota, logo ni composición debe repetirse (ver §9).
3. **No te limites a describir: CONSTRÚYELA.** Analiza, decide, implementa por fases, crea y modifica los archivos, ejecuta el build y comprueba que funciona en un navegador real antes de dar cada fase por terminada.

---

## 1. ROL

Actúa como un desarrollador full‑stack sénior y diseñador de producto. Tomas decisiones justificadas, escribes código mantenible y tipado, verificas lo que haces (compilación, build, prueba en navegador, contraste de colores) y reportas con honestidad lo que funciona, lo que no probaste y lo que queda pendiente. No inventes que algo funciona sin haberlo comprobado.

---

## 2. OBJETIVO DEL PROYECTO

Una aplicación que el usuario abra todos los días para sacar cosas de la cabeza, ordenarlas, convertirlas en planes y ejecutarlas:

> «Tengo esto en la cabeza» → «esto es lo que quiero hacer» → «este es el plan» → «estos son los siguientes pasos» → «esto es lo que estoy haciendo hoy».

Debe funcionar en ordenador y teléfono (instalable como app), guardar los datos de verdad, funcionar sin conexión y sincronizar entre dispositivos.

---

## 3. DESCRIPCIÓN Y FILOSOFÍA

- Flujo: **CAPTURAR → ORGANIZAR → PLANIFICAR → EJECUTAR → REVISAR**.
- Principio rector: *«No quiero una aplicación que me ayude a organizar más cosas. Quiero una aplicación que me ayude a hacer las cosas que realmente importan.»* Evalúa cada función con: ¿ayuda a pensar, decidir, organizar o ejecutar? Si no, no la añadas.
- Es un espacio personal: mezcla de segundo cerebro, diario, espacio de ideas, gestor de proyectos y hoja de ruta. No es un clon de Notion.
- **Productividad sin agobio:** capturar nunca obliga a clasificar; cada proyecto muestra siempre su **siguiente paso concreto**; el progreso sale solo de acciones reales; **sin** rachas, puntuaciones, gamificación ni paneles de estadísticas; notificaciones solo cuando el usuario crea un recordatorio; textos tranquilos y contextuales usados con moderación (ejemplos de tono: «¿Qué tienes en la cabeza?», «Una cosa a la vez.», «¿Cuál es el siguiente paso?», «Sin culpa: decide si siguen importando.»).
- Uso individual: una sola persona, varios dispositivos.

---

## 4. FUNCIONALIDADES (todas obligatorias salvo que se indique)

Cada módulo describe propósito, acceso, comportamiento, datos y casos especiales. Los textos entre comillas son ejemplos de tono; adáptalos al idioma y a la marca.

### 4.1 Mesa (pantalla principal)
- Ruta `/`. Abre aquí la app.
- **Cabecera:** fecha larga local y número de semana ISO; saludo según la hora (mañana < 13 h, tarde < 20 h, noche) + nombre del perfil; **frase contextual** (reglas en §13.6); accesos rápidos con contadores: «N para hoy», «N en la bandeja», «N proyectos activos». Puede incluir un elemento gráfico de marca propio (no el de la referencia).
- **Captura en línea:** campo grande; Enter guarda en la Bandeja (extrayendo `#etiquetas`), Shift+Enter salto de línea, botón «Más opciones» abre la captura completa con el texto ya escrito.
- **Paneles:**
  1. **Hoy:** eventos de hoy; recordatorios de hoy y los ya disparados no atendidos (con botón «Hecho»); tareas vencidas + de hoy (ordenadas por hora). Vacío: «Nada con fecha para hoy» o «Hoy completaste N».
  2. **Siguiente paso:** hasta 5 proyectos en estado *en progreso* o *planificación* (primero en progreso, luego por última modificación): nombre, estado, barra de progreso y %, y su siguiente paso con casilla para completarlo ahí mismo; si no tiene, enlace «Define el siguiente paso concreto».
  3. **Lo que importa:** las intenciones del perfil (hasta 3) numeradas; si no hay, invitación a definirlas.
  4. **Recién capturado:** últimas 6 entradas (excluye las de bandeja ya archivadas) con tipo y antigüedad.
  5. **Próximamente:** próximos 14 días (tareas con fecha, eventos, recordatorios sueltos, fechas meta de proyectos no cerrados y de objetivos activos), agrupados por día, máximo 7 días.
- Escritorio: dos columnas. Móvil: una columna.

### 4.2 Captura rápida global
- Accesos: botón principal «Capturar» siempre visible (barra lateral en escritorio, botón central en móvil), tecla `N` fuera de campos de texto, atajo del icono de la app instalada (`/?capturar=1`), comando de la paleta.
- Hoja inferior en móvil (teclado ya activo) / modal en escritorio.
- Selector «Guardar como»: **Bandeja** (por defecto), **Tarea**, **Idea**, **Nota**, **Diario**, **Recordatorio**.
- Mientras se escribe se muestran chips con lo detectado por el parser (§13.1): fecha relativa, hora, prioridad, etiquetas.
- Si el texto empieza por «recuérdame / recordarme / recordar / avísame» → seleccionar Recordatorio automáticamente, salvo que el usuario haya elegido otro tipo a mano.
- Recordatorio: campo fecha‑hora (precargado con lo detectado o ahora+1 h) y selector **Recordatorio / Alarma**.
- Tarea con fecha **y** hora: casilla «Avisarme …» (activa por defecto) que crea un recordatorio vinculado.
- Guardar con Ctrl/⌘+Enter o botón; Esc cierra. Tras guardar: aviso «Guardado en X» con acción «Ver».
- Entradas: guardar el cuerpo sin `#etiquetas` ni `!prioridad`, etiquetas y prioridad en sus campos. Tarea: título = texto limpio.

### 4.3 Bandeja (Inbox)
- Lista de entradas `kind='inbox'` no archivadas, más recientes primero; texto editable en línea con guardado automático.
- Acciones por elemento: convertir en **Tarea, Idea, Nota, Diario, Proyecto, Objetivo**; **Archivar** (con Deshacer); **Eliminar** (a papelera, con Deshacer).
- Modo **«Una a una»**: muestra solo el elemento más antiguo en grande con el número restante.
- Reglas de conversión en §13.3. Convertir en proyecto navega al proyecto.
- Vacío: mensaje tranquilo («Bandeja vacía. Cabeza despejada.»).

### 4.4 Diario
- Entradas `kind='journal'` agrupadas por fecha (desc.), mostrando día, mes/año y día de la semana, título opcional, cuerpo recortado y etiquetas.
- «Escribir hoy» crea entrada con fecha de hoy y abre el editor; `/diario?hoy=1` lo hace automáticamente (atajo del icono).
- Cabecera con una pregunta de reflexión que rota cada día.

### 4.5 Notas
- Tarjetas en cuadrícula; favoritas primero, luego por modificación.
- Filtros: Todas, Favoritas, y por área (solo áreas que tengan notas).
- «Nueva nota» (hereda el área del filtro activo).

### 4.6 Ideas
- Campo de alta rápida (entiende `#etiqueta` y `!alta`).
- Estados: **nueva, explorando, interesante, en desarrollo, convertida en proyecto, descartada**. Filtros: «Vivas» (por defecto: todas menos convertida y descartada), cada estado con su contador, y Todas.
- Orden: favoritas → prioridad (alta, media, baja, ninguna) → modificación.
- Fila: título, extracto, categoría, etiquetas, prioridad, selector de estado en línea, botón «→ Proyecto» y enlace al proyecto si ya se convirtió.

### 4.7 Editor de entrada (`/e/:id`)
- Sirve para bandeja, nota, diario e idea. Título grande (Enter salta al cuerpo) + cuerpo de escritura libre (texto plano) con guardado automático e indicador «guardando… / guardado».
- Propiedades: tipo (cambia `kind`), fecha (diario), estado y categoría (idea), prioridad (no en diario), área, proyecto, objetivo, favorito, etiquetas.
- Secciones: **Archivos** (§4.18), **Convertir y actuar**: → Tarea, → Proyecto, → Objetivo, **Extraer tareas de la lista** (solo visible si hay líneas que empiezan por `-`, `*`, `•` o `[ ]`; crea una tarea por línea y marca la línea como `→ texto`), Eliminar (Deshacer).
- Muestra «Convertida en …» con enlace si aplica. Registra `openedAt`.

### 4.8 Proyectos (lista)
- Agrupados por estado: En progreso, Planificación, Idea, Pausado; Completado y Archivado ocultos tras «Ver cerrados (N)». Filtro por área.
- Tarjeta: área, prioridad, favorito, título, objetivo, barra y %, estado, fecha meta relativa (en color de peligro si venció y no está completado), siguiente paso.
- «Nuevo proyecto» → estado *planificación*, fecha de inicio hoy, abre la vista con el título seleccionado para escribir.

### 4.9 Vista de proyecto (`/proyectos/:id`) — pieza central
- Cabecera: volver, favorito, eliminar (Deshacer restaura también lo borrado en cascada), origen («nació de: …» si vino de una entrada), título y descripción editables, **progreso grande** («40 %», barra, «2 de 5 acciones»).
- Propiedades: estado, prioridad, inicio, fecha meta (con días restantes o de retraso), área, objetivo vinculado, etiquetas.
- Navegación interna fija (sticky): Plan de acción · Roadmap · Notas · Fechas · Archivos · Enlaces.
- **Objetivo del proyecto:** bloque destacado editable («¿Qué significa terminar este proyecto? Una frase.»).
- **Siguiente paso:** bloque más destacado de la página; casilla para completarlo; acción «empezar ahora» (pasa a *en progreso*). Sin tareas: «¿Cuál es la primera acción concreta?». Todo hecho: «Todo hecho. ¿Cerramos el proyecto?» + botón «Marcar completado».
- **Plan de acción:** tareas abiertas numeradas por `order`, siguiente paso resaltado, botones subir/bajar, campo para añadir con lenguaje natural, sección plegable «Hechas (N)».
- **Roadmap:** fases en columnas horizontales con desplazamiento; cada fase: indicador de estado (no empezada / iniciada / completada), línea de progreso, título editable, mover izquierda/derecha, eliminar (sus tareas permanecen en el plan sin fase), lista de sus tareas con casilla, campo para añadir dentro de la fase. Columna «+ Añadir fase». Sin fases: «Usar 4 fases sugeridas» (Investigación, Preparación, Lanzamiento, Optimización) o «Primera fase». Indicar cuántas acciones abiertas no tienen fase.
- **Notas:** tarjetas de entradas vinculadas; «+ nota» crea una nota con este proyecto, su área y sus etiquetas.
- **Fechas:** inicio, tareas con fecha, eventos del proyecto (quitar), fecha meta; formulario «+ Evento» (título, fecha, hora opcional).
- **Archivos** y **Enlaces** (URL + título opcional; añadir `https://` si falta; quitar; abrir en pestaña nueva con `noopener`).

### 4.10 Tareas (`/tareas`)
- Vistas: **Hoy** (vencidas · hoy · en progreso sin fecha o futuras), **Próximas** (agrupadas por día), **Sin fecha** (agrupadas por proyecto, «Sueltas» primero, reordenables), **Hechas** (últimas 80 por día de finalización). Contadores en las pestañas.
- Campo de alta con lenguaje natural; en la vista Hoy, sin fecha detectada → hoy. Con fecha+hora → crear recordatorio vinculado.
- **Fila de tarea:** casilla (alterna hecha/pendiente; aviso «Hecho. Una cosa menos.» con Deshacer; sonido opcional), título (abre detalle), metadatos (en progreso, fecha relativa y «vencida», hora, icono si tiene recordatorio, proyecto enlazado, etiquetas, indicador de notas), prioridad.
- **Detalle de tarea** (hoja/modal, también accesible con `/tareas?t=<id>`): título, estado (pendiente / en progreso / completada), prioridad (pulsar de nuevo la quita), fecha, hora, proyecto, fase (si el proyecto tiene fases) o si no objetivo, notas, etiquetas, **recordatorios** (lista con quitar; añadir fecha‑hora + tipo aviso/alarma), eliminar (Deshacer), «Listo».

### 4.11 Objetivos
- Lista ordenada por estado (activo, pausado, logrado, archivado) y fecha; tarjeta: estado, título, fecha, cuenta atrás tranquila («faltan N días», «faltan ~N meses», «es hoy», «fecha pasada hace N días»), nº de proyectos, acciones hechas/totales e indicador circular de progreso.
- Vista: título, descripción («¿Por qué importa?»), indicador grande, estado, fecha objetivo, área, etiquetas, favorito, eliminar; **proyectos vinculados** (estado, progreso, siguiente paso, desvincular), «Vincular proyecto existente», «+ Nuevo proyecto» ya vinculado; **acciones directas** (tareas con `goalId` sin proyecto) con campo de alta.

### 4.12 Calendario
- Vistas **Mes** (cuadrícula de 6 semanas, empieza en lunes, hoy resaltado, hasta 3 elementos por día + «+N más», puntos de color en móvil, panel del día seleccionado con su lista y formulario «+ Evento / + Tarea» con hora opcional), **Semana** (7 columnas; 1 en móvil) y **Agenda** (próximos 60 días con contenido).
- Elementos: eventos, tareas con fecha (tachadas si hechas), recordatorios no vinculados a tarea, fechas meta de proyectos y de objetivos no archivados. Colores distintos por tipo.
- Navegación anterior / Hoy / siguiente. Estado en la URL (`?v=mes|semana|agenda&d=YYYY-MM-DD`).

### 4.13 Etiquetas y áreas
- Página con tarjetas de áreas (símbolo, nombre, nº de elementos) y nube de etiquetas (tamaño según uso).
- `/etiqueta/:tag` y `/area/:id`: todo lo conectado agrupado en Objetivos, Proyectos, Tareas abiertas y Notas/ideas/diario.

### 4.14 Búsqueda global y paleta de comandos
- Abre con Ctrl/⌘+K, `/`, botón Buscar o icono en móvil.
- Vacía: acciones frecuentes + «Abierto recientemente» (6).
- Con texto: resultados de entradas, proyectos, tareas, objetivos y eventos (algoritmo en §13.5) + comandos que coincidan. Fragmento de texto alrededor de la coincidencia. `#etiqueta` filtra.
- Comandos: Capturar, Nueva tarea, Escribir en el diario, Nueva idea, Nueva nota, Nuevo proyecto, Nuevo objetivo, Recordatorio o alarma, Ir a cada sección, Ajustes, Exportar datos, Cambiar tema.
- Teclado: ↑↓, Enter, Esc. Sin resultados: ofrecer «Capturar "texto"». Una tarea abre su detalle.

### 4.15 Recordatorios y alarmas
- Recordatorio = aviso discreto. Alarma = capa a pantalla completa con sonido que persiste hasta atenderla (**Posponer 10 min**, **Abrir** el elemento vinculado, **Hecho**).
- Planificador en el cliente (cada ~10 s y al volver a la app): dispara los vencidos no hechos; recordatorio → aviso en la app con «Hecho» y notificación del sistema si la app está en segundo plano; alarma → sonido + notificación persistente + capa.
- Pedir permiso de notificaciones **solo** al crear el primer recordatorio o desde Ajustes. Al pulsar una notificación: enfocar/abrir la app en la URL del elemento.
- Los recordatorios disparados no atendidos aparecen en «Hoy» de la Mesa. Completar una tarea marca como hechos sus recordatorios.
- **Limitación honesta de la web:** con la app cerrada no hay disparo programado; mostrar los pendientes al abrir y explicarlo en Ajustes. (Ver extensiones: Capacitor / Web Push.)

### 4.16 Favoritos y recientes
- Estrella en entradas, proyectos y objetivos; los favoritos aparecen en la navegación lateral (máx. 12).
- Página Recientes: «Abierto recientemente» (por `openedAt`) y «Modificado recientemente» (por `updatedAt`, incluye tareas).

### 4.17 Perfil
- Avatar (icono a elegir entre varios + color, o inicial), nombre, lema.
- **«Lo que realmente importa»:** hasta 3 intenciones que se muestran en la Mesa.
- **«Lo que has construido»:** tareas terminadas, cosas capturadas, proyectos, desde la fecha de inicio. Sin rachas ni presión.
- Estado de la cuenta de sincronización. Guardado automático. Se sincroniza como un registro más.

### 4.18 Archivos adjuntos
- En entradas y proyectos: soltar archivos o elegirlos (máx. 25 MB; si supera, sugerir guardarlo como enlace), miniatura para imágenes, abrir en pestaña nueva (o descargar si se bloquea), quitar.
- Se guardan como Blob en IndexedDB; en la nube, en un almacén de objetos privado.

### 4.19 Ajustes
- **Tú** (enlace al perfil).
- **Apariencia** (por dispositivo): tema claro/oscuro/automático; color de acento (≈6 predefinidos + selector libre); 2–3 combinaciones tipográficas con muestra; densidad cómoda/compacta; sonido sutil al completar (desactivado por defecto).
- **Áreas de vida:** símbolo (carácter/emoji), nombre, subir/bajar, eliminar, añadir.
- **Sincronización:** sin configurar / formulario Entrar–Crear cuenta / conectado (correo, estado, última sincronización, «Sincronizar ahora», «Cerrar sesión»).
- **Avisos:** estado del permiso, activar, probar notificación, probar sonido de alarma, explicación recordatorio vs alarma y del límite web.
- **Instalar:** botón propio si el navegador lo permite; si no, instrucciones (iOS: Compartir → Añadir a inicio; Android/Chrome: menú → Instalar).
- **Tus datos:** dónde se guardan, espacio usado, si el almacenamiento es persistente; **Backup JSON** (todo, adjuntos en base64), **Markdown .zip** (carpetas por tipo, frontmatter YAML, proyectos con roadmap y plan como checklists), **CSV de tareas** (UTF‑8 con BOM); **Importar** JSON con fusión sin duplicados mostrando «N nuevos, N actualizados, N sin cambios».
- **Papelera:** listar, recuperar, eliminar definitivamente, vaciar (con confirmación).
- **Atajos de teclado.**

### 4.20 Compartir hacia la app (Android)
- `share_target` del manifiesto → ruta `/capturar?title&text&url`: unir las partes sin repetir, crear entrada en Bandeja, aviso y redirigir a la Bandeja.

### 4.21 Avisos y deshacer
- Toasts breves (≈4 s, máx. 3 a la vez) con acción opcional. Deshacer en: completar tarea, archivar, eliminar tarea/entrada/proyecto/objetivo/fase.

### 4.22 Primera ejecución
- Crear las áreas por defecto (personalizables): Negocios, Universidad, Personal, Finanzas, Salud, Proyectos, Aprendizaje, Ideas — cada una con un símbolo.
- Crear una entrada de bienvenida en la Bandeja que explique que todo lo capturado llega ahí y invite a archivarla.
- Crear el perfil vacío.
- Reglas de ids/sellos de estas semillas en §11.4.

---

## 5. ARQUITECTURA

### 5.1 Stack recomendado (el de la referencia; puedes sustituir una pieza solo justificándolo)
| Capa | Elección | Motivo |
|---|---|---|
| UI | React 19 + TypeScript estricto | Ecosistema maduro; reutilizable luego en Capacitor |
| Build | Vite | Rápido, build pequeño |
| Rutas | React Router (`createBrowserRouter`) | |
| Datos locales | IndexedDB vía **Dexie** + `useLiveQuery` | Base de datos real offline, guarda Blobs, UI reactiva sin estado duplicado |
| PWA | `vite-plugin-pwa` (Workbox `generateSW`, auto‑update) + generador de iconos | Instalable, offline, atajos y share target |
| Nube | **Supabase** (Postgres, Auth, Storage, Realtime) con `@supabase/supabase-js` cargado de forma diferida | Gratis, SQL estándar, seguridad por filas |
| ZIP | `fflate` | Export Markdown en el cliente |
| Fuentes | Autoalojadas (Fontsource u otra), no CDN | Privacidad y uso offline |
| Iconos | Conjunto SVG propio o librería ligera coherente con la nueva identidad | |
| Estado global | Sin librería: pequeños stores con `useSyncExternalStore` | Suficiente para capas abiertas, avisos, preferencias y estado de sync |

Descarta React Native/Expo (obliga a rehacer escritorio) salvo petición del usuario. Una sola base de código para web, escritorio (PWA instalada) y móvil.

### 5.2 Estructura de carpetas
```
src/
  db/        types.ts · db.ts (esquema Dexie versionado) · repo.ts (única puerta de escritura) · hooks.ts (lecturas reactivas)
  sync/      engine.ts (fusión LWW, cambios locales) · cloud.ts (adaptador Supabase, ciclo, disparadores, estado)
  lib/       dates · parse (lenguaje natural) · search · reminders · export · prefs · install · sound · ui (stores de UI)
  components/ Layout (navegación escritorio/móvil), CaptureSheet, CommandPalette, TaskSheet, TaskRow, Overlays,
             Attachments, SyncPanel, piezas de marca, primitivas (PageHeader, Section, Badge, Check, Progress, Empty, Modal…)
  pages/     Desk, Inbox, Journal, Notes, Ideas, EntryPage, Projects, ProjectView, Tasks, Goals, GoalView,
             Calendar, Tags(+TagView, AreaView), Recent, Profile, Settings, Share, NotFound
  styles/    tokens.css (todo el sistema de diseño como variables) · base.css · app.css
public/      icono SVG fuente + PNG generados + extensión del service worker (clic en notificación)
supabase/    schema.sql
```

### 5.3 Reglas de arquitectura (obligatorias)
1. **La UI nunca escribe en la base de datos directamente.** Todo pasa por `repo.ts`, que sella `updatedAt = Date.now()` en cada cambio y aplica cascadas.
2. Lectura siempre reactiva (`useLiveQuery`): cualquier escritura local o remota actualiza todas las pantallas.
3. **Borrado lógico** con `deletedAt` (papelera, deshacer y propagación de borrados). Solo la papelera borra físicamente.
4. **IDs UUID en el cliente** (`crypto.randomUUID()`).
5. Fechas de día como `YYYY-MM-DD` **locales** (nunca convertir a UTC para decidir «hoy»), horas `HH:mm`, instantes en epoch ms.
6. Conversiones y creación de entidades como funciones puras del repositorio (preparado para que una IA futura llame a las mismas funciones).
7. Preferencias visuales en `localStorage` (por dispositivo) y aplicadas antes del primer pintado con un script en línea en `index.html` (evita parpadeo de tema).

---

## 6. MODELO DE DATOS

Todas las entidades extienden `Base { id: string; createdAt: number; updatedAt: number; deletedAt?: number | null }`.

```ts
type Priority = 'alta' | 'media' | 'baja';
type EntryKind = 'inbox' | 'note' | 'journal' | 'idea';
type IdeaStatus = 'nueva' | 'explorando' | 'interesante' | 'desarrollo' | 'convertida' | 'descartada';
type ProjectStatus = 'idea' | 'planificacion' | 'progreso' | 'pausado' | 'completado' | 'archivado';
type TaskStatus = 'pendiente' | 'progreso' | 'hecha';
type GoalStatus = 'activo' | 'logrado' | 'pausado' | 'archivado';

interface Entry extends Base {           // bandeja, nota, diario e idea son la MISMA tabla
  kind: EntryKind; title: string; body: string; tags: string[];
  areaId?: string|null; projectId?: string|null; goalId?: string|null;
  date?: string|null;                    // YYYY-MM-DD (diario)
  ideaStatus?: IdeaStatus; priority?: Priority|null; category?: string;
  favorite?: boolean; archived?: boolean; openedAt?: number;
  convertedTo?: { type: 'project'|'task'|'goal'; id: string } | null;
}
interface Project extends Base {
  title: string; description: string; objective: string; status: ProjectStatus;
  startDate?: string|null; targetDate?: string|null; priority?: Priority|null;
  areaId?: string|null; goalId?: string|null; tags: string[]; favorite?: boolean;
  links: { id: string; url: string; title: string }[]; fromEntryId?: string|null; openedAt?: number;
}
interface Phase extends Base { projectId: string; title: string; note: string; order: number }
interface Task extends Base {
  title: string; notes: string; status: TaskStatus; priority?: Priority|null;
  due?: string|null; time?: string|null;   // YYYY-MM-DD, HH:mm
  projectId?: string|null; phaseId?: string|null; goalId?: string|null; areaId?: string|null;
  tags: string[]; order: number;            // inicial: Date.now()
  completedAt?: number|null; fromEntryId?: string|null;
}
interface Goal extends Base {
  title: string; description: string; targetDate?: string|null; status: GoalStatus;
  areaId?: string|null; tags: string[]; favorite?: boolean; openedAt?: number; fromEntryId?: string|null;
}
interface Area extends Base { name: string; symbol: string; order: number }
interface CalEvent extends Base { title: string; date: string; time?: string|null; endTime?: string|null; notes: string; projectId?: string|null }
interface Reminder extends Base {
  title: string; at: number; kind: 'recordatorio'|'alarma';
  refType?: 'task'|'project'|'entry'|'goal'|'event'|null; refId?: string|null;
  firedAt?: number|null; done: boolean; repeat?: 'none'|'daily'|'weekly';
}
interface Attachment extends Base { ownerType: 'project'|'entry'|'goal'|'task'; ownerId: string; name: string; mime: string; size: number; blob: Blob|null }
interface Profile extends Base {          // registro único id = 'me'
  name: string; motto: string; intentions: string[];   // ≤ 3
  avatar: { sticker: string; color: string };
}
```

Índices Dexie mínimos: `entries: id, kind, updatedAt, projectId, goalId, areaId, date, *tags` · `projects: id, status, updatedAt, goalId, areaId, *tags` · `phases: id, projectId, order` · `tasks: id, status, due, projectId, phaseId, goalId, updatedAt, *tags` · `goals: id, status, updatedAt, areaId` · `areas: id, order` · `events: id, date, projectId` · `reminders: id, at, refId` · `attachments: id, ownerId` · `profile: id`.

**Relaciones:** Área 1‑N entradas/proyectos/objetivos/tareas · Objetivo 1‑N proyectos y tareas · Proyecto 1‑N fases, tareas, notas (entradas), eventos, adjuntos, enlaces · Fase 1‑N tareas · Entrada ↔ Proyecto/Tarea/Objetivo (`convertedTo` / `fromEntryId`) · Recordatorio → cualquier elemento (`refType`, `refId`).

**Obligatorio / opcional:** obligatorios los campos sin `?`; `tags` y `links` siempre arrays (vacíos si no hay).

---

## 7. NAVEGACIÓN

```
[NOMBRE_DE_LA_APLICACIÓN]
├── Mesa                 /
├── Capturar:  Bandeja /bandeja · Diario /diario
├── Organizar: Ideas /ideas · Notas /notas · Etiquetas y áreas /etiquetas (/etiqueta/:tag, /area/:id) · Editor /e/:id
├── Ejecutar:  Proyectos /proyectos (/proyectos/:id) · Tareas /tareas · Objetivos /objetivos (/objetivos/:id) · Calendario /calendario
├── Revisar:   Recientes /recientes
├── Perfil /perfil · Ajustes /ajustes · Destino de compartir /capturar · 404
└── Capas globales: Captura · Paleta/Búsqueda · Detalle de tarea · Menú «Más» (móvil) · Avisos · Alarma
```
- **Escritorio (≥ 900 px):** barra lateral fija con marca e indicador de sincronización, botón Capturar destacado, botón Buscar con atajo, navegación agrupada por la filosofía con iconos y contadores (Bandeja, Tareas para hoy), sección Favoritos, y al pie acceso al Perfil y a Ajustes. Contenido centrado con ancho máximo.
- **Móvil:** cabecera compacta (marca o título de sección, indicador de sync, búsqueda); **barra inferior**: Mesa · Proyectos · **＋ Capturar** (central y destacado) · Tareas · Más (con contador de Bandeja). «Más» abre una hoja con el resto de secciones, Perfil y Ajustes. Capas como hojas inferiores. Respetar `safe-area-inset`. Áreas táctiles ≥ 44 px.
- **Atajos:** `N` capturar, Ctrl/⌘+K o `/` buscar, Ctrl/⌘+Enter guardar captura, Esc cerrar.

---

## 8. FLUJOS DE USUARIO (deben funcionar de principio a fin)

1. **Capturar:** ＋/N → escribir → (tipo opcional) → guardar → aviso con «Ver».
2. **Procesar bandeja:** Bandeja → (Una a una) → convertir/archivar/eliminar cada elemento.
3. **Idea → proyecto:** desde Ideas, editor o Bandeja → proyecto nuevo en planificación con la descripción heredada → escribir objetivo → primera acción → fases (sugeridas o propias) → asignar tareas a fases.
4. **Avanzar:** Mesa → Siguiente paso → marcar → aparece el siguiente → progreso actualizado en Mesa, lista y objetivo.
5. **Tarea con aviso:** «Llamar a Ana mañana a las 10 !alta» como Tarea → fecha, hora, prioridad y recordatorio vinculado.
6. **Recordatorio / alarma:** «Recuérdame pagar el internet el viernes a las 9» → tipo Recordatorio automático → (Alarma opcional) → permiso → aviso a la hora.
7. **Diario:** Escribir hoy → texto → guardado automático.
8. **Nota → tareas:** lista con guiones → «Extraer tareas de la lista».
9. **Completar proyecto:** todas hechas → «Marcar completado» → pasa a cerrados.
10. **Rumbo:** Perfil → 3 intenciones → visibles en la Mesa.
11. **Buscar:** Ctrl+K → texto o `#etiqueta` → Enter.
12. **Sincronizar:** Ajustes → crear cuenta en un dispositivo, entrar en el otro → los datos se unen y viajan en segundos.
13. **Backup y restauración:** exportar JSON → importar en otro lugar → fusión sin duplicados.
14. **Recuperar:** Deshacer en el aviso o Papelera → Recuperar.

---

## 9. UX/UI Y SISTEMA DE DISEÑO

### 9.1 Identidad: nueva y original (regla fundamental)
**No copies la identidad visual de la aplicación de referencia. Utiliza la arquitectura funcional y conceptual como punto de partida, pero diseña una identidad visual completamente nueva y original para este usuario.**
- Crea desde cero: nombre aplicado, logo/marca, paleta, tipografías, iconografía, composición, ilustraciones o elementos gráficos, animaciones y tono de los textos.
- La referencia usó un tema «ártico» (blancos hielo, azul glaciar, noche polar), una mascota pingüino, la tipografía Onest + una monoespaciada, y antes descartó un estilo «cuaderno de papel» y otro «hecho a mano». **No reutilices ninguna de esas direcciones** salvo que el usuario la pida explícitamente.
- Evita la estética genérica de IA: crema + serif + terracota; negro con un único acento ácido; degradado morado‑azul; Inter/Space Grotesk por defecto; etiquetas en mayúsculas monoespaciadas por todas partes; numeración decorativa «01 / 02»; emojis como iconos de sección; todo centrado; mismas tarjetas redondeadas en todo.
- Propón al usuario 1–3 direcciones visuales concretas (con nombre, paleta y tipografías) si no tiene preferencias, y desarrolla la elegida.

### 9.2 Lo que SÍ debe conservarse de la experiencia
- Sensación de **herramienta de trabajo profesional y pulida** (nivel Notion/Obsidian): jerarquía clara, superficies limpias, densidad cómoda, nada abrumador.
- Abrir la app debe sentirse como «vamos a ordenar un poco mi cabeza».
- Personalidad en los detalles, con moderación; nunca infantil.
- El **siguiente paso** de un proyecto es siempre el elemento visualmente más destacado de su vista.
- La captura es lo más accesible de toda la interfaz.

### 9.3 Requisitos del sistema de diseño (valores nuevos, estructura obligatoria)
- Todo el diseño en **variables CSS** (tokens): superficies (fondo, lateral, tarjeta, tarjeta‑2), 4 niveles de tinta, 2 de línea, hover, selección, sombras (sm, normal, lg), velo de modal, resaltado, semánticos (éxito, aviso, peligro), acento + color de texto sobre acento + acento suave + línea de acento, tipografías por rol (interfaz, títulos, escritura larga, datos), tamaños, radios, espaciados, duraciones y curvas.
- **Modo claro y oscuro diseñados ambos** (no invertidos) y modo automático.
- Separar **acento de relleno** y **acento para texto** si el color vivo no alcanza contraste como texto.
- Contraste **verificado numéricamente** (fórmula WCAG): texto principal ≥ 7:1, texto secundario ≥ 4,5:1, texto sobre botones de acento ≥ 4,5:1, elementos gráficos ≥ 3:1. Comprueba **todos** los acentos ofrecidos en ambos temas.
- Tipografía: una para interfaz/títulos con carácter, una para escritura larga (puede ser la misma) y una monoespaciada **solo** para datos (horas, números, prioridad). 2–3 combinaciones elegibles en Ajustes.
- Componentes a definir: botones (normal, primario, fantasma, peligro, pequeño, icono, pulsado), chips/filtros, insignias de estado con color semántico, marca de prioridad, barra de progreso, indicador circular, casilla de tarea (pendiente / en progreso / hecha con animación breve), campos, selectores, área de texto autoextensible, campo «añadir» en línea, tarjetas, filas de lista con hover, modales/hojas, paleta de comandos, avisos, estados vacíos con ilustración o elemento de marca propio, capa de alarma.
- **Estados de interacción:** hover, activo/seleccionado, foco visible (contorno 2 px), deshabilitado, vacío (invitación, no disculpa), error (texto claro de qué pasó y qué hacer), cargando (las consultas locales son instantáneas; evita parpadeos).
- **Movimiento:** transiciones de 120–250 ms, entrada de página suave, hojas que suben, pequeño «pop» al completar; respetar `prefers-reduced-motion`. Un único momento animado de marca como máximo en la Mesa.
- Sonidos: solo «completar» (opcional, apagado por defecto) y alarma; sintetizados (WebAudio), sin archivos.

### 9.4 Tono de los textos
Cercano, tranquilo, en segunda persona, sin signos de exclamación del sistema, sin culpa. Botones con verbo («Guardar», «Convertir en proyecto»). Mensajes vacíos que invitan.

---

## 10. RESPONSIVE

- Punto de corte principal 900 px (lateral ↔ barra inferior). Rejillas que pasan a una columna < 720–980 px según la pantalla.
- Sin desplazamiento horizontal del cuerpo; solo el roadmap y tablas internas pueden desplazarse dentro de su contenedor.
- Calendario mensual en móvil: celdas compactas con puntos de color; semana en una columna.
- Hojas inferiores con asa en móvil; modales centrados en escritorio.
- Cabeceras y barras con `backdrop-filter` y `env(safe-area-inset-*)`.

---

## 11. PERSISTENCIA Y SINCRONIZACIÓN

### 11.1 Local
IndexedDB (Dexie) con las tablas de §6; adjuntos como Blob; `navigator.storage.persist()` al arrancar; mostrar uso y persistencia en Ajustes.

### 11.2 Fusión (núcleo compartido por backup y nube)
`mergeSnapshot(snapshot)`: para cada registro entrante, si no existe localmente → insertar; si su `updatedAt` es mayor que el local → reemplazar; si no → ignorar. Idempotente. Mientras se aplica, activa una bandera `applyingRemote` para no tratar esos cambios como locales.

### 11.3 Nube: Supabase
**Esquema** (ejecutable varias veces):
```sql
create sequence if not exists public.records_rev_seq;
create table if not exists public.records (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tbl text not null, id text not null, data jsonb not null,
  updated_at bigint not null, deleted_at bigint,
  rev bigint not null default nextval('public.records_rev_seq'),
  primary key (user_id, tbl, id)
);
create index if not exists records_user_rev on public.records (user_id, rev);
alter table public.records enable row level security;
drop policy if exists "records_owner" on public.records;
create policy "records_owner" on public.records for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.records to authenticated;
grant usage, select on sequence public.records_rev_seq to authenticated;

create or replace function public.push_records(rows jsonb) returns void
language sql security invoker set search_path = public as $$
  insert into public.records (user_id, tbl, id, data, updated_at, deleted_at)
  select auth.uid(), r->>'tbl', r->>'id', r->'data', (r->>'updated_at')::bigint, (r->>'deleted_at')::bigint
  from jsonb_array_elements(rows) as r
  on conflict (user_id, tbl, id) do update
    set data = excluded.data, updated_at = excluded.updated_at, deleted_at = excluded.deleted_at,
        rev = nextval('public.records_rev_seq')
    where public.records.updated_at < excluded.updated_at;
$$;
grant execute on function public.push_records(jsonb) to authenticated;

do $$ begin alter publication supabase_realtime add table public.records;
exception when duplicate_object then null; end $$;

insert into storage.buckets (id, name, public) values ('attachments','attachments', false) on conflict (id) do nothing;
-- políticas select/insert/update/delete en storage.objects para bucket 'attachments'
-- con (storage.foldername(name))[1] = auth.uid()::text (eliminar antes con drop policy if exists)
```
**Cliente — ciclo de sincronización:**
1. **Subir:** registros con `updatedAt > lastPush` (reloj local), omitiendo los que coinciden con una versión ya recibida del servidor (mapa `seen[tbl:id] = updatedAt`). Adjuntos: subir el Blob a `attachments/<user_id>/<id>` (o borrarlo si `deletedAt`) y la fila sin Blob. Lotes de ~400 vía `rpc('push_records')`. Guardar `lastPush = inicio del ciclo`.
2. **Bajar:** `select tbl,id,data,rev from records where rev > lastRev - 50 order by rev limit 1000` (paginado; el solape cubre transacciones que confirman fuera de orden). Para adjuntos conservar el Blob local si existe (o `null`). Fusionar con `mergeSnapshot`; actualizar `seen` y `lastRev`.
3. **Archivos:** descargar los Blobs que falten.
4. **Deduplicar áreas** por nombre (ver §11.4); si cambió algo, otra pasada.
- **Disparadores:** escritura local que cambie `updatedAt` (hooks de Dexie `creating/updating`) → 2 s de espera; evento Realtime filtrado por `user_id` → 0,6 s; al abrir; al volver visible; al recuperar conexión; cada 60 s visible. Un solo ciclo a la vez (si llega otro, repetir al terminar).
- **Cursores** por usuario en `localStorage`. Tras importar un backup: forzar subida completa (`lastPush = 0`).
- **Autenticación:** correo + contraseña (el enlace mágico abre fuera de la PWA en iOS). Mensajes de error traducidos (credenciales incorrectas, correo sin confirmar, ya registrado, registro desactivado, contraseña corta, sin conexión).
- **Estado visible:** indicador (al día / sincronizando / error / sin conexión / sin sesión) en la cabecera y panel en Ajustes.
- **Configuración:** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (clave pública/publishable) en `.env.local`. Sin ellas, la app funciona solo en local y lo indica.

### 11.4 Semillas compatibles con sync
Áreas por defecto con id fijo `area-<nombre-normalizado>`, entrada de bienvenida `bienvenida` y perfil `me`, todas con `updatedAt = 1`: así nunca se duplican entre dispositivos y cualquier edición del usuario gana. Añade `dedupeAreas()`: une áreas con el mismo nombre (conserva la de id fijo o la más antigua, reasigna referencias, borra lógicamente la otra).

### 11.5 Backup
JSON completo (todas las tablas, incluidas eliminadas, adjuntos en base64, marca `app` para validar al importar), Markdown zip y CSV de tareas, como en §4.19.

---

## 12. REQUISITOS TÉCNICOS

- TypeScript estricto sin errores; `npm run build` = `tsc --noEmit && vite build` en verde.
- PWA: manifiesto con nombre `[NOMBRE_DE_LA_APLICACIÓN]`, `display: standalone`, colores de la nueva identidad, iconos 64/192/512/maskable + apple-touch-icon (genera PNG desde un SVG propio), **atajos** (Capturar `/?capturar=1`, Diario `/diario?hoy=1`, Tareas), **share_target** GET a `/capturar`.
- Service worker con precache de la app y de las fuentes del subconjunto latino, `navigateFallback`, caché en tiempo de ejecución para el resto de fuentes y extensión `notificationclick` (enfocar ventana existente o abrir URL).
- Hosting estático gratuito con HTTPS y **reescritura SPA** (todas las rutas → `index.html`):
  - Cloudflare **Workers** con recursos estáticos: `assets.not_found_handling = "single-page-application"` (¡no uses `_redirects` con `/* /index.html 200` ahí: Cloudflare lo rechaza como bucle!).
  - Cloudflare Pages o Netlify: archivo `_redirects`.
  - Guarda la configuración de despliegue **dentro del repositorio** y un script `npm run deploy`.
- Sin dependencias pesadas innecesarias; carga diferida del cliente de Supabase.

---

## 13. REGLAS DE NEGOCIO Y ALGORITMOS

### 13.1 Parser de lenguaje natural (`parseCapture(text) → {text, date?, time?, tags[], priority?, reminder}`)
- `#etiqueta` (letras Unicode, números, `_`, `-`) → minúsculas, se quita del texto.
- Prioridad: `!alta|!media|!baja` o `!!!`(alta) `!!`(media) `!`(baja).
- Prefijo `recuérdame|recordarme|recordar|avísame (que|de)` → `reminder = true`, se quita, y el texto resultante empieza en mayúscula.
- Hora solo si hay marcador: «a las 10», «10:30», «10am», «6 pm», «10h», «a las 6 de la tarde/noche/mañana» (tarde/noche/pm suman 12 si < 12; «12 am» = 0). Un número suelto («comprar 2 libros») **no** es una hora.
- Fecha: «hoy», «esta tarde/noche», «mañana» (pero no «de la mañana»), «pasado mañana», «(el|este|el próximo) <día de la semana> (que viene)» (próxima ocurrencia; «próximo» o «que viene» añade una semana), «en N días/semanas», «15 de noviembre (de 2026)», «15/11(/26)». Fecha pasada sin año → año siguiente.
- Hora sin fecha → hoy, o mañana si ya pasó. Fecha sin hora (para recordatorio) → 09:00.
- Limpia espacios dobles y preposiciones colgantes al final.
- Adapta las palabras clave al idioma elegido por el usuario, manteniendo la misma lógica.

### 13.2 Progreso y siguiente paso
- Progreso = tareas hechas / tareas totales (proyecto; fase = sus tareas; objetivo = tareas con `goalId` + tareas de sus proyectos). Sin tareas: no mostrar porcentaje («sin acciones»).
- Siguiente paso = primera tarea `progreso` por `order`; si no hay, primera `pendiente` por `order`.
- Reordenar = intercambiar `order` con la vecina.

### 13.3 Conversiones
- A Idea / Nota / Diario: cambia `kind` del mismo registro (Diario: fecha hoy si no tiene; Idea: estado «nueva» si no tiene).
- A Tarea / Proyecto / Objetivo: crea la entidad; título = `title` o primera línea no vacía del cuerpo; resto → notas/descripción; hereda etiquetas, área, prioridad, proyecto (tareas); guarda `fromEntryId`. La entrada original: si es de bandeja → `archived = true`; siempre `convertedTo`; idea → proyecto: `ideaStatus = 'convertida'` y `projectId`.
- Extraer tareas: regex de línea `^\s*(?:[-*•]|\[ \])\s+(.+)$`; una tarea por línea con el proyecto y etiquetas de la nota; reemplazar la línea por `→ texto` para no duplicar.

### 13.4 Borrado, restauración y estados
- Eliminar (lógico) en cascada: Proyecto → tareas, fases y adjuntos borrados; notas y eventos desvinculados. Objetivo → proyectos y tareas desvinculados. Fase → tareas sin fase. Área → elementos sin área. Tarea/entrada/proyecto/objetivo/evento → sus recordatorios borrados.
- Restaurar proyecto → también lo borrado en el mismo instante (`deletedAt` idéntico).
- Completar tarea → `completedAt`, recordatorios vinculados `done`; desmarcar → `completedAt = null`.
- Recordatorio con `repeat` diario/semanal → al dispararse se reprograma a la próxima ocurrencia futura.

### 13.5 Búsqueda
En memoria, sin tildes ni mayúsculas, sobre entradas (excluye bandeja archivada), proyectos, tareas, objetivos, eventos. Todos los términos deben aparecer. Puntuación por término: título empieza (6) > título contiene (4) > etiqueta (3) > cuerpo (1); + hasta 1 punto por recencia (30 días). Máx. 40 resultados. `#tag` exige la etiqueta.

### 13.6 Frase contextual de la Mesa (primera que se cumpla)
1. Más de 2 tareas vencidas → invitación sin culpa a decidir si siguen importando.
2. Más de 6 elementos en la bandeja → invitación a ordenarla.
3. Exactamente 1 tarea para hoy → «Hoy hay una cosa importante. Empieza por ahí.»
4. Más de 1 para hoy → «Hoy tienes N cosas. Una a la vez.»
5. Algún proyecto activo con siguiente paso → «¿Cuál es el siguiente paso?»
6. Algo completado hoy → «Buen avance hoy. Lo demás puede esperar.»
7. En otro caso → «¿Qué tienes en la cabeza?»

### 13.7 Guardado automático
Retardo 500–600 ms; guarda solo si el contenido serializado cambió (evita alterar `updatedAt` al abrir o por efectos dobles de StrictMode); guarda pendientes al desmontar.

---

## 14. CASOS ESPECIALES

- Campos de «añadir» con Enter rápido y repetido: **vacía el campo antes del `await`** de la escritura (si no, los textos se concatenan).
- Elemento abierto por URL que fue eliminado → pantalla «no existe o está en la papelera» con enlace útil.
- Proyecto sin tareas, sin fases, todo hecho; objetivo sin proyectos; calendario sin elementos; búsqueda sin resultados → estados vacíos específicos.
- Fecha meta vencida → color de peligro salvo proyecto completado.
- Adjunto > 25 MB → aviso y sugerencia de enlace. Adjunto aún no descargado de la nube → marcador «descargando» y no abrir.
- Permiso de notificaciones denegado → explicar cómo reactivarlo; iOS sin instalar → explicar que hace falta instalar.
- Sin conexión → la app funciona; la sincronización indica «sin conexión» y se pone al día al volver.
- Cambio de sesión a mitad de un ciclo de sync → abortar sin guardar cursores.
- Importar un archivo que no es un backup propio → error claro.
- Preferencias con valores obsoletos en `localStorage` → reemplazar por los predeterminados al cargar.

---

## 15. SEGURIDAD Y PRIVACIDAD

- Local-first: nada sale del dispositivo sin sesión de sync.
- RLS en tabla y almacenamiento por `auth.uid()`; usar solo la clave pública en el cliente, nunca la `service_role`.
- Tras crear la cuenta del usuario, indicarle que desactive el registro de nuevos usuarios en Supabase (la URL de la app es pública).
- Fuentes autoalojadas; enlaces externos con `noopener noreferrer`; sin analíticas ni rastreo.
- No escribas contraseñas ni claves del usuario en el código ni en el repositorio (`.env.local` ignorado por git).

## 16. RENDIMIENTO

JS principal objetivo < 200 KB gzip; cliente de nube en carga diferida; consultas locales reactivas; búsqueda en memoria; precarga offline solo del subconjunto de fuentes necesario; animaciones con `transform/opacity`.

## 17. ACCESIBILIDAD

Contraste verificado (§9.3); foco visible; navegación completa por teclado y atajos; trampa de foco y Esc en modales; `aria-label` en botones de icono; roles correctos (`checkbox` en casillas, `tablist/tab`, `radiogroup`, `dialog`, `alertdialog` para la alarma, `status` para avisos); textos alternativos/`aria-hidden` en lo decorativo; áreas táctiles ≥ 44 px; `prefers-reduced-motion`; `lang` correcto en el HTML.

---

## 18. PERSONALIZACIÓN

El usuario puede cambiar libremente: nombre, identidad, colores, tipografía, iconos, logo, textos y tono, áreas de vida (crear, renombrar, símbolo, orden, eliminar), etiquetas, preferencias (tema, acento, tipografía, densidad, sonido) y añadir funciones. Centraliza marca y textos (constantes o archivo de copy) y todo el aspecto en tokens para que cambiar la identidad no requiera tocar componentes.

### Qué conservar y qué personalizar
| Elemento | Conservar | Personalizar |
|---|---|---|
| Filosofía (capturar → ejecutar, sin agobio) | Sí | Matices de tono |
| Funcionalidades de §4 | Sí | Se pueden añadir; quitar solo si el usuario lo pide |
| Reglas de negocio (§13) | Sí | Palabras del parser según idioma |
| Modelo de datos | Sí (entidades y relaciones) | Campos adicionales |
| Arquitectura local-first + repo único + fusión LWW | Sí | Stack equivalente justificado |
| Sincronización (protocolo) | Sí | Proveedor alternativo justificado |
| Navegación y flujos | Sí | Nombres de secciones |
| Áreas por defecto | No obligatorio | Sí |
| Nombre | No | **Sí: `[NOMBRE_DE_LA_APLICACIÓN]`** |
| Marca, logo, mascota/ilustraciones | No | **Sí, nuevos** |
| Paleta y tipografías | No | **Sí, nuevas** |
| Diseño visual y composición | No | **Sí, nuevos** |
| Animaciones y sonidos | No | **Sí** |
| Textos de ejemplo de esta especificación | No literal | Sí |

---

## 19. EXTENSIBILIDAD

Mantén el repositorio de datos como API interna estable; añade nuevas entidades como tablas Dexie versionadas y nuevas filas `tbl` en la tabla genérica de sync (sin cambiar el esquema SQL). La capa de recordatorios debe estar detrás de una interfaz `Scheduler { start(); stop() }` para poder cambiarla por notificaciones nativas.

# POSIBLES EXTENSIONES (NO forman parte del alcance base; no las implementes salvo que el usuario lo pida)
- Dictado por voz para capturar y escribir el diario: dictado del navegador (Web Speech API; rápido, pero en Chrome el audio pasa por servidores de Google; poco fiable en iOS) o Whisper local en el navegador (privado, sin conexión, descarga de 40–80 MB, más lento). Pregunta al usuario antes, por la privacidad.
- Capacitor para notificaciones locales exactas con la app cerrada, alarmas reales y widgets; o Web Push con funciones en Supabase.
- Revisión semanal guiada (qué hice, qué se atascó, siguiente paso por proyecto), sin puntuaciones.
- UI para repetir recordatorios, edición de eventos, Markdown en notas, arrastrar y soltar.
- IA opcional: convertir una idea en objetivo + proyecto + fases + tareas; resumir notas; extraer tareas; generar roadmap; revisión semanal asistida.
- Búsqueda semántica, exportación ICS / sincronización con calendarios externos, Mesa personalizable, cifrado de extremo a extremo de la réplica en la nube, colaboración.

---

## 20. FASES DE IMPLEMENTACIÓN (entrega y verifica cada una)

1. **Arquitectura y base:** preguntas iniciales (§0), propuesta visual, proyecto Vite+React+TS, tokens del sistema de diseño, modelo de datos, Dexie, `repo.ts`, layout (lateral + barra móvil), rutas, PWA básica. Documento corto de arquitectura en `docs/`.
2. **Captura:** parser, captura global, Bandeja con conversiones, editor de entradas, Diario, Notas.
3. **Organización:** Ideas, áreas, etiquetas, búsqueda y paleta de comandos, favoritos, recientes.
4. **Ejecución:** Proyectos (lista y vista completa con plan, roadmap, notas, fechas, archivos, enlaces), Tareas (vistas y detalle), Objetivos, Mesa completa, Perfil.
5. **Tiempo:** Calendario (mes/semana/agenda), eventos, recordatorios y alarmas, permisos, notificaciones.
6. **Datos y multiplataforma:** export/import, papelera, sincronización Supabase + `schema.sql` + panel, despliegue en hosting gratuito con reescritura SPA, instalación en móvil.
7. **Personalización:** tema, acentos, tipografías, densidad, sonidos, áreas editables.
8. **Pulido:** revisión de contraste numérica, accesibilidad, responsive en 375/768/1280 px, claro y oscuro, estados vacíos y de error, rendimiento, limpieza de datos de prueba.

## 21. CRITERIOS DE ACEPTACIÓN

**Base**
- [ ] `npm run build` sin errores de tipos ni de compilación; sin errores en consola al recorrer todas las rutas.
- [ ] El nombre `[NOMBRE_DE_LA_APLICACIÓN]` aparece en título, navegación, manifiesto, bienvenida y documentación; no queda el nombre de la referencia.
- [ ] La identidad visual es nueva (paleta, tipografía, marca, composición) y no recuerda a la referencia.
- [ ] Los datos persisten tras recargar y tras cerrar el navegador.

**Captura y organización**
- [ ] Capturar desde botón, `N`, ＋ móvil y atajo `/?capturar=1`.
- [ ] El parser detecta los ejemplos: «mañana a las 10», «el viernes», «en 3 días», «15 de noviembre», «15/11», «a las 6 de la tarde», `#tag`, `!alta`, «recuérdame…»; y no confunde «comprar 2 libros» con una hora.
- [ ] Bandeja: las 6 conversiones, archivar y eliminar con Deshacer, modo una a una.
- [ ] Ideas con estados y filtros; Diario agrupado por fecha; Notas con filtros; editor con autoguardado y extracción de tareas.

**Ejecución**
- [ ] Idea → proyecto conserva texto y deja la idea como «convertida».
- [ ] Siguiente paso correcto (en progreso antes que pendiente; respeta el orden) y completable desde la Mesa y el proyecto.
- [ ] Progreso = hechas/total en proyecto, fase y objetivo; sin tareas no muestra %.
- [ ] Fases sugeridas, mover, renombrar y eliminar sin perder tareas.
- [ ] Tareas: 4 vistas, detalle completo, reordenar, recordatorio automático con fecha+hora.
- [ ] Objetivos con proyectos vinculados y acciones directas.
- [ ] Borrar proyecto y deshacer restaura sus tareas y fases.

**Tiempo**
- [ ] Calendario mes/semana/agenda con todos los tipos de elemento; crear evento y tarea desde un día.
- [ ] Recordatorio dispara aviso; alarma dispara capa, sonido, posponer; permiso solo cuando se necesita.

**Datos y sync**
- [ ] Export JSON/Markdown/CSV válidos; importar el mismo JSON dos veces no duplica.
- [ ] Papelera: recuperar, eliminar, vaciar.
- [ ] Con Supabase configurado: crear cuenta en A, entrar en B; un cambio en A aparece en B en segundos y viceversa; un borrado se propaga; editar el mismo elemento en ambos conserva el más reciente; las áreas por defecto no se duplican; los adjuntos viajan.
- [ ] Sin sesión, la tabla remota no devuelve datos de nadie.

**Plataforma, UX y accesibilidad**
- [ ] Instalable (manifiesto válido, iconos, standalone); funciona sin conexión tras la primera carga; rutas directas cargan al recargar en el hosting.
- [ ] Móvil (375 px): barra inferior, hojas, sin scroll horizontal, áreas táctiles ≥ 44 px. Escritorio (1280 px): lateral y dos columnas en la Mesa.
- [ ] Claro, oscuro y automático correctos; contraste de **todos** los acentos verificado y documentado.
- [ ] Foco visible, teclado completo, Esc cierra capas, `prefers-reduced-motion` respetado.
- [ ] Ningún elemento visual roto, solapado o recortado; estados vacíos y errores con mensajes útiles.

## 22. INSTRUCCIONES DE VALIDACIÓN

1. Tras cada fase: compila (`tsc --noEmit`), construye (`vite build`) y abre la app en un navegador.
2. Recorre los flujos de §8 con **datos de ejemplo** cargados en el navegador de pruebas y **bórralos al terminar** para entregar la app limpia.
3. Captura pantallas en escritorio y móvil, claro y oscuro, de: Mesa, Bandeja, Proyecto (con plan y roadmap), Tareas, Calendario, Perfil, Ajustes.
4. Calcula los contrastes con un script (fórmula de luminancia relativa WCAG) para todos los pares texto/fondo y acentos; corrige lo que no cumpla.
5. Prueba la sincronización con dos perfiles de navegador (o navegador + móvil) usando una cuenta del propio usuario; si no hay cuenta disponible, dilo explícitamente y deja la funcionalidad marcada como «implementada, sin verificar».
6. Prueba el despliegue con peticiones a rutas directas (`/ajustes`, `/proyectos/x`) y al manifiesto; si la caché del CDN devuelve resultados antiguos, verifica con un parámetro anti‑caché.
7. Al final entrega: URL publicada (si aplica), qué se probó, qué no, limitaciones conocidas y próximos pasos recomendados. No afirmes que algo funciona sin haberlo comprobado.

---

**Recuerda:** conserva la funcionalidad, la lógica y la arquitectura; reinventa por completo el nombre, la identidad y el aspecto. Empieza por las preguntas de §0 y después construye.
