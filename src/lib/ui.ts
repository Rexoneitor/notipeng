// Estado global mínimo de la interfaz (capas abiertas y avisos). Sin librerías.
import { useSyncExternalStore } from 'react';
import type { EntryKind, ID, Reminder } from '../db/types';

export type CaptureKind = EntryKind | 'task' | 'reminder';

export interface CaptureOpts {
  text?: string;
  kind?: CaptureKind;
  projectId?: ID | null;
}

export interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}

interface UIState {
  capture: CaptureOpts | null;
  palette: boolean;
  more: boolean;
  taskId: ID | null;
  toasts: Toast[];
  alarm: Reminder | null;
}

let state: UIState = { capture: null, palette: false, more: false, taskId: null, toasts: [], alarm: null };
const subs = new Set<() => void>();
const set = (p: Partial<UIState>) => {
  state = { ...state, ...p };
  subs.forEach((f) => f());
};

export function useUI(): UIState {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
  );
}

export const openCapture = (o: CaptureOpts = {}) => set({ capture: o, palette: false, more: false });
export const closeCapture = () => set({ capture: null });
export const openPalette = () => set({ palette: true, capture: null, more: false });
export const closePalette = () => set({ palette: false });
export const setMore = (more: boolean) => set({ more });
export const openTask = (taskId: ID) => set({ taskId, palette: false });
export const closeTask = () => set({ taskId: null });
export const showAlarm = (alarm: Reminder | null) => set({ alarm });

let seq = 0;
export function toast(text: string, action?: Toast['action'], ms = 4200) {
  const t: Toast = { id: ++seq, text, action };
  set({ toasts: [...state.toasts.slice(-2), t] });
  setTimeout(() => dismissToast(t.id), ms);
}
export const dismissToast = (id: number) => set({ toasts: state.toasts.filter((t) => t.id !== id) });

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
export const MOD = isMac ? '⌘' : 'Ctrl';
