# 궁합 초대 링크 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A가 자신의 사주 정보를 URL에 인코딩한 링크를 생성해 B에게 공유하면, B가 자신의 정보를 입력해 궁합 결과를 확인할 수 있게 한다.

**Architecture:** A의 정보를 URL-safe base64로 인코딩해 `?from=` 파라미터에 담고, `/compatibility/invite` 전용 페이지에서 B가 자신의 정보를 입력하면 기존 `calcCompatibility` + `saveCompatSession` + `/compatibility/result` 흐름을 재활용한다. DB/서버 저장 없음.

**Tech Stack:** Next.js 15 App Router, TypeScript, Jest (TDD), Tailwind CSS, Web Share API

---

## 파일 구조

| 파일 | 역할 |
|------|------|
| `lib/invite.ts` (신규) | InvitePayload 타입 + encode/decode 유틸 |
| `lib/__tests__/invite.test.ts` (신규) | invite.ts 단위 테스트 |
| `app/compatibility/invite/page.tsx` (신규) | 서버 컴포넌트 — 메타데이터 + Suspense 경계 |
| `app/compatibility/invite/InviteLoader.tsx` (신규) | 클라이언트 컴포넌트 — 초대 랜딩 UI + B 입력 폼 |
| `app/compatibility/CompatibilityLoader.tsx` (수정) | "링크로 초대" 버튼 추가 |

---

## Task 1: `lib/invite.ts` — 인코딩/디코딩 유틸 (TDD)

**Files:**
- Create: `lib/invite.ts`
- Create: `lib/__tests__/invite.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/__tests__/invite.test.ts` 생성:

```ts
import { encodeInvite, decodeInvite } from '../invite';
import type { InvitePayload } from '../invite';

const valid: InvitePayload = {
  name: '홍길동',
  year: 1990,
  month: 5,
  day: 15,
  hour: 10,
  isLunar: false,
  gender: 'M',
};

describe('encodeInvite / decodeInvite', () => {
  it('인코딩 후 디코딩하면 원본과 동일', () => {
    const encoded = encodeInvite(valid);
    expect(decodeInvite(encoded)).toEqual(valid);
  });

  it('hour가 null이어도 정상 동작', () => {
    const payload = { ...valid, hour: null };
    expect(decodeInvite(encodeInvite(payload))).toEqual(payload);
  });

  it('인코딩 결과에 +, /, = 없음 (URL-safe)', () => {
    const encoded = encodeInvite(valid);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('잘못된 문자열 → null', () => {
    expect(decodeInvite('not-valid-base64!!!!')).toBeNull();
  });

  it('필드 누락 → null', () => {
    const broken = btoa(JSON.stringify({ name: '홍길동', year: 1990 }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    expect(decodeInvite(broken)).toBeNull();
  });

  it('year 범위 이탈 (1800) → null', () => {
    const bad = { ...valid, year: 1800 };
    const encoded = btoa(JSON.stringify(bad))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    expect(decodeInvite(encoded)).toBeNull();
  });

  it('month 범위 이탈 (13) → null', () => {
    const bad = { ...valid, month: 13 };
    const encoded = btoa(JSON.stringify(bad))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    expect(decodeInvite(encoded)).toBeNull();
  });

  it('gender 잘못된 값 → null', () => {
    const bad = { ...valid, gender: 'X' };
    const encoded = btoa(JSON.stringify(bad))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    expect(decodeInvite(encoded)).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest lib/__tests__/invite.test.ts --no-coverage
```

Expected: `FAIL` — `Cannot find module '../invite'`

- [ ] **Step 3: `lib/invite.ts` 구현**

```ts
export interface InvitePayload {
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  isLunar: boolean;
  gender: 'M' | 'F';
}

export function encodeInvite(payload: InvitePayload): string {
  return btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function decodeInvite(encoded: string): InvitePayload | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const parsed: unknown = JSON.parse(atob(padded));
    return isInvitePayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const CURRENT_YEAR = new Date().getFullYear();

function isInvitePayload(v: unknown): v is InvitePayload {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.name === 'string' &&
    typeof r.year === 'number' && r.year >= 1900 && r.year <= CURRENT_YEAR &&
    typeof r.month === 'number' && r.month >= 1 && r.month <= 12 &&
    typeof r.day === 'number' && r.day >= 1 && r.day <= 31 &&
    (r.hour === null || (typeof r.hour === 'number' && r.hour >= 0 && r.hour <= 23)) &&
    typeof r.isLunar === 'boolean' &&
    (r.gender === 'M' || r.gender === 'F')
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest lib/__tests__/invite.test.ts --no-coverage
```

