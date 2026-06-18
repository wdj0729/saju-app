import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './upstash';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
});

export async function checkRateLimit(ip: string): Promise<boolean> {
  const { success } = await ratelimit.limit(ip);
  return success;
}

export async function getRateLimitResponse(req: NextRequest): Promise<Response | null> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous';
  if (!(await checkRateLimit(ip))) {
    return new Response('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }
  return null;
}
