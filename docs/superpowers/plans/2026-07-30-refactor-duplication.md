# 리팩토링: 중복 코드 제거 (항목 1~4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앞서 코드베이스 분석에서 발견한 리팩토링 후보 1~4번을 순서대로 적용해, 동일한 동작을 유지하면서 중복 코드를 제거한다.

**Architecture:** 각 작업은 동작을 바꾸지 않는 순수 리팩토링이다(behavior-preserving). 기존 Jest 테스트가 있는 파일은 리팩토링 후 기존 테스트를 그대로 재실행해 회귀가 없음을 확인한다. 새로 추가하는 로직(Task 3의 캐시-체크-후-스트리밍 합성 함수)에는 새 테스트를 추가한다.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Jest + Testing Library.

## Global Constraints

- 기존 공개 동작(렌더링 결과, API 응답 본문/헤더/상태 코드)은 변경하지 않는다.
- `lib/stream-anthropic.ts`의 기존 공개 함수 시그니처(`streamAnthropicResponse`, `streamAnthropicResponseWithCache`)와 그 테스트(`lib/__tests__/stream-anthropic.test.ts`)는 그대로 유지한다 — 변경하지 않는다.
- 각 작업 끝에 관련 Jest 테스트를 실행해 통과를 확인한 뒤 커밋한다.
- 커밋 메시지는 한국어, 이 저장소의 기존 스타일(`chore:`, `refactor:` 등 conventional 접두사)을 따른다.
- 작업 완료 후 `npm run lint`, `npx tsc --noEmit`, `npm run format:check -- ` (또는 `npx prettier --write` 후 재확인)를 모두 통과해야 PR을 올린다.

---

## File Structure

- Modify: `components/Skeleton.tsx` — `SkeletonHeader` 공통 컴포넌트 추가
- Modify: `app/saju/result/SajuResultSkeleton.tsx`, `app/fortune/FortuneContent.tsx`, `app/fortune/yearly/YearlyFortuneContent.tsx`, `app/compatibility/result/CompatibilityResultContent.tsx`, `app/compatibility/group/result/GroupResultSkeleton.tsx` — 각 스켈레톤의 반복된 `<header>` 블록을 `SkeletonHeader`로 교체
- Create: `components/SectionCards.tsx` — `AiSections`/`YearlySections`가 공유하는 섹션 카드 리스트 렌더링 로직
- Modify: `components/AiSections.tsx`, `components/YearlySections.tsx` — 카드 리스트 렌더링을 `SectionCards`로 위임
- Modify: `lib/redis-ai-cache.ts` — `streamAnthropicResponseWithRedisCache` 추가 (캐시 조회 → 히트 시 즉시 반환 → 미스 시 스트리밍+저장을 한 번에 처리)
- Create: `lib/__tests__/redis-ai-cache.test.ts`에 새 함수 테스트 추가 (기존 파일에 append)
- Modify: `app/api/saju-analysis/route.ts`, `app/api/ai-analysis/route.ts`, `app/api/group-compatibility-analysis/route.ts`, `app/api/yearly-fortune/route.ts` — 캐시 체크 보일러플레이트를 `streamAnthropicResponseWithRedisCache` 호출로 교체
- Modify: `app/api/saju-analysis/route.ts`, `app/api/ai-analysis/route.ts`, `app/api/compatibility-analysis/route.ts`, `app/api/group-compatibility-analysis/route.ts`, `app/api/monthly-fortune/route.ts`, `app/api/yearly-fortune/route.ts` — 도달 불가능한 `try/catch` 제거 (6개 파일 전체)

---

### Task 1: 스켈레톤 헤더 중복 제거

**Files:**
- Modify: `components/Skeleton.tsx`
- Modify: `app/saju/result/SajuResultSkeleton.tsx`
- Modify: `app/fortune/FortuneContent.tsx` (내부 `FortuneSkeleton`)
- Modify: `app/fortune/yearly/YearlyFortuneContent.tsx` (내부 `YearlyFortuneSkeleton`)
- Modify: `app/compatibility/result/CompatibilityResultContent.tsx` (내부 `CompatibilityResultSkeleton`)
- Modify: `app/compatibility/group/result/GroupResultSkeleton.tsx`

**Interfaces:**
- Produces: `SkeletonHeader({ titleWidth }: { titleWidth: string })` — `components/Skeleton.tsx`에서 export. `titleWidth`는 `w-24` 같은 Tailwind width 클래스 문자열.

