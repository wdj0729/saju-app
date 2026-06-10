# 다중 프로필 저장 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** localStorage에 여러 사람의 사주 입력 정보를 저장하여 홈 화면 칩으로 빠르게 불러오고, 결과 페이지에서 수동으로 저장할 수 있게 한다.

**Architecture:** `lib/profiles.ts`에 CRUD 함수를 집중시키고, 세 페이지(홈/입력폼/결과)에서 이를 호출한다. 저장소는 localStorage `'saju-profiles'` 키의 JSON 배열이며 서버리스로 동작한다.

**Tech Stack:** Next.js 16 App Router, React useState, localStorage, Jest (테스트)

---

## 파일 구조

| 파일 | 역할 |
|------|------|
| `lib/profiles.ts` (신규) | Profile CRUD — loadProfiles, saveProfile, deleteProfile, isProfileSaved |
| `lib/__tests__/profiles.test.ts` (신규) | profiles.ts 단위 테스트 |
| `app/saju/result/page.tsx` (수정) | 하단에 💾 저장 버튼 추가 |
| `app/page.tsx` (수정) | 'use client' 전환, 홈 화면 프로필 칩 + 편집 모드 |
| `app/saju/page.tsx` (수정) | 폼 상단에 프로필 목록 + 자동채우기 |

---

## Task 1: lib/profiles.ts — CRUD 라이브러리

**Files:**
- Create: `lib/profiles.ts`
- Create: `lib/__tests__/profiles.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`lib/__tests__/profiles.test.ts` 를 아래 내용으로 생성한다.

```ts
import { loadProfiles, saveProfile, deleteProfile, isProfileSaved } from '../profiles';
import type { SajuSessionInput } from '../session';

const store: Record<string, string> = {};

beforeAll(() => {
  Object.defineProperty(global, 'window', { value: {}, writable: true, configurable: true });
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem:    (k: string) => store[k] ?? null,
      setItem:    (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    },
    writable: true,
    configurable: true,
  });
});

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
});

const INPUT: SajuSessionInput = {
  name: '홍길동',
  year: 1990,
  month: 6,
  day: 15,
  hour: null,
  isLunar: false,
};

describe('loadProfiles', () => {
  it('비어있으면 [] 반환', () => {
    expect(loadProfiles()).toEqual([]);
  });

  it('손상된 JSON이면 [] 반환', () => {
    store['saju-profiles'] = '{bad json';
    expect(loadProfiles()).toEqual([]);
  });

  it('배열이 아닌 값이면 [] 반환', () => {
    store['saju-profiles'] = '{"key":"value"}';
    expect(loadProfiles()).toEqual([]);
  });
});

describe('saveProfile', () => {
  it('저장 후 loadProfiles에 포함됨', () => {
    saveProfile(INPUT, '甲');
    const profiles = loadProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('홍길동');
    expect(profiles[0].ilgan).toBe('甲');
    expect(profiles[0].year).toBe(1990);
  });

  it('동일 input 두 번 저장 시 1개만 유지됨 (중복 방지)', () => {
    saveProfile(INPUT, '甲');
    saveProfile(INPUT, '甲');
    expect(loadProfiles()).toHaveLength(1);
  });

  it('이름이 다른 input은 별도 저장됨', () => {
    saveProfile(INPUT, '甲');
    saveProfile({ ...INPUT, name: '김영희' }, '丙');
    expect(loadProfiles()).toHaveLength(2);
  });

  it('저장된 profile에 id와 createdAt이 있음', () => {
    saveProfile(INPUT, '甲');
    const p = loadProfiles()[0];
    expect(typeof p.id).toBe('string');
    expect(p.id.length).toBeGreaterThan(0);
    expect(typeof p.createdAt).toBe('number');
  });
});

