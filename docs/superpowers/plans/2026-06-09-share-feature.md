# 공유 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사주/궁합/운세 결과를 전용 공유 카드 이미지로 캡처해 Web Share API 또는 다운로드로 공유하는 기능 구현

**Architecture:** `ShareCard` 컴포넌트가 뷰포트 밖에 숨겨진 채 렌더링되고, `ShareButton`이 해당 DOM을 html2canvas로 캡처해 Web Share API(미지원 시 파일 다운로드)로 공유한다. 각 결과 페이지에서 `useRef`를 생성해 두 컴포넌트를 연결한다.

**Tech Stack:** `html2canvas` (동적 import), Web Share API, React.forwardRef, inline styles (CSS 변수 미사용 — html2canvas 호환)

---

### Task 1: html2canvas 패키지 설치

**Files:**
- Modify: `package.json` (자동)

- [ ] **Step 1: 패키지 설치**

```bash
cd /Users/peter/saju-app && npm install html2canvas
```

Expected output: `added 1 package` 또는 `updated`가 포함된 npm 완료 메시지

- [ ] **Step 2: 타입 확인**

```bash
cd /Users/peter/saju-app && node -e "require('html2canvas'); console.log('ok')"
```

Expected output: `ok`

---

### Task 2: ShareCard 컴포넌트 생성

**Files:**
- Create: `components/ShareCard.tsx`

- [ ] **Step 1: 파일 생성**

`components/ShareCard.tsx` 를 아래 내용으로 생성:

```tsx
'use client';
import React from 'react';
import type { Ohaeng } from '@/lib/saju-data';

type SajuCardProps = {
  type: 'saju';
  name: string;
  ilgan: string;
  pillars: { year: string; month: string; day: string; hour?: string };
  ohaeng: Record<Ohaeng, number>;
};

type CompatibilityCardProps = {
  type: 'compatibility';
  nameA: string;
  nameB: string;
  score: number;
  grade: string;
  gradeLabel: string;
  summary: string;
};

type FortuneCardProps = {
  type: 'fortune';
  name: string;
  ilgan: string;
  period: string;
  summary: string;
  date: string;
};

export type ShareCardProps = SajuCardProps | CompatibilityCardProps | FortuneCardProps;

const CARD: React.CSSProperties = {
  width: 320,
  height: 400,
  background: 'linear-gradient(135deg, #2a2a3e, #1e1e2e)',
  border: '1px solid #3a3a52',
  borderRadius: 16,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  fontFamily: 'sans-serif',
  color: '#e8e8f0',
  boxSizing: 'border-box',
};

const OHAENG_COLORS: Record<Ohaeng, string> = {
  목: '#4ade80', 화: '#f87171', 토: '#facc15', 금: '#e2e8f0', 수: '#60a5fa',
};
const OHAENG_ORDER: Ohaeng[] = ['목', '화', '토', '금', '수'];
const OHAENG_LABEL: Record<Ohaeng, string> = { 목:'木', 화:'火', 토:'土', 금:'金', 수:'水' };

function Badge() {
  return (
    <div style={{
      background: 'linear-gradient(to right, #667eea, #764ba2)',
      color: 'white',
      padding: '4px 14px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
    }}>
      사주팔자
    </div>
  );
}

function SajuInner({ name, ilgan, pillars, ohaeng }: SajuCardProps) {
  const cols = [
    { label: '年', value: pillars.year, highlight: false },
    { label: '月', value: pillars.month, highlight: false },
    { label: '日', value: pillars.day, highlight: true },
    { label: '時', value: pillars.hour ?? '?', highlight: false },
  ];
  const max = Math.max(...OHAENG_ORDER.map(k => ohaeng[k] ?? 0), 1);
  return (
    <>
      <div style={{ fontSize: 28, marginBottom: 8 }}>🔮</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
        {name ? `${name}의 사주` : '사주 결과'}
      </div>
      <div style={{ fontSize: 11, color: '#9090a8', marginBottom: 16 }}>{ilgan} 일간</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {cols.map(c => (
          <div key={c.label} style={{
            background: c.highlight ? 'rgba(102,126,234,0.15)' : '#32324a',
            border: c.highlight ? '1px solid #667eea' : '1px solid transparent',
            borderRadius: 10,
            padding: '8px 10px',
            textAlign: 'center',
            minWidth: 52,
          }}>
            <div style={{ fontSize: 9, color: '#9090a8', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 14 }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ width: '100%', marginBottom: 20 }}>
        {OHAENG_ORDER.map(k => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: '#9090a8', width: 14 }}>{OHAENG_LABEL[k]}</div>
            <div style={{ flex: 1, background: '#32324a', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${((ohaeng[k] ?? 0) / max) * 100}%`,
                background: OHAENG_COLORS[k],
                borderRadius: 4,
              }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'auto' }}><Badge /></div>
    </>
  );
}

