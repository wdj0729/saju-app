# Bottom Nav + Date Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 페이지에 하단 4탭 네비게이션을 추가하고, 사주/궁합 입력 폼의 년·월·일 select를 숫자 직접 입력 필드로 교체한다.

**Architecture:** BottomNav는 `usePathname()`으로 활성 탭을 감지해 `app/layout.tsx`에 전역 삽입한다. DateInput은 내부 string 상태로 부분 입력을 허용하고 blur 시 클램핑한다. 두 컴포넌트 모두 재사용 가능한 단위로 추출한다.

**Tech Stack:** Next.js App Router, React `useRef`/`useEffect`, Tailwind CSS, Jest (testEnvironment: node)

---

### Task 1: 스펙 문서 커밋

**Files:**
- Commit: `docs/superpowers/specs/2026-06-12-bottom-nav-date-input-design.md`

- [ ] **Step 1: 커밋**

```bash
git add docs/superpowers/specs/2026-06-12-bottom-nav-date-input-design.md
git commit -m "docs: add bottom-nav and date-input design spec"
```

---

### Task 2: DateInput 컴포넌트 + 클램핑 유틸 테스트

**Files:**
- Create: `components/DateInput.tsx`
- Create: `lib/__tests__/date-input-utils.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`lib/__tests__/date-input-utils.test.ts`:

```ts
import { clampYear, clampMonth, clampDay } from '../../components/DateInput';

describe('clampYear', () => {
  it('clamps below minimum to 1900', () => {
    expect(clampYear(1000)).toBe(1900);
  });
  it('clamps above current year', () => {
    const currentYear = new Date().getFullYear();
    expect(clampYear(currentYear + 5)).toBe(currentYear);
  });
  it('passes through valid year', () => {
    expect(clampYear(1990)).toBe(1990);
  });
});

describe('clampMonth', () => {
  it('clamps 0 to 1', () => expect(clampMonth(0)).toBe(1));
  it('clamps 13 to 12', () => expect(clampMonth(13)).toBe(12));
  it('passes through 6', () => expect(clampMonth(6)).toBe(6));
});

