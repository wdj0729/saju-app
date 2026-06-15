# 월별 운세 기능 설계

**날짜:** 2026-06-15  
**상태:** 승인됨

## 개요

신년운세 페이지(`/fortune/yearly`) 하단에 월별 운세 섹션을 추가한다. 사용자가 1~12월 칩을 선택하면 해당 달의 규칙 기반 요약을 즉시 보여주고, 선택적으로 AI 상세 분석을 스트리밍으로 받을 수 있다.

## UI 설계

### 진입점

`YearlyFortuneContent.tsx`의 기존 신년운세 결과 아래에 "월별 운세" 섹션을 추가한다. 별도 페이지나 탭 없이 같은 스크롤 안에서 드릴다운.

### 월 선택 칩

- 가로 스크롤 가능한 `1월 2월 ... 12월` 칩 나열
- 기본 선택: 현재 달 (예: 6월이면 6월 칩 활성)
- 선택된 칩은 `bg-primary-gradient` 강조

### 콘텐츠 영역

선택한 달 바뀔 때:
1. 규칙 기반 요약 카드 즉시 표시 (한 줄 요약 + 대운/재물/건강/인간관계 키워드)
2. "AI 상세 분석" 버튼 표시
3. 버튼 클릭 시 AI 스트리밍 시작 (총운/직업운/재물운/건강운/연애운 섹션)

## 데이터 설계

### 규칙 기반 요약

기존 `FORTUNE_TEXT[ilgan].이달` 을 월별 요약으로 재활용한다. 이 데이터는 일간별로 이미 존재하며 `summary` + `details(대운, 재물, 건강, 인간관계)` 구조다. 각 월마다 동일한 일간 텍스트를 보여주되, 상단에 "N월의 운세" 레이블로 월 컨텍스트를 명시한다.

### AI 분석 캐시

- 캐시 키 형식: `monthly-fortune:{ilgan}:{year}:{month}`  
  예) `monthly-fortune:甲:2026:6`
- 기존 `ai-cache.ts`의 `saveAiCache` / `loadAiCache` 함수를 그대로 사용
- 새 헬퍼 함수 `makeMonthlyFortuneCacheKey(ilgan, year, month)` 추가

### AI 프롬프트

`/api/yearly-fortune` 프롬프트 구조를 그대로 따르되:
- 연간 분석 → 특정 월 분석으로 범위 축소
- 섹션 마커 동일: `[총운] [직업운] [재물운] [건강운] [연애운]`
- `max_tokens: 1000` (연간 1500 대비 축소)

## 파일별 변경 계획

### 신규 파일

| 파일 | 역할 |
|------|------|
| `app/api/monthly-fortune/route.ts` | 월별 운세 AI API 라우트 |
| `components/MonthlyFortune.tsx` | 월 선택 칩 + 규칙 기반 요약 + AI 분석 UI |
| `hooks/useMonthlyFortune.ts` | 월 선택 상태 + AI 스트리밍 + 캐시 로직 |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `lib/ai-cache.ts` | `makeMonthlyFortuneCacheKey` 함수 추가 |
| `app/fortune/yearly/YearlyFortuneContent.tsx` | `<MonthlyFortune>` 컴포넌트 하단에 삽입 |

## 컴포넌트 인터페이스

```tsx
// MonthlyFortune props
interface MonthlyFortuneProps {
  ilgan: string;
  ohaeng: Record<string, number>;
  pillars: { year: PillarData; month: PillarData; day: PillarData; hour: PillarData | null };
  name?: string;
  gender?: 'M' | 'F';
}
```

```ts
// useMonthlyFortune 반환값
interface UseMonthlyFortuneReturn {
  selectedMonth: number;              // 1~12
  setSelectedMonth: (m: number) => void;
  ruleSummary: FortunePeriod;         // FORTUNE_TEXT[ilgan].이달
  sections: Record<YearlySectionKey, string>;
  activeSection: YearlySectionKey | null;
  isStreaming: boolean;
  aiError: string;
  hasCachedResult: boolean;
  requestAi: () => void;
}
```

## 에러 처리

- AI 호출 실패 시 에러 메시지 표시 + 재시도 버튼 (기존 `YearlySections` 패턴 동일)
- `FORTUNE_TEXT`에 ilgan이 없는 경우: 규칙 기반 섹션 미표시, AI 버튼만 노출

## 테스트 범위

- `makeMonthlyFortuneCacheKey` 유닛 테스트
- `useMonthlyFortune` 훅: 월 변경 시 캐시 확인 → 있으면 AI 버튼 "다시 분석"으로 변경
- API 라우트: 필수 필드 누락 시 400 반환
