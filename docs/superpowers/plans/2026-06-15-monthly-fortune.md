# 월별 운세 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 신년운세 페이지(`/fortune/yearly`) 하단에 월 선택 칩 + 규칙 기반 요약 + 선택적 AI 상세 분석으로 구성된 월별 운세 섹션을 추가한다.

**Architecture:** `MonthlyFortune` 컴포넌트가 `useMonthlyFortune` 훅으로 상태·AI 스트리밍·캐시를 관리하고, `/api/monthly-fortune` 라우트가 Claude를 호출한다. 섹션 파싱은 기존 `parseYearlySections`·`YEARLY_SECTION_KEYS`를 재사용하고, 캐시는 `ai-cache.ts`에 키 생성 함수 하나만 추가해 확장한다.

**Tech Stack:** Next.js App Router, React hooks, claude-sonnet-4-6 streaming, localStorage cache (기존 패턴 그대로)

---

## 파일 목록

| 작업 | 파일 |
|------|------|
| 추가 | `lib/ai-cache.ts` — `makeMonthlyFortuneCacheKey` 함수 추가 |
| 추가 | `lib/__tests__/ai-cache.test.ts` — 위 함수 테스트 추가 |
| 신규 | `app/api/monthly-fortune/route.ts` — 월별 AI 분석 API 라우트 |
| 신규 | `hooks/useMonthlyFortune.ts` — 월 선택 상태 + 스트리밍 + 캐시 훅 |
| 신규 | `components/MonthlyFortune.tsx` — 칩 선택 + 요약 + AI 섹션 UI |
| 수정 | `app/fortune/yearly/YearlyFortuneContent.tsx` — 컴포넌트 하단에 삽입 |

---

## Task 1: makeMonthlyFortuneCacheKey 추가

**Files:**
- Modify: `lib/ai-cache.ts`
- Modify: `lib/__tests__/ai-cache.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/__tests__/ai-cache.test.ts` 상단 import를 다음으로 교체:

```ts
import { makeAiCacheKey, saveAiCache, loadAiCache, makeMonthlyFortuneCacheKey } from '../ai-cache';
```

파일 하단에 새 describe 블록 추가:

```ts
describe('makeMonthlyFortuneCacheKey', () => {
  it('일간·연도·월로 캐시 키 생성', () => {
    expect(makeMonthlyFortuneCacheKey('甲', 2026, 6)).toBe('monthly-fortune:甲:2026:6');
  });

  it('1월도 그대로 사용 (zero-padding 없음)', () => {
    expect(makeMonthlyFortuneCacheKey('壬', 2026, 1)).toBe('monthly-fortune:壬:2026:1');
  });

  it('다른 일간도 구분', () => {
    expect(makeMonthlyFortuneCacheKey('乙', 2026, 6)).not.toBe(
      makeMonthlyFortuneCacheKey('甲', 2026, 6)
    );
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npx jest ai-cache --no-coverage
```

Expected: `makeMonthlyFortuneCacheKey is not a function`

- [ ] **Step 3: 구현**

`lib/ai-cache.ts`의 `makeAiCacheKey` 함수 바로 아래에 추가:

```ts
const MONTHLY_PREFIX = 'monthly-fortune:';

export function makeMonthlyFortuneCacheKey(ilgan: string, year: number, month: number): string {
  return `${MONTHLY_PREFIX}${ilgan}:${year}:${month}`;
}
```

- [ ] **Step 4: 통과 확인**

```bash
npx jest ai-cache --no-coverage
```

Expected: 모든 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/ai-cache.ts lib/__tests__/ai-cache.test.ts
git commit -m "feat: add makeMonthlyFortuneCacheKey to ai-cache"
```

---

## Task 2: /api/monthly-fortune 라우트 생성

**Files:**
- Create: `app/api/monthly-fortune/route.ts`

- [ ] **Step 1: 파일 생성**

```ts
import { NextRequest } from 'next/server';
import {
  parseBody,
  streamAnthropicResponse,
  formatOhaeng,
  isPillarData,
  type PillarData,
} from '@/lib/stream-anthropic';
import { getFortuneYear } from '@/lib/constants';

interface MonthlyFortuneRequest {
  ilgan: string;
  ohaeng: Record<string, number>;
  pillars: {
    year: PillarData;
    month: PillarData;
    day: PillarData;
    hour: PillarData | null;
  };
  month: number;
  name?: string;
  gender?: 'M' | 'F';
}

