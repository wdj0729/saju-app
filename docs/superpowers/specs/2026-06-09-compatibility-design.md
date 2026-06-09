# 궁합 페이지 설계 문서

**날짜:** 2026-06-09
**범위:** `/compatibility` 입력 페이지, `/compatibility/result` 결과 페이지, 궁합 계산 엔진, Claude AI 스트리밍 분석

---

## 개요

두 사람의 생년월일시를 각각 입력받아 사주팔자를 계산하고, 오행 상생·상극 관계를 기반으로 궁합 점수(0~100)와 등급, 해석 텍스트, AI 심층 분석을 제공하는 기능.

---

## 페이지 흐름

```
/compatibility  (두 사람 입력)
  → calculateSaju(나) + calculateSaju(상대)
  → calcCompatibility(결과A, 결과B)
  → sessionStorage 'compatibility-session' 저장
  → /compatibility/result

/compatibility/result
  → sessionStorage 로드 (없으면 /compatibility 리다이렉트)
  → 점수/오행 비교/해석 표시
  → AI 분석 요청 → /api/compatibility-analysis 스트리밍
```

---

## 파일 구조

```
lib/
  compatibility.ts
  __tests__/
    compatibility.test.ts

app/
  compatibility/
    page.tsx
    result/
      page.tsx
  api/
    compatibility-analysis/
      route.ts
```

---

## 데이터 모델

### CompatibilitySession (sessionStorage key: `compatibility-session`)

```ts
interface CompatibilitySession {
  personA: { name: string; result: SajuResult }
  personB: { name: string; result: SajuResult }
  compatibility: CompatibilityResult
}
```

### CompatibilityResult

```ts
export interface CompatibilityResult {
  score: number                        // 0~100
  grade: '최상' | '상' | '중' | '하'
  gradeLabel: string                   // '천생연분' | '좋은 인연' | '보통 궁합' | '주의 필요'
  summary: string                      // 등급 기반 고정 해석 텍스트
  ohaengA: Record<Ohaeng, number>
  ohaengB: Record<Ohaeng, number>
  dominant: { a: Ohaeng; b: Ohaeng }  // 각 오행 분포에서 최댓값 원소
}
```

---

## 궁합 점수 계산 (`lib/compatibility.ts`)

### 상생·상극 규칙

```
상생(相生): 木→火, 火→土, 土→金, 金→水, 水→木
상극(相剋): 木→土, 土→水, 水→火, 火→金, 金→木
```

### 알고리즘

두 사람의 오행 분포를 비교해 상생·상극 가중합을 계산한다.

```
rawScore = 0
totalWeight = 0
for X in [목,화,토,금,수]:
  for Y in [목,화,토,금,수]:
    w = ohaengA[X] × ohaengB[Y]
    if 상생(X→Y): rawScore += w
    if 상극(X→Y): rawScore -= w
    totalWeight += w

score = clamp(50 + (rawScore / totalWeight) × 50, 0, 100)
```

기준점 50에서 출발해 상생 비중이 클수록 올라가고 상극이 클수록 내려간다.
`totalWeight`는 전체 오행 쌍의 가중합으로 정규화에 사용한다.

### 등급표

| 점수 범위 | 등급 | 레이블 |
|----------|------|--------|
| 85 ~ 100 | 최상 | 천생연분 |
| 70 ~ 84  | 상   | 좋은 인연 |
| 50 ~ 69  | 중   | 보통 궁합 |
| 0  ~ 49  | 하   | 주의 필요 |

### 고정 해석 텍스트

등급별 2~3문장 요약 텍스트를 `compatibility.ts` 내 상수로 정의.

---

## 페이지 설계

### `/compatibility` — 입력 페이지 (`'use client'`)

`/saju/page.tsx`와 동일한 구조. 두 사람의 입력 폼을 카드로 구분.

```
헤더: ← 뒤로 | 궁합 보기

[나의 정보 카드]
  이름 (선택) · 양력/음력 토글 · 년/월/일/시 드롭다운

[상대방 정보 카드]
  이름 (선택) · 양력/음력 토글 · 년/월/일/시 드롭다운

에러 메시지 (계산 실패 시)

[ 궁합 분석하기 ] (bg-primary-gradient, 하단 고정)
```

- 입력 클래스(`inputClass`, `labelClass`)는 `/saju/page.tsx`와 동일
- 양쪽 `maxDay` 독립 관리
- 제출 시 양쪽 `calculateSaju()` 호출 → `calcCompatibility()` → sessionStorage 저장 → `/compatibility/result` push

### `/compatibility/result` — 결과 페이지 (`'use client'`)

```
헤더: ← 다시 입력 | 궁합 결과

① 점수 카드 (bg-card rounded-2xl)
   이름A ♡ 이름B
   [점수] 그래디언트 텍스트 (큰 숫자)
   등급 · 레이블

② 오행 비교 카드
   木 [나 ██████░] [상대 ███░░░░]
   火 ...
   (왼쪽 = 나, 오른쪽 = 상대, 색상은 OhaengChart와 동일)
   범례: 나(이름A) / 상대(이름B)

③ 해석 텍스트 카드
   고정 텍스트 (CompatibilityResult.summary)

④ AI 심층 분석 카드
   fortune/page.tsx의 renderAiContent() 패턴 동일
   → POST /api/compatibility-analysis

하단: [ 다시 분석하기 ] → /compatibility
```

- sessionStorage 없으면 `/compatibility`로 replace

---

## API 라우트 (`/api/compatibility-analysis/route.ts`)

`/api/ai-analysis/route.ts`와 동일한 구조. 입력과 프롬프트만 다름.

```ts
interface CompatibilityAnalysisRequest {
  personA: { name: string; ilgan: string; ohaeng: Record<string, number> }
  personB: { name: string; ilgan: string; ohaeng: Record<string, number> }
  score: number
  grade: string
}
```

**프롬프트 골자:**
```
당신은 30년 경력의 명리학 전문가입니다.
두 사람의 사주 오행을 바탕으로 궁합을 한국어로 해석해주세요.
[personA 이름] (일간: {ilgan}, 주 오행: {ohaeng})
[personB 이름] (일간: {ilgan}, 주 오행: {ohaeng})
궁합 점수: {score}점 ({grade})

**연애·감정**, **결혼·생활**, **직업·사회** 측면에서 각 2~3문장씩 친근한 말투로 설명해주세요.
```

입력 검증: `personA`, `personB`, `score` 누락 시 400 반환.

---

## 활성화 변경

| 파일 | 변경 |
|------|------|
| `app/page.tsx` | 궁합 카드 `active: false` → `true` |
| `app/saju/result/page.tsx` | "궁합 보기" 버튼 `disabled` 해제, `onClick` → `/compatibility` |

---

## 테스트 (`lib/__tests__/compatibility.test.ts`)

- `calcCompatibility` 반환값 score가 0~100 범위
- 상생 관계가 많을수록 점수 ≥ 50
- 상극 관계가 많을수록 점수 ≤ 50
- 등급 경계값: 85→최상, 70→상, 50→중, 49→하
- `gradeLabel`이 등급에 맞게 반환
