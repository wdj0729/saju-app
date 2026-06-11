# AI 분석 품질 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사주 결과 페이지의 AI 분석을 성격분석·재물운·건강운·연애운·직업운 5개 섹션으로 구조화하고, 더 풍부한 사주 데이터(이름·성별·나이·대운)를 프롬프트에 반영해 분석 깊이를 높인다.

**Architecture:** 단일 스트리밍 응답에서 `[섹션명]` 마커를 파싱해 5개 상태로 라우팅하는 `useAiSections` 훅을 추가한다. fortune·compatibility 페이지는 기존 `useAiStream` / `AiContent` / `/api/ai-analysis`를 그대로 사용하며, 사주 전용으로 `useAiSections` / `AiSections` / `/api/saju-analysis` 레이어를 새로 추가한다.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Jest, Anthropic SDK (claude-sonnet-4-6)

---

## 파일 구조

| 파일 | 신규/수정 | 역할 |
|------|-----------|------|
| `hooks/useAiSections.ts` | 신규 | `SectionKey` 타입, `parseSections` 순수 함수, `useAiSections` 훅 |
| `hooks/__tests__/useAiSections.test.ts` | 신규 | `parseSections` 단위 테스트 |
| `app/api/saju-analysis/route.ts` | 신규 | 풍부한 사주 전용 AI 분석 엔드포인트 |
| `components/AiSections.tsx` | 신규 | 5개 섹션 카드 렌더링 컴포넌트 |
| `app/saju/result/SajuResultContent.tsx` | 수정 | 새 훅/컴포넌트/엔드포인트로 교체 |

---

## Task 1: `parseSections` 순수 함수 (TDD)

**Files:**
- Create: `hooks/__tests__/useAiSections.test.ts`
- Create: `hooks/useAiSections.ts`

- [ ] **Step 1: 테스트 파일 작성**

`hooks/__tests__/useAiSections.test.ts` 를 아래 내용으로 생성한다.

```ts
import { parseSections, SECTION_KEYS } from '../useAiSections';

describe('parseSections', () => {
  it('빈 문자열 → 모든 섹션 빈 문자열', () => {
    expect(parseSections('')).toEqual({
      성격분석: '',
      재물운: '',
      건강운: '',
      연애운: '',
      직업운: '',
    });
  });

  it('마커 없는 텍스트 → 모든 섹션 빈 문자열', () => {
    expect(parseSections('아무 마커도 없는 텍스트')).toEqual({
      성격분석: '',
      재물운: '',
      건강운: '',
      연애운: '',
      직업운: '',
    });
  });

  it('마커 앞 텍스트는 버려짐', () => {
    const result = parseSections('앞부분 텍스트\n[성격분석]\n성격 내용');
    expect(result['성격분석']).toBe('성격 내용');
    expect(result['재물운']).toBe('');
  });

  it('마커 1개 → 해당 섹션만 채워짐', () => {
    const result = parseSections('[재물운]\n재물 내용입니다.');
    expect(result['재물운']).toBe('재물 내용입니다.');
    expect(result['성격분석']).toBe('');
    expect(result['건강운']).toBe('');
  });

  it('5개 섹션 전체 파싱', () => {
    const text = [
      '[성격분석]',
      '성격 내용',
      '[재물운]',
      '재물 내용',
      '[건강운]',
      '건강 내용',
      '[연애운]',
      '연애 내용',
      '[직업운]',
      '직업 내용',
    ].join('\n');
    const result = parseSections(text);
    expect(result['성격분석']).toBe('성격 내용');
    expect(result['재물운']).toBe('재물 내용');
    expect(result['건강운']).toBe('건강 내용');
    expect(result['연애운']).toBe('연애 내용');
    expect(result['직업운']).toBe('직업 내용');
  });

  it('섹션 앞뒤 공백·개행 제거', () => {
    const text = '[성격분석]\n\n  내용이 있음  \n\n[재물운]\n재물';
    expect(parseSections(text)['성격분석']).toBe('내용이 있음');
    expect(parseSections(text)['재물운']).toBe('재물');
  });

  it('여러 줄 내용 보존', () => {
    const text = '[성격분석]\n첫째 줄\n둘째 줄\n셋째 줄\n[재물운]\n재물';
    expect(parseSections(text)['성격분석']).toBe('첫째 줄\n둘째 줄\n셋째 줄');
  });

  it('SECTION_KEYS가 5개 항목을 올바른 순서로 포함', () => {
    expect(SECTION_KEYS).toEqual(['성격분석', '재물운', '건강운', '연애운', '직업운']);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd /Users/peter/saju-app && npx jest hooks/__tests__/useAiSections.test.ts
```

