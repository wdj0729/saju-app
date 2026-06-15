# SEO & 메타데이터 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 페이지에 title/description/OG 메타데이터를 추가하고, 동적 OG 이미지와 sitemap/robots를 구축해 검색·소셜 공유 최적화를 완성한다.

**Architecture:** `'use client'`인 5개 page.tsx를 서버 컴포넌트 래퍼로 전환해 `metadata` export가 가능하게 하고, 기존 클라이언트 로직은 별도 `*Loader.tsx`로 분리한다. `opengraph-image.tsx` 파일을 각 라우트에 배치해 Next.js가 자동으로 `og:image`를 생성하게 한다.

**Tech Stack:** Next.js 15 App Router, `next/og` (ImageResponse), TypeScript, Noto Sans KR (woff2 폰트, `/public/fonts/`)

---

## File Map

| 역할 | 파일 | 작업 |
|------|------|------|
| 전역 메타데이터 | `app/layout.tsx` | 수정 |
| 사주 입력 서버 래퍼 | `app/saju/page.tsx` | 재작성 |
| 사주 입력 클라이언트 | `app/saju/SajuLoader.tsx` | **신규** |
| 운세 서버 래퍼 | `app/fortune/page.tsx` | 재작성 |
| 운세 클라이언트 | `app/fortune/FortuneLoader.tsx` | **신규** |
| 신년운세 서버 | `app/fortune/yearly/page.tsx` | metadata 추가 |
| 궁합 서버 래퍼 | `app/compatibility/page.tsx` | 재작성 |
| 궁합 클라이언트 | `app/compatibility/CompatibilityLoader.tsx` | **신규** |
| 사주결과 서버 래퍼 | `app/saju/result/page.tsx` | 재작성 |
| 사주결과 클라이언트 | `app/saju/result/SajuResultLoader.tsx` | **신규** |
| 궁합결과 서버 래퍼 | `app/compatibility/result/page.tsx` | 재작성 |
| 궁합결과 클라이언트 | `app/compatibility/result/CompatibilityResultLoader.tsx` | **신규** |
| 루트 OG 이미지 | `app/opengraph-image.tsx` | **신규** |
| 사주 OG 이미지 | `app/saju/opengraph-image.tsx` | **신규** |
| 운세 OG 이미지 | `app/fortune/opengraph-image.tsx` | **신규** |
| 신년운세 OG 이미지 | `app/fortune/yearly/opengraph-image.tsx` | **신규** |
| 궁합 OG 이미지 | `app/compatibility/opengraph-image.tsx` | **신규** |
| 사이트맵 | `app/sitemap.ts` | **신규** |
| 크롤링 규칙 | `app/robots.ts` | **신규** |
| 한국어 폰트 | `public/fonts/NotoSansKR-Bold.woff2` | **신규** |

---

## Task 1: 환경변수 추가 + layout.tsx 전역 메타데이터

**Files:**
- Modify: `app/layout.tsx`
- Modify: `.env.local`

- [ ] **Step 1: `.env.local`에 사이트 URL 추가**

`.env.local` 파일에 아래 줄을 추가한다. 실제 Vercel 도메인으로 교체한다.

```bash
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

- [ ] **Step 2: `app/layout.tsx` 전역 메타데이터 교체**

`app/layout.tsx`를 아래 내용으로 교체한다:

```tsx
import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import BottomNav from '@/components/BottomNav';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const defaultDescription =
  '생년월일시 입력만으로 AI가 분석하는 사주팔자. 오늘 운세·신년운세·궁합까지.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '사주팔자',
    template: '%s — 사주팔자',
  },
  description: defaultDescription,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '사주팔자',
  },
  icons: {
    apple: '/icon-192.png',
  },
  openGraph: {
    type: 'website',
    siteName: '사주팔자',
    locale: 'ko_KR',
    title: {
      default: '사주팔자',
      template: '%s — 사주팔자',
    },
    description: defaultDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: '사주팔자',
      template: '%s — 사주팔자',
    },
    description: defaultDescription,
  },
};