function CompatibilityInner({ nameA, nameB, score, grade, gradeLabel, summary }: CompatibilityCardProps) {
  const stars = grade === '최상' ? '★★★★★' : grade === '상' ? '★★★★☆' : grade === '중' ? '★★★☆☆' : '★★☆☆☆';
  return (
    <>
      <div style={{ fontSize: 28, marginBottom: 8 }}>💑</div>
      <div style={{ fontSize: 13, color: '#9090a8', marginBottom: 8 }}>{nameA} ♡ {nameB}</div>
      <div style={{
        fontSize: 56,
        fontWeight: 800,
        background: 'linear-gradient(to right, #667eea, #764ba2)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: 1,
        marginBottom: 8,
      }}>
        {score}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{stars}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#c8c8e0', marginBottom: 16 }}>
        {grade} · {gradeLabel}
      </div>
      <div style={{
        background: '#32324a',
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 11,
        lineHeight: 1.7,
        color: '#c8c8e0',
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box',
        marginBottom: 16,
      }}>
        {summary.length > 80 ? summary.slice(0, 80) + '…' : summary}
      </div>
      <div style={{ marginTop: 'auto' }}><Badge /></div>
    </>
  );
}

function FortuneInner({ name, ilgan, period, summary, date }: FortuneCardProps) {
  return (
    <>
      <div style={{ fontSize: 28, marginBottom: 8 }}>💫</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
        {name ? `${name}의 ${period} 운세` : `${period} 운세`}
      </div>
      <div style={{ fontSize: 11, color: '#9090a8', marginBottom: 4 }}>{ilgan} 일간</div>
      <div style={{ fontSize: 10, color: '#9090a8', marginBottom: 20 }}>{date}</div>
      <div style={{
        background: '#32324a',
        borderRadius: 10,
        padding: 16,
        fontSize: 12,
        lineHeight: 1.8,
        color: '#c8c8e0',
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {summary.length > 120 ? summary.slice(0, 120) + '…' : summary}
      </div>
      <div style={{ marginTop: 16 }}><Badge /></div>
    </>
  );
}

const ShareCard = React.forwardRef<HTMLDivElement, ShareCardProps>((props, ref) => (
  <div aria-hidden="true" style={{ position: 'fixed', left: -9999, top: 0 }}>
    <div ref={ref} style={CARD}>
      {props.type === 'saju'          && <SajuInner          {...props} />}
      {props.type === 'compatibility' && <CompatibilityInner {...props} />}
      {props.type === 'fortune'       && <FortuneInner       {...props} />}
    </div>
  </div>
));
ShareCard.displayName = 'ShareCard';

export default ShareCard;
```

- [ ] **Step 2: 타입 오류 확인**

```bash
cd /Users/peter/saju-app && npx tsc --noEmit 2>&1 | head -20
```

Expected: 오류 없음 또는 ShareCard 관련 오류 없음

---

### Task 3: ShareButton 컴포넌트 생성

**Files:**
- Create: `components/ShareButton.tsx`

- [ ] **Step 1: 파일 생성**

`components/ShareButton.tsx` 를 아래 내용으로 생성:

```tsx
'use client';
import { useState } from 'react';

interface ShareButtonProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  filename: string;
  shareTitle: string;
}

export default function ShareButton({ cardRef, filename, shareTitle }: ShareButtonProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  async function handleShare() {
    if (!cardRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: window.devicePixelRatio || 2,
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('캡처 실패'))), 'image/png');
      });
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: shareTitle });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('공유 실패:', err);
    } finally {
      setIsCapturing(false);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={isCapturing}
      className="bg-card text-muted py-3 px-4 rounded-2xl hover:bg-card-hover transition-colors disabled:opacity-50"
      aria-label="결과 공유하기"
    >
      {isCapturing ? '⏳' : '⬆'}
    </button>
  );
}
```

- [ ] **Step 2: 타입 오류 확인**

```bash
cd /Users/peter/saju-app && npx tsc --noEmit 2>&1 | head -20
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
cd /Users/peter/saju-app && git add components/ShareCard.tsx components/ShareButton.tsx package.json package-lock.json && git commit -m "feat: add ShareCard and ShareButton components for result sharing"
```

---

### Task 4: /saju/result 페이지에 공유 기능 연결

**Files:**
- Modify: `app/saju/result/page.tsx`

- [ ] **Step 1: import 추가 및 cardRef 선언**

`app/saju/result/page.tsx` 상단 import 블록에 추가:

```tsx
import ShareCard from '@/components/ShareCard';
import ShareButton from '@/components/ShareButton';
```

기존 import 라인:
```tsx
import { useEffect, useState } from 'react';
```
를 아래로 변경:
```tsx
import { useEffect, useRef, useState } from 'react';
```

컴포넌트 함수 내부, **`if (!session) return null;` 바로 앞에** `cardRef`를 선언한다. (useRef는 훅이므로 조건부 return 앞에 위치해야 함)

```tsx
const cardRef = useRef<HTMLDivElement>(null);

