# 10가지 개선 사항 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** saju-app의 안정성·UX·보안 10가지 항목을 순차적으로 개선한다.

**Architecture:** 기존 코드 구조를 유지하면서 각 항목을 독립적인 커밋으로 처리. 새 파일 없이 기존 파일 수정 위주. 각 태스크는 독립적이어서 병렬 실행 가능하나, 의존성 있는 것(Task 4는 Task 관련 hooks 먼저)은 순서 준수.

**Tech Stack:** Next.js 15 App Router, TypeScript, React, Upstash Redis, Jest + RTL

---

## 수정 파일 맵

| 파일 | 수정 내용 |
|------|-----------|
| `lib/profiles.ts` | `persist()` try-catch 추가 |
| `lib/session-store.ts` | `save()` try-catch 추가 |
| `lib/__tests__/profiles.test.ts` | localStorage 예외 테스트 추가 |
| `app/page.tsx` | 프로필 0개 UX + 삭제 확인 UI |
| `lib/stream-anthropic.ts` | 스트리밍 에러 메시지 개선 |
| `hooks/useAiText.ts` | `abort` 반환값 추가 |
| `hooks/useSections.ts` | `abort` 반환값 추가 |
| `components/AiContent.tsx` | `onAbort` prop + 중단 버튼 |
| `components/AiSections.tsx` | `onAbort` prop + 중단 버튼 |
| `components/YearlySections.tsx` | `onAbort` prop + 중단 버튼 |
| `app/fortune/FortuneContent.tsx` | `onAbort` 전달 |
| `app/compatibility/result/CompatibilityResultContent.tsx` | `onAbort` 전달 |
| `app/compatibility/group/result/GroupResultContent.tsx` | `onAbort` 전달 |
| `app/saju/result/SajuResultContent.tsx` | `onAbort` 전달 |
| `app/fortune/yearly/YearlyFortuneContent.tsx` | `onAbort` 전달 |
| `components/HourInput.tsx` | 시진 선택 UI (드롭다운 목록) |
| `components/ShareButton.tsx` | 공유 실패 피드백 |
| `app/api/group-compatibility-analysis/route.ts` | Redis 캐시 추가 |
| `app/api/saju-analysis/route.ts` | 이름 입력 길이 제한 |

---

## Task 1: localStorage/sessionStorage 예외 처리

**Files:**
- Modify: `lib/profiles.ts` (persist 함수)
- Modify: `lib/session-store.ts` (save 메서드)
- Modify: `lib/__tests__/profiles.test.ts` (테스트 추가)

- [ ] **Step 1: profiles.ts의 persist() 수정**

`lib/profiles.ts`에서 `persist` 함수를 찾아 수정:

```ts
function persist(profiles: Profile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(profiles));
  } catch {
    // 할당량 초과 또는 접근 불가 시 무시
  }
}
```

- [ ] **Step 2: session-store.ts의 save() 수정**

`lib/session-store.ts`에서 `save` 메서드를 수정:

```ts
save(data: T): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // 할당량 초과 또는 접근 불가 시 무시
  }
},
```

- [ ] **Step 3: profiles.test.ts에 테스트 추가**

`lib/__tests__/profiles.test.ts` 내 `describe('saveProfile', ...)` 블록 끝에 추가:

```ts
it('localStorage.setItem이 throw해도 앱이 crash하지 않음', () => {
  const original = localStorage.setItem;
  localStorage.setItem = () => { throw new DOMException('QuotaExceededError'); };
  expect(() => saveProfile(INPUT, '甲')).not.toThrow();
  localStorage.setItem = original;
});
```

- [ ] **Step 4: 테스트 실행**

```bash
npx jest lib/__tests__/profiles.test.ts --no-coverage
```

Expected: PASS (기존 테스트 모두 통과 + 새 테스트 통과)

- [ ] **Step 5: 커밋**

```bash
git checkout -b feat/10-improvements
git add lib/profiles.ts lib/session-store.ts lib/__tests__/profiles.test.ts
git commit -m "fix: localStorage/sessionStorage 쓰기 실패 시 crash 방지"
```

