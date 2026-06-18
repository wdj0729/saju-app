# Design: Analytics, PWA Push Notifications, Redis Rate Limiting

Date: 2026-06-18

## Overview

세 가지 인프라/기능 개선을 단일 Upstash Redis 인스턴스 위에 구현한다.

1. Vercel Analytics — 페이지뷰/경로 수집
2. PWA Web Push — 매일 KST 09:00 운세 알림
3. Redis Rate Limiting — in-memory → Upstash 교체

---

## 1. Vercel Analytics

### 변경 파일
- `app/layout.tsx` — `<Analytics />` 컴포넌트 추가

### 구현
```
npm install @vercel/analytics
```
`app/layout.tsx` body 끝에 `<Analytics />` 삽입. 추가 설정 없음.

---

## 2. PWA Push Notifications

### 인프라
- **Upstash Redis** 1개 (Rate Limit과 공유)
- **VAPID 키 쌍** — `web-push` CLI로 생성, 환경변수에 저장
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `VAPID_SUBJECT` (예: `mailto:admin@example.com`)

### Redis 데이터 구조
```
Hash: push:subs
  field: sha256(endpoint)
  value: JSON.stringify(PushSubscription)
```

### API Routes

**`POST /api/push/subscribe`**
- Body: `{ subscription: PushSubscription }`
- 동작: `HSET push:subs <hash> <json>`
- 응답: 200 OK

**`DELETE /api/push/unsubscribe`**
- Body: `{ endpoint: string }`
- 동작: `HDEL push:subs <hash>`
- 응답: 200 OK

**`POST /api/push/send`** (Cron 전용, Authorization 헤더로 보호)
- 동작: `HVALS push:subs` → 전체 구독 순회 → `web-push.sendNotification()` 일괄 발송
- 만료된 구독(410 Gone)은 자동 삭제
- Payload:
  ```json
  {
    "title": "사주팔자",
    "body": "오늘 운세를 확인해보세요 ✨",
    "url": "/fortune"
  }
  ```

### Vercel Cron (`vercel.json`)
```json
{
  "crons": [{ "path": "/api/push/send", "schedule": "0 0 * * *" }]
}
```
UTC 00:00 = KST 09:00

### Service Worker
`@ducanh2912/next-pwa`가 생성하는 SW에 커스텀 핸들러를 주입하는 방식 사용.
`public/sw-push.js` 파일 생성 후 `next.config.ts`의 `customWorkerSrc` 옵션으로 병합.

```js
// push 이벤트
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
    })
  );
});

// 알림 클릭 → /fortune
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/fortune'));
});
```

### 구독 UI
홈 페이지(`app/page.tsx`) 프로필 섹션 하단에 "매일 운세 알림 받기" 토글.
- 구독 상태: `localStorage.getItem('push-subscribed')` 로 캐시
- 버튼 클릭 → `Notification.requestPermission()` → `navigator.serviceWorker.ready` → `pushManager.subscribe()` → `POST /api/push/subscribe`
- 구독 해제: `DELETE /api/push/unsubscribe` → `pushManager.unsubscribe()`

### 환경 요구사항
- HTTPS (Vercel 배포 시 기본 충족)
- 브라우저 푸시 알림 권한

---

## 3. Redis Rate Limiting

### 변경 파일
- `lib/rate-limit.ts` — Upstash 기반으로 교체

### 패키지
```
npm install @upstash/ratelimit @upstash/redis
```

### 환경변수 (Upstash 공유 인스턴스)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### 구현
```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
});

export async function checkRateLimit(ip: string): Promise<boolean> {
  const { success } = await ratelimit.limit(ip);
  return success;
}
```

`getRateLimitResponse`를 async로 변경하여 API route에서 `await` 사용.

### 테스트 전략
- `lib/rate-limit.ts`에서 Redis 클라이언트를 주입 가능하도록 분리
- Jest 테스트에서는 in-memory mock 사용 (`_injectTimestampsForTest` / `_clearStoreForTest` 유지)
- 실제 Upstash 연동은 통합 테스트로 분리

---

## 구현 순서

1. Upstash Redis 생성 및 환경변수 설정
2. Vercel Analytics 추가 (1개 파일)
3. Redis Rate Limiting 교체 (기존 테스트 통과 확인)
4. Push 알림 API routes + Cron 설정
5. Service Worker 커스텀 핸들러
6. 구독 UI (홈 페이지)
7. 로컬 테스트 → 배포 확인
