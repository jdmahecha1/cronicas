/**
 * Estado del escudo de spoilers compartido por toda la página (islas de React y
 * scripts sueltos) y entre pestañas. Vive solo en el navegador: no hay servidor.
 */
export interface StoredState {
  shield: boolean;
  /** sagaId → (gameId → etapas terminadas). Se limpia al leerlo con sanitizeProgress. */
  sagas: Record<string, Record<string, number>>;
}

const KEY = 'cronicas:v1';
const EVENT = 'cronicas:change';

export const DEFAULT_STATE: StoredState = Object.freeze({ shield: true, sagas: {} }) as StoredState;

let cache: StoredState | null = null;

export function parseState(raw: string | null): StoredState {
  if (!raw) return DEFAULT_STATE;
  try {
    const data = JSON.parse(raw) as Partial<StoredState>;
    const sagas =
      data.sagas && typeof data.sagas === 'object' && !Array.isArray(data.sagas) ? data.sagas : {};
    return { shield: data.shield !== false, sagas };
  } catch {
    return DEFAULT_STATE;
  }
}

function read(): StoredState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  if (cache) return cache;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Modo privado o almacenamiento bloqueado: se trabaja solo en memoria.
  }
  cache = parseState(raw);
  return cache;
}

function write(next: StoredState) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Igual que arriba: sin almacenamiento el estado dura lo que dure la pestaña.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function getState(): StoredState {
  return read();
}

export function getServerState(): StoredState {
  return DEFAULT_STATE;
}

export function setShield(enabled: boolean) {
  write({ ...read(), shield: enabled });
}

export function setSagaProgress(sagaId: string, progress: Record<string, number>) {
  const state = read();
  write({ ...state, sagas: { ...state.sagas, [sagaId]: progress } });
}

export function resetSaga(sagaId: string) {
  const { [sagaId]: _removed, ...rest } = read().sagas;
  write({ ...read(), sagas: rest });
}

export function subscribe(listener: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener(EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}
