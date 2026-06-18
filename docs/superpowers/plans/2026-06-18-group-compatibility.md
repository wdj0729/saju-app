# 모임 궁합 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 2~10명의 사주를 입력받아 모든 쌍의 궁합 점수를 SVG 관계 그래프로 시각화하고 AI 전체 분석을 제공하는 모임 궁합 기능을 구현한다.

**Architecture:** `/compatibility`에 "1:1 / 모임" 탭을 추가하고, `/compatibility/group`(입력)과 `/compatibility/group/result`(결과) 페이지를 신규 생성한다. 기존 `calcCompatibility()`로 N*(N-1)/2 쌍의 점수를 계산하고 sessionStorage에 저장한다. 결과 페이지는 원형 SVG 그래프 + 노드 탭 인터랙션 + Claude AI 전체 분석 스트리밍으로 구성한다.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, React useState/useMemo, SVG, Jest

---

## File Map

| 상태 | 파일 | 역할 |
|------|------|------|
| Create | `lib/group-compatibility.ts` | 타입, `calcGroupCompatibility()`, 세션 저장/로드 |
| Create | `lib/__tests__/group-compatibility.test.ts` | 단위 테스트 |
| Create | `components/CompatibilityTabs.tsx` | "1:1 / 모임" 탭 UI |
| Modify | `app/compatibility/CompatibilityLoader.tsx` | CompatibilityTabs 추가 |
| Create | `app/api/group-compatibility-analysis/route.ts` | Claude AI 스트리밍 |
| Create | `app/compatibility/group/page.tsx` | 서버 컴포넌트 (metadata) |
| Create | `app/compatibility/group/GroupCompatibilityLoader.tsx` | 동적 인원 추가 폼 |
| Create | `app/compatibility/group/result/page.tsx` | 서버 컴포넌트 (metadata) |
| Create | `app/compatibility/group/result/GroupResultLoader.tsx` | dynamic import + Suspense |
| Create | `app/compatibility/group/result/GroupResultContent.tsx` | SVG 그래프 + AI 분석 |

---

## Task 1: `lib/group-compatibility.ts` + 테스트

**Files:**
- Create: `lib/group-compatibility.ts`
- Create: `lib/__tests__/group-compatibility.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/__tests__/group-compatibility.test.ts`를 새로 만든다:

