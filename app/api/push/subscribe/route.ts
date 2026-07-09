import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { redis } from '@/lib/upstash';
import { getRateLimitResponse } from '@/lib/rate-limit';
import { parseBody } from '@/lib/stream-anthropic';

interface PushSubscriptionBody {
  endpoint: string;
  keys: Record<string, string>;
}

function isPushSubscriptionBody(v: unknown): v is PushSubscriptionBody {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.endpoint === 'string' && typeof r.keys === 'object' && r.keys !== null;
}

export async function POST(req: NextRequest): Promise<Response> {
  const rateLimitRes = await getRateLimitResponse(req);
  if (rateLimitRes) return rateLimitRes;

  const parsed = await parseBody(req, isPushSubscriptionBody);
  if (parsed instanceof Response) return parsed;
  const { data: body } = parsed;

  const field = createHash('sha256').update(body.endpoint).digest('hex');
  try {
    await redis.hset('push:subs', { [field]: JSON.stringify(body) });
    return new Response(null, { status: 201 });
  } catch (err) {
    console.error('[push] subscribe failed:', err);
    return new Response('Failed to save subscription', { status: 500 });
  }
}
