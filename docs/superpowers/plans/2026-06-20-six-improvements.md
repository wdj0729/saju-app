# saju-app 6개 개선사항 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redis AI 캐싱, 스트리밍 에러 복구, 사주 URL 공유, sitemap/robots, 프로필 export/import, 대운 연도 레이블 6가지를 추가한다.

**Architecture:** 각 태스크는 독립적으로 배포 가능하다. Redis 캐싱은 서버 라우트에만 영향을 미치고, 나머지 5개는 클라이언트 코드만 건드린다. 기존 `invite.ts` 패턴을 그대로 재활용한다.

**Tech Stack:** Next.js 15 App Router, TypeScript, Upstash Redis (`@upstash/redis`), Tailwind CSS, Jest

---

## 파일 변경 요약

| 파일 | 유형 |
|------|------|
| `lib/redis-ai-cache.ts` | 신규 |
| `lib/__tests__/redis-ai-cache.test.ts` | 신규 |
| `lib/stream-anthropic.ts` | 수정 — `streamAnthropicResponseWithCache` 추가 |
| `app/api/saju-analysis/route.ts` | 수정 — Redis 캐시 체크 추가 |
| `app/api/ai-analysis/route.ts` | 수정 — Redis 캐시 체크 추가 |
| `app/api/yearly-fortune/route.ts` | 수정 — Redis 캐시 체크 추가 |
| `hooks/useSections.ts` | 수정 — 에러 시 partial 보존 |
| `hooks/useAiText.ts` | 수정 — 에러 시 partial 보존 |
| `components/AiSections.tsx` | 수정 — 에러 배너 인라인 표시 |
| `components/AiContent.tsx` | 수정 — 에러 배너 인라인 표시 |
| `lib/saju-share.ts` | 신규 |
| `lib/__tests__/saju-share.test.ts` | 신규 |
| `app/saju/share/page.tsx` | 신규 |
| `app/saju/result/SajuResultContent.tsx` | 수정 — 링크 공유 버튼 추가 |
| `app/sitemap.ts` | 신규 |
| `app/robots.ts` | 신규 |
| `lib/profiles.ts` | 수정 — `exportProfiles`, `parseImportedProfiles`, `importProfiles` 추가 |
| `lib/__tests__/profiles.test.ts` | 수정 — 신규 함수 테스트 추가 |
| `app/page.tsx` | 수정 — export/import UI 추가 |
| `components/DaewoonChart.tsx` | 수정 — `birthYear` prop, 연도 레이블 추가 |

---

## Task 1: Redis AI 캐시 라이브러리 (`lib/redis-ai-cache.ts`)

**Files:**
- Create: `lib/redis-ai-cache.ts`
- Create: `lib/__tests__/redis-ai-cache.test.ts`

- [ ] **Step 1: 테스트 작성**

```ts
// lib/__tests__/redis-ai-cache.test.ts
const mockGet = jest.fn();
const mockSet = jest.fn();

jest.mock('@upstash/redis', () => ({
  Redis: { fromEnv: jest.fn(() => ({ get: mockGet, set: mockSet })) },
}));

import {
  getRedisAiCache,
  setRedisAiCache,
  makeSajuAnalysisCacheKey,
  makeAiAnalysisCacheKey,
  makeYearlyFortuneCacheKey,
} from '../redis-ai-cache';
import type { PillarData } from '../stream-anthropic';

const PILLARS = {
  year: { gan: '甲', ji: '子' } as PillarData,
  month: { gan: '乙', ji: '丑' } as PillarData,
  day: { gan: '丙', ji: '寅' } as PillarData,
  hour: null,
};

beforeEach(() => {
  mockGet.mockReset();
  mockSet.mockReset();
});

describe('getRedisAiCache', () => {
  it('값이 있으면 string 반환', async () => {
    mockGet.mockResolvedValueOnce('cached text');
    expect(await getRedisAiCache('key')).toBe('cached text');
  });

  it('값이 없으면 null 반환', async () => {
    mockGet.mockResolvedValueOnce(null);
    expect(await getRedisAiCache('key')).toBeNull();
  });

  it('Redis 에러 시 null 반환 (예외 미전파)', async () => {
    mockGet.mockRejectedValueOnce(new Error('connection error'));
    expect(await getRedisAiCache('key')).toBeNull();
  });
});

describe('setRedisAiCache', () => {
  it('redis.set을 key/value/ex 옵션과 함께 호출', async () => {
    mockSet.mockResolvedValueOnce('OK');
    await setRedisAiCache('key', 'text', 3600);
    expect(mockSet).toHaveBeenCalledWith('key', 'text', { ex: 3600 });
  });

  it('Redis 에러 시 예외 미전파', async () => {
    mockSet.mockRejectedValueOnce(new Error('fail'));
    await expect(setRedisAiCache('key', 'text')).resolves.toBeUndefined();
  });
});

describe('makeSajuAnalysisCacheKey', () => {
  it('시 없는 경우 x 포함', () => {
    const key = makeSajuAnalysisCacheKey(PILLARS, 'M', 1990, 2026);
    expect(key).toBe('server-ai:saju:v1:甲子.乙丑.丙寅.x-M-1990-2026');
  });

  it('시 있는 경우 포함', () => {
    const pillarsWithHour = { ...PILLARS, hour: { gan: '丁', ji: '卯' } as PillarData };
    const key = makeSajuAnalysisCacheKey(pillarsWithHour, 'F', 1990, 2026);
    expect(key).toBe('server-ai:saju:v1:甲子.乙丑.丙寅.丁卯-F-1990-2026');
  });

  it('gender 없으면 x', () => {
    const key = makeSajuAnalysisCacheKey(PILLARS, undefined, 1990, 2026);
    expect(key).toContain('-x-');
  });
});

describe('makeAiAnalysisCacheKey', () => {
  it('날짜 포함 키 생성', () => {
    const key = makeAiAnalysisCacheKey(PILLARS, 2026, 6, 20);
    expect(key).toBe('server-ai:fortune:v1:甲子.乙丑.丙寅.x:2026-6-20');
  });
});

describe('makeYearlyFortuneCacheKey', () => {
  it('fortuneYear 포함 키 생성', () => {
    const key = makeYearlyFortuneCacheKey(PILLARS, 'M', 2026);
    expect(key).toBe('server-ai:yearly:v1:甲子.乙丑.丙寅.x-M-2026');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest lib/__tests__/redis-ai-cache.test.ts --no-coverage
```

