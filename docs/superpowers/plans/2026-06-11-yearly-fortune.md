# 신년운세 페이지 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자 사주 기반으로 2026년 신년운세(총운 + 직업/재물/건강/연애)를 AI 스트리밍으로 분석하는 페이지 추가

**Architecture:** `/fortune/yearly` 경로에 새 페이지 추가. 기존 `useAiSections` 패턴을 그대로 따르되 섹션 키만 다른 `useYearlySections` 훅과 `YearlySections` 컴포넌트를 새로 작성. 홈 카드와 사주 결과 하단 버튼 두 곳에서 진입.

**Tech Stack:** Next.js App Router, React hooks, Anthropic streaming API (`streamAnthropicResponse`), TypeScript

---

## 파일 구조

| 파일 | 역할 |
|------|------|
| `hooks/useYearlySections.ts` (신규) | `YearlySectionKey` 타입, `parseYearlySections`, `useYearlySections` 훅 |
| `hooks/__tests__/useYearlySections.test.ts` (신규) | `parseYearlySections` 단위 테스트 |
| `components/YearlySections.tsx` (신규) | 신년운세 섹션 렌더링 컴포넌트 |
| `app/api/yearly-fortune/route.ts` (신규) | Anthropic 스트리밍 API 라우트 |
| `app/fortune/yearly/page.tsx` (신규) | 서버 컴포넌트 wrapper |
| `app/fortune/yearly/YearlyFortuneContent.tsx` (신규) | 클라이언트 스트리밍 컴포넌트 |
| `app/page.tsx` (수정) | 홈에 "신년운세" 카드 추가 |
| `app/saju/result/SajuResultContent.tsx` (수정) | 사주 결과 하단에 "신년운세 보기" 버튼 추가 |

---

### Task 1: useYearlySections 훅

**Files:**
- Create: `hooks/useYearlySections.ts`
- Create: `hooks/__tests__/useYearlySections.test.ts`

- [ ] **Step 1: 테스트 먼저 작성**

`hooks/__tests__/useYearlySections.test.ts`:

```ts
import { parseYearlySections, YEARLY_SECTION_KEYS } from '../useYearlySections';

describe('parseYearlySections', () => {
  it('빈 문자열 → 모든 섹션 빈 문자열', () => {
    expect(parseYearlySections('')).toEqual({
      총운: '',
      직업운: '',
      재물운: '',
      건강운: '',
      연애운: '',
    });
  });

  it('마커 없는 텍스트 → 모든 섹션 빈 문자열', () => {
    expect(parseYearlySections('아무 마커도 없는 텍스트')).toEqual({
      총운: '',
      직업운: '',
      재물운: '',
      건강운: '',
      연애운: '',
    });
  });

  it('마커 앞 텍스트는 버려짐', () => {
    const result = parseYearlySections('앞부분 텍스트\n[총운]\n총운 내용');
    expect(result['총운']).toBe('총운 내용');
    expect(result['직업운']).toBe('');
  });

  it('마커 1개 → 해당 섹션만 채워짐', () => {
    const result = parseYearlySections('[재물운]\n재물 내용입니다.');
    expect(result['재물운']).toBe('재물 내용입니다.');
    expect(result['총운']).toBe('');
    expect(result['건강운']).toBe('');
  });

  it('5개 섹션 전체 파싱', () => {
    const text = [
      '[총운]',
      '총운 내용',
      '[직업운]',
      '직업 내용',
      '[재물운]',
      '재물 내용',
      '[건강운]',
      '건강 내용',
      '[연애운]',
      '연애 내용',
    ].join('\n');
    const result = parseYearlySections(text);
    expect(result['총운']).toBe('총운 내용');
    expect(result['직업운']).toBe('직업 내용');
    expect(result['재물운']).toBe('재물 내용');
    expect(result['건강운']).toBe('건강 내용');
    expect(result['연애운']).toBe('연애 내용');
  });

  it('섹션 앞뒤 공백·개행 제거', () => {
    const text = '[총운]\n\n  내용이 있음  \n\n[직업운]\n직업';
    expect(parseYearlySections(text)['총운']).toBe('내용이 있음');
    expect(parseYearlySections(text)['직업운']).toBe('직업');
  });

  it('여러 줄 내용 보존', () => {
    const text = '[총운]\n첫째 줄\n둘째 줄\n셋째 줄\n[직업운]\n직업';
    expect(parseYearlySections(text)['총운']).toBe('첫째 줄\n둘째 줄\n셋째 줄');
  });

  it('YEARLY_SECTION_KEYS가 5개 항목을 올바른 순서로 포함', () => {
    expect(YEARLY_SECTION_KEYS).toEqual(['총운', '직업운', '재물운', '건강운', '연애운']);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
cd /Users/peter/saju-app && npx jest hooks/__tests__/useYearlySections.test.ts --no-coverage 2>&1 | tail -20
```

