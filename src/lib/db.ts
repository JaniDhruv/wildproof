import { openDB, DBSchema, IDBPDatabase } from 'idb';

export type MissionType = 'habitat-comparison' | 'pattern-hunt' | 'sound-and-scene';
export type EvidenceKind = 'photo' | 'audio' | 'note';
export type Confidence = 'observed' | 'inferred' | 'unknown';
export type ExpeditionStatus = 'draft' | 'queued' | 'processing' | 'complete' | 'failed';

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  localUrl?: string; // object URL or base64
  text?: string;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
}

export interface Expedition {
  id: string;
  missionType: MissionType;
  startedAt: string;
  completedAt?: string;
  evidence: EvidenceItem[];
  status: ExpeditionStatus;
  report?: any; // To be typed later
}

interface FieldProofDB extends DBSchema {
  expeditions: {
    key: string;
    value: Expedition;
    indexes: { 'by-status': string };
  };
}

let dbPromise: Promise<IDBPDatabase<FieldProofDB>> | null = null;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<FieldProofDB>('fieldproof-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('expeditions', { keyPath: 'id' });
        store.createIndex('by-status', 'status');
      },
    });
  }
  return dbPromise;
}

export async function saveExpedition(exp: Expedition) {
  const db = await getDb();
  await db.put('expeditions', exp);
}

export async function getExpedition(id: string) {
  const db = await getDb();
  return db.get('expeditions', id);
}

export async function getAllExpeditions() {
  const db = await getDb();
  return db.getAll('expeditions');
}

export async function deleteExpedition(id: string) {
  const db = await getDb();
  await db.delete('expeditions', id);
}