Expected: `Cannot find module '../redis-ai-cache'`

- [ ] **Step 3: 구현**

```ts
// lib/redis-ai-cache.ts
import { redis } from './upstash';
import type { PillarData } from './stream-anthropic';

function pillarKey(pillars: {
  year: PillarData;
  month: PillarData;
  day: PillarData;
  hour: PillarData | null;
}): string {
  const h = pillars.hour ? `${pillars.hour.gan}${pillars.hour.ji}` : 'x';
  return `${pillars.year.gan}${pillars.year.ji}.${pillars.month.gan}${pillars.month.ji}.${pillars.day.gan}${pillars.day.ji}.${h}`;
}

export function makeSajuAnalysisCacheKey(
  pillars: { year: PillarData; month: PillarData; day: PillarData; hour: PillarData | null },
  gender: 'M' | 'F' | undefined,
  birthYear: number,
  todayYear: number
): string {
  return `server-ai:saju:v1:${pillarKey(pillars)}-${gender ?? 'x'}-${birthYear}-${todayYear}`;
}

export function makeAiAnalysisCacheKey(
  pillars: { year: PillarData; month: PillarData; day: PillarData; hour: PillarData | null },
  todayYear: number,
  todayMonth: number,
  todayDay: number
): string {
  return `server-ai:fortune:v1:${pillarKey(pillars)}:${todayYear}-${todayMonth}-${todayDay}`;
}

export function makeYearlyFortuneCacheKey(
  pillars: { year: PillarData; month: PillarData; day: PillarData; hour: PillarData | null },
  gender: 'M' | 'F' | undefined,
  fortuneYear: number
): string {
  return `server-ai:yearly:v1:${pillarKey(pillars)}-${gender ?? 'x'}-${fortuneYear}`;
}

export async function getRedisAiCache(key: string): Promise<string | null> {
  try {
    const val = await redis.get<string>(key);
    return val ?? null;
  } catch {
    return null;
  }
}

export async function setRedisAiCache(key: string, text: string, ttlSeconds = 2592000): Promise<void> {
  try {
    await redis.set(key, text, { ex: ttlSeconds });
  } catch {
    // Redis 실패가 응답을 막지 않도록 무시
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest lib/__tests__/redis-ai-cache.test.ts --no-coverage
```

Expected: All tests pass

- [ ] **Step 5: 커밋**

```bash
git add lib/redis-ai-cache.ts lib/__tests__/redis-ai-cache.test.ts
git commit -m "feat: Redis AI 캐시 라이브러리 추가"
```

---

## Task 2: `streamAnthropicResponseWithCache` 추가 (`lib/stream-anthropic.ts`)

**Files:**
- Modify: `lib/stream-anthropic.ts`

- [ ] **Step 1: `streamAnthropicResponseWithCache` 함수 추가**

`lib/stream-anthropic.ts`의 `streamAnthropicResponse` 함수 아래에 추가:

```ts
export function streamAnthropicResponseWithCache(
  params: MessageStreamParams,
  saveFn: (text: string) => Promise<void>
): Response {
  const stream = anthropic.messages.stream(params);

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const chunks: string[] = [];
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            chunks.push(event.delta.text);
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
        void saveFn(chunks.join(''));
      } catch (err) {
        console.error('[stream-anthropic] error:', err);
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add lib/stream-anthropic.ts
git commit -m "feat: streamAnthropicResponseWithCache 추가"
```

---

## Task 3: 3개 API 라우트에 Redis 캐싱 적용