describe('deleteProfile', () => {
  it('id로 프로필 삭제', () => {
    saveProfile(INPUT, '甲');
    const id = loadProfiles()[0].id;
    deleteProfile(id);
    expect(loadProfiles()).toHaveLength(0);
  });

  it('존재하지 않는 id 삭제 시 오류 없음', () => {
    saveProfile(INPUT, '甲');
    deleteProfile('nonexistent-id');
    expect(loadProfiles()).toHaveLength(1);
  });
});

describe('isProfileSaved', () => {
  it('저장된 input → true', () => {
    saveProfile(INPUT, '甲');
    expect(isProfileSaved(INPUT)).toBe(true);
  });

  it('저장 안 된 input → false', () => {
    expect(isProfileSaved(INPUT)).toBe(false);
  });

  it('이름만 다르면 false', () => {
    saveProfile(INPUT, '甲');
    expect(isProfileSaved({ ...INPUT, name: '김영희' })).toBe(false);
  });

  it('연도만 다르면 false', () => {
    saveProfile(INPUT, '甲');
    expect(isProfileSaved({ ...INPUT, year: 1991 })).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd /Users/peter/saju-app && npx jest lib/__tests__/profiles.test.ts
```

Expected: `Cannot find module '../profiles'` 오류로 FAIL

- [ ] **Step 3: lib/profiles.ts 구현**

`lib/profiles.ts` 를 아래 내용으로 생성한다.

```ts
import type { SajuSessionInput } from './session';

const KEY = 'saju-profiles';

export interface Profile {
  id: string;
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  isLunar: boolean;
  ilgan: string;
  createdAt: number;
}

export function loadProfiles(): Profile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Profile[];
  } catch {
    return [];
  }
}

function persist(profiles: Profile[]): void {
  localStorage.setItem(KEY, JSON.stringify(profiles));
}

export function isProfileSaved(input: SajuSessionInput): boolean {
  return loadProfiles().some(
    p =>
      p.name === input.name &&
      p.year === input.year &&
      p.month === input.month &&
      p.day === input.day &&
      p.hour === input.hour &&
      p.isLunar === input.isLunar
  );
}

export function saveProfile(input: SajuSessionInput, ilgan: string): void {
  if (typeof window === 'undefined') return;
  if (isProfileSaved(input)) return;
  const profiles = loadProfiles();
  profiles.push({
    id: String(Date.now()),
    name: input.name,
    year: input.year,
    month: input.month,
    day: input.day,
    hour: input.hour,
    isLunar: input.isLunar,
    ilgan,
    createdAt: Date.now(),
  });
  persist(profiles);
}

export function deleteProfile(id: string): void {
  if (typeof window === 'undefined') return;
  persist(loadProfiles().filter(p => p.id !== id));
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /Users/peter/saju-app && npx jest lib/__tests__/profiles.test.ts
```

Expected: 전체 테스트 PASS, 출력 예시:
```
PASS lib/__tests__/profiles.test.ts
  loadProfiles
    ✓ 비어있으면 [] 반환
    ✓ 손상된 JSON이면 [] 반환
    ✓ 배열이 아닌 값이면 [] 반환
  saveProfile
    ✓ 저장 후 loadProfiles에 포함됨
    ...
Tests: 11 passed
```

- [ ] **Step 5: 커밋**

```bash
git add lib/profiles.ts lib/__tests__/profiles.test.ts
git commit -m "feat: add profiles CRUD library with localStorage"
```

---

## Task 2: app/saju/result/page.tsx — 저장 버튼 추가

**Files:**
- Modify: `app/saju/result/page.tsx`

현재 파일 상단 import와 하단 버튼 행을 수정한다.

- [ ] **Step 1: import 추가**

`app/saju/result/page.tsx` 상단의 import 블록에 아래 두 줄을 추가한다.

```ts
// 기존 import 아래에 추가
import { saveProfile, isProfileSaved } from '@/lib/profiles';
```

- [ ] **Step 2: isSaved state 추가**

`const cardRef = useRef<HTMLDivElement>(null);` 바로 아래에 추가한다.

```ts
const [isSaved, setIsSaved] = useState(() => isProfileSaved(input));
```

`useState`는 이미 import되어 있으므로 추가 import 불필요.

- [ ] **Step 3: 저장 핸들러 추가**

`if (!session) return null;` 바로 아래에 추가한다.

```ts
function handleSave() {
  saveProfile(input, result.ilgan);
  setIsSaved(true);
}
```

- [ ] **Step 4: 하단 버튼 행에 저장 버튼 추가**

기존 하단 버튼 행:
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
  <ShareButton
    cardRef={cardRef}
    filename="saju-result.png"
    shareTitle="내 사주 결과"
  />
</div>
```

아래로 교체한다:
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
  <ShareButton
    cardRef={cardRef}
    filename="saju-result.png"
    shareTitle="내 사주 결과"
  />
</div>
```

- [ ] **Step 5: 동작 확인**

`npm run dev` 실행 후 http://localhost:3000/saju 에서 사주 입력 → 결과 페이지에서 💾 버튼 클릭 → ✓로 바뀌는지 확인.
브라우저 DevTools → Application → localStorage → `saju-profiles` 키에 데이터 저장됐는지 확인.

- [ ] **Step 6: 커밋**

```bash
git add app/saju/result/page.tsx
git commit -m "feat: add save profile button to saju result page"
```

---

## Task 3: app/page.tsx — 홈 화면 프로필 칩 + 편집 모드

**Files:**
- Modify: `app/page.tsx`

현재 서버 컴포넌트인 홈 페이지를 클라이언트 컴포넌트로 전환하고, 프로필 섹션을 추가한다.

- [ ] **Step 1: app/page.tsx 전체 교체**

`app/page.tsx` 를 아래 내용으로 전체 교체한다.

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadProfiles, deleteProfile } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
import { calculateSaju } from '@/lib/saju-calculator';
import { saveSession } from '@/lib/session';

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

export default function Home() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>(() => loadProfiles());
  const [isEditing, setIsEditing] = useState(false);

  function handleProfileSelect(profile: Profile) {
    try {
      const result = calculateSaju({
        year: profile.year,
        month: profile.month,
        day: profile.day,
        hour: profile.hour,
        isLunar: profile.isLunar,
      });
      saveSession({
        input: {
          name: profile.name,
          year: profile.year,
          month: profile.month,
          day: profile.day,
          hour: profile.hour,
          isLunar: profile.isLunar,
        },
        result,
      });
      router.push('/saju/result');
    } catch {
      router.push('/saju');
    }
  }

  function handleDelete(id: string) {
    deleteProfile(id);
    setProfiles(loadProfiles());
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="flex flex-col items-center mb-8">
        <span className="text-4xl mb-3">🔮</span>
        <h1 className="text-2xl font-bold text-primary">사주팔자</h1>
        <p className="text-sm text-muted mt-1">나의 운명을 살펴보세요</p>
      </div>

      {profiles.length > 0 && (
        <div className="w-full bg-card rounded-2xl px-4 py-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted">저장된 프로필</span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`text-xs transition-colors ${isEditing ? 'text-hwa' : 'text-primary'}`}
            >
              {isEditing ? '완료' : '편집'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profiles.map((profile) => (
              <div key={profile.id} className="relative inline-flex items-center">
                <button
                  onClick={() => !isEditing && handleProfileSelect(profile)}
                  disabled={isEditing}
                  className="bg-card-hover rounded-full px-3 py-1.5 text-xs text-primary disabled:cursor-default"
                >
                  🔮 {profile.name || '이름 없음'}
                </button>
                {isEditing && (
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-hwa rounded-full text-white text-xs flex items-center justify-center leading-none"
                    aria-label={`${profile.name} 삭제`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {!isEditing && (
              <Link
                href="/saju"
                className="bg-primary-gradient rounded-full px-3 py-1.5 text-xs text-white"
              >
                + 추가
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full">
        {CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-card rounded-2xl p-4 flex items-center gap-4 hover:bg-card-hover transition-colors"
          >
            <span className="text-2xl">{card.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary">{card.title}</p>
              <p className="text-xs text-muted mt-0.5">{card.subtitle}</p>
            </div>
            <span className="text-muted">→</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 동작 확인**

`npm run dev` 후 http://localhost:3000 확인:
1. 프로필 없을 때: 기존 홈과 동일하게 카드 3개만 보임
2. Task 2에서 저장한 프로필이 있을 때: 상단에 프로필 섹션 표시
3. 프로필 칩 탭: 사주 결과 페이지로 바로 이동
4. "편집" 탭: × 아이콘 표시됨
5. × 탭: 해당 프로필 삭제 후 목록 갱신
6. "완료" 탭: 편집 모드 종료

- [ ] **Step 3: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: add profile chips with edit mode to home page"
```

---

## Task 4: app/saju/page.tsx — 입력 폼 상단 프로필 목록

**Files:**
- Modify: `app/saju/page.tsx`

- [ ] **Step 1: import 추가**

`app/saju/page.tsx` 상단 import 블록에 추가한다.

```ts
import { loadProfiles } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
```

- [ ] **Step 2: profiles state 추가**

`SajuInputPage` 컴포넌트 내부, 기존 `const [name, setName] = useState('');` 바로 위에 추가한다.

```ts
const [profiles] = useState<Profile[]>(() => loadProfiles());
```

- [ ] **Step 3: loadFromProfile 핸들러 추가**

`const maxDay = ...` 줄 바로 위에 추가한다.

```ts
function loadFromProfile(profile: Profile) {
  setName(profile.name);
  setYear(profile.year);
  setMonth(profile.month);
  setDay(profile.day);
  setHourValue(profile.hour);
  setIsLunar(profile.isLunar);
}
```

- [ ] **Step 4: 프로필 목록 섹션 JSX 추가**

`<div className="flex flex-col gap-5 px-4 py-6 flex-1">` 바로 다음, `{/* 이름 */}` 블록 바로 앞에 삽입한다.

```tsx
{profiles.length > 0 && (
  <div className="bg-card rounded-2xl px-4 py-3">
    <p className="text-xs text-muted mb-2 font-medium">저장된 프로필 불러오기</p>
    <div className="flex flex-col gap-2">
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className="flex justify-between items-center bg-card-hover rounded-xl px-3 py-2"
        >
          <div className="min-w-0">
            <span className="text-sm text-primary font-medium truncate">
              {profile.name || '이름 없음'}
            </span>
            <span className="text-xs text-muted ml-2">
              {profile.year}.{String(profile.month).padStart(2, '0')}.{String(profile.day).padStart(2, '0')}
              {' · '}{profile.isLunar ? '음력' : '양력'}
              {' · '}{profile.ilgan}
            </span>
          </div>
          <button
            onClick={() => loadFromProfile(profile)}
            className="text-xs text-primary hover:opacity-70 transition-opacity ml-3 flex-shrink-0"
          >
            선택
          </button>
        </div>
      ))}
    </div>
    <p className="text-xs text-muted mt-3 text-center">또는 새로 입력하기 ↓</p>
  </div>
)}
```

- [ ] **Step 5: 동작 확인**

http://localhost:3000/saju 접속:
1. 저장된 프로필 있을 때: 폼 상단에 프로필 목록 표시
2. "선택" 탭: 이름/생년/시/음양력 모두 폼에 자동 채워짐
3. 저장된 프로필 없을 때: 섹션 미표시, 기존 폼 그대로

- [ ] **Step 6: 전체 테스트 실행**

```bash
cd /Users/peter/saju-app && npx jest
```

Expected: 모든 테스트 PASS (기존 테스트 + 새 profiles 테스트)

- [ ] **Step 7: 커밋**

```bash
git add app/saju/page.tsx
git commit -m "feat: add saved profile picker to saju input form"
```
