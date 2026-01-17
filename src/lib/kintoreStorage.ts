// src/lib/kintoreStorage.ts
export type Part = string;
export type LiftId = string;

export type Lift = { id: LiftId; name: string; part: Part };

export type SetEntry = {
  id: string;
  date: string;
  liftId: LiftId;
  weight: number;
  reps: number;
  sets: number;
  note: string;
};

export type EventEntry = { id: string; date: string; title: string };

const LS_PREFIX = "kintore-v3";
const LS_ENTRIES = `${LS_PREFIX}:entries`;
const LS_LIFTS = `${LS_PREFIX}:lifts`;
const LS_PARTS = `${LS_PREFIX}:parts`;
const LS_EVENTS = `${LS_PREFIX}:events`;

function safeParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export function loadKintore() {
  const parts = safeParse<Part[]>(localStorage.getItem(LS_PARTS));
  const lifts = safeParse<Lift[]>(localStorage.getItem(LS_LIFTS));
  const entries = safeParse<SetEntry[]>(localStorage.getItem(LS_ENTRIES));
  const events = safeParse<EventEntry[]>(localStorage.getItem(LS_EVENTS));
  return { parts, lifts, entries, events };
}

export function saveParts(parts: Part[]) {
  localStorage.setItem(LS_PARTS, JSON.stringify(parts));
}
export function saveLifts(lifts: Lift[]) {
  localStorage.setItem(LS_LIFTS, JSON.stringify(lifts));
}
export function saveEntries(entries: SetEntry[]) {
  localStorage.setItem(LS_ENTRIES, JSON.stringify(entries));
}
export function saveEvents(events: EventEntry[]) {
  localStorage.setItem(LS_EVENTS, JSON.stringify(events));
}
