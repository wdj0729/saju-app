# UX 개선 5종 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 재생성 버튼 개선, 날짜 자동갱신, 에러 복구 UX, 궁합 카드 리디자인, 프로필 아코디언 바로가기 5가지 UX를 순차 구현한다.

**Architecture:** 독립적인 태스크부터 처리하고, 공용 훅/컴포넌트를 먼저 만든 뒤 이를 사용하는 페이지를 수정한다. `useSessionOrRedirect`를 확장해 null redirectPath 시 `'not-found'`를 반환하도록 하여 4개 결과 페이지에 일관된 에러 UI를 제공한다.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, Jest (sessionStorage mock)

---

## 파일 맵

| 파일 | 작업 |
|------|------|
| `.gitignore` | `.superpowers/` 추가 |
| `components/AiContent.tsx` | "다시 요청" 버튼 스타일 개선 |
| `app/fortune/FortuneContent.tsx` | 날짜 useMemo + 에러 복구 |
| `hooks/useSessionOrRedirect.ts` | null redirectPath → `'not-found'` 반환 |
| `components/SessionExpiredPage.tsx` | 신규 공용 에러 UI |
| `app/saju/result/SajuResultContent.tsx` | 에러 복구 적용 |
| `app/fortune/yearly/YearlyFortuneContent.tsx` | 에러 복구 적용 |
| `app/compatibility/result/CompatibilityResultContent.tsx` | 에러 복구 + 궁합 카드 ilgan 전달 |
| `components/ShareCard.tsx` | CompatibilityCardProps 타입 확장 + CompatibilityInner 리디자인 |
| `lib/compatibility-prefill.ts` | 신규 — personA 프리필 sessionStorage 유틸 |
| `lib/__tests__/compatibility-prefill.test.ts` | 신규 — 프리필 유틸 단위 테스트 |
| `app/page.tsx` | 프로필 칩 → 아코디언 바로가기 |
| `app/compatibility/page.tsx` | 마운트 시 프리필 적용 |

---

## Task 1: .gitignore 업데이트 + AiContent 버튼 개선

**Files:**
- Modify: `.gitignore`
- Modify: `components/AiContent.tsx`

- [ ] **Step 1: .gitignore에 `.superpowers/` 추가**

`.gitignore` 파일에서 `# testing` 블록 아래에 다음을 추가:

```
# superpowers brainstorming mockups
.superpowers/
```

- [ ] **Step 2: AiContent.tsx — "다시 요청" 버튼 스타일 교체**

`components/AiContent.tsx` 파일에서 다음을 찾아:

```tsx
        {!isStreaming && (
          <button onClick={onRequest} className="mt-3 text-xs text-muted underline">
            다시 요청
          </button>
        )}
```

다음으로 교체:

```tsx
        {!isStreaming && (
          <button
            onClick={onRequest}
            className="mt-3 w-full py-2 rounded-xl bg-card-hover text-sm text-muted hover:text-primary transition-colors"
          >
            🔄 다시 분석하기
          </button>
        )}
```

- [ ] **Step 3: 타입체크 확인**

```bash
npx tsc --noEmit
```

오류 없음 확인.

- [ ] **Step 4: 커밋**

```bash
git add .gitignore components/AiContent.tsx
git commit -m "feat: improve re-analyze button style and ignore superpowers dir"
```

---

## Task 2: FortuneContent 날짜 자동 갱신

**Files:**
- Modify: `app/fortune/FortuneContent.tsx`

- [ ] **Step 1: 모듈 레벨 날짜 변수 제거**

`app/fortune/FortuneContent.tsx` 상단에서 다음 두 줄을 제거:

```tsx
const _today = new Date();
const TODAY_DATE_STR = `${_today.getFullYear()}년 ${_today.getMonth() + 1}월 ${_today.getDate()}일`;
```

- [ ] **Step 2: useMemo import 확인 및 컴포넌트 내부에 날짜 계산 추가**

파일 상단 import 줄에서 `useState` 옆에 `useMemo`가 없으면 추가:

```tsx
import { useEffect, useMemo, useState } from 'react';
```

`export default function FortuneContent()` 함수 내부 — `const { aiText, isStreaming, aiError, request } = useAiStream();` 바로 아래에 추가:

```tsx
  const todayDateStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  }, []);
```

- [ ] **Step 3: ShareButton cardProps에서 TODAY_DATE_STR → todayDateStr 교체**

같은 파일 하단 ShareButton 부분에서:

```tsx
            date: TODAY_DATE_STR,
```

를:

