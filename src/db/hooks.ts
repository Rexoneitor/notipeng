// Lecturas reactivas: cualquier escritura en Dexie re-renderiza a quien la use.
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { Area, Attachment, CalEvent, Entry, EntryKind, Goal, ID, Phase, Profile, Project, Reminder, Task } from './types';

const alive = <T extends { deletedAt?: number | null }>(r: T) => !r.deletedAt;

export function useEntries(kind?: EntryKind): Entry[] | undefined {
  return useLiveQuery(
    () => (kind ? db.entries.where('kind').equals(kind) : db.entries.toCollection()).filter(alive).toArray(),
    [kind],
  );
}

export function useEntry(id?: ID): Entry | null | undefined {
  return useLiveQuery(async () => (id ? (await db.entries.get(id)) ?? null : null), [id]);
}

export function useProjects(): Project[] | undefined {
  return useLiveQuery(() => db.projects.filter(alive).toArray(), []);
}

export function useProject(id?: ID): Project | null | undefined {
  return useLiveQuery(async () => (id ? (await db.projects.get(id)) ?? null : null), [id]);
}

export function usePhases(projectId?: ID): Phase[] | undefined {
  return useLiveQuery(
    async () =>
      projectId
        ? (await db.phases.where('projectId').equals(projectId).filter(alive).toArray()).sort((a, b) => a.order - b.order)
        : [],
    [projectId],
  );
}

export function useTasks(): Task[] | undefined {
  return useLiveQuery(() => db.tasks.filter(alive).toArray(), []);
}

export function useGoals(): Goal[] | undefined {
  return useLiveQuery(() => db.goals.filter(alive).toArray(), []);
}

export function useGoal(id?: ID): Goal | null | undefined {
  return useLiveQuery(async () => (id ? (await db.goals.get(id)) ?? null : null), [id]);
}

export function useAreas(): Area[] | undefined {
  return useLiveQuery(async () => (await db.areas.filter(alive).toArray()).sort((a, b) => a.order - b.order), []);
}

export function useEvents(): CalEvent[] | undefined {
  return useLiveQuery(() => db.events.filter(alive).toArray(), []);
}

export function useReminders(): Reminder[] | undefined {
  return useLiveQuery(() => db.reminders.filter(alive).toArray(), []);
}

export function useAttachments(ownerId?: ID): Attachment[] | undefined {
  return useLiveQuery(
    () => (ownerId ? db.attachments.where('ownerId').equals(ownerId).filter(alive).toArray() : []),
    [ownerId],
  );
}

export function useInboxCount(): number {
  return (
    useLiveQuery(() => db.entries.where('kind').equals('inbox').filter((e) => !e.deletedAt && !e.archived).count(), []) ?? 0
  );
}

export function useTrash() {
  return useLiveQuery(async () => {
    const out: { table: string; rec: any }[] = [];
    for (const t of db.tables) {
      if (t.name === 'attachments') continue;
      const rows = await t.filter((r: any) => !!r.deletedAt).toArray();
      rows.forEach((rec) => out.push({ table: t.name, rec }));
    }
    return out.sort((a, b) => b.rec.deletedAt - a.rec.deletedAt);
  }, []);
}

export function useProfile(): Profile | undefined {
  return useLiveQuery(async () => (await db.profile.get('me')) ?? undefined, []);
}