export const viewport: Viewport = {
  themeColor: '#1e1e2e',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="bg-base min-h-screen text-primary">
        <ServiceWorkerRegistrar />
        <div className="max-w-md mx-auto min-h-screen flex flex-col pb-20">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git checkout -b feat/seo-metadata
git add app/layout.tsx .env.local
git commit -m "feat: add global metadata and metadataBase to layout"
```

---

## Task 2: saju/page.tsx 서버 컴포넌트 전환

**Files:**
- Create: `app/saju/SajuLoader.tsx`
- Modify: `app/saju/page.tsx`

- [ ] **Step 1: `app/saju/SajuLoader.tsx` 생성**

기존 `app/saju/page.tsx`의 전체 클라이언트 로직을 새 파일로 이동한다:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateSaju } from '@/lib/saju-calculator';
import { saveSession } from '@/lib/session';
import { loadProfiles } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
import BackButton from '@/components/BackButton';
import PersonInputFields from '@/components/PersonInputFields';

export default function SajuLoader() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [name, setName] = useState('');
  const [isLunar, setIsLunar] = useState(false);
  const [year, setYear] = useState(() => new Date().getFullYear() - 30);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [hourValue, setHourValue] = useState<number | null>(null);
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [error, setError] = useState('');

  useEffect(() => {
    setProfiles(loadProfiles());
  }, []);

  function loadFromProfile(profile: Profile) {
    setName(profile.name);
    setYear(profile.year);
    setMonth(profile.month);
    setDay(profile.day);
    setHourValue(profile.hour);
    setIsLunar(profile.isLunar);
    setGender(profile.gender);
  }

  const maxDay = isLunar ? 30 : new Date(year, month, 0).getDate();
  const clampedDay = Math.min(day, maxDay);

  function handleSubmit() {
    setError('');
    try {
      const result = calculateSaju({ year, month, day: clampedDay, hour: hourValue, isLunar });
      saveSession({
        input: { name, year, month, day: clampedDay, hour: hourValue, isLunar, gender },
        result,
      });
      router.push('/saju/result');
    } catch {
      setError('입력한 날짜를 확인해주세요.');
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <BackButton href="/" label="뒤로" />
        <h1 className="text-sm font-semibold text-primary">생년월일시 입력</h1>
      </header>

      <div className="flex flex-col gap-5 px-4 py-6 flex-1">
        {profiles.length > 0 && (
          <div className="bg-card rounded-2xl px-4 py-3">
            <p className="text-xs text-muted mb-2 font-medium">저장된 프로필 불러오기</p>
            <div className="flex flex-col gap-2">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex justify-between items-center bg-card-hover rounded-xl px-3 py-2"
                >
                  <div className="min-w-0 truncate">
                    <span className="text-sm text-primary font-medium">
                      {profile.name || '이름 없음'}
                    </span>
                    <span className="text-xs text-muted ml-2">
                      {profile.year}.{String(profile.month).padStart(2, '0')}.
                      {String(profile.day).padStart(2, '0')}
                      {' · '}
                      {profile.isLunar ? '음력' : '양력'}
                      {' · '}
                      {profile.ilgan}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadFromProfile(profile)}
                    className="text-xs text-primary hover:opacity-70 transition-opacity ml-3 flex-shrink-0"
                    aria-label={`${profile.name || '이름 없음'} 선택`}
                  >
                    선택
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted mt-3 text-center">또는 새로 입력하기 ↓</p>
          </div>
        )}

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

        {error && <p className="text-sm text-hwa text-center">{error}</p>}
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl bg-primary-gradient text-white font-semibold text-sm"
        >
          사주 분석하기
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `app/saju/page.tsx` 서버 컴포넌트로 재작성**

```tsx
import type { Metadata } from 'next';
import SajuLoader from './SajuLoader';

export const metadata: Metadata = {
  title: '사주 분석',
  description: '생년월일시를 입력하면 AI가 사주팔자를 분석합니다.',
};

export default function SajuInputPage() {
  return <SajuLoader />;
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add app/saju/page.tsx app/saju/SajuLoader.tsx
git commit -m "refactor: convert saju/page to server component, add metadata"
```

---

## Task 3: fortune/page.tsx 서버 컴포넌트 전환

**Files:**
- Create: `app/fortune/FortuneLoader.tsx`
- Modify: `app/fortune/page.tsx`

- [ ] **Step 1: `app/fortune/FortuneLoader.tsx` 생성**

기존 `app/fortune/page.tsx`의 dynamic import + skeleton 로직을 이동한다:

```tsx
'use client';

import dynamic from 'next/dynamic';
import { SkeletonBox } from '@/components/Skeleton';

function FortuneSkeleton() {
  return (
    <div className="flex flex-col flex-1">
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

export default function FortuneLoader() {
  return <FortuneContent />;
}
```

- [ ] **Step 2: `app/fortune/page.tsx` 서버 컴포넌트로 재작성**

```tsx
import type { Metadata } from 'next';
import FortuneLoader from './FortuneLoader';

export const metadata: Metadata = {
  title: '오늘 운세',
  description: '일간별 오늘의 맞춤 운세를 확인하세요.',
};

export default function FortunePage() {
  return <FortuneLoader />;
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add app/fortune/page.tsx app/fortune/FortuneLoader.tsx
git commit -m "refactor: convert fortune/page to server component, add metadata"
```

---

## Task 4: compatibility/page.tsx 서버 컴포넌트 전환

**Files:**
- Create: `app/compatibility/CompatibilityLoader.tsx`
- Modify: `app/compatibility/page.tsx`

- [ ] **Step 1: `app/compatibility/CompatibilityLoader.tsx` 생성**

기존 `app/compatibility/page.tsx`의 전체 내용을 이동한다:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateSaju } from '@/lib/saju-calculator';
import { calcCompatibility, saveCompatSession } from '@/lib/compatibility';
import { loadProfiles } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
import { getPrefillA, clearPrefillA } from '@/lib/compatibility-prefill';
import BackButton from '@/components/BackButton';
import PersonInputFields from '@/components/PersonInputFields';

export default function CompatibilityLoader() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [nameA, setNameA] = useState('');
  const [genderA, setGenderA] = useState<'M' | 'F'>('M');
  const [isLunarA, setIsLunarA] = useState(false);
  const [nameB, setNameB] = useState('');
  const [genderB, setGenderB] = useState<'M' | 'F'>('M');
  const [isLunarB, setIsLunarB] = useState(false);
  const [error, setError] = useState('');

  const defaultYear = new Date().getFullYear() - 30;
  const [yearA, setYearA] = useState(defaultYear);
  const [monthA, setMonthA] = useState(1);
  const [dayA, setDayA] = useState(1);
  const [hourValueA, setHourValueA] = useState<number | null>(null);
  const [yearB, setYearB] = useState(defaultYear);
  const [monthB, setMonthB] = useState(1);
  const [dayB, setDayB] = useState(1);
  const [hourValueB, setHourValueB] = useState<number | null>(null);

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
      setGenderA(prefill.gender);
    }
  }, []);

  function loadProfileA(profile: Profile) {
    setNameA(profile.name);
    setYearA(profile.year);
    setMonthA(profile.month);
    setDayA(profile.day);
    setHourValueA(profile.hour);
    setIsLunarA(profile.isLunar);
    setGenderA(profile.gender);
  }

  function loadProfileB(profile: Profile) {
    setNameB(profile.name);
    setYearB(profile.year);
    setMonthB(profile.month);
    setDayB(profile.day);
    setHourValueB(profile.hour);
    setIsLunarB(profile.isLunar);
    setGenderB(profile.gender);
  }

  const maxDayA = isLunarA ? 30 : new Date(yearA, monthA, 0).getDate();
  const maxDayB = isLunarB ? 30 : new Date(yearB, monthB, 0).getDate();
  const clampedDayA = Math.min(dayA, maxDayA);
  const clampedDayB = Math.min(dayB, maxDayB);

  function handleSubmit() {
    setError('');
    try {
      const resultA = calculateSaju({
        year: yearA,
        month: monthA,
        day: clampedDayA,
        hour: hourValueA,
        isLunar: isLunarA,
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
        personA: { name: nameA, gender: genderA, result: resultA },
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
        <BackButton href="/" label="뒤로" />
        <h1 className="text-sm font-semibold text-primary">궁합 보기</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <PersonInputFields
          label="💑 나의 정보"
          profileChips={
            profiles.length > 0 ? (
              <div>
                <p className="text-xs text-muted mb-1.5">저장된 프로필 불러오기</p>
                <div className="flex flex-wrap gap-2">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => loadProfileA(profile)}
                      className="bg-card-hover rounded-full px-3 py-1.5 text-xs text-primary"
                    >
                      {profile.name || '이름 없음'} · {profile.ilgan}
                    </button>
                  ))}
                </div>
              </div>
            ) : undefined
          }
          name={nameA}
          onNameChange={setNameA}
          gender={genderA}
          onGenderChange={setGenderA}
          isLunar={isLunarA}
          onIsLunarChange={setIsLunarA}
          year={yearA}
          month={monthA}
          day={clampedDayA}
          maxDay={maxDayA}
          onYearChange={setYearA}
          onMonthChange={setMonthA}
          onDayChange={setDayA}
          hourValue={hourValueA}
          onHourChange={setHourValueA}
          showOptionalHints
          namePlaceholder="이름을 입력하세요"
        />

        <div className="flex items-center justify-center py-1">
          <span className="text-muted text-lg">♡</span>
        </div>

        <PersonInputFields
          label="💑 상대방 정보"
          profileChips={
            profiles.length > 0 ? (
              <div>
                <p className="text-xs text-muted mb-1.5">저장된 프로필 불러오기</p>
                <div className="flex flex-wrap gap-2">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => loadProfileB(profile)}
                      className="bg-card-hover rounded-full px-3 py-1.5 text-xs text-primary"
                    >
                      {profile.name || '이름 없음'} · {profile.ilgan}
                    </button>
                  ))}
                </div>
              </div>
            ) : undefined
          }
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

- [ ] **Step 2: `app/compatibility/page.tsx` 서버 컴포넌트로 재작성**

```tsx
import type { Metadata } from 'next';
import CompatibilityLoader from './CompatibilityLoader';

export const metadata: Metadata = {
  title: '궁합 분석',
  description: '두 사람의 사주로 궁합을 분석합니다.',
};

export default function CompatibilityPage() {
  return <CompatibilityLoader />;
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add app/compatibility/page.tsx app/compatibility/CompatibilityLoader.tsx
git commit -m "refactor: convert compatibility/page to server component, add metadata"
```

---

## Task 5: saju/result/page.tsx 서버 컴포넌트 전환

**Files:**
- Create: `app/saju/result/SajuResultLoader.tsx`
- Modify: `app/saju/result/page.tsx`

- [ ] **Step 1: `app/saju/result/SajuResultLoader.tsx` 생성**

기존 `app/saju/result/page.tsx`의 dynamic import + skeleton 로직을 이동한다:

```tsx
'use client';

import dynamic from 'next/dynamic';
import { SkeletonBox } from '@/components/Skeleton';

function SajuResultSkeleton() {
  return (
    <div className="flex flex-col flex-1">
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

export default function SajuResultLoader() {
  return <SajuResultContent />;
}
```

- [ ] **Step 2: `app/saju/result/page.tsx` 서버 컴포넌트로 재작성**

```tsx
import type { Metadata } from 'next';
import SajuResultLoader from './SajuResultLoader';

export const metadata: Metadata = {
  title: '사주 분석 결과',
  description: '나의 사주팔자 분석 결과를 확인하세요.',
};

export default function SajuResultPage() {
  return <SajuResultLoader />;
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add app/saju/result/page.tsx app/saju/result/SajuResultLoader.tsx
git commit -m "refactor: convert saju/result/page to server component, add metadata"
```

---

## Task 6: compatibility/result/page.tsx 서버 컴포넌트 전환

**Files:**
- Create: `app/compatibility/result/CompatibilityResultLoader.tsx`
- Modify: `app/compatibility/result/page.tsx`

- [ ] **Step 1: `app/compatibility/result/CompatibilityResultLoader.tsx` 생성**

```tsx
'use client';

import dynamic from 'next/dynamic';
import { SkeletonBox } from '@/components/Skeleton';

function CompatibilityResultSkeleton() {
  return (
    <div className="flex flex-col flex-1">
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

export default function CompatibilityResultLoader() {
  return <CompatibilityResultContent />;
}
```

- [ ] **Step 2: `app/compatibility/result/page.tsx` 서버 컴포넌트로 재작성**

```tsx
import type { Metadata } from 'next';
import CompatibilityResultLoader from './CompatibilityResultLoader';

export const metadata: Metadata = {
  title: '궁합 분석 결과',
  description: '두 사람의 궁합 분석 결과를 확인하세요.',
};

export default function CompatibilityResultPage() {
  return <CompatibilityResultLoader />;
}
```

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add app/compatibility/result/page.tsx app/compatibility/result/CompatibilityResultLoader.tsx
git commit -m "refactor: convert compatibility/result/page to server component, add metadata"
```

---

## Task 7: fortune/yearly/page.tsx metadata 추가

**Files:**
- Modify: `app/fortune/yearly/page.tsx`

- [ ] **Step 1: metadata export 추가**

`app/fortune/yearly/page.tsx`를 아래로 교체한다 (이미 서버 컴포넌트라 Loader 분리 불필요):

```tsx
import type { Metadata } from 'next';
import { getFortuneYear } from '@/lib/constants';
import YearlyFortuneContent from './YearlyFortuneContent';

const year = getFortuneYear();

export const metadata: Metadata = {
  title: `${year} 신년운세`,
  description: `${year}년 총운·직업·재물·건강·연애 신년운세.`,
};

export default function YearlyFortunePage() {
  return <YearlyFortuneContent />;
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add app/fortune/yearly/page.tsx
git commit -m "feat: add metadata to fortune/yearly page"
```

---

## Task 8: 한국어 폰트 준비

**Files:**
- Create: `public/fonts/NotoSansKR-Bold.woff2`

- [ ] **Step 1: 폰트 디렉토리 생성 및 다운로드**

Google Fonts API에서 Noto Sans KR Bold woff2 URL을 추출해 다운로드한다:

```bash
mkdir -p public/fonts
FONT_CSS=$(curl -s "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&display=swap" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
FONT_URL=$(echo "$FONT_CSS" | grep -o 'https://fonts.gstatic.com[^)]*\.woff2' | head -1)
curl -L "$FONT_URL" -o public/fonts/NotoSansKR-Bold.woff2
```

- [ ] **Step 2: 파일 크기 확인**

```bash
ls -lh public/fonts/NotoSansKR-Bold.woff2
```

Expected: 파일이 존재하고 크기가 1KB 이상임

- [ ] **Step 3: 커밋**

```bash
git add public/fonts/NotoSansKR-Bold.woff2
git commit -m "feat: add Noto Sans KR Bold font for OG image generation"
```

---

## Task 9: 루트 OG 이미지

**Files:**
- Create: `app/opengraph-image.tsx`

- [ ] **Step 1: `app/opengraph-image.tsx` 생성**

```tsx
import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const alt = '사주팔자 — AI 사주팔자 분석';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const fontData = readFileSync(join(process.cwd(), 'public/fonts/NotoSansKR-Bold.woff2'));

  return new ImageResponse(
    (
      <div
        style={{
          background: '#1e1e2e',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        <div style={{ fontSize: 80 }}>🔮</div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'Noto Sans KR',
            letterSpacing: '-1px',
          }}
        >
          사주팔자
        </div>
        <div
          style={{
            fontSize: 26,
            color: '#a0a0b0',
            fontFamily: 'Noto Sans KR',
          }}
        >
          AI 사주팔자 분석
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Noto Sans KR',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}
```

- [ ] **Step 2: 개발 서버에서 OG 이미지 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000/opengraph-image` 접속해 이미지가 렌더링되는지 확인한다.

Expected: 다크 배경에 🔮 이모지 + "사주팔자" + "AI 사주팔자 분석" 텍스트가 한국어로 렌더링됨

- [ ] **Step 3: 커밋**

```bash
git add app/opengraph-image.tsx
git commit -m "feat: add root opengraph image"
```

---

## Task 10: 페이지별 OG 이미지 4개

**Files:**
- Create: `app/saju/opengraph-image.tsx`
- Create: `app/fortune/opengraph-image.tsx`
- Create: `app/fortune/yearly/opengraph-image.tsx`
- Create: `app/compatibility/opengraph-image.tsx`

- [ ] **Step 1: OG 이미지 공통 헬퍼 인라인 — `app/saju/opengraph-image.tsx` 생성**

```tsx
import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const alt = '사주 분석 — 사주팔자';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const fontData = readFileSync(join(process.cwd(), 'public/fonts/NotoSansKR-Bold.woff2'));

  return new ImageResponse(
    (
      <div
        style={{
          background: '#1e1e2e',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        <div style={{ fontSize: 80 }}>🔮</div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'Noto Sans KR',
            letterSpacing: '-1px',
          }}
        >
          사주팔자
        </div>
        <div
          style={{
            fontSize: 26,
            color: '#a0a0b0',
            fontFamily: 'Noto Sans KR',
          }}
        >
          내 사주를 분석해보세요
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Noto Sans KR', data: fontData, style: 'normal', weight: 700 }],
    }
  );
}
```

- [ ] **Step 2: `app/fortune/opengraph-image.tsx` 생성**

```tsx
import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const alt = '오늘 운세 — 사주팔자';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const fontData = readFileSync(join(process.cwd(), 'public/fonts/NotoSansKR-Bold.woff2'));

  return new ImageResponse(
    (
      <div
        style={{
          background: '#1e1e2e',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        <div style={{ fontSize: 80 }}>💫</div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'Noto Sans KR',
            letterSpacing: '-1px',
          }}
        >
          사주팔자
        </div>
        <div
          style={{
            fontSize: 26,
            color: '#a0a0b0',
            fontFamily: 'Noto Sans KR',
          }}
        >
          오늘 운세 확인하기
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Noto Sans KR', data: fontData, style: 'normal', weight: 700 }],
    }
  );
}
```

- [ ] **Step 3: `app/fortune/yearly/opengraph-image.tsx` 생성**

```tsx
import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getFortuneYear } from '@/lib/constants';

export const alt = '신년운세 — 사주팔자';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const fontData = readFileSync(join(process.cwd(), 'public/fonts/NotoSansKR-Bold.woff2'));
  const year = getFortuneYear();

  return new ImageResponse(
    (
      <div
        style={{
          background: '#1e1e2e',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        <div style={{ fontSize: 80 }}>✨</div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'Noto Sans KR',
            letterSpacing: '-1px',
          }}
        >
          사주팔자
        </div>
        <div
          style={{
            fontSize: 26,
            color: '#a0a0b0',
            fontFamily: 'Noto Sans KR',
          }}
        >
          {year} 신년운세
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Noto Sans KR', data: fontData, style: 'normal', weight: 700 }],
    }
  );
}
```

- [ ] **Step 4: `app/compatibility/opengraph-image.tsx` 생성**

```tsx
import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const alt = '궁합 분석 — 사주팔자';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const fontData = readFileSync(join(process.cwd(), 'public/fonts/NotoSansKR-Bold.woff2'));

  return new ImageResponse(
    (
      <div
        style={{
          background: '#1e1e2e',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        <div style={{ fontSize: 80 }}>💑</div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'Noto Sans KR',
            letterSpacing: '-1px',
          }}
        >
          사주팔자
        </div>
        <div
          style={{
            fontSize: 26,
            color: '#a0a0b0',
            fontFamily: 'Noto Sans KR',
          }}
        >
          두 사람의 궁합 분석
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Noto Sans KR', data: fontData, style: 'normal', weight: 700 }],
    }
  );
}
```

- [ ] **Step 5: 각 OG 이미지 라우트 확인**

개발 서버가 실행 중인 상태에서 각 URL을 브라우저로 확인한다:
- `http://localhost:3000/saju/opengraph-image`
- `http://localhost:3000/fortune/opengraph-image`
- `http://localhost:3000/fortune/yearly/opengraph-image`
- `http://localhost:3000/compatibility/opengraph-image`

Expected: 각 페이지별 이모지 + tagline이 다르게 렌더링됨

- [ ] **Step 6: 커밋**

```bash
git add app/saju/opengraph-image.tsx app/fortune/opengraph-image.tsx \
  app/fortune/yearly/opengraph-image.tsx app/compatibility/opengraph-image.tsx
git commit -m "feat: add per-page opengraph images"
```

---

## Task 11: sitemap.ts + robots.ts

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`

- [ ] **Step 1: `app/sitemap.ts` 생성**

```ts
import type { MetadataRoute } from 'next';
import { getFortuneYear } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const year = getFortuneYear();

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${base}/fortune`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${base}/fortune/yearly`,
      lastModified: new Date(`${year}-01-01`),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
    {
      url: `${base}/saju`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/compatibility`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
```

- [ ] **Step 2: `app/robots.ts` 생성**

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: 개발 서버에서 확인**

```bash
# 개발 서버 실행 상태에서
curl http://localhost:3000/sitemap.xml
curl http://localhost:3000/robots.txt
```

Expected:
- `sitemap.xml`: 5개 URL 포함된 XML
- `robots.txt`: `Allow: /` + `Sitemap:` 줄 포함

- [ ] **Step 4: 커밋**

```bash
git add app/sitemap.ts app/robots.ts
git commit -m "feat: add sitemap and robots.txt"
```

---

## Task 12: 최종 검증 및 PR 생성

- [ ] **Step 1: 전체 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 2: 전체 테스트**

```bash
npx jest --no-coverage
```

Expected: 모든 테스트 PASS

- [ ] **Step 3: 프로덕션 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공, 오류 없음

- [ ] **Step 4: PR 생성**

```bash
gh pr create \
  --title "feat: SEO 메타데이터 + 동적 OG 이미지 + sitemap" \
  --body "$(cat <<'EOF'
## Summary
- 모든 페이지에 title/description/openGraph/twitter 메타데이터 추가
- `'use client'` page.tsx 5개를 서버 컴포넌트로 전환 (Loader 분리 패턴)
- 각 라우트에 `opengraph-image.tsx` 배치 — 카카오/X 공유 시 동적 미리보기 생성
- `sitemap.xml` + `robots.txt` 추가

## Test plan
- [ ] `npx tsc --noEmit` 통과 확인
- [ ] `npx jest --no-coverage` 전체 통과 확인
- [ ] `npm run build` 빌드 성공 확인
- [ ] `/opengraph-image`, `/saju/opengraph-image` 등 각 OG 이미지 URL 브라우저 확인
- [ ] `/sitemap.xml`, `/robots.txt` 응답 확인
- [ ] 카카오톡 공유 디버거 확인: https://developers.kakao.com/tool/debugger/sharing

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
