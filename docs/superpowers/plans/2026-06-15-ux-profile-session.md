# UX: 세션 없을 때 프로필 선택 화면 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 세션이 없을 때 표시되는 `SessionExpiredPage`에 저장된 프로필 목록을 추가해, 클릭 한 번으로 세션을 설정하고 해당 페이지를 바로 볼 수 있게 한다.

**Architecture:** `SessionExpiredPage` 컴포넌트 내부에서 `loadProfiles()`를 호출해 프로필 유무에 따라 UI를 분기한다. 프로필 클릭 시 `calculateSaju` + `saveSession` + `router.replace(pathname)`으로 현재 페이지를 재렌더한다. 호출 측 코드는 변경하지 않는다.

**Tech Stack:** Next.js App Router, React, TypeScript

---

## 변경 파일 목록

| 작업 | 파일 |
|---|---|
| Modify | `components/SessionExpiredPage.tsx` |

> **Note:** 이 프로젝트는 순수 함수 단위 테스트만 갖추고 있으며(`jest.config.ts` → `testEnvironment: 'node'`, `@testing-library/react` 미설치), React 컴포넌트 테스트 인프라가 없다. 이 변경의 새 로직(`handleProfileSelect`)은 기존에 단독 테스트된 `calculateSaju`, `saveSession`의 단순 조합이므로 별도 단위 테스트를 추가하지 않는다. 대신 Task 2에서 실제 앱을 실행해 수동 검증한다.

---

## Task 1: `SessionExpiredPage` 업데이트

**Files:**
- Modify: `components/SessionExpiredPage.tsx`

- [ ] **Step 1: 기존 파일 내용 확인**

현재 파일:

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
      <span className="text-4xl" aria-hidden="true">
        🔮
      </span>
      <h1 className="text-base font-semibold text-primary">세션이 만료됐어요</h1>
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

- [ ] **Step 2: 파일 전체를 아래 내용으로 교체**

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { loadProfiles } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
import { calculateSaju } from '@/lib/saju-calculator';
import { saveSession } from '@/lib/session';

interface SessionExpiredPageProps {
  redirectPath: string;
  redirectLabel?: string;
}

export default function SessionExpiredPage({
  redirectPath,
  redirectLabel = '다시 입력하기',
}: SessionExpiredPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    setProfiles(loadProfiles());
  }, []);

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
          gender: profile.gender ?? 'M',
        },
        result,
      });
      router.replace(pathname);
    } catch {
      router.push(redirectPath);
    }
  }

  if (profiles.length > 0) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-4">
        <span className="text-4xl" aria-hidden="true">
          🔮
        </span>
        <div className="text-center">
          <h1 className="text-base font-semibold text-primary mb-1">누구의 운세를 볼까요?</h1>
          <p className="text-sm text-muted">프로필을 선택하면 바로 볼 수 있어요</p>
        </div>
        <div className="w-full max-w-sm flex flex-col gap-2">
          {profiles.map((profile, i) => (
            <button
              key={profile.id}
              onClick={() => handleProfileSelect(profile)}
              className={`w-full rounded-2xl px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                i === 0
                  ? 'bg-primary-gradient text-white'
                  : 'bg-card hover:bg-card-hover'
              }`}
            >
              <span className="text-lg" aria-hidden="true">
                🔮
              </span>
              <div className="flex-1">
                <p
                  className={`text-sm font-semibold ${
                    i === 0 ? 'text-white' : 'text-primary'
                  }`}
                >
                  {profile.name || '이름 없음'}
                </p>
                <p className={`text-xs ${i === 0 ? 'text-white/70' : 'text-muted'}`}>
                  {profile.ilgan} 일간
                </p>
              </div>
              <span
                className={`text-sm ${i === 0 ? 'text-white/60' : 'text-muted'}`}
                aria-hidden="true"
              >
                →
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full max-w-sm">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <Link
          href={redirectPath}
          className="text-sm text-primary/70 hover:text-primary transition-colors"
        >
          {redirectLabel}
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-4">
      <span className="text-4xl" aria-hidden="true">
        🔮
      </span>
      <h1 className="text-base font-semibold text-primary">세션이 만료됐어요</h1>
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

- [ ] **Step 3: 타입 체크 실행**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: ESLint 실행**

```bash
npx eslint components/SessionExpiredPage.tsx
```

Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add components/SessionExpiredPage.tsx
git commit -m "feat: show profile selection on session expiry"
```

---

## Task 2: 수동 검증

- [ ] **Step 1: 개발 서버 실행**

```bash
npm run dev
```

- [ ] **Step 2: 프로필 2개 이상인 상태에서 검증**

홈 → 프로필 2개 이상 저장되어 있는지 확인 (없으면 사주 페이지에서 2개 추가)

- [ ] **Step 3: 케이스 1 — 홈 카드 → 프로필 선택 → 운세 표시**

1. 홈에서 "오늘 운세" 카드 클릭
2. `/fortune` 이동 후 프로필 목록이 표시되는지 확인
3. 프로필 클릭 → 해당 프로필의 운세가 바로 표시되는지 확인

- [ ] **Step 4: 케이스 2 — BottomNav 탭 → 프로필 선택 → 운세 표시**

1. sessionStorage 비우기 (브라우저 DevTools → Application → sessionStorage → Clear)
2. BottomNav에서 "운세" 탭 클릭
3. 프로필 목록 표시 → 클릭 → 운세 표시 확인

- [ ] **Step 5: 케이스 3 — 프로필 없을 때 기존 UI 유지**

1. localStorage에서 `saju-profiles` 항목 삭제
2. sessionStorage 비우기
3. BottomNav "운세" 탭 클릭
4. 기존 "세션이 만료됐어요" 화면이 표시되는지 확인

- [ ] **Step 6: 케이스 4 — 프로필 1개일 때 홈 카드 자동 세션 설정 (기존 동작 유지)**

1. 프로필 1개만 남기기
2. 홈에서 "오늘 운세" 카드 클릭
3. 프로필 선택 화면 없이 바로 운세가 표시되는지 확인 (기존 동작)

- [ ] **Step 7: PR 생성**

```bash
git checkout -b feat/profile-selection-on-session-expiry
git push -u origin feat/profile-selection-on-session-expiry
gh pr create \
  --title "feat: show profile selection when session is missing" \
  --body "$(cat <<'EOF'
## Summary
- `SessionExpiredPage`에 프로필 목록 추가 — 세션 없을 때 클릭 한 번으로 세션 설정 및 현재 페이지 재렌더
- 프로필 없을 때는 기존 UI 유지
- 호출 측(FortuneContent, YearlyFortuneContent, SajuResultContent) 변경 없음

## Test plan
- [ ] 프로필 2개↑: 홈 카드 → 프로필 선택 → 운세 표시
- [ ] 프로필 2개↑: BottomNav 탭 → 프로필 선택 → 운세 표시
- [ ] 프로필 없음: 기존 세션 만료 화면 표시
- [ ] 프로필 1개: 홈 카드 → 자동 이동 (기존 동작 유지)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
