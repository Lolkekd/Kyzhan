/** Мини-обёртка над IndexedDB: проект и видеофайлы переживают перезагрузку. При ошибке — localStorage. */
const DB = 'ashyq-editor';
let dbp: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
  if (dbp) return dbp;
  dbp = new Promise((res) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore('kv');
        r.result.createObjectStore('blobs');
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    } catch {
      res(null);
    }
  });
  return dbp;
}

async function tx<T>(store: 'kv' | 'blobs', mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await open();
  if (!db) return undefined;
  return new Promise((res) => {
    try {
      const t = db.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => res(req ? (req.result as T) : undefined);
      t.onerror = () => res(undefined);
    } catch {
      res(undefined);
    }
  });
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  const v = await tx<T>('kv', 'readonly', (s) => s.get(key));
  if (v !== undefined) return v;
  try {
    const raw = localStorage.getItem(`${DB}:${key}`);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

export async function idbSet(key: string, value: unknown): Promise<boolean> {
  const db = await open();
  if (db) {
    await tx('kv', 'readwrite', (s) => s.put(value, key));
    return true;
  }
  try {
    localStorage.setItem(`${DB}:${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const blobGet = (id: string) => tx<Blob>('blobs', 'readonly', (s) => s.get(id));
export const blobSet = (id: string, blob: Blob) => tx('blobs', 'readwrite', (s) => s.put(blob, id));