```typescript
import { calcGroupCompatibility } from '../group-compatibility';
import type { GroupMember } from '../group-compatibility';
import type { SajuResult } from '../saju-calculator';

function makeMember(ilgan: string, ohaengValues: [number, number, number, number, number]): GroupMember {
  const [목, 화, 토, 금, 수] = ohaengValues;
  const result: SajuResult = {
    year: { gan: '갑', ji: '자', ganElement: '목', jiElement: '수' },
    month: { gan: '갑', ji: '자', ganElement: '목', jiElement: '수' },
    day: { gan: ilgan, ji: '자', ganElement: '목', jiElement: '수' },
    hour: null,
    ilgan,
    ohaeng: { 목, 화, 토, 금, 수 },
  };
  return { name: `${ilgan}인`, gender: 'M', result };
}

describe('calcGroupCompatibility', () => {
  it('2명: 쌍 1개 반환', () => {
    const members = [
      makeMember('갑', [4, 2, 1, 1, 1]),
      makeMember('병', [1, 4, 2, 1, 1]),
    ];
    const { pairs, averageScore } = calcGroupCompatibility(members);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].indexA).toBe(0);
    expect(pairs[0].indexB).toBe(1);
    expect(typeof pairs[0].score).toBe('number');
    expect(['최상', '상', '중', '하']).toContain(pairs[0].grade);
    expect(averageScore).toBe(pairs[0].score);
  });

  it('3명: 쌍 3개 반환', () => {
    const members = [
      makeMember('갑', [4, 2, 1, 1, 1]),
      makeMember('병', [1, 4, 2, 1, 1]),
      makeMember('무', [1, 1, 4, 2, 1]),
    ];
    const { pairs } = calcGroupCompatibility(members);
    expect(pairs).toHaveLength(3);
    expect(pairs[0]).toMatchObject({ indexA: 0, indexB: 1 });
    expect(pairs[1]).toMatchObject({ indexA: 0, indexB: 2 });
    expect(pairs[2]).toMatchObject({ indexA: 1, indexB: 2 });
  });

  it('4명: 쌍 6개 반환', () => {
    const members = Array.from({ length: 4 }, (_, i) =>
      makeMember('갑', [4 - i, i + 1, 1, 1, 1])
    );
    const { pairs } = calcGroupCompatibility(members);
    expect(pairs).toHaveLength(6);
  });

  it('averageScore는 쌍 점수 평균 (반올림)', () => {
    const members = [
      makeMember('갑', [4, 2, 1, 1, 1]),
      makeMember('병', [1, 4, 2, 1, 1]),
      makeMember('무', [1, 1, 4, 2, 1]),
    ];
    const { pairs, averageScore } = calcGroupCompatibility(members);
    const expected = Math.round(pairs.reduce((s, p) => s + p.score, 0) / pairs.length);
    expect(averageScore).toBe(expected);
  });

  it('각 pair에 gradeLabel 포함', () => {
    const members = [
      makeMember('갑', [4, 2, 1, 1, 1]),
      makeMember('병', [1, 4, 2, 1, 1]),
    ];
    const { pairs } = calcGroupCompatibility(members);
    expect(typeof pairs[0].gradeLabel).toBe('string');
    expect(pairs[0].gradeLabel.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest lib/__tests__/group-compatibility.test.ts --no-coverage
```

Expected: `Cannot find module '../group-compatibility'` 오류로 FAIL

- [ ] **Step 3: `lib/group-compatibility.ts` 구현**

```typescript
import type { SajuResult } from './saju-calculator';
import { calcCompatibility } from './compatibility';
import { createSessionStore } from './session-store';

export interface GroupMember {
  name: string;
  gender: 'M' | 'F';
  result: SajuResult;
}

export interface PairResult {
  indexA: number;
  indexB: number;
  score: number;
  grade: '최상' | '상' | '중' | '하';
  gradeLabel: string;
}

export interface GroupCompatibilitySession {
  members: GroupMember[];
  pairs: PairResult[];
  averageScore: number;
}

export function calcGroupCompatibility(members: GroupMember[]): {
  pairs: PairResult[];
  averageScore: number;
} {
  const pairs: PairResult[] = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const r = calcCompatibility(members[i].result, members[j].result);
      pairs.push({
        indexA: i,
        indexB: j,
        score: r.score,
        grade: r.grade,
        gradeLabel: r.gradeLabel,
      });
    }
  }
  const averageScore =
    pairs.length > 0
      ? Math.round(pairs.reduce((sum, p) => sum + p.score, 0) / pairs.length)
      : 0;
  return { pairs, averageScore };
}

function isGroupCompatibilitySession(v: unknown): v is GroupCompatibilitySession {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    Array.isArray(r.members) &&
    r.members.length >= 2 &&
    r.members.length <= 10 &&
    Array.isArray(r.pairs) &&
    typeof r.averageScore === 'number'
  );
}

const store = createSessionStore('group-compatibility-session', isGroupCompatibilitySession);

export const saveGroupCompatSession = store.save;
export const loadGroupCompatSession = store.load;
export const clearGroupCompatSession = store.clear;
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest lib/__tests__/group-compatibility.test.ts --no-coverage
```

Expected: 5개 PASS

- [ ] **Step 5: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 6: 커밋**

```bash
git checkout -b feat/group-compatibility
git add lib/group-compatibility.ts lib/__tests__/group-compatibility.test.ts
git commit -m "feat: 모임 궁합 계산 로직 및 세션 스토어"
```

---

## Task 2: `CompatibilityTabs` 컴포넌트

