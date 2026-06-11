# Skeleton UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add loading skeleton UI to all result pages and the AI streaming state to eliminate blank-screen flashes.

**Architecture:** A single `SkeletonBox` primitive in `components/Skeleton.tsx` is composed into page-shaped skeletons. Three loading states are covered: (1) `dynamic()` loading prop in each page.tsx, (2) `if (!session) return null` in each Content component, (3) `isStreaming && !aiText` in AiContent.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS, `animate-pulse` for pulse animation

---

## File Map

| File | Action |
|------|--------|
| `components/Skeleton.tsx` | Create — `SkeletonBox` primitive |
| `components/AiContent.tsx` | Modify — replace streaming loader with skeleton lines |
| `app/saju/result/page.tsx` | Modify — replace loading text with SajuResultSkeleton |
| `app/saju/result/SajuResultContent.tsx` | Modify — replace `return null` with SajuResultSkeleton |
| `app/fortune/page.tsx` | Modify — replace loading text with FortuneSkeleton |
| `app/fortune/FortuneContent.tsx` | Modify — replace `return null` with FortuneSkeleton |
| `app/compatibility/result/page.tsx` | Modify — replace loading text with CompatibilityResultSkeleton |
| `app/compatibility/result/CompatibilityResultContent.tsx` | Modify — replace `return null` with CompatibilityResultSkeleton |

---

### Task 1: Create `components/Skeleton.tsx`

**Files:**
- Create: `components/Skeleton.tsx`

- [ ] **Step 1: Create the file**

```tsx
export function SkeletonBox({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-border rounded ${className ?? ''}`} />;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/Skeleton.tsx
git commit -m "feat: add SkeletonBox primitive"
```

---

### Task 2: Update `AiContent.tsx` — skeleton for streaming state

**Files:**
- Modify: `components/AiContent.tsx`

Currently the `isStreaming && !aiText` branch renders:
```tsx
<div className="flex items-center gap-2 text-sm text-muted">
  <span className="animate-pulse">●</span>
  <span>분석 중...</span>
</div>
```

- [ ] **Step 1: Add import and replace streaming branch**

Replace the top of `components/AiContent.tsx` (add import, update branch):

```tsx
'use client';

import { SkeletonBox } from './Skeleton';

interface AiContentProps {
  aiText: string;
  isStreaming: boolean;
  aiError: string;
  onRequest: () => void;
  requestLabel?: string;
}

export default function AiContent({
  aiText,
  isStreaming,
  aiError,
  onRequest,
  requestLabel = '분석 요청하기',
}: AiContentProps) {
  if (aiError && !aiText) {
    return (
      <div>
        <p className="text-sm text-hwa mb-2">{aiError}</p>
        <button onClick={onRequest} className="text-xs text-muted underline">
          다시 시도
        </button>
      </div>
    );
  }

  if (isStreaming && !aiText) {
    return (
      <div className="flex flex-col gap-2">
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-[85%]" />
        <SkeletonBox className="h-4 w-[60%]" />
      </div>
    );
  }

  if (aiText) {
    return (
      <>
        <div className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
          {aiText}
          {isStreaming && <span className="animate-pulse opacity-70">▌</span>}
        </div>
        {!isStreaming && (
          <button onClick={onRequest} className="mt-3 text-xs text-muted underline">
            다시 요청
          </button>
        )}
      </>
    );
  }

  return (
    <button
      onClick={onRequest}
      className="w-full py-3 rounded-xl bg-primary-gradient text-white text-sm font-medium"
    >
      {requestLabel}
    </button>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/AiContent.tsx
git commit -m "feat: replace AI streaming text loader with skeleton lines"
```

---

### Task 3: Saju result page skeleton

**Files:**
- Modify: `app/saju/result/page.tsx`
- Modify: `app/saju/result/SajuResultContent.tsx`

- [ ] **Step 1: Rewrite `app/saju/result/page.tsx`**

```tsx
'use client';
import dynamic from 'next/dynamic';
import { SkeletonBox } from '@/components/Skeleton';

function SajuResultSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-24" />
      </header>
      <div className="flex flex-col gap-6 px-4 py-6 flex-1">
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <SkeletonBox className="h-10 w-full" />
              <SkeletonBox className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-4/5" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-32 w-full" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-24 w-full" />
        </div>
      </div>
      <div className="flex gap-3 px-4 pb-8">
        <SkeletonBox className="flex-1 h-12 rounded-2xl" />
        <SkeletonBox className="flex-1 h-12 rounded-2xl" />
        <SkeletonBox className="h-12 w-12 rounded-2xl" />
        <SkeletonBox className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}

const SajuResultContent = dynamic(() => import('./SajuResultContent'), {
  ssr: false,
  loading: () => <SajuResultSkeleton />,
});

export default function SajuResultPage() {
  return <SajuResultContent />;
}
```

- [ ] **Step 2: Update `app/saju/result/SajuResultContent.tsx` — replace `return null` with skeleton**

Add import at the top:
```tsx
import { SkeletonBox } from '@/components/Skeleton';
```

Add skeleton function before the `export default` (copy exact same `SajuResultSkeleton` from page.tsx):
```tsx
function SajuResultSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-24" />
      </header>
      <div className="flex flex-col gap-6 px-4 py-6 flex-1">
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <SkeletonBox className="h-10 w-full" />
              <SkeletonBox className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-4/5" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-32 w-full" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-24 w-full" />
        </div>
      </div>
      <div className="flex gap-3 px-4 pb-8">
        <SkeletonBox className="flex-1 h-12 rounded-2xl" />
        <SkeletonBox className="flex-1 h-12 rounded-2xl" />
        <SkeletonBox className="h-12 w-12 rounded-2xl" />
        <SkeletonBox className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}
