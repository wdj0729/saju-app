import type { SajuResult } from './saju-calculator';
import { createSessionStore } from './session-store';

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

function isSajuSession(v: unknown): v is SajuSession {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  if (typeof r.input !== 'object' || r.input === null) return false;
  if (typeof r.result !== 'object' || r.result === null) return false;
  const input = r.input as Record<string, unknown>;
  if (input.gender === undefined) input.gender = 'M';
  return (
    typeof input.year === 'number' &&
    typeof input.month === 'number' &&
    typeof input.day === 'number' &&
    typeof input.isLunar === 'boolean'
  );
}

const store = createSessionStore('saju-session', isSajuSession);

export const saveSession = store.save;
export const loadSession = store.load;
export const clearSession = store.clear;
