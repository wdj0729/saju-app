import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import webpush from 'web-push';
import { redis } from '@/lib/upstash';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const PAYLOAD = JSON.stringify({
  title: '사주팔자',
  body: '오늘 운세를 확인해보세요 ✨',
});

export async function POST(req: NextRequest): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const subs = await redis.hvals('push:subs');
  const results = await Promise.allSettled(
    (subs as string[]).map(async (raw: string) => {
      const sub = typeof raw === 'string' ? JSON.parse(raw) : raw;
      try {
        await webpush.sendNotification(sub, PAYLOAD);
      } catch (err: unknown) {
        if (
          typeof err === 'object' &&
          err !== null &&
          'statusCode' in err &&
          (err as { statusCode: number }).statusCode === 410
        ) {
          const field = createHash('sha256').update(sub.endpoint as string).digest('hex');
          await redis.hdel('push:subs', field);
        }
        throw err;
      }
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  return Response.json({ sent, failed });
}
