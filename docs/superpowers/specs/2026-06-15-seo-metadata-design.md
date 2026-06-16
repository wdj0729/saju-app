# SEO & 메타데이터 개선 설계

**날짜:** 2026-06-15  
**접근법:** B — 전역 메타데이터 + 페이지별 metadata + 동적 OG 이미지 + sitemap/robots

---

## 목표

현재 `layout.tsx`에 title/description만 있는 상태에서, 검색엔진 노출과 소셜 공유 미리보기를 완전히 갖춘 상태로 개선한다.

---

## 아키텍처

### 1. 환경변수

| 변수 | 설명 | 예시 |
|------|------|------|
| `NEXT_PUBLIC_SITE_URL` | 배포된 도메인 (trailing slash 없음) | `https://saju.vercel.app` |

- `metadataBase`, sitemap URL, robots sitemap URL에 사용
- 없으면 `http://localhost:3000` fallback

### 2. 전역 메타데이터 (`app/layout.tsx` 수정)

```ts
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: '사주팔자',
    template: '%s — 사주팔자',
  },
  description: '생년월일시 입력만으로 AI가 분석하는 사주팔자. 오늘 운세·신년운세·궁합까지.',
  openGraph: {
    type: 'website',
    siteName: '사주팔자',
    locale: 'ko_KR',
    title: { default: '사주팔자', template: '%s — 사주팔자' },
    description: '생년월일시 입력만으로 AI가 분석하는 사주팔자. 오늘 운세·신년운세·궁합까지.',
  },
  twitter: {
    card: 'summary_large_image',
    title: { default: '사주팔자', template: '%s — 사주팔자' },
    description: '생년월일시 입력만으로 AI가 분석하는 사주팔자. 오늘 운세·신년운세·궁합까지.',
  },
  // 기존 manifest, appleWebApp, icons 유지
};
```

### 3. 페이지별 메타데이터

결과 페이지(`/saju/result`, `/compatibility/result`)는 현재 `'use client'` + `dynamic()` 구조라 `metadata` export 불가. 서버 컴포넌트로 전환해 정적 metadata를 추가한다.

#### 파일 변경

입력 페이지(`/saju`, `/fortune`, `/compatibility`)와 결과 페이지(`/saju/result`, `/compatibility/result`) 모두 `'use client'`라 `metadata` export 불가. `/fortune/yearly/page.tsx`만 이미 서버 컴포넌트. 나머지 5개 페이지 모두 서버 컴포넌트 전환 필요.

| 파일 | 작업 |
|------|------|
| `app/saju/page.tsx` | 서버 컴포넌트로 전환, `metadata` export 추가 |
| `app/saju/SajuLoader.tsx` | **신규** — 기존 page 내용 이동 |
| `app/saju/result/page.tsx` | 서버 컴포넌트로 전환, `metadata` export 추가 |
| `app/saju/result/SajuResultLoader.tsx` | **신규** — 기존 dynamic import + skeleton 이동 |
| `app/fortune/page.tsx` | 서버 컴포넌트로 전환, `metadata` export 추가 |
| `app/fortune/FortuneLoader.tsx` | **신규** — 기존 dynamic import + skeleton 이동 (FortuneContent.tsx는 유지) |
| `app/fortune/yearly/page.tsx` | `metadata` export 추가 (이미 서버 컴포넌트) |
| `app/compatibility/page.tsx` | 서버 컴포넌트로 전환, `metadata` export 추가 |
| `app/compatibility/CompatibilityLoader.tsx` | **신규** — 기존 page 내용 이동 |
| `app/compatibility/result/page.tsx` | 서버 컴포넌트로 전환, `metadata` export 추가 |
| `app/compatibility/result/CompatibilityResultLoader.tsx` | **신규** — 기존 dynamic import + skeleton 이동 |

#### 페이지별 메타데이터 값

| 페이지 | title | description |
|--------|-------|-------------|
| `/` | (layout default) | (layout default) |
| `/saju` | `사주 분석` | `생년월일시를 입력하면 AI가 사주팔자를 분석합니다.` |
| `/saju/result` | `사주 분석 결과` | `나의 사주팔자 분석 결과를 확인하세요.` |
| `/fortune` | `오늘 운세` | `일간별 오늘의 맞춤 운세를 확인하세요.` |
| `/fortune/yearly` | `2026 신년운세` | `2026년 총운·직업·재물·건강·연애 신년운세.` |
| `/compatibility` | `궁합 분석` | `두 사람의 사주로 궁합을 분석합니다.` |
| `/compatibility/result` | `궁합 분석 결과` | `두 사람의 궁합 분석 결과를 확인하세요.` |