**Files:**
- Create: `components/CompatibilityTabs.tsx`

- [ ] **Step 1: `components/CompatibilityTabs.tsx` 생성**

```tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';

const TABS = [
  { label: '1:1 궁합', icon: '💑', href: '/compatibility', match: ['/compatibility', '/compatibility/result'] },
  { label: '모임 궁합', icon: '👥', href: '/compatibility/group', match: ['/compatibility/group', '/compatibility/group/result'] },
] as const;

export default function CompatibilityTabs() {
  const pathname = usePathname();
  const router = useRouter();

  const activeHref = TABS.find((t) => t.match.some((m) => pathname === m || pathname.startsWith(m + '/')))
    ?.href ?? '/compatibility';

  return (
    <div className="flex border-b border-border" role="tablist" aria-label="궁합 유형 선택">
      {TABS.map(({ label, icon, href }) => {
        const isActive = activeHref === href;
        return (
          <button
            key={href}
            role="tab"
            aria-selected={isActive}
            onClick={() => router.push(href)}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative flex items-center justify-center gap-1.5 ${
              isActive ? 'text-primary' : 'text-muted'
            }`}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-gradient"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add components/CompatibilityTabs.tsx
git commit -m "feat: 1:1/모임 궁합 탭 컴포넌트"
```

---

## Task 3: 기존 `CompatibilityLoader`에 탭 추가

**Files:**
- Modify: `app/compatibility/CompatibilityLoader.tsx`

- [ ] **Step 1: `CompatibilityLoader.tsx`의 현재 `<header>` 바로 아래에 `<CompatibilityTabs />` 삽입**

파일 상단 import에 추가:
```tsx
import CompatibilityTabs from '@/components/CompatibilityTabs';
```

return JSX에서 `<header>...</header>` 바로 다음에 추가:
```tsx
<CompatibilityTabs />
```

완성된 JSX 골격:
```tsx
return (
  <div className="flex flex-col flex-1">
    <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
      <BackButton href="/" label="뒤로" />
      <h1 className="text-sm font-semibold text-primary">궁합 보기</h1>
    </header>

    <CompatibilityTabs />

    <div className="flex flex-col gap-4 px-4 py-6 flex-1">
      {/* 기존 폼 내용 유지 */}
    </div>
    {/* 기존 버튼 영역 유지 */}
  </div>
);
```

- [ ] **Step 2: 타입 체크 + 전체 테스트**

```bash
npx tsc --noEmit && npx jest --no-coverage
```

Expected: 오류 없음, 전체 PASS

- [ ] **Step 3: 커밋**

```bash
git add app/compatibility/CompatibilityLoader.tsx
git commit -m "feat: 궁합 페이지 상단에 1:1/모임 탭 추가"
```

---

## Task 4: AI 분석 API

**Files:**
- Create: `app/api/group-compatibility-analysis/route.ts`

- [ ] **Step 1: `app/api/group-compatibility-analysis/route.ts` 생성**

```typescript
import { NextRequest } from 'next/server';
import { parseBody, streamAnthropicResponse, formatOhaeng } from '@/lib/stream-anthropic';
import { AI_MODEL } from '@/lib/anthropic';
import { getRateLimitResponse } from '@/lib/rate-limit';

interface MemberData {
  name: string;
  ilgan: string;
  ohaeng: Record<string, number>;
}

interface GroupAnalysisRequest {
  members: MemberData[];
  averageScore: number;
}

function isMemberData(v: unknown): v is MemberData {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).name === 'string' &&
    typeof (v as Record<string, unknown>).ilgan === 'string' &&
    typeof (v as Record<string, unknown>).ohaeng === 'object' &&
    (v as Record<string, unknown>).ohaeng !== null
  );
}

