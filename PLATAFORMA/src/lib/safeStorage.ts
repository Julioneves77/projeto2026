/**
 * Wrapper seguro para localStorage - evita crash no Safari modo privado (iPhone).
 * No modo privado, localStorage.setItem lança QuotaExceededError.
 * Usa fallback em memória quando localStorage não está disponível.
 */

const memoryStore = new Map<string, string>();

function isLocalStorageAvailable(): boolean {
  try {
    const test = '__safeStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

const useMemory = !isLocalStorageAvailable();

function safeGet(key: string): string | null {
  try {
    if (useMemory) return memoryStore.get(key) ?? null;
    return localStorage.getItem(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (useMemory) {
      memoryStore.set(key, value);
      return;
    }
    localStorage.setItem(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

function safeRemove(key: string): void {
  try {
    if (useMemory) {
      memoryStore.delete(key);
      return;
    }
    localStorage.removeItem(key);
  } catch {
    memoryStore.delete(key);
  }
}

export const safeStorage = {
  getItem: safeGet,
  setItem: safeSet,
  removeItem: safeRemove,
};
