import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { redis } from '@/lib/upstash';
import { getRateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: NextRequest): Promise<Response> {
  const rateLimitRes = await getRateLimitResponse(req);
  if (rateLimitRes) return rateLimitRes;

  const body = await req.json().catch(() => null);
  if (!body?.endpoint || !body?.keys) {
    return new Response('Invalid subscription', { status: 400 });
  }
  const field = createHash('sha256').update(body.endpoint as string).digest('hex');
  await redis.hset('push:subs', { [field]: JSON.stringify(body) });
  return new Response(null, { status: 201 });
}
