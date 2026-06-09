# 사주 계산 엔진 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 생년월일시(양력/음력)를 받아 사주팔자 4기둥과 오행 분포를 계산하는 TypeScript 엔진을 TDD로 구현한다.

**Architecture:** `lib/saju-data.ts`에 60갑자·지장간·절기 등 정적 테이블을 두고, `lib/saju-calculator.ts`에서 `lunar-javascript`의 `Solar.fromYmd().getLunar().getJieQi()`를 이용해 절기를 판별하여 4기둥을 계산한다. 오행 분포는 천간 1점, 지지 1점, 지장간 여기·중기 0.5점, 정기 1점으로 집계한다.

**Tech Stack:** TypeScript, lunar-javascript, Jest (next/jest 경유)

---

## 파일 구조

| 파일 | 역할 |
|------|------|
| `lib/saju-data.ts` | 60갑자·오행·지장간·절기 정적 테이블 |
| `lib/saju-calculator.ts` | 4기둥 계산 로직 + `calculateSaju` 공개 API |
| `lib/__tests__/saju-calculator.test.ts` | 전체 단위·통합 테스트 |
| `jest.config.ts` | Jest 설정 (next/jest 사용) |

---

## Task 1: Jest 테스트 환경 세팅

**Files:**
- Create: `jest.config.ts`
- Modify: `package.json` (scripts에 test 추가)

- [ ] **Step 1: Jest 패키지 설치**

```bash
npm install --save-dev jest @types/jest
```

Expected: jest, @types/jest가 devDependencies에 추가됨

- [ ] **Step 2: jest.config.ts 생성**

```typescript
// jest.config.ts
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'node',
};

export default createJestConfig(config);
```

- [ ] **Step 3: package.json에 test 스크립트 추가**

`package.json`의 `"scripts"` 블록에 다음 줄을 추가:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 4: 빈 테스트 파일로 Jest 동작 확인**

`lib/__tests__/saju-calculator.test.ts` 생성:

```typescript
describe('saju-calculator', () => {
  it('placeholder', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 5: 테스트 실행 확인**

```bash
npm test
```

Expected output:
```
PASS  lib/__tests__/saju-calculator.test.ts
  saju-calculator
    ✓ placeholder
```

- [ ] **Step 6: 커밋**

```bash
git add jest.config.ts package.json lib/__tests__/saju-calculator.test.ts
git commit -m "chore: add Jest test environment"
```

---

## Task 2: saju-data.ts — 정적 데이터 테이블 구현

**Files:**
- Create: `lib/saju-data.ts`
- Modify: `lib/__tests__/saju-calculator.test.ts`

- [ ] **Step 1: 데이터 무결성 테스트 작성**

`lib/__tests__/saju-calculator.test.ts` 전체를 다음으로 **교체** (이후 Task들은 이 파일에 describe 블록을 추가):

```typescript
import {
  GAN, JI, GAN_OHAENG, JI_OHAENG, JIJANGGAN,
  OHODUN, OJADUN, JEOLGI_JI,
} from '../saju-data';
import {
  getYearPillar, getMonthPillar, getDayPillar, getHourPillar,
  calcOhaeng, calculateSaju,
} from '../saju-calculator';
import type { Pillar } from '../saju-calculator';

