# 신살(神殺) 분석 카드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사주 결과 페이지의 오행 균형 조언 카드 바로 아래에, 사주에 해당하는 대표 신살(도화살·역마살·화개살·천을귀인·양인살)을 판별해 보여주는 카드를 추가한다.

**Architecture:** `lib/sinsal.ts`에 신살별 정적 해석 데이터와 `getSinsals` 순수 함수를 정의하고, `components/SinsalCard.tsx`가 이를 소비해 리스트형 카드로 렌더링한다. `SajuResultContent.tsx`에서 `OhaengAdvice` 바로 아래에 삽입한다. API 호출 없이 즉시 표시.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, Jest

---

## 변경 파일 목록

| 작업 | 파일 |
|------|------|
| 신규 | `lib/sinsal.ts` |
| 신규 | `lib/__tests__/sinsal.test.ts` |
| 신규 | `components/SinsalCard.tsx` |
| 수정 | `app/saju/result/SajuResultContent.tsx` |

---

## Task 1: feature 브랜치 확인

이미 `feat/sinsal-card` 브랜치에서 작업 중이다 (spec 문서가 이 브랜치에 커밋됨).

- [ ] **Step 1: 현재 브랜치 확인**

```bash
git branch --show-current
```

Expected: `feat/sinsal-card`

---

## Task 2: lib/sinsal.ts — 실패하는 테스트 작성

**Files:**
- Create: `lib/__tests__/sinsal.test.ts`

`getSinsals`는 `SajuResult` (from `lib/saju-calculator.ts`)를 받는다. `SajuResult`의 구조는:

```ts
interface Pillar {
  gan: string;
  ji: string;
  ganElement: Ohaeng;
  jiElement: Ohaeng;
}

interface SajuResult {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
  ilgan: string;
  ohaeng: Record<Ohaeng, number>;
}
```

테스트에서는 `ohaeng` 필드를 사용하지 않으므로 빈 객체로 채워도 무방하다 (타입을 맞추기 위해 `Record<Ohaeng, number>` 형태로 채움).

- [ ] **Step 1: 테스트 파일 생성**

```ts
import { getSinsals } from '../sinsal';
import type { SajuResult, Pillar } from '../saju-calculator';

const ZERO_OHAENG = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

function pillar(gan: string, ji: string): Pillar {
  return { gan, ji, ganElement: '목', jiElement: '목' };
}

function makeSaju(overrides: {
  yearJi: string;
  monthJi: string;
  dayGan: string;
  dayJi: string;
  hourJi?: string;
}): SajuResult {
  return {
    year: pillar('甲', overrides.yearJi),
    month: pillar('甲', overrides.monthJi),
    day: pillar(overrides.dayGan, overrides.dayJi),
    hour: overrides.hourJi ? pillar('甲', overrides.hourJi) : null,
    ilgan: overrides.dayGan,
    ohaeng: ZERO_OHAENG,
  };
}

describe('getSinsals', () => {
  it('일지가 寅午戌국이고 卯가 있으면 도화살', () => {
    // 일지 午 (寅午戌국), 월지 卯 → 도화살
    const saju = makeSaju({ yearJi: '子', monthJi: '卯', dayGan: '甲', dayJi: '午' });
    expect(getSinsals(saju)).toContain('도화살');
  });

  it('일지가 寅午戌국이고 申이 있으면 역마살', () => {
    // 일지 寅 (寅午戌국), 시지 申 → 역마살
    const saju = makeSaju({ yearJi: '子', monthJi: '丑', dayGan: '甲', dayJi: '寅', hourJi: '申' });
    expect(getSinsals(saju)).toContain('역마살');
  });

  it('일지가 申子辰국이고 辰이 있으면 화개살', () => {
    // 일지 子 (申子辰국), 월지 辰 → 화개살
    const saju = makeSaju({ yearJi: '丑', monthJi: '辰', dayGan: '甲', dayJi: '子' });
    expect(getSinsals(saju)).toContain('화개살');
  });

  it('일간 甲이고 丑이 있으면 천을귀인', () => {
    // 甲戊庚 → 丑未
    const saju = makeSaju({ yearJi: '丑', monthJi: '寅', dayGan: '甲', dayJi: '辰' });
    expect(getSinsals(saju)).toContain('천을귀인');
  });

  it('일간 甲이고 卯가 있으면 양인살', () => {
    const saju = makeSaju({ yearJi: '子', monthJi: '丑', dayGan: '甲', dayJi: '卯' });
    expect(getSinsals(saju)).toContain('양인살');
  });

  it('음간(乙)은 양인살 후보에서 제외된다', () => {
    // 乙의 양인 후보 지지가 없으므로, 어떤 지지를 채워도 양인살이 나오면 안 됨
    const saju = makeSaju({ yearJi: '子', monthJi: '丑', dayGan: '乙', dayJi: '辰' });
    expect(getSinsals(saju)).not.toContain('양인살');
  });

  it('아무 신살도 없으면 빈 배열', () => {
    // 일지 寅(寅午戌국) → 도화 卯, 역마 申, 화개 戌 — 모두 branches에 없음
    // 일간 乙(음간, 양인 없음) → 천을귀인 후보 子,申 — branches에 없음
    const saju = makeSaju({ yearJi: '丑', monthJi: '辰', dayGan: '乙', dayJi: '寅' });
    expect(getSinsals(saju)).toEqual([]);
  });

  it('여러 신살이 동시에 성립하면 정해진 순서로 모두 반환', () => {
    // 일지 午(寅午戌국) → 도화 卯, 역마 申, 화개 戌
    // 월지 卯(도화), 시지 申(역마)
    // 일간 甲 → 천을귀인 丑未, 양인 卯
    // 년지 丑 → 천을귀인 성립, 월지 卯 → 양인살도 성립
    const saju = makeSaju({ yearJi: '丑', monthJi: '卯', dayGan: '甲', dayJi: '午', hourJi: '申' });
    expect(getSinsals(saju)).toEqual(['도화살', '역마살', '천을귀인', '양인살']);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
npx jest sinsal --no-coverage
```