```tsx
            date: todayDateStr,
```

로 교체.

- [ ] **Step 4: 타입체크 확인**

```bash
npx tsc --noEmit
```

오류 없음 확인.

- [ ] **Step 5: 커밋**

```bash
git add app/fortune/FortuneContent.tsx
git commit -m "fix: compute today date string at render time instead of module load"
```

---

## Task 3: useSessionOrRedirect null 모드 + SessionExpiredPage 컴포넌트

**Files:**
- Modify: `hooks/useSessionOrRedirect.ts`
- Create: `components/SessionExpiredPage.tsx`

- [ ] **Step 1: useSessionOrRedirect 훅 수정**

`hooks/useSessionOrRedirect.ts` 전체를 다음으로 교체:

```ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useSessionOrRedirect<T>(
  loader: () => T | null,
  redirectPath: string | null,
  onLoaded?: (session: T) => void
): T | null | 'not-found' {
  const router = useRouter();
  const onLoadedRef = useRef(onLoaded);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  });

  const [session, setSession] = useState<T | null | 'not-found'>(null);

  useEffect(() => {
    const s = loader();
    if (!s) {
      if (redirectPath === null) {
        setSession('not-found');
      } else {
        router.replace(redirectPath);
      }
      return;
    }
    setSession(s);
    onLoadedRef.current?.(s);
  }, [loader, router, redirectPath]);

  return session;
}
```

- [ ] **Step 2: SessionExpiredPage 컴포넌트 생성**

`components/SessionExpiredPage.tsx` 파일 생성:

```tsx
'use client';

import Link from 'next/link';

interface SessionExpiredPageProps {
  redirectPath: string;
  redirectLabel?: string;
}

export default function SessionExpiredPage({
  redirectPath,
  redirectLabel = '다시 입력하기',
}: SessionExpiredPageProps) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-4">
      <span className="text-4xl">🔮</span>
      <h2 className="text-base font-semibold text-primary">세션이 만료됐어요</h2>
      <p className="text-sm text-muted leading-relaxed">
        생년월일을 다시 입력하면
        <br />
        결과를 볼 수 있어요
      </p>
      <Link
        href={redirectPath}
        className="mt-2 px-6 py-3 rounded-2xl bg-primary-gradient text-white text-sm font-semibold"
      >
        {redirectLabel}
      </Link>
    </main>
  );
}
```

- [ ] **Step 3: 타입체크 확인**

```bash
npx tsc --noEmit
```

기존 호출부 4곳에서 타입 오류 발생 예상 (`T | null | 'not-found'` 처리 누락) — Task 4에서 수정하므로 오류 있어도 OK.

- [ ] **Step 4: 커밋**

```bash
git add hooks/useSessionOrRedirect.ts components/SessionExpiredPage.tsx
git commit -m "feat: add null-mode support to useSessionOrRedirect and SessionExpiredPage"
```

---

## Task 4: 4개 결과 페이지에 에러 복구 적용

**Files:**
- Modify: `app/saju/result/SajuResultContent.tsx`
- Modify: `app/fortune/FortuneContent.tsx`
- Modify: `app/fortune/yearly/YearlyFortuneContent.tsx`
- Modify: `app/compatibility/result/CompatibilityResultContent.tsx`

- [ ] **Step 1: SajuResultContent.tsx — 에러 복구 적용**

`app/saju/result/SajuResultContent.tsx`에서:

import 블록에 추가:
```tsx
import SessionExpiredPage from '@/components/SessionExpiredPage';
```

```tsx
  const session = useSessionOrRedirect(loadSession, '/saju', (s) =>
```
를:
```tsx
  const session = useSessionOrRedirect(loadSession, null, (s) =>
```
로 교체.

그 바로 다음 `if (!session) return <SajuResultSkeleton />;` 찾아서, 그 **앞에** 삽입:
```tsx
  if (session === 'not-found') return <SessionExpiredPage redirectPath="/saju" />;
```

- [ ] **Step 2: FortuneContent.tsx — 에러 복구 적용**

`app/fortune/FortuneContent.tsx`에서:

import 블록에 추가:
```tsx
import SessionExpiredPage from '@/components/SessionExpiredPage';
```

```tsx
  const session = useSessionOrRedirect(loadSession, '/saju');
```
를:
```tsx
  const session = useSessionOrRedirect(loadSession, null);
```
로 교체.

`if (!session) return <FortuneSkeleton />;` 앞에 삽입:
```tsx
  if (session === 'not-found') return <SessionExpiredPage redirectPath="/saju" />;
```