---

## Task 2: 프로필 0개 상태 UX 개선

**Files:**
- Modify: `app/page.tsx` (카드 onClick 핸들러)

- [ ] **Step 1: page.tsx 수정**

`app/page.tsx`에서 CARDS 섹션의 onClick 핸들러를 찾아 수정:

```tsx
onClick={() => {
  const dest = card.href === '/fortune' ? 'fortune' : 'yearly';
  if (profiles.length === 0) {
    router.push('/saju');
  } else if (profiles.length === 1) {
    handleProfileNav(profiles[0], dest);
  } else {
    router.push(card.href);
  }
}}
```

- [ ] **Step 2: 커밋**

```bash
git add app/page.tsx
git commit -m "fix: 프로필 0개일 때 운세 카드 클릭 시 /saju로 이동"
```

---

## Task 3: AI 스트리밍 에러 메시지 개선

**Files:**
- Modify: `lib/stream-anthropic.ts` (streamAnthropicResponse, streamAnthropicResponseWithCache 내 catch 블록)

- [ ] **Step 1: stream-anthropic.ts 에러 메시지 개선**

`lib/stream-anthropic.ts`의 `streamAnthropicResponse` 함수 내 catch 블록 수정:

```ts
} catch (err) {
  console.error('[stream-anthropic] error:', err);
  let message = '분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: number }).status;
    if (status === 429) message = '요청이 너무 많아요. 잠시 후 다시 시도해주세요.';
    else if (status >= 500) message = 'AI 서비스에 일시적인 오류가 발생했어요.';
  }
  controller.error(new Error(message));
}
```

동일하게 `streamAnthropicResponseWithCache`의 catch 블록도 같은 방식으로 수정.

- [ ] **Step 2: 커밋**

```bash
git add lib/stream-anthropic.ts
git commit -m "fix: AI 스트리밍 에러 유형별 사용자 친화적 메시지 개선"
```

---

## Task 4: AI 스트리밍 중단 버튼 추가

**Files:**
- Modify: `hooks/useAiText.ts`
- Modify: `hooks/useSections.ts`
- Modify: `components/AiContent.tsx`
- Modify: `components/AiSections.tsx`
- Modify: `components/YearlySections.tsx`
- Modify: `app/fortune/FortuneContent.tsx`
- Modify: `app/compatibility/result/CompatibilityResultContent.tsx`
- Modify: `app/compatibility/group/result/GroupResultContent.tsx`
- Modify: `app/saju/result/SajuResultContent.tsx`
- Modify: `app/fortune/yearly/YearlyFortuneContent.tsx`

- [ ] **Step 1: useAiText.ts에 abort 추가**

`hooks/useAiText.ts`에서 interface와 반환값 수정:

```ts
interface UseAiTextReturn {
  aiText: string;
  isStreaming: boolean;
  aiError: string;
  request: (url: string, body: unknown) => Promise<void>;
  abort: () => void;
}

export function useAiText(cacheKey?: string): UseAiTextReturn {
  const [aiText, setAiText] = useState('');
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (!cacheKey) return;
    const cached = loadAiCache(cacheKey);
    if (cached?.ai) setAiText(cached.ai as string);
  }, [cacheKey]);

  const { isStreaming, request, abort } = useStreamingRequest({
    onStart: () => {
      setAiText('');
      setAiError('');
    },
    onChunk: (text) => setAiText(text),
    onComplete: (text) => {
      setAiText(text);
      if (cacheKey) saveAiCache(cacheKey, { ai: text });
    },
    onError: (msg) => {
      setAiError(msg);
    },
  });

  return { aiText, isStreaming, aiError, request, abort };
}
```

- [ ] **Step 2: useSections.ts에 abort 추가**

`hooks/useSections.ts`에서 interface와 반환값 수정:

```ts
interface UseSectionsReturn<K extends string> {
  sections: Record<K, string>;
  activeSection: K | null;
  isStreaming: boolean;
  aiError: string;
  request: (url: string, body: unknown) => Promise<void>;
  abort: () => void;
}

// ...
const { isStreaming, request, abort } = useStreamingRequest({...});

return { sections, activeSection, isStreaming, aiError, request, abort };
```