Expected: `Cannot find module '../useAiSections'` 오류로 FAIL

- [ ] **Step 3: `hooks/useAiSections.ts` 작성 — 타입 + parseSections만**

```ts
'use client';

import { useEffect, useRef, useState } from 'react';

export type SectionKey = '성격분석' | '재물운' | '건강운' | '연애운' | '직업운';
export const SECTION_KEYS: SectionKey[] = ['성격분석', '재물운', '건강운', '연애운', '직업운'];

export function emptySections(): Record<SectionKey, string> {
  return { 성격분석: '', 재물운: '', 건강운: '', 연애운: '', 직업운: '' };
}

export function parseSections(text: string): Record<SectionKey, string> {
  const result = emptySections();
  const markerRegex = /\[(성격분석|재물운|건강운|연애운|직업운)\]/g;
  let match: RegExpExecArray | null;
  let lastKey: SectionKey | null = null;
  let lastIndex = 0;

  while ((match = markerRegex.exec(text)) !== null) {
    if (lastKey !== null) {
      result[lastKey] = text.slice(lastIndex, match.index).trim();
    }
    lastKey = match[1] as SectionKey;
    lastIndex = match.index + match[0].length;
  }

  if (lastKey !== null) {
    result[lastKey] = text.slice(lastIndex).trim();
  }

  return result;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /Users/peter/saju-app && npx jest hooks/__tests__/useAiSections.test.ts
```

Expected:
```
PASS hooks/__tests__/useAiSections.test.ts
  parseSections
    ✓ 빈 문자열 → 모든 섹션 빈 문자열
    ✓ 마커 없는 텍스트 → 모든 섹션 빈 문자열
    ✓ 마커 앞 텍스트는 버려짐
    ✓ 마커 1개 → 해당 섹션만 채워짐
    ✓ 5개 섹션 전체 파싱
    ✓ 섹션 앞뒤 공백·개행 제거
    ✓ 여러 줄 내용 보존
    ✓ SECTION_KEYS가 5개 항목을 올바른 순서로 포함
Tests: 8 passed
```

- [ ] **Step 5: 커밋**

```bash
git add hooks/useAiSections.ts hooks/__tests__/useAiSections.test.ts
git commit -m "feat: add parseSections pure function with unit tests"
```

---

## Task 2: `useAiSections` 훅 완성

**Files:**
- Modify: `hooks/useAiSections.ts` (훅 추가)

- [ ] **Step 1: 훅 인터페이스와 구현을 `hooks/useAiSections.ts` 하단에 추가**

파일 끝에 아래 코드를 추가한다. (기존 `parseSections` 코드는 그대로 유지)

```ts
interface UseAiSectionsReturn {
  sections: Record<SectionKey, string>;
  activeSection: SectionKey | null;
  isStreaming: boolean;
  aiError: string;
  request: (url: string, body: unknown) => Promise<void>;
}

export function useAiSections(): UseAiSectionsReturn {
  const [sections, setSections] = useState<Record<SectionKey, string>>(emptySections);
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiError, setAiError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const textRef = useRef('');
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  async function request(url: string, body: unknown) {
    abortRef.current?.abort();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    textRef.current = '';
    setSections(emptySections);
    setActiveSection(null);
    setIsStreaming(true);
    setAiError('');

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('분석 요청에 실패했습니다.');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textRef.current += decoder.decode(value, { stream: true });
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(() => {
            const parsed = parseSections(textRef.current);
            setSections(parsed);
            const active =
              [...SECTION_KEYS].reverse().find((k) => parsed[k].length > 0) ?? null;
            setActiveSection(active);
            rafRef.current = null;
          });
        }
      }

      textRef.current += decoder.decode();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setSections(parseSections(textRef.current));
      setActiveSection(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setSections(emptySections);
      setAiError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setIsStreaming(false);
    }
  }

  return { sections, activeSection, isStreaming, aiError, request };
}
```