Expected: `PASS` — 8 tests passed

- [ ] **Step 5: 커밋**

```bash
git checkout -b feat/compatibility-invite-link
git add lib/invite.ts lib/__tests__/invite.test.ts
git commit -m "feat: add invite link encode/decode utility"
```

---

## Task 2: 초대 랜딩 페이지 — `page.tsx` + `InviteLoader.tsx`

**Files:**
- Create: `app/compatibility/invite/page.tsx`
- Create: `app/compatibility/invite/InviteLoader.tsx`

- [ ] **Step 1: `app/compatibility/invite/page.tsx` 작성**

```tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';
import InviteLoader from './InviteLoader';
import { SkeletonBox } from '@/components/Skeleton';

export const metadata: Metadata = {
  title: '궁합 초대',
  description: '궁합 분석 초대를 받았습니다. 내 정보를 입력해 궁합을 확인하세요.',
};

function InviteSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-24" />
      </header>
      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <SkeletonBox className="h-24 rounded-2xl" />
        <SkeletonBox className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<InviteSkeleton />}>
      <InviteLoader />
    </Suspense>
  );
}
```

- [ ] **Step 2: `app/compatibility/invite/InviteLoader.tsx` 작성**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeInvite } from '@/lib/invite';
import type { InvitePayload } from '@/lib/invite';
import { calculateSaju } from '@/lib/saju-calculator';
import { calcCompatibility, saveCompatSession } from '@/lib/compatibility';
import BackButton from '@/components/BackButton';
import PersonInputFields from '@/components/PersonInputFields';

