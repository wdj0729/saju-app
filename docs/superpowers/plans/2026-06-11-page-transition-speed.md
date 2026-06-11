# Page Transition Speed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 페이지 전환 속도를 개선한다 — sessionStorage 동기 읽기로 불필요한 렌더 사이클을 제거하고, BackButton에 prefetch 기능을 추가한다.

**Architecture:** `useSessionOrRedirect` hook이 session을 `useEffect`에서 로딩하기 때문에 컴포넌트 마운트 후 추가 렌더 사이클이 발생한다. 이를 `useState` 초기값에서 동기로 로딩하도록 변경한다. sessionStorage는 동기 API이고, 이 hook을 사용하는 세 컴포넌트(`SajuResultContent`, `FortuneContent`, `CompatibilityResultContent`)가 모두 `dynamic(..., { ssr: false })` 안에서만 사용되므로 하이드레이션 불일치 위험이 없다. BackButton은 `router.push` 대신 `<Link>`를 사용해 prefetch를 활성화한다.

**Tech Stack:** Next.js 16.2.7, React 19, TypeScript

---

### Task 1: `useSessionOrRedirect` — session 동기 초기화

**Files:**
- Modify: `hooks/useSessionOrRedirect.ts`

**변경 전 동작:**
1. 컴포넌트 마운트 → `session = null` → 스켈레톤 표시
2. `useEffect` 실행 (paint 이후) → sessionStorage 읽기 → `setSession(s)` → 리렌더
3. 실제 콘텐츠 표시

**변경 후 동작:**
1. 컴포넌트 마운트 → `session = loader()` (동기) → 바로 콘텐츠 표시

- [ ] **Step 1: `hooks/useSessionOrRedirect.ts` 수정**

```ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useSessionOrRedirect<T>(
  loader: () => T | null,
  redirectPath: string,
  onLoaded?: (session: T) => void
): T | null {
  const router = useRouter();
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  const [session] = useState<T | null>(() => loader());

  useEffect(() => {
    if (!session) {
      router.replace(redirectPath);
      return;
    }
    onLoadedRef.current?.(session);
  }, [session, router, redirectPath]);

  return session;
}
```

핵심 변경:
- `useState<T | null>(null)` → `useState<T | null>(() => loader())`: session을 동기로 초기화
- `setSession` state setter 제거 (session은 이제 불변)
- `loaderRef` 제거 (loader는 초기화에만 사용됨)
- `useEffect` 는 redirect와 `onLoaded` 콜백만 담당

- [ ] **Step 2: 기존 테스트 실행하여 회귀 없음 확인**

```bash
npm test -- --passWithNoTests
```

Expected: all tests pass

- [ ] **Step 3: commit**

```bash
git add hooks/useSessionOrRedirect.ts
git commit -m "perf: load session synchronously in useState to eliminate extra render cycle"
```

---

### Task 2: `BackButton` — `<Link>`으로 prefetch 활성화

**Files:**
- Modify: `components/BackButton.tsx`

`router.push`는 클릭 시점에 페이지 로드를 시작한다. `<Link>` 컴포넌트는 뷰포트에 들어오는 순간 자동으로 prefetch를 시작한다. BackButton은 항상 화면에 표시되므로 페이지 진입 시 prefetch가 즉시 시작된다.

- [ ] **Step 1: `components/BackButton.tsx` 수정**

```tsx
'use client';

import Link from 'next/link';

interface BackButtonProps {
  href: string;
  label: string;
}

export default function BackButton({ href, label }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="text-muted text-sm hover:text-primary transition-colors"
    >
      ← {label}
    </Link>
  );
}
```

- [ ] **Step 2: 기존 테스트 실행하여 회귀 없음 확인**

```bash
npm test -- --passWithNoTests
```

Expected: all tests pass

- [ ] **Step 3: commit**

```bash
git add components/BackButton.tsx
git commit -m "perf: replace router.push with Link in BackButton for automatic prefetch"
```

---

### Task 3: 동작 확인

- [ ] **Step 1: dev 서버 실행 후 직접 확인**

```bash
npm run dev
```

확인 항목:
- `/saju` 폼 작성 → 분석하기 클릭 → `/saju/result` 전환 시 스켈레톤 flash 없이 즉시 콘텐츠 표시
- 뒤로가기 버튼 클릭 → 이전 페이지 즉시 표시
- `/fortune`, `/compatibility/result` 동일하게 확인

- [ ] **Step 2: PR 생성**

```bash
git push origin HEAD
gh pr create --title "perf: eliminate extra render cycle on page transition" \
  --body "$(cat <<'EOF'
## Summary
- `useSessionOrRedirect`: `useState` 초기값에서 sessionStorage를 동기로 읽어 마운트 후 추가 렌더 사이클 제거
- `BackButton`: `router.push` → `<Link>` 교체로 자동 prefetch 활성화

## Root cause
result 페이지들이 `dynamic(..., { ssr: false })` 안에서 렌더됨에도, `useSessionOrRedirect`가 `useEffect`에서 sessionStorage를 읽어 컴포넌트 마운트 후 리렌더가 1회 더 발생하고 있었음.

## Test plan
- [ ] `/saju` → 사주 분석 → result 페이지에서 스켈레톤 flash 없이 즉시 콘텐츠 확인
- [ ] 각 result 페이지의 BackButton 클릭 시 즉각 전환 확인
- [ ] fortune, compatibility result도 동일 확인
🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