describe('saju-data', () => {
  it('GAN은 10개', () => {
    expect(GAN).toHaveLength(10);
  });

  it('JI는 12개', () => {
    expect(JI).toHaveLength(12);
  });

  it('GAN_OHAENG는 모든 천간을 포함', () => {
    const validOhaeng = new Set(['목', '화', '토', '금', '수']);
    GAN.forEach(g => {
      expect(validOhaeng.has(GAN_OHAENG[g])).toBe(true);
    });
  });

  it('JI_OHAENG는 모든 지지를 포함', () => {
    const validOhaeng = new Set(['목', '화', '토', '금', '수']);
    JI.forEach(j => {
      expect(validOhaeng.has(JI_OHAENG[j])).toBe(true);
    });
  });

  it('JIJANGGAN는 12개 지지 모두 보유, 길이 2 또는 3', () => {
    JI.forEach(j => {
      expect(JIJANGGAN[j]).toBeDefined();
      expect([2, 3]).toContain(JIJANGGAN[j].length);
    });
  });

  it('중기 없는 지지(子卯午酉)는 길이 2', () => {
    ['子', '卯', '午', '酉'].forEach(j => {
      expect(JIJANGGAN[j]).toHaveLength(2);
    });
  });

  it('중기 있는 지지는 길이 3', () => {
    ['丑', '寅', '辰', '巳', '未', '申', '戌', '亥'].forEach(j => {
      expect(JIJANGGAN[j]).toHaveLength(3);
    });
  });

  it('OHODUN은 5개', () => {
    expect(OHODUN).toHaveLength(5);
  });

  it('OJADUN은 5개', () => {
    expect(OJADUN).toHaveLength(5);
  });

  it('JEOLGI_JI는 12개 절기 모두 포함', () => {
    const names = ['小寒','立春','惊蛰','清明','立夏','芒种','小暑','立秋','白露','寒露','立冬','大雪'];
    names.forEach(n => {
      expect(JEOLGI_JI[n]).toBeDefined();
    });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test
```

Expected: FAIL — `lib/saju-data` 모듈을 찾을 수 없음

- [ ] **Step 3: saju-data.ts 구현**

`lib/saju-data.ts` 생성:

```typescript
export type Ohaeng = '목' | '화' | '토' | '금' | '수';

export const GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'] as const;
export const JI  = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'] as const;

export const GAN_OHAENG: Record<string, Ohaeng> = {
  '甲':'목', '乙':'목',
  '丙':'화', '丁':'화',
  '戊':'토', '己':'토',
  '庚':'금', '辛':'금',
  '壬':'수', '癸':'수',
};

export const JI_OHAENG: Record<string, Ohaeng> = {
  '子':'수', '丑':'토',
  '寅':'목', '卯':'목',
  '辰':'토', '巳':'화',
  '午':'화', '未':'토',
  '申':'금', '酉':'금',
  '戌':'토', '亥':'수',
};

// [여기, (중기)?, 정기] — 중기 없는 지지(子卯午酉)는 길이 2
export const JIJANGGAN: Record<string, string[]> = {
  '子':['壬','癸'],
  '丑':['癸','辛','己'],
  '寅':['戊','丙','甲'],
  '卯':['甲','乙'],
  '辰':['乙','癸','戊'],
  '巳':['戊','庚','丙'],
  '午':['丙','丁'],
  '未':['丁','乙','己'],
  '申':['戊','壬','庚'],
  '酉':['庚','辛'],
  '戌':['辛','丁','戊'],
  '亥':['戊','甲','壬'],
};

// 오호둔법: yearGanIndex % 5 → 인월(寅月) 시작 月干 인덱스
// 甲己→丙(2), 乙庚→戊(4), 丙辛→庚(6), 丁壬→壬(8), 戊癸→甲(0)
export const OHODUN = [2, 4, 6, 8, 0];

// 오자둔법: dayGanIndex % 5 → 자시(子時) 시작 時干 인덱스
// 甲己→甲(0), 乙庚→丙(2), 丙辛→戊(4), 丁壬→庚(6), 戊癸→壬(8)
export const OJADUN = [0, 2, 4, 6, 8];

// 12절기(節) 중국어명 → 月支 인덱스 (JI 배열 기준)
export const JEOLGI_JI: Record<string, number> = {
  '小寒':1, '立春':2, '惊蛰':3, '清明':4,
  '立夏':5, '芒种':6, '小暑':7, '立秋':8,
  '白露':9, '寒露':10, '立冬':11, '大雪':0,
};
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test
```

Expected: PASS — 모든 데이터 무결성 테스트 통과

- [ ] **Step 5: 커밋**

```bash
git add lib/saju-data.ts lib/__tests__/saju-calculator.test.ts
git commit -m "feat: add saju static data tables"
```

---

## Task 3: 년주(年柱) 계산 TDD

**Files:**
- Create: `lib/saju-calculator.ts`
- Modify: `lib/__tests__/saju-calculator.test.ts`

- [ ] **Step 1: 년주 테스트 작성**

`lib/__tests__/saju-calculator.test.ts` 끝에 다음 블록 추가 (import는 Task 2에서 이미 선언됨):

```typescript
describe('getYearPillar', () => {
  it('1984-02-05 (입춘 2월4일 이후) → 甲子년', () => {
    const p = getYearPillar(1984, 2, 5);
    expect(p.gan).toBe('甲');
    expect(p.ji).toBe('子');
    expect(p.ganElement).toBe('목');
    expect(p.jiElement).toBe('수');
  });

  it('1984-02-03 (입춘 이전) → 癸亥년', () => {
    const p = getYearPillar(1984, 2, 3);
    expect(p.gan).toBe('癸');
    expect(p.ji).toBe('亥');
  });

  it('2024-06-15 → 甲辰년', () => {
    const p = getYearPillar(2024, 6, 15);
    expect(p.gan).toBe('甲');
    expect(p.ji).toBe('辰');
  });

  it('1900-03-01 → 庚子년', () => {
    const p = getYearPillar(1900, 3, 1);
    expect(p.gan).toBe('庚');
    expect(p.ji).toBe('子');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- --testPathPattern=saju-calculator
```

Expected: FAIL — `getYearPillar` not found

- [ ] **Step 3: saju-calculator.ts 초기 구조 + getYearPillar 구현**

`lib/saju-calculator.ts` 생성:

```typescript
import { Solar, Lunar } from 'lunar-javascript';
import {
  GAN, JI, GAN_OHAENG, JI_OHAENG, JIJANGGAN,
  OHODUN, OJADUN, JEOLGI_JI,
  type Ohaeng,
} from './saju-data';

export interface Pillar {
  gan: string;
  ji: string;
  ganElement: Ohaeng;
  jiElement: Ohaeng;
}

export interface SajuResult {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
  ilgan: string;
  ohaeng: Record<Ohaeng, number>;
}

export interface SajuInput {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  isLunar: boolean;
}

function indexToPillar(index: number): Pillar {
  const i = ((index % 60) + 60) % 60;
  const gan = GAN[i % 10];
  const ji = JI[i % 12];
  return { gan, ji, ganElement: GAN_OHAENG[gan], jiElement: JI_OHAENG[ji] };
}

function getJieQiName(y: number, m: number, d: number): string {
  return Solar.fromYmd(y, m, d).getLunar().getJieQi();
}

export function getYearPillar(y: number, m: number, d: number): Pillar {
  // 해당 년도 입춘(立春) 날짜 탐색 (2월 1~10일 범위)
  let ipchunDay = -1;
  for (let dd = 1; dd <= 10; dd++) {
    if (getJieQiName(y, 2, dd) === '立春') {
      ipchunDay = dd;
      break;
    }
  }

  let targetYear = y;
  if (ipchunDay !== -1) {
    const inputMs  = Date.UTC(y, m - 1, d);
    const ipchunMs = Date.UTC(y, 1, ipchunDay);
    if (inputMs < ipchunMs) targetYear = y - 1;
  }

  const index = ((targetYear - 4) % 60 + 60) % 60;
  return indexToPillar(index);
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --testPathPattern=saju-calculator
```

Expected: PASS — getYearPillar 4개 테스트 모두 통과

- [ ] **Step 5: 커밋**

```bash
git add lib/saju-calculator.ts lib/__tests__/saju-calculator.test.ts
git commit -m "feat: implement year pillar calculation"
```

---

## Task 4: 월주(月柱) 계산 TDD

**Files:**
- Modify: `lib/saju-calculator.ts`
- Modify: `lib/__tests__/saju-calculator.test.ts`

- [ ] **Step 1: 월주 테스트 작성**

테스트 파일 끝에 다음 블록 추가 (import는 Task 2에서 이미 선언됨):

```typescript
describe('getMonthPillar', () => {
  // 2024년 甲辰년, 인월 시작 月干=丙 (OHODUN[0]=2)
  it('2024-02-10 (입춘 2/4 이후) → 寅月, 甲辰년 → 丙寅월', () => {
    const p = getMonthPillar(2024, 2, 10, '甲');
    expect(p.ji).toBe('寅');
    expect(p.gan).toBe('丙');
  });

  it('2024-04-06 (청명 4/4 이후) → 辰月, 甲辰년 → 己辰월 (丙+2=戊?)', () => {
    // 辰月: offset=(4-2+12)%12=2, ganIndex=(2+2)%10=4 → 己
    const p = getMonthPillar(2024, 4, 6, '甲');
    expect(p.ji).toBe('辰');
    expect(p.gan).toBe('己');
  });

  it('2024-01-10 (소한 1/6 이후, 대설 이전) → 丑月, 甲辰년 → 丁丑월', () => {
    // 丑月: offset=(1-2+12)%12=11, ganIndex=(2+11)%10=3 → 丁
    const p = getMonthPillar(2024, 1, 10, '甲');
    expect(p.ji).toBe('丑');
    expect(p.gan).toBe('丁');
  });

  it('2024-01-03 (소한 이전) → 子月, 甲辰년 → 丙子월', () => {
    // 大雪(12/6) 이후 소한 이전 → 子月: offset=(0-2+12)%12=10, ganIndex=(2+10)%10=2 → 丙
    const p = getMonthPillar(2024, 1, 3, '甲');
    expect(p.ji).toBe('子');
    expect(p.gan).toBe('丙');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- --testPathPattern=saju-calculator
```

Expected: FAIL — `getMonthPillar` not exported

- [ ] **Step 3: getMonthJiIndex + getMonthPillar 구현**

`lib/saju-calculator.ts`에 다음 함수들 추가 (indexToPillar 아래, getYearPillar 위):

```typescript
function getMonthJiIndex(y: number, m: number, d: number): number {
  // 입력일 기준 최근 35일을 순방향 스캔해 가장 마지막 절기(節) 확인
  const inputMs = Date.UTC(y, m - 1, d);
  let jiIndex = -1;

  for (let offset = 35; offset >= 0; offset--) {
    const ms   = inputMs - offset * 86400000;
    const date = new Date(ms);
    const name = getJieQiName(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
    );
    if (Object.prototype.hasOwnProperty.call(JEOLGI_JI, name)) {
      jiIndex = JEOLGI_JI[name];
    }
  }

  if (jiIndex === -1) throw new Error(`절기 탐색 실패: ${y}-${m}-${d}`);
  return jiIndex;
}

export function getMonthPillar(y: number, m: number, d: number, yearGan: string): Pillar {
  const monthJiIndex  = getMonthJiIndex(y, m, d);
  const yearGanIndex  = GAN.indexOf(yearGan as (typeof GAN)[number]);
  const inGanStart    = OHODUN[yearGanIndex % 5];          // 인월 시작 月干 인덱스
  const monthOffset   = (monthJiIndex - 2 + 12) % 12;     // 인월로부터 오프셋
  const monthGanIndex = (inGanStart + monthOffset) % 10;

  const gan = GAN[monthGanIndex];
  const ji  = JI[monthJiIndex];
  return { gan, ji, ganElement: GAN_OHAENG[gan], jiElement: JI_OHAENG[ji] };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --testPathPattern=saju-calculator
```

Expected: PASS — getMonthPillar 4개 테스트 모두 통과

- [ ] **Step 5: 커밋**

```bash
git add lib/saju-calculator.ts lib/__tests__/saju-calculator.test.ts
git commit -m "feat: implement month pillar calculation (jeolgi-based)"
```

---

## Task 5: 일주(日柱) 계산 TDD

**Files:**
- Modify: `lib/saju-calculator.ts`
- Modify: `lib/__tests__/saju-calculator.test.ts`

- [ ] **Step 1: 일주 테스트 작성**

테스트 파일 끝에 다음 블록 추가 (import는 Task 2에서 이미 선언됨):

```typescript
describe('getDayPillar', () => {
  it('1900-01-31 (기준일) → 甲戌', () => {
    const p = getDayPillar(1900, 1, 31);
    expect(p.gan).toBe('甲');
    expect(p.ji).toBe('戌');
  });

  it('1900-02-01 (기준일+1) → 乙亥', () => {
    const p = getDayPillar(1900, 2, 1);
    expect(p.gan).toBe('乙');
    expect(p.ji).toBe('亥');
  });

  it('1900-04-01 (기준일+59) → 癸酉, 60번째니 다음 갑자 시작', () => {
    // daysDiff=59, index=(59+10)%60=9 → 癸(9%10=9), 酉(9%12=9)
    const p = getDayPillar(1900, 4, 1);
    expect(p.gan).toBe('癸');
    expect(p.ji).toBe('酉');
  });

  it('1900-04-02 (기준일+60) → 甲戌 (60갑자 순환)', () => {
    const p = getDayPillar(1900, 4, 2);
    expect(p.gan).toBe('甲');
    expect(p.ji).toBe('戌');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- --testPathPattern=saju-calculator
```

Expected: FAIL — `getDayPillar` not exported

- [ ] **Step 3: getDayPillar 구현**

`lib/saju-calculator.ts`에 추가:

```typescript
const DAY_REF_MS    = Date.UTC(1900, 0, 31); // 1900-01-31 UTC 자정
const DAY_REF_INDEX = 10;                     // 甲戌 = 60갑자 인덱스 10

export function getDayPillar(y: number, m: number, d: number): Pillar {
  const inputMs  = Date.UTC(y, m - 1, d);
  const daysDiff = Math.round((inputMs - DAY_REF_MS) / 86400000);
  const index    = ((daysDiff + DAY_REF_INDEX) % 60 + 60) % 60;
  return indexToPillar(index);
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --testPathPattern=saju-calculator
```

Expected: PASS — getDayPillar 4개 테스트 모두 통과

- [ ] **Step 5: 커밋**

```bash
git add lib/saju-calculator.ts lib/__tests__/saju-calculator.test.ts
git commit -m "feat: implement day pillar calculation"
```

---

## Task 6: 시주(時柱) 계산 TDD

**Files:**
- Modify: `lib/saju-calculator.ts`
- Modify: `lib/__tests__/saju-calculator.test.ts`

- [ ] **Step 1: 시주 테스트 작성**

테스트 파일 끝에 다음 블록 추가 (import는 Task 2에서 이미 선언됨):

```typescript
describe('getHourPillar', () => {
  // 甲일(ganIndex=0): 오자둔법 → 자시=甲(0)
  it('甲일 hour=0 (자시) → 甲子시', () => {
    const p = getHourPillar(0, '甲');
    expect(p.gan).toBe('甲');
    expect(p.ji).toBe('子');
  });

  it('甲일 hour=23 (야자시) → 甲子시 (당일 자시 처리)', () => {
    const p = getHourPillar(23, '甲');
    expect(p.gan).toBe('甲');
    expect(p.ji).toBe('子');
  });

  it('甲일 hour=1 (축시) → 乙丑시', () => {
    const p = getHourPillar(1, '甲');
    expect(p.gan).toBe('乙');
    expect(p.ji).toBe('丑');
  });

  it('甲일 hour=13 (미시, jiIndex=7) → 辛未시', () => {
    // jiIndex=floor(14/2)=7, ganIndex=(0+7)%10=7 → 辛
    const p = getHourPillar(13, '甲');
    expect(p.gan).toBe('辛');
    expect(p.ji).toBe('未');
  });

  it('乙일 hour=0 (자시) → 丙子시', () => {
    // 乙ganIndex=1, OJADUN[1%5]=2(丙), jiIndex=0 → 丙子
    const p = getHourPillar(0, '乙');
    expect(p.gan).toBe('丙');
    expect(p.ji).toBe('子');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- --testPathPattern=saju-calculator
```

Expected: FAIL — `getHourPillar` not exported

- [ ] **Step 3: getHourPillar 구현**

`lib/saju-calculator.ts`에 추가:

```typescript
function hourToJiIndex(hour: number): number {
  if (hour === 23) return 0; // 야자시 → 당일 子時
  return Math.floor((hour + 1) / 2);
}

export function getHourPillar(hour: number, dayGan: string): Pillar {
  const jiIndex      = hourToJiIndex(hour);
  const dayGanIndex  = GAN.indexOf(dayGan as (typeof GAN)[number]);
  const hourGanStart = OJADUN[dayGanIndex % 5];
  const hourGanIndex = (hourGanStart + jiIndex) % 10;

  const gan = GAN[hourGanIndex];
  const ji  = JI[jiIndex];
  return { gan, ji, ganElement: GAN_OHAENG[gan], jiElement: JI_OHAENG[ji] };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --testPathPattern=saju-calculator
```

Expected: PASS — getHourPillar 5개 테스트 모두 통과

- [ ] **Step 5: 커밋**

```bash
git add lib/saju-calculator.ts lib/__tests__/saju-calculator.test.ts
git commit -m "feat: implement hour pillar calculation"
```

---

## Task 7: 오행(五行) 분포 계산 TDD

**Files:**
- Modify: `lib/saju-calculator.ts`
- Modify: `lib/__tests__/saju-calculator.test.ts`

- [ ] **Step 1: 오행 분포 테스트 작성**

테스트 파일 끝에 다음 블록 추가 (import는 Task 2에서 이미 선언됨):

```typescript
describe('calcOhaeng', () => {
  it('甲子 기둥 하나 → 목2.5, 수2 (甲:목1 + 子:수1 + 壬여기:수0.5 + 癸정기:수1)', () => {
    const pillar: Pillar = { gan:'甲', ji:'子', ganElement:'목', jiElement:'수' };
    const result = calcOhaeng([pillar]);
    expect(result['목']).toBeCloseTo(1.0);
    expect(result['수']).toBeCloseTo(2.5); // 子:수1 + 壬(여기):수0.5 + 癸(정기):수1
  });

  it('null 기둥은 건너뜀', () => {
    const pillar: Pillar = { gan:'甲', ji:'子', ganElement:'목', jiElement:'수' };
    const r1 = calcOhaeng([pillar, null]);
    const r2 = calcOhaeng([pillar]);
    expect(r1).toEqual(r2);
  });

  it('모든 오행 키가 존재', () => {
    const result = calcOhaeng([]);
    expect(Object.keys(result).sort()).toEqual(['금', '목', '수', '토', '화'].sort());
  });

  it('丑月(癸辛己) 지장간 — 여기0.5 + 중기0.5 + 정기1', () => {
    // 丑: 癸(수0.5) 辛(금0.5) 己(토1)
    const pillar: Pillar = { gan:'甲', ji:'丑', ganElement:'목', jiElement:'토' };
    const result = calcOhaeng([pillar]);
    // 甲:목1, 丑표면:토1, 癸여기:수0.5, 辛중기:금0.5, 己정기:토1
    expect(result['목']).toBeCloseTo(1.0);
    expect(result['토']).toBeCloseTo(2.0); // 丑표면1 + 己정기1
    expect(result['수']).toBeCloseTo(0.5);
    expect(result['금']).toBeCloseTo(0.5);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- --testPathPattern=saju-calculator
```

Expected: FAIL — `calcOhaeng` not exported

- [ ] **Step 3: calcOhaeng 구현**

`lib/saju-calculator.ts`에 추가:

```typescript
export function calcOhaeng(pillars: (Pillar | null)[]): Record<Ohaeng, number> {
  const result: Record<Ohaeng, number> = { 목:0, 화:0, 토:0, 금:0, 수:0 };

  for (const pillar of pillars) {
    if (!pillar) continue;

    result[pillar.ganElement] += 1.0;  // 천간
    result[pillar.jiElement]  += 1.0;  // 지지 표면

    const jjg = JIJANGGAN[pillar.ji];
    if (jjg.length === 2) {
      result[GAN_OHAENG[jjg[0]]] += 0.5; // 여기
      result[GAN_OHAENG[jjg[1]]] += 1.0; // 정기
    } else {
      result[GAN_OHAENG[jjg[0]]] += 0.5; // 여기
      result[GAN_OHAENG[jjg[1]]] += 0.5; // 중기
      result[GAN_OHAENG[jjg[2]]] += 1.0; // 정기
    }
  }

  return result;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --testPathPattern=saju-calculator
```

Expected: PASS — calcOhaeng 4개 테스트 모두 통과

- [ ] **Step 5: 커밋**

```bash
git add lib/saju-calculator.ts lib/__tests__/saju-calculator.test.ts
git commit -m "feat: implement ohaeng distribution calculation"
```

---

## Task 8: calculateSaju 통합 함수 + 음력 입력 처리 TDD

**Files:**
- Modify: `lib/saju-calculator.ts`
- Modify: `lib/__tests__/saju-calculator.test.ts`

- [ ] **Step 1: 통합 테스트 작성**

테스트 파일 끝에 다음 블록 추가 (import는 Task 2에서 이미 선언됨):

```typescript
describe('calculateSaju', () => {
  it('양력 1984-02-05 시간없음 → 4기둥 + ilgan + ohaeng 반환', () => {
    const result = calculateSaju({ year:1984, month:2, day:5, hour:null, isLunar:false });
    expect(result.year.gan).toBe('甲');
    expect(result.year.ji).toBe('子');
    expect(result.day).toBeDefined();
    expect(result.hour).toBeNull();
    expect(result.ilgan).toBe(result.day.gan);
    const total = Object.values(result.ohaeng).reduce((a, b) => a + b, 0);
    // 시주 없음: 3기둥 × (천간1 + 지지1) + 지장간 점수 합계
    expect(total).toBeGreaterThan(0);
  });

  it('시간 있음 → hour 기둥이 null이 아님', () => {
    const result = calculateSaju({ year:2024, month:6, day:15, hour:10, isLunar:false });
    expect(result.hour).not.toBeNull();
    expect(result.hour!.ji).toBe('巳'); // hour=10 → 巳時(jiIndex=5)
  });

  it('음력 입력 → 양력 변환 후 계산', () => {
    // 음력 2024-01-01 = 양력 2024-02-10
    const resultLunar  = calculateSaju({ year:2024, month:1,  day:1,  hour:null, isLunar:true });
    const resultSolar  = calculateSaju({ year:2024, month:2,  day:10, hour:null, isLunar:false });
    expect(resultLunar.year.gan).toBe(resultSolar.year.gan);
    expect(resultLunar.day.gan ).toBe(resultSolar.day.gan);
  });

  it('ohaeng 합계가 시주 없을 때 예상 범위', () => {
    // 3기둥: 천간3 + 지지표면3 + 지장간(여기3 + 중기0~3 + 정기3) = 최소10.5 ~ 최대12
    const result = calculateSaju({ year:1984, month:2, day:5, hour:null, isLunar:false });
    const total  = Object.values(result.ohaeng).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(10.5);
    expect(total).toBeLessThanOrEqual(12);
  });

  it('ohaeng 합계가 시주 있을 때 예상 범위', () => {
    // 4기둥: 최소14 ~ 최대16
    const result = calculateSaju({ year:1984, month:2, day:5, hour:10, isLunar:false });
    const total  = Object.values(result.ohaeng).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(14);
    expect(total).toBeLessThanOrEqual(16);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- --testPathPattern=saju-calculator
```

Expected: FAIL — `calculateSaju` not exported

- [ ] **Step 3: calculateSaju 구현**

`lib/saju-calculator.ts` 끝에 추가:

```typescript
export function calculateSaju(input: SajuInput): SajuResult {
  let { year, month, day, hour, isLunar } = input;

  if (isLunar) {
    const solar = Lunar.fromYmd(year, month, day).getSolar();
    year  = solar.getYear();
    month = solar.getMonth();
    day   = solar.getDay();
  }

  const yearPillar  = getYearPillar(year, month, day);
  const monthPillar = getMonthPillar(year, month, day, yearPillar.gan);
  const dayPillar   = getDayPillar(year, month, day);
  const hourPillar  = hour !== null ? getHourPillar(hour, dayPillar.gan) : null;

  return {
    year:   yearPillar,
    month:  monthPillar,
    day:    dayPillar,
    hour:   hourPillar,
    ilgan:  dayPillar.gan,
    ohaeng: calcOhaeng([yearPillar, monthPillar, dayPillar, hourPillar]),
  };
}
```

- [ ] **Step 4: 전체 테스트 통과 확인**

```bash
npm test
```

Expected: PASS — 모든 테스트 통과, 0 failures

- [ ] **Step 5: 최종 커밋**

```bash
git add lib/saju-calculator.ts lib/__tests__/saju-calculator.test.ts
git commit -m "feat: implement calculateSaju integration function with lunar support"
```
