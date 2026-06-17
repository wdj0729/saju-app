# Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** API rate limiting, 오늘 운세 AI 캐시, AI 모델 중앙화, localStorage TTL, 접근성 개선 5가지를 순서대로 구현한다.

**Architecture:** 각 태스크는 독립적으로 커밋 가능하며, 권장 순서는 Task1(모델상수) → Task2(캐시TTL) → Task3(운세캐시) → Task4(rate limit) → Task5(a11y)이다.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Jest, localStorage, Anthropic SDK

---

## File Map

| 파일 | 역할 |
|------|------|
| `lib/anthropic.ts` | AI_MODEL 상수 추가 |
| `app/api/*/route.ts` (5개) | AI_MODEL 상수로 교체 |
| `lib/ai-cache.ts` | savedAt 타임스탬프 + TTL 만료, CACHE_VERSION 2, makeFortuneDayCacheKey 추가 |
| `lib/__tests__/ai-cache.test.ts` | TTL 및 makeFortuneDayCacheKey 테스트 추가 |
| `hooks/useAiText.ts` | 신규: cacheKey 지원 AI 스트리밍 훅 |
| `app/fortune/FortuneContent.tsx` | useAiStream → useAiText 교체, 운세 캐시 적용 |
| `lib/rate-limit.ts` | 신규: IP 기반 in-memory sliding window |
| `lib/__tests__/rate-limit.test.ts` | 신규: rate limit 테스트 |
| `app/api/*/route.ts` (5개) | rate limit 체크 추가 |
| `components/BottomNav.tsx` | aria-label, aria-current |
| `app/fortune/FortuneContent.tsx` | role=tablist/tab, aria-selected |
| `components/OhaengChart.tsx` | role=img, aria-label |
| `components/AiContent.tsx` | aria-live 추가 |

---

## Task 1: AI 모델명 중앙화

**Files:**
- Modify: `lib/anthropic.ts`
- Modify: `app/api/ai-analysis/route.ts`
- Modify: `app/api/compatibility-analysis/route.ts`
- Modify: `app/api/monthly-fortune/route.ts`
- Modify: `app/api/saju-analysis/route.ts`
- Modify: `app/api/yearly-fortune/route.ts`

- [ ] **Step 1: `lib/anthropic.ts`에 AI_MODEL 상수 추가**

`lib/anthropic.ts` 파일 맨 끝에 아래를 추가한다:

```typescript
export const AI_MODEL = 'claude-sonnet-4-6';
```

- [ ] **Step 2: 5개 API 라우트에서 하드코딩 제거**

각 `app/api/*/route.ts` 파일 상단 import에 `AI_MODEL`을 추가하고, `model: 'claude-sonnet-4-6'` 를 `model: AI_MODEL` 로 교체한다.

예시 (`app/api/ai-analysis/route.ts`):
```typescript
import { anthropic, AI_MODEL } from '@/lib/anthropic';
// ...
return streamAnthropicResponse({
  model: AI_MODEL,
  // ...
});
```