- [ ] **Step 3: AiContent.tsx에 onAbort prop과 중단 버튼 추가**

`components/AiContent.tsx`에서 인터페이스와 컴포넌트 수정:

```tsx
interface AiContentProps {
  aiText: string;
  isStreaming: boolean;
  aiError: string;
  onRequest: () => void;
  onAbort?: () => void;
  requestLabel?: string;
}

function AiContent({
  aiText,
  isStreaming,
  aiError,
  onRequest,
  onAbort,
  requestLabel = '분석 요청하기',
}: AiContentProps) {
  // ... 기존 코드 유지 ...
  
  return (
    <div className="flex flex-col gap-3">
      {/* 기존 에러 표시 코드 유지 */}
      {aiError && (
        <div
          className="rounded-xl px-3 py-2 flex items-center justify-between gap-2"
          style={{
            background: 'rgba(255,100,100,0.08)',
            border: '1px solid rgba(255,100,100,0.2)',
          }}
        >
          <p className="text-xs" style={{ color: '#ff6b6b' }}>
            {aiError}
          </p>
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
          {isStreaming && onAbort && (
            <button
              onClick={onAbort}
              className="w-full py-2 rounded-xl bg-card-hover text-sm text-muted hover:text-primary transition-colors"
            >
              ✕ 분석 중단
            </button>
          )}
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

- [ ] **Step 4: AiSections.tsx에 onAbort prop과 중단 버튼 추가**

`components/AiSections.tsx`에서 인터페이스 수정:

```tsx
interface AiSectionsProps {
  sections: Record<SectionKey, string>;
  activeSection: SectionKey | null;
  isStreaming: boolean;
  aiError: string;
  onRequest: () => void;
  onAbort?: () => void;
}

function AiSections({ sections, activeSection, isStreaming, aiError, onRequest, onAbort }: AiSectionsProps) {
  const hasContent = SECTION_KEYS.some((k) => sections[k]);
  // ... 기존 코드 ...
  
  // !isStreaming && !aiError && hasContent 버튼 위에 추가:
  {isStreaming && onAbort && (
    <button
      onClick={onAbort}
      className="mt-1 w-full py-2 rounded-xl bg-card-hover text-sm text-muted hover:text-primary transition-colors"
    >
      ✕ 분석 중단
    </button>
  )}
  {!isStreaming && !aiError && hasContent && (
    <button ...>🔄 다시 분석하기</button>
  )}
}
```

- [ ] **Step 5: YearlySections.tsx에 onAbort prop과 중단 버튼 추가**

`components/YearlySections.tsx`에서 인터페이스 수정:

```tsx
interface YearlySectionsProps {
  sections: Record<YearlySectionKey, string>;
  activeSection: YearlySectionKey | null;
  isStreaming: boolean;
  aiError: string;
  onRequest: () => void;
  onAbort?: () => void;
}
```

스트리밍 중단 버튼을 콘텐츠 영역 하단에 추가 (기존 "다시 분석하기" 버튼 위).

- [ ] **Step 6: 5개 caller 파일에 onAbort 전달**

**FortuneContent.tsx:**
```tsx
const { aiText, isStreaming, aiError, request, abort } = useAiText(fortuneDayCacheKey);
// ...
<AiContent
  aiText={aiText}
  isStreaming={isStreaming}
  aiError={aiError}
  onRequest={handleRequest}
  onAbort={abort}
/>
```

**CompatibilityResultContent.tsx:**
```tsx
const { aiText, isStreaming, aiError, request, abort } = useAiText();
// ...
<AiContent
  aiText={aiText}
  isStreaming={isStreaming}
  aiError={aiError}
  onRequest={handleAiRequest}
  onAbort={abort}
/>
```

**GroupResultContent.tsx:**
```tsx
const { aiText, isStreaming, aiError, request, abort } = useAiText();
// ...
<AiContent
  aiText={aiText}
  isStreaming={isStreaming}
  aiError={aiError}
  onRequest={handleAiRequest}
  onAbort={abort}
