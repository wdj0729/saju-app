const PREFIX = 'saju-ai-cache:';
const CACHE_VERSION = 1;

export function makeAiCacheKey(
  year: number,
  month: number,
  day: number,
  hour: number | null,
  isLunar: boolean
): string {
  return `${PREFIX}${year}-${month}-${day}-${hour ?? 'x'}-${isLunar ? 'L' : 'S'}`;
}

export function saveAiCache(key: string, sections: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify({ v: CACHE_VERSION, sections }));
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
