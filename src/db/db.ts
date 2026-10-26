import Dexie, { type Table } from 'dexie';
import type {
  Area,
  Attachment,
  CalEvent,
  Entry,
  Goal,
  Phase,
  Profile,
  Project,
  Reminder,
  Task,
} from './types';

// IndexedDB local. Cada cambio de esquema = nueva `version()` (Dexie migra solo).
class BitacoraDB extends Dexie {
  entries!: Table<Entry, string>;
  projects!: Table<Project, string>;
  phases!: Table<Phase, string>;
  tasks!: Table<Task, string>;
  goals!: Table<Goal, string>;
  areas!: Table<Area, string>;
  events!: Table<CalEvent, string>;
  reminders!: Table<Reminder, string>;
  attachments!: Table<Attachment, string>;
  profile!: Table<Profile, string>;

  constructor() {
    super('bitacora');
    this.version(1).stores({
      entries: 'id, kind, updatedAt, projectId, goalId, areaId, date, *tags',
      projects: 'id, status, updatedAt, goalId, areaId, *tags',
      phases: 'id, projectId, order',
      tasks: 'id, status, due, projectId, phaseId, goalId, updatedAt, *tags',
      goals: 'id, status, updatedAt, areaId',
      areas: 'id, order',
      events: 'id, date, projectId',
      reminders: 'id, at, refId',
      attachments: 'id, ownerId',
    });
    this.version(2).stores({ profile: 'id' });
  }
}

export const db = new BitacoraDB();
