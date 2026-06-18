import type { NextRequest } from 'next/server';

const WINDOW_MS = 60 * 1000; // 1분
const MAX_REQUESTS = 10;

const store = new Map<string, number[]>();

function cleanup(ip: string, now: number): number[] {
  const timestamps = (store.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length === 0) {
    store.delete(ip);
    return [];
  }
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

export function getRateLimitResponse(req: NextRequest): Response | null {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous';
  if (!checkRateLimit(ip)) {
    return new Response('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }
  return null;
}

export function _injectTimestampsForTest(ip: string, timestamps: number[]): void {
  store.set(ip, [...timestamps]);
}

export function _clearStoreForTest(): void {
  store.clear();
}