describe('clampDay', () => {
  it('clamps 0 to 1', () => expect(clampDay(0, 31)).toBe(1));
  it('clamps above maxDay', () => expect(clampDay(32, 31)).toBe(31));
  it('passes through valid day', () => expect(clampDay(15, 31)).toBe(15));
  it('respects maxDay of 28 (Feb non-leap)', () => expect(clampDay(30, 28)).toBe(28));
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
npx jest lib/__tests__/date-input-utils.test.ts --no-coverage
```

Expected: `Cannot find module '../../components/DateInput'`

- [ ] **Step 3: DateInput 컴포넌트 작성**

`components/DateInput.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

const YEAR_MAX = new Date().getFullYear();

export function clampYear(v: number): number {
  return Math.min(Math.max(v, 1900), YEAR_MAX);
}
export function clampMonth(v: number): number {
  return Math.min(Math.max(v, 1), 12);
}
export function clampDay(v: number, maxDay: number): number {
  return Math.min(Math.max(v, 1), maxDay);
}

interface DateInputProps {
  year: number;
  month: number;
  day: number;
  maxDay: number;
  onYearChange: (v: number) => void;
  onMonthChange: (v: number) => void;
  onDayChange: (v: number) => void;
}

const FIELD_CLASS =
  'bg-card border border-border rounded-xl text-primary text-sm text-center appearance-none py-3';

export default function DateInput({
  year,
  month,
  day,
  maxDay,
  onYearChange,
  onMonthChange,
  onDayChange,
}: DateInputProps) {
  const [yearStr, setYearStr] = useState(String(year));
  const [monthStr, setMonthStr] = useState(String(month).padStart(2, '0'));
  const [dayStr, setDayStr] = useState(String(day).padStart(2, '0'));

  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);

  // Sync from parent when a profile is loaded externally
  useEffect(() => {
    if (Number(yearStr) !== year) setYearStr(String(year));
  }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (Number(monthStr) !== month) setMonthStr(String(month).padStart(2, '0'));
  }, [month]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (Number(dayStr) !== day) setDayStr(String(day).padStart(2, '0'));
  }, [day]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        value={yearStr}
        className={`${FIELD_CLASS} w-20 px-2`}
        placeholder="1993"
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 4);
          setYearStr(v);
          if (v.length === 4) {
            onYearChange(clampYear(Number(v)));
            monthRef.current?.focus();
            monthRef.current?.select();
          } else {
            onYearChange(v ? Number(v) : year);
          }
        }}
        onBlur={() => {
          const clamped = clampYear(Number(yearStr) || 1900);
          setYearStr(String(clamped));
          onYearChange(clamped);
        }}
      />
      <span className="text-muted text-sm shrink-0">년</span>
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={monthStr}
        className={`${FIELD_CLASS} w-12 px-1`}
        placeholder="06"
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 2);
          setMonthStr(v);
          if (v.length === 2) {
            const clamped = clampMonth(Number(v));
            onMonthChange(clamped);
            dayRef.current?.focus();
            dayRef.current?.select();
          } else {
            onMonthChange(v ? Number(v) : month);
          }
        }}
        onBlur={() => {
          const clamped = clampMonth(Number(monthStr) || 1);
          setMonthStr(String(clamped).padStart(2, '0'));
          onMonthChange(clamped);
        }}
      />
      <span className="text-muted text-sm shrink-0">월</span>
      <input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={dayStr}
        className={`${FIELD_CLASS} w-12 px-1`}
        placeholder="15"
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 2);
          setDayStr(v);
          onDayChange(v ? Number(v) : day);
        }}
        onBlur={() => {
          const clamped = clampDay(Number(dayStr) || 1, maxDay);
          setDayStr(String(clamped).padStart(2, '0'));
          onDayChange(clamped);
        }}
      />
      <span className="text-muted text-sm shrink-0">일</span>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 재실행 (통과 확인)**

```bash
npx jest lib/__tests__/date-input-utils.test.ts --no-coverage
```

Expected: 모든 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add components/DateInput.tsx lib/__tests__/date-input-utils.test.ts
git commit -m "feat: add DateInput component with clamp utilities"
```

---

### Task 3: saju/page.tsx에 DateInput 적용

**Files:**
- Modify: `app/saju/page.tsx`

현재 코드에서 년/월/일 select 3개(`생년`, `생월`, `생일` 섹션)를 `<DateInput>`으로 교체한다. `YEARS`, `MONTHS` import는 년/월 select 제거 후 미사용이 되므로 함께 제거한다.

- [ ] **Step 1: `app/saju/page.tsx` 수정 — import 변경**

기존:
```tsx
import { SIJIN, YEARS, MONTHS, INPUT_CLASS, LABEL_CLASS } from '@/lib/constants';
```

변경 후:
```tsx
import { SIJIN, INPUT_CLASS, LABEL_CLASS } from '@/lib/constants';
import DateInput from '@/components/DateInput';
```

- [ ] **Step 2: 년/월/일 select 3개를 DateInput 하나로 교체**

`app/saju/page.tsx`에서 아래 세 `<div>` 블록을 제거:

```tsx
        {/* 생년 */}
        <div>
          <label className={LABEL_CLASS}>생년</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={INPUT_CLASS}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </div>

        {/* 생월 */}
        <div>
          <label className={LABEL_CLASS}>생월</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className={INPUT_CLASS}
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}월
              </option>
            ))}
          </select>
        </div>

        {/* 생일 */}
        <div>
          <label className={LABEL_CLASS}>생일</label>
          <select
            value={clampedDay}
            onChange={(e) => setDay(Number(e.target.value))}
            className={INPUT_CLASS}
          >
            {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}일
              </option>
            ))}
          </select>
        </div>
