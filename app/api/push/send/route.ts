import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import webpush from 'web-push';
import { redis } from '@/lib/upstash';

const PAYLOAD = JSON.stringify({
  title: '사주팔자',
  body: '오늘 운세를 확인해보세요 ✨',
});

export async function POST(req: NextRequest): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const vapidSubject = process.env.VAPID_SUBJECT;
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
    return new Response('VAPID not configured', { status: 500 });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const subs = await redis.hvals('push:subs');
  const results = await Promise.allSettled(
    (subs as string[]).map(async (raw: string) => {
      const sub = typeof raw === 'string' ? JSON.parse(raw) : raw;
      try {
        await webpush.sendNotification(sub, PAYLOAD);
      } catch (err: unknown) {
        const status =
          typeof err === 'object' && err !== null && 'statusCode' in err
            ? (err as { statusCode: number }).statusCode
            : undefined;
        if (status === 410) {
          const field = createHash('sha256').update(sub.endpoint as string).digest('hex');
          await redis.hdel('push:subs', field);
        } else {
          console.error('[push/send] sendNotification failed:', status, sub.endpoint);
        }
        throw err;
      }
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  return Response.json({ sent, failed });
}
