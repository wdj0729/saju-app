import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { redis } from '@/lib/upstash';
import { getRateLimitResponse } from '@/lib/rate-limit';
import { parseBody } from '@/lib/stream-anthropic';

interface UnsubscribeBody {
  endpoint: string;
}

function isUnsubscribeBody(v: unknown): v is UnsubscribeBody {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).endpoint === 'string'
  );
}

export async function DELETE(req: NextRequest): Promise<Response> {
  const rateLimitRes = await getRateLimitResponse(req);
  if (rateLimitRes) return rateLimitRes;

  const parsed = await parseBody(req, isUnsubscribeBody);
  if (parsed instanceof Response) return parsed;
  const { data: body } = parsed;

  const field = createHash('sha256').update(body.endpoint).digest('hex');
  try {
    await redis.hdel('push:subs', field);
    return new Response(null, { status: 200 });
  } catch (err) {
    console.error('[push] unsubscribe failed:', err);
    return new Response('Failed to remove subscription', { status: 500 });
  }
}
