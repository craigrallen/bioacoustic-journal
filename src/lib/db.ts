import { openDB, type DBSchema } from 'idb';
import type { AudioFeatures, EmotionPoint } from './audioAnalysis';

export interface JournalEntry {
  id: string;
  timestamp: number;
  duration: number;
  features: AudioFeatures;
  emotion: EmotionPoint;
}

interface BioacousticDB extends DBSchema {
  audio: {
    key: string;
    value: { id: string; blob: Blob };
  };
}

const dbPromise = openDB<BioacousticDB>('bioacoustic-journal', 1, {
  upgrade(db) {
    db.createObjectStore('audio', { keyPath: 'id' });
  },
});

export async function saveAudioBlob(id: string, blob: Blob) {
  const db = await dbPromise;
  await db.put('audio', { id, blob });
}

export async function getAudioBlob(id: string): Promise<Blob | undefined> {
  const db = await dbPromise;
  const record = await db.get('audio', id);
  return record?.blob;
}

export async function deleteAudioBlob(id: string) {
  const db = await dbPromise;
  await db.delete('audio', id);
}

const ENTRIES_KEY = 'bioacoustic-entries';

export function getEntries(): JournalEntry[] {
  const raw = localStorage.getItem(ENTRIES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveEntry(entry: JournalEntry) {
  const entries = getEntries();
  entries.unshift(entry);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function deleteEntry(id: string) {
  const entries = getEntries().filter(e => e.id !== id);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  deleteAudioBlob(id);
}