Expected: `Cannot find module '../sinsal'`

---

## Task 3: lib/sinsal.ts — 구현

**Files:**
- Create: `lib/sinsal.ts`

- [ ] **Step 1: 파일 생성**

```ts
import type { SajuResult } from './saju-calculator';

export type SinsalType = '도화살' | '역마살' | '화개살' | '천을귀인' | '양인살';

export interface SinsalEntry {
  hanja: string;
  description: string;
}

export const SINSAL_INFO: Record<SinsalType, SinsalEntry> = {
  도화살: {
    hanja: '桃花殺',
    description: '매력과 인기운이 강해요. 사람을 끄는 힘이 있지만 감정 기복에 유의하세요',
  },
  역마살: {
    hanja: '驛馬殺',
    description: '이동과 변화의 기운이 강해요. 여행, 이주, 직업 변동이 잦을 수 있어요',
  },
  화개살: {
    hanja: '華蓋殺',
    description: '예술·종교·학문에 대한 깊은 통찰력이 있어요. 고독을 즐기는 성향도 있어요',
  },
  천을귀인: {
    hanja: '天乙貴人',
    description: '주변에서 도움을 주는 사람이 많아요. 어려운 순간에 귀인의 조력을 받기 쉬워요',
  },
  양인살: {
    hanja: '羊刃殺',
    description: '강한 추진력과 결단력을 가졌어요. 직설적인 표현으로 마찰이 생기지 않게 조심하세요',
  },
};

type SamhapGroup = '寅午戌' | '申子辰' | '巳酉丑' | '亥卯未';

const SAMHAP_GROUP: Record<string, SamhapGroup> = {
  寅: '寅午戌',
  午: '寅午戌',
  戌: '寅午戌',
  申: '申子辰',
  子: '申子辰',
  辰: '申子辰',
  巳: '巳酉丑',
  酉: '巳酉丑',
  丑: '巳酉丑',
  亥: '亥卯未',
  卯: '亥卯未',
  未: '亥卯未',
};

const DOHWA_JI: Record<SamhapGroup, string> = {
  寅午戌: '卯',
  申子辰: '酉',
  巳酉丑: '午',
  亥卯未: '子',
};

const YEOKMA_JI: Record<SamhapGroup, string> = {
  寅午戌: '申',
  申子辰: '寅',
  巳酉丑: '亥',
  亥卯未: '巳',
};

const HWAGAE_JI: Record<SamhapGroup, string> = {
  寅午戌: '戌',
  申子辰: '辰',
  巳酉丑: '丑',
  亥卯未: '未',
};

const CHEONEUL_JI: Record<string, string[]> = {
  甲: ['丑', '未'],
  戊: ['丑', '未'],
  庚: ['丑', '未'],
  乙: ['子', '申'],
  己: ['子', '申'],
  丙: ['亥', '酉'],
  丁: ['亥', '酉'],
  辛: ['午', '寅'],
  壬: ['卯', '巳'],
  癸: ['卯', '巳'],
};

const YANGIN_JI: Record<string, string> = {
  甲: '卯',
  丙: '午',
  戊: '午',
  庚: '酉',
  壬: '子',
};

export function getSinsals(saju: SajuResult): SinsalType[] {
  const branches = [saju.year.ji, saju.month.ji, saju.day.ji, saju.hour?.ji].filter(
    (ji): ji is string => Boolean(ji)
  );

  const result: SinsalType[] = [];

  const group = SAMHAP_GROUP[saju.day.ji];
  if (group) {
    if (branches.includes(DOHWA_JI[group])) result.push('도화살');
    if (branches.includes(YEOKMA_JI[group])) result.push('역마살');
    if (branches.includes(HWAGAE_JI[group])) result.push('화개살');
  }

  const cheoneulCandidates = CHEONEUL_JI[saju.ilgan];
  if (cheoneulCandidates && cheoneulCandidates.some((ji) => branches.includes(ji))) {
    result.push('천을귀인');
  }

  const yanginJi = YANGIN_JI[saju.ilgan];
  if (yanginJi && branches.includes(yanginJi)) {
    result.push('양인살');
  }

  return result;
}
```

