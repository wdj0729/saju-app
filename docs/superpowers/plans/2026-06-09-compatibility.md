# 궁합 페이지 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/compatibility` 입력 페이지 + `/compatibility/result` 결과 페이지를 구현해 두 사람의 생년월일시로 오행 상생·상극 기반 궁합 점수, 등급, 해석, AI 스트리밍 분석을 제공한다.

**Architecture:** `lib/compatibility.ts`에 점수 계산·등급·세션 스토리지를 모두 담고, 입력 페이지에서 두 사람의 사주를 계산해 세션에 저장한 뒤 결과 페이지에서 로드한다. AI 분석은 기존 `/api/ai-analysis/route.ts` 패턴을 그대로 따른다.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, @anthropic-ai/sdk

---

## File Map

| 파일 | 역할 |
|------|------|
| `lib/compatibility.ts` | 타입 정의, 점수 계산, 세션 저장/로드 |
| `lib/__tests__/compatibility.test.ts` | 점수 계산 단위 테스트 |
| `app/api/compatibility-analysis/route.ts` | Claude 스트리밍 API 라우트 |
| `app/compatibility/page.tsx` | 두 사람 입력 페이지 |
| `app/compatibility/result/page.tsx` | 결과 페이지 (점수·오행 비교·AI 분석) |
| `app/page.tsx` | 궁합 카드 `active: true` 활성화 (수정) |
| `app/saju/result/page.tsx` | "궁합 보기" 버튼 활성화 (수정) |

---

## Task 1: lib/compatibility.ts — 타입 정의 및 점수 계산 (TDD)

**Files:**
- Create: `lib/__tests__/compatibility.test.ts`
- Create: `lib/compatibility.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
// lib/__tests__/compatibility.test.ts
import { calcCompatibility, saveCompatSession, loadCompatSession } from '../compatibility';
import type { CompatibilitySession } from '../compatibility';
import type { SajuResult } from '../saju-calculator';

function makeSaju(ohaeng: Record<'목'|'화'|'토'|'금'|'수', number>): SajuResult {
  return {
    year:  { gan: '甲', ji: '子', ganElement: '목', jiElement: '수' },
    month: { gan: '丙', ji: '午', ganElement: '화', jiElement: '화' },
    day:   { gan: '甲', ji: '子', ganElement: '목', jiElement: '수' },
    hour:  null,
    ilgan: '甲',
    ohaeng,
  };
}

const pureWood  = makeSaju({ 목: 5, 화: 0, 토: 0, 금: 0, 수: 0 });
const pureFire  = makeSaju({ 목: 0, 화: 5, 토: 0, 금: 0, 수: 0 });
const pureMetal = makeSaju({ 목: 0, 화: 0, 토: 0, 금: 5, 수: 0 });
const pureWater = makeSaju({ 목: 0, 화: 0, 토: 0, 금: 0, 수: 5 });

describe('calcCompatibility', () => {
  it('score는 0~100 범위', () => {
    const { score } = calcCompatibility(pureWood, pureFire);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('상생 관계(木→火): score >= 50', () => {
    const { score } = calcCompatibility(pureWood, pureFire);
    expect(score).toBeGreaterThanOrEqual(50);
  });

  it('상극 관계(金↔木): score < 50', () => {
    const { score } = calcCompatibility(pureWood, pureMetal);
    expect(score).toBeLessThan(50);
  });

  it('score >= 85 → grade 최상, gradeLabel 천생연분', () => {
    const { grade, gradeLabel } = calcCompatibility(pureWood, pureFire);
    expect(grade).toBe('최상');
    expect(gradeLabel).toBe('천생연분');
  });

  it('score < 50 → grade 하, gradeLabel 주의 필요', () => {
    const { grade, gradeLabel } = calcCompatibility(pureWood, pureMetal);
    expect(grade).toBe('하');
    expect(gradeLabel).toBe('주의 필요');
  });

  it('水→木 상생: score >= 50', () => {
    const { score } = calcCompatibility(pureWater, pureWood);
    expect(score).toBeGreaterThanOrEqual(50);
  });

  it('dominant는 오행 중 최댓값 원소', () => {
    const { dominant } = calcCompatibility(pureWood, pureFire);
    expect(dominant.a).toBe('목');
    expect(dominant.b).toBe('화');
  });

  it('ohaengA·ohaengB가 결과에 포함', () => {
    const result = calcCompatibility(pureWood, pureFire);
    expect(result.ohaengA).toEqual(pureWood.ohaeng);
    expect(result.ohaengB).toEqual(pureFire.ohaeng);
  });

  it('summary는 비어있지 않은 문자열', () => {
    const { summary } = calcCompatibility(pureWood, pureFire);
    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
  });
});

// sessionStorage 모킹
const store: Record<string, string> = {};
beforeAll(() => {
  Object.defineProperty(global, 'window', { value: {}, writable: true, configurable: true });
  Object.defineProperty(global, 'sessionStorage', {
    value: {
      getItem:    (k: string) => store[k] ?? null,
      setItem:    (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    },
    writable: true, configurable: true,
  });
});
beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

describe('CompatibilitySession 스토리지', () => {
  const dummy: CompatibilitySession = {
    personA: { name: '홍길동', result: pureWood },
    personB: { name: '김순이', result: pureFire },
    compatibility: calcCompatibility(pureWood, pureFire),
  };

  it('saveCompatSession → loadCompatSession 라운드트립', () => {
    saveCompatSession(dummy);
    const loaded = loadCompatSession();
    expect(loaded).not.toBeNull();
    expect(loaded?.personA.name).toBe('홍길동');
    expect(loaded?.personB.name).toBe('김순이');
  });

  it('세션이 없으면 null 반환', () => {
    expect(loadCompatSession()).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest lib/__tests__/compatibility.test.ts --no-coverage
```

