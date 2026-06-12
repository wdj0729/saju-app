# HourInput · 프로필 인라인 편집 · 홈 화면 정리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 태어난 시를 숫자 직접 입력으로 교체(HourInput), 홈 화면에서 프로필 인라인 편집, 중복 홈 화면 카드 제거

**Architecture:** HourInput 컴포넌트를 먼저 만들어 사주/궁합 페이지에 적용한 뒤, updateProfile 유틸을 추가하고 홈 화면 편집 폼에 연결. 홈 화면 카드 정리는 독립 작업.

**Tech Stack:** Next.js App Router, React (useState/useEffect), TypeScript, Tailwind CSS, Jest

---

## 파일 맵

| 파일 | 작업 |
|------|------|
| `components/HourInput.tsx` | 신규 — HourInput 컴포넌트 + clockHourToSijin 유틸 |
| `lib/__tests__/hour-input-utils.test.ts` | 신규 — clockHourToSijin 유닛 테스트 |
| `app/saju/page.tsx` | 수정 — select → HourInput, SIJIN import 제거 |
| `app/compatibility/page.tsx` | 수정 — PersonForm select → HourInput, SIJIN import 제거 |
| `lib/profiles.ts` | 수정 — updateProfile 함수 추가 |
| `lib/__tests__/profile-update.test.ts` | 신규 — updateProfile 테스트 |
| `app/page.tsx` | 수정 — ProfileEditForm 추가, isEditing 확장, CARDS 정리 |

---

## Task 1: HourInput 컴포넌트 + clockHourToSijin 유틸

**Files:**
- Create: `components/HourInput.tsx`
- Create: `lib/__tests__/hour-input-utils.test.ts`

- [ ] **Step 1: 테스트 작성**

`lib/__tests__/hour-input-utils.test.ts`:
```ts
import { clockHourToSijin } from '../../components/HourInput';

describe('clockHourToSijin', () => {
  it('maps 0 to 자시 (0)', () => expect(clockHourToSijin(0)).toBe(0));
  it('maps 23 to 자시 (0)', () => expect(clockHourToSijin(23)).toBe(0));
  it('maps 1 to 축시 (1)', () => expect(clockHourToSijin(1)).toBe(1));
  it('maps 2 to 축시 (1)', () => expect(clockHourToSijin(2)).toBe(1));
  it('maps 3 to 인시 (3)', () => expect(clockHourToSijin(3)).toBe(3));
  it('maps 4 to 인시 (3)', () => expect(clockHourToSijin(4)).toBe(3));
  it('maps 14 to 미시 (13)', () => expect(clockHourToSijin(14)).toBe(13));
  it('maps 21 to 해시 (21)', () => expect(clockHourToSijin(21)).toBe(21));
  it('maps 22 to 해시 (21)', () => expect(clockHourToSijin(22)).toBe(21));
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest lib/__tests__/hour-input-utils.test.ts
```
Expected: `Cannot find module '../../components/HourInput'`

- [ ] **Step 3: HourInput 컴포넌트 구현**

`components/HourInput.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { SIJIN } from '@/lib/constants';

export function clockHourToSijin(hour: number): number {
  if (hour === 0 || hour === 23) return 0;
  return hour % 2 === 0 ? hour - 1 : hour;
}

interface HourInputProps {
  value: number | null;
  onChange: (v: number | null) => void;
}

const FIELD_CLASS =
  'bg-card border border-border rounded-xl text-primary text-sm text-center appearance-none py-3';

export default function HourInput({ value, onChange }: HourInputProps) {
  const [hourStr, setHourStr] = useState(
    value !== null ? String(value).padStart(2, '0') : ''
  );

  useEffect(() => {
    setHourStr(value !== null ? String(value).padStart(2, '0') : '');
  }, [value]);

  const sijinLabel =
    value !== null ? (SIJIN.find((s) => s.value === value)?.label ?? '') : '';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={hourStr}
          placeholder="--"
          aria-label="태어난 시"
          className={`${FIELD_CLASS} w-12 px-1`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 2);
            setHourStr(v);
            if (v.length === 2) {
              const h = Math.min(Number(v), 23);
              onChange(clockHourToSijin(h));
            }
          }}
          onBlur={() => {
            if (hourStr === '') {
              onChange(null);
              return;
            }
            const h = Math.min(Number(hourStr) || 0, 23);
            setHourStr(String(h).padStart(2, '0'));
            onChange(clockHourToSijin(h));
          }}
        />
        <span className="text-muted text-sm shrink-0">시</span>
      </div>
      {value !== null && (
        <span className="text-xs text-muted shrink-0">{sijinLabel}</span>
      )}
      <button
        type="button"
        onClick={() => {
          setHourStr('');
          onChange(null);
        }}
        className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ml-auto ${
          value === null
            ? 'bg-primary-gradient text-white'
            : 'bg-card text-muted'
        }`}
      >
        모름
      </button>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest lib/__tests__/hour-input-utils.test.ts