- [ ] **Step 3: YearlyFortuneContent.tsx — 에러 복구 적용**

`app/fortune/yearly/YearlyFortuneContent.tsx`에서:

import 블록에 추가:
```tsx
import SessionExpiredPage from '@/components/SessionExpiredPage';
```

```tsx
  const session = useSessionOrRedirect(loadSession, '/saju');
```
를:
```tsx
  const session = useSessionOrRedirect(loadSession, null);
```
로 교체.

`if (!session) return <YearlyFortuneSkeleton />;` 앞에 삽입:
```tsx
  if (session === 'not-found') return <SessionExpiredPage redirectPath="/saju" />;
```

- [ ] **Step 4: CompatibilityResultContent.tsx — 에러 복구 적용**

`app/compatibility/result/CompatibilityResultContent.tsx`에서:

import 블록에 추가:
```tsx
import SessionExpiredPage from '@/components/SessionExpiredPage';
```

```tsx
  const session = useSessionOrRedirect(loadCompatSession, '/compatibility');
```
를:
```tsx
  const session = useSessionOrRedirect(loadCompatSession, null);
```
로 교체.

`if (!session) return <CompatibilityResultSkeleton />;` 앞에 삽입:
```tsx
  if (session === 'not-found') return <SessionExpiredPage redirectPath="/compatibility" redirectLabel="다시 입력하기" />;
```

- [ ] **Step 5: 타입체크 확인**

```bash
npx tsc --noEmit
```

오류 없음 확인.

- [ ] **Step 6: 커밋**

```bash
git add app/saju/result/SajuResultContent.tsx app/fortune/FortuneContent.tsx app/fortune/yearly/YearlyFortuneContent.tsx app/compatibility/result/CompatibilityResultContent.tsx
git commit -m "feat: replace silent redirect with SessionExpiredPage on missing session"
```

---

## Task 5: 궁합 공유 카드 리디자인

**Files:**
- Modify: `components/ShareCard.tsx`
- Modify: `app/compatibility/result/CompatibilityResultContent.tsx`

- [ ] **Step 1: CompatibilityCardProps에 ilganA, ilganB 추가**

`components/ShareCard.tsx`에서 `CompatibilityCardProps` 타입을 찾아:

```ts
type CompatibilityCardProps = {
  type: 'compatibility';
  nameA: string;
  nameB: string;
  score: number;
  grade: string;
  gradeLabel: string;
  summary: string;
};
```

다음으로 교체:

```ts
type CompatibilityCardProps = {
  type: 'compatibility';
  nameA: string;
  nameB: string;
  ilganA: string;
  ilganB: string;
  score: number;
  grade: string;
  gradeLabel: string;
  summary: string;
};
```

- [ ] **Step 2: CompatibilityInner 함수 전체 교체**

`components/ShareCard.tsx`에서 `function CompatibilityInner` 전체를 다음으로 교체:

```tsx
function CompatibilityInner({
  nameA,
  nameB,
  ilganA,
  ilganB,
  score,
  grade,
  gradeLabel,
  summary,
}: CompatibilityCardProps) {
  const GRADE_STARS: Record<string, string> = {
    최상: '★★★★★',
    상: '★★★★☆',
    중: '★★★☆☆',
    하: '★★☆☆☆',
  };
  const stars = GRADE_STARS[grade] ?? '★★☆☆☆';
  const avatarA = (nameA || '나').charAt(0);
  const avatarB = (nameB || '상대').charAt(0);

  return (
    <>
      <div
        style={{
          display: 'flex',
          width: '100%',
          gap: 8,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            flex: 1,
            background: '#32324a',
            borderRadius: 12,
            padding: '10px 8px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              color: 'white',
              margin: '0 auto 6px',
            }}
          >
            {avatarA}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{nameA || '나'}</div>
          <div style={{ fontSize: 10, color: '#9090a8', marginTop: 2 }}>{ilganA} 일간</div>
        </div>

        <div style={{ fontSize: 22 }}>💞</div>

        <div
          style={{
            flex: 1,
            background: '#32324a',
            borderRadius: 12,
            padding: '10px 8px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              color: 'white',
              margin: '0 auto 6px',
            }}
          >
            {avatarB}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{nameB || '상대'}</div>
          <div style={{ fontSize: 10, color: '#9090a8', marginTop: 2 }}>{ilganB} 일간</div>
        </div>
      </div>

      <div
        style={{
          fontSize: 52,
          fontWeight: 800,
          background: 'linear-gradient(to right, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {score}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{stars}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#c8c8e0', marginBottom: 12 }}>
        {grade} · {gradeLabel}
      </div>
      <div
        style={{
          background: '#32324a',
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 11,
          lineHeight: 1.7,
          color: '#c8c8e0',
          textAlign: 'center',
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: 12,
        }}
      >
        {summary.length > 80 ? summary.slice(0, 80) + '…' : summary}
      </div>
      <div style={{ marginTop: 'auto' }}>
        <Badge />
      </div>
    </>
  );
}
```