function isGroupAnalysisRequest(v: unknown): v is GroupAnalysisRequest {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    Array.isArray(r.members) &&
    r.members.length >= 2 &&
    r.members.every(isMemberData) &&
    typeof r.averageScore === 'number'
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  const rateLimitRes = await getRateLimitResponse(req);
  if (rateLimitRes) return rateLimitRes;

  const parsed = await parseBody(req, isGroupAnalysisRequest);
  if (parsed instanceof Response) return parsed;

  const { members, averageScore } = parsed.data;
  const N = members.length;

  const memberLines = members
    .map((m, i) => {
      const name = m.name || `${i + 1}번째 분`;
      return `${i + 1}. ${name}: 일간 ${m.ilgan}, 오행 분포 ${formatOhaeng(m.ohaeng)}`;
    })
    .join('\n');

  try {
    return streamAnthropicResponse({
      model: AI_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `당신은 30년 경력의 명리학 전문가입니다. 다음 ${N}명의 사주 오행을 분석해 이 모임의 전체 역학을 한국어로 설명해주세요.

${memberLines}
전체 조화도: ${averageScore}점

**그룹의 강점**, **주의할 관계**, **함께 시너지를 내는 방법** 세 가지 측면에서 각 2~3문장씩 따뜻하고 구체적인 말투로 설명해주세요.`,
        },
      ],
    });
  } catch (error) {
    console.error('[group-compatibility-analysis] AI request failed:', error);
    return new Response('AI 분석 요청에 실패했어요.', { status: 500 });
  }
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add app/api/group-compatibility-analysis/route.ts
git commit -m "feat: 모임 궁합 AI 분석 API 라우트"
```

---

## Task 5: 모임 궁합 입력 페이지

**Files:**
- Create: `app/compatibility/group/page.tsx`
- Create: `app/compatibility/group/GroupCompatibilityLoader.tsx`

- [ ] **Step 1: `app/compatibility/group/page.tsx` 생성**

```tsx
import type { Metadata } from 'next';
import GroupCompatibilityLoader from './GroupCompatibilityLoader';

export const metadata: Metadata = {
  title: '모임 궁합 분석',
  description: '여러 사람의 사주로 모임 궁합을 분석합니다.',
};

