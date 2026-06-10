import type { SajuResult } from './saju-calculator';

export interface SajuSessionInput {
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  isLunar: boolean;
  gender: 'M' | 'F';
}

export interface SajuSession {
  input: SajuSessionInput;
  result: SajuResult;
}

const KEY = 'saju-session-v1';

export function saveSession(data: SajuSession): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

function isSajuSession(v: unknown): v is SajuSession {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  if (typeof r.input !== 'object' || r.input === null) return false;
  if (typeof r.result !== 'object' || r.result === null) return false;
  const input = r.input as Record<string, unknown>;
  return (
    typeof input.year === 'number' &&
    typeof input.month === 'number' &&
    typeof input.day === 'number' &&
    typeof input.isLunar === 'boolean'
  );
}

export function loadSession(): SajuSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSajuSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}