Expected: `Cannot find module '../useYearlySections'`

- [ ] **Step 3: 훅 구현**

`hooks/useYearlySections.ts`:

```ts
'use client';

import { useEffect, useRef, useState } from 'react';

export type YearlySectionKey = '총운' | '직업운' | '재물운' | '건강운' | '연애운';
export const YEARLY_SECTION_KEYS: YearlySectionKey[] = ['총운', '직업운', '재물운', '건강운', '연애운'];

export function emptyYearlySections(): Record<YearlySectionKey, string> {
  return { 총운: '', 직업운: '', 재물운: '', 건강운: '', 연애운: '' };
}

export function parseYearlySections(text: string): Record<YearlySectionKey, string> {
  const result = emptyYearlySections();
  const markerRegex = /\[(총운|직업운|재물운|건강운|연애운)\]/g;
  let match: RegExpExecArray | null;
  let lastKey: YearlySectionKey | null = null;
  let lastIndex = 0;

  while ((match = markerRegex.exec(text)) !== null) {
    if (lastKey !== null) {
      result[lastKey] = text.slice(lastIndex, match.index).trim();
    }
    lastKey = match[1] as YearlySectionKey;
    lastIndex = match.index + match[0].length;
  }

  if (lastKey !== null) {
    result[lastKey] = text.slice(lastIndex).trim();
  }

  return result;
}

interface UseYearlySectionsReturn {
  sections: Record<YearlySectionKey, string>;
  activeSection: YearlySectionKey | null;
  isStreaming: boolean;
  aiError: string;
  request: (url: string, body: unknown) => Promise<void>;
}

export function useYearlySections(): UseYearlySectionsReturn {
  const [sections, setSections] = useState<Record<YearlySectionKey, string>>(emptyYearlySections());
  const [activeSection, setActiveSection] = useState<YearlySectionKey | null>(null);
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
    setSections(emptyYearlySections());
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
      if (!res.ok) throw new Error('분석 요청에 실패했어요.');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textRef.current += decoder.decode(value, { stream: true });
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(() => {
            const parsed = parseYearlySections(textRef.current);
            setSections(parsed);
            const active =
              [...YEARLY_SECTION_KEYS].reverse().find((k) => parsed[k].length > 0) ?? null;
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
      setSections(parseYearlySections(textRef.current));
      setActiveSection(null);
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

  return { sections, activeSection, isStreaming, aiError, request };
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

```bash
cd /Users/peter/saju-app && npx jest hooks/__tests__/useYearlySections.test.ts --no-coverage 2>&1 | tail -20
```

Expected: `Tests: 7 passed, 7 total`

- [ ] **Step 5: 커밋**

```bash
git add hooks/useYearlySections.ts hooks/__tests__/useYearlySections.test.ts
git commit -m "feat: add useYearlySections hook with parseYearlySections"
```

---

### Task 2: YearlySections 컴포넌트

**Files:**
- Create: `components/YearlySections.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`components/YearlySections.tsx`:

