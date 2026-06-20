export interface SajuSharePayload {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  isLunar: boolean;
  gender: 'M' | 'F';
  name?: string;
}

export function encodeSajuShare(payload: SajuSharePayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeSajuShare(encoded: string): SajuSharePayload | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return isSajuSharePayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isSajuSharePayload(v: unknown): v is SajuSharePayload {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  const currentYear = new Date().getFullYear();
  return (
    typeof r.year === 'number' &&
    r.year >= 1900 &&
    r.year <= currentYear &&
    typeof r.month === 'number' &&
    r.month >= 1 &&
    r.month <= 12 &&
    typeof r.day === 'number' &&
    r.day >= 1 &&
    r.day <= 31 &&
    (r.hour === null || (typeof r.hour === 'number' && r.hour >= 0 && r.hour <= 23)) &&
    typeof r.isLunar === 'boolean' &&
    (r.gender === 'M' || r.gender === 'F') &&
    (r.name === undefined || typeof r.name === 'string')
  );
}
