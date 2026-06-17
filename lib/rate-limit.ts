const WINDOW_MS = 60 * 1000; // 1분
const MAX_REQUESTS = 10;

const store = new Map<string, number[]>();

function cleanup(ip: string, now: number): number[] {
  const timestamps = (store.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  store.set(ip, timestamps);
  return timestamps;
}

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = cleanup(ip, now);
  if (timestamps.length >= MAX_REQUESTS) return false;
  timestamps.push(now);
  store.set(ip, timestamps);
  return true;
}

export function _injectTimestampsForTest(ip: string, timestamps: number[]): void {
  store.set(ip, [...timestamps]);
}