**Files:**
- Modify: `app/api/saju-analysis/route.ts`
- Modify: `app/api/ai-analysis/route.ts`
- Modify: `app/api/yearly-fortune/route.ts`

- [ ] **Step 1: `saju-analysis/route.ts` 수정**

기존 imports 아래에 추가:
```ts
import {
  getRedisAiCache,
  setRedisAiCache,
  makeSajuAnalysisCacheKey,
} from '@/lib/redis-ai-cache';
import { streamAnthropicResponseWithCache } from '@/lib/stream-anthropic';
```

`streamAnthropicResponse` import에서 제거하고 `streamAnthropicResponseWithCache`만 쓰면 됨.

`POST` 함수에서 `const { ilgan, ohaeng, pillars, name, gender, birthYear, currentAge, currentDaewoon } = parsed.data;` 다음에 추가:

```ts
  const today = new Date();
  const cacheKey = makeSajuAnalysisCacheKey(pillars, gender, birthYear, today.getFullYear());
  const cached = await getRedisAiCache(cacheKey);
  if (cached) {
    return new Response(cached, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
```

그리고 `try` 블록 내부의 `return streamAnthropicResponse({...})` 를 아래로 교체:

```ts
    return streamAnthropicResponseWithCache(
      { model: AI_MODEL, max_tokens: 2048, messages: [{ role: 'user', content: lines }] },
      (text) => setRedisAiCache(cacheKey, text, 2592000)
    );
```

- [ ] **Step 2: `ai-analysis/route.ts` 수정**

기존 imports 아래에 추가:
```ts
import {
  getRedisAiCache,
  setRedisAiCache,
  makeAiAnalysisCacheKey,
} from '@/lib/redis-ai-cache';
import { streamAnthropicResponseWithCache } from '@/lib/stream-anthropic';
```

`POST` 함수에서 `const today = new Date();` 바로 다음에 추가:

```ts
  const cacheKey = makeAiAnalysisCacheKey(
    pillars,
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );
  const cached = await getRedisAiCache(cacheKey);
  if (cached) {
    return new Response(cached, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
```

`return streamAnthropicResponse({...})` 를 아래로 교체:

```ts
    return streamAnthropicResponseWithCache(
      { model: AI_MODEL, max_tokens: 1024, messages: [{ role: 'user', content: `...` }] },
      (text) => setRedisAiCache(cacheKey, text, 86400)
    );
```

(messages content는 기존 코드 그대로 사용, TTL은 86400 = 1일)

- [ ] **Step 3: `yearly-fortune/route.ts` 수정**

기존 imports 아래에 추가:
```ts
import {
  getRedisAiCache,
  setRedisAiCache,
  makeYearlyFortuneCacheKey,
} from '@/lib/redis-ai-cache';
import { streamAnthropicResponseWithCache } from '@/lib/stream-anthropic';
```

`POST` 함수에서 `const fortuneYear = getFortuneYear();` 다음에 추가:

```ts
  const cacheKey = makeYearlyFortuneCacheKey(pillars, gender, fortuneYear);
  const cached = await getRedisAiCache(cacheKey);
  if (cached) {
    return new Response(cached, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
```

`return streamAnthropicResponse({...})` 를 교체:

```ts
    return streamAnthropicResponseWithCache(
      { model: AI_MODEL, max_tokens: 2048, messages: [{ role: 'user', content: lines }] },
      (text) => setRedisAiCache(cacheKey, text, 2592000)
    );
```

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add app/api/saju-analysis/route.ts app/api/ai-analysis/route.ts app/api/yearly-fortune/route.ts
git commit -m "feat: 3개 AI API 라우트에 Redis 캐싱 적용"
```

---

## Task 4: 스트리밍 에러 시 부분 결과 보존

**Files:**
- Modify: `hooks/useSections.ts`
- Modify: `hooks/useAiText.ts`
- Modify: `components/AiSections.tsx`
- Modify: `components/AiContent.tsx`

- [ ] **Step 1: `hooks/useSections.ts` — 에러 시 sections 유지**

`onError` 콜백을 찾아서 변경:

```ts
// 변경 전
onError: (msg) => {
  setSections(empty());
  setActiveSection(null);
  setAiError(msg);
},

// 변경 후
onError: (msg) => {
  setActiveSection(null);
  setAiError(msg);
},
```

- [ ] **Step 2: `hooks/useAiText.ts` — 에러 시 aiText 유지**

`onError` 콜백을 찾아서 변경:

```ts
// 변경 전
onError: (msg) => {
  if (cacheKey) {
    const cached = loadAiCache(cacheKey);
    if (cached?.ai) {
      setAiError(msg);
      return;
    }
  }
  setAiText('');
  setAiError(msg);
},

// 변경 후
onError: (msg) => {
  setAiError(msg);
},
```

- [ ] **Step 3: `components/AiSections.tsx` — 에러 배너 인라인 표시**

기존 `if (aiError && !hasContent)` 블록을 제거하고, 반환 JSX의 `<div className="flex flex-col gap-4">` 상단에 에러 배너를 추가:

```tsx
// 제거: if (aiError && !hasContent) { ... }

