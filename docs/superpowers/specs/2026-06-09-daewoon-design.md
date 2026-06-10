# 대운(大運) 계산 기능 설계 — 2026-06-09

## 개요

사주 결과 페이지에 대운(大運) 섹션을 추가한다. 대운은 10년 단위 운세 흐름으로, 생년월일과 성별을 기반으로 순행/역행 방향 및 시작 나이(대운수)를 계산해 8개의 대운 기둥을 표시한다.

## 결정 사항

| 항목 | 결정 |
|------|------|
| 성별 입력 위치 | 사주 입력 폼 (`/saju`) 에 남/여 토글 추가 |
| 대운 표시 위치 | 사주 결과 페이지 하단 섹션 (스크롤) |
| 대운 레이아웃 | 세로 카드 목록 (현재 대운 하이라이트) |
| 현재 대운 기준 | 만 나이 (올해 - 출생년도 - 생일 미도래 시 1) |
| 대운 개수 | 8개 |

## 데이터 모델

### 신규 타입 (`lib/daewoon.ts`)

```ts
export interface DaewoonPillar {
  gan: string;
  ji: string;
  ganElement: Ohaeng;
  jiElement: Ohaeng;
  startAge: number;   // 이 대운 시작 만 나이
  endAge: number;     // 이 대운 종료 만 나이 (startAge + 9)
}

export interface DaewoonResult {
  daewoonSu: number;          // 첫 대운 시작 만 나이
  direction: '순행' | '역행';
  pillars: DaewoonPillar[];   // 8개
}
```

### 기존 타입 수정

**`lib/session.ts`** — `SajuSessionInput`에 `gender: 'M' | 'F'` 추가

**`lib/profiles.ts`** — `Profile`에 `gender: 'M' | 'F'` 추가 (기존 프로필은 gender 없을 수 있음 → `undefined` 허용)

## 파일 구조

### 신규 파일

**`lib/daewoon.ts`** — 대운 계산 전담

- `calculateDaewoon(input, gender, yearPillar, monthPillar): DaewoonResult`
- 내부 함수:
  - `isForward(yearGan, gender)`: 순/역행 결정
  - `findNextJeolgiDays(y, m, d)`: 순행 시 다음 절기까지 일수
  - `findPrevJeolgiDays(y, m, d)`: 역행 시 이전 절기까지 일수
  - `pillarToIndex(gan, ji)`: 간지 → 60갑자 인덱스
  - `indexToPillar(index)`: 60갑자 인덱스 → DaewoonPillar 기본값
  - `calcMadeAge(birthYear, birthMonth, birthDay)`: 만 나이 계산

**`lib/__tests__/daewoon.test.ts`** — 단위 테스트

**`components/DaewoonChart.tsx`** — 대운 카드 목록 컴포넌트

```tsx
interface DaewoonChartProps {
  result: DaewoonResult;
  currentAge: number;   // 만 나이, result 페이지에서 calcMadeAge()로 계산 후 전달
}
```

### 수정 파일

**`lib/session.ts`**
- `SajuSessionInput.gender: 'M' | 'F'` 추가

**`lib/profiles.ts`**
- `Profile.gender?: 'M' | 'F'` 추가 (선택적 — 기존 저장 프로필 하위 호환)

**`app/saju/page.tsx`**
- 성별 토글(남/여) UI 추가, `gender` state 관리
- `saveSession` 호출 시 `gender` 포함

**`app/page.tsx`**
- `handleProfileSelect` 에서 `gender: profile.gender ?? 'M'` 전달

**`app/saju/result/page.tsx`**
- `calculateDaewoon(session.input, session.input.gender, result.year, result.month)` 호출
- `calcMadeAge(input.year, input.month, input.day)` 로 만 나이 계산
- `<DaewoonChart result={daewoon} currentAge={currentAge}>` 렌더링 (오행 분포 아래)

## 알고리즘

### 순/역행 결정

```
양년간(甲丙戊庚壬) + 남성 → 순행
음년간(乙丁己辛癸) + 여성 → 순행
양년간 + 여성 → 역행
음년간 + 남성 → 역행
```

### 대운수(大運數) 계산

- **순행**: 생일 기준 다음 절(節)까지 일수 ÷ 3, 반올림, 최소 1
- **역행**: 생일 기준 이전 절(節)까지 일수 ÷ 3, 반올림, 최소 1
- 절(節): `JEOLGI_JI`의 12개 (小寒·立春·驚蟄·清明·立夏·芒種·小暑·立秋·白露·寒露·立冬·大雪)
- 탐색 범위: 최대 35일 (절기 간격이 최대 32일)

### 대운 기둥 순서

- 월주(月柱)의 60갑자 인덱스를 기준점으로
- **순행**: index + 1, +2, …, +8
- **역행**: index - 1, -2, …, -8
- 60 mod 순환

### 현재 대운 판별

```
만 나이 = new Date().getFullYear() - 출생년도 - (오늘이 생일 이전이면 1, 아니면 0)
현재 대운 = pillars 중 startAge <= 만 나이 <= endAge 인 항목
```
`calcMadeAge(year, month, day)` 는 `lib/daewoon.ts`에서 export 하여 result 페이지에서도 사용.

## UI 상세

### 성별 토글 (`app/saju/page.tsx`)

- 레이블: "성별"
- 옵션: 남성 / 여성 (기본값: 남성)
- 선택된 쪽: 보라색 그라디언트 배경, 미선택: `bg-card`

### 대운 섹션 (`components/DaewoonChart.tsx`)

- 헤더: "대운 (大運) · 순행/역행 · 대운수 N세"
- 카드 구성 (각 대운):
  - 간지(干支) 한자 (세로 2행)
  - 나이 범위: "N ~ M세"
  - 오행: "천간오행(한글) · 지지오행(한글)"
- **현재 대운**: 보라색 테두리 + 배경 + "현재" 배지
- **미래 대운**: 가까운 것은 밝게, 먼 것은 점차 투명도 낮춤 (`opacity` 단계별)
- 대운 시작 전(만 나이 < 대운수): 모든 카드 미래 스타일

## 미포함 사항

- 소운(小運) 계산
- 세운(歲運) 표시
- 대운별 AI 해석
- 기존 저장 프로필의 성별 소급 입력 UI (gender 없는 프로필은 홈에서 클릭 시 기본값 'M' 적용)
