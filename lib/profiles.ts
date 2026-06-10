import type { SajuSessionInput } from './session';

const KEY = 'saju-profiles';

export interface Profile {
  id: string;
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  isLunar: boolean;
  gender?: 'M' | 'F';
  ilgan: string;
  createdAt: number;
}

function isProfile(v: unknown): v is Profile {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.year === 'number' &&
    typeof r.month === 'number' &&
    typeof r.day === 'number' &&
    typeof r.ilgan === 'string'
  );
}

export function loadProfiles(): Profile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isProfile);
  } catch {
    return [];
  }
}

function persist(profiles: Profile[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(profiles));
}

export function isProfileSaved(input: SajuSessionInput): boolean {
  return loadProfiles().some(
    (p) =>
      p.name === input.name &&
      p.year === input.year &&
      p.month === input.month &&
      p.day === input.day &&
      p.hour === input.hour &&
      p.isLunar === input.isLunar
  );
}

export function saveProfile(input: SajuSessionInput, ilgan: string): void {
  if (typeof window === 'undefined') return;
  if (isProfileSaved(input)) return;
  const profiles = loadProfiles();
  profiles.push({
    id: crypto.randomUUID(),
    name: input.name,
    year: input.year,
    month: input.month,
    day: input.day,
    hour: input.hour,
    isLunar: input.isLunar,
    gender: input.gender,
    ilgan,
    createdAt: Date.now(),
  });
  persist(profiles);
}

export function deleteProfile(id: string): void {
  if (typeof window === 'undefined') return;
  persist(loadProfiles().filter((p) => p.id !== id));
}