- [ ] **Step 2: 기존 테스트 영향 없는지 확인**

```bash
cd /Users/peter/saju-app && npx jest hooks/__tests__/useAiSections.test.ts
```

Expected: 8 passed (Step 1의 parseSections 테스트 그대로 통과)

- [ ] **Step 3: 커밋**

```bash
git add hooks/useAiSections.ts
git commit -m "feat: add useAiSections hook with RAF-batched section streaming"
```

---

## Task 3: `/api/saju-analysis` 엔드포인트

**Files:**
- Create: `app/api/saju-analysis/route.ts`

- [ ] **Step 1: 엔드포인트 파일 생성**

```ts
import { NextRequest } from 'next/server';
import { parseBody, streamAnthropicResponse, formatOhaeng } from '@/lib/stream-anthropic';

interface PillarData {
  gan: string;
  ji: string;
}

interface CurrentDaewoon {
  gan: string;
  ji: string;
  startAge: number;
  endAge: number;
}

interface SajuAnalysisRequest {
  ilgan: string;
  ohaeng: Record<string, number>;
  pillars: {
    year: PillarData;
    month: PillarData;
    day: PillarData;
    hour: PillarData | null;
  };
  name?: string;
  gender?: 'M' | 'F';
  birthYear: number;
  currentAge: number;
  currentDaewoon?: CurrentDaewoon;
}

function isPillarData(v: unknown): v is PillarData {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).gan === 'string' &&
    typeof (v as Record<string, unknown>).ji === 'string'
  );
}

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
    typeof pillars === 'object' &&
    pillars !== null &&
    isPillarData(pillars.year) &&
    isPillarData(pillars.month) &&
    isPillarData(pillars.day)
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  const parsed = await parseBody(req, isSajuAnalysisRequest);
  if (parsed instanceof Response) return parsed;
  const { ilgan, ohaeng, pillars, name, gender, birthYear, currentAge, currentDaewoon } =
    parsed.data;

  const pillarText = [
    `${pillars.year.gan}${pillars.year.ji}`,
    `${pillars.month.gan}${pillars.month.ji}`,
    `${pillars.day.gan}${pillars.day.ji}`,
    pillars.hour ? `${pillars.hour.gan}${pillars.hour.ji}` : '시주 미상',
  ].join(' / ');

  const dayPillar = `${pillars.day.gan}${pillars.day.ji}`;
  const ohaengText = formatOhaeng(ohaeng);
  const genderText = gender === 'M' ? '남성' : gender === 'F' ? '여성' : undefined;
  const daewoonText = currentDaewoon
    ? `${currentDaewoon.gan}${currentDaewoon.ji} (${currentDaewoon.startAge}~${currentDaewoon.endAge}세)`
    : undefined;

  const lines = [
    '당신은 30년 경력의 명리학 전문가입니다.',
    '',
    '**사주 정보**',
    `- 사주팔자: ${pillarText}`,
    `- 일간: ${ilgan}`,
    `- 일주: ${dayPillar}`,
    `- 오행 분포: ${ohaengText}`,
    name ? `- 이름: ${name}` : null,
    genderText ? `- 성별: ${genderText}` : null,
    `- 출생 연도: ${birthYear}년`,
    `- 만 나이: ${currentAge}세`,
    daewoonText ? `- 현재 대운: ${daewoonText}` : null,
    '',
    '위 사주를 바탕으로 아래 5가지 항목을 각 3~4문장씩 구체적이고 친근한 말투로 분석해주세요.',
    '각 마커([성격분석] 등)는 반드시 아래 형식과 동일하게, 정확한 이름으로 써야 합니다.',
    '',
    '[성격분석]',
    '(일간·일주 기반 성격, 기질, 강점, 약점을 구체적으로)',
    '',
    '[재물운]',
    '(재물 흐름, 투자·소비 성향, 현재 재물 기운)',
    '',
    '[건강운]',
    '(오행 불균형에 따른 주의 부위, 관리법)',
    '',
    '[연애운]',
    '(연애·결혼 성향, 현재 인연 기운)',
    '',
    '[직업운]',
    '(적성, 직업 에너지, 커리어 방향)',
  ]
    .filter((l): l is string => l !== null)
    .join('\n');

  try {
    return streamAnthropicResponse({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: lines }],
    });
  } catch {
    return new Response('AI 분석 요청에 실패했습니다.', { status: 500 });
  }
}
```