Expected: FAIL with `Cannot find module '../compatibility'`

- [ ] **Step 3: lib/compatibility.ts 구현**

```typescript
// lib/compatibility.ts
import type { SajuResult } from './saju-calculator';
import type { Ohaeng } from './saju-data';

export interface CompatibilityResult {
  score: number;
  grade: '최상' | '상' | '중' | '하';
  gradeLabel: string;
  summary: string;
  ohaengA: Record<Ohaeng, number>;
  ohaengB: Record<Ohaeng, number>;
  dominant: { a: Ohaeng; b: Ohaeng };
}

export interface CompatibilitySession {
  personA: { name: string; result: SajuResult };
  personB: { name: string; result: SajuResult };
  compatibility: CompatibilityResult;
}

const OHAENG_LIST: Ohaeng[] = ['목', '화', '토', '금', '수'];

const SANGSAENG = new Set(['목-화', '화-토', '토-금', '금-수', '수-목']);
const SANGGEUK  = new Set(['목-토', '토-수', '수-화', '화-금', '금-목']);

function isSangsaeng(x: Ohaeng, y: Ohaeng): boolean {
  return SANGSAENG.has(`${x}-${y}`);
}

function isSanggeuk(x: Ohaeng, y: Ohaeng): boolean {
  return SANGGEUK.has(`${x}-${y}`);
}

function getDominant(ohaeng: Record<Ohaeng, number>): Ohaeng {
  return OHAENG_LIST.reduce((max, key) => ohaeng[key] > ohaeng[max] ? key : max);
}

const GRADE_INFO: Record<'최상' | '상' | '중' | '하', { label: string; summary: string }> = {
  최상: {
    label: '천생연분',
    summary: '두 사람의 오행이 서로를 완벽하게 보완합니다. 함께할수록 각자의 장점이 빛나며 서로에게 큰 힘이 되는 관계입니다. 인생의 동반자로 이보다 나은 인연을 찾기 어렵습니다.',
  },
  상: {
    label: '좋은 인연',
    summary: '두 사람 사이에 상생의 기운이 강합니다. 서로의 부족함을 채워주며 함께 성장할 수 있는 좋은 궁합입니다. 작은 노력으로 더욱 깊은 관계를 만들어갈 수 있습니다.',
  },
  중: {
    label: '보통 궁합',
    summary: '상생과 상극이 균형을 이루는 관계입니다. 서로 이해하고 배려하는 노력이 필요하지만 그 과정에서 함께 성장할 수 있습니다. 대화와 소통으로 좋은 관계를 만들어갈 수 있습니다.',
  },
  하: {
    label: '주의 필요',
    summary: '두 사람의 오행에 상극의 기운이 강합니다. 서로의 차이를 인정하고 이해하는 노력이 특히 중요합니다. 서로를 존중하는 마음을 바탕으로 관계를 만들어가면 극복할 수 있습니다.',
  },
};

const COMPAT_KEY = 'compatibility-session';

export function saveCompatSession(data: CompatibilitySession): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(COMPAT_KEY, JSON.stringify(data));
}

export function loadCompatSession(): CompatibilitySession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(COMPAT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.personA || !parsed?.personB || !parsed?.compatibility) return null;
    return parsed as CompatibilitySession;
  } catch {
    return null;
  }
}

export function calcCompatibility(a: SajuResult, b: SajuResult): CompatibilityResult {
  const ohaengA = a.ohaeng;
  const ohaengB = b.ohaeng;

  let rawScore = 0;
  let totalWeight = 0;

  for (const x of OHAENG_LIST) {
    for (const y of OHAENG_LIST) {
      const w = ohaengA[x] * ohaengB[y];
      if (isSangsaeng(x, y) || isSangsaeng(y, x)) rawScore += w;
      if (isSanggeuk(x, y) || isSanggeuk(y, x)) rawScore -= w;
      totalWeight += w;
    }
  }

  const raw = totalWeight > 0 ? 50 + (rawScore / totalWeight) * 50 : 50;
  const score = Math.round(Math.min(100, Math.max(0, raw)));

  const grade: '최상' | '상' | '중' | '하' =
    score >= 85 ? '최상' :
    score >= 70 ? '상'   :
    score >= 50 ? '중'   : '하';

  const { label: gradeLabel, summary } = GRADE_INFO[grade];

  return {
    score,
    grade,
    gradeLabel,
    summary,
    ohaengA,
    ohaengB,
    dominant: {
      a: getDominant(ohaengA),
      b: getDominant(ohaengB),
    },
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest lib/__tests__/compatibility.test.ts --no-coverage
```

