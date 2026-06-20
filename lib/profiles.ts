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
  gender: 'M' | 'F';
  ilgan: string;
  createdAt: number;
}

export function isProfile(v: unknown): v is Profile {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  // Migrate legacy data: if gender is missing, default to 'M'
  if (r.gender === undefined) r.gender = 'M';
  return (
    typeof r.id === 'string' &&
    typeof r.year === 'number' &&
    typeof r.month === 'number' &&
    typeof r.day === 'number' &&
    typeof r.isLunar === 'boolean' &&
    typeof r.ilgan === 'string' &&
    (r.gender === 'M' || r.gender === 'F')
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
  try {
    localStorage.setItem(KEY, JSON.stringify(profiles));
  } catch {
    // 할당량 초과 또는 접근 불가 시 무시
  }
}

function isSameProfile(p: Profile, input: SajuSessionInput): boolean {
  return (
    p.name === input.name &&
    p.year === input.year &&
    p.month === input.month &&
    p.day === input.day &&
    p.hour === input.hour &&
    p.isLunar === input.isLunar
  );
}

export function isProfileSaved(input: SajuSessionInput): boolean {
  return loadProfiles().some((p) => isSameProfile(p, input));
}

export function saveProfile(input: SajuSessionInput, ilgan: string): void {
  if (typeof window === 'undefined') return;
  const profiles = loadProfiles();
  if (profiles.some((p) => isSameProfile(p, input))) return;
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

export function profileToSessionInput(profile: Profile): SajuSessionInput {
  return {
    name: profile.name,
    year: profile.year,
    month: profile.month,
    day: profile.day,
    hour: profile.hour,
    isLunar: profile.isLunar,
    gender: profile.gender,
  };
}

export function deleteProfile(id: string): void {
  if (typeof window === 'undefined') return;
  persist(loadProfiles().filter((p) => p.id !== id));
}

export function updateProfile(id: string, patch: Partial<Omit<Profile, 'id' | 'createdAt'>>): void {
  if (typeof window === 'undefined') return;
  persist(loadProfiles().map((p) => (p.id === id ? { ...p, ...patch } : p)));
}

export interface ImportResult {
  added: number;
  skipped: number;
}

export function parseImportedProfiles(raw: unknown): { profiles: Profile[]; total: number } {
  if (typeof raw !== 'object' || raw === null) throw new Error('올바른 프로필 파일이 아니에요.');
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.profiles)) throw new Error('올바른 프로필 파일이 아니에요.');
  const profiles = (data.profiles as unknown[]).filter(isProfile);
  return { profiles, total: (data.profiles as unknown[]).length };
}

export function exportProfiles(): void {
  if (typeof window === 'undefined') return;
  const profiles = loadProfiles();
  const data = JSON.stringify({ version: 1, profiles }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'saju-profiles.json';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProfiles(file: File): Promise<ImportResult> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('올바른 프로필 파일이 아니에요.');
  }
  let toMerge: Profile[];
  try {
    ({ profiles: toMerge } = parseImportedProfiles(parsed));
  } catch {
    throw new Error('올바른 프로필 파일이 아니에요.');
  }
  const existing = loadProfiles();
  const existingIds = new Set(existing.map((p) => p.id));
  const toAdd = toMerge.filter((p) => !existingIds.has(p.id));
  persist([...existing, ...toAdd]);
  return { added: toAdd.length, skipped: toMerge.length - toAdd.length };
}