function isMonthlyFortuneRequest(v: unknown): v is MonthlyFortuneRequest {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  const pillars = r.pillars as Record<string, unknown> | undefined;
  return (
    typeof r.ilgan === 'string' &&
    typeof r.ohaeng === 'object' &&
    r.ohaeng !== null &&
    typeof r.month === 'number' &&
    r.month >= 1 &&
    r.month <= 12 &&
    typeof pillars === 'object' &&
    pillars !== null &&
    isPillarData(pillars.year) &&
    isPillarData(pillars.month) &&
    isPillarData(pillars.day)
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  const parsed = await parseBody(req, isMonthlyFortuneRequest);
  if (parsed instanceof Response) return parsed;
  const { ilgan, ohaeng, pillars, month, name, gender } = parsed.data;
  const fortuneYear = getFortuneYear();

  const pillarText = [
    `${pillars.year.gan}${pillars.year.ji}`,
    `${pillars.month.gan}${pillars.month.ji}`,
    `${pillars.day.gan}${pillars.day.ji}`,
    pillars.hour ? `${pillars.hour.gan}${pillars.hour.ji}` : '시주 미상',
  ].join(' / ');

  const ohaengText = formatOhaeng(ohaeng);
  const genderText = gender === 'M' ? '남성' : gender === 'F' ? '여성' : undefined;

  const lines = [
    '당신은 30년 경력의 명리학 전문가입니다.',
    '',
    '**사주 정보**',
    `- 사주팔자: ${pillarText}`,
    `- 일간: ${ilgan}`,
    `- 오행 분포: ${ohaengText}`,
    name ? `- 이름: ${name}` : null,
    genderText ? `- 성별: ${genderText}` : null,
    '',
    `위 사주를 바탕으로 ${fortuneYear}년 ${month}월 운세를 아래 5가지 항목으로 분석해주세요.`,
    '말투 규칙: 친근하고 쉬운 일상 언어로 쓰세요. 명리학 전문 용어는 쓰지 마세요. 꼭 써야 할 경우 괄호 안에 쉬운 말로 풀어 쓰세요.',
    '형식 규칙: 반드시 아래 마커 5개만 그대로 사용하세요. --- 구분선, 헤더(#), 마크다운 장식 일체를 쓰지 마세요. 각 항목은 2~3문장으로 쓰세요. [연애운] 내용 뒤에 바로 응답을 끝내세요.',
    '',
    '[총운]',
    `(${fortuneYear}년 ${month}월 전체 기운과 이 달의 핵심 흐름)`,
    '',
    '[직업운]',
    `(${month}월 커리어·직장에서 주목할 흐름과 조언)`,
    '',
    '[재물운]',
    `(${month}월 돈 흐름과 조언)`,
    '',
    '[건강운]',
    `(${month}월 건강에서 조심할 부분과 관리법)`,
    '',
    '[연애운]',
    `(${month}월 연애·관계 흐름과 조언. 이후 추가 내용 없이 여기서 끝내세요.)`,
  ]
    .filter((l): l is string => l !== null)
    .join('\n');

  try {
    return streamAnthropicResponse({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: lines }],
    });
  } catch (error) {
    console.error('[monthly-fortune] AI request failed:', error);
    return new Response('AI 분석 요청에 실패했어요.', { status: 500 });
  }
}
```

- [ ] **Step 2: 타입 오류 없음 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add app/api/monthly-fortune/route.ts
git commit -m "feat: add /api/monthly-fortune route"
```

---

## Task 3: useMonthlyFortune 훅 생성

**Files:**
- Create: `hooks/useMonthlyFortune.ts`

- [ ] **Step 1: 파일 생성**

```ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { makeMonthlyFortuneCacheKey, saveAiCache, loadAiCache } from '@/lib/ai-cache';
import { FORTUNE_TEXT, type FortuneEntry } from '@/lib/fortune-text';
import {
  parseYearlySections,
  emptyYearlySections,
  YEARLY_SECTION_KEYS,
} from '@/hooks/useYearlySections';
import type { YearlySectionKey } from '@/hooks/useYearlySections';
import type { Pillar } from '@/lib/saju-calculator';
import type { Ohaeng } from '@/lib/saju-data';
import { getFortuneYear } from '@/lib/constants';

export interface MonthlyFortuneInput {
  ilgan: string;
  ohaeng: Record<Ohaeng, number>;
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
  };
  name?: string;
  gender?: 'M' | 'F';
}

export interface UseMonthlyFortuneReturn {
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  ruleSummary: FortuneEntry['이달'] | null;
  sections: Record<YearlySectionKey, string>;
  activeSection: YearlySectionKey | null;
  isStreaming: boolean;
  aiError: string;
  hasCachedResult: boolean;
  requestAi: () => void;
}

const REVERSED_KEYS = [...YEARLY_SECTION_KEYS].reverse();

export function useMonthlyFortune(input: MonthlyFortuneInput): UseMonthlyFortuneReturn {
  const fortuneYear = getFortuneYear();
  const [selectedMonth, setSelectedMonthState] = useState<number>(new Date().getMonth() + 1);
  const [sections, setSections] = useState<Record<YearlySectionKey, string>>(emptyYearlySections());
  const [activeSection, setActiveSection] = useState<YearlySectionKey | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiError, setAiError] = useState('');
  const [hasCachedResult, setHasCachedResult] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const textRef = useRef('');
  const rafRef = useRef<number | null>(null);

  const ruleSummary = FORTUNE_TEXT[input.ilgan]?.이달 ?? null;

  const loadCache = useCallback(
    (month: number) => {
      const key = makeMonthlyFortuneCacheKey(input.ilgan, fortuneYear, month);
      const cached = loadAiCache(key);
      if (cached) {
        setSections(cached as Record<YearlySectionKey, string>);
        setHasCachedResult(true);
      } else {
        setSections(emptyYearlySections());
        setHasCachedResult(false);
      }
      setAiError('');
    },
    [input.ilgan, fortuneYear]
  );

  useEffect(() => {
    loadCache(selectedMonth);
  }, [selectedMonth, loadCache]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function setSelectedMonth(m: number) {
    abortRef.current?.abort();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsStreaming(false);
    setActiveSection(null);
    setSelectedMonthState(m);
  }

  async function requestAi() {
    abortRef.current?.abort();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    textRef.current = '';
    setSections(emptyYearlySections());
    setActiveSection(null);
    setIsStreaming(true);
    setAiError('');
    setHasCachedResult(false);

    try {
      const res = await fetch('/api/monthly-fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ ...input, month: selectedMonth }),
      });
      if (!res.ok) throw new Error('분석 요청에 실패했어요.');
      if (!res.body) throw new Error('Response body is missing');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textRef.current += decoder.decode(value, { stream: true });
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(() => {
            const parsed = parseYearlySections(textRef.current);
            setSections(parsed);
            const active = REVERSED_KEYS.find((k) => parsed[k].length > 0) ?? null;
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
      const final = parseYearlySections(textRef.current);
      setSections(final);
      setActiveSection(null);
      setHasCachedResult(true);
      saveAiCache(makeMonthlyFortuneCacheKey(input.ilgan, fortuneYear, selectedMonth), final);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setSections(emptyYearlySections());
      setActiveSection(null);
      setAiError(err instanceof Error ? err.message : '오류가 발생했어요.');
    } finally {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setIsStreaming(false);
    }
  }

  return {
    selectedMonth,
    setSelectedMonth,
    ruleSummary,
    sections,
    activeSection,
    isStreaming,
    aiError,
    hasCachedResult,
    requestAi,
  };
}
```

- [ ] **Step 2: 타입 오류 없음 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add hooks/useMonthlyFortune.ts
git commit -m "feat: add useMonthlyFortune hook"
```

---

## Task 4: MonthlyFortune 컴포넌트 생성

**Files:**
- Create: `components/MonthlyFortune.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
'use client';

import { useMonthlyFortune } from '@/hooks/useMonthlyFortune';
import type { MonthlyFortuneInput } from '@/hooks/useMonthlyFortune';
import { YEARLY_SECTION_KEYS } from '@/hooks/useYearlySections';
import type { YearlySectionKey } from '@/hooks/useYearlySections';
import { SkeletonBox } from './Skeleton';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const SECTION_META: Record<YearlySectionKey, { emoji: string; label: string }> = {
  총운: { emoji: '✨', label: '총운' },
  직업운: { emoji: '💼', label: '직업운' },
  재물운: { emoji: '💰', label: '재물운' },
  건강운: { emoji: '🌿', label: '건강운' },
  연애운: { emoji: '💕', label: '연애운' },
};

