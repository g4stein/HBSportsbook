/**
 * localStorage wrapper that never throws. The contest form loads entries in
 * an iframe, where browsers often block or partition third-party storage.
 * Everything keeps working in memory if storage is unavailable.
 */
const mem = new Map<string, string>();

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key) ?? mem.get(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    const raw = mem.get(key);
    try {
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }
}

export function writeJSON(key: string, value: unknown) {
  const raw = JSON.stringify(value);
  mem.set(key, raw);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    /* storage blocked (e.g. sandboxed iframe): memory copy is enough */
  }
}

export function removeKey(key: string) {
  mem.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