export default function GroupCompatibilityPage() {
  return <GroupCompatibilityLoader />;
}
```

- [ ] **Step 2: `app/compatibility/group/GroupCompatibilityLoader.tsx` 생성**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateSaju } from '@/lib/saju-calculator';
import { calcGroupCompatibility, saveGroupCompatSession } from '@/lib/group-compatibility';
import { loadProfiles } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
import BackButton from '@/components/BackButton';
import PersonInputFields from '@/components/PersonInputFields';
import CompatibilityTabs from '@/components/CompatibilityTabs';

interface MemberForm {
  name: string;
  gender: 'M' | 'F';
  isLunar: boolean;
  year: number;
  month: number;
  day: number;
  hour: number | null;
}

function defaultMember(): MemberForm {
  return {
    name: '',
    gender: 'M',
    isLunar: false,
    year: new Date().getFullYear() - 30,
    month: 1,
    day: 1,
    hour: null,
  };
}

function updateMember(members: MemberForm[], index: number, patch: Partial<MemberForm>): MemberForm[] {
  return members.map((m, i) => (i === index ? { ...m, ...patch } : m));
}

export default function GroupCompatibilityLoader() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberForm[]>([defaultMember(), defaultMember()]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setProfiles(loadProfiles());
  }, []);

  function addMember() {
    if (members.length >= 10) return;
    setMembers((prev) => [...prev, defaultMember()]);
  }

  function removeMember(index: number) {
    if (members.length <= 2) return;
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  function loadProfile(index: number, profile: Profile) {
    setMembers((prev) =>
      updateMember(prev, index, {
        name: profile.name,
        year: profile.year,
        month: profile.month,
        day: profile.day,
        hour: profile.hour,
        isLunar: profile.isLunar,
        gender: profile.gender,
      })
    );
  }

  function handleSubmit() {
    setError('');
    try {
      const groupMembers = members.map((m) => {
        const maxDay = m.isLunar ? 30 : new Date(m.year, m.month, 0).getDate();
        const day = Math.min(m.day, maxDay);
        const result = calculateSaju({ year: m.year, month: m.month, day, hour: m.hour, isLunar: m.isLunar });
        return { name: m.name, gender: m.gender, result };
      });
      const { pairs, averageScore } = calcGroupCompatibility(groupMembers);
      saveGroupCompatSession({ members: groupMembers, pairs, averageScore });
      router.push('/compatibility/group/result');
    } catch {
      setError('입력한 날짜를 확인해주세요.');
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <BackButton href="/" label="뒤로" />
        <h1 className="text-sm font-semibold text-primary">궁합 보기</h1>
      </header>

      <CompatibilityTabs />

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        {members.map((m, index) => (
          <div key={index} className="relative">
            <PersonInputFields
              label={`👤 ${index + 1}번째 인물`}
              profileChips={
                profiles.length > 0 ? (
                  <div>
                    <p className="text-xs text-muted mb-1.5">저장된 프로필 불러오기</p>
                    <div className="flex flex-wrap gap-2">
                      {profiles.map((profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => loadProfile(index, profile)}
                          className="bg-card-hover rounded-full px-3 py-1.5 text-xs text-primary"
                        >
                          {profile.name || '이름 없음'} · {profile.ilgan}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : undefined
              }
              name={m.name}
              onNameChange={(v) => setMembers((prev) => updateMember(prev, index, { name: v }))}
              gender={m.gender}
              onGenderChange={(v) => setMembers((prev) => updateMember(prev, index, { gender: v }))}
              isLunar={m.isLunar}
              onIsLunarChange={(v) => setMembers((prev) => updateMember(prev, index, { isLunar: v }))}
              year={m.year}
              month={m.month}
              day={m.day}
              maxDay={m.isLunar ? 30 : new Date(m.year, m.month, 0).getDate()}
              onYearChange={(v) => setMembers((prev) => updateMember(prev, index, { year: v }))}
              onMonthChange={(v) => setMembers((prev) => updateMember(prev, index, { month: v }))}
              onDayChange={(v) => setMembers((prev) => updateMember(prev, index, { day: v }))}
              hourValue={m.hour}
              onHourChange={(v) => setMembers((prev) => updateMember(prev, index, { hour: v }))}
              showOptionalHints
              namePlaceholder={`${index + 1}번째 이름 (선택)`}
              compact
            />
            {members.length > 2 && (
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="absolute top-3 right-3 text-xs text-muted hover:text-hwa transition-colors"
                aria-label={`${index + 1}번째 인물 삭제`}
              >
                삭제
              </button>
            )}
          </div>
        ))}

        {error && <p className="text-sm text-hwa text-center">{error}</p>}
      </div>

      <div className="px-4 pb-8 flex flex-col gap-3">
        {members.length < 10 && (
          <button
            type="button"
            onClick={addMember}
            className="w-full py-3 rounded-2xl border border-dashed border-border text-sm font-medium text-muted hover:text-primary hover:border-primary transition-colors"
          >
            + 인원 추가 ({members.length}/10)
          </button>
        )}
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl bg-primary-gradient text-white font-semibold text-sm"
        >
          모임 궁합 분석하기
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add app/compatibility/group/page.tsx app/compatibility/group/GroupCompatibilityLoader.tsx
git commit -m "feat: 모임 궁합 입력 페이지"
```

---

## Task 6: 모임 궁합 결과 페이지

**Files:**
- Create: `app/compatibility/group/result/page.tsx`
- Create: `app/compatibility/group/result/GroupResultLoader.tsx`
- Create: `app/compatibility/group/result/GroupResultContent.tsx`

- [ ] **Step 1: `app/compatibility/group/result/page.tsx` 생성**