- [ ] **Step 1: `components/Skeleton.tsx`에 `SkeletonHeader` 추가**

```tsx
export function SkeletonBox({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-border rounded ${className ?? ''}`} />;
}

export function SkeletonHeader({ titleWidth }: { titleWidth: string }) {
  return (
    <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
      <SkeletonBox className="h-4 w-16" />
      <SkeletonBox className={`h-4 ${titleWidth}`} />
    </header>
  );
}
```

- [ ] **Step 2: 5개 스켈레톤에서 반복된 `<header>`를 `SkeletonHeader`로 교체**

`app/saju/result/SajuResultSkeleton.tsx`:
```tsx
import { SkeletonBox, SkeletonHeader } from '@/components/Skeleton';

export function SajuResultSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <SkeletonHeader titleWidth="w-24" />
      <div className="flex flex-col gap-6 px-4 py-6 flex-1">
```
(이후 내용은 그대로 유지. 기존 `<header>...</header>` 5줄을 `<SkeletonHeader titleWidth="w-24" />` 한 줄로 교체)

`app/fortune/FortuneContent.tsx`의 `FortuneSkeleton`: import에 `SkeletonHeader` 추가, `<header>` 블록(`w-28`)을 `<SkeletonHeader titleWidth="w-28" />`로 교체.

`app/fortune/yearly/YearlyFortuneContent.tsx`의 `YearlyFortuneSkeleton`: `<header>` 블록(`w-32`)을 `<SkeletonHeader titleWidth="w-32" />`로 교체.

`app/compatibility/result/CompatibilityResultContent.tsx`의 `CompatibilityResultSkeleton`: `<header>` 블록(`w-20`)을 `<SkeletonHeader titleWidth="w-20" />`로 교체.

`app/compatibility/group/result/GroupResultSkeleton.tsx`: `<header>` 블록(`w-24`)을 `<SkeletonHeader titleWidth="w-24" />`로 교체.

각 파일에서 `SkeletonBox`가 다른 곳에서도 쓰이면 import에 유지, 안 쓰이면 `SkeletonHeader`만 남긴다.

- [ ] **Step 3: 테스트 실행**

Run: `npm test -- components/__tests__ lib/__tests__/yearly-sections.test.tsx`
Expected: 기존 테스트 전부 PASS (동작 변경 없으므로 실패하면 마크업이 달라진 것 — diff 재확인)

- [ ] **Step 4: 커밋**

```bash
git add components/Skeleton.tsx app/saju/result/SajuResultSkeleton.tsx app/fortune/FortuneContent.tsx app/fortune/yearly/YearlyFortuneContent.tsx app/compatibility/result/CompatibilityResultContent.tsx app/compatibility/group/result/GroupResultSkeleton.tsx
git commit -m "refactor: 결과 페이지 스켈레톤 헤더를 SkeletonHeader로 공통화"
```

---

### Task 2: `AiSections`/`YearlySections` 섹션 카드 리스트 공통화

**Files:**
- Create: `components/SectionCards.tsx`
- Modify: `components/AiSections.tsx`
- Modify: `components/YearlySections.tsx`

**Interfaces:**
- Produces: `SectionCards<K extends string>({ keys, meta, sections, activeSection, isStreaming }: SectionCardsProps<K>)` — `components/SectionCards.tsx`에서 export.
- Consumes: 없음 (순수 프레젠테이션 컴포넌트, `SkeletonBox`만 사용)

- [ ] **Step 1: `components/SectionCards.tsx` 생성**

```tsx
'use client';

import { SkeletonBox } from './Skeleton';

interface SectionCardsProps<K extends string> {
  keys: readonly K[];
  meta: Record<K, { emoji: string; title: string }>;
  sections: Record<K, string>;
  activeSection: K | null;
  isStreaming: boolean;
}

