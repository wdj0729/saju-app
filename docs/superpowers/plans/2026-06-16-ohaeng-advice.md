# 오행 균형 조언 카드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사주 결과 페이지의 오행 차트 아래에 가장 부족한 오행 1개를 채우는 실용 팁 카드(색상·방향·음식·활동)를 즉시 렌더링으로 추가한다.

**Architecture:** `lib/ohaeng-advice.ts`에 5개 오행별 정적 팁 데이터와 `getMostLackingOhaeng` 순수 함수를 정의하고, `components/OhaengAdvice.tsx`가 이를 소비해 리스트 설명형 카드로 렌더링한다. `SajuResultContent.tsx`에서 `OhaengChart` 바로 아래에 삽입한다. API 호출 없이 즉시 표시.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4

---

## 변경 파일 목록

| 작업 | 파일 |
|------|------|
| 신규 | `lib/ohaeng-advice.ts` |
| 신규 | `lib/__tests__/ohaeng-advice.test.ts` |
| 신규 | `components/OhaengAdvice.tsx` |
| 수정 | `app/saju/result/SajuResultContent.tsx` |

---

## Task 1: feature 브랜치 생성

- [ ] **Step 1: 브랜치 생성**

```bash
git checkout -b feat/ohaeng-advice
```

Expected: `Switched to a new branch 'feat/ohaeng-advice'`

---

## Task 2: lib/ohaeng-advice.ts — 실패하는 테스트 작성

**Files:**
- Create: `lib/__tests__/ohaeng-advice.test.ts`

- [ ] **Step 1: 테스트 파일 생성**

```ts
import { getMostLackingOhaeng } from '../ohaeng-advice';

describe('getMostLackingOhaeng', () => {
  it('하나만 0인 경우 해당 오행 반환', () => {
    expect(getMostLackingOhaeng({ 목: 3, 화: 2, 토: 1, 금: 0, 수: 1 })).toBe('금');
  });

  it('여러 개가 0인 경우 목화토금수 순서 중 첫 번째 반환', () => {
    expect(getMostLackingOhaeng({ 목: 2, 화: 0, 토: 1, 금: 0, 수: 0 })).toBe('화');
  });

  it('모두 동일하면 null 반환', () => {
    expect(getMostLackingOhaeng({ 목: 2, 화: 2, 토: 2, 금: 2, 수: 2 })).toBeNull();
  });

  it('모두 0이면 null 반환', () => {
    expect(getMostLackingOhaeng({ 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 })).toBeNull();
  });

  it('일반 분포에서 최솟값 오행 반환', () => {
    expect(getMostLackingOhaeng({ 목: 4, 화: 3, 토: 2, 금: 1, 수: 3 })).toBe('금');
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npx jest ohaeng-advice --no-coverage
```

Expected: `Cannot find module '../ohaeng-advice'`

---

## Task 3: lib/ohaeng-advice.ts — 구현

**Files:**
- Create: `lib/ohaeng-advice.ts`

- [ ] **Step 1: 파일 생성**

```ts
import type { Ohaeng } from './saju-data';

export interface OhaengAdviceTip {
  label: string;
  tip: string;
}

export interface OhaengAdviceEntry {
  hanja: string;
  particle: '이' | '가';
  color: OhaengAdviceTip;
  direction: OhaengAdviceTip;
  food: OhaengAdviceTip;
  activity: OhaengAdviceTip;
}

export const OHAENG_ADVICE: Record<Ohaeng, OhaengAdviceEntry> = {
  목: {
    hanja: '木',
    particle: '이',
    color: { label: '색상', tip: '초록·청록 계열 소품이나 옷을 가까이 두세요' },
    direction: { label: '방향', tip: '동쪽이 유리해요. 동향 자리에 앉아보세요' },
    food: { label: '음식', tip: '신 음식, 부추·쑥·나물류가 목기(木氣)를 보충해요' },
    activity: { label: '활동', tip: '산책, 스트레칭, 원예로 목의 기운을 채워보세요' },
  },
  화: {
    hanja: '火',
    particle: '가',
    color: { label: '색상', tip: '빨강·주황 계열 소품이나 옷을 가까이 두세요' },
    direction: { label: '방향', tip: '남쪽이 유리해요. 남향 자리에 앉아보세요' },
    food: { label: '음식', tip: '쓴 음식, 고추·홍고추·견과류가 화기(火氣)를 보충해요' },
    activity: { label: '활동', tip: '러닝, 댄스, 사교 모임으로 화의 기운을 채워보세요' },
  },
  토: {
    hanja: '土',
    particle: '가',
    color: { label: '색상', tip: '황토·노랑 계열 소품이나 옷을 가까이 두세요' },
    direction: { label: '방향', tip: '중앙이 안정적이에요. 공간의 중심을 활용하세요' },
    food: { label: '음식', tip: '단 음식, 고구마·호박·곡물류가 토기(土氣)를 보충해요' },
    activity: { label: '활동', tip: '요가, 도예, 일기 쓰기로 토의 기운을 채워보세요' },
  },
  금: {
    hanja: '金',
    particle: '이',
    color: { label: '색상', tip: '흰색·은색 소품이나 옷을 가까이 두세요' },
    direction: { label: '방향', tip: '서쪽이 유리해요. 서향 자리에 앉아보세요' },
    food: { label: '음식', tip: '매운 음식, 무·양파·마늘이 금기(金氣)를 보충해요' },
    activity: { label: '활동', tip: '등산, 격투기, 규칙적인 루틴이 금의 기운을 채워줘요' },
  },
  수: {
    hanja: '水',
    particle: '가',
    color: { label: '색상', tip: '검정·짙은 파랑 계열 소품이나 옷을 가까이 두세요' },
    direction: { label: '방향', tip: '북쪽이 유리해요. 북향 자리에 앉아보세요' },
    food: { label: '음식', tip: '짠 음식, 해산물·콩·검은깨가 수기(水氣)를 보충해요' },
    activity: { label: '활동', tip: '수영, 명상, 물가 산책으로 수의 기운을 채워보세요' },
  },
};

const ORDER: readonly Ohaeng[] = ['목', '화', '토', '금', '수'];

export function getMostLackingOhaeng(ohaeng: Record<Ohaeng, number>): Ohaeng | null {
  const min = Math.min(...ORDER.map((k) => ohaeng[k]));
  const max = Math.max(...ORDER.map((k) => ohaeng[k]));
  if (min === max) return null;
  return ORDER.find((k) => ohaeng[k] === min) ?? null;
}
```