```tsx
import type { Metadata } from 'next';
import GroupResultLoader from './GroupResultLoader';

export const metadata: Metadata = {
  title: '모임 궁합 결과',
  description: '모임 구성원들의 사주 궁합 분석 결과입니다.',
};

export default function GroupResultPage() {
  return <GroupResultLoader />;
}
```

- [ ] **Step 2: `app/compatibility/group/result/GroupResultLoader.tsx` 생성**

```tsx
'use client';

import dynamic from 'next/dynamic';
import { SkeletonBox } from '@/components/Skeleton';

function GroupResultSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-24" />
      </header>
      <div className="flex flex-col gap-4 px-4 py-6 flex-1 items-center">
        <SkeletonBox className="h-6 w-40" />
        <SkeletonBox className="h-64 w-64 rounded-full" />
        <SkeletonBox className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}

const GroupResultContent = dynamic(() => import('./GroupResultContent'), {
  ssr: false,
  loading: () => <GroupResultSkeleton />,
});

export default function GroupResultLoader() {
  return <GroupResultContent />;
}
```

- [ ] **Step 3: `app/compatibility/group/result/GroupResultContent.tsx` 생성**

```tsx
'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadGroupCompatSession } from '@/lib/group-compatibility';
import type { GroupCompatibilitySession, PairResult } from '@/lib/group-compatibility';
import { useSessionOrRedirect } from '@/hooks/useSessionOrRedirect';
import { useAiText } from '@/hooks/useAiText';
import AiContent from '@/components/AiContent';
import BackButton from '@/components/BackButton';
import SessionExpiredPage from '@/components/SessionExpiredPage';

// SVG 설정
const SVG_SIZE = 300;
const CENTER = SVG_SIZE / 2;
const LAYOUT_R = 100; // 원형 배치 반지름
const NODE_R = 22;    // 노드 원 반지름

const GRADE_STYLE: Record<PairResult['grade'], { color: string; width: number }> = {
  '최상': { color: '#4ade80', width: 3.5 },
  '상':   { color: '#60a5fa', width: 2.5 },
  '중':   { color: '#facc15', width: 2 },
  '하':   { color: '#f87171', width: 1.5 },
};

const OVERALL_LABEL: Record<string, string> = {
  '85': '천생연분 모임',
  '70': '좋은 모임',
  '50': '보통 모임',
  '0':  '주의 필요',
};

function getOverallLabel(score: number): string {
  if (score >= 85) return OVERALL_LABEL['85'];
  if (score >= 70) return OVERALL_LABEL['70'];
  if (score >= 50) return OVERALL_LABEL['50'];
  return OVERALL_LABEL['0'];
}

function getNodePositions(count: number): { x: number; y: number }[] {
  if (count === 2) {
    return [
      { x: CENTER - LAYOUT_R, y: CENTER },
      { x: CENTER + LAYOUT_R, y: CENTER },
    ];
  }
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    return {
      x: CENTER + LAYOUT_R * Math.cos(angle),
      y: CENTER + LAYOUT_R * Math.sin(angle),
    };
  });
}

function getMemberName(session: GroupCompatibilitySession, index: number): string {
  return session.members[index].name || `${index + 1}번째 분`;
}

export default function GroupResultContent() {
  const router = useRouter();
  const session = useSessionOrRedirect(loadGroupCompatSession, null);
  const { aiText, isStreaming, aiError, request } = useAiText();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const positions = useMemo(() => {
    if (!session || session === 'not-found') return [];
    return getNodePositions(session.members.length);
  }, [session]);

  const handleAiRequest = useCallback(() => {
    if (!session || session === 'not-found') return;
    void request('/api/group-compatibility-analysis', {
      members: session.members.map((m) => ({
        name: m.name,
        ilgan: m.result.ilgan,
        ohaeng: m.result.ohaeng,
      })),
      averageScore: session.averageScore,
    });
  }, [request, session]);

  if (session === 'not-found') {
    return (
      <SessionExpiredPage redirectPath="/compatibility/group" redirectLabel="다시 입력하기" />
    );
  }

  if (!session) return null;

  const selectedPairs =
    selectedIndex !== null
      ? session.pairs.filter((p) => p.indexA === selectedIndex || p.indexB === selectedIndex)
      : [];

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <BackButton href="/compatibility/group" label="뒤로" />
        <h1 className="text-sm font-semibold text-primary">모임 궁합 결과</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        {/* 전체 조화도 */}
        <div className="bg-card rounded-2xl p-5 flex flex-col items-center gap-1">
          <p className="text-xs text-muted">전체 조화도</p>
          <p
            className="text-5xl font-extrabold"
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {session.averageScore}
          </p>
          <p className="text-sm font-semibold text-primary">{getOverallLabel(session.averageScore)}</p>
          <p className="text-xs text-muted">
            {session.members.length}명 · {session.pairs.length}쌍 분석
          </p>
        </div>

        {/* SVG 관계 그래프 */}
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-3">이름을 탭하면 관계를 볼 수 있어요</p>
          <svg
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="w-full max-w-xs mx-auto block"
            aria-label="모임 구성원 관계 그래프"
          >
            {/* 관계선 */}
            {session.pairs.map((pair, i) => {
              const a = positions[pair.indexA];
              const b = positions[pair.indexB];
              const style = GRADE_STYLE[pair.grade];
              const isInvolved =
                selectedIndex === null ||
                pair.indexA === selectedIndex ||
                pair.indexB === selectedIndex;
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={style.color}
                  strokeWidth={style.width}
                  strokeOpacity={isInvolved ? 0.85 : 0.12}
                  style={{ transition: 'stroke-opacity 0.2s' }}
                />
              );
            })}

            {/* 노드 */}
            {session.members.map((member, i) => {
              const pos = positions[i];
              const isSelected = selectedIndex === i;
              return (
                <g
                  key={i}
                  onClick={() => setSelectedIndex(isSelected ? null : i)}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  aria-label={`${getMemberName(session, i)} 관계 보기`}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_R}
                    fill={isSelected ? '#4c1d95' : '#1e1b4b'}
                    stroke={isSelected ? '#a78bfa' : '#6d28d9'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 4}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#e2e8f0"
                    fontWeight="600"
                  >
                    {getMemberName(session, i).slice(0, 4)}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 8}
                    textAnchor="middle"
                    fontSize="7"
                    fill="#a78bfa"
                  >
                    {member.result.ilgan}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* 범례 */}
          <div className="flex justify-center gap-3 mt-2 flex-wrap">
            {(Object.entries(GRADE_STYLE) as [PairResult['grade'], { color: string; width: number }][]).map(
              ([grade, { color }]) => (
                <span key={grade} className="flex items-center gap-1 text-xs text-muted">
                  <span
                    style={{
                      display: 'inline-block',
                      width: 16,
                      height: 2,
                      background: color,
                      borderRadius: 1,
                    }}
                    aria-hidden="true"
                  />
                  {grade}
                </span>
              )
            )}
          </div>
        </div>

        {/* 선택된 인물 관계 목록 */}
        {selectedIndex !== null && (
          <div className="bg-card rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-primary">
              {getMemberName(session, selectedIndex)}의 관계
            </p>
            {selectedPairs.map((pair, i) => {
              const otherIndex = pair.indexA === selectedIndex ? pair.indexB : pair.indexA;
              const style = GRADE_STYLE[pair.grade];
              return (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-primary">
                    {getMemberName(session, otherIndex)}
                  </span>
                  <span
                    className="text-xs font-semibold rounded-full px-3 py-1"
                    style={{ color: style.color, background: `${style.color}22` }}
                  >
                    {pair.score} {pair.gradeLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* AI 분석 */}
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-primary">모임 AI 분석</p>
          <AiContent
            aiText={aiText}
            isStreaming={isStreaming}
            aiError={aiError}
            onRequest={handleAiRequest}
            requestLabel="모임 분석 요청하기"
          />
        </div>
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={() => router.push('/compatibility/group')}
          className="w-full py-4 rounded-2xl border border-border text-sm font-medium text-primary"
        >
          다시 분석하기
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 타입 체크 + 전체 테스트**

```bash
npx tsc --noEmit && npx jest --no-coverage
```

Expected: 오류 없음, 전체 PASS

- [ ] **Step 5: 커밋**

```bash
git add app/compatibility/group/result/page.tsx \
        app/compatibility/group/result/GroupResultLoader.tsx \
        app/compatibility/group/result/GroupResultContent.tsx