나머지 4개 라우트에도 동일하게 적용:
- `app/api/compatibility-analysis/route.ts`
- `app/api/monthly-fortune/route.ts`
- `app/api/saju-analysis/route.ts`
- `app/api/yearly-fortune/route.ts`

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git checkout -b improve/ai-improvements
git add lib/anthropic.ts app/api/ai-analysis/route.ts app/api/compatibility-analysis/route.ts app/api/monthly-fortune/route.ts app/api/saju-analysis/route.ts app/api/yearly-fortune/route.ts
git commit -m "refactor: AI 모델명을 lib/anthropic.ts AI_MODEL 상수로 중앙화"
```

---

## Task 2: localStorage 캐시 TTL (30일 만료)

**Files:**
- Modify: `lib/ai-cache.ts`
- Modify: `lib/__tests__/ai-cache.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/__tests__/ai-cache.test.ts` 파일 맨 끝에 아래 블록을 추가한다:

```typescript
describe('캐시 TTL 만료', () => {
  const key = 'saju-ai-cache:ttl-test';
  const sections = { 성격분석: '용감한', 재물운: '좋음', 건강운: '', 연애운: '', 직업운: '' };

  it('30일 이내 캐시는 반환됨', () => {
    const recent = Date.now() - 1000 * 60 * 60 * 24 * 29; // 29일 전
    localStorage.setItem(key, JSON.stringify({ v: 2, savedAt: recent, sections }));
    expect(loadAiCache(key)).toEqual(sections);
  });

  it('30일 초과 캐시는 null 반환', () => {
    const old = Date.now() - 1000 * 60 * 60 * 24 * 31; // 31일 전
    localStorage.setItem(key, JSON.stringify({ v: 2, savedAt: old, sections }));
    expect(loadAiCache(key)).toBeNull();
  });

  it('savedAt 없으면 null 반환', () => {
    localStorage.setItem(key, JSON.stringify({ v: 2, sections }));
    expect(loadAiCache(key)).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest lib/__tests__/ai-cache.test.ts --no-coverage
```

Expected: "캐시 TTL 만료" describe 블록의 3개 테스트 FAIL

- [ ] **Step 3: `lib/ai-cache.ts` 전체 교체**

`lib/ai-cache.ts` 전체를 아래로 교체한다 (`makeFortuneDayCacheKey`도 함께 추가):

```typescript
const PREFIX = 'saju-ai-cache:';
const CACHE_VERSION = 2;
const TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30일

export function makeAiCacheKey(
  year: number,
  month: number,
  day: number,
  hour: number | null,
  isLunar: boolean
): string {
  return `${PREFIX}${year}-${month}-${day}-${hour ?? 'x'}-${isLunar ? 'L' : 'S'}`;
}

const MONTHLY_PREFIX = 'monthly-fortune:';

export function makeMonthlyFortuneCacheKey(
  dayPillar: string,
  hourPillar: string | null,
  year: number,
  month: number
): string {
  return `${MONTHLY_PREFIX}${dayPillar}-${hourPillar ?? 'x'}:${year}:${month}`;
}

const FORTUNE_DAY_PREFIX = 'fortune-day:';

export function makeFortuneDayCacheKey(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  hour: number | null,
  isLunar: boolean,
  todayYear: number,
  todayMonth: number,
  todayDay: number
): string {
  return `${FORTUNE_DAY_PREFIX}${birthYear}-${birthMonth}-${birthDay}-${hour ?? 'x'}-${isLunar ? 'L' : 'S'}:${todayYear}-${todayMonth}-${todayDay}`;
}

export function saveAiCache(key: string, sections: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify({ v: CACHE_VERSION, savedAt: Date.now(), sections }));
  } catch {
    // quota exceeded — ignore
  }
}

export function loadAiCache(key: string): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const entry = parsed as Record<string, unknown>;
    if (entry.v !== CACHE_VERSION) return null;
    if (typeof entry.savedAt !== 'number') return null;
    if (Date.now() - entry.savedAt > TTL_MS) return null;
    if (
      typeof entry.sections !== 'object' ||
      entry.sections === null ||
      Array.isArray(entry.sections)
    )
      return null;
    return entry.sections as Record<string, string>;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest lib/__tests__/ai-cache.test.ts --no-coverage
```

Expected: 전체 PASS (기존 "버전 불일치" 테스트는 v:0이면 CACHE_VERSION 2와 불일치해 여전히 null 반환)

- [ ] **Step 5: 커밋**

```bash
git add lib/ai-cache.ts lib/__tests__/ai-cache.test.ts
git commit -m "feat: localStorage 캐시 30일 TTL 만료 추가 (CACHE_VERSION 2)"
```

---

## Task 3: 오늘 운세 AI 캐시

**Files:**
- Create: `hooks/useAiText.ts`
- Modify: `app/fortune/FortuneContent.tsx`
- Modify: `lib/__tests__/ai-cache.test.ts`

- [ ] **Step 1: `makeFortuneDayCacheKey` 테스트 추가**

`lib/__tests__/ai-cache.test.ts` import 첫 줄을 수정해 `makeFortuneDayCacheKey`를 추가한다:

```typescript
import {
  makeAiCacheKey,
  makeMonthlyFortuneCacheKey,
  makeFortuneDayCacheKey,
  saveAiCache,
  loadAiCache,
} from '../ai-cache';
```

파일 맨 끝에 테스트 블록을 추가한다:

```typescript
describe('makeFortuneDayCacheKey', () => {
  it('생일과 오늘 날짜 조합으로 키 생성', () => {
    expect(makeFortuneDayCacheKey(1990, 6, 15, null, false, 2026, 6, 17)).toBe(
      'fortune-day:1990-6-15-x-S:2026-6-17'
    );
  });

  it('시주 있으면 포함', () => {
    expect(makeFortuneDayCacheKey(1990, 6, 15, 9, true, 2026, 6, 17)).toBe(
      'fortune-day:1990-6-15-9-L:2026-6-17'
    );
  });

  it('오늘 날짜가 다르면 다른 키', () => {
    const key1 = makeFortuneDayCacheKey(1990, 6, 15, null, false, 2026, 6, 17);
    const key2 = makeFortuneDayCacheKey(1990, 6, 15, null, false, 2026, 6, 18);
    expect(key1).not.toBe(key2);
  });
});
```

- [ ] **Step 2: 테스트 통과 확인**

```bash
npx jest lib/__tests__/ai-cache.test.ts --no-coverage
```

Expected: 전체 PASS (`makeFortuneDayCacheKey`는 Task 2에서 이미 구현됨)

- [ ] **Step 3: `hooks/useAiText.ts` 신규 생성**

`hooks/useAiText.ts`를 만든다. `cacheKey`를 파라미터로 받아 초기 상태를 캐시에서 로드하고, 스트림 완료 시 저장한다:

```typescript
'use client';

import { useRef, useState } from 'react';
import { saveAiCache, loadAiCache } from '@/lib/ai-cache';
import { useStreamingRequest } from './useStreamingRequest';

interface UseAiTextReturn {
  aiText: string;
  isStreaming: boolean;
  aiError: string;
  request: (url: string, body: unknown) => Promise<void>;
}

export function useAiText(cacheKey?: string): UseAiTextReturn {
  const [aiText, setAiText] = useState<string>(() => {
    if (!cacheKey || typeof window === 'undefined') return '';
    const cached = loadAiCache(cacheKey);
    return (cached?.ai as string) ?? '';
  });
  const [aiError, setAiError] = useState('');
  const cacheKeyRef = useRef(cacheKey);
  cacheKeyRef.current = cacheKey;

  const { isStreaming, request } = useStreamingRequest({
    onStart: () => {
      setAiText('');
      setAiError('');
    },
    onChunk: (text) => setAiText(text),
    onComplete: (text) => {
      setAiText(text);
      if (cacheKeyRef.current) saveAiCache(cacheKeyRef.current, { ai: text });
    },
    onError: (msg) => {
      setAiText('');
      setAiError(msg);
    },
  });

  return { aiText, isStreaming, aiError, request };
}
```

> **동작:** `cacheKey`에 유효한 캐시가 있으면 `aiText`가 초기화 시점에 채워져 `AiContent`가 버튼 없이 바로 결과를 표시한다. 캐시가 없으면 기존과 동일하게 "분석 요청하기" 버튼이 보인다.

- [ ] **Step 4: `FortuneContent.tsx`에서 useAiStream → useAiText 교체**

`app/fortune/FortuneContent.tsx`의 import를 수정한다:

```typescript
// 제거:
import { useAiStream } from '@/hooks/useAiStream';
// 추가:
import { useAiText } from '@/hooks/useAiText';
import { makeFortuneDayCacheKey } from '@/lib/ai-cache';
```

`useCallback`, `useMemo` import에 `useMemo`가 없으면 추가한다 (이미 있음).

컴포넌트 최상단의 훅 호출 직후에 캐시 키 계산을 추가한다. `session`은 아직 로딩 중일 수 있으므로 `useMemo`로 안전하게 처리한다:

```typescript
const fortuneDayCacheKey = useMemo(() => {
  if (!session || session === 'not-found') return undefined;
  return makeFortuneDayCacheKey(
    session.input.year,
    session.input.month,
    session.input.day,
    session.input.hour,
    session.input.isLunar,
    todayDate.getFullYear(),
    todayDate.getMonth() + 1,
    todayDate.getDate()
  );
}, [session, todayDate]);

// 제거:
const { aiText, isStreaming, aiError, request } = useAiStream();
// 추가 (fortuneDayCacheKey를 훅에 전달):
const { aiText, isStreaming, aiError, request } = useAiText(fortuneDayCacheKey);
```

`handleAiRequest`는 기존 `request` 시그니처와 동일하게 유지한다 (cacheKey는 훅 내부에서 관리):

```typescript
const handleAiRequest = useCallback(() => {
  if (!session || session === 'not-found') return;
  const { ilgan, ohaeng, year, month, day, hour } = session.result;
  void request('/api/ai-analysis', {
    ilgan,
    ohaeng,
    pillars: { year, month, day, hour: hour ?? null },
  });
}, [request, session]);
```

- [ ] **Step 5: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 6: 커밋**

```bash
git add hooks/useAiText.ts app/fortune/FortuneContent.tsx lib/__tests__/ai-cache.test.ts
git commit -m "feat: 오늘 운세 AI 결과 날짜별 localStorage 캐시 적용"
```

---

## Task 4: API Rate Limiting

**Files:**
- Create: `lib/rate-limit.ts`
- Create: `lib/__tests__/rate-limit.test.ts`
- Modify: `app/api/ai-analysis/route.ts`
- Modify: `app/api/compatibility-analysis/route.ts`
- Modify: `app/api/monthly-fortune/route.ts`
- Modify: `app/api/saju-analysis/route.ts`
- Modify: `app/api/yearly-fortune/route.ts`

설계: IP 기반 sliding window. 1분 안에 동일 IP에서 10회 초과 시 429 반환. in-memory Map 사용 (서버리스 cold start마다 리셋되지만 단일 인스턴스 내에서 유효). 정기 cleanup으로 메모리 누수 방지.

- [ ] **Step 1: `lib/rate-limit.ts` 구현**

```typescript
const WINDOW_MS = 60 * 1000; // 1분
const MAX_REQUESTS = 10;

const store = new Map<string, number[]>();

function cleanup(ip: string, now: number): number[] {
  const timestamps = (store.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
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

export function _injectTimestampsForTest(ip: string, timestamps: number[]): void {
  store.set(ip, [...timestamps]);
}
```

> `_injectTimestampsForTest`는 테스트 전용 헬퍼다. 프로덕션 코드에서는 호출되지 않는다.

- [ ] **Step 2: 실패하는 테스트 작성**

`lib/__tests__/rate-limit.test.ts`를 새로 만든다:

```typescript
import { checkRateLimit, _injectTimestampsForTest } from '../rate-limit';

describe('checkRateLimit', () => {
  it('한도 내 요청은 허용됨', () => {
    const ip = 'test-ip-1';
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(ip)).toBe(true);
    }
  });

  it('한도 초과 요청은 차단됨', () => {
    const ip = 'test-ip-2';
    for (let i = 0; i < 10; i++) checkRateLimit(ip);
    expect(checkRateLimit(ip)).toBe(false);
  });

  it('IP별로 독립적으로 계산', () => {
    const ip1 = 'test-ip-3';
    const ip2 = 'test-ip-4';
    for (let i = 0; i < 10; i++) checkRateLimit(ip1);
    expect(checkRateLimit(ip2)).toBe(true);
  });

  it('윈도우(1분) 밖 요청은 카운트 안됨', () => {
    const ip = 'test-ip-5';
    const old = Date.now() - 1000 * 70; // 70초 전
    _injectTimestampsForTest(ip, Array(9).fill(old));
    // 70초 전 요청 9개는 윈도우 밖이므로 만료 → 현재 요청 1개만 카운트 → 허용
    expect(checkRateLimit(ip)).toBe(true);
  });

  it('윈도우 안 요청은 카운트됨', () => {
    const ip = 'test-ip-6';
    const recent = Date.now() - 1000 * 30; // 30초 전
    _injectTimestampsForTest(ip, Array(9).fill(recent));
    // 30초 전 요청 9개 + 현재 1개 = 10개 → 허용 (정확히 한도)
    expect(checkRateLimit(ip)).toBe(true);
    // 11번째 → 차단
    expect(checkRateLimit(ip)).toBe(false);
  });
});
```

- [ ] **Step 3: 테스트 통과 확인**

```bash
npx jest lib/__tests__/rate-limit.test.ts --no-coverage
```

Expected: 5개 PASS

- [ ] **Step 4: 각 API 라우트에 rate limit 적용**

5개 라우트 각각에 아래 패턴을 적용한다. `app/api/ai-analysis/route.ts` 예시:

import에 추가:
```typescript
import { checkRateLimit } from '@/lib/rate-limit';
```

`POST` 함수 맨 첫 줄에 추가:
```typescript
export async function POST(req: NextRequest): Promise<Response> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous';
  if (!checkRateLimit(ip)) {
    return new Response('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', { status: 429 });
  }
  // ... 기존 코드
```

동일 패턴을 나머지 4개 라우트에도 적용:
- `app/api/compatibility-analysis/route.ts`
- `app/api/monthly-fortune/route.ts`
- `app/api/saju-analysis/route.ts`
- `app/api/yearly-fortune/route.ts`

- [ ] **Step 5: 타입 체크 및 전체 테스트**

```bash
npx tsc --noEmit && npx jest --no-coverage
```

Expected: 오류 없음, 전체 PASS

- [ ] **Step 6: 커밋**

```bash
git add lib/rate-limit.ts lib/__tests__/rate-limit.test.ts \
  app/api/ai-analysis/route.ts \
  app/api/compatibility-analysis/route.ts \
  app/api/monthly-fortune/route.ts \
  app/api/saju-analysis/route.ts \
  app/api/yearly-fortune/route.ts
git commit -m "feat: API 라우트 IP 기반 rate limiting 추가 (분당 10회)"
```

---

## Task 5: 접근성(a11y) 개선

**Files:**
- Modify: `components/BottomNav.tsx`
- Modify: `app/fortune/FortuneContent.tsx`
- Modify: `components/OhaengChart.tsx`
- Modify: `components/AiContent.tsx`

- [ ] **Step 1: `BottomNav.tsx` — nav aria-label, Link aria-current**

`components/BottomNav.tsx`의 return JSX를 아래로 교체한다:

```tsx
return (
  <nav
    className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
    aria-label="주요 메뉴"
  >
    <div className="max-w-md mx-auto flex" role="tablist">
      {TABS.map(({ tab, icon, href }) => {
        const isActive = activeTab === tab;
        return (
          <Link
            key={tab}
            href={href}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? 'page' : undefined}
            aria-label={tab}
            className="flex-1 flex flex-col items-center gap-1 py-2 pb-3"
          >
            <span className="text-xl leading-none" aria-hidden="true">{icon}</span>
            <span
              className={`text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted'
              }`}
              style={
                isActive
                  ? {
                      background: 'linear-gradient(to right, #667eea, #764ba2)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }
                  : undefined
              }
            >
              {tab}
            </span>
            {isActive && (
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: 'linear-gradient(to right, #667eea, #764ba2)' }}
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </div>
  </nav>
);
```

- [ ] **Step 2: `FortuneContent.tsx` — 탭 ARIA**

`app/fortune/FortuneContent.tsx`의 탭 div를 수정한다:

```tsx
<div className="flex border-b border-border" role="tablist" aria-label="운세 기간 선택">
  {PERIODS.map((period) => (
    <button
      key={period}
      role="tab"
      aria-selected={activeTab === period}
      onClick={() => handleTabChange(period)}
      className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
        activeTab === period ? 'text-primary' : 'text-muted'
      }`}
    >
      {period}
      {activeTab === period && (
        <span
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-gradient"
          aria-hidden="true"
        />
      )}
    </button>
  ))}
</div>
```

탭 패널 div에 `role="tabpanel"` 추가:
```tsx
<div
  className="flex flex-col gap-4 px-4 py-6 flex-1"
  role="tabpanel"
  aria-label={`${activeTab} 운세`}
>
```

- [ ] **Step 3: `OhaengChart.tsx` — 차트 접근성**

`components/OhaengChart.tsx`의 컴포넌트 함수를 아래로 교체한다:

```tsx
function OhaengChart({ ohaeng }: OhaengChartProps) {
  const max = Math.max(...Object.values(ohaeng), 1);
  const total = Object.values(ohaeng).reduce((s, v) => s + v, 0);

  const summary = OHAENG_ORDER.map((key) => {
    const pct = total > 0 ? Math.round((ohaeng[key] / total) * 100) : 0;
    return `${OHAENG_LABEL[key]} ${pct}%`;
  }).join(', ');

  return (
    <div
      className="flex flex-col gap-2 w-full"
      role="img"
      aria-label={`오행 분포: ${summary}`}
    >
      {OHAENG_ORDER.map((key) => {
        const pct = total > 0 ? Math.round((ohaeng[key] / total) * 100) : 0;
        return (
          <div key={key} className="flex items-center gap-2" aria-hidden="true">
            <span className="text-sm text-muted w-4 shrink-0">{OHAENG_LABEL[key]}</span>
            <div className="flex-1 bg-card rounded-full h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${OHAENG_BAR[key]}`}
                style={{ width: `${(ohaeng[key] / max) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted w-8 text-right shrink-0">
              {pct > 0 ? `${pct}%` : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: `AiContent.tsx` — aria-live 추가**

`components/AiContent.tsx`에서 스트리밍 텍스트를 표시하는 div에 `aria-live`를 추가한다:

```tsx
if (aiText) {
  return (
    <>
      <div
        className="text-sm text-primary leading-relaxed whitespace-pre-wrap"
        aria-live="polite"
        aria-atomic="false"
      >
        {aiText}
        {isStreaming && (
          <span className="animate-pulse opacity-70" aria-hidden="true">▌</span>
        )}
      </div>
      {!isStreaming && (
        <button
          onClick={onRequest}
          className="mt-3 w-full py-2 rounded-xl bg-card-hover text-sm text-muted hover:text-primary transition-colors"
        >
          🔄 다시 분석하기
        </button>
      )}
    </>
  );
}
```

- [ ] **Step 5: 타입 체크 및 전체 테스트**

```bash
npx tsc --noEmit && npx jest --no-coverage
```

Expected: 오류 없음, 전체 PASS

- [ ] **Step 6: 커밋**

```bash
git add components/BottomNav.tsx app/fortune/FortuneContent.tsx \
  components/OhaengChart.tsx components/AiContent.tsx
git commit -m "feat: 접근성 개선 - BottomNav/탭/OhaengChart/AiContent aria 속성 추가"
```

---

## Task 6: PR 생성

- [ ] **Step 1: 전체 테스트 최종 확인**

```bash
npx jest --no-coverage && npx tsc --noEmit
```

Expected: 전체 PASS

- [ ] **Step 2: PR 생성**

```bash
git push -u origin improve/ai-improvements
gh pr create \
  --title "improve: API rate limiting, 캐시 TTL, 운세 캐시, 모델 중앙화, 접근성" \
  --body "$(cat <<'EOF'
## Summary
- AI 모델명을 \`lib/anthropic.ts\` \`AI_MODEL\` 상수로 중앙화 (5개 라우트)
- localStorage 캐시 30일 TTL 만료 추가 (CACHE_VERSION 2)
- 오늘 운세 AI 결과를 날짜별 캐시로 재방문 시 API 절약
- 5개 API 라우트에 IP 기반 rate limiting (분당 10회)
- BottomNav, 운세 탭, OhaengChart, AiContent 접근성 aria 속성 추가

## Test plan
- [ ] 사주 결과 페이지 AI 분석 → 새로고침 → 캐시에서 복원되는지 확인
- [ ] 운세 페이지 → AI 분석 → 새 탭 열어 같은 날 재방문 → 즉시 표시 확인
- [ ] API 10회 초과 호출 시 429 응답 확인
- [ ] 스크린리더 또는 axe DevTools로 탭 ARIA 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
