# Refactor: Form Deduplication + AI Result Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract shared form fields into `PersonInputFields`, separate `ProfileEditForm` into its own component file, and cache AI analysis results in localStorage so they survive tab close.

**Architecture:** Three independent improvements applied in sequence. (1) `PersonInputFields` component absorbs the duplicate name/gender/lunar/date/hour fields used in both `app/saju/page.tsx` and the inline `ProfileEditForm`. (2) `ProfileEditForm` is extracted to `components/ProfileEditForm.tsx` so `app/page.tsx` is no longer a 260-line mixed-concern client component. (3) `lib/ai-cache.ts` provides localStorage save/load for `Record<SectionKey, string>` values; `useAiSections` gains an optional `cacheKey` parameter to populate initial state from cache and persist results after streaming completes.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v4, localStorage (existing pattern from `lib/profiles.ts`)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `components/PersonInputFields.tsx` | Shared name/gender/lunar/date/hour fields |
| Modify | `app/saju/page.tsx` | Use `PersonInputFields` instead of inline fields |
| Create | `components/ProfileEditForm.tsx` | Extracted edit form, uses `PersonInputFields` |
| Modify | `app/page.tsx` | Remove inline `ProfileEditForm`, import from components |
| Create | `lib/ai-cache.ts` | localStorage read/write for AI section results |
| Create | `lib/__tests__/ai-cache.test.ts` | Unit tests for cache utilities |
| Modify | `hooks/useAiSections.ts` | Add optional `cacheKey` — loads on init, saves on complete |
| Modify | `app/saju/result/SajuResultContent.tsx` | Derive cache key, pass to `useAiSections` |

---

### Task 1: Create `components/PersonInputFields.tsx`

**Files:**
- Create: `components/PersonInputFields.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { INPUT_CLASS, LABEL_CLASS } from '@/lib/constants';
import DateInput from './DateInput';
import HourInput from './HourInput';

interface PersonInputFieldsProps {
  name: string;
  onNameChange: (v: string) => void;
  gender: 'M' | 'F';
  onGenderChange: (v: 'M' | 'F') => void;
  isLunar: boolean;
  onIsLunarChange: (v: boolean) => void;
  year: number;
  month: number;
  day: number;
  maxDay: number;
  onYearChange: (v: number) => void;
  onMonthChange: (v: number) => void;
  onDayChange: (v: number) => void;
  hourValue: number | null;
  onHourChange: (v: number | null) => void;
  showOptionalHints?: boolean;
  namePlaceholder?: string;
}

export default function PersonInputFields({
  name,
  onNameChange,
  gender,
  onGenderChange,
  isLunar,
  onIsLunarChange,
  year,
  month,
  day,
  maxDay,
  onYearChange,
  onMonthChange,
  onDayChange,
  hourValue,
  onHourChange,
  showOptionalHints = false,
  namePlaceholder,
}: PersonInputFieldsProps) {
  return (
    <>
      <div>
        <label className={LABEL_CLASS}>
          이름{showOptionalHints ? ' (선택)' : ''}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={namePlaceholder}
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
              onClick={() => onGenderChange(g)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
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
              onClick={() => onIsLunarChange(lunar)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
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
          day={day}
          maxDay={maxDay}
          onYearChange={onYearChange}
          onMonthChange={onMonthChange}
          onDayChange={onDayChange}
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>
          태어난 시{showOptionalHints ? ' (선택)' : ''}
        </label>
        <HourInput value={hourValue} onChange={onHourChange} />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/PersonInputFields.tsx
git commit -m "feat: add PersonInputFields shared form component"
```

---

### Task 2: Update `app/saju/page.tsx` to use `PersonInputFields`

**Files:**
- Modify: `app/saju/page.tsx`

- [ ] **Step 1: Replace inline fields with `PersonInputFields`**

Replace the entire section from `{/* 이름 */}` through the closing `</div>` of `{/* 태어난 시 */}` with:

Old (remove these five blocks):
```tsx
        {/* 이름 */}
        <div>
          <label className={LABEL_CLASS}>이름 (선택)</label>
          <input
            type="text"
            placeholder="이름을 입력하세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        {/* 성별 */}
        <div>
          <label className={LABEL_CLASS}>성별</label>
          <div className="flex gap-2">
            {(['M', 'F'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  gender === g ? 'bg-primary-gradient text-white' : 'bg-card text-muted'
                }`}
              >
                {g === 'M' ? '남성' : '여성'}
              </button>
            ))}
          </div>
        </div>

        {/* 양력/음력 토글 */}
        <div>
          <label className={LABEL_CLASS}>양력 / 음력</label>
          <div className="flex gap-2">
            {([false, true] as const).map((lunar) => (
              <button
                key={String(lunar)}
                onClick={() => setIsLunar(lunar)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isLunar === lunar ? 'bg-primary-gradient text-white' : 'bg-card text-muted'
                }`}
              >
                {lunar ? '음력' : '양력'}
              </button>
            ))}
          </div>
        </div>

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

        {/* 태어난 시 */}
        <div>
          <label className={LABEL_CLASS}>태어난 시 (선택)</label>
          <HourInput value={hourValue} onChange={setHourValue} />
        </div>
```

New (replace with):
```tsx
        <PersonInputFields
          name={name}
          onNameChange={setName}
          gender={gender}
          onGenderChange={setGender}
          isLunar={isLunar}
          onIsLunarChange={setIsLunar}
          year={year}
          month={month}
          day={clampedDay}
          maxDay={maxDay}
          onYearChange={setYear}
          onMonthChange={setMonth}
          onDayChange={setDay}
          hourValue={hourValue}
          onHourChange={setHourValue}
          showOptionalHints
          namePlaceholder="이름을 입력하세요"
        />
```

- [ ] **Step 2: Update imports in `app/saju/page.tsx`**

Remove from imports: `DateInput`, `HourInput`, `INPUT_CLASS`, `LABEL_CLASS`  
Add to imports: `PersonInputFields`

The updated import block should be:
```tsx
import { calculateSaju } from '@/lib/saju-calculator';
import { saveSession } from '@/lib/session';
import { loadProfiles } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
import { LABEL_CLASS } from '@/lib/constants';
import BackButton from '@/components/BackButton';
import PersonInputFields from '@/components/PersonInputFields';
```

Note: `LABEL_CLASS` is still needed for the "저장된 프로필 불러오기" section. `INPUT_CLASS` is no longer needed.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/saju/page.tsx
git commit -m "refactor: use PersonInputFields in saju input page"
```

---

### Task 3: Create `components/ProfileEditForm.tsx`

**Files:**
- Create: `components/ProfileEditForm.tsx`

- [ ] **Step 1: Create the extracted component**

```tsx
'use client';

import { useState } from 'react';
import type { Profile } from '@/lib/profiles';
import { calculateSaju } from '@/lib/saju-calculator';
import PersonInputFields from './PersonInputFields';

interface ProfileEditFormProps {
  profile: Profile;
  onSave: (id: string, patch: Partial<Omit<Profile, 'id' | 'createdAt'>>) => void;
  onCancel: () => void;
}

export default function ProfileEditForm({ profile, onSave, onCancel }: ProfileEditFormProps) {
  const [name, setName] = useState(profile.name);
  const [gender, setGender] = useState<'M' | 'F'>(profile.gender ?? 'M');
  const [isLunar, setIsLunar] = useState(profile.isLunar);
  const [year, setYear] = useState(profile.year);
  const [month, setMonth] = useState(profile.month);
  const [day, setDay] = useState(profile.day);
  const [hourValue, setHourValue] = useState<number | null>(profile.hour);
  const [saveError, setSaveError] = useState('');

  const maxDay = isLunar ? 30 : new Date(year, month, 0).getDate();
  const clampedDay = Math.min(day, maxDay);

  function handleSave() {
    setSaveError('');
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
      setSaveError('입력한 날짜를 확인해주세요.');
    }
  }

  return (
    <div className="border-t border-border px-3 py-3 flex flex-col gap-3">
      <PersonInputFields
        name={name}
        onNameChange={setName}
        gender={gender}
        onGenderChange={setGender}
        isLunar={isLunar}
        onIsLunarChange={setIsLunar}
        year={year}
        month={month}
        day={clampedDay}
        maxDay={maxDay}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onDayChange={setDay}
        hourValue={hourValue}
        onHourChange={setHourValue}
      />
      {saveError && <p className="text-xs text-hwa text-center">{saveError}</p>}
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/ProfileEditForm.tsx
git commit -m "feat: extract ProfileEditForm into standalone component"
```

---

### Task 4: Update `app/page.tsx` to use extracted `ProfileEditForm`

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Remove the inline `ProfileEditForm` function and update imports**

Delete lines 34–106 in `app/page.tsx` (the entire `interface ProfileEditFormProps` and `function ProfileEditForm` block).

The updated import section at the top of `app/page.tsx` should be:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadProfiles, deleteProfile, updateProfile } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
import { calculateSaju } from '@/lib/saju-calculator';
import { saveSession } from '@/lib/session';
import { YEARLY_FORTUNE_YEAR, LABEL_CLASS, INPUT_CLASS } from '@/lib/constants';
import { setPrefillA } from '@/lib/compatibility-prefill';
import ProfileEditForm from '@/components/ProfileEditForm';
```

Remove `DateInput` and `HourInput` imports since they're no longer used in this file.

Note: `LABEL_CLASS` and `INPUT_CLASS` are still used in `app/page.tsx` for the profile list's existing UI — keep them if they appear elsewhere in the file; remove them if not. Check the rest of the file to confirm.

After removing the inline `ProfileEditForm` and updating imports, `calculateSaju`, `saveSession`, `LABEL_CLASS`, `INPUT_CLASS`, `DateInput`, `HourInput` are no longer needed in `app/page.tsx`. The relevant imports to keep are:
```tsx
import { loadProfiles, deleteProfile, updateProfile } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
import { YEARLY_FORTUNE_YEAR } from '@/lib/constants';
import { setPrefillA } from '@/lib/compatibility-prefill';
import ProfileEditForm from '@/components/ProfileEditForm';
```

- [ ] **Step 2: Verify TypeScript compiles and tests pass**

```bash
npx tsc --noEmit && npx jest
```

Expected: no type errors, all 157 tests pass

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "refactor: replace inline ProfileEditForm with extracted component in home page"
```

---

### Task 5: Create `lib/ai-cache.ts` with tests

**Files:**
- Create: `lib/ai-cache.ts`
- Create: `lib/__tests__/ai-cache.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/__tests__/ai-cache.test.ts
import { makeAiCacheKey, saveAiCache, loadAiCache } from '../ai-cache';
import { setupStorageMock } from './test-utils';

setupStorageMock('localStorage');

describe('makeAiCacheKey', () => {
  it('양력, 시 없음', () => {
    expect(makeAiCacheKey(1990, 6, 15, null, false)).toBe('saju-ai-cache:1990-6-15-x-S');
  });

  it('음력, 시 있음', () => {
    expect(makeAiCacheKey(1990, 6, 15, 9, true)).toBe('saju-ai-cache:1990-6-15-9-L');
  });
});

describe('saveAiCache / loadAiCache', () => {
  const key = 'saju-ai-cache:1990-6-15-x-S';
  const sections = { 성격분석: '용감한', 재물운: '좋음', 건강운: '', 연애운: '', 직업운: '' };

  it('저장 후 불러오기', () => {
    saveAiCache(key, sections);
    expect(loadAiCache(key)).toEqual(sections);
  });

  it('없는 키는 null 반환', () => {
    expect(loadAiCache('saju-ai-cache:missing')).toBeNull();
  });

  it('손상된 JSON은 null 반환', () => {
    localStorage.setItem('saju-ai-cache:bad', '{bad json');
    expect(loadAiCache('saju-ai-cache:bad')).toBeNull();
  });

  it('배열은 null 반환', () => {
    localStorage.setItem('saju-ai-cache:arr', '[]');
    expect(loadAiCache('saju-ai-cache:arr')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest lib/__tests__/ai-cache.test.ts
```

Expected: FAIL — "Cannot find module '../ai-cache'"

- [ ] **Step 3: Create `lib/ai-cache.ts`**

```typescript
const PREFIX = 'saju-ai-cache:';

export function makeAiCacheKey(
  year: number,
  month: number,
  day: number,
  hour: number | null,
  isLunar: boolean
): string {
  return `${PREFIX}${year}-${month}-${day}-${hour ?? 'x'}-${isLunar ? 'L' : 'S'}`;
}

export function saveAiCache(key: string, sections: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(sections));
  } catch {
    // quota exceeded — ignore
  }
}

export function loadAiCache(key: string): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, string>;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest lib/__tests__/ai-cache.test.ts
```

Expected: all 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/ai-cache.ts lib/__tests__/ai-cache.test.ts
git commit -m "feat: add AI result cache utilities with localStorage"
```

---

### Task 6: Update `hooks/useAiSections.ts` to support `cacheKey`

**Files:**
- Modify: `hooks/useAiSections.ts`

- [ ] **Step 1: Add imports and update the hook signature**

Add import at top of file:
```typescript
import { saveAiCache, loadAiCache } from '@/lib/ai-cache';
```

Change the function signature from:
```typescript
export function useAiSections(): UseAiSectionsReturn {
```
To:
```typescript
export function useAiSections(cacheKey?: string): UseAiSectionsReturn {
```

- [ ] **Step 2: Load from cache on initialization**

Change the `useState` call for `sections` from:
```typescript
  const [sections, setSections] = useState<Record<SectionKey, string>>(emptySections());
```
To:
```typescript
  const [sections, setSections] = useState<Record<SectionKey, string>>(() => {
    if (!cacheKey) return emptySections();
    const cached = loadAiCache(cacheKey);
    if (!cached) return emptySections();
    return cached as Record<SectionKey, string>;
  });
```

- [ ] **Step 3: Save to cache when streaming completes**

After the `while (true)` read loop ends and the final `setSections(parseSections(textRef.current))` is called, add the cache save. Find this block in the `try`:

```typescript
      textRef.current += decoder.decode();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setSections(parseSections(textRef.current));
      setActiveSection(null);
```

Replace with:

```typescript
      textRef.current += decoder.decode();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const finalSections = parseSections(textRef.current);
      if (cacheKey) saveAiCache(cacheKey, finalSections);
      setSections(finalSections);
      setActiveSection(null);
```

- [ ] **Step 4: Verify TypeScript and tests pass**

```bash
npx tsc --noEmit && npx jest
```

Expected: no errors, all tests pass

- [ ] **Step 5: Commit**

```bash
git add hooks/useAiSections.ts
git commit -m "feat: cache AI analysis results in localStorage via useAiSections cacheKey"
```

---

### Task 7: Wire up cache key in `SajuResultContent.tsx`

**Files:**
- Modify: `app/saju/result/SajuResultContent.tsx`

- [ ] **Step 1: Add imports**

Add to the existing imports in `SajuResultContent.tsx`:
```typescript
import { loadSession } from '@/lib/session';
import { makeAiCacheKey } from '@/lib/ai-cache';
```

Note: `loadSession` is already imported — do not add a duplicate.

- [ ] **Step 2: Derive cache key synchronously and pass to hook**

In `SajuResultContent`, before calling `useAiSections()`, add:

```typescript
  const cacheKey = useMemo(() => {
    const s = loadSession();
    if (!s) return undefined;
    return makeAiCacheKey(s.input.year, s.input.month, s.input.day, s.input.hour, s.input.isLunar);
  }, []);
```

Then change:
```typescript
  const { sections, activeSection, isStreaming, aiError, request } = useAiSections();
```
To:
```typescript
  const { sections, activeSection, isStreaming, aiError, request } = useAiSections(cacheKey);
```

`useMemo` with empty deps runs once on mount. Since `SajuResultContent` is `ssr: false`, `localStorage` is always available when this runs.

- [ ] **Step 3: Verify TypeScript and full test suite pass**

```bash
npx tsc --noEmit && npx jest
```

Expected: no errors, all tests pass (163 total — 6 new ai-cache tests + original 157)

- [ ] **Step 4: Commit**

```bash
git add app/saju/result/SajuResultContent.tsx
git commit -m "feat: restore cached AI analysis result when revisiting saju result page"
```

---

## Manual Verification Checklist

After completing all tasks, verify these scenarios in the browser:

1. **Saju input page** — open `/saju`, fill in form, confirm all fields work (name, gender, lunar, date, hour)
2. **Profile edit on home** — go home with a saved profile, tap 편집 → expand profile → confirm edit form fields work
3. **AI cache** — on `/saju/result`, request AI analysis, wait for completion, close the tab, reopen the app and navigate back to `/saju/result`. The AI sections should be pre-populated without requesting again.
4. **TypeScript** — `npx tsc --noEmit` passes
5. **Tests** — `npx jest` shows 163 passing tests