- [ ] **Step 2: 테스트 통과 확인**

```bash
npx jest sinsal --no-coverage
```

Expected: `Tests: 8 passed, 8 total`

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add lib/sinsal.ts lib/__tests__/sinsal.test.ts
git commit -m "feat: add sinsal data and getSinsals"
```

---

## Task 4: components/SinsalCard.tsx 생성

**Files:**
- Create: `components/SinsalCard.tsx`

- [ ] **Step 1: 파일 생성**

```tsx
'use client';

import { memo } from 'react';
import type { SajuResult } from '@/lib/saju-calculator';
import { getSinsals, SINSAL_INFO } from '@/lib/sinsal';

interface SinsalCardProps {
  saju: SajuResult;
}

function SinsalCard({ saju }: SinsalCardProps) {
  const sinsals = getSinsals(saju);

  return (
    <div className="bg-card rounded-2xl p-4">
      <p className="text-xs text-muted mb-3">✨ 신살(神殺) 분석</p>
      {sinsals.length === 0 ? (
        <p className="text-sm text-muted">특별한 신살이 없는 균형 잡힌 사주예요</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sinsals.map((sinsal) => {
            const entry = SINSAL_INFO[sinsal];
            return (
              <div key={sinsal}>
                <p className="text-xs font-semibold text-primary mb-0.5">
                  {sinsal}({entry.hanja})
                </p>
                <p className="text-xs text-muted">{entry.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default memo(SinsalCard);
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 3: ESLint**

```bash
npx eslint components/SinsalCard.tsx
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add components/SinsalCard.tsx
git commit -m "feat: add SinsalCard component"
```

---

## Task 5: SajuResultContent.tsx 통합

**Files:**
- Modify: `app/saju/result/SajuResultContent.tsx`

- [ ] **Step 1: import 추가**

파일 상단 import 목록의 `OhaengAdvice` import 바로 아래에 추가:

```ts
import SinsalCard from '@/components/SinsalCard';
```

- [ ] **Step 2: 컴포넌트 삽입**

`<OhaengAdvice ohaeng={result.ohaeng} />` 바로 아래에 삽입:

변경 전 (현재 259번째 줄 부근):
```tsx
        <OhaengAdvice ohaeng={result.ohaeng} />

        <SeunSection
```

변경 후:
```tsx
        <OhaengAdvice ohaeng={result.ohaeng} />

        <SinsalCard saju={result} />

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
git commit -m "feat: integrate SinsalCard into saju result page"
```

---

## Task 6: PR 생성

- [ ] **Step 1: 푸시**

```bash
git push -u origin feat/sinsal-card
```

- [ ] **Step 2: PR 생성**

```bash
gh pr create \
  --title "feat: 신살(神殺) 분석 카드 (사주 결과 페이지)" \
  --body "$(cat <<'EOF'
## Summary
- 사주 결과 페이지 오행 조언 카드 아래에 신살 분석 카드 추가
- 도화살·역마살·화개살·천을귀인·양인살 5개를 판별해 해당하는 것만 표시
- API 호출 없는 정적 데이터 기반 — 로딩 없이 즉시 렌더링
- 신살이 하나도 없으면 "균형 잡힌 사주" 문구 표시 (카드는 항상 표시)

## Test plan
- [ ] 도화살/역마살/화개살이 성립하는 사주 → 카드에 표시 확인
- [ ] 천을귀인/양인살이 성립하는 사주 → 카드에 표시 확인
- [ ] 신살이 없는 사주 → "균형 잡힌 사주" 문구 확인
- [ ] 여러 신살이 동시에 성립하는 사주 → 모두 표시 확인
- [ ] 단위 테스트 8개 통과 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
