export interface SessionStore<T> {
  save: (data: T) => void;
  load: () => T | null;
  clear: () => void;
}

export function createSessionStore<T>(
  key: string,
  validate: (v: unknown) => v is T
): SessionStore<T> {
  return {
    save(data: T): void {
      if (typeof window === 'undefined') return;
      try {
        sessionStorage.setItem(key, JSON.stringify(data));
      } catch {
        // 할당량 초과 또는 접근 불가 시 무시
      }
    },
    load(): T | null {
      if (typeof window === 'undefined') return null;
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      try {
        const parsed: unknown = JSON.parse(raw);
        return validate(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    clear(): void {
      if (typeof window === 'undefined') return;
      sessionStorage.removeItem(key);
    },
  };
}