export default function MonthlyFortune(props: MonthlyFortuneInput) {
  const {
    selectedMonth,
    setSelectedMonth,
    ruleSummary,
    sections,
    activeSection,
    isStreaming,
    aiError,
    hasCachedResult,
    requestAi,
  } = useMonthlyFortune(props);

  const hasAiContent = YEARLY_SECTION_KEYS.some((k) => sections[k]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted">📅 월별 운세</p>

      {/* 월 선택 칩 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MONTHS.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedMonth === m
                ? 'bg-primary-gradient text-white'
                : 'bg-card text-muted hover:bg-card-hover'
            }`}
          >
            {m}월
          </button>
        ))}
      </div>

      {/* 규칙 기반 요약 */}
      {ruleSummary && (
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <p className="text-xs text-muted">💫 {selectedMonth}월 요약</p>
          <p className="text-sm text-primary leading-relaxed">{ruleSummary.summary}</p>
          <div className="flex flex-col gap-1 mt-1">
            {(Object.entries(ruleSummary.details) as [string, string][]).map(([key, value]) => (
              <p key={key} className="text-xs text-muted">
                <span className="text-primary">{key}</span> · {value}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* AI 분석 에러 */}
      {aiError && !hasAiContent && (
        <div>
          <p className="text-sm text-hwa mb-2">{aiError}</p>
          <button onClick={requestAi} className="text-xs text-muted underline">
            다시 시도
          </button>
        </div>
      )}

      {/* AI 분석 시작 버튼 */}
      {!hasAiContent && !isStreaming && (
        <button
          onClick={requestAi}
          className="w-full py-3 rounded-xl bg-primary-gradient text-white text-sm font-medium"
        >
          {selectedMonth}월 AI 상세 분석
        </button>
      )}

      {/* AI 섹션 */}
      {(hasAiContent || isStreaming) && (
        <div className="flex flex-col gap-3">
          {YEARLY_SECTION_KEYS.map((key) => {
            const { emoji, label } = SECTION_META[key];
            const text = sections[key];
            return (
              <div key={key} className="bg-card rounded-2xl p-4">
                <p className="text-xs text-muted mb-2">
                  {emoji} {selectedMonth}월 {label}
                </p>
                {isStreaming && !text ? (
                  <div className="flex flex-col gap-2">
                    <SkeletonBox className="h-4 w-full" />
                    <SkeletonBox className="h-4 w-[80%]" />
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
          {!isStreaming && hasCachedResult && (
            <button
              onClick={requestAi}
              className="mt-1 text-xs text-muted underline text-center"
            >
              다시 요청
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 오류 없음 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add components/MonthlyFortune.tsx
git commit -m "feat: add MonthlyFortune component"
```

---

## Task 5: YearlyFortuneContent에 통합

**Files:**
- Modify: `app/fortune/yearly/YearlyFortuneContent.tsx`

- [ ] **Step 1: import 추가**

파일 상단 import 목록에 추가:

```ts
import MonthlyFortune from '@/components/MonthlyFortune';
```

- [ ] **Step 2: 컴포넌트 삽입**

`<YearlySections ... />` 바로 아래에 추가 (같은 `px-4 py-6 flex flex-col gap-4` div 안):

```tsx
<div className="border-t border-border pt-4">
  <MonthlyFortune
    ilgan={result.ilgan}
    ohaeng={result.ohaeng}
    pillars={{
      year: result.year,
      month: result.month,
      day: result.day,
      hour: result.hour ?? null,
    }}
    name={input.name || undefined}
    gender={input.gender}
  />
</div>
```

- [ ] **Step 3: 전체 검사**

```bash
npx tsc --noEmit && npx jest --no-coverage
```

Expected: 타입 오류 없음, 모든 테스트 PASS

- [ ] **Step 4: 커밋**

```bash
git add app/fortune/yearly/YearlyFortuneContent.tsx
git commit -m "feat: integrate MonthlyFortune into yearly fortune page"
```

---

## Task 6: feature 브랜치 → PR

- [ ] **Step 1: 현재까지 작업이 feature 브랜치에 있는지 확인**

```bash
git branch --show-current
```

main이면 브랜치 생성 후 커밋들을 이동하는 대신, 지금부터는 PR을 생성한다. (Task 1~5 커밋이 이미 main에 있다면 직접 PR 불가 — 이 경우 사용자에게 워크트리 사용을 권장한다.)

- [ ] **Step 2: PR 생성**

```bash
gh pr create \
  --title "feat: 월별 운세 (신년운세 페이지 하단 드릴다운)" \
  --body "$(cat <<'EOF'
## Summary
- 신년운세 페이지 하단에 월별 운세 섹션 추가
- 1~12월 가로 스크롤 칩으로 월 선택 (기본값: 현재 달)
- 선택한 달의 규칙 기반 요약(`FORTUNE_TEXT[ilgan].이달`) 즉시 표시
- "N월 AI 상세 분석" 버튼으로 Claude 스트리밍 분석 선택적 호출
- AI 결과는 `monthly-fortune:{ilgan}:{year}:{month}` 키로 localStorage 캐싱

## Test plan
- [ ] 신년운세 페이지에서 월별 운세 섹션이 하단에 보이는지 확인
- [ ] 현재 달이 기본 선택되어 있는지 확인
- [ ] 다른 달 칩 클릭 시 요약 텍스트가 교체되는지 확인
- [ ] "AI 상세 분석" 버튼 클릭 → 스트리밍으로 섹션이 하나씩 나타나는지 확인
- [ ] 같은 달 재진입 시 캐시된 결과가 즉시 표시되는지 확인
- [ ] AI 오류 시 에러 메시지 + 다시 시도 버튼 표시 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