- [ ] **Step 2: 테스트 통과 확인**

```bash
npx jest ohaeng-advice --no-coverage
```

Expected: `Tests: 5 passed, 5 total`

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add lib/ohaeng-advice.ts lib/__tests__/ohaeng-advice.test.ts
git commit -m "feat: add ohaeng-advice data and getMostLackingOhaeng"
```

---

## Task 4: components/OhaengAdvice.tsx 생성

**Files:**
- Create: `components/OhaengAdvice.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
'use client';

import { memo } from 'react';
import type { Ohaeng } from '@/lib/saju-data';
import { getMostLackingOhaeng, OHAENG_ADVICE } from '@/lib/ohaeng-advice';

interface OhaengAdviceProps {
  ohaeng: Record<Ohaeng, number>;
}

const TIPS = [
  { key: 'color' as const, emoji: '🎨' },
  { key: 'direction' as const, emoji: '🧭' },
  { key: 'food' as const, emoji: '🥘' },
  { key: 'activity' as const, emoji: '🏃' },
];

function OhaengAdvice({ ohaeng }: OhaengAdviceProps) {
  const lacking = getMostLackingOhaeng(ohaeng);
  if (!lacking) return null;

  const entry = OHAENG_ADVICE[lacking];
  const suffix = ohaeng[lacking] === 0 ? '이 없어요' : '이 부족해요';
  const displaySuffix = entry.particle === '가' ? suffix.replace('이 ', '가 ') : suffix;

  return (
    <div className="bg-card rounded-2xl p-4">
      <p className="text-xs text-muted mb-3">🌿 오행 균형 조언</p>
      <p className="text-sm font-semibold text-primary mb-3">
        {lacking}({entry.hanja}){displaySuffix}. 아래로 보완해 보세요.
      </p>
      <div className="flex flex-col gap-2.5">
        {TIPS.map(({ key, emoji }) => (
          <div key={key} className="flex items-start gap-2.5">
            <span className="text-sm leading-relaxed">{emoji}</span>
            <div>
              <span className="text-xs font-semibold text-primary">{entry[key].label}&nbsp;</span>
              <span className="text-xs text-muted">{entry[key].tip}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(OhaengAdvice);
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: ESLint**

```bash
npx eslint components/OhaengAdvice.tsx
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add components/OhaengAdvice.tsx
git commit -m "feat: add OhaengAdvice component"
```

---

## Task 5: SajuResultContent.tsx 통합

**Files:**
- Modify: `app/saju/result/SajuResultContent.tsx`

- [ ] **Step 1: import 추가**

파일 상단 import 목록(OhaengChart import 근처)에 추가:

```ts
import OhaengAdvice from '@/components/OhaengAdvice';
```

- [ ] **Step 2: 컴포넌트 삽입**

`<OhaengChart ohaeng={result.ohaeng} />` 를 감싼 div 바로 아래에 삽입:

변경 전:
```tsx
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-4">오행 분포</p>
          <OhaengChart ohaeng={result.ohaeng} />
        </div>

        <SeunSection
```

변경 후:
```tsx
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-4">오행 분포</p>
          <OhaengChart ohaeng={result.ohaeng} />
        </div>

        <OhaengAdvice ohaeng={result.ohaeng} />

        <SeunSection
```

- [ ] **Step 3: 전체 검사**

```bash
npx tsc --noEmit && npx jest --no-coverage
```

Expected: 타입 오류 없음, 전체 테스트 PASS

- [ ] **Step 4: 커밋**

```bash
git add app/saju/result/SajuResultContent.tsx
git commit -m "feat: integrate OhaengAdvice into saju result page"
```

---

## Task 6: PR 생성

- [ ] **Step 1: 푸시**

```bash
git push -u origin feat/ohaeng-advice
```

- [ ] **Step 2: PR 생성**

```bash
gh pr create \
  --title "feat: 오행 균형 조언 카드 (사주 결과 페이지)" \
  --body "$(cat <<'EOF'
## Summary
- 사주 결과 페이지 오행 차트 아래에 균형 조언 카드 추가
- 가장 부족한 오행 1개를 판별해 색상·방향·음식·활동 4가지 실용 팁을 즉시 표시
- API 호출 없는 정적 데이터 기반 — 로딩 없이 즉시 렌더링
- 모든 오행이 동일한 경우(균형) 카드 숨김

## Test plan
- [ ] 오행 분포가 불균형한 사주 → 부족한 오행 조언 카드 표시 확인
- [ ] 부족한 오행 count === 0 → "없어요" 표시 확인
- [ ] 부족한 오행 count > 0 but 최솟값 → "부족해요" 표시 확인
- [ ] 모든 오행 동일 사주 → 카드 미표시 확인
- [ ] 단위 테스트 5개 통과 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
