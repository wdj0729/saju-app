# Analytics / PWA Push / Redis Rate Limiting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vercel Analytics 추가, Redis 기반 Rate Limiting 교체, 매일 KST 09:00 운세 Web Push 알림 구현

**Architecture:** 단일 Upstash Redis 인스턴스를 Rate Limiting과 Push 구독 저장소로 공유. `lib/upstash.ts`에서 Redis 클라이언트 싱글톤 관리. Web Push는 VAPID 키 + `web-push` 라이브러리 + Vercel Cron으로 구현.

**Tech Stack:** @vercel/analytics, @upstash/ratelimit, @upstash/redis, web-push, @types/web-push, @ducanh2912/next-pwa (customWorkerSrc)

---

## 파일 구조

| 상태 | 파일 | 역할 |
|------|------|------|
| 수정 | `app/layout.tsx` | Analytics 컴포넌트 추가 |
| 신규 | `lib/upstash.ts` | Redis 클라이언트 싱글톤 |
| 수정 | `lib/rate-limit.ts` | Upstash Ratelimit으로 교체 (async) |
| 수정 | `lib/__tests__/rate-limit.test.ts` | 테스트 재작성 (Upstash 모킹) |
| 수정 | `app/api/ai-analysis/route.ts` | `await getRateLimitResponse` |
| 수정 | `app/api/compatibility-analysis/route.ts` | `await getRateLimitResponse` |
| 수정 | `app/api/saju-analysis/route.ts` | `await getRateLimitResponse` |
| 수정 | `app/api/yearly-fortune/route.ts` | `await getRateLimitResponse` |
| 수정 | `app/api/monthly-fortune/route.ts` | `await getRateLimitResponse` |
| 신규 | `app/api/push/subscribe/route.ts` | 구독 저장 API |
| 신규 | `app/api/push/unsubscribe/route.ts` | 구독 삭제 API |
| 신규 | `app/api/push/send/route.ts` | Cron 발송 API |
| 신규 | `worker/index.ts` | SW push/notificationclick 핸들러 |
| 수정 | `next.config.ts` | customWorkerSrc 설정 추가 |
| 신규 | `vercel.json` | Cron 스케줄 설정 |
| 신규 | `components/PushNotificationToggle.tsx` | 구독 토글 UI |
| 수정 | `app/page.tsx` | PushNotificationToggle 추가 |

---

## Task 1: 패키지 설치

**Files:** `package.json`

- [ ] **Step 1: 패키지 설치**

```bash
npm install @vercel/analytics @upstash/ratelimit @upstash/redis web-push
npm install --save-dev @types/web-push
```

- [ ] **Step 2: 설치 확인**

```bash
node -e "require('@vercel/analytics'); require('@upstash/ratelimit'); require('@upstash/redis'); require('web-push'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore: add analytics, upstash, web-push packages"
```

---

## Task 2: Vercel Analytics

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Analytics 컴포넌트 추가**

`app/layout.tsx`의 `</body>` 바로 앞에 추가:

```tsx
import { Analytics } from '@vercel/analytics/react';

// RootLayout body 안, </body> 바로 앞:
<Analytics />
```

전체 return 블록:
```tsx
return (
  <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
    <body className="bg-base min-h-screen text-primary">
      <ServiceWorkerRegistrar />
      <div className="max-w-md mx-auto min-h-screen flex flex-col pb-20">{children}</div>
      <BottomNav />
      <Analytics />
    </body>
  </html>
);
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add app/layout.tsx
git commit -m "feat: add Vercel Analytics"
```

---

## Task 3: Upstash Redis 클라이언트 싱글톤

**Files:**
- Create: `lib/upstash.ts`

- [ ] **Step 1: 파일 생성**

```ts
// lib/upstash.ts
import { Redis } from '@upstash/redis';

export const redis = Redis.fromEnv();
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음 (환경변수 없어도 타입 오류는 없음)

- [ ] **Step 3: 커밋**

```bash
git add lib/upstash.ts
git commit -m "feat: add Upstash Redis singleton"
```

---

## Task 4: Redis 기반 Rate Limiting

**Files:**
- Modify: `lib/rate-limit.ts`
- Modify: `lib/__tests__/rate-limit.test.ts`
- Modify: `app/api/ai-analysis/route.ts`
- Modify: `app/api/compatibility-analysis/route.ts`
- Modify: `app/api/saju-analysis/route.ts`
- Modify: `app/api/yearly-fortune/route.ts`
- Modify: `app/api/monthly-fortune/route.ts`

- [ ] **Step 1: 테스트 재작성 (실패 확인용)**

`lib/__tests__/rate-limit.test.ts` 전체 교체:

```ts
const mockLimit = jest.fn();

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn(() => ({ limit: mockLimit })),
}));

jest.mock('@upstash/redis', () => ({
  Redis: { fromEnv: jest.fn(() => ({})) },
}));

import { checkRateLimit, getRateLimitResponse } from '../rate-limit';
import { NextRequest } from 'next/server';