- [ ] **Step 2: TypeScript 컴파일 에러 없는지 확인**

```bash
cd /Users/peter/saju-app && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add app/api/saju-analysis/route.ts
git commit -m "feat: add /api/saju-analysis endpoint with 5-section prompt"
```

---

## Task 4: `AiSections` 컴포넌트

**Files:**
- Create: `components/AiSections.tsx`

- [ ] **Step 1: 컴포넌트 파일 생성**

```tsx
'use client';

import { SkeletonBox } from './Skeleton';
import { SECTION_KEYS } from '@/hooks/useAiSections';
import type { SectionKey } from '@/hooks/useAiSections';

const SECTION_META: Record<SectionKey, { emoji: string; title: string }> = {
  성격분석: { emoji: '🔮', title: '성격 분석' },
  재물운: { emoji: '💰', title: '재물운' },
  건강운: { emoji: '🌿', title: '건강운' },
  연애운: { emoji: '💕', title: '연애운' },
  직업운: { emoji: '💼', title: '직업운' },
};

interface AiSectionsProps {
  sections: Record<SectionKey, string>;
  activeSection: SectionKey | null;
  isStreaming: boolean;
  aiError: string;
  onRequest: () => void;
}

export default function AiSections({
  sections,
  activeSection,
  isStreaming,
  aiError,
  onRequest,
}: AiSectionsProps) {
  const hasContent = SECTION_KEYS.some((k) => sections[k]);

  if (aiError && !hasContent) {
    return (
      <div>
        <p className="text-sm text-hwa mb-2">{aiError}</p>
        <button onClick={onRequest} className="text-xs text-muted underline">
          다시 시도
        </button>
      </div>
    );
  }

  if (!hasContent && !isStreaming) {
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
                {activeSection === key && (
                  <span className="animate-pulse opacity-70">▌</span>
                )}
              </p>
            )}
          </div>
        );
      })}
      {!isStreaming && hasContent && (
        <button onClick={onRequest} className="mt-1 text-xs text-muted underline text-center">
          다시 요청
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 컴파일 에러 없는지 확인**

```bash
cd /Users/peter/saju-app && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add components/AiSections.tsx
git commit -m "feat: add AiSections component with 5-card section layout"
```

---

## Task 5: `SajuResultContent.tsx` 연결

**Files:**
- Modify: `app/saju/result/SajuResultContent.tsx`

- [ ] **Step 1: import 교체**

파일 상단의 아래 두 줄을:

```ts
import { saveProfile, isProfileSaved } from '@/lib/profiles';
```

찾은 뒤, 그 아래에 새 import 2개를 추가한다:

```ts
import { useAiSections } from '@/hooks/useAiSections';
import AiSections from '@/components/AiSections';
```

그리고 기존 import에서 `useAiStream`과 `AiContent`를 제거한다:

```ts
// 제거할 줄:
import AiContent from '@/components/AiContent';
import { useAiStream } from '@/hooks/useAiStream';
```

- [ ] **Step 2: 훅 교체**

기존:
```ts
const { aiText, isStreaming, aiError, request } = useAiStream();
```

아래로 교체:
```ts
const { sections, activeSection, isStreaming, aiError, request } = useAiSections();
```

- [ ] **Step 3: `currentDaewoon` 계산 추가**

`if (!session) return <SajuResultSkeleton />;` 이후, `const currentAge = calcMadeAge(...)` 바로 아래에 한 줄을 추가한다:

```ts
const currentAge = calcMadeAge(input.year, input.month, input.day);
const currentDaewoon = daewoon?.pillars.find(
  (p) => p.startAge <= currentAge && currentAge < p.endAge
);
```

- [ ] **Step 4: `handleAiRequest` 함수 교체**

기존:
```ts
function handleAiRequest() {
  request('/api/ai-analysis', {
    ilgan: result.ilgan,
    ohaeng: result.ohaeng,
    pillars: { year: result.year, month: result.month, day: result.day, hour: result.hour ?? null },
  });
}
```

아래로 교체:
```ts
function handleAiRequest() {
  request('/api/saju-analysis', {
    ilgan: result.ilgan,
    ohaeng: result.ohaeng,
    pillars: {
      year: result.year,
      month: result.month,
      day: result.day,
      hour: result.hour ?? null,
    },
    name: input.name || undefined,
    gender: input.gender,
    birthYear: input.year,
    currentAge,
    currentDaewoon: currentDaewoon
      ? {
          gan: currentDaewoon.gan,
          ji: currentDaewoon.ji,
          startAge: currentDaewoon.startAge,
          endAge: currentDaewoon.endAge,
        }
      : undefined,
  });
}
```

- [ ] **Step 5: JSX에서 `AiContent` → `AiSections` 교체**

기존:
```tsx
<div className="bg-card rounded-2xl p-4">
  <p className="text-xs text-muted mb-3">🤖 AI 심층 분석</p>
  <AiContent
    aiText={aiText}
    isStreaming={isStreaming}
    aiError={aiError}
    onRequest={handleAiRequest}
  />