git commit -m "feat: 모임 궁합 결과 페이지 (SVG 그래프 + AI 분석)"
```

---

## Task 7: 수동 검증 및 PR

- [ ] **Step 1: 개발 서버 실행**

```bash
npm run dev
```

- [ ] **Step 2: 기본 플로우 검증**

1. `http://localhost:3000/compatibility` 접속 → 상단에 "1:1 궁합 / 모임 궁합" 탭이 보이는지 확인
2. "모임 궁합" 탭 클릭 → `/compatibility/group`으로 이동하는지 확인
3. 초기 멤버 2명 폼이 보이는지 확인
4. "+ 인원 추가" 클릭 3회 → 5명으로 늘어나는지 확인
5. "삭제" 버튼 클릭 → 인원이 줄어드는지 확인
6. 10명까지 추가 후 "+ 인원 추가" 버튼이 사라지는지 확인

- [ ] **Step 3: 결과 페이지 검증**

1. 3명 정보 입력 → "모임 궁합 분석하기" 클릭
2. `/compatibility/group/result` 이동 확인
3. 전체 조화도 점수 표시 확인
4. SVG 그래프에 3개 노드 + 3개 관계선 표시 확인
5. 노드 탭 → 해당 인물의 관계 목록 슬라이드 표시 확인
6. 다시 탭 → 선택 해제 확인
7. "모임 분석 요청하기" 버튼 → AI 스트리밍 시작 확인

