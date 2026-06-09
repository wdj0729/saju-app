import type { SajuResult } from './saju-calculator';

export interface SajuSessionInput {
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  isLunar: boolean;
}

export interface SajuSession {
  input: SajuSessionInput;
  result: SajuResult;
}

const KEY = 'saju-session';

export function saveSession(data: SajuSession): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

export function loadSession(): SajuSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || !parsed?.input || !parsed?.result) return null;
    return parsed as SajuSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}