Expected: PASS — 11 tests passing

- [ ] **Step 5: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 기존 lunar-javascript 경고 외 새 오류 없음

- [ ] **Step 6: Commit**

```bash
git add lib/compatibility.ts lib/__tests__/compatibility.test.ts
git commit -m "feat: add compatibility calculator with score, grade, and session storage"
```

---

## Task 2: app/api/compatibility-analysis/route.ts — AI 스트리밍 라우트

**Files:**
- Create: `app/api/compatibility-analysis/route.ts`

- [ ] **Step 1: 라우트 파일 작성**

```typescript
// app/api/compatibility-analysis/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic();

interface PersonData {
  name: string;
  ilgan: string;
  ohaeng: Record<string, number>;
}

interface CompatibilityAnalysisRequest {
  personA: PersonData;
  personB: PersonData;
  score: number;
  grade: string;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('요청 형식이 잘못되었습니다.', { status: 400 });
  }

  const { personA, personB, score, grade } = body as CompatibilityAnalysisRequest;
  if (!personA?.ilgan || !personB?.ilgan || score == null) {
    return new Response('필수 파라미터가 누락되었습니다.', { status: 400 });
  }

  const nameA = personA.name || '첫 번째 분';
  const nameB = personB.name || '두 번째 분';

  const toOhaengText = (o: Record<string, number>) =>
    Object.entries(o).map(([k, v]) => `${k} ${Number(v).toFixed(1)}`).join(' / ');

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `당신은 30년 경력의 명리학 전문가입니다. 두 사람의 사주 오행을 바탕으로 궁합을 한국어로 해석해주세요.

${nameA}: 일간 ${personA.ilgan}, 오행 분포 ${toOhaengText(personA.ohaeng)}
${nameB}: 일간 ${personB.ilgan}, 오행 분포 ${toOhaengText(personB.ohaeng)}
궁합 점수: ${score}점 (${grade})

