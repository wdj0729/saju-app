import type { Profile } from './profiles';

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
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function clearPrefillA(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}
