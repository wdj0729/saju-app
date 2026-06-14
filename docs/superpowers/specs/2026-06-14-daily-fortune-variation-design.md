# Daily Fortune Variation, 일진 표시, 신년운세 연도 자동화

Date: 2026-06-14

## Feature 1: 오늘 운세 날짜별 변화

`fortune-text.ts`의 `오늘` 필드를 `FortunePeriod[]` (3개 배열)로 변경.
`dayOfYear(date) % 3`으로 variant 선택. 이달/올해는 1개 유지.

## Feature 2: 일진 표시

기존 `getDayPillar(y, m, d)` 활용. `FortuneContent.tsx` 오늘 탭에
`오늘의 일진: 甲子日 (木)` 형태로 표시.

## Feature 3: YEARLY_FORTUNE_YEAR 자동화

`constants.ts`에서 하드코딩 상수 제거 → `getFortuneYear()`, `getFortuneGanjee(year)` 함수로 교체.
12월에는 내년 연도 반환. 60갑자 계산: offset = (year - 1984) % 60.