> 결과 페이지는 sessionStorage 기반이라 서버에서 사용자 데이터 접근 불가. generic description 유지.

### 4. 동적 OG 이미지

Next.js 내장 `next/og`의 `ImageResponse` 사용 (추가 패키지 불필요). 각 라우트의 `opengraph-image.tsx` 파일이 자동으로 `og:image`로 연결된다.

#### 파일 구조

```
app/
  opengraph-image.tsx                    ← 루트 (모든 페이지 fallback)
  saju/opengraph-image.tsx
  fortune/opengraph-image.tsx
  fortune/yearly/opengraph-image.tsx
  compatibility/opengraph-image.tsx
```

#### 이미지 스펙

- **크기:** 1200×630px
- **배경:** `#1e1e2e` (앱 다크 테마와 동일)
- **폰트:** Noto Sans KR — 빌드 시 Google Fonts에서 fetch 후 `ImageResponse`에 주입
- **레이아웃:**

```
┌────────────────────────────────────────────────────┐
│  [배경: #1e1e2e]                                    │
│                                                    │
│                   🔮 (72px)                        │
│              사주팔자 (48px bold, white)            │
│                                                    │
│         [페이지별 tagline] (24px, #a0a0b0)          │
│                                                    │
└────────────────────────────────────────────────────┘
```

#### 페이지별 tagline

| 파일 | 이모지 | tagline |
|------|--------|---------|
| `app/opengraph-image.tsx` | 🔮 | AI 사주팔자 분석 |
| `app/saju/opengraph-image.tsx` | 🔮 | 내 사주를 분석해보세요 |
| `app/fortune/opengraph-image.tsx` | 💫 | 오늘 운세 확인하기 |
| `app/fortune/yearly/opengraph-image.tsx` | ✨ | 2026 신년운세 |
| `app/compatibility/opengraph-image.tsx` | 💑 | 두 사람의 궁합 분석 |

### 5. sitemap + robots

#### `app/sitemap.ts` (신규)

```ts
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return [
    { url: base,                     priority: 1.0, changeFrequency: 'weekly'  },
    { url: `${base}/fortune`,        priority: 0.9, changeFrequency: 'daily'   },
    { url: `${base}/fortune/yearly`, priority: 0.8, changeFrequency: 'yearly'  },
    { url: `${base}/saju`,           priority: 0.8, changeFrequency: 'monthly' },
    { url: `${base}/compatibility`,  priority: 0.7, changeFrequency: 'monthly' },
  ]
  // 결과 페이지 제외 — 사용자별 동적 데이터, 직접 링크 불가
}
```

#### `app/robots.ts` (신규)

```ts
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${base}/sitemap.xml`,
  }
}
```

---

## 전체 파일 변경 목록

| 작업 | 파일 |
|------|------|
| 수정 | `app/layout.tsx` |
| 수정 | `app/saju/page.tsx` (서버 컴포넌트 전환 + metadata) |
| 신규 | `app/saju/SajuLoader.tsx` |
| 수정 | `app/saju/result/page.tsx` (서버 컴포넌트 전환 + metadata) |
| 신규 | `app/saju/result/SajuResultLoader.tsx` |
| 수정 | `app/fortune/page.tsx` (서버 컴포넌트 전환 + metadata) |
| 신규 | `app/fortune/FortuneLoader.tsx` |
| 수정 | `app/fortune/yearly/page.tsx` (metadata 추가) |
| 수정 | `app/compatibility/page.tsx` (서버 컴포넌트 전환 + metadata) |
| 신규 | `app/compatibility/CompatibilityLoader.tsx` |
| 수정 | `app/compatibility/result/page.tsx` (서버 컴포넌트 전환 + metadata) |
| 신규 | `app/compatibility/result/CompatibilityResultLoader.tsx` |
| 신규 | `app/opengraph-image.tsx` |
| 신규 | `app/saju/opengraph-image.tsx` |
| 신규 | `app/fortune/opengraph-image.tsx` |
| 신규 | `app/fortune/yearly/opengraph-image.tsx` |
| 신규 | `app/compatibility/opengraph-image.tsx` |
| 신규 | `app/sitemap.ts` |
| 신규 | `app/robots.ts` |

---

## 의존성

추가 패키지 없음. `next/og`는 Next.js에 내장.

## 검증 방법

- `next build` 성공 확인
- `/sitemap.xml`, `/robots.txt` 라우트 응답 확인
- `/opengraph-image` 라우트로 OG 이미지 렌더링 확인
- 카카오톡 공유 미리보기 테스트 (https://developers.kakao.com/tool/debugger/sharing)
