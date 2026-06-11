# 신년운세 페이지 설계

## 개요

사용자의 사주 데이터를 기반으로 올해(2026년 병오년) 운세를 AI가 총운 + 분야별로 스트리밍 분석하는 페이지.

## 라우팅

- URL: `/fortune/yearly`
- `app/fortune/yearly/page.tsx` — 서버 컴포넌트 wrapper
- `app/fortune/yearly/YearlyFortuneContent.tsx` — 클라이언트 스트리밍 컴포넌트
- `app/api/yearly-fortune/route.ts` — Anthropic 스트리밍 API

## 진입 경로

1. 홈 CARDS 배열에 "신년운세" 카드 추가 (`href: '/fortune/yearly'`)
2. 사주 결과 페이지(`SajuResultContent.tsx`) 하단에 "2026 신년운세 보기" 버튼 추가

## 데이터 흐름

1. `YearlyFortuneContent` → `loadSession()` 호출
2. 세션 없으면 → `/saju`로 리다이렉트
3. 세션 있으면 → `POST /api/yearly-fortune` (일간, 사주 8자, 이름, 성별 전달)
4. API → Anthropic 스트리밍 응답
5. `AiSections` + `AiContent` 컴포넌트로 섹션별 렌더링

## 스트림 섹션 구조

```
### 2026년 총운
### 직업운
### 재물운
### 건강운
### 연애운
```

각 섹션은 `###` 구분자로 분리, 기존 `AiSections` 파싱 로직 재사용.

## AI 프롬프트

- **입력**: 이름, 일간(천간), 사주 8자(년/월/일/시 천간지지), 성별
- **세운**: 2026년 병오년(丙午年) — 화(火) 기운
- **출력**: 각 섹션 3~4문장, 평문, 해요체
- **금지**: `---` 구분선, `**볼드**`, 번호 목록, 마크다운 장식

## 재사용 컴포넌트

- `AiSections` — 섹션 파싱 및 탭/목록 렌더링
- `AiContent` — 스트리밍 텍스트 표시
- `BackButton` — 뒤로가기
- `Skeleton` — 로딩 상태
- `createAnthropicStream` — 공유 스트리밍 헬퍼