```
Expected: 9 tests pass

- [ ] **Step 5: 커밋**

```bash
git add components/HourInput.tsx lib/__tests__/hour-input-utils.test.ts
git commit -m "feat: add HourInput component with clockHourToSijin utility"
```

---

## Task 2: 사주 페이지 select → HourInput 교체

**Files:**
- Modify: `app/saju/page.tsx`

- [ ] **Step 1: import 수정**

`app/saju/page.tsx` 상단 import에서 `SIJIN` 제거, `HourInput` 추가:

기존:
```tsx
import { SIJIN, INPUT_CLASS, LABEL_CLASS } from '@/lib/constants';
```

변경:
```tsx
import { INPUT_CLASS, LABEL_CLASS } from '@/lib/constants';
import HourInput from '@/components/HourInput';
```

- [ ] **Step 2: select 블록 교체**

기존 (태어난 시 섹션):
```tsx
        {/* 태어난 시 */}
        <div>
          <label className={LABEL_CLASS}>태어난 시 (선택)</label>
          <select
            value={hourValue ?? ''}
            onChange={(e) => setHourValue(e.target.value === '' ? null : Number(e.target.value))}
            className={INPUT_CLASS}
          >
            <option value="">모름</option>
            {SIJIN.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
```

변경:
```tsx
        {/* 태어난 시 */}
        <div>
          <label className={LABEL_CLASS}>태어난 시 (선택)</label>
          <HourInput value={hourValue} onChange={setHourValue} />
        </div>
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: 커밋**

```bash
git add app/saju/page.tsx
git commit -m "feat: replace hour select with HourInput in saju page"
```

---

## Task 3: 궁합 페이지 PersonForm select → HourInput 교체

**Files:**
- Modify: `app/compatibility/page.tsx`

- [ ] **Step 1: import 수정**

`app/compatibility/page.tsx` 상단 import 변경:

기존:
```tsx
import { SIJIN, INPUT_CLASS, LABEL_CLASS } from '@/lib/constants';
```

변경:
```tsx
import { INPUT_CLASS, LABEL_CLASS } from '@/lib/constants';
import HourInput from '@/components/HourInput';
```

- [ ] **Step 2: PersonForm 내 select 블록 교체**

`PersonForm` 함수 내부의 태어난 시 섹션:

기존:
```tsx
      <div>
        <label className={LABEL_CLASS}>태어난 시 (선택)</label>
        <select
          value={hourValue ?? ''}
          onChange={(e) => setHourValue(e.target.value === '' ? null : Number(e.target.value))}
          className={INPUT_CLASS}
        >
          <option value="">모름</option>
          {SIJIN.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
```

변경:
```tsx
      <div>
        <label className={LABEL_CLASS}>태어난 시 (선택)</label>
        <HourInput value={hourValue} onChange={setHourValue} />
      </div>
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: 커밋**

```bash
git add app/compatibility/page.tsx
git commit -m "feat: replace hour select with HourInput in compatibility page"
```

---

## Task 4: updateProfile 유틸 추가

**Files:**
- Modify: `lib/profiles.ts`
- Create: `lib/__tests__/profile-update.test.ts`

- [ ] **Step 1: 테스트 작성**

`lib/__tests__/profile-update.test.ts`:
```ts
/**
 * @jest-environment jsdom
 */
import { updateProfile, loadProfiles } from '../../lib/profiles';

const SAMPLE_PROFILE = {
  id: 'test-id',
  name: '홍길동',
  year: 1990,
  month: 1,
  day: 1,
  hour: null,
  isLunar: false,
  gender: 'M' as const,
  ilgan: '갑',
  createdAt: 0,
};

beforeEach(() => {
  localStorage.setItem('saju-profiles', JSON.stringify([SAMPLE_PROFILE]));
});

afterEach(() => {
  localStorage.clear();
});

describe('updateProfile', () => {
  it('updates name while preserving other fields', () => {
    updateProfile('test-id', { name: '김철수' });
    const profiles = loadProfiles();
    expect(profiles[0].name).toBe('김철수');
    expect(profiles[0].year).toBe(1990);
    expect(profiles[0].id).toBe('test-id');
  });

  it('updates multiple fields at once', () => {
    updateProfile('test-id', { year: 1995, isLunar: true });
    const profiles = loadProfiles();
    expect(profiles[0].year).toBe(1995);
    expect(profiles[0].isLunar).toBe(true);
    expect(profiles[0].name).toBe('홍길동');
  });

  it('does nothing for unknown id', () => {
    updateProfile('other-id', { name: '김철수' });
    const profiles = loadProfiles();
    expect(profiles[0].name).toBe('홍길동');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest lib/__tests__/profile-update.test.ts
```
Expected: `updateProfile is not a function`

- [ ] **Step 3: updateProfile 구현**

`lib/profiles.ts` 파일 끝 `deleteProfile` 함수 다음에 추가:
```ts
export function updateProfile(
  id: string,
  patch: Partial<Omit<Profile, 'id' | 'createdAt'>>
): void {
  if (typeof window === 'undefined') return;
  persist(loadProfiles().map((p) => (p.id === id ? { ...p, ...patch } : p)));
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest lib/__tests__/profile-update.test.ts
```
Expected: 3 tests pass

- [ ] **Step 5: 커밋**

```bash
git add lib/profiles.ts lib/__tests__/profile-update.test.ts
git commit -m "feat: add updateProfile utility with tests"
```

---

## Task 5: 프로필 인라인 편집 (홈 화면)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: import 추가**

`app/page.tsx` 상단 import 블록에 다음 추가:
```tsx
import { calculateSaju } from '@/lib/saju-calculator';
import { updateProfile } from '@/lib/profiles';
import { LABEL_CLASS, INPUT_CLASS } from '@/lib/constants';
import DateInput from '@/components/DateInput';
import HourInput from '@/components/HourInput';
```

- [ ] **Step 2: ProfileEditForm 서브컴포넌트 추가**

`export default function Home()` 선언 바로 위에 삽입:
```tsx
interface ProfileEditFormProps {
  profile: Profile;
  onSave: (id: string, patch: Partial<Omit<Profile, 'id' | 'createdAt'>>) => void;
  onCancel: () => void;
}

function ProfileEditForm({ profile, onSave, onCancel }: ProfileEditFormProps) {
  const [name, setName] = useState(profile.name);
  const [gender, setGender] = useState<'M' | 'F'>(profile.gender ?? 'M');
  const [isLunar, setIsLunar] = useState(profile.isLunar);
  const [year, setYear] = useState(profile.year);
  const [month, setMonth] = useState(profile.month);
  const [day, setDay] = useState(profile.day);
  const [hourValue, setHourValue] = useState<number | null>(profile.hour);

  const maxDay = isLunar ? 30 : new Date(year, month, 0).getDate();
  const clampedDay = Math.min(day, maxDay);

  function handleSave() {
    try {
      const result = calculateSaju({ year, month, day: clampedDay, hour: hourValue, isLunar });
      onSave(profile.id, {
        name,
        gender,
        isLunar,
        year,
        month,
        day: clampedDay,
        hour: hourValue,
        ilgan: result.ilgan,
      });
    } catch {
      // 잘못된 날짜이면 저장하지 않음
    }
  }

  return (
    <div className="border-t border-border px-3 py-3 flex flex-col gap-3">
      <div>
        <label className={LABEL_CLASS}>이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>성별</label>
        <div className="flex gap-2">
          {(['M', 'F'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                gender === g ? 'bg-primary-gradient text-white' : 'bg-card text-muted'
              }`}
            >
              {g === 'M' ? '남성' : '여성'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={LABEL_CLASS}>양력 / 음력</label>
        <div className="flex gap-2">
          {([false, true] as const).map((lunar) => (
            <button
              key={String(lunar)}
              type="button"
              onClick={() => setIsLunar(lunar)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                isLunar === lunar ? 'bg-primary-gradient text-white' : 'bg-card text-muted'
              }`}
            >
              {lunar ? '음력' : '양력'}
            </button>
          ))}
        </div>
      </div>
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
      <div>
        <label className={LABEL_CLASS}>태어난 시</label>
        <HourInput value={hourValue} onChange={setHourValue} />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm text-muted bg-card"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-2 rounded-xl text-sm font-semibold bg-primary-gradient text-white"
        >
          저장
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: handleSaveEdit 함수 추가**

`Home` 함수 내부 `handleDelete` 바로 아래에 추가:
```tsx
  function handleSaveEdit(
    id: string,
    patch: Partial<Omit<Profile, 'id' | 'createdAt'>>
  ) {
    updateProfile(id, patch);
    setProfiles(loadProfiles());
    setExpandedProfileId(null);
  }
```

- [ ] **Step 4: 프로필 항목 탭 동작 변경**

기존:
```tsx
                  onClick={() => {
                    if (isEditing) return;
                    setExpandedProfileId(expandedProfileId === profile.id ? null : profile.id);
                  }}
```

변경:
```tsx
                  onClick={() => {
                    setExpandedProfileId(expandedProfileId === profile.id ? null : profile.id);
                  }}
```

- [ ] **Step 5: 확장 영역에 조건부 렌더링 추가**

기존:
```tsx
                {expandedProfileId === profile.id && !isEditing && (
                  <div className="flex border-t border-border">
                    {(
                      [
                        { icon: '🔮', label: '사주', dest: 'saju' },
                        { icon: '💫', label: '운세', dest: 'fortune' },
                        { icon: '✨', label: '신년', dest: 'yearly' },
                        { icon: '💑', label: '궁합', dest: 'compat' },
                      ] as const
                    ).map(({ icon, label, dest }) => (
                      <button
                        key={label}
                        onClick={() => handleProfileNav(profile, dest)}
                        className="flex-1 py-2 flex flex-col items-center gap-0.5 hover:bg-card transition-colors"
                      >
                        <span className="text-sm">{icon}</span>
                        <span className="text-xs text-muted">{label}</span>
                      </button>
                    ))}
                  </div>
                )}
```

변경:
```tsx
                {expandedProfileId === profile.id && (
                  isEditing ? (
                    <ProfileEditForm
                      profile={profile}
                      onSave={handleSaveEdit}
                      onCancel={() => setExpandedProfileId(null)}
                    />
                  ) : (
                    <div className="flex border-t border-border">
                      {(
                        [
                          { icon: '🔮', label: '사주', dest: 'saju' },
                          { icon: '💫', label: '운세', dest: 'fortune' },
                          { icon: '✨', label: '신년', dest: 'yearly' },
                          { icon: '💑', label: '궁합', dest: 'compat' },
                        ] as const
                      ).map(({ icon, label, dest }) => (
                        <button
                          key={label}
                          onClick={() => handleProfileNav(profile, dest)}
                          className="flex-1 py-2 flex flex-col items-center gap-0.5 hover:bg-card transition-colors"
                        >
                          <span className="text-sm">{icon}</span>
                          <span className="text-xs text-muted">{label}</span>
                        </button>
                      ))}
                    </div>
                  )
                )}
```

- [ ] **Step 6: 타입 체크**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 7: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: add inline profile editing on home page"
```

---

## Task 6: 홈 화면 카드 정리

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: CARDS 배열 수정**

기존:
```tsx
const CARDS = [
  {
    emoji: '🔮',
    title: '내 사주 보기',
    subtitle: '생년월일시로 사주팔자 분석',
    href: '/saju',
  },
  {
    emoji: '✨',
    title: `${YEARLY_FORTUNE_YEAR} 신년운세`,
    subtitle: `${YEARLY_FORTUNE_YEAR}년 총운·직업·재물·건강·연애`,
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
];
```

변경:
```tsx
const CARDS = [
  {
    emoji: '✨',
    title: `${YEARLY_FORTUNE_YEAR} 신년운세`,
    subtitle: `${YEARLY_FORTUNE_YEAR}년 총운·직업·재물·건강·연애`,
    href: '/fortune/yearly',
  },
  {
    emoji: '💫',
    title: '오늘 운세',
    subtitle: '일간별 맞춤 운세',
    href: '/fortune',
  },
];
```

- [ ] **Step 2: 전체 테스트 실행**

```bash
npx jest
```
Expected: all tests pass

- [ ] **Step 3: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: remove redundant saju/compatibility cards from home page"
```

---

## Task 7: PR 생성

- [ ] **Step 1: 브랜치 생성 및 푸시**

현재 main에서 작업 중이므로 브랜치를 먼저 생성:
```bash
git checkout -b feat/hourinput-profile-edit
git push -u origin feat/hourinput-profile-edit
```

- [ ] **Step 2: PR 생성**

```bash
gh pr create \
  --title "feat: HourInput, profile inline edit, home page cleanup" \
  --body "$(cat <<'EOF'
## Summary

- **HourInput 컴포넌트**: 00-23 숫자 직접 입력 → 시진 자동 매핑 (모름 버튼 포함)
- **사주/궁합 페이지**: 태어난 시 select → HourInput 교체
- **updateProfile 유틸**: 프로필 부분 수정 함수 추가
- **홈 화면 프로필 인라인 편집**: 편집 모드에서 프로필 탭 시 수정 폼 열림
- **홈 화면 카드 정리**: BottomNav와 중복되는 사주·궁합 카드 제거

## Test plan

- [ ] 사주 페이지: 14 입력 → 미시 표시, 모름 버튼 탭 시 초기화
- [ ] 궁합 페이지: 두 사람 시간 입력 정상 동작
- [ ] 홈 화면: 편집 모드 진입 → 프로필 탭 → 수정 폼 → 저장 후 반영
- [ ] 홈 화면: 신년운세·오늘운세 카드만 표시 (사주·궁합 카드 없음)
- [ ] jest 전체 테스트 통과

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