- [ ] **Step 4: 엣지 케이스 검증**

1. 이름 없이 제출 → "1번째 분", "2번째 분"으로 대체되는지 확인
2. `/compatibility/group/result` 직접 접근 (세션 없음) → `SessionExpiredPage` 표시 확인
3. "1:1 궁합" 탭 → `/compatibility`로 이동 확인

- [ ] **Step 5: PR 생성**

```bash
git push -u origin feat/group-compatibility
gh pr create \
  --title "feat: 모임 궁합 기능 (SVG 관계 그래프 + AI 분석)" \
  --body "$(cat <<'EOF'
## Summary
- `/compatibility` 상단에 "1:1 궁합 / 모임 궁합" 탭 추가
- `/compatibility/group`: 2~10명 동적 추가 입력 폼, 저장된 프로필 불러오기 지원
- `/compatibility/group/result`: SVG 원형 관계 그래프 (노드 탭 → 관계 상세), Claude AI 모임 전체 분석
- `lib/group-compatibility.ts`: `calcGroupCompatibility()` 순수 함수 + sessionStorage 세션 관리
- `app/api/group-compatibility-analysis/route.ts`: N명 오행 데이터 → Claude 스트리밍

## Test plan
- [ ] `/compatibility`에서 모임 탭 클릭 → `/compatibility/group` 이동
- [ ] 인원 2~10명 동적 추가/삭제
- [ ] 저장된 프로필 불러오기 → 폼 자동 채워짐
- [ ] 분석 후 SVG 그래프 노드/관계선 표시
- [ ] 노드 탭 → 관계 목록 표시, 재탭 → 해제
- [ ] "모임 분석 요청하기" → AI 스트리밍
- [ ] 세션 없이 결과 직접 접근 → SessionExpiredPage
- [ ] 1:1 탭 전환 → 기존 1:1 궁합 페이지 정상 작동

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