/>
```

**SajuResultContent.tsx:**
```tsx
const { sections, activeSection, isStreaming, aiError, request, abort } = useAiSections(cacheKey);
// ...
<AiSections
  sections={sections}
  activeSection={activeSection}
  isStreaming={isStreaming}
  aiError={aiError}
  onRequest={handleAiRequest}
  onAbort={abort}
/>
```

**YearlyFortuneContent.tsx:**
```tsx
const { sections, activeSection, isStreaming, aiError, request, abort } = useYearlySections();
// ...
<YearlySections
  sections={sections}
  activeSection={activeSection}
  isStreaming={isStreaming}
  aiError={aiError}
  onRequest={handleRequest}
  onAbort={abort}
/>
```

- [ ] **Step 7: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 8: 커밋**

```bash
git add hooks/useAiText.ts hooks/useSections.ts \
  components/AiContent.tsx components/AiSections.tsx components/YearlySections.tsx \
  app/fortune/FortuneContent.tsx \
  app/compatibility/result/CompatibilityResultContent.tsx \
  app/compatibility/group/result/GroupResultContent.tsx \
  app/saju/result/SajuResultContent.tsx \
  app/fortune/yearly/YearlyFortuneContent.tsx
git commit -m "feat: AI 스트리밍 중단 버튼 추가"
```

---

## Task 5: 프로필 삭제 확인 UI

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: page.tsx 수정 - pendingDeleteId 상태 추가 및 UI 변경**

`app/page.tsx`에서 상태 추가:
```tsx
const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
```

`handleDelete` 함수를 아래와 같이 수정:
```tsx
function handleDelete(id: string) {
  deleteProfile(id);
  setProfiles((prev) => prev.filter((p) => p.id !== id));
  setPendingDeleteId(null);
}
```

편집 모드 삭제 버튼 부분 UI를 아래와 같이 교체 (기존 `×` 버튼 대신):

```tsx
{isEditing && expandedProfileId !== profile.id ? (
  pendingDeleteId === profile.id ? (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={() => setPendingDeleteId(null)}
        className="text-xs text-muted px-1.5 py-0.5 rounded-md hover:text-primary transition-colors"
        aria-label="삭제 취소"
      >
        취소
      </button>
      <button
        onClick={() => handleDelete(profile.id)}
        className="text-xs text-hwa px-1.5 py-0.5 rounded-md bg-hwa/10 hover:bg-hwa/20 transition-colors"
        aria-label="삭제 확인"
      >
        삭제
      </button>
    </div>
  ) : (
    <button
      onClick={() => setPendingDeleteId(profile.id)}
      className="w-4 h-4 bg-hwa rounded-full text-white text-xs flex items-center justify-center leading-none shrink-0"
      aria-label={`${profile.name || '이름 없음'} 삭제`}
    >
      ×
    </button>
  )
) : (
  <span className="text-muted text-xs shrink-0">
    {expandedProfileId === profile.id ? '∧' : '∨'}
  </span>
)}
```

또한 편집 모드 종료 시 pendingDeleteId 초기화:
```tsx
onClick={() => {
  setIsEditing(!isEditing);
  setExpandedProfileId(null);
  setPendingDeleteId(null);  // 추가
}}
```

- [ ] **Step 2: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: 프로필 삭제 전 확인 UI 추가"
```

---

## Task 6: HourInput 시진 선택 UI 개선

**Files:**
- Modify: `components/HourInput.tsx`

- [ ] **Step 1: HourInput.tsx를 시진 선택 드롭다운으로 교체**

기존 파일을 아래 코드로 완전 교체:

```tsx
'use client';

import { useState } from 'react';
import { SIJIN } from '@/lib/constants';

interface HourInputProps {
  value: number | null;
  onChange: (v: number | null) => void;
}

const FIELD_CLASS =
  'bg-card border border-border rounded-xl text-primary text-sm text-left appearance-none py-3 px-3 w-full transition-colors';

export default function HourInput({ value, onChange }: HourInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  const selectedLabel =
    value !== null ? (SIJIN.find((s) => s.value === value)?.label ?? '') : undefined;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowPicker((prev) => !prev)}
          className={`${FIELD_CLASS} flex-1 ${value === null ? 'text-muted' : 'text-primary'}`}
          aria-expanded={showPicker}
          aria-haspopup="listbox"
          aria-label="태어난 시"
        >
          {selectedLabel ?? '시 선택 (선택)'}
        </button>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setShowPicker(false);
          }}
          className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${
            value === null ? 'bg-primary-gradient text-white' : 'bg-card text-muted'
          }`}
        >
          모름
        </button>
      </div>

      {showPicker && (
        <div
          role="listbox"
          aria-label="시진 선택"
          className="grid grid-cols-2 gap-1.5"
        >
          {SIJIN.map((s) => (
            <button
              key={s.value}
              type="button"
              role="option"
              aria-selected={value === s.value}
              onClick={() => {
                onChange(s.value);
                setShowPicker(false);
              }}
              className={`text-xs px-3 py-2.5 rounded-xl text-left transition-colors ${
                value === s.value
                  ? 'bg-primary-gradient text-white'
                  : 'bg-card text-muted hover:bg-card-hover hover:text-primary'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add components/HourInput.tsx
git commit -m "feat: HourInput을 시진 선택 드롭다운으로 개선"
```

---

## Task 7: 공유 실패 피드백 추가

**Files:**
- Modify: `components/ShareButton.tsx`

- [ ] **Step 1: ShareButton.tsx에 에러 상태 추가**

```tsx
'use client';
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import ShareCard from '@/components/ShareCard';
import type { ShareCardProps } from '@/components/ShareCard';

interface ShareButtonProps {
  cardProps: ShareCardProps;
  filename: string;
  shareTitle: string;
}

export default function ShareButton({ cardProps, filename, shareTitle }: ShareButtonProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [shareError, setShareError] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  async function handleShare() {
    if (isCapturing) return;
    setIsCapturing(true);
    setShareError('');
    flushSync(() => setShowCard(true));
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current!, {
        useCORS: true,
        backgroundColor: '#1e1e2e',
        scale: window.devicePixelRatio || 2,
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('캡처 실패'))), 'image/png');
      });
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: shareTitle });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('공유 실패:', err);
      setShareError('공유에 실패했어요. 다시 시도해주세요.');
      setTimeout(() => setShareError(''), 3000);
    } finally {
      setShowCard(false);
      setIsCapturing(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {showCard && <ShareCard ref={cardRef} {...cardProps} />}
      <button
        onClick={handleShare}
        disabled={isCapturing}
        className="bg-card text-muted py-3 px-4 rounded-2xl hover:bg-card-hover transition-colors disabled:opacity-50"
        aria-label="결과 공유하기"
      >
        {isCapturing ? '⏳' : '⬆'}
      </button>
      {shareError && (
        <p className="text-xs text-center" style={{ color: '#ff6b6b' }}>
          {shareError}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/ShareButton.tsx
git commit -m "fix: 공유 실패 시 사용자에게 에러 메시지 표시"
```

---

## Task 8: 모임 궁합 AI 분석 Redis 캐시 추가

**Files:**
- Modify: `app/api/group-compatibility-analysis/route.ts`
- Modify: `lib/redis-ai-cache.ts` (캐시키 생성 함수 추가)

- [ ] **Step 1: redis-ai-cache.ts에 그룹 캐시키 함수 추가**

`lib/redis-ai-cache.ts` 파일 끝에 추가:

```ts
export function makeGroupAnalysisCacheKey(memberIlgans: string[], averageScore: number): string {
  return `server-ai:group:v1:${memberIlgans.join('.')}:${averageScore}`;
}
```

- [ ] **Step 2: group-compatibility-analysis/route.ts 수정**

import 변경:
```ts
import { parseBody, streamAnthropicResponseWithCache, formatOhaeng } from '@/lib/stream-anthropic';
```

import 추가:
```ts
import { getRedisAiCache, setRedisAiCache, makeGroupAnalysisCacheKey } from '@/lib/redis-ai-cache';
```

POST 핸들러에서 캐시 체크 추가 (rateLimitRes 체크 직후):
```ts
const cacheKey = makeGroupAnalysisCacheKey(members.map(m => m.ilgan), averageScore);
const cached = await getRedisAiCache(cacheKey);
if (cached) {
  return new Response(cached, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
```

`streamAnthropicResponse` 호출을 `streamAnthropicResponseWithCache`로 변경:
```ts
return streamAnthropicResponseWithCache(
  { model: AI_MODEL, max_tokens: 1024, messages: [...동일한 메시지...] },
  (text) => setRedisAiCache(cacheKey, text, 86400)
);
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add app/api/group-compatibility-analysis/route.ts lib/redis-ai-cache.ts
git commit -m "feat: 모임 궁합 AI 분석에 Redis 캐시 추가"
```

---

## Task 9: 컴포넌트 테스트 추가

**Files:**
- Create: `lib/__tests__/share-button.test.tsx`
- Create: `lib/__tests__/ai-content.test.tsx`

주의: Jest 설정이 `lib/__tests__/`에 테스트를 두는 구조임을 확인했으므로 동일 위치에 생성.

- [ ] **Step 1: ShareButton 테스트 작성**

`lib/__tests__/share-button.test.tsx` 생성:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ShareButton from '@/components/ShareButton';

jest.mock('html2canvas', () => jest.fn());

const mockCardProps = {
  type: 'saju' as const,
  name: '홍길동',
  ilgan: '甲',
  pillars: {
    year: { gan: '甲', ji: '子' },
    month: { gan: '乙', ji: '丑' },
    day: { gan: '丙', ji: '寅' },
    hour: null,
  },
};

describe('ShareButton', () => {
  it('공유 버튼이 렌더됨', () => {
    render(
      <ShareButton
        cardProps={mockCardProps}
        filename="test.png"
        shareTitle="테스트 공유"
      />
    );
    expect(screen.getByRole('button', { name: '결과 공유하기' })).toBeInTheDocument();
  });

  it('캡처 중에는 버튼이 disabled됨', async () => {
    // html2canvas가 pending 상태로 유지되도록 모킹
    const html2canvas = require('html2canvas');
    html2canvas.mockImplementation(() => new Promise(() => {}));

    render(
      <ShareButton
        cardProps={mockCardProps}
        filename="test.png"
        shareTitle="테스트 공유"
      />
    );
    const button = screen.getByRole('button', { name: '결과 공유하기' });
    fireEvent.click(button);
    expect(button).toBeDisabled();
  });
});
```

- [ ] **Step 2: AiContent 테스트 작성**

`lib/__tests__/ai-content.test.tsx` 생성:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import AiContent from '@/components/AiContent';

describe('AiContent', () => {
  it('aiText/isStreaming/aiError 모두 없으면 분석 요청 버튼 표시', () => {
    const onRequest = jest.fn();
    render(
      <AiContent
        aiText=""
        isStreaming={false}
        aiError=""
        onRequest={onRequest}
        requestLabel="분석 요청하기"
      />
    );
    expect(screen.getByRole('button', { name: '분석 요청하기' })).toBeInTheDocument();
  });

  it('분석 요청 버튼 클릭 시 onRequest 호출', () => {
    const onRequest = jest.fn();
    render(
      <AiContent aiText="" isStreaming={false} aiError="" onRequest={onRequest} />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it('isStreaming=true이고 aiText=""이면 스켈레톤 표시', () => {
    render(
      <AiContent aiText="" isStreaming={true} aiError="" onRequest={jest.fn()} />
    );
    // 스켈레톤은 button이 없음
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('isStreaming=true이고 aiText가 있으면 중단 버튼 표시', () => {
    const onAbort = jest.fn();
    render(
      <AiContent
        aiText="분석 중인 텍스트"
        isStreaming={true}
        aiError=""
        onRequest={jest.fn()}
        onAbort={onAbort}
      />
    );
    const abortBtn = screen.getByRole('button', { name: /분석 중단/ });
    expect(abortBtn).toBeInTheDocument();
    fireEvent.click(abortBtn);
    expect(onAbort).toHaveBeenCalledTimes(1);
  });

  it('aiError가 있으면 에러 메시지와 재시도 버튼 표시', () => {
    const onRequest = jest.fn();
    render(
      <AiContent
        aiText=""
        isStreaming={false}
        aiError="AI 오류가 발생했어요."
        onRequest={onRequest}
      />
    );
    expect(screen.getByText('AI 오류가 발생했어요.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /재시도/ }));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: 테스트 실행**

```bash
npx jest lib/__tests__/share-button.test.tsx lib/__tests__/ai-content.test.tsx --no-coverage
```

Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add lib/__tests__/share-button.test.tsx lib/__tests__/ai-content.test.tsx
git commit -m "test: ShareButton, AiContent 컴포넌트 테스트 추가"
```

---

## Task 10: 이름 입력 보안 강화 (길이 제한)

**Files:**
- Modify: `app/api/saju-analysis/route.ts`

- [ ] **Step 1: isSajuAnalysisRequest 유효성 검증에 이름 길이 제한 추가**

`app/api/saju-analysis/route.ts`에서 `isSajuAnalysisRequest` 함수 수정:

```ts
function isSajuAnalysisRequest(v: unknown): v is SajuAnalysisRequest {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  const pillars = r.pillars as Record<string, unknown> | undefined;
  return (
    typeof r.ilgan === 'string' &&
    typeof r.ohaeng === 'object' &&
    r.ohaeng !== null &&
    typeof r.birthYear === 'number' &&
    typeof r.currentAge === 'number' &&
    (r.name === undefined || (typeof r.name === 'string' && r.name.length <= 20)) &&
    typeof pillars === 'object' &&
    pillars !== null &&
    isPillarData(pillars.year) &&
    isPillarData(pillars.month) &&
    isPillarData(pillars.day)
  );
}
```

그리고 프롬프트에 이름을 삽입하는 부분에서 trim 처리 추가:

```ts
name ? `- 이름: ${name.trim().slice(0, 20)}` : null,
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 전체 테스트 실행**

```bash
npx jest --no-coverage
```

Expected: 모든 테스트 PASS

- [ ] **Step 4: Lint + Prettier**

```bash
npx eslint . --max-warnings 0
npx prettier --check .
```

Expected: 경고/에러 없음

- [ ] **Step 5: 커밋**

```bash
git add app/api/saju-analysis/route.ts
git commit -m "fix: 이름 입력 길이 제한으로 프롬프트 인젝션 위험 완화"
```

---

## 최종 PR 생성

- [ ] **모든 태스크 완료 후 PR 생성**

```bash
git push -u origin feat/10-improvements
gh pr create \
  --title "feat: 안정성·UX·보안 10가지 개선" \
  --body "$(cat <<'EOF'
## 변경 사항

- fix: localStorage/sessionStorage 쓰기 예외 처리 (크래시 방지)
- fix: 프로필 0개일 때 운세 카드 클릭 시 /saju로 바로 이동
- fix: AI 스트리밍 에러 유형별 사용자 친화적 메시지
- feat: AI 분석 중 중단 버튼 (모든 결과 페이지)
- feat: 프로필 삭제 전 확인 UI (인라인 취소/삭제)
- feat: HourInput 시진 선택 드롭다운 UI
- fix: 공유 실패 시 에러 메시지 표시
- feat: 모임 궁합 AI 분석 Redis 캐싱 추가
- test: ShareButton, AiContent 컴포넌트 테스트 추가
- fix: 사주 분석 API 이름 입력 길이 제한 (보안)

## 테스트

- [ ] 프로필 추가/삭제 확인 (삭제 확인 UI 동작)
- [ ] 운세 페이지 AI 분석 요청 후 중단 버튼 동작
- [ ] 시간 입력 드롭다운으로 시진 선택
- [ ] 공유 버튼 실패 시 에러 메시지 확인
- [ ] `npx jest --no-coverage` 전체 통과
EOF
)"
```