**연애·감정**, **결혼·생활**, **직업·사회** 측면에서 각 2~3문장씩 구체적이고 친근한 말투로 설명해주세요.`,
        },
      ],
    });

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch {
          controller.error(new Error('스트리밍 중 오류가 발생했습니다.'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return new Response('AI 분석 요청에 실패했습니다.', { status: 500 });
  }
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 기존 오류 외 새 오류 없음

- [ ] **Step 3: Commit**

```bash
git add app/api/compatibility-analysis/route.ts
git commit -m "feat: add compatibility AI analysis streaming route"
```

---

## Task 3: app/compatibility/page.tsx — 입력 페이지

**Files:**
- Create: `app/compatibility/page.tsx`

- [ ] **Step 1: 페이지 파일 작성**

```typescript
// app/compatibility/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateSaju } from '@/lib/saju-calculator';
import { calcCompatibility, saveCompatSession } from '@/lib/compatibility';

const SIJIN = [
  { label: '자시 (23·0시)',  value: 0  },
  { label: '축시 (1·2시)',   value: 1  },
  { label: '인시 (3·4시)',   value: 3  },
  { label: '묘시 (5·6시)',   value: 5  },
  { label: '진시 (7·8시)',   value: 7  },
  { label: '사시 (9·10시)',  value: 9  },
  { label: '오시 (11·12시)', value: 11 },
  { label: '미시 (13·14시)', value: 13 },
  { label: '신시 (15·16시)', value: 15 },
  { label: '유시 (17·18시)', value: 17 },
  { label: '술시 (19·20시)', value: 19 },
  { label: '해시 (21·22시)', value: 21 },
] as const;

const YEARS  = Array.from({ length: 201 }, (_, i) => 1900 + i);
const MONTHS = Array.from({ length: 12  }, (_, i) => i + 1);

const inputClass = 'w-full bg-card border border-border rounded-xl px-4 py-3 text-primary text-sm appearance-none';
const labelClass = 'block text-xs text-muted mb-1.5';

interface PersonFormProps {
  label: string;
  name: string; setName: (v: string) => void;
  isLunar: boolean; setIsLunar: (v: boolean) => void;
  year: number; setYear: (v: number) => void;
  month: number; setMonth: (v: number) => void;
  day: number; setDay: (v: number) => void;
  hourValue: number | null; setHourValue: (v: number | null) => void;
}