if (!session) return null;
```

- [ ] **Step 2: ShareCard 추가 (숨김 렌더링)**

`return (` 바로 다음, `<div className="flex flex-col min-h-screen">` 안의 첫 줄에 추가:

```tsx
<ShareCard
  ref={cardRef}
  type="saju"
  name={input.name}
  ilgan={result.ilgan}
  pillars={{
    year:  result.year.gan  + result.year.ji,
    month: result.month.gan + result.month.ji,
    day:   result.day.gan   + result.day.ji,
    hour:  result.hour ? result.hour.gan + result.hour.ji : undefined,
  }}
  ohaeng={result.ohaeng}
/>
```

- [ ] **Step 3: 하단 버튼 행에 ShareButton 추가**

기존 하단 버튼 div:
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
</div>
```
를 아래로 교체:
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

- [ ] **Step 4: 타입 및 빌드 확인**

```bash
cd /Users/peter/saju-app && npx tsc --noEmit 2>&1 | head -20
```

Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
cd /Users/peter/saju-app && git add app/saju/result/page.tsx && git commit -m "feat: add share button to saju result page"
```

---

### Task 5: /compatibility/result 페이지에 공유 기능 연결

**Files:**
- Modify: `app/compatibility/result/page.tsx`

- [ ] **Step 1: import 추가 및 cardRef 선언**

상단 import 블록에 추가 (`useRef`는 이미 있음):
```tsx
import ShareCard from '@/components/ShareCard';
import ShareButton from '@/components/ShareButton';
```

컴포넌트 함수 내부, **`if (!session) return null;` 바로 앞에** 추가:
```tsx
const cardRef = useRef<HTMLDivElement>(null);

if (!session) return null;
```

- [ ] **Step 2: ShareCard 추가 (숨김 렌더링)**

`return (` 바로 다음, 최상위 `<div className="flex flex-col min-h-screen">` 안의 첫 줄에 추가:

```tsx
<ShareCard
  ref={cardRef}
  type="compatibility"
  nameA={nameA}
  nameB={nameB}
  score={score}
  grade={grade}
  gradeLabel={gradeLabel}
  summary={summary}
/>
```

- [ ] **Step 3: 하단 버튼에 ShareButton 추가**

기존 하단 버튼 div:
```tsx
<div className="px-4 pb-8">
  <button
    onClick={() => router.push('/compatibility')}
    className="w-full py-3 rounded-2xl bg-card text-muted text-sm font-medium hover:bg-card-hover transition-colors"
  >
    다시 분석하기
  </button>
</div>
```
를 아래로 교체:
```tsx
<div className="flex gap-3 px-4 pb-8">
  <button
    onClick={() => router.push('/compatibility')}
    className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium hover:bg-card-hover transition-colors"
  >
    다시 분석하기
  </button>
  <ShareButton
    cardRef={cardRef}
    filename="compatibility-result.png"
    shareTitle="궁합 결과"
  />
</div>
```

- [ ] **Step 4: 타입 확인**

```bash
cd /Users/peter/saju-app && npx tsc --noEmit 2>&1 | head -20
```

Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
cd /Users/peter/saju-app && git add app/compatibility/result/page.tsx && git commit -m "feat: add share button to compatibility result page"
```

---

### Task 6: /fortune 페이지에 공유 기능 연결

**Files:**
- Modify: `app/fortune/page.tsx`

- [ ] **Step 1: import 추가 및 cardRef 선언**

기존 import (`useRef` 이미 있음):
```tsx
import { useEffect, useRef, useState } from 'react';
```

아래 두 줄 추가:
```tsx
import ShareCard from '@/components/ShareCard';
import ShareButton from '@/components/ShareButton';
```

컴포넌트 함수 내부, **`if (!session) return null;` 바로 앞에** 추가:
```tsx
const cardRef = useRef<HTMLDivElement>(null);

if (!session) return null;
```

`if (!session) return null;` **바로 아래**에 추가:
```tsx
const today = new Date();
const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
```

- [ ] **Step 2: ShareCard 추가 (숨김 렌더링)**

`return (` 바로 다음, 최상위 `<div className="flex flex-col min-h-screen">` 안의 첫 줄에 추가:

```tsx
<ShareCard
  ref={cardRef}
  type="fortune"
  name={session.input.name}
  ilgan={ilgan}
  period={activeTab}
  summary={currentPeriod.summary}
  date={dateStr}
/>
```

- [ ] **Step 3: 하단 궁합 버튼에 ShareButton 추가**

기존 하단 버튼 div:
```tsx
<div className="px-4 pb-8">
  <button
    onClick={() => router.push('/compatibility')}
    className="w-full py-3 rounded-2xl bg-card text-muted text-sm font-medium hover:bg-card-hover transition-colors"
  >
    💑 궁합 보러 가기
  </button>
</div>
```
를 아래로 교체:
```tsx
<div className="flex gap-3 px-4 pb-8">
  <button
    onClick={() => router.push('/compatibility')}
    className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium hover:bg-card-hover transition-colors"
  >
    💑 궁합 보러 가기
  </button>
  <ShareButton
    cardRef={cardRef}
    filename="fortune.png"
    shareTitle={`${activeTab} 운세`}
  />
</div>
```

- [ ] **Step 4: 타입 확인**

```bash
cd /Users/peter/saju-app && npx tsc --noEmit 2>&1 | head -20
```

Expected: 오류 없음

- [ ] **Step 5: 커밋**

```bash
cd /Users/peter/saju-app && git add app/fortune/page.tsx && git commit -m "feat: add share button to fortune page"
```

---

### Task 7: .gitignore에 .superpowers 추가

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: .gitignore 확인 및 추가**

```bash
cd /Users/peter/saju-app && grep -q '.superpowers' .gitignore || echo '.superpowers/' >> .gitignore
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/peter/saju-app && git add .gitignore && git commit -m "chore: ignore .superpowers brainstorm artifacts"
```
