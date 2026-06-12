import type { Profile } from './profiles';
import { isProfile } from './profiles';

const KEY = 'compat-prefill-a';

export function setPrefillA(profile: Profile): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(profile));
}

export function getPrefillA(): Profile | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isProfile(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPrefillA(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}