```

해당 위치에 아래로 교체:

```tsx
        {/* 생년월일 */}
        <div>
          <label className={LABEL_CLASS}>생년월일</label>
          <DateInput
            year={year}
            month={month}
            day={clampedDay}
            maxDay={maxDay}
            onYearChange={setYear}
            onMonthChange={setMonth}
            onDayChange={setDay}
          />
        </div>
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add app/saju/page.tsx
git commit -m "feat: replace year/month/day selects with DateInput in saju page"
```

---

### Task 4: compatibility/page.tsx PersonForm에 DateInput 적용

**Files:**
- Modify: `app/compatibility/page.tsx`

PersonForm 컴포넌트의 년/월/일 select를 DateInput으로 교체한다. PersonFormProps에서 `clampedDay`를 제거하고 `day`를 추가한다 (DateInput이 내부에서 표시 값을 관리하므로 clampedDay 전달 불필요).

- [ ] **Step 1: import에 DateInput 추가 + YEARS/MONTHS 제거**

기존:
```tsx
import { SIJIN, YEARS, MONTHS, INPUT_CLASS, LABEL_CLASS } from '@/lib/constants';
```

변경 후:
```tsx
import { SIJIN, INPUT_CLASS, LABEL_CLASS } from '@/lib/constants';
import DateInput from '@/components/DateInput';
```

- [ ] **Step 2: PersonFormProps 인터페이스 수정**

기존:
```tsx
interface PersonFormProps {
  label: string;
  profiles: Profile[];
  onProfileSelect: (profile: Profile) => void;
  name: string;
  setName: (v: string) => void;
  gender: 'M' | 'F';
  setGender: (v: 'M' | 'F') => void;
  isLunar: boolean;
  setIsLunar: (v: boolean) => void;
  year: number;
  setYear: (v: number) => void;
  month: number;
  setMonth: (v: number) => void;
  setDay: (v: number) => void;
  clampedDay: number;
  hourValue: number | null;
  setHourValue: (v: number | null) => void;
}
```

변경 후:
```tsx
interface PersonFormProps {
  label: string;
  profiles: Profile[];
  onProfileSelect: (profile: Profile) => void;
  name: string;
  setName: (v: string) => void;
  gender: 'M' | 'F';
  setGender: (v: 'M' | 'F') => void;
  isLunar: boolean;
  setIsLunar: (v: boolean) => void;
  year: number;
  setYear: (v: number) => void;
  month: number;
  setMonth: (v: number) => void;
  day: number;
  setDay: (v: number) => void;
  hourValue: number | null;
  setHourValue: (v: number | null) => void;
}
```

- [ ] **Step 3: PersonForm 함수 시그니처 + 내부 select 교체**

PersonForm 함수 파라미터에서 `clampedDay` → `day` 교체:

기존:
```tsx
function PersonForm({
  ...
  setDay,
  clampedDay,
  hourValue,
  ...
}: PersonFormProps) {
  const maxDay = isLunar ? 30 : new Date(year, month, 0).getDate();
```

변경 후:
```tsx
function PersonForm({
  ...
  day,
  setDay,
  hourValue,
  ...
}: PersonFormProps) {
  const maxDay = isLunar ? 30 : new Date(year, month, 0).getDate();
```

그리고 PersonForm 내부의 년/월/일 select 3개를 제거하고 DateInput으로 교체:

제거할 블록:
```tsx
      <div>
        <label className={LABEL_CLASS}>생년</label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className={INPUT_CLASS}
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS}>생월</label>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className={INPUT_CLASS}
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m}월
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS}>생일</label>
        <select
          value={clampedDay}
          onChange={(e) => setDay(Number(e.target.value))}
          className={INPUT_CLASS}
        >
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}일
            </option>
          ))}
        </select>
      </div>
