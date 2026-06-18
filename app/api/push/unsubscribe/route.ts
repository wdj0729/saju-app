import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { redis } from '@/lib/upstash';

export async function DELETE(req: NextRequest): Promise<Response> {
  const body = await req.json().catch(() => null);
  if (!body?.endpoint) {
    return new Response('Invalid request', { status: 400 });
  }
  const field = createHash('sha256').update(body.endpoint as string).digest('hex');
  await redis.hdel('push:subs', field);
  return new Response(null, { status: 200 });
}