export default function InviteLoader() {
  const router = useRouter();
  const params = useSearchParams();
  const [personA, setPersonA] = useState<InvitePayload | null>(null);
  const [invalid, setInvalid] = useState(false);

  const defaultYear = new Date().getFullYear() - 30;
  const [nameB, setNameB] = useState('');
  const [genderB, setGenderB] = useState<'M' | 'F'>('M');
  const [isLunarB, setIsLunarB] = useState(false);
  const [yearB, setYearB] = useState(defaultYear);
  const [monthB, setMonthB] = useState(1);
  const [dayB, setDayB] = useState(1);
  const [hourValueB, setHourValueB] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const from = params.get('from');
    if (!from) {
      setInvalid(true);
      return;
    }
    const payload = decodeInvite(from);
    if (!payload) {
      setInvalid(true);
      return;
    }
    setPersonA(payload);
  }, [params]);

  if (invalid) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4 px-4">
        <p className="text-sm text-muted text-center">올바르지 않은 초대 링크입니다.</p>
        <button
          onClick={() => router.push('/compatibility')}
          className="py-3 px-6 rounded-2xl bg-primary-gradient text-white font-semibold text-sm"
        >
          궁합 직접 보기
        </button>
      </div>
    );
  }

  if (!personA) return null;

  const maxDayB = isLunarB ? 30 : new Date(yearB, monthB, 0).getDate();
  const clampedDayB = Math.min(dayB, maxDayB);

  function handleSubmit() {
    if (!personA) return;
    setError('');
    try {
      const resultA = calculateSaju({
        year: personA.year,
        month: personA.month,
        day: personA.day,
        hour: personA.hour,
        isLunar: personA.isLunar,
      });
      const resultB = calculateSaju({
        year: yearB,
        month: monthB,
        day: clampedDayB,
        hour: hourValueB,
        isLunar: isLunarB,
      });
      const compatibility = calcCompatibility(resultA, resultB);
      saveCompatSession({
        personA: { name: personA.name, gender: personA.gender, result: resultA },
        personB: { name: nameB, gender: genderB, result: resultB },
        compatibility,
      });
      router.push('/compatibility/result');
    } catch {
      setError('입력한 날짜를 확인해주세요.');
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <BackButton href="/compatibility" label="뒤로" />
        <h1 className="text-sm font-semibold text-primary">궁합 초대</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        {/* A 정보 — read-only */}
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-xs text-muted">궁합을 요청한 사람</p>
          <p className="text-sm font-semibold text-primary">
            {personA.name || '이름 없음'} ({personA.gender === 'M' ? '남' : '여'})
          </p>
          <p className="text-xs text-muted">
            {personA.year}년 {personA.month}월 {personA.day}일
            {personA.hour !== null ? ` ${personA.hour}시` : ''}
            {personA.isLunar ? ' (음력)' : ''}
          </p>
        </div>

        {/* B 정보 입력 */}
        <PersonInputFields
          label="💑 내 정보"
          name={nameB}
          onNameChange={setNameB}
          gender={genderB}
          onGenderChange={setGenderB}
          isLunar={isLunarB}
          onIsLunarChange={setIsLunarB}
          year={yearB}
          month={monthB}
          day={clampedDayB}
          maxDay={maxDayB}
          onYearChange={setYearB}
          onMonthChange={setMonthB}
          onDayChange={setDayB}
          hourValue={hourValueB}
          onHourChange={setHourValueB}
          showOptionalHints
          namePlaceholder="이름을 입력하세요"
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

- [ ] **Step 3: 커밋**

```bash
git add app/compatibility/invite/page.tsx app/compatibility/invite/InviteLoader.tsx
git commit -m "feat: add compatibility invite landing page"
```

---

## Task 3: `CompatibilityLoader.tsx`에 "링크로 초대" 버튼 추가

**Files:**
- Modify: `app/compatibility/CompatibilityLoader.tsx`

- [ ] **Step 1: import 추가 및 상태 추가**

`CompatibilityLoader.tsx` 상단 import에 `encodeInvite` 추가:

```ts
import { encodeInvite } from '@/lib/invite';
```

`useState` 훅 목록 아래에 `copied` 상태 추가:

```ts
const [copied, setCopied] = useState(false);
```

- [ ] **Step 2: 초대 링크 생성 함수 추가**

`handleSubmit` 함수 위에 추가:

```ts
function handleInvite() {
  const encoded = encodeInvite({
    name: nameA,
    year: yearA,
    month: monthA,
    day: clampedDayA,
    hour: hourValueA,
    isLunar: isLunarA,
    gender: genderA,
  });
  const url = `${window.location.origin}/compatibility/invite?from=${encoded}`;

  if (navigator.share) {
    navigator.share({ title: '궁합 초대', text: `${nameA || '누군가'}가 궁합을 보자고 했어요!`, url });
  } else {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
}
```

- [ ] **Step 3: "링크로 초대" 버튼 추가**

기존 "궁합 분석하기" 버튼(`<div className="px-4 pb-8">`)을 다음으로 교체:

```tsx
<div className="px-4 pb-8 flex flex-col gap-3">
  <button
    onClick={handleSubmit}
    className="w-full py-4 rounded-2xl bg-primary-gradient text-white font-semibold text-sm"
  >
    궁합 분석하기
  </button>
  <button
    onClick={handleInvite}
    disabled={!nameA.trim()}
    className="w-full py-3 rounded-2xl border border-border text-sm font-medium text-primary disabled:opacity-40"
  >
    {copied ? '링크 복사됨!' : '링크로 초대하기'}
  </button>
</div>
```

- [ ] **Step 4: 타입 체크 + 전체 테스트 통과 확인**

```bash
npx tsc --noEmit && npx jest --no-coverage
```

Expected: 타입 오류 없음, 모든 테스트 통과

- [ ] **Step 5: 커밋**

```bash
git add app/compatibility/CompatibilityLoader.tsx
git commit -m "feat: add invite link button to compatibility input page"
```

---

## Task 4: PR 생성

- [ ] **Step 1: 브랜치 푸시 및 PR 생성**

```bash
git push -u origin feat/compatibility-invite-link
gh pr create \
  --title "feat: 링크 기반 궁합 초대 기능" \
  --body "$(cat <<'EOF'
## Summary
- A가 자신의 사주 정보를 URL-safe base64로 인코딩한 링크 생성
- B가 링크 접속 시 A 정보 확인 후 자신의 정보만 입력해 궁합 결과 확인
- DB/서버 저장 없이 URL 파라미터만 활용

## Test plan
- [ ] A: /compatibility 에서 이름 입력 → "링크로 초대하기" 버튼 활성화 확인
- [ ] 버튼 클릭 → Web Share API 또는 클립보드 복사 확인
- [ ] B: 복사된 링크 접속 → A 정보 read-only 표시 확인
- [ ] B: 내 정보 입력 후 "궁합 분석하기" → /compatibility/result 정상 이동 확인
- [ ] 잘못된 링크 (`?from=garbage`) 접속 → 에러 안내 + 버튼 표시 확인
- [ ] `?from` 파라미터 없이 /compatibility/invite 직접 접속 → 에러 안내 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