```

교체할 코드:
```tsx
      <div>
        <label className={LABEL_CLASS}>생년월일</label>
        <DateInput
          year={year}
          month={month}
          day={clampedDay}
          maxDay={maxDay}
          onYearChange={setYear}
          onMonthChange={setMonth}
          onDayChange={setDay}
        />
      </div>
```

`clampedDay`는 PersonForm 내부에서 이미 `const clampedDay = Math.min(day, maxDay);`로 계산되므로 그대로 사용한다. 이렇게 해야 월 변경 시(maxDay 감소) DateInput 표시 값도 자동으로 보정된다.

- [ ] **Step 4: PersonForm 호출부 2곳 업데이트**

`CompatibilityPage` JSX에서 PersonFormA 호출:

기존:
```tsx
        <PersonForm
          label="💑 나의 정보"
          profiles={profiles}
          onProfileSelect={loadProfileA}
          name={nameA}
          setName={setNameA}
          gender={genderA}
          setGender={setGenderA}
          isLunar={isLunarA}
          setIsLunar={setIsLunarA}
          year={yearA}
          setYear={setYearA}
          month={monthA}
          setMonth={setMonthA}
          setDay={setDayA}
          clampedDay={clampedDayA}
          hourValue={hourValueA}
          setHourValue={setHourValueA}
        />
```

변경 후:
```tsx
        <PersonForm
          label="💑 나의 정보"
          profiles={profiles}
          onProfileSelect={loadProfileA}
          name={nameA}
          setName={setNameA}
          gender={genderA}
          setGender={setGenderA}
          isLunar={isLunarA}
          setIsLunar={setIsLunarA}
          year={yearA}
          setYear={setYearA}
          month={monthA}
          setMonth={setMonthA}
          day={dayA}
          setDay={setDayA}
          hourValue={hourValueA}
          setHourValue={setHourValueA}
        />
```

PersonFormB 호출:

기존:
```tsx
        <PersonForm
          label="💑 상대방 정보"
          profiles={profiles}
          onProfileSelect={loadProfileB}
          name={nameB}
          setName={setNameB}
          gender={genderB}
          setGender={setGenderB}
          isLunar={isLunarB}
          setIsLunar={setIsLunarB}
          year={yearB}
          setYear={setYearB}
          month={monthB}
          setMonth={setMonthB}
          setDay={setDayB}
          clampedDay={clampedDayB}
          hourValue={hourValueB}
          setHourValue={setHourValueB}
        />
```

변경 후:
```tsx
        <PersonForm
          label="💑 상대방 정보"
          profiles={profiles}
          onProfileSelect={loadProfileB}
          name={nameB}
          setName={setNameB}
          gender={genderB}
          setGender={setGenderB}
          isLunar={isLunarB}
          setIsLunar={setIsLunarB}
          year={yearB}
          setYear={setYearB}
          month={monthB}
          setMonth={setMonthB}
          day={dayB}
          setDay={setDayB}
          hourValue={hourValueB}
          setHourValue={setHourValueB}
        />
```

- [ ] **Step 5: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 6: 커밋**

```bash
git add app/compatibility/page.tsx
git commit -m "feat: replace year/month/day selects with DateInput in compatibility page"
```

---

### Task 5: BottomNav 컴포넌트 + 테스트

**Files:**
- Create: `components/BottomNav.tsx`
- Create: `lib/__tests__/bottom-nav.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`lib/__tests__/bottom-nav.test.ts`:

```ts
import { getActiveTab } from '../../components/BottomNav';

describe('getActiveTab', () => {
  it('returns 홈 for /', () => expect(getActiveTab('/')).toBe('홈'));
  it('returns 사주 for /saju', () => expect(getActiveTab('/saju')).toBe('사주'));
  it('returns 사주 for /saju/result', () => expect(getActiveTab('/saju/result')).toBe('사주'));
  it('returns 운세 for /fortune', () => expect(getActiveTab('/fortune')).toBe('운세'));
  it('returns 운세 for /fortune/yearly', () => expect(getActiveTab('/fortune/yearly')).toBe('운세'));
  it('returns 궁합 for /compatibility', () => expect(getActiveTab('/compatibility')).toBe('궁합'));
  it('returns 궁합 for /compatibility/result', () =>
    expect(getActiveTab('/compatibility/result')).toBe('궁합'));
  it('returns 홈 for unknown path', () => expect(getActiveTab('/unknown')).toBe('홈'));
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
npx jest lib/__tests__/bottom-nav.test.ts --no-coverage
```

