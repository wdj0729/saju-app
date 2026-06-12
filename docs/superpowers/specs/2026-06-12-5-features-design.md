# 5가지 UX 개선 기능 설계

**날짜:** 2026-06-12  
**브랜치:** fix/hook-consistency → feat/ux-improvements (새 브랜치)

---

## 1. 프로필 → 운세/궁합 빠른 연결 (아코디언)

### 결정: C — 칩 확장형 (아코디언)

**현재:** 홈 프로필 칩 클릭 → 항상 `/saju/result`로 이동  
**변경:** 칩 탭 → 4개 바로가기 행이 펼쳐짐 (아코디언). 다시 탭 → 닫힘.

### 바로가기 4종

| 버튼 | 동작 |
|------|------|
| 🔮 사주 | `calculateSaju` + `saveSession` → `/saju/result` |
| 💫 운세 | `calculateSaju` + `saveSession` → `/fortune` |
| ✨ 신년운세 | `calculateSaju` + `saveSession` → `/fortune/yearly` |
| 💑 궁합 | 해당 프로필을 personA 프리필로 저장 → `/compatibility` |

### 궁합 프리필 메커니즘

`lib/compatibility-prefill.ts` 신규 파일:
- `setPrefillA(profile: Profile): void` — sessionStorage에 저장
- `getPrefillA(): Profile | null` — 읽기
- `clearPrefillA(): void` — 사용 후 즉시 소비

궁합 입력 페이지(`app/compatibility/page.tsx`) 마운트 시 `getPrefillA()`를 읽어 personA 폼에 자동 적용 후 `clearPrefillA()` 호출.

### 수정 파일

- `app/page.tsx` — 프로필 칩 → 아코디언 컴포넌트로 교체
- `lib/compatibility-prefill.ts` — 신규 (프리필 유틸)
- `app/compatibility/page.tsx` — 마운트 시 프리필 적용

---

## 2. 궁합 공유 카드 개선 (두 사람 카드형)

### 결정: A — 두 사람 아바타 카드

**변경:**
- `CompatibilityCardProps`에 `ilganA: string`, `ilganB: string` 추가
- `CompatibilityInner` 레이아웃 교체: 상단 좌/우 카드(아바타 원+이름+일간) + 가운데 💞, 하단 점수·별·요약

**아바타:** 이름 첫 글자(한글이면 그대로, 영문이면 첫 자). 좌측 보라 그라데이션, 우측 핑크 그라데이션.

### 수정 파일

- `components/ShareCard.tsx` — `CompatibilityCardProps` 타입 확장 + `CompatibilityInner` 리디자인
- `app/compatibility/result/CompatibilityResultContent.tsx` — ShareButton에 `ilganA`, `ilganB` 전달

---

## 3. 오늘 날짜 자동 갱신

### 문제

`FortuneContent.tsx` 최상단에 모듈 레벨로 `_today = new Date()` 선언됨. 첫 모듈 로드 시 한 번만 계산되어 자정 이후에도 이전 날짜를 표시.

### 수정

`TODAY_DATE_STR` 계산을 컴포넌트 함수 내부 `useMemo(() => ..., [])` 로 이동. 페이지 마운트마다 재계산.

### 수정 파일

- `app/fortune/FortuneContent.tsx` — 모듈 레벨 변수 → `useMemo` 내부로 이동

---

## 4. 에러 복구 UX (전체 에러 페이지)

### 결정: A — 현재 페이지에 에러 상태 렌더링

**현재:** 세션 없으면 즉시 `router.replace()` 리다이렉트 → 사용자가 상황을 모름  
**변경:** 리다이렉트 대신 에러 UI 렌더링 + "다시 입력하기" 버튼

### 구현

`useSessionOrRedirect` 확장:

```ts
// redirectPath를 null로 넘기면 에러 모드
useSessionOrRedirect<T>(
  loader: () => T | null,
  redirectPath: string | null,
  onLoaded?: (session: T) => void
): T | null | 'not-found'
```

- `redirectPath` 문자열: 기존 동작 (리다이렉트). 하위 호환.
- `redirectPath` null: 리다이렉트 안 함, `'not-found'` 반환.

각 결과 페이지 Content 컴포넌트에서:

```tsx
const session = useSessionOrRedirect(loadSession, null);
if (session === 'not-found') return <SessionExpiredPage redirectPath="/saju" />;
if (!session) return <Skeleton />;
```

`SessionExpiredPage`는 `components/SessionExpiredPage.tsx`로 공용화.

### 적용 페이지

- `app/saju/result/SajuResultContent.tsx`
- `app/fortune/FortuneContent.tsx`
- `app/fortune/yearly/page.tsx` (YearlyContent 포함)
- `app/compatibility/result/CompatibilityResultContent.tsx`

### 수정 파일

- `hooks/useSessionOrRedirect.ts` — null redirectPath 지원 + `'not-found'` 반환
- `components/SessionExpiredPage.tsx` — 신규 공용 에러 UI
- 결과 페이지 Content 컴포넌트 4개 — `redirectPath: null` + `'not-found'` 처리

---

## 5. 분석 재생성 버튼 개선

### 현재

AI 분석 완료 후 `AiContent`에 `className="mt-3 text-xs text-muted underline"` 인라인 텍스트 버튼 → 눈에 잘 안 띔

### 변경

```tsx
<button
  onClick={onRequest}
  className="mt-3 w-full py-2 rounded-xl bg-card-hover text-sm text-muted hover:text-primary transition-colors"
>
  🔄 다시 분석하기
</button>
```

카드 배경색 버튼으로 교체. 전체 너비, 적당한 패딩, hover 효과.

### 수정 파일

- `components/AiContent.tsx` — "다시 요청" 버튼 스타일 개선

---

## 기타

- `.superpowers/` 디렉토리를 `.gitignore`에 추가 (brainstorm 목업 파일 버전 관리 제외)

---

## 구현 순서

1. `AiContent.tsx` 버튼 스타일 (#5) — 가장 독립적, 1줄 변경
2. `FortuneContent.tsx` 날짜 (#3) — 2줄 변경
3. `useSessionOrRedirect` + `SessionExpiredPage` + 결과 페이지 4개 (#4)
4. `ShareCard.tsx` + `CompatibilityResultContent.tsx` 궁합 카드 (#2 카드)
5. `compatibility-prefill.ts` + `page.tsx` + 홈 아코디언 (#2 프로필)