```tsx
'use client';

import { SkeletonBox } from './Skeleton';
import { YEARLY_SECTION_KEYS } from '@/hooks/useYearlySections';
import type { YearlySectionKey } from '@/hooks/useYearlySections';

const SECTION_META: Record<YearlySectionKey, { emoji: string; title: string }> = {
  총운: { emoji: '✨', title: '2026년 총운' },
  직업운: { emoji: '💼', title: '직업운' },
  재물운: { emoji: '💰', title: '재물운' },
  건강운: { emoji: '🌿', title: '건강운' },
  연애운: { emoji: '💕', title: '연애운' },
};

interface YearlySectionsProps {
  sections: Record<YearlySectionKey, string>;
  activeSection: YearlySectionKey | null;
  isStreaming: boolean;
  aiError: string;
  onRequest: () => void;
}

export default function YearlySections({
  sections,
  activeSection,
  isStreaming,
  aiError,
  onRequest,
}: YearlySectionsProps) {
  const hasContent = YEARLY_SECTION_KEYS.some((k) => sections[k]);

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
        2026 신년운세 분석하기
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {YEARLY_SECTION_KEYS.map((key) => {
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

- [ ] **Step 2: TypeScript 타입 체크**

```bash
cd /Users/peter/saju-app && npx tsc --noEmit 2>&1 | head -30
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add components/YearlySections.tsx
git commit -m "feat: add YearlySections component"
```

---

### Task 3: /api/yearly-fortune API 라우트

**Files:**
- Create: `app/api/yearly-fortune/route.ts`

- [ ] **Step 1: API 라우트 작성**

`app/api/yearly-fortune/route.ts`:

```ts
import { NextRequest } from 'next/server';
import { parseBody, streamAnthropicResponse, formatOhaeng } from '@/lib/stream-anthropic';

interface PillarData {
  gan: string;
  ji: string;
}

interface YearlyFortuneRequest {
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
}

function isPillarData(v: unknown): v is PillarData {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).gan === 'string' &&
    typeof (v as Record<string, unknown>).ji === 'string'
  );
}

function isYearlyFortuneRequest(v: unknown): v is YearlyFortuneRequest {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  const pillars = r.pillars as Record<string, unknown> | undefined;
  return (
    typeof r.ilgan === 'string' &&
    typeof r.ohaeng === 'object' &&
    r.ohaeng !== null &&
    typeof pillars === 'object' &&
    pillars !== null &&
    isPillarData(pillars.year) &&
    isPillarData(pillars.month) &&
    isPillarData(pillars.day)
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  const parsed = await parseBody(req, isYearlyFortuneRequest);
  if (parsed instanceof Response) return parsed;
  const { ilgan, ohaeng, pillars, name, gender } = parsed.data;

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
    '위 사주를 바탕으로 2026년 병오년(丙午年) 신년운세를 아래 5가지 항목으로 분석해주세요.',
    '말투 규칙: 친근하고 쉬운 일상 언어로 쓰세요. 명리학 전문 용어는 쓰지 마세요. 꼭 써야 할 경우 괄호 안에 쉬운 말로 풀어 쓰세요. 사주를 전혀 모르는 사람도 바로 이해할 수 있어야 합니다.',
    '형식 규칙: 반드시 아래 마커 5개만 그대로 사용하세요. --- 구분선, 헤더(#), 마크다운 장식 일체를 쓰지 마세요. 각 항목은 3~4문장으로 쓰세요. [연애운] 내용 뒤에 바로 응답을 끝내세요.',
    '',
    '[총운]',
    '(2026년 병오년 전체 기운과 이 사람에게 어떤 한 해가 될지 핵심만)',
    '',
    '[직업운]',
    '(올해 커리어·직장에서 주목할 흐름과 조언)',
    '',
    '[재물운]',
    '(올해 돈 흐름, 수입·지출의 특징과 조언)',
    '',
    '[건강운]',
    '(올해 건강에서 조심할 부분과 실천 가능한 관리법)',
    '',
    '[연애운]',
    '(올해 연애·관계에서의 흐름과 조언. 이후 추가 내용 없이 여기서 끝내세요.)',
  ]
    .filter((l): l is string => l !== null)
    .join('\n');

  try {
    return streamAnthropicResponse({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: lines }],
    });
  } catch {
    return new Response('AI 분석 요청에 실패했어요.', { status: 500 });
  }
}
```

- [ ] **Step 2: TypeScript 타입 체크**

```bash
cd /Users/peter/saju-app && npx tsc --noEmit 2>&1 | head -30
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add app/api/yearly-fortune/route.ts
git commit -m "feat: add /api/yearly-fortune streaming route"
```

---

### Task 4: 신년운세 페이지

**Files:**
- Create: `app/fortune/yearly/page.tsx`
- Create: `app/fortune/yearly/YearlyFortuneContent.tsx`

- [ ] **Step 1: 서버 wrapper 작성**

`app/fortune/yearly/page.tsx`:

```tsx
import YearlyFortuneContent from './YearlyFortuneContent';

