const PREFIX = 'saju-ai-cache:';
const CACHE_VERSION = 2;
const TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30일

export function makeAiCacheKey(
  year: number,
  month: number,
  day: number,
  hour: number | null,
  isLunar: boolean
): string {
  return `${PREFIX}${year}-${month}-${day}-${hour ?? 'x'}-${isLunar ? 'L' : 'S'}`;
}

const MONTHLY_PREFIX = 'monthly-fortune:';

export function makeMonthlyFortuneCacheKey(
  dayPillar: string,
  hourPillar: string | null,
  year: number,
  month: number
): string {
  return `${MONTHLY_PREFIX}${dayPillar}-${hourPillar ?? 'x'}:${year}:${month}`;
}

const FORTUNE_DAY_PREFIX = 'fortune-day:';

export function makeFortuneDayCacheKey(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  hour: number | null,
  isLunar: boolean,
  todayYear: number,
  todayMonth: number,
  todayDay: number
): string {
  return `${FORTUNE_DAY_PREFIX}${birthYear}-${birthMonth}-${birthDay}-${hour ?? 'x'}-${isLunar ? 'L' : 'S'}:${todayYear}-${todayMonth}-${todayDay}`;
}

export function saveAiCache(key: string, sections: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify({ v: CACHE_VERSION, savedAt: Date.now(), sections }));
  } catch {
    // quota exceeded — ignore
  }
}

export function loadAiCache(key: string): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const entry = parsed as Record<string, unknown>;
    if (entry.v !== CACHE_VERSION) return null;
    if (typeof entry.savedAt !== 'number') return null;
    if (Date.now() - entry.savedAt > TTL_MS) return null;
    if (
      typeof entry.sections !== 'object' ||
      entry.sections === null ||
      Array.isArray(entry.sections)
    )
      return null;
    return entry.sections as Record<string, string>;
  } catch {
    return null;
  }
}