export function SectionCards<K extends string>({
  keys,
  meta,
  sections,
  activeSection,
  isStreaming,
}: SectionCardsProps<K>) {
  return (
    <>
      {keys.map((key) => {
        const { emoji, title } = meta[key];
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
    </>
  );
}
```

- [ ] **Step 2: `components/AiSections.tsx`에서 카드 리스트를 `SectionCards`로 교체**

`SECTION_KEYS.map((key) => { ... })` 블록(기존 67~89번 줄)을 아래로 교체:

```tsx
      <SectionCards
        keys={SECTION_KEYS}
        meta={SECTION_META}
        sections={sections}
        activeSection={activeSection}
        isStreaming={isStreaming}
      />
```

파일 상단 import에 `import { SectionCards } from './SectionCards';` 추가. `SkeletonBox` import는 다른 곳에서 안 쓰이면 제거.

- [ ] **Step 3: `components/YearlySections.tsx`에서도 동일하게 교체**

`YEARLY_SECTION_KEYS.map((key) => { ... })` 블록(기존 59~82번 줄)을 아래로 교체:

```tsx
      <SectionCards
        keys={YEARLY_SECTION_KEYS}
        meta={SECTION_META}
        sections={sections}
        activeSection={activeSection}
        isStreaming={isStreaming}
      />
```

`import { SectionCards } from './SectionCards';` 추가, 미사용 `SkeletonBox` import 정리.

두 파일 모두 아이템 목록 바깥의 empty-state 버튼, 에러 박스, 재시도/중단 버튼 등 페이지별로 스타일이 다른 부분은 그대로 유지한다 (억지로 통일하지 않는다).

- [ ] **Step 4: 테스트 실행**

Run: `npm test -- lib/__tests__/yearly-sections.test.tsx lib/__tests__/ai-content.test.tsx`
Expected: PASS. 추가로 `npm run dev`로 `/saju/result`, `/fortune/yearly` 접속해 섹션 카드가 이전과 동일하게 보이는지 육안 확인.

- [ ] **Step 5: 커밋**

```bash
git add components/SectionCards.tsx components/AiSections.tsx components/YearlySections.tsx
git commit -m "refactor: AiSections/YearlySections의 섹션 카드 렌더링을 SectionCards로 공통화"
```

---

### Task 3: API 라우트 4곳의 Redis 캐시 체크 보일러플레이트 제거

**Files:**
- Modify: `lib/redis-ai-cache.ts`
- Modify: `lib/__tests__/redis-ai-cache.test.ts`
- Modify: `app/api/saju-analysis/route.ts`
- Modify: `app/api/ai-analysis/route.ts`
- Modify: `app/api/group-compatibility-analysis/route.ts`
- Modify: `app/api/yearly-fortune/route.ts`

**Interfaces:**
- Consumes: `streamAnthropicResponseWithCache(params, saveFn)` from `lib/stream-anthropic.ts` (시그니처 변경 없음), `getRedisAiCache`/`setRedisAiCache` from 같은 파일.
- Produces: `streamAnthropicResponseWithRedisCache(params: MessageStreamParams, cacheKey: string, ttlSeconds: number): Promise<Response>` — `lib/redis-ai-cache.ts`에서 export. 캐시 히트 시 `new Response(cached, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })`를 즉시 반환하고, 미스 시 `streamAnthropicResponseWithCache`로 스트리밍하며 완료 시 `setRedisAiCache(cacheKey, text, ttlSeconds)`로 저장한다.

- [ ] **Step 1: `lib/__tests__/redis-ai-cache.test.ts`에 실패하는 테스트 추가**

파일 상단 `jest.mock('@upstash/redis', ...)` 아래, import 구역에 `streamAnthropicResponseWithCache`를 모킹하는 코드를 추가하고, 파일 끝에 새 describe 블록을 추가한다:

```ts
jest.mock('../stream-anthropic', () => {
  const actual = jest.requireActual('../stream-anthropic');
  return {
    ...actual,
    streamAnthropicResponseWithCache: jest.fn(),
  };
});
```

이 mock 선언을 최상단 `jest.mock('@upstash/redis', ...)` 바로 아래에 놓고, import 구역을 다음과 같이 갱신:

```ts
import {
  getRedisAiCache,
  setRedisAiCache,
  makeSajuAnalysisCacheKey,
  makeAiAnalysisCacheKey,
  makeYearlyFortuneCacheKey,
  streamAnthropicResponseWithRedisCache,
} from '../redis-ai-cache';
import { streamAnthropicResponseWithCache } from '../stream-anthropic';
import type { PillarData } from '../stream-anthropic';

const mockStreamWithCache = streamAnthropicResponseWithCache as jest.Mock;
```

파일 끝에 추가:

```ts
describe('streamAnthropicResponseWithRedisCache', () => {
  beforeEach(() => {
    mockStreamWithCache.mockReset();
  });

  it('캐시 히트 시 스트리밍 없이 캐시된 텍스트를 바로 반환', async () => {
    mockGet.mockResolvedValueOnce('cached text');

    const res = await streamAnthropicResponseWithRedisCache({} as never, 'key', 3600);

    expect(await res.text()).toBe('cached text');
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(mockStreamWithCache).not.toHaveBeenCalled();
  });

  it('캐시 미스 시 streamAnthropicResponseWithCache로 위임하고 saveFn이 setRedisAiCache를 호출', async () => {
    mockGet.mockResolvedValueOnce(null);
    mockSet.mockResolvedValueOnce('OK');
    mockStreamWithCache.mockImplementationOnce(async (_params, saveFn: (text: string) => void) => {
      saveFn('fresh text');
      return new Response('fresh text');
    });

    const res = await streamAnthropicResponseWithRedisCache({} as never, 'key', 3600);

    expect(await res.text()).toBe('fresh text');
    expect(mockSet).toHaveBeenCalledWith('key', 'fresh text', { ex: 3600 });
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

Run: `npm test -- lib/__tests__/redis-ai-cache.test.ts`
Expected: FAIL — `streamAnthropicResponseWithRedisCache is not a function` (아직 구현 전이므로)

- [ ] **Step 3: `lib/redis-ai-cache.ts`에 함수 구현**

파일 상단 import에 추가:

```ts
import type { MessageStreamParams } from '@anthropic-ai/sdk/resources/messages/messages';
import { streamAnthropicResponseWithCache } from './stream-anthropic';
```

파일 끝(`makeGroupAnalysisCacheKey` 아래)에 추가:

```ts
export function streamAnthropicResponseWithRedisCache(
  params: MessageStreamParams,
  cacheKey: string,
  ttlSeconds: number
): Promise<Response> {
  return getRedisAiCache(cacheKey).then((cached) => {
    if (cached) {
      return new Response(cached, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    return streamAnthropicResponseWithCache(params, (text) =>
      setRedisAiCache(cacheKey, text, ttlSeconds)
    );
  });
}
```

- [ ] **Step 4: 테스트 재실행 (통과 확인)**

Run: `npm test -- lib/__tests__/redis-ai-cache.test.ts`
Expected: PASS

- [ ] **Step 5: 4개 라우트에서 캐시 체크 보일러플레이트 제거**

`app/api/saju-analysis/route.ts`:
- import에서 `streamAnthropicResponseWithCache` → `streamAnthropicResponseWithRedisCache`로 교체, `getRedisAiCache`/`setRedisAiCache` import 제거.
- 아래 블록 제거:
```ts
  const cached = await getRedisAiCache(cacheKey);
  if (cached) {
    return new Response(cached, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
```
- 라우트 끝의 호출부를 교체:
```ts
  try {
    return streamAnthropicResponseWithRedisCache(
      { model: AI_MODEL, max_tokens: 2048, messages: [{ role: 'user', content: lines }] },
      cacheKey,
      2592000
    );
  } catch (error) {
    console.error('[saju-analysis] AI request failed:', error);
    return new Response('AI 분석 요청에 실패했어요.', { status: 500 });
  }
```
(이 try/catch는 Task 4에서 제거하므로 지금은 그대로 둔다.)

`app/api/ai-analysis/route.ts`: 동일 패턴. import 교체, 캐시 체크 블록 제거, 호출부를 `streamAnthropicResponseWithRedisCache({...}, cacheKey, 86400)`로 교체.

`app/api/group-compatibility-analysis/route.ts`: 동일 패턴. `streamAnthropicResponseWithRedisCache({...}, cacheKey, 86400)`.

`app/api/yearly-fortune/route.ts`: 동일 패턴. `streamAnthropicResponseWithRedisCache({...}, cacheKey, 2592000)`.

각 파일에서 `cacheKey` 계산 로직(`makeXxxCacheKey(...)` 호출)은 그대로 유지 — 캐시 키 생성은 라우트별 책임이고, 새 함수는 캐시 키를 인자로 받을 뿐이다.

- [ ] **Step 6: 전체 관련 테스트 실행**

Run: `npm test -- lib/__tests__/redis-ai-cache.test.ts lib/__tests__/stream-anthropic.test.ts`
Expected: PASS. (라우트 자체는 단위 테스트가 없으므로, `npm run dev` 후 `/saju/result`에서 "AI 심층 분석" 요청을 한 번 실제로 눌러 정상 스트리밍되는지 확인한다.)

- [ ] **Step 7: 커밋**

```bash
git add lib/redis-ai-cache.ts lib/__tests__/redis-ai-cache.test.ts app/api/saju-analysis/route.ts app/api/ai-analysis/route.ts app/api/group-compatibility-analysis/route.ts app/api/yearly-fortune/route.ts
git commit -m "refactor: Redis 캐시 체크 후 스트리밍하는 보일러플레이트를 streamAnthropicResponseWithRedisCache로 통합"
```

---

### Task 4: API 라우트 6곳의 도달 불가능한 try/catch 제거

**Files:**
- Modify: `app/api/saju-analysis/route.ts`
- Modify: `app/api/ai-analysis/route.ts`
- Modify: `app/api/compatibility-analysis/route.ts`
- Modify: `app/api/group-compatibility-analysis/route.ts`
- Modify: `app/api/monthly-fortune/route.ts`
- Modify: `app/api/yearly-fortune/route.ts`

**Interfaces:**
- Consumes: `lib/stream-anthropic.ts`의 `createAnthropicStreamResponse`(내부 함수, `lib/stream-anthropic.ts:85-156`)가 이미 모든 에러를 내부에서 잡아 `Response`를 반환하며 절대 throw하지 않는다는 사실. `streamAnthropicResponse`/`streamAnthropicResponseWithCache`/`streamAnthropicResponseWithRedisCache` 모두 이 함수를 감싸므로 동일하게 reject하지 않는다.

이 근거는 `lib/__tests__/stream-anthropic.test.ts`의 기존 테스트로 이미 검증되어 있다 (연결 단계 에러, 스트리밍 도중 에러 모두 정상적으로 `Response`를 반환하는 것을 확인함) — 새 테스트는 필요 없다.

- [ ] **Step 1: 6개 라우트에서 try/catch 제거**

각 파일에서 아래 패턴:
```ts
  try {
    return streamAnthropicResponse(...);
  } catch (error) {
    console.error('[xxx] AI request failed:', error);
    return new Response('AI 분석 요청에 실패했어요.', { status: 500 });
  }
```
을 아래로 교체 (try/catch만 벗겨내고 return은 그대로):
```ts
  return streamAnthropicResponse(...);
```

대상:
- `app/api/saju-analysis/route.ts` — `streamAnthropicResponseWithRedisCache(...)` 호출부
- `app/api/ai-analysis/route.ts` — `streamAnthropicResponseWithRedisCache(...)` 호출부
- `app/api/compatibility-analysis/route.ts` — `streamAnthropicResponse(...)` 호출부
- `app/api/group-compatibility-analysis/route.ts` — `streamAnthropicResponseWithRedisCache(...)` 호출부
- `app/api/monthly-fortune/route.ts` — `streamAnthropicResponse(...)` 호출부
- `app/api/yearly-fortune/route.ts` — `streamAnthropicResponseWithRedisCache(...)` 호출부

각 파일에서 `POST` 함수의 마지막 줄이 단순히 `return streamXxx(...)` 형태가 되므로, `async function POST(...): Promise<Response>` 시그니처는 그대로 유지된다 (여전히 `Promise<Response>`).

- [ ] **Step 2: lint + typecheck**

Run: `npx eslint app/api && npx tsc --noEmit`
Expected: 에러 없음 (unused `console`/`error` 변수 등 없는지 확인)

- [ ] **Step 3: 커밋**

```bash
git add app/api/saju-analysis/route.ts app/api/ai-analysis/route.ts app/api/compatibility-analysis/route.ts app/api/group-compatibility-analysis/route.ts app/api/monthly-fortune/route.ts app/api/yearly-fortune/route.ts
git commit -m "refactor: API 라우트에서 도달 불가능한 try/catch 제거"
```

---

## Final Verification

- [ ] **전체 테스트 스위트 실행**

Run: `npm test`
Expected: 전체 PASS

- [ ] **Lint / Typecheck / Format**

Run: `npm run lint && npx tsc --noEmit && npm run format:check`
Expected: 모두 통과 (format 문제 있으면 `npx prettier --write .` 후 재실행)

- [ ] **PR 생성**

`main`에서 분기한 feature 브랜치(`refactor/reduce-duplication`)에서 위 4개 커밋을 push하고 PR을 생성한다.