</div>
```

아래로 교체:
```tsx
<div className="bg-card rounded-2xl p-4">
  <p className="text-xs text-muted mb-3">🤖 AI 심층 분석</p>
  <AiSections
    sections={sections}
    activeSection={activeSection}
    isStreaming={isStreaming}
    aiError={aiError}
    onRequest={handleAiRequest}
  />
</div>
```

- [ ] **Step 6: TypeScript 컴파일 에러 없는지 확인**

```bash
cd /Users/peter/saju-app && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 7: 전체 테스트 통과 확인**

```bash
cd /Users/peter/saju-app && npx jest
```

Expected: 전체 테스트 통과 (기존 105개 + 새 8개 = 113개)

- [ ] **Step 8: 커밋**

```bash
git add app/saju/result/SajuResultContent.tsx
git commit -m "feat: wire up 5-section AI analysis in saju result page"
```

---

## Task 6: PR 생성

- [ ] **Step 1: feature 브랜치 확인 후 PR 생성**

```bash
git log --oneline -5
```

커밋 4개(Task 1~5)가 main 위에 올라가 있으면:

```bash
gh pr create \
  --title "feat: 5-section AI analysis with richer saju context" \
  --body "## Summary
- Add \`parseSections\` pure function + unit tests (8 cases)
- Add \`useAiSections\` hook with RAF-batched streaming → 5 section states
- Add \`/api/saju-analysis\` endpoint with 2048-token prompt using name/gender/age/daewoon
- Add \`AiSections\` component: skeleton while loading, cursor during streaming
- Wire up in \`SajuResultContent\` replacing single-block AI text

## Test plan
- [ ] 사주 입력 → 결과 페이지 → '분석 요청하기' 클릭
- [ ] 5개 섹션 카드가 순서대로 스트리밍되며 채워지는지 확인
- [ ] 스트리밍 전 미도착 섹션이 Skeleton으로 표시되는지 확인
- [ ] fortune/compatibility 페이지 AI 분석에 영향 없는지 확인
- [ ] '다시 요청' 클릭 시 정상 재요청되는지 확인"
```