Expected: `Cannot find module '../../components/BottomNav'`

- [ ] **Step 3: BottomNav 컴포넌트 작성**

`components/BottomNav.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavTab = '홈' | '사주' | '운세' | '궁합';

export function getActiveTab(pathname: string): NavTab {
  if (pathname.startsWith('/saju')) return '사주';
  if (pathname.startsWith('/fortune')) return '운세';
  if (pathname.startsWith('/compatibility')) return '궁합';
  return '홈';
}

const TABS: { tab: NavTab; icon: string; href: string }[] = [
  { tab: '홈', icon: '🏠', href: '/' },
  { tab: '사주', icon: '🔮', href: '/saju' },
  { tab: '운세', icon: '💫', href: '/fortune' },
  { tab: '궁합', icon: '💑', href: '/compatibility' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="max-w-md mx-auto flex">
        {TABS.map(({ tab, icon, href }) => {
          const isActive = activeTab === tab;
          return (
            <Link
              key={tab}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-2 pb-3"
            >
              <span className="text-xl leading-none">{icon}</span>
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
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: 테스트 재실행 (통과 확인)**

```bash
npx jest lib/__tests__/bottom-nav.test.ts --no-coverage
```

Expected: 모든 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add components/BottomNav.tsx lib/__tests__/bottom-nav.test.ts
git commit -m "feat: add BottomNav component with active tab detection"
```

---

### Task 6: layout.tsx에 BottomNav 통합

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: layout.tsx 수정**

기존:
```tsx
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
```

변경 후:
```tsx
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import BottomNav from '@/components/BottomNav';
```

기존:
```tsx
        <ServiceWorkerRegistrar />
        <div className="max-w-md mx-auto min-h-screen flex flex-col">{children}</div>
```

변경 후:
```tsx
        <ServiceWorkerRegistrar />
        <div className="max-w-md mx-auto min-h-screen flex flex-col pb-20">{children}</div>
        <BottomNav />
```

- [ ] **Step 2: 전체 테스트 실행**

```bash
npx jest --no-coverage
```

Expected: 모든 테스트 PASS

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add app/layout.tsx
git commit -m "feat: integrate BottomNav into layout with bottom padding"
```

---

### Task 7: PR 생성

- [ ] **Step 1: 브랜치 푸시 및 PR 생성**

```bash
git push -u origin HEAD
```

PR 제목: `feat: add bottom navigation bar and numeric date input`

PR 본문:
```
## Summary
- 모든 페이지에 하단 4탭 네비게이션 (홈·사주·운세·궁합) 추가
- 사주·궁합 입력 폼의 년/월/일 select를 숫자 직접 입력 필드로 교체 (모바일 키패드, 자동 포커스 이동, blur 클램핑)

## Test plan
- [ ] 홈에서 각 탭 탭 → 올바른 페이지로 이동 확인
- [ ] `/saju/result`에서 사주 탭이 활성화되어 있는지 확인
- [ ] `/fortune/yearly`에서 운세 탭이 활성화되어 있는지 확인
- [ ] 사주 입력 폼에서 년 4자리 입력 시 월 필드로 포커스 이동 확인
- [ ] 월 2자리 입력 시 일 필드로 포커스 이동 확인
- [ ] blur 시 월 13 → 12로 클램핑 확인
- [ ] 프로필 불러오기 시 날짜 필드 값 갱신 확인
- [ ] 궁합 페이지 두 사람 폼 모두 동일하게 작동 확인
```