- [ ] **Step 3: CompatibilityResultContent.tsx — ShareButton에 ilganA/ilganB 전달**

`app/compatibility/result/CompatibilityResultContent.tsx`의 ShareButton cardProps를 찾아:

```tsx
        <ShareButton
          cardProps={{
            type: 'compatibility',
            nameA,
            nameB,
            score,
            grade,
            gradeLabel,
            summary,
          }}
```

다음으로 교체:

```tsx
        <ShareButton
          cardProps={{
            type: 'compatibility',
            nameA,
            nameB,
            ilganA: personA.result.ilgan,
            ilganB: personB.result.ilgan,
            score,
            grade,
            gradeLabel,
            summary,
          }}
```

- [ ] **Step 4: 타입체크 확인**

```bash
npx tsc --noEmit
```

오류 없음 확인.

- [ ] **Step 5: 커밋**

```bash
git add components/ShareCard.tsx app/compatibility/result/CompatibilityResultContent.tsx
git commit -m "feat: redesign compatibility share card with dual avatar layout"
```

---

## Task 6: compatibility-prefill 유틸 + 테스트

**Files:**
- Create: `lib/compatibility-prefill.ts`
- Create: `lib/__tests__/compatibility-prefill.test.ts`

- [ ] **Step 1: 테스트 파일 먼저 작성**

`lib/__tests__/compatibility-prefill.test.ts` 생성:

```ts
import { setPrefillA, getPrefillA, clearPrefillA } from '../compatibility-prefill';
import type { Profile } from '../profiles';
import { setupStorageMock } from './test-utils';

setupStorageMock('sessionStorage');

const mockProfile: Profile = {
  id: 'test-1',
  name: '홍길동',
  year: 1990,
  month: 5,
  day: 15,
  hour: null,
  isLunar: false,
  gender: 'M',
  ilgan: '甲',
  createdAt: 1000000,
};

describe('compatibility-prefill', () => {
  test('getPrefillA returns null when nothing stored', () => {
    expect(getPrefillA()).toBeNull();
  });

  test('setPrefillA stores profile, getPrefillA retrieves it', () => {
    setPrefillA(mockProfile);
    const result = getPrefillA();
    expect(result).toEqual(mockProfile);
  });

  test('clearPrefillA removes stored profile', () => {
    setPrefillA(mockProfile);
    clearPrefillA();
    expect(getPrefillA()).toBeNull();
  });

  test('getPrefillA returns null after clear', () => {
    setPrefillA(mockProfile);
    clearPrefillA();
    expect(getPrefillA()).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx jest lib/__tests__/compatibility-prefill.test.ts
```

예상 결과: `Cannot find module '../compatibility-prefill'` 오류로 실패.

- [ ] **Step 3: compatibility-prefill.ts 구현**

`lib/compatibility-prefill.ts` 생성:

```ts
import type { Profile } from './profiles';

const KEY = 'compat-prefill-a';

export function setPrefillA(profile: Profile): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(profile));
}

export function getPrefillA(): Profile | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function clearPrefillA(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npx jest lib/__tests__/compatibility-prefill.test.ts
```

예상 결과:
```
PASS lib/__tests__/compatibility-prefill.test.ts
  compatibility-prefill
    ✓ getPrefillA returns null when nothing stored
    ✓ setPrefillA stores profile, getPrefillA retrieves it
    ✓ clearPrefillA removes stored profile
    ✓ getPrefillA returns null after clear
```

- [ ] **Step 5: 커밋**

```bash
git add lib/compatibility-prefill.ts lib/__tests__/compatibility-prefill.test.ts
git commit -m "feat: add compatibility-prefill sessionStorage utility with tests"
```

---