function PersonForm({
  label, name, setName, isLunar, setIsLunar,
  year, setYear, month, setMonth, day, setDay,
  hourValue, setHourValue,
}: PersonFormProps) {
  const maxDay   = isLunar ? 30 : new Date(year, month, 0).getDate();
  const clampDay = Math.min(day, maxDay);

  return (
    <div className="bg-card rounded-2xl px-4 py-4 flex flex-col gap-4">
      <p className="text-xs font-semibold text-primary">{label}</p>

      {/* 이름 */}
      <div>
        <label className={labelClass}>이름 (선택)</label>
        <input
          type="text"
          placeholder="이름을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* 양력/음력 */}
      <div>
        <label className={labelClass}>양력 / 음력</label>
        <div className="flex gap-2">
          {([false, true] as const).map((lunar) => (
            <button
              key={String(lunar)}
              onClick={() => setIsLunar(lunar)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isLunar === lunar ? 'bg-primary-gradient text-white' : 'bg-card-hover text-muted'
              }`}
            >
              {lunar ? '음력' : '양력'}
            </button>
          ))}
        </div>
      </div>

      {/* 생년 */}
      <div>
        <label className={labelClass}>생년</label>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputClass}>
          {YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
        </select>
      </div>

      {/* 생월 */}
      <div>
        <label className={labelClass}>생월</label>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={inputClass}>
          {MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
        </select>
      </div>

      {/* 생일 */}
      <div>
        <label className={labelClass}>생일</label>
        <select value={clampDay} onChange={(e) => setDay(Number(e.target.value))} className={inputClass}>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{d}일</option>
          ))}
        </select>
      </div>

      {/* 태어난 시 */}
      <div>
        <label className={labelClass}>태어난 시 (선택)</label>
        <select
          value={hourValue ?? ''}
          onChange={(e) => setHourValue(e.target.value === '' ? null : Number(e.target.value))}
          className={inputClass}
        >
          <option value="">모름</option>
          {SIJIN.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function CompatibilityPage() {
  const router = useRouter();

  const [nameA, setNameA]           = useState('');
  const [isLunarA, setIsLunarA]     = useState(false);
  const [yearA, setYearA]           = useState(1990);
  const [monthA, setMonthA]         = useState(1);
  const [dayA, setDayA]             = useState(1);
  const [hourValueA, setHourValueA] = useState<number | null>(null);

  const [nameB, setNameB]           = useState('');
  const [isLunarB, setIsLunarB]     = useState(false);
  const [yearB, setYearB]           = useState(1990);
  const [monthB, setMonthB]         = useState(1);
  const [dayB, setDayB]             = useState(1);
  const [hourValueB, setHourValueB] = useState<number | null>(null);

  const [error, setError] = useState('');

  const clampedDayA = Math.min(dayA, isLunarA ? 30 : new Date(yearA, monthA, 0).getDate());
  const clampedDayB = Math.min(dayB, isLunarB ? 30 : new Date(yearB, monthB, 0).getDate());

  function handleSubmit() {
    setError('');
    try {
      const resultA = calculateSaju({ year: yearA, month: monthA, day: clampedDayA, hour: hourValueA, isLunar: isLunarA });
      const resultB = calculateSaju({ year: yearB, month: monthB, day: clampedDayB, hour: hourValueB, isLunar: isLunarB });
      const compatibility = calcCompatibility(resultA, resultB);
      saveCompatSession({
        personA: { name: nameA, result: resultA },
        personB: { name: nameB, result: resultB },
        compatibility,
      });
      router.push('/compatibility/result');
    } catch {
      setError('입력한 날짜를 확인해주세요.');
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={() => router.back()}
          className="text-muted text-sm hover:text-primary transition-colors"
        >
          ← 뒤로
        </button>
        <h1 className="text-sm font-semibold text-primary">궁합 보기</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <PersonForm
          label="💑 나의 정보"
          name={nameA} setName={setNameA}
          isLunar={isLunarA} setIsLunar={setIsLunarA}
          year={yearA} setYear={setYearA}
          month={monthA} setMonth={setMonthA}
          day={dayA} setDay={setDayA}
          hourValue={hourValueA} setHourValue={setHourValueA}
        />

        <div className="flex items-center justify-center py-1">
          <span className="text-muted text-lg">♡</span>
        </div>

        <PersonForm
          label="💑 상대방 정보"
          name={nameB} setName={setNameB}
          isLunar={isLunarB} setIsLunar={setIsLunarB}
          year={yearB} setYear={setYearB}
          month={monthB} setMonth={setMonthB}
          day={dayB} setDay={setDayB}
          hourValue={hourValueB} setHourValue={setHourValueB}
        />

        {error && <p className="text-sm text-hwa text-center">{error}</p>}
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl bg-primary-gradient text-white font-semibold text-sm"
        >
          궁합 분석하기
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 기존 오류 외 새 오류 없음

- [ ] **Step 3: Commit**

```bash
git add app/compatibility/page.tsx
git commit -m "feat: implement compatibility input page"
```

---

## Task 4: app/compatibility/result/page.tsx — 결과 페이지

**Files:**
- Create: `app/compatibility/result/page.tsx`

- [ ] **Step 1: 결과 페이지 작성**

```typescript
// app/compatibility/result/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadCompatSession } from '@/lib/compatibility';
import type { CompatibilitySession } from '@/lib/compatibility';
import type { Ohaeng } from '@/lib/saju-data';

const OHAENG_ORDER: Ohaeng[] = ['목', '화', '토', '금', '수'];
const OHAENG_LABEL: Record<Ohaeng, string> = { 목:'木', 화:'火', 토:'土', 금:'金', 수:'水' };
const OHAENG_BAR:   Record<Ohaeng, string> = { 목:'bg-mok', 화:'bg-hwa', 토:'bg-to', 금:'bg-geum', 수:'bg-su' };

export default function CompatibilityResultPage() {
  const router = useRouter();
  const [session] = useState<CompatibilitySession | null>(() => loadCompatSession());
  const [aiText, setAiText]           = useState('');
  const [isStreaming, setIsStreaming]  = useState(false);
  const [aiError, setAiError]         = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!session) router.replace('/compatibility');
  }, [session, router]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  if (!session) return null;

  const { personA, personB, compatibility } = session;
  const { score, grade, gradeLabel, summary, ohaengA, ohaengB } = compatibility;

  const nameA = personA.name || '나';
  const nameB = personB.name || '상대';

  const maxA = Math.max(...Object.values(ohaengA), 1);
  const maxB = Math.max(...Object.values(ohaengB), 1);

  async function requestAiAnalysis() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);
    setAiText('');
    setAiError('');
    try {
      const res = await fetch('/api/compatibility-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          personA: { name: personA.name, ilgan: personA.result.ilgan, ohaeng: ohaengA },
          personB: { name: personB.name, ilgan: personB.result.ilgan, ohaeng: ohaengB },
          score,
          grade,
        }),
      });
      if (!res.ok) throw new Error('분석 요청에 실패했습니다.');
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setAiText((prev) => prev + decoder.decode(value, { stream: true }));
      }
      setAiText((prev) => prev + decoder.decode());
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setAiText('');
      setAiError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsStreaming(false);
    }
  }

  function renderAiContent() {
    if (aiError && !aiText) return (
      <div>
        <p className="text-sm text-hwa mb-2">{aiError}</p>
        <button onClick={requestAiAnalysis} className="text-xs text-muted underline">다시 시도</button>
      </div>
    );
    if (isStreaming && !aiText) return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="animate-pulse">●</span>
        <span>분석 중...</span>
      </div>
    );
    if (aiText) return (
      <>
        <div className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
          {aiText}
          {isStreaming && <span className="animate-pulse opacity-70">▌</span>}
        </div>
        {!isStreaming && (
          <button onClick={requestAiAnalysis} className="mt-3 text-xs text-muted underline">다시 요청</button>
        )}
      </>
    );
    return (
      <button
        onClick={requestAiAnalysis}
        className="w-full py-3 rounded-xl bg-primary-gradient text-white text-sm font-medium"
      >
        AI 궁합 분석 요청하기
      </button>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={() => router.push('/compatibility')}
          className="text-muted text-sm hover:text-primary transition-colors"
        >
          ← 다시 입력
        </button>
        <h1 className="text-sm font-semibold text-primary">궁합 결과</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        {/* ① 점수 카드 */}
        <div className="bg-card rounded-2xl p-5 flex flex-col items-center gap-2">
          <p className="text-sm text-muted">{nameA} ♡ {nameB}</p>
          <p
            className="text-6xl font-bold"
            style={{ background: 'linear-gradient(to right, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {score}
          </p>
          <p className="text-sm font-semibold text-primary">{grade} · {gradeLabel}</p>
        </div>

        {/* ② 오행 비교 카드 */}
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-3">오행 비교</p>
          <div className="flex justify-between text-xs text-muted mb-2 px-6">
            <span>{nameA}</span>
            <span>{nameB}</span>
          </div>
          {OHAENG_ORDER.map((key) => (
            <div key={key} className="flex items-center gap-2 mb-2">
              {/* 나 (왼쪽, 오른쪽 정렬) */}
              <div className="flex-1 flex justify-end">
                <div className="w-full bg-border rounded-full h-3 overflow-hidden flex flex-row-reverse">
                  <div
                    className={`h-full rounded-full ${OHAENG_BAR[key]}`}
                    style={{ width: `${(ohaengA[key] / maxA) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted w-4 text-center shrink-0">{OHAENG_LABEL[key]}</span>
              {/* 상대 (오른쪽, 왼쪽 정렬) */}
              <div className="flex-1">
                <div className="w-full bg-border rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full opacity-70 ${OHAENG_BAR[key]}`}
                    style={{ width: `${(ohaengB[key] / maxB) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ③ 해석 텍스트 카드 */}
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-2">💫 궁합 해석</p>
          <p className="text-sm text-primary leading-relaxed">{summary}</p>
        </div>

        {/* ④ AI 심층 분석 카드 */}
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-3">🤖 AI 심층 분석</p>
          {renderAiContent()}
        </div>
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={() => router.push('/compatibility')}
          className="w-full py-3 rounded-2xl bg-card text-muted text-sm font-medium hover:bg-card-hover transition-colors"
        >
          다시 분석하기
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 기존 오류 외 새 오류 없음

- [ ] **Step 3: Commit**

```bash
git add app/compatibility/result/page.tsx
git commit -m "feat: implement compatibility result page with score, ohaeng chart, and AI analysis"
```

---

## Task 5: 버튼 활성화 (app/page.tsx, app/saju/result/page.tsx)

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/saju/result/page.tsx`

- [ ] **Step 1: app/page.tsx — 궁합 카드 active: true로 변경**

`app/page.tsx`에서 `'궁합 보기'` 카드의 `active: false`를 `active: true`로 변경:

```typescript
// 변경 전
  {
    emoji: '💑',
    title: '궁합 보기',
    subtitle: '두 사람의 사주 궁합 분석',
    href: '/compatibility',
    active: false,
  },

// 변경 후
  {
    emoji: '💑',
    title: '궁합 보기',
    subtitle: '두 사람의 사주 궁합 분석',
    href: '/compatibility',
    active: true,
  },
```

- [ ] **Step 2: app/saju/result/page.tsx — "궁합 보기" 버튼 활성화**

`app/saju/result/page.tsx`에서 disabled 궁합 버튼을 활성화:

```typescript
// 변경 전
        <button
          disabled
          className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium opacity-50 cursor-not-allowed"
        >
          궁합 보기
        </button>

// 변경 후
        <button
          onClick={() => router.push('/compatibility')}
          className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium hover:bg-card-hover transition-colors"
        >
          궁합 보기
        </button>
```

- [ ] **Step 3: TypeScript 컴파일 및 전체 테스트 확인**

```bash
npx tsc --noEmit && npx jest --no-coverage
```

Expected: 컴파일 오류 없음, 전체 테스트 통과 (기존 52개 + 새 11개 = 63개 이상)

- [ ] **Step 4: ESLint 확인**

```bash
npm run lint
```

Expected: 오류 없음

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/saju/result/page.tsx
git commit -m "feat: activate compatibility navigation from home and result pages"
```

---

## Task 6: 브라우저 검증

- [ ] **Step 1: 개발 서버 시작**

```bash
npm run dev
```

Expected: `http://localhost:3000` 준비

- [ ] **Step 2: 홈 페이지 (`/`) 확인**

- "궁합 보기" 카드가 활성화되어 클릭 가능한지 확인
- 클릭 시 `/compatibility`로 이동하는지 확인

- [ ] **Step 3: 입력 페이지 (`/compatibility`) 확인**

- "나의 정보" / "상대방 정보" 두 카드가 표시되는지 확인
- 각 카드에서 이름·양력음력·년월일시 입력이 독립적으로 동작하는지 확인
- "궁합 분석하기" 클릭 시 `/compatibility/result`로 이동하는지 확인

- [ ] **Step 4: 결과 페이지 (`/compatibility/result`) 확인**

- 점수 카드: 큰 그라디언트 숫자 + 등급 + 레이블 표시 확인
- 오행 비교: 나(왼쪽 막대)와 상대(오른쪽 막대, 투명도 낮음)가 대칭으로 표시 확인
- 해석 텍스트 카드 표시 확인
- "AI 궁합 분석 요청하기" 버튼 클릭 시 스트리밍 응답 확인

- [ ] **Step 5: 직접 URL 접근 리다이렉트 확인**

브라우저에서 `/compatibility/result` 직접 입력 → `/compatibility`로 리다이렉트 되는지 확인

- [ ] **Step 6: 사주 결과 페이지에서 진입 확인**

`/saju/result`에서 "궁합 보기" 버튼 클릭 → `/compatibility`로 이동하는지 확인

- [ ] **Step 7: 수정 사항 커밋 (발견된 문제가 있을 경우)**

```bash
git add -A
git commit -m "fix: browser verification fixes for compatibility pages"
```