```

Replace:
```tsx
if (!session) return null;
```
With:
```tsx
if (!session) return <SajuResultSkeleton />;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/saju/result/page.tsx app/saju/result/SajuResultContent.tsx
git commit -m "feat: add skeleton UI to saju result page"
```

---

### Task 4: Fortune page skeleton

**Files:**
- Modify: `app/fortune/page.tsx`
- Modify: `app/fortune/FortuneContent.tsx`

- [ ] **Step 1: Rewrite `app/fortune/page.tsx`**

```tsx
'use client';
import dynamic from 'next/dynamic';
import { SkeletonBox } from '@/components/Skeleton';

function FortuneSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-28" />
      </header>
      <div className="flex border-b border-border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 py-3 flex justify-center">
            <SkeletonBox className="h-4 w-8" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-32" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-3/4" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-10 w-full rounded-xl" />
        </div>
      </div>
      <div className="flex gap-3 px-4 pb-8">
        <SkeletonBox className="flex-1 h-12 rounded-2xl" />
        <SkeletonBox className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}

const FortuneContent = dynamic(() => import('./FortuneContent'), {
  ssr: false,
  loading: () => <FortuneSkeleton />,
});

export default function FortunePage() {
  return <FortuneContent />;
}
```

- [ ] **Step 2: Update `app/fortune/FortuneContent.tsx` — replace `return null` with skeleton**

Add import at the top:
```tsx
import { SkeletonBox } from '@/components/Skeleton';
```

Add skeleton function before `export default`:
```tsx
function FortuneSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-28" />
      </header>
      <div className="flex border-b border-border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 py-3 flex justify-center">
            <SkeletonBox className="h-4 w-8" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-32" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-3/4" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-10 w-full rounded-xl" />
        </div>
      </div>
      <div className="flex gap-3 px-4 pb-8">
        <SkeletonBox className="flex-1 h-12 rounded-2xl" />
        <SkeletonBox className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}
```

Replace:
```tsx
if (!session) return null;
```
With:
```tsx
if (!session) return <FortuneSkeleton />;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/fortune/page.tsx app/fortune/FortuneContent.tsx
git commit -m "feat: add skeleton UI to fortune page"
```

---

### Task 5: Compatibility result page skeleton

**Files:**
- Modify: `app/compatibility/result/page.tsx`
- Modify: `app/compatibility/result/CompatibilityResultContent.tsx`

- [ ] **Step 1: Rewrite `app/compatibility/result/page.tsx`**

```tsx
'use client';
import dynamic from 'next/dynamic';
import { SkeletonBox } from '@/components/Skeleton';

function CompatibilityResultSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-20" />
      </header>
      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <div className="bg-card rounded-2xl p-5 flex flex-col items-center gap-3">
          <SkeletonBox className="h-4 w-28" />
          <SkeletonBox className="h-16 w-24" />
          <SkeletonBox className="h-4 w-20" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-3">
          <SkeletonBox className="h-3 w-20" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <SkeletonBox className="flex-1 h-3" />
              <SkeletonBox className="h-3 w-4 shrink-0" />
              <SkeletonBox className="flex-1 h-3" />
            </div>
          ))}
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-4/5" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-10 w-full rounded-xl" />
        </div>
      </div>
      <div className="flex gap-3 px-4 pb-8">
        <SkeletonBox className="flex-1 h-12 rounded-2xl" />
        <SkeletonBox className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}

const CompatibilityResultContent = dynamic(() => import('./CompatibilityResultContent'), {
  ssr: false,
  loading: () => <CompatibilityResultSkeleton />,
});

export default function CompatibilityResultPage() {
  return <CompatibilityResultContent />;
}
```

- [ ] **Step 2: Update `app/compatibility/result/CompatibilityResultContent.tsx` — replace `return null` with skeleton**

Add import at the top:
```tsx
import { SkeletonBox } from '@/components/Skeleton';
```

Add skeleton function before `export default`:
```tsx
function CompatibilityResultSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-20" />
      </header>
      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <div className="bg-card rounded-2xl p-5 flex flex-col items-center gap-3">
          <SkeletonBox className="h-4 w-28" />
          <SkeletonBox className="h-16 w-24" />
          <SkeletonBox className="h-4 w-20" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-3">
          <SkeletonBox className="h-3 w-20" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <SkeletonBox className="flex-1 h-3" />
              <SkeletonBox className="h-3 w-4 shrink-0" />
              <SkeletonBox className="flex-1 h-3" />
            </div>
          ))}
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-4/5" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-10 w-full rounded-xl" />
        </div>
      </div>
      <div className="flex gap-3 px-4 pb-8">
        <SkeletonBox className="flex-1 h-12 rounded-2xl" />
        <SkeletonBox className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}
```

Replace:
```tsx
if (!session) return null;
```
With:
```tsx
if (!session) return <CompatibilityResultSkeleton />;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/compatibility/result/page.tsx app/compatibility/result/CompatibilityResultContent.tsx
git commit -m "feat: add skeleton UI to compatibility result page"
```