// return 내부 flex 컨테이너 최상단에 추가
{aiError && (
  <div className="rounded-xl px-3 py-2 flex items-center justify-between gap-2"
    style={{ background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)' }}>
    <p className="text-xs" style={{ color: '#ff6b6b' }}>{aiError}</p>
    <button
      onClick={onRequest}
      className="text-xs text-muted hover:text-primary shrink-0 transition-colors"
    >
      🔄 재시도
    </button>
  </div>
)}
```

기존 `{!hasContent && !isStreaming}` 블록(분석 요청하기 버튼)과 에러 전용 렌더링 블록을 정리해 최종 컴포넌트를 아래와 같이 만든다:

```tsx
function AiSections({ sections, activeSection, isStreaming, aiError, onRequest }: AiSectionsProps) {
  const hasContent = SECTION_KEYS.some((k) => sections[k]);

  if (!hasContent && !isStreaming && !aiError) {
    return (
      <button
        onClick={onRequest}
        className="w-full py-3 rounded-xl bg-primary-gradient text-white text-sm font-medium"
      >
        분석 요청하기
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {aiError && (
        <div
          className="rounded-xl px-3 py-2 flex items-center justify-between gap-2"
          style={{ background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)' }}
        >
          <p className="text-xs" style={{ color: '#ff6b6b' }}>{aiError}</p>
          <button
            onClick={onRequest}
            className="text-xs text-muted hover:text-primary shrink-0 transition-colors"
          >
            🔄 재시도
          </button>
        </div>
      )}
      {SECTION_KEYS.map((key) => {
        const { emoji, title } = SECTION_META[key];
        const text = sections[key];
        return (
          <div key={key} className="bg-card rounded-2xl p-4">
            <p className="text-xs text-muted mb-2">
              {emoji} {title}
            </p>
            {isStreaming && !text ? (
              <div className="flex flex-col gap-2">
                <SkeletonBox className="h-4 w-full" />
                <SkeletonBox className="h-4 w-[80%]" />
                <SkeletonBox className="h-4 w-[60%]" />
              </div>
            ) : (
              <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
                {text}
                {activeSection === key && <span className="animate-pulse opacity-70">▌</span>}
              </p>
            )}
          </div>
        );
      })}
      {!isStreaming && !aiError && hasContent && (
        <button
          onClick={onRequest}
          className="mt-1 w-full py-2 rounded-xl bg-card-hover text-sm text-muted hover:text-primary transition-colors"
        >
          🔄 다시 분석하기
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: `components/AiContent.tsx` — 에러 배너 인라인 표시**

기존 `if (aiError && !aiText)` 블록 제거. `aiText`가 있을 때 에러 배너를 상단에 표시:

```tsx
function AiContent({
  aiText,
  isStreaming,
  aiError,
  onRequest,
  requestLabel = '분석 요청하기',
}: AiContentProps) {
  if (!aiText && !isStreaming && !aiError) {
    return (
      <button
        onClick={onRequest}
        className="w-full py-3 rounded-xl bg-primary-gradient text-white text-sm font-medium"
      >
        {requestLabel}
      </button>
    );
  }

  if (isStreaming && !aiText) {
    return (
      <div className="flex flex-col gap-2">
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-[85%]" />
        <SkeletonBox className="h-4 w-[60%]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {aiError && (
        <div
          className="rounded-xl px-3 py-2 flex items-center justify-between gap-2"
          style={{ background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)' }}
        >
          <p className="text-xs" style={{ color: '#ff6b6b' }}>{aiError}</p>
          <button
            onClick={onRequest}
            className="text-xs text-muted hover:text-primary shrink-0 transition-colors"
          >
            🔄 재시도
          </button>
        </div>
      )}
      {aiText && (
        <>
          <div
            className="text-sm text-primary leading-relaxed whitespace-pre-wrap"
            aria-live="polite"
            aria-atomic="false"
            aria-busy={isStreaming}
          >
            {aiText}
            {isStreaming && (
              <span className="animate-pulse opacity-70" aria-hidden="true">
                ▌
              </span>
            )}
          </div>
          {!isStreaming && !aiError && (
            <button
              onClick={onRequest}
              className="w-full py-2 rounded-xl bg-card-hover text-sm text-muted hover:text-primary transition-colors"
            >
              🔄 다시 분석하기
            </button>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 5: 타입 체크 + 기존 테스트 통과 확인**

```bash
npx tsc --noEmit && npx jest --no-coverage
```

Expected: 에러 없음, 테스트 전부 통과

- [ ] **Step 6: 커밋**

```bash
git add hooks/useSections.ts hooks/useAiText.ts components/AiSections.tsx components/AiContent.tsx
git commit -m "feat: 스트리밍 에러 시 부분 결과 보존 및 에러 배너 인라인 표시"
```

---

## Task 5: 사주 공유 라이브러리 (`lib/saju-share.ts`)

**Files:**
- Create: `lib/saju-share.ts`
- Create: `lib/__tests__/saju-share.test.ts`

- [ ] **Step 1: 테스트 작성**

```ts
// lib/__tests__/saju-share.test.ts
import { encodeSajuShare, decodeSajuShare } from '../saju-share';
import type { SajuSharePayload } from '../saju-share';

const valid: SajuSharePayload = {
  year: 1990,
  month: 5,
  day: 15,
  hour: 10,
  isLunar: false,
  gender: 'M',
  name: '홍길동',
};

function encodeRaw(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

describe('encodeSajuShare / decodeSajuShare', () => {
  it('인코딩 후 디코딩하면 원본과 동일', () => {
    expect(decodeSajuShare(encodeSajuShare(valid))).toEqual(valid);
  });

  it('hour null, name 없어도 동작', () => {
    const p: SajuSharePayload = { year: 1990, month: 1, day: 1, hour: null, isLunar: true, gender: 'F' };
    expect(decodeSajuShare(encodeSajuShare(p))).toEqual(p);
  });

  it('인코딩 결과에 +, /, = 없음 (URL-safe)', () => {
    expect(encodeSajuShare(valid)).not.toMatch(/[+/=]/);
  });

  it('잘못된 문자열 → null', () => {
    expect(decodeSajuShare('not-valid!!!!')).toBeNull();
  });

  it('year 범위 이탈 (1800) → null', () => {
    expect(decodeSajuShare(encodeRaw({ ...valid, year: 1800 }))).toBeNull();
  });

  it('month 범위 이탈 (13) → null', () => {
    expect(decodeSajuShare(encodeRaw({ ...valid, month: 13 }))).toBeNull();
  });

  it('day 범위 이탈 (0) → null', () => {
    expect(decodeSajuShare(encodeRaw({ ...valid, day: 0 }))).toBeNull();
  });

  it('gender 잘못된 값 → null', () => {
    expect(decodeSajuShare(encodeRaw({ ...valid, gender: 'X' }))).toBeNull();
  });

  it('필드 누락 → null', () => {
    expect(decodeSajuShare(encodeRaw({ year: 1990, month: 5 }))).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest lib/__tests__/saju-share.test.ts --no-coverage
```

Expected: `Cannot find module '../saju-share'`

- [ ] **Step 3: 구현**

```ts
// lib/saju-share.ts
export interface SajuSharePayload {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  isLunar: boolean;
  gender: 'M' | 'F';
  name?: string;
}

export function encodeSajuShare(payload: SajuSharePayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeSajuShare(encoded: string): SajuSharePayload | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return isSajuSharePayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isSajuSharePayload(v: unknown): v is SajuSharePayload {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  const currentYear = new Date().getFullYear();
  return (
    typeof r.year === 'number' && r.year >= 1900 && r.year <= currentYear &&
    typeof r.month === 'number' && r.month >= 1 && r.month <= 12 &&
    typeof r.day === 'number' && r.day >= 1 && r.day <= 31 &&
    (r.hour === null || (typeof r.hour === 'number' && r.hour >= 0 && r.hour <= 23)) &&
    typeof r.isLunar === 'boolean' &&
    (r.gender === 'M' || r.gender === 'F') &&
    (r.name === undefined || typeof r.name === 'string')
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest lib/__tests__/saju-share.test.ts --no-coverage
```

Expected: All tests pass

- [ ] **Step 5: 커밋**

```bash
git add lib/saju-share.ts lib/__tests__/saju-share.test.ts
git commit -m "feat: 사주 공유 인코딩/디코딩 라이브러리 추가"
```

---

## Task 6: 사주 공유 페이지 + 링크 공유 버튼

**Files:**
- Create: `app/saju/share/page.tsx`
- Modify: `app/saju/result/SajuResultContent.tsx`

- [ ] **Step 1: 공유 페이지 생성 (`app/saju/share/page.tsx`)**

```tsx
// app/saju/share/page.tsx
'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeSajuShare } from '@/lib/saju-share';
import { calculateSaju } from '@/lib/saju-calculator';
import { saveSession } from '@/lib/session';

function ShareLoader() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const d = params.get('d');
    if (!d) {
      router.replace('/saju');
      return;
    }
    const payload = decodeSajuShare(d);
    if (!payload) {
      router.replace('/saju');
      return;
    }
    try {
      const result = calculateSaju({
        year: payload.year,
        month: payload.month,
        day: payload.day,
        hour: payload.hour,
        isLunar: payload.isLunar,
      });
      saveSession({
        input: {
          name: payload.name ?? '',
          year: payload.year,
          month: payload.month,
          day: payload.day,
          hour: payload.hour,
          isLunar: payload.isLunar,
          gender: payload.gender,
        },
        result,
      });
      router.replace('/saju/result');
    } catch {
      router.replace('/saju');
    }
  }, [params, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-muted">사주 불러오는 중...</p>
    </div>
  );
}

export default function SajuSharePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-sm text-muted">불러오는 중...</p>
        </div>
      }
    >
      <ShareLoader />
    </Suspense>
  );
}
```

- [ ] **Step 2: `SajuResultContent.tsx`에 링크 공유 버튼 추가**

파일 상단 imports에 추가:
```ts
import { useState } from 'react';
import { encodeSajuShare } from '@/lib/saju-share';
```

(주의: `useState`가 이미 import 되어 있으면 추가하지 않음. `useCallback`, `useMemo`도 이미 있음)

컴포넌트 내부, 기존 `const [isSaved, setIsSaved] = useState(...)` 아래에 추가:
```ts
const [linkCopied, setLinkCopied] = useState(false);
```

`handleSave` 함수 아래에 추가:
```ts
const handleLinkShare = useCallback(() => {
  if (!session || session === 'not-found') return;
  const { input } = session;
  const encoded = encodeSajuShare({
    year: input.year,
    month: input.month,
    day: input.day,
    hour: input.hour,
    isLunar: input.isLunar,
    gender: input.gender,
    name: input.name || undefined,
  });
  const url = `${window.location.origin}/saju/share?d=${encoded}`;
  void navigator.clipboard.writeText(url).then(() => {
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  });
}, [session]);
```

JSX의 `<ShareButton .../>` 바로 앞에 링크 공유 버튼 추가:
```tsx
<button
  onClick={handleLinkShare}
  className="bg-card text-muted py-3 px-4 rounded-2xl hover:bg-card-hover transition-colors"
  aria-label="링크 복사"
>
  {linkCopied ? '✓' : '🔗'}
</button>
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add app/saju/share/page.tsx app/saju/result/SajuResultContent.tsx
git commit -m "feat: 사주 결과 URL 공유 기능 추가"
```

---

## Task 7: sitemap.xml + robots.txt

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`

- [ ] **Step 1: `app/sitemap.ts` 생성**

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/saju`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/fortune`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/fortune/yearly`, lastModified: now, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${base}/compatibility`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/compatibility/group`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
```

- [ ] **Step 2: `app/robots.ts` 생성**

```ts
// app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${base}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: Vercel 환경 변수 추가 안내**

Vercel 대시보드 또는 `.env.local`에 추가:
```
NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
```

- [ ] **Step 4: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add app/sitemap.ts app/robots.ts
git commit -m "feat: sitemap.xml 및 robots.txt 추가"
```

---

## Task 8: 프로필 export/import 함수 추가 (`lib/profiles.ts`)

**Files:**
- Modify: `lib/profiles.ts`
- Modify: `lib/__tests__/profiles.test.ts`

- [ ] **Step 1: 테스트 추가**

`lib/__tests__/profiles.test.ts` 파일 맨 아래에 추가:

```ts
import { exportProfiles, parseImportedProfiles, importProfiles } from '../profiles';

describe('parseImportedProfiles', () => {
  it('유효한 JSON에서 프로필 파싱', () => {
    saveProfile(INPUT, '甲');
    const existing = loadProfiles();
    const data = { version: 1, profiles: existing };
    const result = parseImportedProfiles(data);
    expect(result.profiles).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('profiles 필드 없으면 에러', () => {
    expect(() => parseImportedProfiles({ version: 1 })).toThrow();
  });

  it('배열이 아닌 profiles 필드 → 에러', () => {
    expect(() => parseImportedProfiles({ profiles: 'wrong' })).toThrow();
  });

  it('invalid 프로필은 필터링됨', () => {
    const data = { version: 1, profiles: [{ invalid: true }, ...loadProfiles()] };
    const result = parseImportedProfiles(data);
    expect(result.total).toBe(2);
    expect(result.profiles).toHaveLength(loadProfiles().length);
  });

  it('null 입력 → 에러', () => {
    expect(() => parseImportedProfiles(null)).toThrow();
  });
});

describe('importProfiles', () => {
  it('새 프로필이 기존에 추가됨', () => {
    saveProfile(INPUT, '甲');
    const existing = loadProfiles();
    // 다른 사람 프로필 JSON 만들기
    const newProfile = { ...existing[0], id: 'new-id-123', name: '새사람' };
    const json = JSON.stringify({ version: 1, profiles: [newProfile] });
    const file = new File([json], 'test.json', { type: 'application/json' });
    return importProfiles(file).then((result) => {
      expect(result.added).toBe(1);
      expect(result.skipped).toBe(0);
      expect(loadProfiles()).toHaveLength(2);
    });
  });

  it('중복 id는 skip됨', () => {
    saveProfile(INPUT, '甲');
    const existing = loadProfiles();
    const json = JSON.stringify({ version: 1, profiles: existing });
    const file = new File([json], 'test.json', { type: 'application/json' });
    return importProfiles(file).then((result) => {
      expect(result.added).toBe(0);
      expect(result.skipped).toBe(1);
    });
  });

  it('잘못된 JSON → reject', () => {
    const file = new File(['{bad json'], 'test.json', { type: 'application/json' });
    return expect(importProfiles(file)).rejects.toThrow();
  });
});
```

주의: `FileReader`는 Node.js 환경에서 동작하지 않으므로 jest 환경에서 `jsdom`을 사용해야 함.
jest.config.ts에서 `profiles.test.ts`만 `jsdom` 환경으로 오버라이드:

```ts
// jest.config.ts 수정 (기존 config 객체 내 추가)
const config: Config = {
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/lib/__tests__/test-utils\\.ts$'],
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testPathIgnorePatterns: ['/node_modules/', '/.next/', '/lib/__tests__/test-utils\\.ts$', '/lib/__tests__/profiles.test.ts$'],
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: ['**/lib/__tests__/profiles.test.ts'],
    },
  ],
};
```

실제로는 `importProfiles`에서 `FileReader` 대신 `text()` 메서드를 사용하면 Node 환경에서도 테스트 가능:

- [ ] **Step 2: `lib/profiles.ts`에 함수 추가**

파일 맨 아래에 추가:

```ts
export interface ImportResult {
  added: number;
  skipped: number;
}

export function parseImportedProfiles(raw: unknown): { profiles: Profile[]; total: number } {
  if (typeof raw !== 'object' || raw === null) throw new Error('invalid');
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.profiles)) throw new Error('invalid');
  const allItems = data.profiles as unknown[];
  const profiles = allItems.filter(isProfile);
  return { profiles, total: allItems.length };
}

export function exportProfiles(): void {
  if (typeof window === 'undefined') return;
  const profiles = loadProfiles();
  const data = JSON.stringify({ version: 1, profiles }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'saju-profiles.json';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProfiles(file: File): Promise<ImportResult> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('올바른 프로필 파일이 아니에요.');
  }
  const { profiles: toMerge, total } = parseImportedProfiles(parsed);
  const existing = loadProfiles();
  const existingIds = new Set(existing.map((p) => p.id));
  const toAdd = toMerge.filter((p) => !existingIds.has(p.id));
  persist([...existing, ...toAdd]);
  return { added: toAdd.length, skipped: total - toAdd.length };
}
```

- [ ] **Step 3: 테스트 통과 확인**

```bash
npx jest lib/__tests__/profiles.test.ts --no-coverage
```

Expected: All tests pass (importProfiles 테스트는 `file.text()`가 Node 18+ 에서 지원됨)

- [ ] **Step 4: 커밋**

```bash
git add lib/profiles.ts lib/__tests__/profiles.test.ts
git commit -m "feat: 프로필 export/import 함수 추가"
```

---

## Task 9: 프로필 export/import UI (`app/page.tsx`)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: imports에 추가**

기존 `import { loadProfiles, deleteProfile, updateProfile, profileToSessionInput } from '@/lib/profiles';` 를 아래로 교체:

```ts
import {
  loadProfiles,
  deleteProfile,
  updateProfile,
  profileToSessionInput,
  exportProfiles,
  importProfiles,
} from '@/lib/profiles';
import type { ImportResult } from '@/lib/profiles';
```

- [ ] **Step 2: 상태 추가**

`const [isEditing, setIsEditing] = useState(false);` 아래에 추가:

```ts
const [importMsg, setImportMsg] = useState('');
const fileInputRef = useRef<HTMLInputElement>(null);
```

`useRef` import도 추가 (기존에 없다면): `import { useEffect, useState, useRef } from 'react';`

- [ ] **Step 3: 파일 import 핸들러 추가**

`handleSaveEdit` 함수 아래에 추가:

```ts
async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  e.target.value = '';
  try {
    const result: ImportResult = await importProfiles(file);
    setProfiles(loadProfiles());
    setImportMsg(`${result.added}개 추가됨${result.skipped > 0 ? ` (${result.skipped}개 중복 건너뜀)` : ''}`);
  } catch (err) {
    setImportMsg(err instanceof Error ? err.message : '가져오기 실패');
  }
  setTimeout(() => setImportMsg(''), 3000);
}
```

- [ ] **Step 4: 프로필 섹션 헤더에 버튼 추가**

기존 "편집" 버튼이 있는 `<div className="flex justify-between items-center mb-2">` 내부를 아래로 교체:

```tsx
<div className="flex justify-between items-center mb-2">
  <span className="text-xs text-muted">저장된 프로필</span>
  <div className="flex items-center gap-2">
    <button
      onClick={exportProfiles}
      className="text-xs text-muted hover:text-primary transition-colors"
    >
      내보내기
    </button>
    <button
      onClick={() => fileInputRef.current?.click()}
      className="text-xs text-muted hover:text-primary transition-colors"
    >
      가져오기
    </button>
    <button
      onClick={() => {
        setIsEditing(!isEditing);
        setExpandedProfileId(null);
      }}
      className={`text-xs transition-colors ${isEditing ? 'text-hwa' : 'text-primary'}`}
    >
      {isEditing ? '완료' : '편집'}
    </button>
  </div>
</div>
```

`importMsg` 토스트와 숨겨진 파일 input을 프로필 섹션 바로 아래에 추가:

```tsx
<input
  ref={fileInputRef}
  type="file"
  accept=".json"
  className="hidden"
  onChange={handleImport}
/>
{importMsg && (
  <p className="text-xs text-center text-muted mt-1">{importMsg}</p>
)}
```

- [ ] **Step 5: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: 프로필 JSON 내보내기/가져오기 UI 추가"
```

---

## Task 10: 대운 카드에 실제 연도 레이블 추가

**Files:**
- Modify: `components/DaewoonChart.tsx`
- Modify: `app/saju/result/SajuResultContent.tsx`

- [ ] **Step 1: `DaewoonChart.tsx` — `birthYear` prop 추가 및 연도 표시**

`DaewoonChartProps` 인터페이스에 추가:
```ts
interface DaewoonChartProps {
  result: DaewoonResult;
  currentAge: number;
  ilganElement: Ohaeng;
  birthYear: number; // 추가
}
```

컴포넌트 함수 시그니처 변경:
```ts
function DaewoonChart({ result, currentAge, ilganElement, birthYear }: DaewoonChartProps) {
```

카드 내부, `나이 표시 div` (`{pillar.startAge}~{pillar.endAge}` 렌더링) 바로 아래에 연도 추가:

현재:
```tsx
<div className="text-muted mt-1.5" style={{ fontSize: '9px' }}>
  {pillar.startAge}~{pillar.endAge}
</div>
```

변경 후:
```tsx
<div className="text-muted mt-1.5 leading-tight" style={{ fontSize: '9px' }}>
  <div>{pillar.startAge}~{pillar.endAge}세</div>
  <div>{birthYear + pillar.startAge}~{birthYear + pillar.endAge}</div>
</div>
```

- [ ] **Step 2: `SajuResultContent.tsx` — `birthYear` prop 전달**

`<DaewoonChart` 사용 부분을 찾아서:

```tsx
// 변경 전
<DaewoonChart
  result={daewoon}
  currentAge={currentAge}
  ilganElement={GAN_OHAENG[result.ilgan]}
/>

// 변경 후
<DaewoonChart
  result={daewoon}
  currentAge={currentAge}
  ilganElement={GAN_OHAENG[result.ilgan]}
  birthYear={session.input.year}
/>
```

- [ ] **Step 3: 타입 체크 + 전체 테스트**

```bash
npx tsc --noEmit && npx jest --no-coverage
```

Expected: 에러 없음, 전체 테스트 통과

- [ ] **Step 4: 커밋**

```bash
git add components/DaewoonChart.tsx app/saju/result/SajuResultContent.tsx
git commit -m "feat: 대운 카드에 실제 연도 레이블 추가"
```

---

## Task 11: PR 생성 및 최종 검증

- [ ] **Step 1: 전체 테스트 통과 확인**

```bash
npx jest --no-coverage
```

Expected: All tests pass

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: ESLint**

```bash
npx eslint . --max-warnings=0
```

Expected: 0 warnings/errors

- [ ] **Step 4: PR 생성**

```bash
git checkout -b feat/six-improvements
git push -u origin feat/six-improvements
gh pr create --title "feat: 6개 개선사항 (Redis 캐싱, 에러 복구, URL 공유, SEO, 프로필 백업, 대운 연도)" \
  --body "## Summary
- Redis AI 캐싱: saju-analysis, ai-analysis, yearly-fortune 3개 라우트에 서버사이드 캐시 추가 (30일/1일 TTL)
- 스트리밍 에러 복구: 에러 발생 시 부분 결과 보존 + 인라인 재시도 배너
- 사주 URL 공유: /saju/share?d= base64 링크 복사 버튼
- sitemap.xml + robots.txt: NEXT_PUBLIC_BASE_URL 환경변수 필요
- 프로필 export/import: JSON 파일 다운로드/업로드
- 대운 연도 레이블: 카드에 나이 + 실제 연도 병기

## 환경변수 추가 필요
NEXT_PUBLIC_BASE_URL=https://your-domain.com (Vercel에 추가 필요)

## Test plan
- [ ] 사주 결과 페이지 → 🔗 버튼 클릭 → URL 복사 → 새 시크릿 창에서 열기 → 결과 표시 확인
- [ ] 동일 사주 두 번 분석 → 두 번째는 즉시 반환 (Redis 캐시 히트)
- [ ] 분석 중 네트워크 차단 → 에러 배너 + 재시도 버튼 표시, 부분 결과 유지
- [ ] 홈 프로필 섹션 → 내보내기 → JSON 다운로드 확인
- [ ] 다운로드된 JSON → 가져오기 → 프로필 복원 확인
- [ ] 대운 카드에 연도(예: 2000~2009) 표시 확인
- [ ] /sitemap.xml, /robots.txt 접근 가능 확인"
```
