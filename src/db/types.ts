// Modelo de datos de Notipeng.
// Todos los registros comparten `Base`: id UUID + sellos de tiempo para sincronización
// last-write-wins y borrado lógico (tombstones). Ver docs/ARQUITECTURA.md §5–6.

export type ID = string;

export interface Base {
  id: ID;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

export type Priority = 'alta' | 'media' | 'baja';

export type EntryKind = 'inbox' | 'note' | 'journal' | 'idea';

export type IdeaStatus =
  | 'nueva'
  | 'explorando'
  | 'interesante'
  | 'desarrollo'
  | 'convertida'
  | 'descartada';

export interface Entry extends Base {
  kind: EntryKind;
  title: string;
  body: string;
  tags: string[];
  areaId?: ID | null;
  projectId?: ID | null;
  goalId?: ID | null;
  /** Fecha de la entrada (YYYY-MM-DD); relevante en el diario. */
  date?: string | null;
  ideaStatus?: IdeaStatus;
  priority?: Priority | null;
  category?: string;
  favorite?: boolean;
  archived?: boolean;
  openedAt?: number;
  convertedTo?: { type: 'project' | 'task' | 'goal'; id: ID } | null;
}

export type ProjectStatus =
  | 'idea'
  | 'planificacion'
  | 'progreso'
  | 'pausado'
  | 'completado'
  | 'archivado';

export interface Link {
  id: ID;
  url: string;
  title: string;
}

export interface Project extends Base {
  title: string;
  description: string;
  objective: string;
  status: ProjectStatus;
  startDate?: string | null;
  targetDate?: string | null;
  priority?: Priority | null;
  areaId?: ID | null;
  goalId?: ID | null;
  tags: string[];
  favorite?: boolean;
  links: Link[];
  fromEntryId?: ID | null;
  openedAt?: number;
}

export interface Phase extends Base {
  projectId: ID;
  title: string;
  note: string;
  order: number;
}

export type TaskStatus = 'pendiente' | 'progreso' | 'hecha';

export interface Task extends Base {
  title: string;
  notes: string;
  status: TaskStatus;
  priority?: Priority | null;
  /** YYYY-MM-DD */
  due?: string | null;
  /** HH:mm */
  time?: string | null;
  projectId?: ID | null;
  phaseId?: ID | null;
  goalId?: ID | null;
  areaId?: ID | null;
  tags: string[];
  order: number;
  completedAt?: number | null;
  fromEntryId?: ID | null;
}

export type GoalStatus = 'activo' | 'logrado' | 'pausado' | 'archivado';

export interface Goal extends Base {
  title: string;
  description: string;
  targetDate?: string | null;
  status: GoalStatus;
  areaId?: ID | null;
  tags: string[];
  favorite?: boolean;
  openedAt?: number;
  fromEntryId?: ID | null;
}

export interface Area extends Base {
  name: string;
  symbol: string;
  order: number;
}

export interface CalEvent extends Base {
  title: string;
  date: string;
  time?: string | null;
  endTime?: string | null;
  notes: string;
  projectId?: ID | null;
}

export type ReminderKind = 'recordatorio' | 'alarma';
export type RefType = 'task' | 'project' | 'entry' | 'goal' | 'event';

export interface Reminder extends Base {
  title: string;
  /** epoch ms */
  at: number;
  kind: ReminderKind;
  refType?: RefType | null;
  refId?: ID | null;
  firedAt?: number | null;
  done: boolean;
  repeat?: 'none' | 'daily' | 'weekly';
}

export type OwnerType = 'project' | 'entry' | 'goal' | 'task';

export interface Attachment extends Base {
  ownerType: OwnerType;
  ownerId: ID;
  name: string;
  mime: string;
  size: number;
  blob: Blob | null;
}

export type AvatarSticker = 'sol' | 'luna' | 'barco' | 'brujula' | 'hoja' | 'estrella' | 'rayo' | 'llama' | 'letra';

/** Tu perfil: un único registro (id 'me') que se sincroniza como todo lo demás. */
export interface Profile extends Base {
  name: string;
  motto: string;
  /** «Lo que realmente importa»: hasta tres intenciones que viven en la Mesa. */
  intentions: string[];
  avatar: { sticker: AvatarSticker; color: string };
}

export type TableName =
  | 'profile'
  | 'entries'
  | 'projects'
  | 'phases'
  | 'tasks'
  | 'goals'
  | 'areas'
  | 'events'
  | 'reminders'
  | 'attachments';

export const TABLES: TableName[] = [
  'profile',
  'entries',
  'projects',
  'phases',
  'tasks',
  'goals',
  'areas',
  'events',
  'reminders',
  'attachments',
];