export default function YearlyFortunePage() {
  return <YearlyFortuneContent />;
}
```

- [ ] **Step 2: 클라이언트 컴포넌트 작성**

`app/fortune/yearly/YearlyFortuneContent.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { loadSession } from '@/lib/session';
import { useSessionOrRedirect } from '@/hooks/useSessionOrRedirect';
import { useYearlySections } from '@/hooks/useYearlySections';
import YearlySections from '@/components/YearlySections';
import BackButton from '@/components/BackButton';
import { SkeletonBox } from '@/components/Skeleton';

function YearlyFortuneSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-32" />
      </header>
      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-2xl p-4 flex flex-col gap-2">
            <SkeletonBox className="h-3 w-24" />
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-4 w-[80%]" />
            <SkeletonBox className="h-4 w-[60%]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function YearlyFortuneContent() {
  const session = useSessionOrRedirect(loadSession, '/saju');
  const { sections, activeSection, isStreaming, aiError, request } = useYearlySections();

  useEffect(() => {
    if (!session) return;
    const name = session.input.name ? `${session.input.name}의 ` : '';
    document.title = `${name}2026 신년운세 · ${session.result.ilgan} 일간 — 사주팔자`;
    return () => { document.title = '사주팔자'; };
  }, [session]);

  if (!session) return <YearlyFortuneSkeleton />;

  const { input, result } = session;

  function handleRequest() {
    request('/api/yearly-fortune', {
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
    });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <BackButton href="/saju/result" label="내 사주" />
        <h1 className="text-sm font-semibold text-primary">
          {input.name ? `${input.name} · 2026 신년운세` : '2026 신년운세'}
        </h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-1">✨ 2026년 병오년 (丙午年)</p>
          <p className="text-xs text-primary">{result.ilgan} 일간 · AI 신년운세 분석</p>
        </div>

        <YearlySections
          sections={sections}
          activeSection={activeSection}
          isStreaming={isStreaming}
          aiError={aiError}
          onRequest={handleRequest}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: TypeScript 타입 체크**

```bash
cd /Users/peter/saju-app && npx tsc --noEmit 2>&1 | head -30
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add app/fortune/yearly/page.tsx app/fortune/yearly/YearlyFortuneContent.tsx
git commit -m "feat: add /fortune/yearly page with streaming AI sections"
```

---

### Task 5: 진입 경로 연결

**Files:**
- Modify: `app/page.tsx` (CARDS 배열)
- Modify: `app/saju/result/SajuResultContent.tsx` (하단 버튼)

- [ ] **Step 1: 홈 카드 추가**

`app/page.tsx`의 `CARDS` 배열에 신년운세 항목 추가:

```tsx
// 기존
const CARDS = [
  {
    emoji: '🔮',
    title: '내 사주 보기',
    subtitle: '생년월일시로 사주팔자 분석',
    href: '/saju',
  },
  {
    emoji: '💫',
    title: '오늘 운세',
    subtitle: '일간별 맞춤 운세',
    href: '/fortune',
  },
  {
    emoji: '💑',
    title: '궁합 보기',
    subtitle: '두 사람의 사주 궁합 분석',
    href: '/compatibility',
  },
] as const;

// 변경 후 (신년운세 카드 추가)
const CARDS = [
  {
    emoji: '🔮',
    title: '내 사주 보기',
    subtitle: '생년월일시로 사주팔자 분석',
    href: '/saju',
  },
  {
    emoji: '✨',
    title: '2026 신년운세',
    subtitle: '병오년 총운·직업·재물·건강·연애',
    href: '/fortune/yearly',
  },
  {
    emoji: '💫',
    title: '오늘 운세',
    subtitle: '일간별 맞춤 운세',
    href: '/fortune',
  },
  {
    emoji: '💑',
    title: '궁합 보기',
    subtitle: '두 사람의 사주 궁합 분석',
    href: '/compatibility',
  },
] as const;
```

- [ ] **Step 2: 사주 결과 하단 버튼 추가**

`app/saju/result/SajuResultContent.tsx`의 하단 버튼 영역에 신년운세 버튼 추가.

현재 코드 (228~265줄):
```tsx
      <div className="flex gap-3 px-4 pb-8">
        <button
          onClick={() => router.push('/fortune')}
          className="flex-1 py-3 rounded-2xl bg-primary-gradient text-white text-sm font-medium"
        >
          운세 보기
        </button>
        <button
          onClick={() => router.push('/compatibility')}
          className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium hover:bg-card-hover transition-colors"
        >
          궁합 보기
        </button>
        <button
          onClick={handleSave}
          disabled={isSaved}
          className="bg-card text-muted py-3 px-4 rounded-2xl hover:bg-card-hover transition-colors disabled:opacity-50"
          aria-label="프로필 저장"
        >
          {isSaved ? '✓' : '💾'}
        </button>
        <ShareButton ... />
      </div>
```

변경 후 — "운세 보기" 버튼을 "신년운세" 버튼으로 교체하고, "오늘 운세"를 보조 버튼으로 추가:
```tsx
      <div className="flex flex-col gap-3 px-4 pb-8">
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/fortune/yearly')}
            className="flex-1 py-3 rounded-2xl bg-primary-gradient text-white text-sm font-medium"
          >
            ✨ 신년운세
          </button>
          <button
            onClick={() => router.push('/fortune')}
            className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium hover:bg-card-hover transition-colors"
          >
            💫 오늘 운세
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/compatibility')}
            className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium hover:bg-card-hover transition-colors"
          >
            💑 궁합 보기
          </button>
          <button
            onClick={handleSave}
            disabled={isSaved}
            className="bg-card text-muted py-3 px-4 rounded-2xl hover:bg-card-hover transition-colors disabled:opacity-50"
            aria-label="프로필 저장"
          >
            {isSaved ? '✓' : '💾'}
          </button>
          <ShareButton
            cardProps={{
              type: 'saju',
              name: input.name,
              ilgan: result.ilgan,
              pillars: {
                year: result.year.gan + result.year.ji,
                month: result.month.gan + result.month.ji,
                day: result.day.gan + result.day.ji,
                hour: result.hour ? result.hour.gan + result.hour.ji : undefined,
              },
              ohaeng: result.ohaeng,
            }}
            filename="saju-result.png"
            shareTitle="내 사주 결과"
          />
        </div>
      </div>
```

- [ ] **Step 3: TypeScript 타입 체크**

```bash
cd /Users/peter/saju-app && npx tsc --noEmit 2>&1 | head -30
```

Expected: 오류 없음

- [ ] **Step 4: 전체 테스트 실행**

```bash
cd /Users/peter/saju-app && npx jest --no-coverage 2>&1 | tail -20
```

Expected: 모든 테스트 통과

- [ ] **Step 5: 커밋**

```bash
git add app/page.tsx app/saju/result/SajuResultContent.tsx
git commit -m "feat: add yearly fortune entry points on home and saju result"
```

---

### Task 6: PR 생성

- [ ] **Step 1: 브랜치 push**

```bash
git push -u origin HEAD
```

- [ ] **Step 2: PR 생성**

```bash
gh pr create \
  --title "feat: 2026 신년운세 페이지 추가" \
  --body "$(cat <<'EOF'
## Summary
- `/fortune/yearly` 경로에 신년운세 페이지 추가
- 총운·직업운·재물운·건강운·연애운 5섹션 AI 스트리밍 분석
- 홈 카드 및 사주 결과 페이지 하단에서 진입 가능

## Test plan
- [ ] 홈에서 "2026 신년운세" 카드 클릭 → 세션 없으면 `/saju`로 이동
- [ ] 사주 입력 후 결과 페이지 → "신년운세" 버튼 클릭 → `/fortune/yearly` 진입
- [ ] "2026 신년운세 분석하기" 버튼 클릭 → 5개 섹션 스트리밍 확인
- [ ] 스트리밍 중 커서(▌) 애니메이션 표시 확인
- [ ] 분석 완료 후 "다시 요청" 링크 표시 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