describe('checkRateLimit', () => {
  beforeEach(() => mockLimit.mockReset());

  it('허용 응답 시 true 반환', async () => {
    mockLimit.mockResolvedValueOnce({ success: true });
    expect(await checkRateLimit('1.2.3.4')).toBe(true);
  });

  it('차단 응답 시 false 반환', async () => {
    mockLimit.mockResolvedValueOnce({ success: false });
    expect(await checkRateLimit('1.2.3.4')).toBe(false);
  });

  it('IP별로 독립적으로 limit 호출', async () => {
    mockLimit.mockResolvedValue({ success: true });
    await checkRateLimit('1.1.1.1');
    await checkRateLimit('2.2.2.2');
    expect(mockLimit).toHaveBeenNthCalledWith(1, '1.1.1.1');
    expect(mockLimit).toHaveBeenNthCalledWith(2, '2.2.2.2');
  });
});

describe('getRateLimitResponse', () => {
  beforeEach(() => mockLimit.mockReset());

  it('허용 시 null 반환', async () => {
    mockLimit.mockResolvedValueOnce({ success: true });
    const req = new NextRequest('http://localhost/api/test');
    expect(await getRateLimitResponse(req)).toBeNull();
  });

  it('차단 시 429 응답 반환', async () => {
    mockLimit.mockResolvedValueOnce({ success: false });
    const req = new NextRequest('http://localhost/api/test');
    const res = await getRateLimitResponse(req);
    expect(res?.status).toBe(429);
  });

  it('x-forwarded-for IP 추출', async () => {
    mockLimit.mockResolvedValueOnce({ success: true });
    const req = new NextRequest('http://localhost/api/test', {
      headers: { 'x-forwarded-for': '5.5.5.5, 6.6.6.6' },
    });
    await getRateLimitResponse(req);
    expect(mockLimit).toHaveBeenCalledWith('5.5.5.5');
  });

  it('IP 없으면 anonymous 사용', async () => {
    mockLimit.mockResolvedValueOnce({ success: true });
    const req = new NextRequest('http://localhost/api/test');
    await getRateLimitResponse(req);
    expect(mockLimit).toHaveBeenCalledWith('anonymous');
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
npx jest lib/__tests__/rate-limit.test.ts --no-coverage
```

Expected: 현재 `checkRateLimit`가 async가 아니므로 실패

- [ ] **Step 3: lib/rate-limit.ts 교체**

```ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest lib/__tests__/rate-limit.test.ts --no-coverage
```

Expected: 5개 테스트 모두 PASS

- [ ] **Step 5: 5개 API 라우트에 await 추가**

각 파일에서 `getRateLimitResponse(req)` → `await getRateLimitResponse(req)` 로 변경:

`app/api/ai-analysis/route.ts`:
```ts
const rateLimitRes = await getRateLimitResponse(req);
```

`app/api/compatibility-analysis/route.ts`:
```ts
const rateLimitRes = await getRateLimitResponse(req);
```

`app/api/saju-analysis/route.ts`:
```ts
const rateLimitRes = await getRateLimitResponse(req);
```

`app/api/yearly-fortune/route.ts`:
```ts
const rateLimitRes = await getRateLimitResponse(req);
```

`app/api/monthly-fortune/route.ts`:
```ts
const rateLimitRes = await getRateLimitResponse(req);
```

- [ ] **Step 6: 타입 체크 + 전체 테스트**

```bash
npx tsc --noEmit && npx jest --no-coverage
```

Expected: 타입 오류 없음, 모든 테스트 PASS

- [ ] **Step 7: 커밋**

```bash
git add lib/rate-limit.ts lib/__tests__/rate-limit.test.ts \
  app/api/ai-analysis/route.ts app/api/compatibility-analysis/route.ts \
  app/api/saju-analysis/route.ts app/api/yearly-fortune/route.ts \
  app/api/monthly-fortune/route.ts
git commit -m "feat: replace in-memory rate limiting with Upstash Redis"
```

---

## Task 5: Push 구독 API 라우트

**Files:**
- Create: `app/api/push/subscribe/route.ts`
- Create: `app/api/push/unsubscribe/route.ts`
- Create: `app/api/push/send/route.ts`
- Create: `vercel.json`

- [ ] **Step 1: subscribe 라우트 생성**

```ts
// app/api/push/subscribe/route.ts
import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { redis } from '@/lib/upstash';

export async function POST(req: NextRequest): Promise<Response> {
  const body = await req.json().catch(() => null);
  if (!body?.endpoint || !body?.keys) {
    return new Response('Invalid subscription', { status: 400 });
  }
  const field = createHash('sha256').update(body.endpoint as string).digest('hex');
  await redis.hset('push:subs', { [field]: JSON.stringify(body) });
  return new Response(null, { status: 201 });
}
```

- [ ] **Step 2: unsubscribe 라우트 생성**

```ts
// app/api/push/unsubscribe/route.ts
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
```

- [ ] **Step 3: send 라우트 생성 (Cron 전용)**

```ts
// app/api/push/send/route.ts
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
    subs.map(async (raw) => {
      const sub = typeof raw === 'string' ? JSON.parse(raw) : raw;
      try {
        await webpush.sendNotification(sub, PAYLOAD);
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
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
```

- [ ] **Step 4: vercel.json 생성 (Cron 스케줄)**

```json
{
  "crons": [
    {
      "path": "/api/push/send",
      "schedule": "0 0 * * *"
    }
  ]
}
```

UTC 00:00 = KST 09:00

- [ ] **Step 5: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 6: 커밋**

```bash
git add app/api/push/ vercel.json
git commit -m "feat: add push notification API routes and cron schedule"
```

---

## Task 6: Service Worker Push 핸들러

**Files:**
- Create: `worker/index.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: worker/index.ts 생성**

```ts
// worker/index.ts
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() as { title?: string; body?: string } | undefined;
  event.waitUntil(
    self.registration.showNotification(data?.title ?? '사주팔자', {
      body: data?.body ?? '오늘 운세를 확인해보세요 ✨',
      icon: '/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/fortune') && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/fortune');
    })
  );
});
```

- [ ] **Step 2: next.config.ts에 customWorkerSrc 추가**

```ts
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerSrc: 'worker',
});

export default withPWA({
  turbopack: {},
});
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add worker/index.ts next.config.ts
git commit -m "feat: add service worker push and notificationclick handlers"
```

---

## Task 7: 환경변수 설정 가이드

이 태스크는 코드가 아닌 설정 작업이다. 실제 배포 전 반드시 완료해야 한다.

- [ ] **Step 1: VAPID 키 생성**

```bash
npx web-push generate-vapid-keys
```

출력 예시:
```
Public Key: BExamp...
Private Key: 1examp...
```

- [ ] **Step 2: Upstash 콘솔에서 Redis 생성**

1. https://console.upstash.com 접속
2. Redis → Create Database
3. `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` 값 복사

- [ ] **Step 3: 로컬 .env.local 설정**

```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
VAPID_PUBLIC_KEY=BExamp...
VAPID_PRIVATE_KEY=1examp...
VAPID_SUBJECT=mailto:wdj930729@gmail.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BExamp...
CRON_SECRET=<random-string-32자-이상>
```

- [ ] **Step 4: Vercel 환경변수 동일하게 설정**

```bash
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add VAPID_PUBLIC_KEY
vercel env add VAPID_PRIVATE_KEY
vercel env add VAPID_SUBJECT
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY
vercel env add CRON_SECRET
```

---

## Task 8: Push 구독 UI

**Files:**
- Create: `components/PushNotificationToggle.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: PushNotificationToggle 컴포넌트 생성**

```tsx
// components/PushNotificationToggle.tsx
'use client';

import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

const STORAGE_KEY = 'push-subscribed';

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!('PushManager' in window) || !('serviceWorker' in navigator)) return;
    setSupported(true);
    setSubscribed(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  if (!supported) return null;

  async function handleToggle() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch('/api/push/unsubscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        localStorage.removeItem(STORAGE_KEY);
        setSubscribed(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        });
        localStorage.setItem(STORAGE_KEY, 'true');
        setSubscribed(true);
      }
    } catch (err) {
      console.error('[push] toggle failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="w-full bg-card-hover rounded-2xl px-3 py-2 text-xs text-left flex items-center justify-between"
    >
      <span className="text-primary">🔔 매일 운세 알림 받기</span>
      <span className={`text-xs ${subscribed ? 'text-hwa' : 'text-muted'}`}>
        {loading ? '...' : subscribed ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
```

- [ ] **Step 2: app/page.tsx에 PushNotificationToggle 추가**

`app/page.tsx` import에 추가:
```tsx
import PushNotificationToggle from '@/components/PushNotificationToggle';
```

`<div className="flex flex-col gap-3 w-full">` (운세 카드 목록 div) 바로 위에 추가:

```tsx
<div className="w-full mb-4">
  <PushNotificationToggle />
</div>
<div className="flex flex-col gap-3 w-full">
```

이 위치는 프로필 섹션 아래, 운세 카드 위로, 프로필 존재 여부와 관계없이 항상 표시된다.

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 전체 테스트**

```bash
npx jest --no-coverage
```

Expected: 모든 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add components/PushNotificationToggle.tsx app/page.tsx
git commit -m "feat: add push notification subscribe toggle on home page"
```

---

## Task 9: 빌드 확인 및 최종 커밋

- [ ] **Step 1: 프로덕션 빌드**

```bash
npm run build
```

Expected: 오류 없이 빌드 완료

- [ ] **Step 2: ESLint**

```bash
npm run lint
```

Expected: 오류 없음

- [ ] **Step 3: 배포 (환경변수 설정 후)**

```bash
vercel --prod
```

- [ ] **Step 4: Cron 동작 수동 테스트**

```bash
curl -X POST https://<your-domain>/api/push/send \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Expected: `{"sent": N, "failed": 0}`