## Task 7: 홈 프로필 아코디언 + 궁합 페이지 프리필 적용

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/compatibility/page.tsx`

- [ ] **Step 1: app/page.tsx — import 추가**

`app/page.tsx` 상단 import 블록에 추가:

```tsx
import { setPrefillA } from '@/lib/compatibility-prefill';
```

- [ ] **Step 2: app/page.tsx — expandedProfileId 상태 추가**

`const [isEditing, setIsEditing] = useState(false);` 바로 아래에 추가:

```tsx
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
```

- [ ] **Step 3: app/page.tsx — handleProfileNav 함수 추가**

기존 `handleProfileSelect` 함수 전체를 다음으로 교체:

```tsx
  function handleProfileNav(profile: Profile, dest: 'saju' | 'fortune' | 'yearly' | 'compat') {
    if (dest === 'compat') {
      setPrefillA(profile);
      router.push('/compatibility');
      return;
    }
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
          gender: profile.gender ?? 'M',
        },
        result,
      });
      router.push(
        dest === 'saju' ? '/saju/result' : dest === 'fortune' ? '/fortune' : '/fortune/yearly'
      );
    } catch {
      router.push('/saju');
    }
  }
```

- [ ] **Step 4: app/page.tsx — 프로필 섹션 JSX 교체**

현재 프로필 섹션 전체:

```tsx
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
                  onClick={() => handleProfileSelect(profile)}
                  disabled={isEditing}
                  className="bg-card-hover rounded-full px-3 py-1.5 text-xs text-primary disabled:cursor-default"
                >
                  🔮 {profile.name || '이름 없음'} · {profile.ilgan}
                </button>
                {isEditing && (
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-hwa rounded-full text-white text-xs flex items-center justify-center leading-none"
                    aria-label={`${profile.name || '이름 없음'} 삭제`}
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
```

다음으로 교체:

```tsx
      {profiles.length > 0 && (
        <div className="w-full bg-card rounded-2xl px-4 py-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted">저장된 프로필</span>
            <button
              onClick={() => {
                setIsEditing(!isEditing);
                setExpandedProfileId(null);
              }}
              className={`text-xs transition-colors ${isEditing ? 'text-hwa' : 'text-primary'}`}
            >
              {isEditing ? '완료' : '편집'}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {profiles.map((profile) => (
              <div key={profile.id} className="bg-card-hover rounded-2xl overflow-hidden">
                <div className="flex items-center px-3 py-2 gap-2">
                  <button
                    onClick={() => {
                      if (isEditing) return;
                      setExpandedProfileId(
                        expandedProfileId === profile.id ? null : profile.id
                      );
                    }}
                    className="flex-1 text-left text-xs text-primary"
                  >
                    🔮 {profile.name || '이름 없음'} · {profile.ilgan}
                  </button>
                  {isEditing ? (
                    <button
                      onClick={() => handleDelete(profile.id)}
                      className="w-4 h-4 bg-hwa rounded-full text-white text-xs flex items-center justify-center leading-none shrink-0"
                      aria-label={`${profile.name || '이름 없음'} 삭제`}
                    >
                      ×
                    </button>
                  ) : (
                    <span className="text-muted text-xs shrink-0">
                      {expandedProfileId === profile.id ? '∧' : '∨'}
                    </span>
                  )}
                </div>
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
              </div>
            ))}
            {!isEditing && (
              <Link
                href="/saju"
                className="bg-primary-gradient rounded-2xl px-3 py-2 text-xs text-white text-center"
              >
                + 새 프로필 추가
              </Link>
            )}
          </div>
        </div>
      )}
```

- [ ] **Step 5: app/compatibility/page.tsx — 프리필 import 추가**

`app/compatibility/page.tsx` 상단 import 블록에 추가:

```tsx
import { getPrefillA, clearPrefillA } from '@/lib/compatibility-prefill';
```

- [ ] **Step 6: app/compatibility/page.tsx — 마운트 시 프리필 적용**

기존 `useEffect` 블록:

```tsx
  useEffect(() => {
    setProfiles(loadProfiles());
  }, []);
```

다음으로 교체:

```tsx
  useEffect(() => {
    setProfiles(loadProfiles());
    const prefill = getPrefillA();
    if (prefill) {
      clearPrefillA();
      setNameA(prefill.name);
      setYearA(prefill.year);
      setMonthA(prefill.month);
      setDayA(prefill.day);
      setHourValueA(prefill.hour);
      setIsLunarA(prefill.isLunar);
      setGenderA(prefill.gender ?? 'M');
    }
  }, []);
```

- [ ] **Step 7: 타입체크 + 전체 테스트 통과 확인**

```bash
npx tsc --noEmit && npx jest
```

예상 결과: 타입 오류 없음, 모든 테스트 통과.

- [ ] **Step 8: 커밋**

```bash
git add app/page.tsx app/compatibility/page.tsx
git commit -m "feat: add profile accordion with quick-links and compatibility prefill"
```
