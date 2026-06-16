# 오행 균형 조언 카드 Design Spec

## Goal

사주 결과 페이지의 오행 차트 아래에 "가장 부족한 오행을 채우는 실용 팁" 카드를 추가한다.
색상·방향·음식·활동 4가지 팁을 리스트 설명형으로 표시하며, API 호출 없이 정적 데이터로 즉시 렌더링한다.

## UX 결정사항

- **레이아웃**: 리스트 설명형 (C형) — 이모지 + 카테고리 라벨 + 한 줄 팁
- **범위**: 가장 부족한 오행 1개만
- **데이터**: 정적 규칙 기반 (AI 호출 없음)
- **배치**: `OhaengChart` 바로 아래, 동일 카드 컨테이너 스타일

## 아키텍처

### 파일 목록

| 작업 | 파일 |
|------|------|
| 신규 | `lib/ohaeng-advice.ts` |
| 신규 | `lib/__tests__/ohaeng-advice.test.ts` |
| 신규 | `components/OhaengAdvice.tsx` |
| 수정 | `app/saju/result/SajuResultContent.tsx` |

### `lib/ohaeng-advice.ts`

```ts
import type { Ohaeng } from './saju-data';

interface OhaengAdviceTip {
  label: string; // "색상", "방향", "음식", "활동"
  tip: string;   // 한 줄 설명
}

interface OhaengAdviceEntry {
  color: OhaengAdviceTip;
  direction: OhaengAdviceTip;
  food: OhaengAdviceTip;
  activity: OhaengAdviceTip;
}

export const OHAENG_ADVICE: Record<Ohaeng, OhaengAdviceEntry>
export function getMostLackingOhaeng(ohaeng: Record<Ohaeng, number>): Ohaeng | null
```

**`getMostLackingOhaeng` 로직:**
1. `Record<Ohaeng, number>`에서 최솟값을 구한다
2. 최솟값을 가진 오행이 여럿이면 `목 → 화 → 토 → 금 → 수` 순서 중 첫 번째를 반환
3. 모든 오행의 count가 동일하면 `null` 반환 (균형 잡힌 사주, 카드 숨김)

**5개 오행 팁 데이터 (`OHAENG_ADVICE`):**

| 오행 | 색상 | 방향 | 음식 | 활동 |
|------|------|------|------|------|
| 목(木) | 초록·청록 계열 | 동쪽 | 신 음식, 부추·쑥·나물류 | 산책, 스트레칭, 원예 |
| 화(火) | 빨강·주황 계열 | 남쪽 | 쓴 음식, 고추·홍고추·견과류 | 러닝, 댄스, 사교 모임 |
| 토(土) | 황토·노랑 계열 | 중앙 | 단 음식, 고구마·호박·곡물 | 요가, 도예, 일기 쓰기 |
| 금(金) | 흰색·은색 계열 | 서쪽 | 매운 음식, 무·양파·마늘 | 등산, 격투기, 규칙적 루틴 |
| 수(水) | 검정·짙은 파랑 | 북쪽 | 짠 음식, 해산물·콩·검은깨 | 수영, 명상, 물가 산책 |

### `components/OhaengAdvice.tsx`

```tsx
interface OhaengAdviceProps {
  ohaeng: Record<Ohaeng, number>;
}
```

- `getMostLackingOhaeng(ohaeng)`로 부족한 오행 계산
- `null`이면 `null` 반환 (렌더 없음)
- `OHAENG_ADVICE[lacking]`의 4개 팁을 리스트로 렌더링
- 헤더: `🌿 오행 균형 조언`
- 부족 오행 강조: `{ohaeng}(漢字)이 없어요` 또는 `부족해요`
  - count === 0 → "없어요"
  - count > 0 but min → "부족해요"
- 카드 스타일: `bg-card rounded-2xl p-4` (기존 패턴)

### `SajuResultContent.tsx` 수정

`<OhaengChart ohaeng={result.ohaeng} />` 바로 아래에 삽입:

```tsx
import OhaengAdvice from '@/components/OhaengAdvice';
// ...
<OhaengChart ohaeng={result.ohaeng} />
<OhaengAdvice ohaeng={result.ohaeng} />
```

## 테스트

`lib/__tests__/ohaeng-advice.test.ts`에서 `getMostLackingOhaeng` 순수 함수 테스트:

- 하나만 0인 경우 → 그 오행 반환
- 여러 개가 0인 경우 → 목화토금수 순서 중 첫 번째
- 모두 동일한 경우 → null
- 일반 분포 최솟값 → 최솟값 오행 반환

`OhaengAdvice.tsx`는 컴포넌트 테스트 인프라가 없으므로 테스트 생략 (기존 패턴과 동일).

## 비고

- API 호출 없음 — 즉시 렌더링
- `memo()` 적용 (OhaengChart 패턴 동일)
- 오행 한자 표기: 목木, 화火, 토土, 금金, 수水
